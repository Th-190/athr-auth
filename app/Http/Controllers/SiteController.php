<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\Site;
use App\Models\SiteRevision;
use App\Models\MuseumProfile;
use App\Models\SiteType;
use App\Services\ArabicSearchNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class SiteController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction
    ) {}

    /**
     * Compact authorized options for admin forms. Avoids loading PostGIS columns
     * and every editorial relation when a form only needs the linked site name.
     */
    public function adminOptions(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 100), 1), 500);

        return response()->json(
            Site::query()
                ->select(['id', 'name_ar', 'name_en', 'slug', 'permanent_id', 'publication_status', 'featured', 'is_demo'])
                ->orderBy('name_ar')
                ->paginate($perPage)
        );
    }

    /**
     * List heritage sites with search, spatial bounding, and taxonomy filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Site::query()
            ->with(['siteType', 'historicalPeriod', 'area.subDistrict.district', 'province', 'names', 'sources', 'images' => fn ($images) => $images->publiclyUsable()])
            ->publishedAndPublic();

        // Text Search with Arabic normalization
        if ($search = trim((string) $request->input('q', ''))) {
            $normalized = ArabicSearchNormalizer::normalize($search);
            $pattern = '%'.$normalized.'%';
            $query->where(function ($q) use ($pattern) {
                $q->whereRaw('LOWER(name_ar) LIKE LOWER(?)', [$pattern])
                  ->orWhereRaw('LOWER(name_en) LIKE LOWER(?)', [$pattern])
                  ->orWhereRaw('LOWER(short_description) LIKE LOWER(?)', [$pattern])
                  ->orWhereRaw('LOWER(slug) LIKE LOWER(?)', [$pattern])
                  ->orWhereHas('names', fn ($nameQ) => $nameQ->whereRaw('LOWER(name) LIKE LOWER(?)', [$pattern]));
            });
        }

        // Filter by Site Type
        if ($typeId = $request->input('site_type_id')) {
            $query->where('site_type_id', $typeId);
        }

        // Filter by Historical Period
        if ($periodId = $request->input('historical_period_id')) {
            $query->where('historical_period_id', $periodId);
        }

        // Filter by Verification Status
        if ($verification = $request->input('verification_status')) {
            $query->where('verification_status', $verification);
        }

        // Filter by Category Chips: [جميع المواقع, مراقد دينية, آثار تاريخية, أماكن تراثية كربلائية]
        if ($category = $request->input('category')) {
            $slugs = match ($category) {
                'religious', 'مراقد دينية' => ['religious-and-shrines', 'churches-and-monasteries'],
                'historical', 'آثار تاريخية' => ['palaces-and-forts', 'archaeological-tells', 'defensive-walls-gates'],
                'heritage', 'أماكن تراثية كربلائية' => ['caravansaries', 'hydraulic-and-springs', 'bazaars-and-commercial', 'vernacular-houses', 'craft-workshops-kilns'],
                default => null,
            };
            if ($slugs) {
                $query->whereHas('siteType', fn ($typeQuery) => $typeQuery->whereIn('slug', $slugs));
            } elseif (ctype_digit((string) $category)) {
                $query->where('site_type_id', (int) $category);
            } else {
                $query->whereHas('siteType', fn ($typeQuery) => $typeQuery->where('slug', $category));
            }
        }

        if ($designation = trim((string) $request->input('designation', ''))) {
            $query->whereRaw('LOWER(heritage_designation) LIKE LOWER(?)', ['%'.$designation.'%']);
        }

        // PostGIS Spatial Bounding filter (min_lat, min_lng, max_lat, max_lng)
        if ($bounds = $request->input('bounds')) {
            $parts = explode(',', $bounds);
            if (count($parts) === 4 && DB::getDriverName() === 'pgsql') {
                [$minLat, $minLng, $maxLat, $maxLng] = array_map('floatval', $parts);
                $query->whereRaw(
                    "coordinates && ST_MakeEnvelope(?, ?, ?, ?, 4326)::geography",
                    [$minLng, $minLat, $maxLng, $maxLat]
                );
            }
        }

        // Filter by Area / District / Province
        if ($provinceId = $request->input('province_id')) {
            $query->where('province_id', $provinceId);
        }
        if ($areaId = $request->input('area_id')) {
            $query->where('area_id', $areaId);
        }
        if ($districtId = $request->input('district_id')) {
            $query->whereHas('area.subDistrict', fn ($subDistrict) => $subDistrict->where('district_id', $districtId));
        }

        // Featured only
        if ($request->boolean('featured')) {
            $query->where('featured', true);
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 50);
        $sites = $query->paginate($perPage);

        // Sanitize all outputs via SiteResource (single source of truth for coordinates)
        $transformed = $sites->through(function (Site $site) use ($request) {
            return (new \App\Http\Resources\SiteResource($site))->toArray($request);
        });

        return response()->json($transformed);
    }

    /**
     * Show single heritage site by slug or ID with relations.
     */
    public function show(string $slug): JsonResponse
    {
        $site = Site::with([
            'siteType',
            'historicalPeriod',
            'province',
            'area',
            'names',
            'sources',
            'claims.evidence.source',
            'images' => fn ($images) => $images->publiclyUsable(),
            'events',
            'timeline',
            'verifications.verifier',
            'revisions.user',
            'relations' => fn ($relations) => $relations->whereHas('relatedSite', fn ($related) => $related->publishedAndPublic()),
            'relations.relatedSite' => fn ($related) => $related->publishedAndPublic(),
        ])
        ->where(function ($q) use ($slug) {
            $q->where('slug', $slug)->orWhere('id', $slug);
        })
        ->firstOrFail();

        // Single published-only gate: Unapproved/Draft/Archived sites return 404 to public visitors
        $isStaff = request()->user() && in_array(strtolower(request()->user()->role?->name ?? ''), ['admin', 'super_admin', 'editor']);
        if (!$isStaff && !$site->isPubliclyAccessible()) {
            abort(404, 'المعلم التراثي غير متاح أو في طور التدقيق الأرشيفي.');
        }

        $site->increment('view_count');

        // Formatted exclusively through SiteResource serializer
        return response()->json([
            'data' => (new \App\Http\Resources\SiteResource($site))->toArray(request()),
        ]);
    }

    /**
     * Store new heritage site record.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Site::class);
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'summary_ar' => 'required|string|max:1000',
            'description_ar' => 'nullable|string',
            'historical_description' => 'nullable|string',
            'architectural_description' => 'nullable|string',
            'cultural_significance' => 'nullable|string',
            'historical_significance' => 'nullable|string',
            'current_condition' => 'nullable|string',
            'location_description' => 'nullable|string',
            'site_type_id' => 'required|exists:site_types,id',
            'historical_period_id' => 'required|exists:historical_periods,id',
            'province_id' => 'required|exists:provinces,id',
            'area_id' => 'required|exists:areas,id',
            'location_precision' => 'required|in:exact,approximate,restricted,unknown',
            'latitude' => 'nullable|required_with:longitude|numeric|between:-90,90',
            'longitude' => 'nullable|required_with:latitude|numeric|between:-180,180',
            'is_demo' => 'sometimes|boolean',
            'featured' => 'sometimes|boolean',
            'ai_assisted' => 'sometimes|boolean',
            'is_lost_or_vanished' => 'sometimes|boolean',
            'is_under_research' => 'sometimes|boolean',
            'museum_profile' => 'sometimes|array',
            'museum_profile.operator_name' => 'nullable|string|max:255',
            'museum_profile.operator_type' => 'nullable|string|max:100',
            'museum_profile.official_website' => 'nullable|url|max:2048',
            'museum_profile.address_text' => 'nullable|string|max:2000',
            'museum_profile.visiting_info' => 'nullable|array',
            'museum_profile.visiting_info_source_id' => 'nullable|integer|exists:sources,id',
            'museum_profile.accessibility_notes' => 'nullable|string|max:4000',
            'museum_profile.founding_year' => 'nullable|string|max:50',
            'museum_profile.founding_year_precision' => 'nullable|in:exact,approximate,century,unknown',
            'museum_profile.collection_summary' => 'nullable|string|max:4000',
        ]);

        $validated['slug'] = Str::slug($validated['name_en'] ?? $validated['name_ar']).'-'.Str::random(5);
        $validated['permanent_id'] = 'KHA-'.date('Y').'-'.strtoupper(Str::random(4));
        $validated['short_description'] = $validated['summary_ar'];
        $validated['description'] = $validated['description_ar'] ?? '';
        foreach (['historical_description', 'architectural_description', 'cultural_significance', 'historical_significance', 'current_condition', 'location_description'] as $field) {
            $validated[$field] = $validated[$field] ?? '';
        }
        unset($validated['summary_ar'], $validated['description_ar']);
        $validated['publication_status'] = 'draft';
        $validated['verification_status'] = 'unverified';
        $validated['created_by'] = $request->user()?->id;

        $site = DB::transaction(function () use ($validated, $request) {
            $museumProfileData = $validated['museum_profile'] ?? [];
            unset($validated['museum_profile']);
            $lat = $validated['latitude'] ?? null;
            $lng = $validated['longitude'] ?? null;
            unset($validated['latitude'], $validated['longitude']);

            $site = Site::create($validated);

            if (SiteType::query()->whereKey($site->site_type_id)->where('slug', 'museums')->exists()) {
                $site->museumProfile()->create($museumProfileData);
            }

            if ($lat !== null && $lng !== null) {
                $site->setCoordinates($lat, $lng);
                $site->save();
            }

            $this->auditLogAction->execute(
                action: 'site.created',
                entityType: 'Site',
                entityId: (string) $site->id,
                performedBy: (string) ($request->user()?->id ?? 'system'),
                details: "تم توثيق موقع جديد: {$site->name_ar} ({$site->inventory_number})",
                ipAddress: $request->ip()
            );

            return $site;
        });

        $site->load(['siteType', 'historicalPeriod', 'province', 'area.subDistrict.district']);

        return response()->json([
            'message' => 'تم حفظ الموقع بنجاح كمسودة بانتظار التدقيق والتحقيق الميداني',
            'site' => $site->makeHidden(['coordinates']),
        ], 201);
    }

    /**
     * Update existing site and log immutable revision.
     */
    public function update(Request $request, Site $site): JsonResponse
    {
        Gate::authorize('update', $site);
        $validated = $request->validate([
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'summary_ar' => 'sometimes|string|max:1000',
            'description_ar' => 'nullable|string',
            'site_type_id' => 'sometimes|exists:site_types,id',
            'historical_period_id' => 'sometimes|exists:historical_periods,id',
            'area_id' => 'sometimes|exists:areas,id',
            'historical_description' => 'nullable|string',
            'architectural_description' => 'nullable|string',
            'cultural_significance' => 'nullable|string',
            'historical_significance' => 'nullable|string',
            'current_condition' => 'nullable|string',
            'location_description' => 'nullable|string',
            'featured' => 'sometimes|boolean',
            'is_lost_or_vanished' => 'sometimes|boolean',
            'is_under_research' => 'sometimes|boolean',
            'is_demo' => 'sometimes|boolean',
            'ai_assisted' => 'sometimes|boolean',
            'museum_profile' => 'sometimes|array',
            'museum_profile.operator_name' => 'nullable|string|max:255',
            'museum_profile.operator_type' => 'nullable|string|max:100',
            'museum_profile.official_website' => 'nullable|url|max:2048',
            'museum_profile.address_text' => 'nullable|string|max:2000',
            'museum_profile.visiting_info' => 'nullable|array',
            'museum_profile.visiting_info_source_id' => 'nullable|integer|exists:sources,id',
            'museum_profile.accessibility_notes' => 'nullable|string|max:4000',
            'museum_profile.founding_year' => 'nullable|string|max:50',
            'museum_profile.founding_year_precision' => 'nullable|in:exact,approximate,century,unknown',
            'museum_profile.collection_summary' => 'nullable|string|max:4000',
            'location_precision' => 'sometimes|in:exact,approximate,restricted,unknown',
            'latitude' => 'nullable|required_with:longitude|numeric|between:-90,90',
            'longitude' => 'nullable|required_with:latitude|numeric|between:-180,180',
            'revision_notes' => 'required|string|max:500',
        ]);

        if (array_key_exists('summary_ar', $validated)) {
            $validated['short_description'] = $validated['summary_ar'];
            unset($validated['summary_ar']);
        }
        if (array_key_exists('description_ar', $validated)) {
            $validated['description'] = $validated['description_ar'] ?? '';
            unset($validated['description_ar']);
        }

        DB::transaction(function () use ($site, $validated, $request) {
            $notes = $validated['revision_notes'];
            unset($validated['revision_notes']);
            $museumProfileData = $validated['museum_profile'] ?? null;
            unset($validated['museum_profile']);

            $lat = $validated['latitude'] ?? null;
            $lng = $validated['longitude'] ?? null;
            $coordinatesProvided = array_key_exists('latitude', $validated) || array_key_exists('longitude', $validated);
            unset($validated['latitude'], $validated['longitude']);

            if ($coordinatesProvided) {
                $oldCoordinates = ['latitude' => $site->latitude, 'longitude' => $site->longitude];
                $newCoordinates = [
                    'latitude' => $lat === null ? null : (float) $lat,
                    'longitude' => $lng === null ? null : (float) $lng,
                ];
                if ($oldCoordinates !== $newCoordinates) {
                    SiteRevision::create([
                        'site_id' => $site->id,
                        'field_name' => 'coordinates',
                        'old_value' => json_encode($oldCoordinates),
                        'new_value' => json_encode($newCoordinates),
                        'changed_by' => $request->user()?->id,
                        'reason' => $notes,
                        'verification_status_at_time' => $site->verification_status->value,
                    ]);
                }
            }

            foreach ($validated as $field => $newValue) {
                $oldValue = $site->getAttribute($field);
                if ($oldValue instanceof \BackedEnum) {
                    $oldValue = $oldValue->value;
                }
                if ($oldValue === $newValue) {
                    continue;
                }

                SiteRevision::create([
                    'site_id' => $site->id,
                    'field_name' => $field,
                    'old_value' => is_scalar($oldValue) ? (string) $oldValue : json_encode($oldValue),
                    'new_value' => is_scalar($newValue) ? (string) $newValue : json_encode($newValue),
                    'changed_by' => $request->user()?->id,
                    'reason' => $notes,
                    'verification_status_at_time' => $site->verification_status->value,
                ]);
            }

            // Scholarly Quality Standard: Substantive edits reset verification status to unverified
            $substantiveFields = ['name_ar', 'short_description', 'description', 'site_type_id', 'historical_period_id'];
            $isSubstantive = false;
            foreach ($substantiveFields as $field) {
                if (isset($validated[$field]) && $validated[$field] !== $site->{$field}) {
                    $isSubstantive = true;
                    break;
                }
            }
            if ($isSubstantive && $site->verification_status === \App\Enums\VerificationStatus::VERIFIED) {
                $site->verification_status = \App\Enums\VerificationStatus::UNVERIFIED;
                $site->verified_at = null;
                $site->verified_by = null;
                $site->verification_notes = "تمت إعادة حالة التحقيق إلى غير موثق تلقائياً بسبب تعديل جوهري في المحتوى: {$notes}";
            }

            $site->update($validated);

            if ($museumProfileData !== null) {
                abort_unless(SiteType::query()->whereKey($site->site_type_id)->where('slug', 'museums')->exists(), 422, 'بيانات ملف المتحف لا تقبل إلا لسجل مصنف كمتحف.');
                $profile = $site->museumProfile()->firstOrNew();
                $profile->fill($museumProfileData);
                $profile->save();
                $this->auditLogAction->execute('museum_profile.updated', MuseumProfile::class, (string) $profile->id, $request->user()->name, $notes, $request->ip(), $request->user()->id);
            }

            if ($lat !== null && $lng !== null) {
                $site->setCoordinates($lat, $lng);
                $site->save();
            } elseif ($coordinatesProvided) {
                $site->setAttribute('coordinates', null);
                $site->save();
            }

            $this->auditLogAction->execute(
                action: 'site.updated',
                entityType: 'Site',
                entityId: (string) $site->id,
                performedBy: (string) ($request->user()?->id ?? 'system'),
                details: "تعديل بيانات الموقع: {$notes}",
                ipAddress: $request->ip()
            );
        });

        $updatedSite = $site->fresh(['siteType', 'historicalPeriod', 'province', 'area.subDistrict.district']);

        return response()->json([
            'message' => 'تم تحديث بيانات الموقع وحفظ المراجعة في السجل التاريخي',
            'site' => $updatedSite?->makeHidden(['coordinates']),
        ]);
    }

    /**
     * Soft delete site.
     */
    public function destroy(Request $request, Site $site): JsonResponse
    {
        $site->delete();

        $this->auditLogAction->execute(
            action: 'site.deleted',
            entityType: 'Site',
            entityId: (string) $site->id,
            performedBy: (string) ($request->user()?->id ?? 'system'),
            details: "أرشفة وحذف الموقع: {$site->name_ar}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'تم أرشفة الموقع ونقله إلى سلة المحذوفات',
        ]);
    }

    /**
     * Unpublish site (revert to draft).
     */
    public function unpublish(Request $request, string $id): JsonResponse
    {
        $site = Site::findOrFail($id);
        $site->publication_status = 'draft';
        $site->save();

        $this->auditLogAction->execute(
            action: 'site.unpublished',
            entityType: 'Site',
            entityId: (string) $site->id,
            performedBy: (string) ($request->user()?->name ?? 'محرر الأرشيف'),
            details: "إلغاء نشر الموقع وتحويله إلى مسودة داخلية: {$site->name_ar}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => "تم إلغاء نشر الموقع ({$site->name_ar}) وحجبه عن الواجهة العامة.",
            'site' => $site,
        ]);
    }

    /**
     * Archive site.
     */
    public function archive(Request $request, string $id): JsonResponse
    {
        $site = Site::findOrFail($id);
        $site->publication_status = 'archived';
        $site->save();

        $this->auditLogAction->execute(
            action: 'site.archived',
            entityType: 'Site',
            entityId: (string) $site->id,
            performedBy: (string) ($request->user()?->name ?? 'محرر الأرشيف'),
            details: "أرشفة السجل وإيقاف ظهوره للعموم: {$site->name_ar}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => "تمت أرشفة الموقع بنجاح.",
            'site' => $site,
        ]);
    }

    /**
     * Restore soft-deleted site.
     */
    public function restore(Request $request, string $id): JsonResponse
    {
        $site = Site::withTrashed()->findOrFail($id);
        $site->restore();
        $site->publication_status = 'draft';
        $site->save();

        $this->auditLogAction->execute(
            action: 'site.restored',
            entityType: 'Site',
            entityId: (string) $site->id,
            performedBy: (string) ($request->user()?->name ?? 'محرر الأرشيف'),
            details: "استرجاع الموقع المحذوف: {$site->name_ar}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => "تم استرجاع الموقع المحذوف بنجاح ونقله إلى المسودات.",
            'site' => $site,
        ]);
    }

    /**
     * Update verification status with mandatory scholarly rationale.
     */
    public function verify(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'verification_status' => 'required|string|in:verified,partially_verified,unverified,disputed,unknown',
            'reason' => 'required|string|min:10|max:1000',
        ]);

        $site = Site::findOrFail($id);
        Gate::authorize('verify', $site);
        $oldStatus = $site->verification_status;
        $oldLabel = $oldStatus instanceof \BackedEnum ? $oldStatus->value : (string) $oldStatus;

        // Security / Integrity: AI-assisted content cannot become Verified without an authorized human verifier
        if ($validated['verification_status'] === 'verified' && $site->ai_assisted && !$request->user()) {
            return response()->json([
                'message' => 'مرفوض: لا يمكن اعتماد المحتوى المستعان بالذكاء الاصطناعي كـ (موثق) دون مراجعة وتوقيع إنساني معتمد.',
            ], 422);
        }

        $site->verification_status = $validated['verification_status'];
        $site->verification_notes = $validated['reason'];
        $site->verified_at = now();
        $site->verified_by = $request->user()?->id;
        $site->last_reviewed_at = now();
        DB::transaction(function () use ($site, $validated, $request, $oldLabel): void {
            $site->save();
            \App\Models\SiteVerification::create([
                'site_id' => $site->id,
                'verified_by' => $request->user()?->id,
                'previous_status' => $oldLabel,
                'new_status' => $validated['verification_status'],
                'decision_reason' => $validated['reason'],
            ]);
        });

        $newLabel = $site->verification_status instanceof \BackedEnum ? $site->verification_status->value : (string) $site->verification_status;

        $this->auditLogAction->execute(
            action: 'site.verification_updated',
            entityType: 'Site',
            entityId: (string) $site->id,
            performedBy: (string) ($request->user()?->name ?? 'لجنة التحقيق'),
            details: "تحديث حالة التحقيق من ({$oldLabel}) إلى ({$newLabel})، التعليل: {$validated['reason']}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => "تم تحديث حالة التحقيق العلمي وتوثيق التعليل في السجل بنجاح.",
            'site' => $site,
        ]);
    }

    /**
     * Export public sites as GeoJSON FeatureCollection.
     * Enforces the single published-only rule and SiteResource coordinate precision.
     */
    public function exportGeoJson(): JsonResponse
    {
        $sites = Site::query()
            ->publishedAndPublic()
            ->whereNotNull('coordinates')
            ->get();

        $features = [];
        foreach ($sites as $site) {
            $feature = (new \App\Http\Resources\SiteResource($site))->toGeoJsonFeature();
            if ($feature) {
                $features[] = $feature;
            }
        }

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features,
        ]);
    }

    /**
     * Public Sitemap.xml (strictly published and public sites only)
     */
    public function sitemap(): \Illuminate\Http\Response
    {
        $sites = Site::query()->publishedAndPublic()->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        $xml .= '<url><loc>' . url('/') . '</loc><changefreq>daily</changefreq><priority>1.0</priority></url>';
        $xml .= '<url><loc>' . url('/sites') . '</loc><changefreq>daily</changefreq><priority>0.9</priority></url>';
        $xml .= '<url><loc>' . url('/museums') . '</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>';
        $xml .= '<url><loc>' . url('/encyclopedia') . '</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>';

        foreach ($sites as $site) {
            $lastmod = ($site->updated_at ?? $site->published_at ?? now())->toAtomString();
            $xml .= '<url>';
            $xml .= '<loc>' . htmlspecialchars(url("/sites/{$site->slug}"), ENT_XML1) . '</loc>';
            $xml .= '<lastmod>' . $lastmod . '</lastmod>';
            $xml .= '<changefreq>weekly</changefreq>';
            $xml .= '<priority>0.8</priority>';
            $xml .= '</url>';
        }

        $xml .= '</urlset>';

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=utf-8']);
    }

    /**
     * Public RSS/Atom feed (strictly published and public sites only)
     */
    public function rss(): \Illuminate\Http\Response
    {
        $sites = Site::query()->publishedAndPublic()->latest('published_at')->limit(50)->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">';
        $xml .= '<channel>';
        $xml .= '<title>' . htmlspecialchars('أثر كربلاء | Karbala Heritage Archive', ENT_XML1) . '</title>';
        $xml .= '<link>' . url('/') . '</link>';
        $xml .= '<description>' . htmlspecialchars('الأرشيف الرقمي لمعالم كربلاء التاريخية والتراثية', ENT_XML1) . '</description>';
        $xml .= '<language>ar-IQ</language>';
        $xml .= '<lastBuildDate>' . now()->toRfc2822String() . '</lastBuildDate>';

        foreach ($sites as $site) {
            $pubDate = ($site->published_at ?? $site->created_at ?? now())->toRfc2822String();
            $xml .= '<item>';
            $xml .= '<title>' . htmlspecialchars($site->name_ar, ENT_XML1) . '</title>';
            $xml .= '<link>' . htmlspecialchars(url("/sites/{$site->slug}"), ENT_XML1) . '</link>';
            $xml .= '<guid isPermaLink="true">' . htmlspecialchars(url("/sites/{$site->slug}"), ENT_XML1) . '</guid>';
            $xml .= '<description>' . htmlspecialchars($site->summary_ar ?? '', ENT_XML1) . '</description>';
            $xml .= '<pubDate>' . $pubDate . '</pubDate>';
            $xml .= '</item>';
        }

        $xml .= '</channel>';
        $xml .= '</rss>';

        return response($xml, 200, ['Content-Type' => 'application/rss+xml; charset=utf-8']);
    }
}

