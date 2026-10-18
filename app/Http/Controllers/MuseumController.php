<?php

namespace App\Http\Controllers;

use App\Models\ResearchLead;
use App\Models\Site;
use App\Http\Resources\SiteResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MuseumController extends Controller
{
    /**
     * Display a listing of museums with profiles.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Site::publishedAndPublic()
            ->whereHas('siteType', fn ($query) => $query->where('slug', 'museums'))
            ->with([
                'museumProfile.artifacts' => fn ($query) => $query
                    ->where('publication_status', 'published')
                    ->where('verification_status', 'verified'),
                'museumProfile.artifacts.source', 'names',
                'relations' => fn ($relations) => $relations->whereHas('relatedSite', fn ($related) => $related->publishedAndPublic()),
                'relations.relatedSite' => fn ($related) => $related->publishedAndPublic(),
                'sources',
            ])
            ->with(['siteType', 'historicalPeriod', 'province', 'area.subDistrict.district', 'images' => fn ($images) => $images->publiclyUsable()]);

        if ($search = trim((string) $request->query('q', ''))) {
            $query->where(function ($builder) use ($search) {
                $pattern = '%'.$search.'%';
                $builder->whereRaw('LOWER(name_ar) LIKE LOWER(?)', [$pattern])
                    ->orWhereRaw('LOWER(name_en) LIKE LOWER(?)', [$pattern])
                    ->orWhereRaw('LOWER(short_description) LIKE LOWER(?)', [$pattern])
                    ->orWhereHas('museumProfile', fn ($profile) => $profile->whereRaw('LOWER(collection_summary) LIKE LOWER(?)', [$pattern]));
            });
        }
        if ($provinceId = $request->integer('province_id')) {
            $query->where('province_id', $provinceId);
        }
        if ($districtId = $request->integer('district_id')) {
            $query->whereHas('area.subDistrict', fn ($subDistrict) => $subDistrict->where('district_id', $districtId));
        }
        if ($periodId = $request->integer('historical_period_id')) {
            $query->where('historical_period_id', $periodId);
        }

        $museums = $query->paginate(min(max($request->integer('per_page', 15), 1), 50));
        $museums->through(fn (Site $site) => (new SiteResource($site))->toArray($request));

        return response()->json($museums);
    }

    /**
     * Display the specified museum profile.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $site = Site::publishedAndPublic()
            ->whereHas('siteType', fn ($query) => $query->where('slug', 'museums'))
            ->where('slug', $slug)
            ->with([
                'museumProfile.artifacts' => fn ($query) => $query
                    ->where('publication_status', 'published')
                    ->where('verification_status', 'verified'),
                'museumProfile.artifacts.source', 'siteType', 'historicalPeriod', 'province',
                'area.subDistrict.district', 'names',
                'relations' => fn ($relations) => $relations->whereHas('relatedSite', fn ($related) => $related->publishedAndPublic()),
                'relations.relatedSite' => fn ($related) => $related->publishedAndPublic(),
                'sources',
                'images' => fn ($images) => $images->publiclyUsable(),
            ])
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => (new SiteResource($site))->toArray($request),
        ]);
    }

    /**
     * Display research leads (Admin only, never public).
     */
    public function leads(): JsonResponse
    {
        $leads = ResearchLead::orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $leads,
        ]);
    }

    /**
     * Store a candidate research lead.
     */
    public function storeLead(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'lead_url' => 'nullable|url|max:500',
            'note' => 'nullable|string',
            'created_by' => 'nullable|string|max:100',
        ]);

        $lead = ResearchLead::create([
            'name' => $validated['name'],
            'lead_url' => $validated['lead_url'] ?? null,
            'note' => $validated['note'] ?? null,
            'created_by' => $validated['created_by'] ?? 'admin',
            'status' => 'lead',
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $lead,
        ], 201);
    }
}
