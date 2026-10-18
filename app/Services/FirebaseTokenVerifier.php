<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class FirebaseTokenVerifier
{
    private const GOOGLE_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

    /** @return array{uid:string,email:string,name:string,avatar:?string,email_verified:bool,firebase:array} */
    public function verify(string $jwt, ?string $expectedProjectId = null): array
    {
        $projectId = $expectedProjectId ?: config('services.firebase.project_id');
        if (!$projectId) {
            throw new Exception('Firebase project ID is not configured.');
        }

        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            throw new Exception('Invalid Firebase ID token.');
        }

        [$headerPart, $payloadPart, $signaturePart] = $parts;
        $header = json_decode($this->decode($headerPart), true);
        $payload = json_decode($this->decode($payloadPart), true);
        $signature = $this->decode($signaturePart);
        if (!is_array($header) || !is_array($payload) || ($header['alg'] ?? null) !== 'RS256' || empty($header['kid'])) {
            throw new Exception('Invalid Firebase token header.');
        }

        $certificates = Cache::remember('firebase.id_token_certificates', now()->addMinutes(50), function (): array {
            $response = Http::timeout(5)->get(self::GOOGLE_CERT_URL);
            if (!$response->successful()) {
                throw new Exception('Unable to retrieve Firebase signing certificates.');
            }
            return $response->json();
        });
        $certificate = $certificates[$header['kid']] ?? null;
        if (!$certificate || openssl_verify($headerPart.'.'.$payloadPart, $signature, $certificate, OPENSSL_ALGO_SHA256) !== 1) {
            throw new Exception('Firebase token signature is invalid.');
        }

        $now = time();
        if (($payload['iss'] ?? null) !== 'https://securetoken.google.com/'.$projectId
            || ($payload['aud'] ?? null) !== $projectId
            || !isset($payload['exp'], $payload['iat'], $payload['sub'])
            || !is_numeric($payload['exp']) || (int) $payload['exp'] <= $now
            || !is_numeric($payload['iat']) || (int) $payload['iat'] > $now + 60
            || (int) $payload['iat'] < $now - 3600
            || !is_string($payload['sub']) || $payload['sub'] === '' || strlen($payload['sub']) > 128
            || !filter_var($payload['email'] ?? null, FILTER_VALIDATE_EMAIL)
            || ($payload['email_verified'] ?? false) !== true) {
            throw new Exception('Firebase token claims are invalid or the email is unverified.');
        }

        return [
            'uid' => $payload['sub'],
            'email' => strtolower($payload['email']),
            'name' => $payload['name'] ?? 'باحث زائر',
            'avatar' => $payload['picture'] ?? null,
            'email_verified' => true,
            'firebase' => is_array($payload['firebase'] ?? null) ? $payload['firebase'] : [],
        ];
    }

    private function decode(string $value): string
    {
        $decoded = base64_decode(strtr($value, '-_', '+/').str_repeat('=', (4 - strlen($value) % 4) % 4), true);
        if ($decoded === false) {
            throw new Exception('Malformed Firebase token encoding.');
        }
        return $decoded;
    }
}
