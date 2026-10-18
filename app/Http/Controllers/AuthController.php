<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\Role;
use App\Models\User;
use App\Services\FirebaseTokenVerifier;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction,
        protected FirebaseTokenVerifier $tokenVerifier
    ) {}

    /**
     * Handle Google OAuth Login / Registration via Firebase Auth ID Token.
     * Synchronizes client Firebase identity with PostgreSQL user records.
     * New users default to 'viewer' role (مشاهد وباحث) or pending.
     * No manual email verification codes are needed for Google Sign-In users.
     */
    public function handleGoogleLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_token' => 'required_without:credential|string|max:8192',
            'credential' => 'required_without:id_token|string|max:8192',
            'return_url' => 'nullable|string|max:1000',
        ]);

        $rawToken = $validated['id_token'] ?? ($validated['credential'] ?? null);

        $returnUrl = '/';
        if (!empty($validated['return_url'])) {
            $raw = trim($validated['return_url']);
            // Safe same-origin relative path: must start with '/' but NOT '//' or '/\' and have no protocol (e.g. https:)
            if (str_starts_with($raw, '/') && !str_starts_with($raw, '//') && !str_starts_with($raw, '/\\') && !preg_match('#^[a-zA-Z][a-zA-Z0-9+.-]*:#', $raw)) {
                $returnUrl = $raw;
            }
        }

        try {
            $claims = $this->tokenVerifier->verify($rawToken);
        } catch (Exception $e) {
            return response()->json(['message' => 'تعذر التحقق من هوية Google.'], 401);
        }

        if (($claims['firebase']['sign_in_provider'] ?? null) !== 'google.com') {
            return response()->json(['message' => 'يجب تسجيل الدخول باستخدام حساب Google.'], 401);
        }
        $email = $claims['email'];
        $name = $claims['name'];
        $avatar = $claims['avatar'];
        $firebaseUid = $claims['uid'];

        // Check for pending invitation matching user's email
        $invitation = \App\Models\AccessInvitation::with('role')->where('email', $email)->valid()->first();

        // Fetch or create 'contributor' default role for new accounts if not invited
        $defaultRole = Role::firstOrCreate(
            ['name' => 'contributor'],
            [
                'name_ar' => 'مساهم',
                'description' => 'تقديم مساهمات توثيقية وبحثية للمراجعة والتدقيق',
            ]
        );

        $assignedRoleId = $invitation ? $invitation->role_id : $defaultRole->id;

        $isNewUser = false;
        $user = User::with('role')->where('google_id', $firebaseUid)->first();

        // Deactivated accounts cannot be linked or otherwise modified during a login attempt.
        if ($user && isset($user->is_active) && !$user->is_active) {
            return response()->json([
                'message' => 'مرفوض: تم إيقاف أو حظر هذا الحساب من قِبل إدارة الأرشيف.',
            ], 403);
        }

        // Backfill legacy accounts only when the provider has cryptographically
        // verified the exact email. A Google subject already attached elsewhere fails closed.
        if (!$user) {
            $user = User::where('email', $email)->first();
            if ($user && $user->google_id && !hash_equals($user->google_id, $firebaseUid)) {
                return response()->json(['message' => 'حساب Google مرتبط بحساب آخر.'], 409);
            }
            if ($user) {
                if (isset($user->is_active) && !$user->is_active) {
                    return response()->json(['message' => 'مرفوض: تم إيقاف أو حظر هذا الحساب من قِبل إدارة الأرشيف.'], 403);
                }
                $user->google_id = $firebaseUid;
                $user->save();
                $user->load('role');
                $this->auditLogAction->execute(
                    action: 'user.google_identity_linked',
                    entityType: 'User',
                    entityId: (string) $user->id,
                    performedBy: $user->name,
                    details: "ربط حساب Google موثق بالحساب القائم: {$user->email}",
                    ipAddress: $request->ip(),
                    performedById: $user->id
                );
            }
        }

        if (!$user) {
            $isNewUser = true;
            try {
                $user = DB::transaction(fn () => User::create([
                    'name' => $name,
                    'email' => $email,
                    'google_id' => $firebaseUid,
                    'avatar_url' => $avatar,
                    'password' => Hash::make(Str::random(64)),
                    'role_id' => $assignedRoleId,
                    'email_verified_at' => now(),
                ]));
            } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                // A simultaneous login may have created the same subject. Resolve to
                // that durable account instead of minting a duplicate or failing over.
                $user = User::where('google_id', $firebaseUid)->firstOrFail();
                $isNewUser = false;
            }

            $user->load('role');

            if ($invitation) {
                $invitation->update([
                    'status' => 'accepted',
                    'accepted_at' => now(),
                ]);
                $this->auditLogAction->execute(
                    action: 'invitation.accepted',
                    entityType: 'AccessInvitation',
                    entityId: (string) $invitation->id,
                    performedBy: $user->name,
                    details: "قبول دعوة الانضمام وتعيين الرتبة المحددة ({$user->role?->name_ar}) لأول مرة",
                    ipAddress: $request->ip(),
                    performedById: $user->id
                );
            }

            $this->auditLogAction->execute(
                action: 'user.registered_google_firebase',
                entityType: 'User',
                entityId: (string) $user->id,
                performedBy: $user->name,
                details: "تسجيل مستخدم جديد عبر Firebase Google Auth بدور ({$user->role?->name_ar}): {$user->email}",
                ipAddress: $request->ip(),
                performedById: $user->id
            );
        } else {
            // If user exists and has a pending invitation, claim it exactly once
            if ($invitation && $user->role_id !== $invitation->role_id) {
                $user->update(['role_id' => $invitation->role_id]);
                $user->load('role');

                $invitation->update([
                    'status' => 'accepted',
                    'accepted_at' => now(),
                ]);

                $this->auditLogAction->execute(
                    action: 'invitation.accepted',
                    entityType: 'AccessInvitation',
                    entityId: (string) $invitation->id,
                    performedBy: $user->name,
                    details: "قبول دعوة الانضمام وترقية حساب المستخدم إلى ({$user->role?->name_ar})",
                    ipAddress: $request->ip(),
                    performedById: $user->id
                );
            }

            // Update name or avatar if provided from Google
            if ($name && $user->name !== $name && $user->name === 'باحث زائر') {
                $user->update(['name' => $name]);
            }

            // Ensure email_verified_at is set since Google guarantees verification
            if (is_null($user->email_verified_at)) {
                $user->update(['email_verified_at' => now()]);
            }

            if (!$user->google_id) {
                $user->update(['google_id' => $firebaseUid, 'avatar_url' => $avatar]);
            } elseif (!$user->avatar_url && $avatar) {
                $user->update(['avatar_url' => $avatar]);
            }

            $this->auditLogAction->execute(
                action: 'user.login_google_firebase',
                entityType: 'User',
                entityId: (string) $user->id,
                performedBy: $user->name,
                details: "تسجيل دخول معتمد عبر Firebase Google Auth: {$user->email} (الدور: {$user->role?->name_ar})",
                ipAddress: $request->ip(),
                performedById: $user->id
            );
        }

        // Issue Sanctum Personal Access Token or session token
        $token = $user->createToken('firebase-google-auth')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => $isNewUser
                ? 'تم إنشاء حساب الباحث الجديد بنجاح عبر Google'
                : 'تم تسجيل الدخول بنجاح',
            'is_new_user' => $isNewUser,
            'token' => $token,
            'token_type' => 'Bearer',
            'return_url' => $returnUrl,
            'user' => [
                'id' => $user->id,
                'firebase_uid' => $user->google_id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar_url,
                'role' => $user->role?->name ?? 'viewer',
                'role_ar' => $user->role?->name_ar ?? 'مشاهد وباحث',
                'email_verified' => true,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get current authenticated user profile and active role.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'authenticated' => false,
                'user' => null,
            ]);
        }

        return response()->json([
            'authenticated' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar_url,
                'role' => $user->role?->name ?? 'viewer',
                'role_ar' => $user->role?->name_ar ?? 'مشاهد وباحث',
                'email_verified' => !is_null($user->email_verified_at),
                'created_at' => $user->created_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Logout session.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && method_exists($user, 'currentAccessToken')) {
            $user->currentAccessToken()?->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم إنهاء الجلسة بنجاح',
        ]);
    }
}
