<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/** Server-side Supabase Storage REST client. Uses the Storage API, not S3 ACLs. */
class SupabaseStorage
{
    public function put(string $disk, string $path, string $contents, ?string $contentType = null, bool $upsert = false): bool
    {
        if (!$this->usesSupabase()) {
            return Storage::disk($disk)->put($path, $contents);
        }

        $response = $this->request()
            ->withHeaders([
                'Content-Type' => $contentType ?: 'application/octet-stream',
                'x-upsert' => $upsert ? 'true' : 'false',
            ])
            ->withBody($contents, $contentType ?: 'application/octet-stream')
            ->post($this->objectUrl($disk, $path));

        $response->throw();

        return $response->successful();
    }

    public function get(string $disk, string $path): string
    {
        if (!$this->usesSupabase()) {
            return Storage::disk($disk)->get($path);
        }

        return $this->request()->get($this->authenticatedObjectUrl($disk, $path))->throw()->body();
    }

    public function delete(string $disk, string $path): bool
    {
        if (!$this->usesSupabase()) {
            return Storage::disk($disk)->delete($path);
        }

        $bucket = $this->bucket($disk);
        $response = $this->request()->delete($this->baseUrl().'/object/'.rawurlencode($bucket), [
            'prefixes' => [$path],
        ]);

        $response->throw();

        return $response->successful();
    }

    public function exists(string $disk, string $path): bool
    {
        if (!$this->usesSupabase()) {
            return Storage::disk($disk)->exists($path);
        }

        $response = $this->request()->head($this->authenticatedObjectUrl($disk, $path));

        if ($response->status() === 404) {
            return false;
        }

        $response->throw();

        return $response->successful();
    }

    public function publicUrl(string $disk, string $path): string
    {
        if (!$this->usesSupabase()) {
            return Storage::disk($disk)->url($path);
        }

        return rtrim((string) config('services.supabase_storage.public_url'), '/')
            .'/storage/v1/object/public/'.rawurlencode($this->bucket($disk)).'/'.$this->encodePath($path);
    }

    private function request(): PendingRequest
    {
        $key = trim((string) config('services.supabase_storage.service_role_key'));
        if ($key === '') {
            throw new RuntimeException('SUPABASE_SERVICE_ROLE_KEY is not configured for server-side Storage access.');
        }

        return Http::acceptJson()
            ->withHeaders(['apikey' => $key])
            ->withToken($key)
            ->connectTimeout(10)
            ->timeout(60);
    }

    private function usesSupabase(): bool
    {
        return config('services.supabase_storage.driver') === 'supabase';
    }

    private function baseUrl(): string
    {
        $url = rtrim((string) config('services.supabase_storage.url'), '/');
        if ($url === '') {
            throw new RuntimeException('SUPABASE_URL is not configured for Storage access.');
        }

        return $url.'/storage/v1';
    }

    private function bucket(string $disk): string
    {
        $bucket = trim((string) config("services.supabase_storage.buckets.{$disk}"));
        if ($bucket === '') {
            throw new RuntimeException("Supabase Storage bucket for disk [{$disk}] is not configured.");
        }

        return $bucket;
    }

    private function objectUrl(string $disk, string $path): string
    {
        return $this->baseUrl().'/object/'.rawurlencode($this->bucket($disk)).'/'.$this->encodePath($path);
    }

    private function authenticatedObjectUrl(string $disk, string $path): string
    {
        return $this->baseUrl().'/object/authenticated/'.rawurlencode($this->bucket($disk)).'/'.$this->encodePath($path);
    }

    private function encodePath(string $path): string
    {
        return implode('/', array_map('rawurlencode', explode('/', ltrim($path, '/'))));
    }
}
