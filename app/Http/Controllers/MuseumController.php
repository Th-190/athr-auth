<?php

namespace App\Http\Controllers;

use App\Models\MuseumProfile;
use App\Models\ResearchLead;
use App\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MuseumController extends Controller
{
    /**
     * Display a listing of museums with profiles.
     */
    public function index(): JsonResponse
    {
        $museums = Site::whereHas('siteType', function ($query) {
            $query->where('slug', 'museums');
        })
        ->with(['museumProfile', 'names', 'relations', 'sources'])
        ->get();

        return response()->json([
            'status' => 'success',
            'data' => $museums,
        ]);
    }

    /**
     * Display the specified museum profile.
     */
    public function show(string $slug): JsonResponse
    {
        $site = Site::where('slug', $slug)
            ->with(['museumProfile', 'names', 'relations', 'sources'])
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => $site,
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
