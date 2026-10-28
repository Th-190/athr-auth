<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\EncyclopediaEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EncyclopediaController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = EncyclopediaEntry::with(['sites', 'sources'])->where('publication_status', 'published');

        if ($search = $request->input('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('term_ar', 'LIKE', "%{$search}%")
                  ->orWhere('term_en', 'LIKE', "%{$search}%")
                  ->orWhere('short_summary', 'LIKE', "%{$search}%");
            });
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        return response()->json($query->paginate(25));
    }

    /** Administrator-only listing that includes private drafts and review states. */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = EncyclopediaEntry::with(['sites:id,name_ar,name_en', 'sources:id,title,author'])
            ->orderByDesc('id');

        if ($search = trim((string) $request->query('q', ''))) {
            $pattern = '%'.$search.'%';
            $query->where(fn ($builder) => $builder
                ->whereRaw('LOWER(term_ar) LIKE LOWER(?)', [$pattern])
                ->orWhereRaw('LOWER(term_en) LIKE LOWER(?)', [$pattern])
                ->orWhereRaw('LOWER(short_summary) LIKE LOWER(?)', [$pattern]));
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        return response()->json($query->paginate(min(max($request->integer('per_page', 100), 1), 100)));
    }

    public function show(string $slug): JsonResponse
    {
        $entry = EncyclopediaEntry::with(['sites', 'sources'])
            ->where('publication_status', 'published')
            ->where(function ($query) use ($slug): void {
                $query->where('slug', $slug)->orWhere('id', $slug);
            })
            ->firstOrFail();

        return response()->json($entry);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'term_ar' => 'required|string|max:255',
            'term_en' => 'nullable|string|max:255',
            'category' => 'required|string|max:100',
            'short_summary' => 'required|string',
            'full_text' => 'required|string',
            'related_site_ids' => 'nullable|array',
            'related_site_ids.*' => 'integer|distinct|exists:sites,id',
            'source_ids' => 'nullable|array',
            'source_ids.*' => 'integer|distinct|exists:sources,id',
        ]);

        $entry = DB::transaction(function () use ($validated, $request): EncyclopediaEntry {
            $entry = EncyclopediaEntry::create([
                'term_ar' => $validated['term_ar'],
                'term_en' => $validated['term_en'] ?? null,
                'slug' => (Str::slug($validated['term_en'] ?? $validated['term_ar']) ?: 'ency').'-'.Str::lower(Str::random(8)),
                'category' => $validated['category'],
                'short_summary' => $validated['short_summary'],
                'full_text' => $validated['full_text'],
                'publication_status' => 'draft',
            ]);

            $entry->sites()->sync($validated['related_site_ids'] ?? []);
            $entry->sources()->sync($validated['source_ids'] ?? []);
            $this->auditLogAction->execute('encyclopedia.created', 'EncyclopediaEntry', (string) $entry->id, (string) ($request->user()?->name ?? 'محرر الأرشيف'), "إضافة مادة جديدة في المعجم الموسوعي: {$entry->term_ar}", $request->ip(), $request->user()?->id);

            return $entry;
        });

        return response()->json(['message' => 'تم حفظ المسودة في قاعدة البيانات.', 'entry' => $entry->fresh(['sites', 'sources'])], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $entry = EncyclopediaEntry::findOrFail($id);

        $validated = $request->validate([
            'term_ar' => 'sometimes|string|max:255',
            'term_en' => 'nullable|string|max:255',
            'category' => 'sometimes|string|max:100',
            'short_summary' => 'sometimes|string',
            'full_text' => 'sometimes|string',
            'related_site_ids' => 'nullable|array',
            'related_site_ids.*' => 'integer|distinct|exists:sites,id',
            'source_ids' => 'nullable|array',
            'source_ids.*' => 'integer|distinct|exists:sources,id',
        ]);

        DB::transaction(function () use ($entry, $validated, $request): void {
            $siteIds = $validated['related_site_ids'] ?? null;
            $sourceIds = $validated['source_ids'] ?? null;
            unset($validated['related_site_ids'], $validated['source_ids']);
            $entry->update($validated);
            if ($siteIds !== null) $entry->sites()->sync($siteIds);
            if ($sourceIds !== null) $entry->sources()->sync($sourceIds);
            $this->auditLogAction->execute('encyclopedia.updated', 'EncyclopediaEntry', (string) $entry->id, (string) ($request->user()?->name ?? 'محرر الأرشيف'), "تعديل المادة الموسوعية: {$entry->term_ar}", $request->ip(), $request->user()?->id);
        });

        return response()->json(['message' => 'تم تحديث المسودة في قاعدة البيانات.', 'entry' => $entry->fresh(['sites', 'sources'])]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $entry = EncyclopediaEntry::findOrFail($id);
        $term = $entry->term_ar;
        DB::transaction(function () use ($entry, $id, $term, $request): void {
            $entry->delete();
            $this->auditLogAction->execute('encyclopedia.deleted', 'EncyclopediaEntry', (string) $id, (string) ($request->user()?->name ?? 'إدارة الأرشيف'), "حذف المادة الموسوعية: {$term}", $request->ip(), $request->user()?->id);
        });

        return response()->json(['message' => 'تم حذف المادة الموسوعية بنجاح']);
    }

    public function publish(Request $request, string $id): JsonResponse
    {
        $entry = EncyclopediaEntry::with(['sources'])->findOrFail($id);
        abort_unless($entry->sources->isNotEmpty(), 422, 'لا يمكن نشر مادة موسوعية دون مصدر موثق.');
        abort_unless(trim($entry->term_ar) !== '' && trim($entry->short_summary) !== '' && trim($entry->full_text) !== '', 422, 'تتطلب المادة اسماً وملخصاً ونصاً قبل النشر.');

        $entry->forceFill(['publication_status' => 'published', 'published_at' => now()])->save();
        $this->auditLogAction->execute(
            action: 'encyclopedia.published',
            entityType: 'EncyclopediaEntry',
            entityId: (string) $entry->id,
            performedBy: (string) ($request->user()?->name ?? 'إدارة الأرشيف'),
            details: "نشر المادة الموسوعية بعد التحقق من الاستشهادات: {$entry->term_ar}",
            ipAddress: $request->ip()
        );

        return response()->json(['message' => 'تم نشر المادة الموسوعية بعد التحقق من المصدر.', 'entry' => $entry->fresh(['sites', 'sources'])]);
    }
}
