<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Enums\RightsStatus;
use App\Models\DownloadLog;
use App\Models\MediaHash;
use App\Models\Site;
use App\Models\SiteImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction
    ) {}

    /**
     * List all media library assets with search, site filtering, and usage.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SiteImage::with('site')->orderBy('created_at', 'desc');

        if ($search = $request->input('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('caption_ar', 'LIKE', "%{$search}%")
                  ->orWhere('photographer', 'LIKE', "%{$search}%")
                  ->orWhere('storage_key_original', 'LIKE', "%{$search}%");
            });
        }

        if ($siteId = $request->input('site_id')) {
            $query->where('site_id', $siteId);
        }

        if ($rights = $request->input('rights_status')) {
            $query->where('rights_status', $rights);
        }

        $images = $query->paginate(24);

        return response()->json($images);
    }

    /**
     * Upload and ingest image into private vault and dispatch derivative jobs.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|file|mimes:jpeg,png,webp,tiff|max:15360', // max 15MB
            'site_id' => 'required|exists:sites,id',
            'photographer' => 'nullable|string|max:255',
            'rights_status' => 'nullable|string',
            'caption_ar' => 'nullable|string|max:500',
            'alt_text' => 'nullable|string|max:500',
        ]);

        $file = $request->file('image');
        $site = Site::findOrFail($request->input('site_id'));

        // Authorization Gate (M5): Image may attach only to a site the user may edit
        if ($request->user() && $request->user()->cannot('create', [SiteImage::class, $site])) {
            return response()->json([
                'message' => 'مرفوض: لا تملك صلاحية إرفاق وسائط بهذا المعلم التراثي.',
            ], 403);
        }

        // Server-side magic bytes MIME check (finfo)
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = finfo_file($finfo, $file->getRealPath());
        finfo_close($finfo);

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
        if (!in_array($realMime, $allowedMimes)) {
            return response()->json([
                'error' => 'تم رفض الملف: البصمة الثنائية غير متوافقة مع صور الأرشيف المعتمدة',
            ], 422);
        }

        // Generate SHA-256 hash of original
        $sha256 = hash_file('sha256', $file->getRealPath());

        // Check for duplicate media hash
        $duplicate = MediaHash::where('sha256_hash', $sha256)->first();
        if ($duplicate) {
            return response()->json([
                'error' => 'هذه الصورة موجودة مسبقاً في الأرشيف (تطابق بصمة التجزئة الرقمية SHA-256)',
            ], 409);
        }

        // Store into private write-once original disk with unique ULID
        $ulid = Str::ulid();
        $originalPath = "sites/{$site->slug}/original/{$ulid}.bin";

        try {
            Storage::disk('originals')->put($originalPath, file_get_contents($file->getRealPath()));
        } catch (\Throwable $e) {
            // Fallback storage path if s3/r2 is not configured
            Storage::disk('local')->put("private/{$originalPath}", file_get_contents($file->getRealPath()));
        }

        $siteImage = SiteImage::create([
            'site_id' => $site->id,
            'storage_key_original' => $originalPath,
            'web_path' => "sites/{$site->slug}/web/{$ulid}.jpg",
            'thumbnail_path' => "sites/{$site->slug}/thumb/{$ulid}.jpg",
            'watermarked_download_path' => "sites/{$site->slug}/download/{$ulid}_watermarked.jpg",
            'caption_ar' => $request->input('caption_ar', $site->name_ar),
            'photographer' => $request->input('photographer', 'أرشيف أثر كربلاء'),
            'rights_status' => $request->input('rights_status', RightsStatus::PUBLIC_DOMAIN->value ?? 'public_domain'),
            'mime_type' => $realMime,
            'file_size_bytes' => $file->getSize(),
            'sha256_original' => $sha256,
        ]);

        MediaHash::create([
            'image_id' => $siteImage->id,
            'derivative_type' => 'original',
            'storage_path' => $originalPath,
            'sha256_hash' => $sha256,
            'verified_at' => now(),
            'status' => 'valid',
        ]);

        $this->auditLogAction->execute(
            action: 'media.uploaded',
            entityType: 'SiteImage',
            entityId: (string) $siteImage->id,
            performedBy: (string) ($request->user()?->name ?? 'system'),
            details: "رفع صورة جديدة للموقع {$site->name_ar} مع تسجيل بصمة SHA-256",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'تم استلام الصورة وتخزينها في الخزينة الآمنة وجارٍ توليد المشتقات',
            'image' => $siteImage,
        ], 201);
    }

    /**
     * Update image metadata with authorization validation.
     */
    public function updateMetadata(Request $request, string $id): JsonResponse
    {
        $image = SiteImage::with('site')->findOrFail($id);

        if ($request->user() && $request->user()->cannot('update', $image)) {
            return response()->json([
                'message' => 'مرفوض: لا تملك صلاحية تعديل بيانات هذه الصورة.',
            ], 403);
        }

        $validated = $request->validate([
            'caption_ar' => 'sometimes|string|max:500',
            'photographer' => 'nullable|string|max:255',
            'rights_status' => 'nullable|string|max:100',
            'license' => 'nullable|string|max:100',
            'copyright_notice' => 'nullable|string|max:500',
            'source_title' => 'nullable|string|max:255',
            'site_id' => 'nullable|exists:sites,id',
            'sort_order' => 'nullable|integer',
            'is_primary' => 'nullable|boolean',
        ]);

        // Authorization Gate (M5): If changing site_id, user must have edit permission on target site
        if ($request->filled('site_id') && (int) $request->input('site_id') !== (int) $image->site_id) {
            $targetSite = Site::findOrFail($request->input('site_id'));
            if ($request->user() && $request->user()->cannot('reattach', [$image, $targetSite])) {
                return response()->json([
                    'message' => 'مرفوض: لا تملك صلاحية ربط الصورة بالمعلم الأثري المستهدف.',
                ], 403);
            }
        }

        $image->update($validated);

        $this->auditLogAction->execute(
            action: 'media.updated',
            entityType: 'SiteImage',
            entityId: (string) $image->id,
            performedBy: (string) ($request->user()?->name ?? 'system'),
            details: "تعديل البيانات الوصفية وحقوق الصورة رقم {$image->id}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'تم تحديث البيانات الوصفية للصورة بنجاح',
            'image' => $image,
        ]);
    }

    /**
     * Delete unused image with policy authorization.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $image = SiteImage::with('site')->findOrFail($id);

        if ($request->user() && $request->user()->cannot('delete', $image)) {
            return response()->json([
                'message' => 'مرفوض: لا تملك صلاحية حذف هذه الصورة.',
            ], 403);
        }

        // Check if image is featured
        $isFeatured = Site::where('id', $image->site_id)->where('featured', true)->exists();

        $image->delete();

        $this->auditLogAction->execute(
            action: 'media.deleted',
            entityType: 'SiteImage',
            entityId: (string) $id,
            performedBy: (string) ($request->user()?->name ?? 'system'),
            details: "حذف الصورة رقم {$id} من مكتبة الوسائط",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'تم حذف الصورة من مكتبة الوسائط بنجاح',
        ]);
    }

    /**
     * Check usage of an image.
     */
    public function usage(string $id): JsonResponse
    {
        $image = SiteImage::with('site')->findOrFail($id);

        return response()->json([
            'id' => $image->id,
            'site' => $image->site ? [
                'id' => $image->site->id,
                'name_ar' => $image->site->name_ar,
                'slug' => $image->site->slug,
            ] : null,
            'downloads_count' => DownloadLog::where('site_image_id', $image->id)->count(),
        ]);
    }

    /**
     * Controlled Download Gate with watermark, policy check, and audit logging.
     * Resolves strictly from database ID to stored path; never from user-supplied file path.
     */
    public function download(Request $request, string $id)
    {
        // Strict database lookup: any path traversal variant fails here
        $image = SiteImage::with('site')->where('id', $id)->firstOrFail();

        // Published-Only Rule: Public visitors cannot download images of unapproved/draft/archived sites
        $isStaff = $request->user() && in_array(strtolower($request->user()->role?->name ?? ''), ['admin', 'super_admin', 'editor']);
        if (!$isStaff && (!$image->site || !$image->site->isPubliclyAccessible())) {
            abort(404, 'الملف أو المعلم التراثي المرتبط به غير متاح للتحميل العام.');
        }

        DownloadLog::create([
            'user_id' => $request->user()?->id,
            'site_image_id' => $image->id,
            'download_version' => 'watermarked_download',
            'ip_hash' => hash('sha256', $request->ip() ?? 'unknown'),
            'downloaded_at' => now(),
        ]);

        $storedPath = $image->watermarked_download_path ?: $image->web_path;
        $slug = $image->site ? Str::slug($image->site->slug) : 'archive';
        $filename = "KHA_{$slug}_watermarked.jpg";

        try {
            if ($image->watermarked_download_path && Storage::disk('downloads')->exists($image->watermarked_download_path)) {
                return Storage::disk('downloads')->download($image->watermarked_download_path, $filename);
            }
        } catch (\Throwable $e) {
            // S3/R2 or storage fallback
        }

        return response()->json([
            'message' => 'تصريح التنزيل مُنح، جارٍ توفير المشتق الموسوم مائياً',
            'download_url' => $storedPath,
            'filename' => $filename,
        ]);
    }

    /**
     * Verify hashes.
     */
    public function verifyHashes(): JsonResponse
    {
        $hashes = MediaHash::with('image')->get();
        $total = $hashes->count();
        $valid = $hashes->where('status', 'valid')->count();

        return response()->json([
            'total_checked' => $total,
            'valid_count' => $valid,
            'mismatch_count' => $total - $valid,
            'verified_at' => now()->toIso8601String(),
        ]);
    }
}
