<?php

namespace App\Http\Middleware;

use App\Models\User;
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

        return $next($request);
    }
}
