<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\Role;
use App\Models\User;
use App\Support\AdminAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction
    ) {}

    /**
     * Admin Dashboard: List users with roles and status.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('role')->orderBy('created_at', 'desc');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->whereHas('role', fn ($q) => $q->where('name', $role));
        }

        $users = $query->paginate(30);

        $transformed = $users->through(function (User $u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role?->name ?? 'viewer',
                'role_ar' => $u->role?->name_ar ?? 'مشاهد وباحث',
                'created_at' => $u->created_at?->toIso8601String(),
                'email_verified' => !is_null($u->email_verified_at),
                'is_active' => $u->is_active ?? true,
                'deactivated_at' => $u->deactivated_at?->toIso8601String(),
                'has_2fa' => !empty($u->two_factor_confirmed_at),
            ];
        });

        $roles = Role::all()->map(function ($r) {
            return [
                'id' => $r->id,
                'name' => $r->name,
                'name_ar' => $r->name_ar,
                'description' => $r->description,
            ];
        });

        return response()->json([
            'users' => $transformed,
            'roles' => $roles,
        ]);
    }

    /**
     * Create a new authorized staff/admin user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:editor,viewer,contributor',
            'is_active' => 'boolean',
        ]);

        $roleModel = Role::firstOrCreate(
            ['name' => $validated['role']],
            [
                'name_ar' => match ($validated['role']) {
                    'editor' => 'محرر وباحث',
                    'viewer' => 'مشاهد وباحث',
                    default => $validated['role'],
                },
                'description' => "صلاحية {$validated['role']} المعتمدة للمستخدم",
            ]
        );

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => Hash::make($validated['password']),
            'role_id' => $roleModel->id,
            'email_verified_at' => now(),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $this->auditLogAction->execute(
            action: 'user.created',
            entityType: 'User',
            entityId: (string) $user->id,
            performedBy: (string) ($request->user()?->name ?? 'الإدارة'),
            details: "إنشاء حساب موظف جديد ({$user->email}) بدور {$roleModel->name_ar}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'تم إنشاء المستخدم بنجاح',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $roleModel->name,
                'role_ar' => $roleModel->name_ar,
                'is_active' => $user->is_active,
            ],
        ], 201);
    }

    /**
     * Admin Dashboard: Update user role (admin, editor, viewer, pending).
     */
    public function updateRole(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|string|in:editor,viewer,pending,contributor',
        ]);

        $user = User::with('role')->findOrFail($id);
        $actingUser = $request->user();

        if (AdminAccess::isDesignatedAdministrator($user)) {
            return response()->json(['message' => 'لا يمكن تغيير دور المدير المحدد عبر واجهة المستخدمين. استخدم إجراء الاستعادة المحمي عند الحاجة.'], 422);
        }

        // Privilege Escalation Prevention: Cannot change your own role
        if ($actingUser && (string) $actingUser->id === (string) $user->id) {
            return response()->json([
                'message' => 'مرفوض: لا يمكنك تعديل صلاحية حسابك بنفسك. يجب أن يتم ذلك عبر مدير آخر.',
            ], 422);
        }

        // Privilege Escalation Prevention: Only Super Admin can grant Admin or Super Admin
        if (in_array($validated['role'], ['admin', 'super_admin']) && $actingUser?->role?->name !== 'super_admin') {
            return response()->json([
                'message' => 'مرفوض: ترقية أو منح رتبة المدير (Admin) أو المدير العام (Super Admin) تتطلب صلاحية مدير عام أعلى حصراً.',
            ], 403);
        }

        // Privilege Escalation Prevention: Only Super Admin can modify a Super Admin
        if ($user->role?->name === 'super_admin' && $actingUser?->role?->name !== 'super_admin') {
            return response()->json([
                'message' => 'مرفوض: تعديل رتبة المدير العام الأعلى (Super Admin) تتطلب صلاحية مدير عام أعلى حصراً.',
            ], 403);
        }

        // Prevent removing the last active super_admin
        if ($user->role?->name === 'super_admin' && $validated['role'] !== 'super_admin') {
            $activeSuperAdminCount = User::whereHas('role', fn ($q) => $q->where('name', 'super_admin'))
                ->where('is_active', true)
                ->where('id', '!=', $user->id)
                ->count();

            if ($activeSuperAdminCount === 0) {
                return response()->json([
                    'message' => 'مرفوض: لا يمكن تغيير دور آخر مدير عام (Super Admin) نشط في النظام.',
                ], 422);
            }
        }

        // Prevent removing the last active admin
        if ($user->role?->name === 'admin' && $validated['role'] !== 'admin') {
            $activeAdminCount = User::whereHas('role', fn ($q) => $q->whereIn('name', ['admin', 'super_admin']))
                ->where('is_active', true)
                ->where('id', '!=', $user->id)
                ->count();

            if ($activeAdminCount === 0) {
                return response()->json([
                    'message' => 'مرفوض: لا يمكن حذف أو تغيير دور آخر مدير نشط في النظام.',
                ], 422);
            }
        }

        $roleModel = Role::firstOrCreate(
            ['name' => $validated['role']],
            [
                'name_ar' => match ($validated['role']) {
                    'admin' => 'مدير أرشيف',
                    'editor' => 'محرر وباحث',
                    'viewer' => 'مشاهد وباحث',
                    'pending' => 'معلق (بانتظار الاعتماد)',
                    'contributor' => 'مساهم',
                    default => $validated['role'],
                },
                'description' => "صلاحية {$validated['role']} المعتمدة للمستخدم",
            ]
        );

        $oldRole = $user->role?->name ?? 'none';
        $user->role_id = $roleModel->id;
        $user->save();
        $user->load('role');

        $this->auditLogAction->execute(
            action: 'user.role_updated',
            entityType: 'User',
            entityId: (string) $user->id,
            performedBy: (string) ($request->user()?->name ?? 'الإدارة العليا'),
            details: "تعديل صلاحية المستخدم {$user->email} من {$oldRole} إلى {$roleModel->name}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => "تم تحديث دور المستخدم ({$user->name}) بنجاح إلى: {$roleModel->name_ar}",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $roleModel->name,
                'role_ar' => $roleModel->name_ar,
            ],
        ]);
    }

    /**
     * Deactivate user account.
     */
    public function deactivate(Request $request, string $id): JsonResponse
    {
        $user = User::with('role')->findOrFail($id);

        if (AdminAccess::isDesignatedAdministrator($user)) {
            return response()->json(['message' => 'لا يمكن تعطيل المدير المحدد عبر واجهة المستخدمين.'], 422);
        }

        if ($user->role?->name === 'super_admin') {
            $otherSuperAdmins = User::whereHas('role', fn ($q) => $q->where('name', 'super_admin'))
                ->where('is_active', true)
                ->where('id', '!=', $user->id)
                ->count();

            if ($otherSuperAdmins === 0) {
                return response()->json([
                    'message' => 'مرفوض: لا يمكن تعطيل حساب آخر مدير عام (Super Admin) نشط في النظام.',
                ], 422);
            }
        }

        if (in_array($user->role?->name, ['admin', 'super_admin'])) {
            $otherActiveAdmins = User::whereHas('role', fn ($q) => $q->whereIn('name', ['admin', 'super_admin']))
                ->where('is_active', true)
                ->where('id', '!=', $user->id)
                ->count();

            if ($otherActiveAdmins === 0) {
                return response()->json([
                    'message' => 'مرفوض: لا يمكن تعطيل حساب آخر مدير نشط في النظام.',
                ], 422);
            }
        }

        $user->is_active = false;
        $user->deactivated_at = now();
        $user->save();

        // Revoke active sessions / API tokens
        try {
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }
        } catch (\Throwable $e) {
            // Tokens table might not be present in testing
        }

        $this->auditLogAction->execute(
            action: 'user.deactivated',
            entityType: 'User',
            entityId: (string) $user->id,
            performedBy: (string) ($request->user()?->name ?? 'الإدارة'),
            details: "تعطيل حساب المستخدم وإلغاء جلساته: {$user->email}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => "تم تعطيل حساب المستخدم ({$user->name}) وإلغاء جميع جلساته النشطة.",
            'user' => [
                'id' => $user->id,
                'is_active' => false,
                'deactivated_at' => $user->deactivated_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Activate user account.
     */
    public function activate(Request $request, string $id): JsonResponse
    {
        $user = User::with('role')->findOrFail($id);
        if (in_array(strtolower($user->role?->name ?? ''), ['admin', 'super_admin'], true)
            && !AdminAccess::isDesignatedAdministrator($user)) {
            return response()->json(['message' => 'لا يمكن تفعيل حساب إداري إضافي من واجهة المستخدمين.'], 422);
        }
        $user->is_active = true;
        $user->deactivated_at = null;
        $user->save();

        $this->auditLogAction->execute(
            action: 'user.activated',
            entityType: 'User',
            entityId: (string) $user->id,
            performedBy: (string) ($request->user()?->name ?? 'الإدارة'),
            details: "إعادة تفعيل حساب المستخدم: {$user->email}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => "تمت إعادة تفعيل حساب المستخدم ({$user->name}) بنجاح.",
            'user' => [
                'id' => $user->id,
                'is_active' => true,
                'deactivated_at' => null,
            ],
        ]);
    }

    /**
     * Revoke all sessions for a user.
     */
    public function revokeSessions(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        try {
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }
        } catch (\Throwable $e) {
            //
        }

        $this->auditLogAction->execute(
            action: 'user.sessions_revoked',
            entityType: 'User',
            entityId: (string) $user->id,
            performedBy: (string) ($request->user()?->name ?? 'الإدارة'),
            details: "إلغاء جميع الجلسات والرموز النشطة للمستخدم {$user->email}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => "تم إنهاء وإلغاء جميع الجلسات النشطة للمستخدم ({$user->name}) بنجاح.",
        ]);
    }

    /**
     * Delete user account.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = User::with('role')->findOrFail($id);

        if (AdminAccess::isDesignatedAdministrator($user)) {
            return response()->json(['message' => 'لا يمكن حذف المدير المحدد عبر واجهة المستخدمين.'], 422);
        }

        if ($user->role?->name === 'super_admin') {
            $otherSuperAdmins = User::whereHas('role', fn ($q) => $q->where('name', 'super_admin'))
                ->where('is_active', true)
                ->where('id', '!=', $user->id)
                ->count();

            if ($otherSuperAdmins === 0) {
                return response()->json([
                    'message' => 'مرفوض: لا يمكن حذف آخر مدير عام (Super Admin) نشط في النظام.',
                ], 422);
            }
        }

        if (in_array($user->role?->name, ['admin', 'super_admin'])) {
            $otherActiveAdmins = User::whereHas('role', fn ($q) => $q->whereIn('name', ['admin', 'super_admin']))
                ->where('is_active', true)
                ->where('id', '!=', $user->id)
                ->count();

            if ($otherActiveAdmins === 0) {
                return response()->json([
                    'message' => 'مرفوض: لا يمكن حذف آخر مدير نشط في النظام.',
                ], 422);
            }
        }

        $user->delete();

        $this->auditLogAction->execute(
            action: 'user.deleted',
            entityType: 'User',
            entityId: (string) $user->id,
            performedBy: (string) ($request->user()?->name ?? 'الإدارة'),
            details: "حذف حساب المستخدم: {$user->email}",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'تم حذف المستخدم بنجاح',
        ]);
    }
}
