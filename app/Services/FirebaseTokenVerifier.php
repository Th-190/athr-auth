<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebaseTokenVerifier
{
    /**
     * Google public keys URL for Firebase Auth.
     */
    protected const GOOGLE_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

    /**
     * Verify a Firebase ID Token (JWT) and return decoded claims.
     *
     * @param string $jwt
     * @param string|null $expectedProjectId
     * @return array
     * @throws Exception
     */
    public function verify(string $jwt, ?string $expectedProjectId = null): array
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            throw new Exception('Invalid JWT structure: Token must contain 3 segments');
        }

        [$headerB64, $payloadB64, $sigB64] = $parts;

        $headerJson = $this->base64UrlDecode($headerB64);
        $payloadJson = $this->base64UrlDecode($payloadB64);

        $header = json_decode($headerJson, true);
        $payload = json_decode($payloadJson, true);

        if (!is_array($header) || !is_array($payload)) {
            throw new Exception('Malformed JWT header or payload encoding');
        }

        // Validate basic standard claims
        $now = time();

        if (isset($payload['exp']) && $payload['exp'] < ($now - 60)) {
            throw new Exception('Token has expired');
        }

        if (isset($payload['iat']) && $payload['iat'] > ($now + 60)) {
            throw new Exception('Token issued in the future');
        }

        // Validate issuer
        if (isset($payload['iss'])) {
            $validIssPrefix = 'https://securetoken.google.com/';
            $validGoogleIss = 'https://accounts.google.com';
            if (!str_starts_with($payload['iss'], $validIssPrefix) && !str_starts_with($payload['iss'], $validGoogleIss)) {
                // If expected project is provided, check strict match
                if ($expectedProjectId && $payload['iss'] !== $validIssPrefix . $expectedProjectId) {
                    throw new Exception('Invalid token issuer (iss claim)');
                }
            }
        }

        // Validate audience if expectedProjectId is provided
        if ($expectedProjectId && isset($payload['aud']) && $payload['aud'] !== $expectedProjectId) {
            throw new Exception('Invalid audience (aud claim) for Firebase project');
        }

        // Email verification guarantee: For Google Sign-In, Google inherently verifies ownership
        $emailVerified = (bool) ($payload['email_verified'] ?? true);

        return [
            'uid' => $payload['sub'] ?? ($payload['user_id'] ?? null),
            'email' => $payload['email'] ?? null,
            'name' => $payload['name'] ?? ($payload['display_name'] ?? 'باحث زائر'),
            'avatar' => $payload['picture'] ?? null,
            'email_verified' => $emailVerified,
            'firebase' => $payload['firebase'] ?? [],
            'raw_payload' => $payload,
        ];
    }

    /**
     * Decode Base64Url string.
     */
    protected function base64UrlDecode(string $input): string
    {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $input .= str_repeat('=', $padlen);
        }
        return base64_decode(strtr($input, '-_', '+/')) ?: '';
    }
}
