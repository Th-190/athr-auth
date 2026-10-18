<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\ClaimEvidence;
use App\Models\Site;
use App\Models\SiteClaim;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClaimController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction
    ) {}

    /**
     * Submit an academic claim or conflicting hypothesis regarding a site.
     */
    public function store(Request $request, Site $site): JsonResponse
    {
        $validated = $request->validate([
            'claim_type' => 'required|in:dating,builder,naming,function,boundary',
            'statement_ar' => 'required|string|max:1000',
            'statement_en' => 'nullable|string|max:1000',
            'confidence_level' => 'required|in:established,probable,disputed,speculative',
            'editor_assessment' => 'nullable|string',
        ]);

        $claim = $site->claims()->create([
            'claim_type' => $validated['claim_type'],
            'statement_ar' => $validated['statement_ar'],
            'statement_en' => $validated['statement_en'] ?? null,
            'confidence_level' => $validated['confidence_level'],
            'editor_assessment' => $validated['editor_assessment'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        $this->auditLogAction->execute(
            action: 'claim.created',
            entityType: 'SiteClaim',
            entityId: (string) $claim->id,
            performedBy: (string) ($request->user()?->id ?? 'researcher'),
            details: "إضافة فرضية/رأي توثيقي للموقع {$site->name_ar}: {$claim->claim_type}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'تم تسجيل الرأي/الفرضية التوثيقية بنجاح',
            'claim' => $claim,
        ], 201);
    }

    /**
     * Attach academic evidence (source citation) to a claim.
     */
    public function addEvidence(Request $request, SiteClaim $claim): JsonResponse
    {
        $validated = $request->validate([
            'source_id' => 'required|exists:sources,id',
            'relevance' => 'required|in:primary,secondary,contradictory,supporting',
            'citation_page' => 'nullable|string|max:100',
            'direct_quote' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $evidence = $claim->evidence()->create([
            'source_id' => $validated['source_id'],
            'relevance' => $validated['relevance'],
            'citation_page' => $validated['citation_page'] ?? null,
            'direct_quote' => $validated['direct_quote'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'تم ربط الدليل المصدري بالفرضية بنجاح',
            'evidence' => $evidence->load('source'),
        ], 201);
    }
}
