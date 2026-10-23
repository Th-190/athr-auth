<?php

use App\Enums\PublicationStatus;
use App\Models\EncyclopediaEntry;
use App\Models\Role;
use App\Models\Site;
use App\Models\Source;
use App\Models\User;
use App\Services\TotpService;
use Illuminate\Support\Facades\Artisan;

beforeEach(function (): void {
    Artisan::call('db:seed', ['--class' => Database\Seeders\DatabaseSeeder::class, '--force' => true]);
    Artisan::call('db:seed', ['--class' => Database\Seeders\HeritageSitesSeeder::class, '--force' => true]);
});

test('admin requests ignore a client supplied two factor header and require a recent token step up', function (): void {
    config(['auth.require_admin_2fa' => true]);
    $role = Role::firstOrCreate(['name' => 'admin'], ['name_ar' => 'مدير']);
    $user = User::create([
        'name' => 'Admin test', 'email' => 'step-up@example.test', 'password' => 'safe-password',
        'role_id' => $role->id, 'is_active' => true, 'two_factor_confirmed_at' => now(),
    ]);
    $unverifiedToken = $user->createToken('unverified')->plainTextToken;
    $this->withToken($unverifiedToken)
        ->withHeader('X-2FA-Verified', 'true')
        ->getJson('/api/v1/admin/users')->assertForbidden()->assertJsonPath('requires_step_up', true);

    $verifiedTokenResult = $user->createToken('verified');
    $verifiedToken = $verifiedTokenResult->accessToken;
    $verifiedToken->forceFill(['two_factor_verified_at' => now()])->save();
    expect($verifiedToken->fresh()->getAttribute('two_factor_verified_at'))->not->toBeNull();
    $this->app['auth']->forgetGuards();
    $response = $this->withToken($verifiedTokenResult->plainTextToken)->getJson('/api/v1/admin/users');
    expect($response->status())->toBe(200, $response->getContent());

    $verifiedToken->forceFill(['two_factor_verified_at' => now()->subMinutes(11)])->save();
    $this->app['auth']->forgetGuards();
    $this->withToken($verifiedTokenResult->plainTextToken)->getJson('/api/v1/admin/users')->assertForbidden();
});

test('published demo sites stay hidden from public lists and details', function (): void {
    $site = Site::where('permanent_id', 'KHA-000101')->firstOrFail();
    $site->update(['publication_status' => PublicationStatus::PUBLISHED, 'is_demo' => true]);

    $this->getJson('/api/v1/sites')->assertOk()->assertJsonMissing(['slug' => $site->slug]);
    $this->getJson('/api/v1/sites/'.$site->slug)->assertNotFound();
});

test('anonymous visitors can browse published public sites but cannot mutate archive records', function (): void {
    $site = Site::where('permanent_id', 'KHA-000101')->firstOrFail();
    $site->update(['publication_status' => PublicationStatus::PUBLISHED, 'is_demo' => false]);

    $this->getJson('/api/v1/sites')->assertOk()->assertJsonFragment(['slug' => $site->slug]);
    $this->getJson('/api/v1/sites/'.$site->slug)->assertOk();
    $this->postJson('/api/v1/admin/sites', [])->assertUnauthorized();
    $this->putJson('/api/v1/admin/sites/'.$site->id, [])->assertUnauthorized();
    $this->deleteJson('/api/v1/admin/sites/'.$site->id)->assertUnauthorized();
});

test('encyclopedia public endpoints return only published entries and new entries stay draft', function (): void {
    $role = Role::firstOrCreate(['name' => 'admin'], ['name_ar' => 'مدير']);
    $admin = User::create([
        'name' => 'Admin test', 'email' => 'encyclopedia-editor@example.test', 'password' => 'safe-password',
        'role_id' => $role->id, 'is_active' => true,
    ]);
    $created = $this->actingAs($admin)->postJson('/api/v1/admin/encyclopedia', [
        'term_ar' => 'مدخل خاص', 'category' => 'history', 'short_summary' => 'ملخص', 'full_text' => 'نص',
        'publication_status' => 'published',
    ])->assertCreated()->assertJsonPath('entry.publication_status', 'draft');
    $draft = EncyclopediaEntry::findOrFail($created->json('entry.id'));
    $this->getJson('/api/v1/encyclopedia')->assertOk()->assertJsonMissing(['slug' => 'private-entry']);
    $this->getJson('/api/v1/encyclopedia/'.$draft->slug)->assertNotFound();

    $this->actingAs($admin)->postJson("/api/v1/admin/encyclopedia/{$draft->id}/publish")->assertUnprocessable();
    $draft->sources()->attach(Source::query()->firstOrFail()->id);
    $this->actingAs($admin)->postJson("/api/v1/admin/encyclopedia/{$draft->id}/publish")->assertOk();
    $this->getJson('/api/v1/encyclopedia')->assertOk()->assertJsonFragment(['slug' => $draft->slug]);
    $this->getJson('/api/v1/encyclopedia/'.$draft->slug)->assertOk()->assertJsonPath('publication_status', 'published');
});

test('CSP report only policy contains no unsafe inline source and legacy publish route is gone', function (): void {
    $this->get('/')->assertOk()->assertHeaderMissing('Content-Security-Policy');
    $response = $this->get('/');
    expect($response->headers->get('Content-Security-Policy-Report-Only'))->not->toContain('unsafe-inline');
    $this->postJson('/api/v1/admin/sites/1/publish')->assertNotFound();
});

test('TOTP verifier accepts a known RFC 6238 test vector', function (): void {
    expect(app(TotpService::class)->verify('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', '287082', 59))->toBeTrue()
        ->and(app(TotpService::class)->verify('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', '000000', 59))->toBeFalse();
});

test('initial two factor setup requires the current account password', function (): void {
    config(['archive.admin_email' => 'setup-2fa@example.test']);
    $role = Role::firstOrCreate(['name' => 'admin'], ['name_ar' => 'مدير']);
    $user = User::create(['name' => 'Admin test', 'email' => 'setup-2fa@example.test', 'password' => 'correct-password', 'role_id' => $role->id, 'is_active' => true]);
    $this->actingAs($user)->postJson('/api/v1/auth/2fa/setup', ['current_password' => 'wrong-password'])->assertUnauthorized();
    $this->actingAs($user)->postJson('/api/v1/auth/2fa/setup', ['current_password' => 'correct-password'])->assertOk()->assertJsonStructure(['secret', 'otpauth_uri']);
    expect($user->fresh()->two_factor_secret)->toStartWith('enc:');
});

