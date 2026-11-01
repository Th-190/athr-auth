<?php

return [
    'supabase_storage' => [
        'driver' => env('MEDIA_STORAGE_DRIVER', env('APP_ENV') === 'production' ? 'supabase' : 'local'),
        'url' => env('SUPABASE_URL'),
        'public_url' => env('SUPABASE_PUBLIC_URL', env('SUPABASE_URL')),
        'service_role_key' => env('SUPABASE_SERVICE_ROLE_KEY', env('SUPABASE_KEY')),
        'buckets' => [
            'originals' => env('SUPABASE_ORIGINALS_BUCKET', 'athr-originals'),
            'derivatives' => env('SUPABASE_DERIVATIVES_BUCKET', 'athr-derivatives'),
            'downloads' => env('SUPABASE_DOWNLOADS_BUCKET', 'athr-downloads'),
        ],
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL'),
    ],
];
