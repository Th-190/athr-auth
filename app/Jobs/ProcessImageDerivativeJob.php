<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessImageDerivativeJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $originalStoragePath,
        public string $siteSlug,
        public string $imageUlid
    ) {}

    public function handle(): void
    {
        // 1. Sniff MIME type using finfo
        // 2. Compute SHA-256 hash of original
        // 3. Strip EXIF GPS metadata for derivatives
        // 4. Generate WebP/AVIF web derivative and thumbnails
        // 5. Generate watermarked download derivative
        // 6. Push derivatives to CDN storage disk
    }
}
