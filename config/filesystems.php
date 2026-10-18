<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Supported Drivers: "local", "ftp", "sftp", "s3"
    |
    | Non-Negotiable Architecture for «أثر كربلاء»:
    | 1. 'originals': Private, immutable, write-once disk. Never exposed publicly.
    | 2. 'derivatives': Public web/thumbnails, served strictly via CDN.
    | 3. 'downloads': Private, watermarked versions accessed via short-lived signed URLs.
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => false,
            'throw' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
        ],

        // 1. Originals Disk (Private, Write-Once, Immutable, Raw Unmodified Assets)
        'originals' => env('APP_ENV') === 'production' ? [
            'driver' => 's3',
            'key' => env('R2_ACCESS_KEY_ID'),
            'secret' => env('R2_SECRET_ACCESS_KEY'),
            'region' => env('R2_REGION', 'auto'),
            'bucket' => env('R2_BUCKET'),
            'url' => null, // NEVER publicly reachable
            'endpoint' => env('R2_ENDPOINT'),
            'use_path_style_endpoint' => env('R2_USE_PATH_STYLE_ENDPOINT', false),
            'visibility' => 'private',
            'throw' => true,
        ] : [
            'driver' => 'local',
            'root' => storage_path('app/originals'),
            'serve' => false,
            'visibility' => 'private',
            'throw' => true,
        ],

        // 2. Derivatives Disk (Optimized WebP/Thumbnails served via CDN)
        'derivatives' => env('APP_ENV') === 'production' ? [
            'driver' => 's3',
            'key' => env('R2_ACCESS_KEY_ID'),
            'secret' => env('R2_SECRET_ACCESS_KEY'),
            'region' => env('R2_REGION', 'auto'),
            'bucket' => env('CDN_DERIVATIVES_BUCKET'),
            'url' => env('CDN_URL'),
            'endpoint' => env('R2_ENDPOINT'),
            'use_path_style_endpoint' => env('R2_USE_PATH_STYLE_ENDPOINT', false),
            'visibility' => 'public',
            'throw' => true,
        ] : [
            'driver' => 'local',
            'root' => storage_path('app/derivatives'),
            'url' => env('APP_URL').'/storage/derivatives',
            'visibility' => 'public',
            'throw' => true,
        ],

        // 3. Downloads Disk (Watermarked versions, streamed or signed URLs)
        'downloads' => env('APP_ENV') === 'production' ? [
            'driver' => 's3',
            'key' => env('R2_ACCESS_KEY_ID'),
            'secret' => env('R2_SECRET_ACCESS_KEY'),
            'region' => env('R2_REGION', 'auto'),
            'bucket' => env('R2_BUCKET').'-downloads',
            'url' => null,
            'endpoint' => env('R2_ENDPOINT'),
            'use_path_style_endpoint' => env('R2_USE_PATH_STYLE_ENDPOINT', false),
            'visibility' => 'private',
            'throw' => true,
        ] : [
            'driver' => 'local',
            'root' => storage_path('app/downloads'),
            'serve' => false,
            'visibility' => 'private',
            'throw' => true,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
