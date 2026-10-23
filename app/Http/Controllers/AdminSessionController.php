<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\AdminAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\View\View;

class AdminSessionController extends Controller
{
    public function show(Request $request): View|RedirectResponse
    {
        if ($request->user() && AdminAccess::isStaff($request->user())) {
            return redirect('/admin');
        }

        return view('admin.login', [
            'adminEmailConfigured' => filled(config('archive.admin_email')),
        ]);
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
            return back()->withErrors([
                'email' => 'محاولات كثيرة. انتظر قبل المحاولة مجدداً.',
            ])->onlyInput('email')->setStatusCode(429);
        }

        $designatedEmail = strtolower(trim((string) config('archive.admin_email')));
        $user = User::with('role')->whereRaw('LOWER(email) = ?', [$email])->first();
        $role = strtolower($user?->role?->name ?? '');
        $allowedStaffLogin = $role === 'editor'
            || ($designatedEmail !== '' && hash_equals($designatedEmail, $email)
                && AdminAccess::isDesignatedAdministrator($user));

        $validUser = $user && $allowedStaffLogin
            && (bool) $user->is_active
            && Hash::check($validated['password'], $user->password);

        // Editors retain staff access, but the designated identity is the only
        // administrator account allowed to authenticate through this form.
        if (!$validUser) {
            RateLimiter::hit($key, 60);

            return back()->withErrors([
                'email' => 'بيانات الدخول غير صحيحة أو الحساب غير مخول.',
            ])->onlyInput('email');
        }

        RateLimiter::clear($key);
        Auth::guard('web')->login($user, false);
        $request->session()->regenerate();
        $request->session()->forget('admin_step_up_at');

        return redirect()->intended('/admin');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
