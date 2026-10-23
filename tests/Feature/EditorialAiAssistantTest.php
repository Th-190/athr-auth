<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

function aiEditorialUser(string $roleName): User
{
    $role = Role::firstOrCreate(['name' => $roleName], ['name_ar' => $roleName]);

    return User::create([
        'name' => 'AI Editorial Test',
        'email' => 'ai-'.$roleName.'@example.test',
        'password' => 'safe-test-password',
        'role_id' => $role->id,
        'email_verified_at' => now(),
        'is_active' => true,
    ]);
}

function aiEditorialPayload(): array
{
    return [
        'record_type' => 'site',
        'title' => 'Test archaeological site',
        'sources' => [[
            'citation_id' => 'S1',
            'title' => 'Test source',
            'reference' => 'Archive catalogue A-1',
            'excerpt' => 'A sufficiently long source excerpt supplied by the reviewer.',
        ]],
    ];
}

test('editorial AI endpoint requires a server-authorized staff account', function () {
    $this->postJson('/api/v1/admin/editorial/ai-assist', aiEditorialPayload())->assertUnauthorized();

    $viewer = aiEditorialUser('viewer');
    $this->actingAs($viewer)->postJson('/api/v1/admin/editorial/ai-assist', aiEditorialPayload())->assertForbidden();
});

test('editorial AI uses the backend key and returns only a non-persistent human-review suggestion', function () {
    config(['services.gemini.api_key' => 'test-only-secret', 'services.gemini.model' => 'gemini-test-model']);
    $providerText = json_encode([
        'summary_ar' => 'ملخص مقيد بالمصدر',
        'summary_en' => 'Source-bound summary',
        'uncertainty_notes' => 'The excerpt is limited.',
        'citations_used' => ['S1', 'UNTRUSTED'],
    ]);
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [[
                'content' => [
                    'parts' => [['text' => $providerText]],
                ],
            ]],
        ]),
    ]);

    $editor = aiEditorialUser('editor');
    $response = $this->actingAs($editor)->postJson('/api/v1/admin/editorial/ai-assist', aiEditorialPayload())
        ->assertOk()
        ->assertJsonPath('ai_assisted', true)
        ->assertJsonPath('requires_human_review', true)
        ->assertJsonPath('data.citations_used', ['S1']);

    expect($response->json())->not->toHaveKey('record');
    Http::assertSent(fn (Request $request): bool => $request->hasHeader('x-goog-api-key', 'test-only-secret')
        && !str_contains($request->url(), 'test-only-secret')
        && str_contains($request->url(), 'gemini-test-model'));
});

test('editorial AI validates source excerpts and fails closed when the backend key is missing', function () {
    $editor = aiEditorialUser('editor');

    $this->actingAs($editor)->postJson('/api/v1/admin/editorial/ai-assist', [
        ...aiEditorialPayload(),
        'sources' => [],
    ])->assertUnprocessable();

    config(['services.gemini.api_key' => null]);
    $this->actingAs($editor)->postJson('/api/v1/admin/editorial/ai-assist', aiEditorialPayload())
        ->assertServiceUnavailable()
        ->assertJsonMissingPath('data');
});

test('editorial AI does not trust or echo provider failures or malformed output', function () {
    config(['services.gemini.api_key' => 'test-only-secret']);
    Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['error' => ['message' => 'secret diagnostic']], 429)]);

    $editor = aiEditorialUser('editor');
    $this->actingAs($editor)->postJson('/api/v1/admin/editorial/ai-assist', aiEditorialPayload())
        ->assertServiceUnavailable()
        ->assertJsonMissing(['message' => 'secret diagnostic']);
});
