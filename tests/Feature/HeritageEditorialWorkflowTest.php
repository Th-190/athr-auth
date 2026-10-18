<?php

use App\Enums\PublicationStatus;
use App\Models\Role;
use App\Models\MuseumArtifact;
use App\Models\Site;
use App\Models\Source;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;

function editorialUser(string $roleName): User
{
    $role = Role::firstOrCreate(['name' => $roleName], ['name_ar' => $roleName]);

    return User::create([
        'name' => 'محرر اختبار',
        'email' => $roleName.'-editorial-test@example.test',
        'password' => 'safe-test-password',
        'role_id' => $role->id,
        'email_verified_at' => now(),
        'is_active' => true,
    ]);
}

beforeEach(function () {
    Artisan::call('db:seed', ['--class' => Database\Seeders\DatabaseSeeder::class, '--force' => true]);
    Artisan::call('db:seed', ['--class' => Database\Seeders\HeritageSitesSeeder::class, '--force' => true]);
});

test('editorial API is restricted to active server-authorized editors', function () {
    $this->getJson('/api/v1/admin/editorial')->assertUnauthorized();

    $viewer = editorialUser('viewer');
    $this->actingAs($viewer)->getJson('/api/v1/admin/editorial')->assertForbidden();

    $editor = editorialUser('editor');
    $this->actingAs($editor)->getJson('/api/v1/admin/editorial')->assertOk()->assertJsonStructure(['data']);

    $editor->update(['is_active' => false]);
    $this->actingAs($editor)->getJson('/api/v1/admin/editorial')->assertForbidden();
});

test('editorial records stay private until approved and citation-backed publishing', function () {
    $editor = editorialUser('editor');
    $site = Site::where('permanent_id', 'KHA-000101')->firstOrFail();
    $source = Source::whereHas('sites', fn ($query) => $query->whereKey($site->id))->firstOrFail();

    expect($site->publication_status)->toBe(PublicationStatus::PENDING_REVIEW);
    $this->getJson('/api/v1/sites/'.$site->slug)->assertNotFound();

    $this->actingAs($editor)->postJson("/api/v1/admin/editorial/sites/{$site->id}/decision", [
        'action' => 'publish', 'reason' => 'اختبار النشر المباشر',
    ])->assertStatus(422);

    $this->actingAs($editor)->postJson("/api/v1/admin/editorial/sites/{$site->id}/decision", [
        'action' => 'approve', 'reason' => 'تمت مراجعة بيانات الموقع ومصادره',
    ])->assertOk();

    $this->actingAs($editor)->postJson("/api/v1/admin/editorial/sites/{$site->id}/decision", [
        'action' => 'publish', 'reason' => 'استيفاء شروط النشر بالمراجعة',
    ])->assertOk();

    $this->getJson('/api/v1/sites/'.$site->slug)->assertOk()->assertJsonPath('data.publication_status', 'published');

    $this->actingAs($editor)->postJson("/api/v1/admin/editorial/sites/{$site->id}/decision", [
        'action' => 'return', 'reason' => 'يرجى إضافة توثيق ميداني أدق',
    ])->assertOk();
    auth()->logout();
    $this->getJson('/api/v1/sites/'.$site->slug)->assertNotFound();

    expect($site->fresh()->revisions)->toHaveCount(0)
        ->and($site->fresh()->sources()->whereKey($source->id)->exists())->toBeTrue();
});

test('editing records citations and resets verification after substantive edits', function () {
    $editor = editorialUser('editor');
    $site = Site::where('permanent_id', 'KHA-000101')->firstOrFail();
    $source = Source::whereHas('sites', fn ($query) => $query->whereKey($site->id))->firstOrFail();

    $payload = [
        'name_ar' => $site->name_ar.' — مراجعة',
        'name_en' => $site->name_en,
        'short_description' => $site->short_description,
        'description' => $site->description,
        'description_en' => 'Reviewed English description',
        'approximate_date' => $site->approximate_date,
        'heritage_designation' => $site->heritage_designation,
        'designation_year' => $site->designation_year,
        'location_precision' => $site->location_precision->value,
        'citations' => [[
            'source_id' => $source->id,
            'page_reference' => 'pp. 12–14',
            'excerpt' => 'Citation excerpt',
            'editor_note' => 'Checked by editor',
            'relevance' => 'direct',
        ]],
        'revision_notes' => 'تصحيح تحريري موثق للاختبار',
    ];

    $this->actingAs($editor)->putJson("/api/v1/admin/editorial/sites/{$site->id}", $payload)->assertOk();
    expect($site->fresh()->description_en)->toBe('Reviewed English description')
        ->and($site->fresh()->sources()->first()->pivot->page_reference)->toBe('pp. 12–14')
        ->and($site->fresh()->revisions()->where('field_name', 'description_en')->exists())->toBeTrue();
});

test('museum artifact approval and publication use its actual string status columns', function () {
    $editor = editorialUser('editor');
    $museum = Site::where('slug', 'imam-hussein-shrine-museum')->firstOrFail();
    $museum->update(['publication_status' => PublicationStatus::PUBLISHED]);
    $pendingSite = Site::where('slug', 'qasr-al-ukhaidir')->firstOrFail();
    $museum->relations()->create(['related_site_id' => $pendingSite->id, 'relation_type' => 'test_link']);
    $artifact = MuseumArtifact::firstOrFail();
    $source = Source::whereNotNull('url')->firstOrFail();
    $artifact->update(['source_id' => $source->id]);

    $this->getJson('/api/v1/museums/'.$museum->slug)->assertOk()->assertJsonPath('data.museum_profile.artifacts', []);

    $this->actingAs($editor)->postJson("/api/v1/admin/editorial/artifacts/{$artifact->id}/decision", [
        'action' => 'approve', 'reason' => 'تمت مراجعة بيانات المقتنى ومصدره',
    ])->assertOk();
    $this->actingAs($editor)->postJson("/api/v1/admin/editorial/artifacts/{$artifact->id}/decision", [
        'action' => 'publish', 'reason' => 'المتحف منشور والمصدر صالح للنشر',
    ])->assertOk();

    expect($artifact->fresh()->publication_status)->toBe('published')
        ->and($artifact->fresh()->verification_status)->toBe('verified');
    $this->getJson('/api/v1/museums/'.$museum->slug)->assertOk()->assertJsonPath('data.museum_profile.artifacts.0.id', $artifact->id);
});

test('public site search category designation period and pagination query published backend records', function () {
    $museum = Site::where('slug', 'imam-hussein-shrine-museum')->firstOrFail();
    $museum->update(['publication_status' => PublicationStatus::PUBLISHED]);

    $this->getJson('/api/v1/sites?q=Imam&per_page=1')
        ->assertOk()->assertJsonPath('per_page', 1)->assertJsonPath('total', 1);
    $this->getJson('/api/v1/sites?category=museums')->assertOk()->assertJsonPath('total', 1);
    $this->getJson('/api/v1/sites?designation=UNESCO')->assertOk()->assertJsonPath('data', []);
    $this->getJson('/api/v1/sites?historical_period_id='.$museum->historical_period_id)->assertOk()->assertJsonPath('total', 1);

    $this->getJson('/api/v1/museums?q=Imam')->assertOk()->assertJsonPath('total', 1);
    $this->getJson('/api/v1/museums?historical_period_id='.$museum->historical_period_id)->assertOk()->assertJsonPath('total', 1);
    $this->getJson('/api/v1/museums/'.$museum->slug)->assertOk()
        ->assertJsonPath('data.slug', $museum->slug)
        ->assertJsonPath('data.relations', []);
    $museum->update(['publication_status' => PublicationStatus::ARCHIVED]);
    $this->getJson('/api/v1/museums/'.$museum->slug)->assertNotFound();
});
