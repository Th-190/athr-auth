<?php

return [
    'default' => env('FILESYSTEM_DISK', 'local'),

    // Media production traffic uses App\Services\SupabaseStorage and Supabase's
    // Storage REST API. These local disks are for local development and tests.
    'disks' => [
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => false,
            'throw' => true,
        ],
        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => true,
        ],
        'originals' => [
            'driver' => 'local',
            'root' => storage_path('app/originals'),
            'serve' => false,
            'visibility' => 'private',
            'throw' => true,
        ],
        'derivatives' => [
            'driver' => 'local',
            'root' => storage_path('app/public/derivatives'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage/derivatives',
            'visibility' => 'public',
            'throw' => true,
        ],
        'downloads' => [
            'driver' => 'local',
            'root' => storage_path('app/downloads'),
            'serve' => false,
            'visibility' => 'private',
            'throw' => true,
        ],
    ],

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],
];
