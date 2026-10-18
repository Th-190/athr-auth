<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use App\Models\SiteImage;
use App\Models\MediaHash;
use RuntimeException;

class ProcessImageDerivativeJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [30, 120, 300];

    public function __construct(
        public string $originalStoragePath,
        public string $siteSlug,
        public string $imageUlid
    ) {}

    public function handle(): void
    {
        $image = SiteImage::where('ulid', $this->imageUlid)->firstOrFail();
        if (!$image->hasClearedRightsForPublic()) {
            return;
        }

        $source = Storage::disk('originals')->get($this->originalStoragePath);
        $bitmap = @imagecreatefromstring($source);
        if (!$bitmap) {
            throw new RuntimeException('Unsupported image data; derivative generation failed.');
        }

        $width = imagesx($bitmap);
        $height = imagesy($bitmap);
        $web = $this->resize($bitmap, 1600);
        $thumb = $this->resize($bitmap, 480);
        imagedestroy($bitmap);

        $webPath = "sites/{$this->siteSlug}/web/{$this->imageUlid}.jpg";
        $thumbPath = "sites/{$this->siteSlug}/thumb/{$this->imageUlid}.jpg";
        $downloadPath = "sites/{$this->siteSlug}/download/{$this->imageUlid}_watermarked.jpg";
        foreach ([[$webPath, $web], [$thumbPath, $thumb]] as [$path, $resource]) {
            ob_start();
            imagejpeg($resource, null, 84);
            $bytes = ob_get_clean();
            imagedestroy($resource);
            if (!Storage::disk('derivatives')->put($path, $bytes)) {
                throw new RuntimeException('Derivative storage failed.');
            }
            MediaHash::updateOrCreate(
                ['site_image_id' => $image->id, 'file_version' => $path === $webPath ? 'web' : 'thumbnail'],
                ['hash_value' => hash('sha256', $bytes), 'hash_algorithm' => 'sha256', 'file_size_bytes' => strlen($bytes), 'verified_at' => now()]
            );
        }

        $watermarked = $this->resizeFromBytes(Storage::disk('derivatives')->get($webPath), 1600);
        $label = 'Karbala Heritage Archive';
        $textWidth = imagefontwidth(3) * strlen($label);
        imagestring($watermarked, 3, max(8, imagesx($watermarked) - $textWidth - 12), max(8, imagesy($watermarked) - 24), $label, imagecolorallocatealpha($watermarked, 255, 255, 255, 20));
        ob_start();
        imagejpeg($watermarked, null, 88);
        $downloadBytes = ob_get_clean();
        imagedestroy($watermarked);
        if (!Storage::disk('downloads')->put($downloadPath, $downloadBytes)) {
            throw new RuntimeException('Private download derivative storage failed.');
        }

        // Rights can be revoked while a worker is processing. Re-check the current
        // database state before publishing any derivative paths to API responses.
        $image->refresh();
        if (!$image->hasClearedRightsForPublic()) {
            foreach ([['derivatives', $webPath], ['derivatives', $thumbPath], ['downloads', $downloadPath]] as [$disk, $path]) {
                try {
                    Storage::disk($disk)->delete($path);
                } catch (\Throwable) {
                    // A takedown must not fail open; the database still does not expose these paths.
                }
            }
            $image->hashes()->whereIn('file_version', ['web', 'thumbnail', 'download'])->delete();
            return;
        }

        $image->update([
            'width' => $width,
            'height' => $height,
            'web_storage_path' => $webPath,
            'thumb_storage_path' => $thumbPath,
            'download_storage_path' => $downloadPath,
        ]);
        MediaHash::updateOrCreate(
            ['site_image_id' => $image->id, 'file_version' => 'download'],
            ['hash_value' => hash('sha256', $downloadBytes), 'hash_algorithm' => 'sha256', 'file_size_bytes' => strlen($downloadBytes), 'verified_at' => now()]
        );
    }

    private function resizeFromBytes(string $bytes, int $maxDimension): \GdImage
    {
        $image = @imagecreatefromstring($bytes);
        if (!$image) {
            throw new RuntimeException('Could not read generated web image.');
        }
        return $this->resize($image, $maxDimension);
    }

    private function resize(\GdImage $source, int $maxDimension): \GdImage
    {
        $sourceWidth = imagesx($source);
        $sourceHeight = imagesy($source);
        $scale = min(1, $maxDimension / max($sourceWidth, $sourceHeight));
        $target = imagecreatetruecolor(max(1, (int) round($sourceWidth * $scale)), max(1, (int) round($sourceHeight * $scale)));
        $white = imagecolorallocate($target, 255, 255, 255);
        imagefill($target, 0, 0, $white);
        imagecopyresampled($target, $source, 0, 0, 0, 0, imagesx($target), imagesy($target), $sourceWidth, $sourceHeight);
        return $target;
    }
}
