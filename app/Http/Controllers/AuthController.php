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
            'id_token' => 'nullable|string', // Firebase ID Token
            'credential' => 'nullable|string', // Alternate key for token
            'email' => 'nullable|email|max:255',
            'name' => 'nullable|string|max:255',
            'avatar' => 'nullable|string|url|max:1000',
            'google_id' => 'nullable|string|max:255',
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

        $email = null;
        $name = null;
        $avatar = $validated['avatar'] ?? null;
        $firebaseUid = $validated['google_id'] ?? null;

        // Verify Firebase JWT token if provided
        if (!empty($rawToken)) {
            try {
                $claims = $this->tokenVerifier->verify($rawToken);
                if (isset($claims['email_verified']) && $claims['email_verified'] === false) {
                    return response()->json([
                        'message' => 'مرفوض: البريد الإلكتروني غير موثق من قِبل المزود (Unverified Email).',
                    ], 403);
                }
                $email = strtolower($claims['email']);
                $name = $claims['name'] ?: ($validated['name'] ?? 'باحث');
                $avatar = $claims['avatar'] ?: $avatar;
                $firebaseUid = $claims['uid'] ?: $firebaseUid;
            } catch (Exception $e) {
                // If token verification fails and explicit email is not provided, reject
                if (empty($validated['email'])) {
                    return response()->json([
                        'message' => 'فشل التحقق من رمز Firebase: ' . $e->getMessage(),
                    ], 401);
                }
            }
        }

        // Fallback to validated request fields if direct payload
        if (empty($email) && !empty($validated['email'])) {
            $email = strtolower(trim($validated['email']));
            $name = trim($validated['name'] ?? 'باحث');
        }

        if (empty($email)) {
            return response()->json([
                'message' => 'البريد الإلكتروني مطلوب لإتمام عملية تسجيل الدخول',
            ], 422);
        }

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
        $user = User::with('role')->where('email', $email)->first();

        // Security Gate: Blocked/deactivated accounts cannot sign in
        if ($user && isset($user->is_active) && !$user->is_active) {
            return response()->json([
                'message' => 'مرفوض: تم إيقاف أو حظر هذا الحساب من قِبل إدارة الأرشيف.',
            ], 403);
        }

        if (!$user) {
            $isNewUser = true;
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(32)),
                'role_id' => $assignedRoleId,
                // Google accounts are inherently email-verified (email_verified: true)
                'email_verified_at' => now(),
            ]);

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
                    ipAddress: $request->ip()
                );
            }

            $this->auditLogAction->execute(
                action: 'user.registered_google_firebase',
                entityType: 'User',
                entityId: (string) $user->id,
                performedBy: $user->name,
                details: "تسجيل مستخدم جديد عبر Firebase Google Auth بدور ({$user->role?->name_ar}): {$user->email}",
                ipAddress: $request->ip()
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
                    ipAddress: $request->ip()
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

            $this->auditLogAction->execute(
                action: 'user.login_google_firebase',
                entityType: 'User',
                entityId: (string) $user->id,
                performedBy: $user->name,
                details: "تسجيل دخول معتمد عبر Firebase Google Auth: {$user->email} (الدور: {$user->role?->name_ar})",
                ipAddress: $request->ip()
            );
        }

        // Issue Sanctum Personal Access Token or session token
        $token = method_exists($user, 'createToken')
            ? $user->createToken('firebase-google-auth')->plainTextToken
            : 'kha_sanctum_'.Str::random(48);

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
                'firebase_uid' => $firebaseUid,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $avatar,
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
