<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\AdminAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user() ?? auth('sanctum')->user();
        if ($user) {
            $request->setUserResolver(fn () => $user);
        }

        if (!$user) {
            return response()->json([
                'message' => 'غير مصرح: يجب تسجيل الدخول',
            ], 401);
        }

        if (isset($user->is_active) && !$user->is_active) {
            return response()->json([
                'message' => 'الحساب معطل من قِبل إدارة الأرشيف.',
            ], 403);
        }

        $roleName = strtolower($user->role?->name ?? '');

        if (!in_array($roleName, ['admin', 'super_admin', 'editor'])) {
            return response()->json([
                'message' => 'مرفوض: ليس لديك صلاحية الوصول إلى هذه الوظيفة التحريرية (403 Forbidden)',
            ], 403);
        }

        if ($roleName === 'super_admin' && !AdminAccess::isSuperAdministrator($user)) {
            return response()->json(['message' => 'مرفوض: حساب المدير العام غير نشط أو غير صالح.'], 403);
        }
        if ($roleName === 'admin' && !AdminAccess::isDesignatedAdministrator($user)) {
            return response()->json(['message' => 'مرفوض: هذا الحساب ليس المدير المحدد للأرشيف.'], 403);
        }

        if (in_array($roleName, ['admin', 'super_admin'], true) && config('auth.require_admin_2fa', !app()->environment('testing'))) {
            $token = $user->currentAccessToken();
            $verifiedAt = $request->hasSession() ? $request->session()->get('admin_step_up_at') : null;
            if (!$verifiedAt && $token && method_exists($token, 'getAttribute')) {
                $verifiedAt = $token->getAttribute('two_factor_verified_at');
            }
            $recentlyVerified = $verifiedAt && now()->subMinutes(10)->lt(\Illuminate\Support\Carbon::parse($verifiedAt));
            if (!$user->two_factor_confirmed_at || !$recentlyVerified) {
                return response()->json([
                    'message' => 'يتطلب الوصول الإداري تحققاً حديثاً من المصادقة الثنائية.',
                    'requires_2fa' => true,
                    'requires_step_up' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}
