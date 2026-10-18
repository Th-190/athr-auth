<?php

use App\Enums\PublicationStatus;
use App\Models\MuseumArtifact;
use App\Models\Site;
use App\Models\Source;
use Illuminate\Support\Facades\Artisan;

test('researched heritage and museum seeders store cited draft records without duplicating them', function () {
    Artisan::call('db:seed', ['--class' => Database\Seeders\DatabaseSeeder::class, '--force' => true]);

    $siteCount = Site::where('is_demo', false)->count();
    $sourceCount = Source::count();
    $artifactCount = MuseumArtifact::count();
    $museum = Site::where('slug', 'imam-hussein-shrine-museum')->firstOrFail();
    $museum->update([
        'publication_status' => PublicationStatus::PUBLISHED,
        'verification_status' => 'partially_verified',
    ]);

    Artisan::call('db:seed', ['--class' => Database\Seeders\MuseumSeeder::class, '--force' => true]);
    Artisan::call('db:seed', ['--class' => Database\Seeders\HeritageSitesSeeder::class, '--force' => true]);

    expect(Site::where('is_demo', false)->count())->toBe($siteCount)
        ->and(Source::count())->toBe($sourceCount)
        ->and(MuseumArtifact::count())->toBe($artifactCount)
        ->and(Site::where('is_demo', false)->where('publication_status', PublicationStatus::PENDING_REVIEW)->count())->toBe($siteCount - 1)
        ->and($museum->fresh()->publication_status)->toBe(PublicationStatus::PUBLISHED)
        ->and($museum->fresh()->verification_status->value)->toBe('partially_verified')
        ->and(Site::where('permanent_id', 'KHA-000101')->first()?->sources()->count())->toBeGreaterThan(0)
        ->and(MuseumArtifact::where('title_ar', 'خنجر يماني من الفضة')->value('source_id'))->not->toBeNull();
});

test('public museum API excludes unreviewed and non-museum records', function () {
    Artisan::call('db:seed', ['--class' => Database\Seeders\DatabaseSeeder::class, '--force' => true]);

    $draftMuseum = Site::where('slug', 'imam-hussein-shrine-museum')->firstOrFail();
    $draftSite = Site::where('slug', 'qasr-al-ukhaidir')->firstOrFail();

    $this->getJson('/api/v1/museums')
        ->assertOk()
        ->assertJsonPath('data', []);
    $this->getJson('/api/v1/museums/'.$draftMuseum->slug)->assertNotFound();

    $draftMuseum->update(['publication_status' => PublicationStatus::PUBLISHED]);
    $draftSite->update(['publication_status' => PublicationStatus::PUBLISHED]);

    $this->getJson('/api/v1/museums')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.slug', 'imam-hussein-shrine-museum')
        ->assertJsonPath('data.0.verification_status', 'unverified')
        ->assertJsonPath('data.0.museum_profile.official_website', 'https://museum.imamhussain.org/');
});
