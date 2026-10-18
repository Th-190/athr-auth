<?php

use Illuminate\Support\Str;

return [
    'driver' => env('SESSION_DRIVER', 'file'),
    'lifetime' => (int) env('SESSION_LIFETIME', 120),
    'expire_on_close' => env('SESSION_EXPIRE_AT_CLOSE', false),
    'encrypt' => env('SESSION_ENCRYPT', false),
    'files' => storage_path('framework/sessions'),
    'connection' => env('SESSION_CONNECTION'),
    'table' => env('SESSION_TABLE', 'sessions'),
    'store' => env('SESSION_STORE'),
    'lottery' => [2, 100],
    'cookie' => env(
        'SESSION_COOKIE',
        Str::slug(env('APP_NAME', 'karbala_heritage_archive'), '_').'_session'
    ),
    'path' => env('SESSION_PATH', '/'),
    'domain' => env('SESSION_DOMAIN'),
    // Secure cookie flag: true on production or when forced by env
    'secure' => env('SESSION_SECURE_COOKIE', env('APP_ENV') === 'production'),
    // HttpOnly cookie flag: always true to mitigate XSS cookie theft
    'http_only' => env('SESSION_HTTP_ONLY', true),
    // SameSite attribute: Lax or Strict to mitigate CSRF attacks
    'same_site' => env('SESSION_SAME_SITE', 'lax'),
    'partitioned' => env('SESSION_PARTITIONED_COOKIE', false),
];
