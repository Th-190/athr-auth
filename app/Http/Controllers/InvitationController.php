<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\AccessInvitation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction
    ) {}

    /**
     * List access invitations.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AccessInvitation::with(['role:id,name,name_ar', 'inviter:id,name,email'])
            ->latest();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Create and issue new role invitation with strict escalation rules.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'       => 'required|email|max:255',
            'role_id'     => 'required|exists:roles,id',
            'expires_days'=> 'nullable|integer|min:1|max:90',
        ]);

        $actor     = $request->user();
        $actorRole = strtolower($actor?->role?->name ?? '');

        // Escalation Rule 1: Nobody can invite themselves
        if ($actor && strtolower($actor->email) === strtolower($validated['email'])) {
            return response()->json([
                'message' => 'مرفوض: لا يمكنك توجيه دعوة صلاحيات لنفسك أو تعديل رتبتك ذاتياً.',
            ], 422);
        }

        $targetRole     = Role::findOrFail($validated['role_id']);
        $targetRoleName = strtolower($targetRole->name);

        // Escalation Rule 2: Only Super Admin can grant Admin or Super Admin
        if (in_array($targetRoleName, ['admin', 'super_admin'])) {
            if ($actorRole !== 'super_admin') {
                return response()->json([
                    'message' => 'مرفوض: صلاحية المدير (Admin) أو المدير العام (Super Admin) لا تُمنح إلا من قِبل المدير العام حصراً.',
                ], 403);
            }
        }

        // Escalation Rule 3: Regular Admin can grant Contributor and Editor
        if (!in_array($actorRole, ['admin', 'super_admin'])) {
            return response()->json([
                'message' => 'مرفوض: ليس لديك صلاحية دعوة أو تعيين مستخدمين.',
            ], 403);
        }

        // Check if there is already an active pending invitation
        $existing = AccessInvitation::where('email', strtolower($validated['email']))
            ->valid()
            ->first();

        if ($existing) {
            return response()->json([
                'message'    => 'يوجد بالفعل دعوة سارية المفعول مرسلة لهذا البريد الإلكتروني.',
                'invitation' => $existing,
            ], 422);
        }

        $days       = (int) ($validated['expires_days'] ?? 14);
        $invitation = AccessInvitation::create([
            'email'      => strtolower($validated['email']),
            'role_id'    => $targetRole->id,
            'invited_by' => $actor?->id,
            'token'      => Str::random(60),
            'status'     => 'pending',
            'expires_at' => now()->addDays($days),
        ]);

        $invitation->load(['role:id,name,name_ar', 'inviter:id,name']);

        $this->auditLogAction->execute(
            action: 'invitation.created',
            entityType: 'AccessInvitation',
            entityId: (string) $invitation->id,
            performedBy: (string) ($actor?->name ?? 'system'),
            details: "إصدار دعوة انضمام جديدة للمستخدم {$invitation->email} برتبة ({$targetRole->name_ar})",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message'    => "تم إصدار دعوة الانضمام بنجاح للمستخدم ({$invitation->email}) بدور ({$targetRole->name_ar})",
            'invitation' => $invitation,
        ], 201);
    }

    /**
     * Revoke a pending invitation.
     */
    public function revoke(Request $request, AccessInvitation $invitation): JsonResponse
    {
        $actor          = $request->user();
        $actorRole      = strtolower($actor?->role?->name ?? '');
        $targetRoleName = strtolower($invitation->role?->name ?? '');

        // If target role is super_admin or admin, only super_admin can revoke
        if (in_array($targetRoleName, ['admin', 'super_admin']) && $actorRole !== 'super_admin') {
            return response()->json([
                'message' => 'مرفوض: إلغاء دعوات الإدارة مقتصر على المدير العام حصراً.',
            ], 403);
        }

        $invitation->update([
            'status'     => 'revoked',
            'revoked_at' => now(),
        ]);

        $this->auditLogAction->execute(
            action: 'invitation.revoked',
            entityType: 'AccessInvitation',
            entityId: (string) $invitation->id,
            performedBy: (string) ($actor?->name ?? 'system'),
            details: "إلغاء دعوة الانضمام للمستخدم {$invitation->email}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message'    => 'تم إلغاء الدعوة بنجاح.',
            'invitation' => $invitation,
        ]);
    }
}
