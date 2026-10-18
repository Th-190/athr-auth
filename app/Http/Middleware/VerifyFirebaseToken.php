<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\FirebaseTokenVerifier;
use Closure;
use Exception;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyFirebaseToken
{
    public function __construct(
        protected FirebaseTokenVerifier $verifier
    ) {}

    /**
     * Handle an incoming request with Firebase ID Token Bearer.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'message' => 'غير مصرح: يرجى إرسال رمز المصادقة (Bearer Token)',
            ], 401);
        }

        $token = substr($authHeader, 7);

        try {
            $claims = $this->verifier->verify($token);

            if (empty($claims['email'])) {
                return response()->json([
                    'message' => 'رمز المصادقة لا يحتوي على بريد إلكتروني صالح',
                ], 401);
            }

            // Find user in PostgreSQL
            $user = User::with('role')->where('email', strtolower($claims['email']))->first();

            if (!$user) {
                return response()->json([
                    'message' => 'المستخدم غير مسجل في النظام',
                ], 401);
            }

            // Set user in request
            $request->setUserResolver(fn () => $user);

            return $next($request);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'رمز المصادقة غير صالح أو منتهي الصلاحية: ' . $e->getMessage(),
            ], 401);
        }
    }
}
