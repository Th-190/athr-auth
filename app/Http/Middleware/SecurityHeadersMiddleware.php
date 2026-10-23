<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request and attach hardened security headers.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // L1: Content-Security-Policy (Report-Only initially to prevent unintended breakage of scripts/fonts)
        $csp = "default-src 'self'; " .
               "script-src 'self' 'wasm-unsafe-eval'; " .
               "style-src 'self' https://fonts.googleapis.com https://unpkg.com; " .
               "font-src 'self' https://fonts.gstatic.com data:; " .
               "img-src 'self' blob: data: https:; " .
               "connect-src 'self' blob: data: https:; " .
               "frame-ancestors 'none'; " .
               "base-uri 'self'; " .
               "form-action 'self';";

        $response->headers->set('Content-Security-Policy-Report-Only', $csp);

        // Clickjacking defense
        $response->headers->set('X-Frame-Options', 'DENY');

        // MIME-type sniffing defense
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Referrer policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Feature & Permissions policy
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

        // Cross-domain policies
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');

        // HSTS (HTTP Strict Transport Security) on HTTPS or production
        if ($request->isSecure() || app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
