<?php

namespace App\Http\Middleware;

use App\Support\AdminAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user() ?? auth('sanctum')->user();
        if ($user) {
            $request->setUserResolver(fn () => $user);
        }

        if (!$user) {
            return response()->json([
                'message' => 'غير مصرح: يجب تسجيل الدخول للوصول إلى لوحة الإدارة',
            ], 401);
        }

        if (isset($user->is_active) && !$user->is_active) {
            return response()->json([
                'message' => 'الحساب معطل من قِبل إدارة الأرشيف. تم إلغاء الجلسة.',
            ], 403);
        }

        $roleName = strtolower($user->role?->name ?? '');

        if ($roleName !== 'admin' && $roleName !== 'super_admin') {
            return response()->json([
                'message' => 'مرفوض: هذه الصفحة والعمليات مخصصة لمديري النظام فقط (403 Forbidden)',
            ], 403);
        }

        if (!AdminAccess::isDesignatedAdministrator($user)) {
            return response()->json(['message' => 'مرفوض: هذا الحساب ليس المدير المحدد للأرشيف.'], 403);
        }

        if (config('auth.require_admin_2fa', !app()->environment('testing'))) {
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
