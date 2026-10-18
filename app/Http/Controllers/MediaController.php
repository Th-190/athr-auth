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
use Illuminate\Support\Facades\DB;
use App\Jobs\ProcessImageDerivativeJob;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
                $q->where('caption', 'LIKE', "%{$search}%")
                  ->orWhere('photographer', 'LIKE', "%{$search}%")
                  ->orWhere('original_storage_path', 'LIKE', "%{$search}%");
            });
        }

        if ($siteId = $request->input('site_id')) {
            $query->where('site_id', $siteId);
        }

        if ($rights = $request->input('rights_status')) {
            $query->where('rights_status', $rights);
        }

        $images = $query->paginate(min(max($request->integer('per_page', 24), 1), 100));

        return response()->json($images);
    }

    /**
     * Upload and ingest image into private vault and dispatch derivative jobs.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp|max:15360', // max 15MB
            'site_id' => 'required|exists:sites,id',
            'photographer' => 'nullable|string|max:255',
            'license' => 'nullable|string|max:100',
            'rights_status' => ['sometimes', Rule::enum(RightsStatus::class)],
            'source_url' => 'nullable|url|max:2000',
            'permission_details' => 'nullable|string|max:2000',
            'usage_restrictions' => 'nullable|string|max:2000',
            'caption_ar' => 'nullable|string|max:500',
            'alt_text' => 'nullable|string|max:500',
        ]);

        $file = $request->file('image');
        $site = Site::findOrFail($request->input('site_id'));

        $dimensions = @getimagesize($file->getRealPath());
        if (!$dimensions || $dimensions[0] > 8000 || $dimensions[1] > 8000 || ($dimensions[0] * $dimensions[1]) > 12_000_000) {
            return response()->json(['message' => 'أبعاد الصورة كبيرة أو غير قابلة للقراءة بأمان.'], 422);
        }

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

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($realMime, $allowedMimes)) {
            return response()->json([
                'error' => 'تم رفض الملف: البصمة الثنائية غير متوافقة مع صور الأرشيف المعتمدة',
            ], 422);
        }

        // Generate SHA-256 hash of original
        $sha256 = hash_file('sha256', $file->getRealPath());

        // Check for duplicate media hash
        $duplicate = MediaHash::where('hash_value', $sha256)->where('file_version', 'original')->first();
        if ($duplicate) {
            return response()->json([
                'error' => 'هذه الصورة موجودة مسبقاً في الأرشيف (تطابق بصمة التجزئة الرقمية SHA-256)',
            ], 409);
        }

        // Store into private write-once original disk with unique ULID
        $ulid = Str::ulid();
        $originalPath = "sites/{$site->slug}/original/{$ulid}.bin";

        try {
            if (!Storage::disk('originals')->put($originalPath, file_get_contents($file->getRealPath()))) {
                throw new \RuntimeException('Original image could not be stored.');
            }

            $siteImage = DB::transaction(function () use ($site, $originalPath, $ulid, $request, $realMime, $file, $sha256) {
                $image = SiteImage::create([
                    'site_id' => $site->id,
                    'ulid' => (string) $ulid,
                    'title' => $request->input('caption_ar', $site->name_ar),
                    'caption' => $request->input('caption_ar', $site->name_ar),
                    'alt_text' => $request->input('alt_text'),
                    'original_storage_path' => $originalPath,
                    'photographer' => $request->input('photographer'),
                    'license' => $request->input('license'),
                    'rights_status' => $request->input('rights_status') ?: RightsStatus::UNKNOWN->value,
                    'source_url' => $request->input('source_url'),
                    'permission_details' => $request->input('permission_details'),
                    'visibility' => false,
                    'mime_type' => $realMime,
                    'file_size_bytes' => $file->getSize(),
                    'created_by' => $request->user()?->id,
                ]);

                MediaHash::create([
                    'site_image_id' => $image->id,
                    'file_version' => 'original',
                    'hash_algorithm' => 'sha256',
                    'hash_value' => $sha256,
                    'file_size_bytes' => $file->getSize(),
                    'verified_at' => now(),
                ]);

                return $image;
            });

        } catch (\Throwable $e) {
            // Never claim success or fall back to instance-local storage if R2 fails.
            try { Storage::disk('originals')->delete($originalPath); } catch (\Throwable) {}
            report($e);
            return response()->json(['message' => 'تعذر تخزين الصورة بأمان. يرجى المحاولة لاحقاً.'], 503);
        }

        $this->auditLogAction->execute(
            action: 'media.uploaded',
            entityType: 'SiteImage',
            entityId: (string) $siteImage->id,
            performedBy: (string) ($request->user()?->name ?? 'system'),
            details: "رفع صورة جديدة للموقع {$site->name_ar} مع تسجيل بصمة SHA-256",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'تم حفظ الأصل الخاص؛ تبقى الصورة مخفية حتى مراجعة حقوق استخدامها واعتمادها.',
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
            'rights_status' => ['sometimes', Rule::enum(RightsStatus::class)],
            'source_url' => 'nullable|url|max:2000',
            'permission_details' => 'nullable|string|max:2000',
            'usage_restrictions' => 'nullable|string|max:2000',
            'visibility' => 'sometimes|boolean',
            'license' => 'nullable|string|max:100',
            'copyright_notice' => 'nullable|string|max:500',
            'credit_line' => 'nullable|string|max:500',
            'site_id' => 'sometimes|exists:sites,id',
            'sort_order' => 'nullable|integer',
            'is_primary' => 'nullable|boolean',
            'alt_text' => 'nullable|string|max:500',
        ]);

        if (array_key_exists('caption_ar', $validated)) {
            $validated['caption'] = $validated['caption_ar'];
            $validated['title'] = $validated['caption_ar'];
            unset($validated['caption_ar']);
        }
        if (array_key_exists('copyright_notice', $validated)) {
            $validated['copyright'] = $validated['copyright_notice'];
            unset($validated['copyright_notice']);
        }
        if (array_key_exists('is_primary', $validated)) {
            $validated['featured'] = $validated['is_primary'];
            unset($validated['is_primary']);
        }

        $rightsStatus = $validated['rights_status'] ?? $image->rights_status->value;
        $willBeVisible = array_key_exists('visibility', $validated) ? (bool) $validated['visibility'] : $image->visibility;
        if ($willBeVisible) {
            $sourceUrl = $validated['source_url'] ?? $image->source_url;
            $photographer = $validated['photographer'] ?? $image->photographer;
            $creditLine = $validated['credit_line'] ?? $image->credit_line;
            $license = $validated['license'] ?? $image->license;
            $permissionDetails = $validated['permission_details'] ?? $image->permission_details;
            $rightsReady = filled($sourceUrl)
                && (filled($photographer) || filled($creditLine))
                && match ($rightsStatus) {
                    RightsStatus::PUBLIC_DOMAIN->value => true,
                    RightsStatus::CREATIVE_COMMONS->value => filled($license),
                    RightsStatus::COPYRIGHTED_PERMITTED->value => filled($license) && filled($permissionDetails),
                    default => false,
                };

            if (!$rightsReady) {
                return response()->json([
                    'message' => 'لا يمكن إظهار الصورة قبل توثيق مصدرها وبيانات نسبتها وترخيصها أو إذن استخدامها.',
                ], 422);
            }
            $validated['rights_reviewed_by'] = $request->user()->id;
            $validated['rights_reviewed_at'] = now();
        } else {
            $validated['visibility'] = false;
            $validated['rights_reviewed_by'] = null;
            $validated['rights_reviewed_at'] = null;
        }

        // Authorization Gate (M5): If changing site_id, user must have edit permission on target site
        if ($request->filled('site_id') && (int) $request->input('site_id') !== (int) $image->site_id) {
            $targetSite = Site::findOrFail($request->input('site_id'));
            if ($request->user() && $request->user()->cannot('reattach', [$image, $targetSite])) {
                return response()->json([
                    'message' => 'مرفوض: لا تملك صلاحية ربط الصورة بالمعلم الأثري المستهدف.',
                ], 403);
            }
        }

        $derivativePathsToRevoke = [];
        $downloadPathToRevoke = null;
        if (!$willBeVisible) {
            $derivativePathsToRevoke = array_filter([
                $image->web_storage_path,
                $image->thumb_storage_path,
            ]);
            $downloadPathToRevoke = $image->download_storage_path;
            $validated['web_storage_path'] = null;
            $validated['thumb_storage_path'] = null;
            $validated['download_storage_path'] = null;
        }

        DB::transaction(function () use ($image, $validated, $willBeVisible) {
            if (($validated['featured'] ?? false) && $image->site_id) {
                SiteImage::where('site_id', $image->site_id)->where('id', '!=', $image->id)->update(['featured' => false]);
            }
            $image->update($validated);
            if (!$willBeVisible) {
                $image->hashes()->whereIn('file_version', ['web', 'thumbnail', 'download'])->delete();
            }
        });

        // Remove previously public objects on rights revocation. The database
        // stops publishing their URLs first, so storage errors fail closed in API responses.
        foreach ($derivativePathsToRevoke as $path) {
            try {
                Storage::disk('derivatives')->delete($path);
            } catch (\Throwable $e) {
                report($e);
            }
        }
        if ($downloadPathToRevoke) {
            try {
                Storage::disk('downloads')->delete($downloadPathToRevoke);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        $image->refresh();
        if ($image->visibility && !$image->web_storage_path) {
            try {
                ProcessImageDerivativeJob::dispatch($image->original_storage_path, $image->site->slug, $image->ulid);
            } catch (\Throwable $e) {
                report($e);
                return response()->json(['message' => 'تم حفظ مراجعة الحقوق، لكن تعذر إرسال مهمة معالجة الصورة.'], 503);
            }
        }

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

        $derivativePaths = array_filter([$image->web_storage_path, $image->thumb_storage_path]);
        $downloadPath = $image->download_storage_path;

        DB::transaction(function () use ($image): void {
            $image->hashes()->whereIn('file_version', ['web', 'thumbnail', 'download'])->delete();
            $image->delete();
        });

        $storageFailed = false;
        foreach ($derivativePaths as $path) {
            try {
                $storageFailed = !Storage::disk('derivatives')->delete($path) || $storageFailed;
            } catch (\Throwable $e) {
                report($e);
                $storageFailed = true;
            }
        }
        if ($downloadPath) {
            try {
                $storageFailed = !Storage::disk('downloads')->delete($downloadPath) || $storageFailed;
            } catch (\Throwable $e) {
                report($e);
                $storageFailed = true;
            }
        }

        $this->auditLogAction->execute(
            action: 'media.deleted',
            entityType: 'SiteImage',
            entityId: (string) $id,
            performedBy: (string) ($request->user()?->name ?? 'system'),
            details: "حذف الصورة رقم {$id} من مكتبة الوسائط",
            ipAddress: $request->ip()
        );

        if ($storageFailed) {
            return response()->json([
                'message' => 'حُذفت الصورة من سجل الوسائط، لكن تعذر إزالة أحد الملفات. يجب إتمام إزالة الملف وتطهير CDN قبل اعتباره محذوفاً.',
            ], 503);
        }

        return response()->json([
            'message' => 'تم حذف الصورة من مكتبة الوسائط وإزالة النسخ المشتقة.',
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
        if (!$isStaff && (!$image->site || !$image->site->isPubliclyAccessible() || !$image->hasPublicRightsApproval())) {
            abort(404, 'الملف أو المعلم التراثي المرتبط به غير متاح للتحميل العام.');
        }

        DownloadLog::create([
            'user_id' => $request->user()?->id,
            'site_image_id' => $image->id,
            'download_version' => 'watermarked_download',
            'ip_hash' => hash('sha256', $request->ip() ?? 'unknown'),
            'downloaded_at' => now(),
        ]);

        $storedPath = $image->download_storage_path;
        $slug = $image->site ? Str::slug($image->site->slug) : 'archive';
        $filename = "KHA_{$slug}_watermarked.jpg";

        try {
            if ($storedPath && Storage::disk('downloads')->exists($storedPath)) {
                return Storage::disk('downloads')->download($storedPath, $filename);
            }
        } catch (\Throwable $e) {
            report($e);
        }

        abort(404, 'النسخة الآمنة للتنزيل غير متاحة بعد.');
    }

    /**
     * Verify hashes.
     */
    public function verifyHashes(): JsonResponse
    {
        $hashes = MediaHash::with('siteImage')->get();
        $total = $hashes->count();
        $valid = 0;
        foreach ($hashes as $hash) {
            $image = $hash->siteImage;
            if (!$image) continue;
            [$disk, $path] = match ($hash->file_version) {
                'original' => ['originals', $image->original_storage_path],
                'web' => ['derivatives', $image->web_storage_path],
                'thumbnail' => ['derivatives', $image->thumb_storage_path],
                'download' => ['downloads', $image->download_storage_path],
                default => [null, null],
            };
            try {
                if ($disk && $path && Storage::disk($disk)->exists($path)
                    && hash_equals($hash->hash_value, hash('sha256', Storage::disk($disk)->get($path)))) {
                    $valid++;
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'total_checked' => $total,
            'valid_count' => $valid,
            'mismatch_count' => $total - $valid,
            'verified_at' => now()->toIso8601String(),
        ]);
    }
}
