<?php

$mediaStorageProvider = env('MEDIA_STORAGE_PROVIDER', 'supabase');
$useSupabaseStorage = $mediaStorageProvider === 'supabase';
$originalsBucket = env($useSupabaseStorage ? 'SUPABASE_ORIGINALS_BUCKET' : 'R2_ORIGINALS_BUCKET', $useSupabaseStorage ? 'athr-originals' : env('R2_BUCKET'));
$derivativesBucket = env($useSupabaseStorage ? 'SUPABASE_DERIVATIVES_BUCKET' : 'CDN_DERIVATIVES_BUCKET', $useSupabaseStorage ? 'athr-derivatives' : null);
$downloadsBucket = env($useSupabaseStorage ? 'SUPABASE_DOWNLOADS_BUCKET' : 'R2_DOWNLOADS_BUCKET', $useSupabaseStorage ? 'athr-downloads' : (env('R2_BUCKET') ? env('R2_BUCKET').'-downloads' : null));
$supabaseUrl = rtrim((string) env('SUPABASE_URL', ''), '/');
$supabasePublicUrl = rtrim((string) env('SUPABASE_PUBLIC_URL', $supabaseUrl), '/');
$supabaseS3 = $useSupabaseStorage ? [
    'driver' => 's3',
    'key' => env('SUPABASE_S3_ACCESS_KEY_ID'),
    'secret' => env('SUPABASE_S3_SECRET_ACCESS_KEY'),
    'region' => env('SUPABASE_S3_REGION', 'eu-west-1'),
    'endpoint' => env('SUPABASE_S3_ENDPOINT'),
    'use_path_style_endpoint' => true,
    'throw' => true,
] : [
    'driver' => 's3',
    'key' => env('R2_ACCESS_KEY_ID'),
    'secret' => env('R2_SECRET_ACCESS_KEY'),
    'region' => env('R2_REGION', 'auto'),
    'endpoint' => env('R2_ENDPOINT'),
    'use_path_style_endpoint' => env('R2_USE_PATH_STYLE_ENDPOINT', false),
    'throw' => true,
];
$configuredCdnUrl = trim((string) env('CDN_URL', ''));
$cloudDerivativesUrl = $configuredCdnUrl !== ''
    ? $configuredCdnUrl
    : ($useSupabaseStorage && $supabasePublicUrl !== ''
        ? $supabasePublicUrl.'/storage/v1/object/public/'.$derivativesBucket
        : null);

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
        'originals' => env('APP_ENV') === 'production' ? array_merge($supabaseS3, [
            'bucket' => $originalsBucket,
            'url' => null, // NEVER publicly reachable
            'visibility' => 'private',
        ]) : [
            'driver' => 'local',
            'root' => storage_path('app/originals'),
            'serve' => false,
            'visibility' => 'private',
            'throw' => true,
        ],

        // 2. Derivatives Disk (Optimized WebP/Thumbnails served via CDN)
        'derivatives' => env('APP_ENV') === 'production' ? array_merge($supabaseS3, [
            'bucket' => $derivativesBucket,
            'url' => $cloudDerivativesUrl,
            'visibility' => 'public',
        ]) : [
            'driver' => 'local',
            'root' => storage_path('app/public/derivatives'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage/derivatives',
            'visibility' => 'public',
            'throw' => true,
        ],

        // 3. Downloads Disk (Watermarked versions, streamed or signed URLs)
        'downloads' => env('APP_ENV') === 'production' ? array_merge($supabaseS3, [
            'bucket' => $downloadsBucket,
            'url' => null,
            'visibility' => 'private',
        ]) : [
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
