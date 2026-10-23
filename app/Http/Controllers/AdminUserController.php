<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\Role;
use App\Models\User;
use App\Support\AdminAccess;
use App\Support\SuperAdminAccountLimit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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
        $superAdminRoleId = Role::query()->where('name', 'super_admin')->value('id') ?? -1;
        $query = User::with('role')
            // Keep the three active Super Admins visible on the first page even
            // when the archive has many ordinary users.
            ->orderByRaw('CASE WHEN role_id = ? AND is_active = 1 THEN 0 WHEN role_id = ? THEN 1 ELSE 2 END', [
                $superAdminRoleId,
                $superAdminRoleId,
            ])
            ->orderByDesc('created_at');

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
            'super_admin_limit' => SuperAdminAccountLimit::MAX_ACTIVE,
            'active_super_admin_count' => User::query()
                ->whereHas('role', fn ($q) => $q->where('name', 'super_admin'))
                ->where('is_active', true)->count(),
            'can_manage_super_admins' => strtolower($request->user()?->role?->name ?? '') === 'super_admin',
        ]);
    }

    /**
     * Create a new authorized staff/admin user.
     */
    public function store(Request $request): JsonResponse
    {
        $roleName = strtolower((string) $request->input('role'));
        if ($roleName === 'super_admin' && !AdminAccess::isSuperAdministrator($request->user())) {
            return response()->json(['message' => 'إنشاء حساب مدير عام متاح للمدير العام النشط فقط.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => ['required', 'string', $roleName === 'super_admin' ? 'min:12' : 'min:8', 'max:1024'],
            'role' => 'required|string|in:editor,viewer,contributor,super_admin',
            'is_active' => 'boolean',
        ]);

        $email = strtolower(trim($validated['email']));
        if (User::withTrashed()->whereRaw('LOWER(email) = ?', [$email])->exists()) {
            throw ValidationException::withMessages(['email' => 'البريد الإلكتروني مستخدم بالفعل.']);
        }

        $roleModel = Role::firstOrCreate(
            ['name' => $validated['role']],
            [
                'name_ar' => match ($validated['role']) {
                    'editor' => 'محرر وباحث',
                    'viewer' => 'مشاهد وباحث',
                    'super_admin' => 'مدير عام',
                    default => $validated['role'],
                },
                'description' => "صلاحية {$validated['role']} المعتمدة للمستخدم",
            ]
        );

        $user = DB::transaction(function () use ($validated, $email, $roleModel): User {
            if ($roleModel->name === 'super_admin') {
                $lockedRole = SuperAdminAccountLimit::lockRole();
                if ((bool) ($validated['is_active'] ?? true)) {
                    SuperAdminAccountLimit::ensureCapacity($lockedRole);
                }
            }

            return User::create([
                'name' => $validated['name'],
                'email' => $email,
                'password' => Hash::make($validated['password']),
                'role_id' => $roleModel->id,
                'email_verified_at' => now(),
                'is_active' => $validated['is_active'] ?? true,
            ]);
        });

        $this->auditLogAction->execute(
            action: 'user.created',
            entityType: 'User',
            entityId: (string) $user->id,
            performedBy: (string) ($request->user()?->name ?? 'الإدارة'),
            details: "إنشاء حساب جديد ({$user->email}) بدور {$roleModel->name_ar}",
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
            'role' => 'required|string|in:editor,viewer,pending,contributor,super_admin',
        ]);

        $user = User::with('role')->findOrFail($id);
        $actingUser = $request->user();
        $oldRole = strtolower($user->role?->name ?? 'none');
        $newRoleName = strtolower($validated['role']);

        if ($oldRole === 'admin' && AdminAccess::isDesignatedAdministrator($user)) {
            return response()->json(['message' => 'يجب تحويل حساب الاستعادة إلى مدير عام عبر أمر التهيئة المحمي أولاً.'], 422);
        }

        // Privilege Escalation Prevention: Cannot change your own role
        if ($actingUser && (string) $actingUser->id === (string) $user->id) {
            return response()->json([
                'message' => 'مرفوض: لا يمكنك تعديل صلاحية حسابك بنفسك. يجب أن يتم ذلك عبر مدير آخر.',
            ], 422);
        }

        // Only an active Super Admin may grant or modify another Super Admin.
        if (($newRoleName === 'super_admin' || $oldRole === 'super_admin')
            && !AdminAccess::isSuperAdministrator($actingUser)) {
            return response()->json([
                'message' => 'مرفوض: إدارة حسابات المدير العام مقتصرة على مدير عام نشط.',
            ], 403);
        }

        $roleModel = Role::firstOrCreate(
            ['name' => $newRoleName],
            [
                'name_ar' => match ($newRoleName) {
                    'super_admin' => 'مدير عام',
                    'editor' => 'محرر وباحث',
                    'viewer' => 'مشاهد وباحث',
                    'pending' => 'معلق (بانتظار الاعتماد)',
                    'contributor' => 'مساهم',
                    default => $newRoleName,
                },
                'description' => "صلاحية {$newRoleName} المعتمدة للمستخدم",
            ]
        );

        DB::transaction(function () use ($user, $roleModel, $oldRole, $newRoleName): void {
            if ($oldRole === 'super_admin' || $newRoleName === 'super_admin') {
                $lockedSuperAdminRole = SuperAdminAccountLimit::lockRole();
                if ($oldRole === 'super_admin' && $newRoleName !== 'super_admin') {
                    SuperAdminAccountLimit::ensureAnotherUsableAccount($lockedSuperAdminRole, $user);
                }
                if ($newRoleName === 'super_admin' && $oldRole !== 'super_admin' && (bool) $user->is_active) {
                    SuperAdminAccountLimit::ensureCapacity($lockedSuperAdminRole, $user->id);
                }
            }

            $user->role_id = $roleModel->id;
            $user->save();
        });
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
        $roleName = strtolower($user->role?->name ?? '');

        if ($roleName === 'admin' && AdminAccess::isDesignatedAdministrator($user)) {
            return response()->json(['message' => 'حوّل حساب الاستعادة إلى مدير عام قبل إدارة حالته من الواجهة.'], 422);
        }
        if ($roleName === 'super_admin' && !AdminAccess::isSuperAdministrator($request->user())) {
            return response()->json(['message' => 'إدارة حسابات المدير العام مقتصرة على مدير عام نشط.'], 403);
        }

        DB::transaction(function () use ($user, $roleName): void {
            if ($roleName === 'super_admin') {
                $lockedRole = SuperAdminAccountLimit::lockRole();
                SuperAdminAccountLimit::ensureAnotherUsableAccount($lockedRole, $user);
            } elseif ($roleName === 'admin' && (bool) $user->is_active) {
                $otherAdmins = User::whereHas('role', fn ($q) => $q->whereIn('name', ['admin', 'super_admin']))
                    ->where('is_active', true)->where('id', '!=', $user->id)->count();
                if ($otherAdmins === 0) {
                    throw ValidationException::withMessages(['account' => 'لا يمكن تعطيل آخر حساب إداري نشط.']);
                }
            }

            $user->is_active = false;
            $user->deactivated_at = now();
            $user->save();
            $user->tokens()->delete();
        });

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
        $roleName = strtolower($user->role?->name ?? '');
        if ($roleName === 'admin' && !AdminAccess::isDesignatedAdministrator($user)) {
            return response()->json(['message' => 'لا يمكن تفعيل حساب مدير غير معتمد.'], 422);
        }
        if ($roleName === 'super_admin' && !AdminAccess::isSuperAdministrator($request->user())) {
            return response()->json(['message' => 'إدارة حسابات المدير العام مقتصرة على مدير عام نشط.'], 403);
        }

        DB::transaction(function () use ($user, $roleName): void {
            if ($roleName === 'super_admin' && !(bool) $user->is_active) {
                $lockedRole = SuperAdminAccountLimit::lockRole();
                SuperAdminAccountLimit::ensureCapacity($lockedRole, $user->id);
            }
            $user->is_active = true;
            $user->deactivated_at = null;
            $user->save();
        });

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
        $user = User::with('role')->findOrFail($id);
        if (strtolower($user->role?->name ?? '') === 'super_admin'
            && !AdminAccess::isSuperAdministrator($request->user())) {
            return response()->json(['message' => 'إدارة جلسات حسابات المدير العام مقتصرة على مدير عام نشط.'], 403);
        }

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
        $roleName = strtolower($user->role?->name ?? '');

        if ($roleName === 'admin' && AdminAccess::isDesignatedAdministrator($user)) {
            return response()->json(['message' => 'لا يمكن حذف حساب الاستعادة المحدد.'], 422);
        }
        if ($roleName === 'super_admin' && !AdminAccess::isSuperAdministrator($request->user())) {
            return response()->json(['message' => 'إدارة حسابات المدير العام مقتصرة على مدير عام نشط.'], 403);
        }

        DB::transaction(function () use ($user, $roleName): void {
            if ($roleName === 'super_admin') {
                $lockedRole = SuperAdminAccountLimit::lockRole();
                SuperAdminAccountLimit::ensureAnotherUsableAccount($lockedRole, $user);
            } elseif ($roleName === 'admin' && (bool) $user->is_active) {
                $otherAdmins = User::whereHas('role', fn ($q) => $q->whereIn('name', ['admin', 'super_admin']))
                    ->where('is_active', true)->where('id', '!=', $user->id)->count();
                if ($otherAdmins === 0) {
                    throw ValidationException::withMessages(['account' => 'لا يمكن حذف آخر حساب إداري نشط.']);
                }
            }

            $user->tokens()->delete();
            $user->delete();
        });

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
