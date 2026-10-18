<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\FirebaseTokenVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Mockery;
use Tests\TestCase;

class FirebaseIdentityTest extends TestCase
{
    use RefreshDatabase;

    public function test_repeated_google_sign_ins_resolve_to_one_database_user(): void
    {
        Role::firstOrCreate(['name' => 'contributor'], ['name_ar' => 'مساهم']);
        $claims = [
            'uid' => 'firebase-google-subject-123',
            'email' => 'account@example.com',
            'name' => 'Researcher',
            'avatar' => null,
            'email_verified' => true,
            'firebase' => ['sign_in_provider' => 'google.com'],
        ];
        $verifier = Mockery::mock(FirebaseTokenVerifier::class);
        $verifier->shouldReceive('verify')->twice()->with('valid-firebase-token')->andReturn($claims);
        $this->app->instance(FirebaseTokenVerifier::class, $verifier);

        $first = $this->postJson('/api/v1/auth/google', [
            'id_token' => 'valid-firebase-token',
            'email' => 'attacker@example.com',
            'google_id' => 'attacker-controlled-id',
        ])->assertOk();
        $firstUserId = $first->json('user.id');
        $first->assertJsonPath('user.email', 'account@example.com');

        $second = $this->postJson('/api/v1/auth/google', ['id_token' => 'valid-firebase-token'])->assertOk();
        $this->assertSame($firstUserId, $second->json('user.id'));
        $this->assertSame(1, User::where('google_id', 'firebase-google-subject-123')->count());
        $this->assertDatabaseHas('users', ['id' => $firstUserId, 'google_id' => 'firebase-google-subject-123']);
    }

    public function test_firebase_verifier_checks_signature_audience_and_verified_email(): void
    {
        config(['services.firebase.project_id' => 'archive-test-project']);
        $key = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_RSA, 'private_key_bits' => 2048]);
        $request = openssl_csr_new(['commonName' => 'firebase-test'], $key);
        $certificate = openssl_csr_sign($request, null, $key, 1);
        openssl_x509_export($certificate, $certificatePem);
        openssl_pkey_export($key, $privateKeyPem);
        $kid = 'test-key-1';
        Http::fake(['https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com' => Http::response([$kid => $certificatePem])]);

        $payload = [
            'iss' => 'https://securetoken.google.com/archive-test-project',
            'aud' => 'archive-test-project',
            'sub' => 'google-subject',
            'email' => 'person@example.com',
            'email_verified' => true,
            'firebase' => ['sign_in_provider' => 'google.com'],
            'iat' => time(),
            'exp' => time() + 600,
        ];
        $token = $this->signToken($payload, $kid, $privateKeyPem);
        $verifier = app(FirebaseTokenVerifier::class);
        $this->assertSame('google-subject', $verifier->verify($token)['uid']);

        foreach ([
            array_merge($payload, ['email_verified' => false]),
            array_merge($payload, ['aud' => 'another-project']),
        ] as $invalidClaims) {
            $rejected = false;
            try {
                $verifier->verify($this->signToken($invalidClaims, $kid, $privateKeyPem));
            } catch (\Exception) {
                $rejected = true;
            }
            $this->assertTrue($rejected, 'Invalid Firebase claims must be rejected.');
        }

        $parts = explode('.', $token);
        $parts[2] = rtrim(strtr(base64_encode('invalid-signature'), '+/', '-_'), '=');
        $this->expectException(\Exception::class);
        $verifier->verify(implode('.', $parts));
    }

    private function signToken(array $payload, string $kid, string $privateKey): string
    {
        $encode = fn (string $value): string => rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
        $header = $encode(json_encode(['alg' => 'RS256', 'kid' => $kid]));
        $body = $encode(json_encode($payload));
        openssl_sign($header.'.'.$body, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        return $header.'.'.$body.'.'.$encode($signature);
    }
}
