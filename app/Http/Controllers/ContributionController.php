<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\Site;
use App\Models\SiteContribution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Enums\ContributionType;

class ContributionController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction
    ) {}

    /**
     * Submit a contribution (correction, new source, photo, observation).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'site_id' => 'required|exists:sites,id',
            'type' => ['required', Rule::enum(ContributionType::class)],
            'contributor_name' => 'required|string|max:255',
            'contributor_email' => 'required|email|max:255',
            'affiliation' => 'nullable|string|max:255',
            'notes' => 'required|string|max:3000',
            'proposed_changes' => 'nullable|array',
            'evidence_attachment' => 'nullable|string',
        ]);

        $site = Site::findOrFail($validated['site_id']);

        $contribution = SiteContribution::create([
            'site_id' => $site->id,
            'user_id' => $request->user()?->id,
            'type' => $validated['type'],
            'contributor_name' => $validated['contributor_name'],
            'contributor_email' => $validated['contributor_email'],
            'contributor_affiliation' => $validated['affiliation'] ?? null,
            'description' => $validated['notes'],
            'proposed_changes' => $validated['proposed_changes'] ?? [],
            'status' => 'pending_review',
        ]);

        $this->auditLogAction->execute(
            action: 'contribution.submitted',
            entityType: 'SiteContribution',
            entityId: (string) $contribution->id,
            performedBy: $validated['contributor_name'],
            details: "مساهمة مجتمعية جديدة ({$validated['type']}) للموقع {$site->name_ar}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'شكراً لمساهمتك! تم إرسال البيانات إلى هيئة التحقيق العلمي للمراجعة والتدقيق.',
            'contribution_id' => $contribution->id,
        ], 201);
    }

    /**
     * List contributions for editorial review (contributors see only their own).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'message' => 'غير مصرح: يجب تسجيل الدخول للوصول إلى هذا القسم.',
            ], 401);
        }

        $role = strtolower($user->role?->name ?? '');
        $query = SiteContribution::with(['site:id,name_ar,slug,permanent_id', 'user:id,name']);

        // Authorization Gate (M6): Contributors see only their own contributions
        if (!in_array($role, ['admin', 'super_admin', 'editor'])) {
            $query->where('user_id', $user->id);
        }

        $status = $request->input('status', 'pending_review');
        $contributions = $query
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(20);

        return response()->json($contributions);
    }

    /**
     * Review contribution (approve, reject, merge).
     */
    public function review(Request $request, SiteContribution $contribution): JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->cannot('review', $contribution)) {
            return response()->json([
                'message' => 'مرفوض: مراجعة وتدقيق المساهمات مقتصر على هيئة التحرير والإدارة حصراً.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected,under_review',
            'review_notes' => 'required|string|max:1000',
        ]);

        $contribution->update([
            'status' => $validated['status'],
            'reviewed_by' => $user->id,
            'admin_decision_reason' => $validated['review_notes'],
            'reviewed_at' => now(),
        ]);

        $this->auditLogAction->execute(
            action: 'contribution.reviewed',
            entityType: 'SiteContribution',
            entityId: (string) $contribution->id,
            performedBy: (string) ($user->id ?? 'editor'),
            details: "مراجعة المساهمة: الحالة {$validated['status']} — {$validated['review_notes']}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'تم تحديث حالة المساهمة وتسجيل الملاحظات',
            'contribution' => $contribution,
        ]);
    }
}
