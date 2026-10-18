<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\EncyclopediaEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EncyclopediaController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = EncyclopediaEntry::with(['sites', 'sources']);

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

    public function show(string $slug): JsonResponse
    {
        $entry = EncyclopediaEntry::with(['sites', 'sources'])
            ->where('slug', $slug)
            ->orWhere('id', $slug)
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
            'source_ids' => 'nullable|array',
        ]);

        $validated['slug'] = Str::slug($validated['term_en'] ?? $validated['term_ar']) ?: 'ency-' . time();

        $entry = EncyclopediaEntry::create([
            'term_ar' => $validated['term_ar'],
            'term_en' => $validated['term_en'] ?? null,
            'slug' => $validated['slug'],
            'category' => $validated['category'],
            'short_summary' => $validated['short_summary'],
            'full_text' => $validated['full_text'],
        ]);

        if (!empty($validated['related_site_ids'])) {
            $entry->sites()->sync($validated['related_site_ids']);
        }
        if (!empty($validated['source_ids'])) {
            $entry->sources()->sync($validated['source_ids']);
        }

        $this->auditLogAction->execute(
            action: 'encyclopedia.created',
            entityType: 'EncyclopediaEntry',
            entityId: (string) $entry->id,
            performedBy: (string) ($request->user()?->name ?? 'محرر الأرشيف'),
            details: "إضافة مادة جديدة في المعجم الموسوعي: {$entry->term_ar}",
            ipAddress: $request->ip()
        );

        return response()->json(['message' => 'تم حفظ المادة الموسوعية بنجاح', 'entry' => $entry->load(['sites', 'sources'])], 201);
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
            'source_ids' => 'nullable|array',
        ]);

        $entry->update($validated);

        if (isset($validated['related_site_ids'])) {
            $entry->sites()->sync($validated['related_site_ids']);
        }
        if (isset($validated['source_ids'])) {
            $entry->sources()->sync($validated['source_ids']);
        }

        $this->auditLogAction->execute(
            action: 'encyclopedia.updated',
            entityType: 'EncyclopediaEntry',
            entityId: (string) $entry->id,
            performedBy: (string) ($request->user()?->name ?? 'محرر الأرشيف'),
            details: "تعديل المادة الموسوعية: {$entry->term_ar}",
            ipAddress: $request->ip()
        );

        return response()->json(['message' => 'تم تحديث المادة الموسوعية بنجاح', 'entry' => $entry->load(['sites', 'sources'])]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $entry = EncyclopediaEntry::findOrFail($id);
        $term = $entry->term_ar;
        $entry->delete();

        $this->auditLogAction->execute(
            action: 'encyclopedia.deleted',
            entityType: 'EncyclopediaEntry',
            entityId: (string) $id,
            performedBy: (string) ($request->user()?->name ?? 'إدارة الأرشيف'),
            details: "حذف المادة الموسوعية: {$term}",
            ipAddress: $request->ip()
        );

        return response()->json(['message' => 'تم حذف المادة الموسوعية بنجاح']);
    }
}
