<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\AdminAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class AdminSessionController extends Controller
{
    public function show(Request $request): Response
    {
        if ($request->user() && AdminAccess::isStaff($request->user())) {
            return $this->preventCaching(redirect('/admin'));
        }

        return $this->preventCaching(response()->view('admin.login', [
            'adminEmailConfigured' => filled(config('archive.admin_email')),
        ]));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:1024'],
        ]);

        $email = strtolower(trim($validated['email']));
        $key = 'archive-admin-login:'.strtolower($request->ip() ?? 'unknown').'|'.$email;

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return $this->preventCaching(back()->withErrors([
                'email' => 'محاولات كثيرة. انتظر قبل المحاولة مجدداً.',
            ])->onlyInput('email')->setStatusCode(429));
        }

        $user = User::with('role')->whereRaw('LOWER(email) = ?', [$email])->first();
        $role = strtolower($user?->role?->name ?? '');
        $designatedEmail = strtolower(trim((string) config('archive.admin_email')));
        $allowedStaffLogin = $user !== null
            && ($role === 'editor'
                || AdminAccess::isSuperAdministrator($user)
                || ($role === 'admin' && $designatedEmail !== '' && hash_equals($designatedEmail, $email)
                    && AdminAccess::isDesignatedAdministrator($user)));

        $validUser = $user && $allowedStaffLogin
            && (bool) $user->is_active
            && Hash::check($validated['password'], $user->password);

        // Editors and each active Super Admin authenticate independently. A legacy
        // admin role remains limited to the configured recovery identity.
        if (!$validUser) {
            RateLimiter::hit($key, 60);

            return $this->preventCaching(back()->withErrors([
                'email' => 'بيانات الدخول غير صحيحة أو الحساب غير مخول.',
            ])->onlyInput('email'));
        }

        RateLimiter::clear($key);
        Auth::guard('web')->login($user, false);
        $request->session()->regenerate();
        $request->session()->forget('admin_step_up_at');

        return $this->preventCaching(redirect()->intended('/admin'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->preventCaching(redirect()->route('login'));
    }

    private function preventCaching(Response $response): Response
    {
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        return $response;
    }
}
