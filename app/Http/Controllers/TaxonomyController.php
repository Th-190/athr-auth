<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\Area;
use App\Models\District;
use App\Models\HistoricalPeriod;
use App\Models\Province;
use App\Models\SiteType;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TaxonomyController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction
    ) {}

    /**
     * Return all taxonomy classifications (types, periods, areas, tags).
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'site_types' => SiteType::withCount('sites')->orderBy('sort_order')->get(),
            'historical_periods' => HistoricalPeriod::withCount('sites')->orderBy('sort_order')->get(),
            'provinces' => Province::with(['districts.subDistricts.areas' => fn ($q) => $q->withCount('sites')])->get(),
            'areas' => Area::withCount('sites')->orderBy('sort_order')->get(),
            'tags' => Tag::withCount('sites')->orderBy('sort_order')->get(),
        ]);
    }

    public function siteTypes(): JsonResponse
    {
        return response()->json(SiteType::withCount('sites')->orderBy('sort_order')->get());
    }

    public function historicalPeriods(): JsonResponse
    {
        return response()->json(HistoricalPeriod::withCount('sites')->orderBy('sort_order')->get());
    }

    public function geography(): JsonResponse
    {
        return response()->json(
            Province::with(['districts.subDistricts.areas' => function ($q) {
                $q->withCount('sites')->orderBy('sort_order');
            }])->get()
        );
    }

    // --- Site Types CRUD ---

    public function storeType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'definition' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name_en'] ?? $validated['name_ar']) ?: 'type-' . time();
        $type = SiteType::create($validated);

        return response()->json(['message' => 'تمت إضافة نوع المعلم بنجاح', 'type' => $type], 201);
    }

    public function updateType(Request $request, string $id): JsonResponse
    {
        $type = SiteType::findOrFail($id);
        $validated = $request->validate([
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'definition' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $type->update($validated);
        return response()->json(['message' => 'تم تحديث نوع المعلم بنجاح', 'type' => $type]);
    }

    public function destroyType(Request $request, string $id): JsonResponse
    {
        $type = SiteType::withCount('sites')->findOrFail($id);

        if ($type->sites_count > 0) {
            return response()->json([
                'message' => 'مرفوض: لا يمكن حذف هذا النوع لوجود معالم أثرية مرتبطة به (' . $type->sites_count . '). يمكنك تعطيله بدلاً من حذفه.',
            ], 422);
        }

        $type->delete();
        return response()->json(['message' => 'تم حذف نوع المعلم بنجاح']);
    }

    // --- Historical Periods CRUD ---

    public function storePeriod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'start_year_label' => 'required|string|max:100',
            'end_year_label' => 'required|string|max:100',
            'start_year_numeric' => 'nullable|integer',
            'end_year_numeric' => 'nullable|integer',
            'description' => 'nullable|string',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name_en'] ?? $validated['name_ar']) ?: 'period-' . time();
        $period = HistoricalPeriod::create($validated);

        return response()->json(['message' => 'تمت إضافة الحقبة التاريخية بنجاح', 'period' => $period], 201);
    }

    public function updatePeriod(Request $request, string $id): JsonResponse
    {
        $period = HistoricalPeriod::findOrFail($id);
        $validated = $request->validate([
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'start_year_label' => 'sometimes|string|max:100',
            'end_year_label' => 'sometimes|string|max:100',
            'start_year_numeric' => 'nullable|integer',
            'end_year_numeric' => 'nullable|integer',
            'description' => 'nullable|string',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $period->update($validated);
        return response()->json(['message' => 'تم تحديث الحقبة التاريخية بنجاح', 'period' => $period]);
    }

    public function destroyPeriod(Request $request, string $id): JsonResponse
    {
        $period = HistoricalPeriod::withCount('sites')->findOrFail($id);

        if ($period->sites_count > 0) {
            return response()->json([
                'message' => 'مرفوض: لا يمكن حذف هذه الحقبة لوجود معالم تاريخية تنتمي إليها (' . $period->sites_count . '). يمكنك تعطيلها بدلاً من الحذف.',
            ], 422);
        }

        $period->delete();
        return response()->json(['message' => 'تم حذف الحقبة التاريخية بنجاح']);
    }

    // --- Areas CRUD ---

    public function storeArea(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'sub_district_id' => 'required|exists:sub_districts,id',
            'description' => 'nullable|string',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name_en'] ?? $validated['name_ar']) ?: 'area-' . time();
        $area = Area::create($validated);

        return response()->json(['message' => 'تمت إضافة المنطقة بنجاح', 'area' => $area], 201);
    }

    public function updateArea(Request $request, string $id): JsonResponse
    {
        $area = Area::findOrFail($id);
        $validated = $request->validate([
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'sub_district_id' => 'sometimes|exists:sub_districts,id',
            'description' => 'nullable|string',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $area->update($validated);
        return response()->json(['message' => 'تم تحديث المنطقة بنجاح', 'area' => $area]);
    }

    public function destroyArea(Request $request, string $id): JsonResponse
    {
        $area = Area::withCount('sites')->findOrFail($id);

        if ($area->sites_count > 0) {
            return response()->json([
                'message' => 'مرفوض: لا يمكن حذف هذه المنطقة لوجود معالم تقع ضمنها (' . $area->sites_count . '). يرجى نقل المعالم أولاً أو تعطيل المنطقة.',
            ], 422);
        }

        $area->delete();
        return response()->json(['message' => 'تم حذف المنطقة بنجاح']);
    }

    // --- Tags CRUD ---

    public function storeTag(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name_en'] ?? $validated['name_ar']) ?: 'tag-' . time();
        $tag = Tag::create($validated);

        return response()->json(['message' => 'تمت إضافة الوسم بنجاح', 'tag' => $tag], 201);
    }

    public function updateTag(Request $request, string $id): JsonResponse
    {
        $tag = Tag::findOrFail($id);
        $validated = $request->validate([
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $tag->update($validated);
        return response()->json(['message' => 'تم تحديث الوسم بنجاح', 'tag' => $tag]);
    }

    public function destroyTag(Request $request, string $id): JsonResponse
    {
        $tag = Tag::withCount('sites')->findOrFail($id);

        if ($tag->sites_count > 0) {
            return response()->json([
                'message' => 'مرفوض: لا يمكن حذف هذا الوسم لأنه مستخدم في (' . $tag->sites_count . ') معلم أثري.',
            ], 422);
        }

        $tag->delete();
        return response()->json(['message' => 'تم حذف الوسم بنجاح']);
    }
}
