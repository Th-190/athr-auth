<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\User;
use App\Support\AdminAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;

class AuthController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction
    ) {}

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
                'two_factor_enabled' => !is_null($user->two_factor_confirmed_at),
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
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم إنهاء الجلسة بنجاح',
        ]);
    }

    public function setupTwoFactor(Request $request, \App\Services\TotpService $totp): JsonResponse
    {
        $validated = $request->validate(['current_password' => 'required|string|max:1024']);
        $user = $request->user();
        abort_unless($this->isAdministrator($user), 403);
        abort_if($user->two_factor_confirmed_at, 409, 'المصادقة الثنائية مفعلة بالفعل.');
        abort_unless(Hash::check($validated['current_password'], $user->password), 401, 'كلمة المرور غير صحيحة.');

        $secret = $totp->generateSecret();
        $user->forceFill(['two_factor_secret' => 'enc:'.Crypt::encryptString($secret)])->save();
        $this->auditLogAction->execute(
            action: 'user.two_factor_setup_started', entityType: 'User', entityId: (string) $user->id,
            performedBy: $user->name, details: 'بدء إعداد المصادقة الثنائية لحساب إداري.',
            ipAddress: $request->ip(), performedById: $user->id
        );
        return response()->json(['secret' => $secret, 'otpauth_uri' => 'otpauth://totp/'.rawurlencode('Athr:'.$user->email).'?secret='.$secret.'&issuer=Athr&algorithm=SHA1&digits=6&period=30']);
    }

    public function confirmTwoFactor(Request $request, \App\Services\TotpService $totp): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'regex:/^\\d{6}$/']]);
        $user = $request->user();
        abort_unless($this->isAdministrator($user), 403);
        $secret = $this->twoFactorSecret($user);
        abort_unless($secret && $totp->verify($secret, $data['code']), 422, 'رمز المصادقة الثنائية غير صحيح.');
        $user->forceFill(['two_factor_confirmed_at' => now()])->save();
        abort_unless($this->markStepUp($request, $user), 401, 'يلزم استخدام جلسة مصادق عليها.');
        $this->auditLogAction->execute(
            action: 'user.two_factor_enabled', entityType: 'User', entityId: (string) $user->id,
            performedBy: $user->name, details: 'تأكيد تفعيل المصادقة الثنائية لحساب إداري.',
            ipAddress: $request->ip(), performedById: $user->id
        );
        return response()->json(['message' => 'تم تفعيل المصادقة الثنائية والتحقق من الرمز.']);
    }

    public function verifyTwoFactor(Request $request, \App\Services\TotpService $totp): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'regex:/^\\d{6}$/']]);
        $user = $request->user();
        abort_unless($this->isAdministrator($user) && $user->two_factor_confirmed_at, 403);
        $secret = $this->twoFactorSecret($user);
        abort_unless($secret && $totp->verify($secret, $data['code']), 422, 'رمز المصادقة الثنائية غير صحيح.');
        abort_unless($this->markStepUp($request, $user), 401, 'يلزم استخدام جلسة مصادق عليها.');
        $this->auditLogAction->execute(
            action: 'user.two_factor_step_up', entityType: 'User', entityId: (string) $user->id,
            performedBy: $user->name, details: 'تم التحقق من المصادقة الثنائية للعمليات الإدارية.',
            ipAddress: $request->ip(), performedById: $user->id
        );
        return response()->json(['message' => 'تم التحقق. صلاحية التحقق الإداري عشر دقائق.']);
    }

    private function isAdministrator(User $user): bool
    {
        return (bool) $user->is_active && AdminAccess::isDesignatedAdministrator($user);
    }

    private function twoFactorSecret(User $user): ?string
    {
        $stored = $user->two_factor_secret;
        if (!is_string($stored) || $stored === '') return null;
        if (str_starts_with($stored, 'enc:')) {
            try { return Crypt::decryptString(substr($stored, 4)); } catch (\Throwable) { return null; }
        }

        // Support previously encrypted Laravel/Fortify secrets while new setup uses a tagged value.
        try { return Crypt::decryptString($stored); } catch (\Throwable) {}
        return preg_match('/^[A-Z2-7]+=*$/i', $stored) ? strtoupper(rtrim($stored, '=')) : null;
    }

    private function markStepUp(Request $request, User $user): bool
    {
        $token = $user->currentAccessToken();
        if ($token && method_exists($token, 'forceFill')) {
            $token->forceFill(['two_factor_verified_at' => now()])->save();
            return true;
        }
        if ($request->hasSession()) {
            $request->session()->put('admin_step_up_at', now()->timestamp);
            return true;
        }
        return false;
    }
}
