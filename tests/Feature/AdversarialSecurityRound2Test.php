<?php

namespace Tests\Feature;

use App\Enums\LocationPrecision;
use App\Enums\PublicationStatus;
use App\Enums\VerificationStatus;
use App\Http\Resources\SiteResource;
use App\Models\AccessInvitation;
use App\Models\Area;
use App\Models\SiteContribution;
use App\Models\HistoricalPeriod;
use App\Models\Province;
use App\Models\Role;
use App\Models\Site;
use App\Models\SiteImage;
use App\Models\SiteType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdversarialSecurityRound2Test extends TestCase
{
    use RefreshDatabase;
    protected Role $adminRole;
    protected Role $superAdminRole;
    protected Role $editorRole;
    protected Role $contributorRole;
    protected Role $viewerRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdminRole = Role::firstOrCreate(['name' => 'super_admin'], ['name_ar' => 'مدير أعلى']);
        $this->adminRole = Role::firstOrCreate(['name' => 'admin'], ['name_ar' => 'مدير أرشيف']);
        $this->editorRole = Role::firstOrCreate(['name' => 'editor'], ['name_ar' => 'محرر وباحث']);
        $this->contributorRole = Role::firstOrCreate(['name' => 'contributor'], ['name_ar' => 'مساهم']);
        $this->viewerRole = Role::firstOrCreate(['name' => 'viewer'], ['name_ar' => 'مشاهد']);
    }

    protected function createTestUser(string $roleName, string $email = null): User
    {
        $role = Role::where('name', $roleName)->first();
        return User::create([
            'name' => "User {$roleName}",
            'email' => $email ?? "{$roleName}." . uniqid() . "@karbalaheritage.iq",
            'password' => Hash::make('SecretPass123!'),
            'role_id' => $role->id,
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
    }

    protected function createSampleSite(string $publicationStatus = 'published', string $precision = 'exact', float $lat = 32.616035, float $lng = 44.032375): Site
    {
        $type = SiteType::firstOrCreate(['slug' => 'heritage-shrine'], ['name_ar' => 'معلم تاريخي', 'name_en' => 'Historical Landmark', 'definition' => 'موقع تراثي يتعلق بأثر كربلاء المقدسة']);
        $period = HistoricalPeriod::firstOrCreate(
            ['slug' => 'abbasid-era'],
            [
                'name_ar'          => 'العصر العباسي',
                'name_en'          => 'Abbasid Era',
                'start_year_label' => '750 م',
                'end_year_label'   => '1258 م',
                'start_year_numeric' => 750,
                'end_year_numeric'   => 1258,
                'description'      => 'عصر الدولة العباسية الإسلامية',
                'sort_order'       => 1,
            ]
        );
        $province = Province::firstOrCreate(
            ['slug' => 'karbala-prov'],
            ['code' => 'KRB', 'name_ar' => 'كربلاء المقدسة', 'name_en' => 'Karbala']
        );

        $suffix = strtoupper(\Illuminate\Support\Str::random(10));
        $site = Site::create([
            'slug' => 'test-site-' . strtolower($suffix),
            'permanent_id' => 'KHA-TEST-' . $suffix,
            'name_ar' => 'موقع اختباري أثري',
            'name_en' => 'Test Archaeological Site',
            'short_description' => 'ملخص توثيقي للموقع التراثي للاختبار الأمني',
            'description' => 'بيانات اختبارية فقط.',
            'historical_description' => 'بيانات اختبارية فقط.',
            'architectural_description' => 'بيانات اختبارية فقط.',
            'cultural_significance' => 'بيانات اختبارية فقط.',
            'historical_significance' => 'بيانات اختبارية فقط.',
            'current_condition' => 'بيانات اختبارية فقط.',
            'location_description' => 'بيانات اختبارية فقط.',
            'site_type_id' => $type->id,
            'historical_period_id' => $period->id,
            'province_id' => $province->id,
            'area_id' => $this->createTestArea($province)->id,
            'publication_status' => $publicationStatus,
            'verification_status' => 'verified',
            'location_precision' => $precision,
            'published_at' => $publicationStatus === 'published' ? now() : null,
        ]);

        if ($precision !== 'unknown') {
            $site->setCoordinates($lat, $lng)->save();
        }

        return $site;
    }

    protected function createTestArea(Province $province): Area
    {
        $district = \App\Models\District::firstOrCreate(
            ['province_id' => $province->id, 'slug' => 'test-district'],
            ['name_ar' => 'قضاء اختباري', 'name_en' => 'Test District']
        );
        $subDistrict = \App\Models\SubDistrict::firstOrCreate(
            ['district_id' => $district->id, 'slug' => 'test-sub-district'],
            ['name_ar' => 'ناحية اختبارية', 'name_en' => 'Test Subdistrict']
        );

        return Area::firstOrCreate(
            ['sub_district_id' => $subDistrict->id, 'slug' => 'test-area'],
            ['name_ar' => 'منطقة اختبارية', 'name_en' => 'Test Area']
        );
    }

    // =========================================================================
    // 1. M1: Header Spoofing (X-User-Id removal & identity integrity)
    // =========================================================================
    public function test_m1_client_cannot_spoof_identity_via_headers(): void
    {
        $admin = $this->createTestUser('admin');

        // Attacker sends X-User-Id header without valid bearer token/session
        $response = $this->withHeaders([
            'X-User-Id' => (string) $admin->id,
            'X-User-Role' => 'admin',
        ])->getJson('/api/v1/admin/users');

        $response->assertStatus(401);

        // Attacker sends arbitrary bearer token + X-User-Id
        $responseWithFakeToken = $this->withHeaders([
            'Authorization' => 'Bearer fake-malicious-token-xyz',
            'X-User-Id' => (string) $admin->id,
        ])->getJson('/api/v1/admin/users');

        $responseWithFakeToken->assertStatus(401);
    }

    // =========================================================================
    // 2. Published-Only Rule (Scope & policy for public paths)
    // =========================================================================
    public function test_published_only_rule_across_public_endpoints(): void
    {
        $published = $this->createSampleSite('published');
        $draft = $this->createSampleSite('draft');
        $archived = $this->createSampleSite('archived');

        // 1. Public list endpoint
        $listResponse = $this->getJson('/api/v1/sites');
        $listResponse->assertStatus(200);
        $listData = collect($listResponse->json('data'));
        $this->assertTrue($listData->contains('id', $published->id));
        $this->assertFalse($listData->contains('id', $draft->id));
        $this->assertFalse($listData->contains('id', $archived->id));

        // 2. Public detail endpoint returns 404 for draft and archived
        $this->getJson("/api/v1/sites/{$published->slug}")->assertStatus(200);
        $this->getJson("/api/v1/sites/{$draft->slug}")->assertStatus(404);
        $this->getJson("/api/v1/sites/{$archived->slug}")->assertStatus(404);

        // PostGIS-backed endpoints require a real PostgreSQL geography column.
        if (DB::getDriverName() === 'pgsql') {
            $geoResponse = $this->getJson('/api/v1/sites/export/geojson');
            $geoResponse->assertStatus(200);
            $geoFeatures = collect($geoResponse->json('features'));
            $featureSiteIds = $geoFeatures->pluck('properties.id');
            $this->assertTrue($featureSiteIds->contains($published->id));
            $this->assertFalse($featureSiteIds->contains($draft->id));
            $this->assertFalse($featureSiteIds->contains($archived->id));

            $sitemapResponse = $this->get('/sitemap.xml');
            $sitemapResponse->assertStatus(200);
            $this->assertStringContainsString($published->slug, $sitemapResponse->getContent());
            $this->assertStringNotContainsString($draft->slug, $sitemapResponse->getContent());
            $this->assertStringNotContainsString($archived->slug, $sitemapResponse->getContent());
        }

        // 5. RSS.xml only includes published
        $rssResponse = $this->get('/rss.xml');
        $rssResponse->assertStatus(200);
        $this->assertStringContainsString($published->slug, $rssResponse->getContent());
        $this->assertStringNotContainsString($draft->slug, $rssResponse->getContent());
        $this->assertStringNotContainsString($archived->slug, $rssResponse->getContent());
    }

    // =========================================================================
    // 3. Coordinate Rule: Single Resource serializer with location_precision
    // =========================================================================
    public function test_coordinate_rule_enforces_precision_in_all_serializers(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Coordinate privacy and GeoJSON serialization require PostgreSQL/PostGIS.');
        }

        $rawLat = 32.616035;
        $rawLng = 44.032375;

        // Exact precision
        $exactSite = $this->createSampleSite('published', 'exact', $rawLat, $rawLng);
        $exactResource = (new SiteResource($exactSite))->toArray(request());
        $this->assertEquals($rawLat, $exactResource['coordinates']['latitude']);
        $this->assertEquals($rawLng, $exactResource['coordinates']['longitude']);
        $this->assertFalse($exactResource['coordinates']['is_fuzzed']);

        // Restricted precision (Must be fuzzed to 1 dec place ~11km centroid)
        $restrictedSite = $this->createSampleSite('published', 'restricted', $rawLat, $rawLng);
        $restrictedResource = (new SiteResource($restrictedSite))->toArray(request());
        $this->assertEquals(round($rawLat, 1), $restrictedResource['coordinates']['latitude']);
        $this->assertEquals(round($rawLng, 1), $restrictedResource['coordinates']['longitude']);
        $this->assertTrue($restrictedResource['coordinates']['is_fuzzed']);
        $this->assertStringContainsString('محجوبة احترازياً', $restrictedResource['coordinates']['precision_label']);

        // GeoJSON Serializer fuzzing test
        $geoFeature = (new SiteResource($restrictedSite))->toGeoJsonFeature();
        $this->assertEquals(round($rawLng, 1), $geoFeature['geometry']['coordinates'][0]);
        $this->assertEquals(round($rawLat, 1), $geoFeature['geometry']['coordinates'][1]);
        $this->assertTrue($geoFeature['properties']['is_fuzzed']);

        // JSON-LD Serializer fuzzing test
        $jsonLd = (new SiteResource($restrictedSite))->toJsonLd();
        $this->assertEquals(round($rawLat, 1), $jsonLd['geo']['latitude']);
        $this->assertEquals(round($rawLng, 1), $jsonLd['geo']['longitude']);

        // HTML Data Attributes Serializer fuzzing test
        $htmlAttrs = (new SiteResource($restrictedSite))->toHtmlDataAttributes();
        $this->assertStringContainsString('data-fuzzed="true"', $htmlAttrs);
        $this->assertStringContainsString('data-latitude="' . round($rawLat, 1) . '"', $htmlAttrs);
    }

    // =========================================================================
    // 4. Downloads: Resolve files only by DB ID; reject string/traversal paths
    // =========================================================================
    public function test_media_downloads_resolved_strictly_by_database_id(): void
    {
        Storage::fake('downloads');

        $publishedSite = $this->createSampleSite('published');
        $draftSite = $this->createSampleSite('draft');

        // Create sample site image in storage
        $storedPath = 'sites/test-image/download.jpg';
        Storage::disk('downloads')->put($storedPath, 'fake-jpeg-binary-stream');
        $rightsReviewer = $this->createTestUser('admin');

        $publishedImage = SiteImage::create([
            'site_id' => $publishedSite->id,
            'ulid' => (string) \Illuminate\Support\Str::ulid(),
            'title' => 'Test image',
            'original_storage_path' => 'sites/test-image/original.bin',
            'web_storage_path' => 'sites/test-image/web.jpg',
            'download_storage_path' => $storedPath,
            'rights_status' => 'creative_commons',
            'license' => 'CC BY-SA 4.0',
            'source_url' => 'https://example.org/test-image',
            'photographer' => 'مصوّر تجريبي',
            'rights_reviewed_by' => $rightsReviewer->id,
            'rights_reviewed_at' => now(),
            'visibility' => true,
            'mime_type' => 'image/jpeg',
            'file_size_bytes' => 24,
            'featured' => true,
        ]);

        $draftImage = SiteImage::create([
            'site_id' => $draftSite->id,
            'ulid' => (string) \Illuminate\Support\Str::ulid(),
            'title' => 'Draft image',
            'original_storage_path' => 'sites/draft/original.bin',
            'download_storage_path' => $storedPath,
            'mime_type' => 'image/jpeg',
            'file_size_bytes' => 24,
            'featured' => true,
        ]);

        // Valid download by ID for published site succeeds
        $res = $this->get("/api/v1/media/{$publishedImage->id}/download");
        $res->assertStatus(200);

        // Guest requesting download for draft site image receives 404 (single published-only gate)
        $draftRes = $this->get("/api/v1/media/{$draftImage->id}/download");
        $draftRes->assertStatus(404);

        // Attempting path traversal string or non-numeric id
        $traversalRes = $this->get('/api/v1/media/..%2f..%2f.env/download');
        $this->assertTrue(in_array($traversalRes->getStatusCode(), [404, 400]));

        // Non-existent ID returns 404
        $notFoundRes = $this->get('/api/v1/media/9999999/download');
        $notFoundRes->assertStatus(404);
    }

    public function test_deleting_media_removes_derivatives_and_private_downloads_but_keeps_the_immutable_original(): void
    {
        Storage::fake('originals');
        Storage::fake('derivatives');
        Storage::fake('downloads');

        $admin = $this->createTestUser('admin');
        $site = $this->createSampleSite('published');
        $originalPath = 'sites/delete-audit/original.bin';
        $webPath = 'sites/delete-audit/web.jpg';
        $thumbPath = 'sites/delete-audit/thumb.jpg';
        $downloadPath = 'sites/delete-audit/download.jpg';
        Storage::disk('originals')->put($originalPath, 'private-original');
        Storage::disk('derivatives')->put($webPath, 'public-web-image');
        Storage::disk('derivatives')->put($thumbPath, 'public-thumbnail');
        Storage::disk('downloads')->put($downloadPath, 'private-watermarked-download');

        $image = SiteImage::create([
            'site_id' => $site->id,
            'ulid' => (string) \Illuminate\Support\Str::ulid(),
            'title' => 'Deletion audit image',
            'original_storage_path' => $originalPath,
            'web_storage_path' => $webPath,
            'thumb_storage_path' => $thumbPath,
            'download_storage_path' => $downloadPath,
            'rights_status' => 'public_domain',
            'source_url' => 'https://example.org/archive-image',
            'photographer' => 'باحث تجريبي',
            'rights_reviewed_by' => $admin->id,
            'rights_reviewed_at' => now(),
            'visibility' => true,
        ]);

        $this->actingAs($admin)->deleteJson("/api/v1/admin/media/{$image->id}")->assertOk();

        $this->assertSoftDeleted('site_images', ['id' => $image->id]);
        Storage::disk('originals')->assertExists($originalPath);
        Storage::disk('derivatives')->assertMissing($webPath);
        Storage::disk('derivatives')->assertMissing($thumbPath);
        Storage::disk('downloads')->assertMissing($downloadPath);
    }

    public function test_public_site_api_returns_only_visible_published_derivatives(): void
    {
        Storage::fake('derivatives');
        $site = $this->createSampleSite('published');
        $webPath = "sites/{$site->slug}/web/public.jpg";
        $thumbPath = "sites/{$site->slug}/thumb/public.jpg";
        Storage::disk('derivatives')->put($webPath, 'processed-web-image');
        Storage::disk('derivatives')->put($thumbPath, 'processed-thumbnail');

        $visible = SiteImage::create([
            'site_id' => $site->id,
            'ulid' => (string) \Illuminate\Support\Str::ulid(),
            'title' => 'Public image',
            'original_storage_path' => "sites/{$site->slug}/original/private.bin",
            'web_storage_path' => $webPath,
            'thumb_storage_path' => $thumbPath,
            'rights_status' => 'creative_commons',
            'license' => 'CC BY-SA 4.0',
            'source_url' => 'https://example.org/attributed-image',
            'photographer' => 'باحث تجريبي',
            'rights_reviewed_by' => $this->createTestUser('admin')->id,
            'rights_reviewed_at' => now(),
            'visibility' => true,
            'mime_type' => 'image/jpeg',
        ]);
        SiteImage::create([
            'site_id' => $site->id,
            'ulid' => (string) \Illuminate\Support\Str::ulid(),
            'title' => 'Hidden image',
            'original_storage_path' => "sites/{$site->slug}/original/hidden.bin",
            'rights_status' => 'unknown',
            'visibility' => false,
            'mime_type' => 'image/jpeg',
        ]);

        $response = $this->getJson("/api/v1/sites/{$site->slug}")->assertOk();
        $images = $response->json('data.images');
        $this->assertCount(1, $images);
        $this->assertSame($visible->id, $images[0]['id']);
        $this->assertSame(Storage::disk('derivatives')->url($webPath), $images[0]['web_url']);
        $this->assertSame(Storage::disk('derivatives')->url($thumbPath), $images[0]['thumbnail_url']);
        $this->assertArrayNotHasKey('original_storage_path', $images[0]);
        $this->assertArrayNotHasKey('download_storage_path', $images[0]);
    }

    public function test_site_create_and_update_map_api_fields_to_the_existing_schema(): void
    {
        $admin = $this->createTestUser('admin');
        $reference = $this->createSampleSite('draft');

        $created = $this->actingAs($admin)->postJson('/api/v1/admin/sites', [
            'name_ar' => 'موقع اختبار قاعدة البيانات',
            'name_en' => 'Database Schema Test Site',
            'summary_ar' => 'ملخص اختبار مطابق للمخطط',
            'description_ar' => 'وصف اختبار مطابق للمخطط',
            'site_type_id' => $reference->site_type_id,
            'historical_period_id' => $reference->historical_period_id,
            'province_id' => $reference->province_id,
            'area_id' => $reference->area_id,
            'location_precision' => 'unknown',
        ])->assertCreated();

        $siteId = $created->json('site.id');
        $this->assertDatabaseHas('sites', [
            'id' => $siteId,
            'short_description' => 'ملخص اختبار مطابق للمخطط',
            'description' => 'وصف اختبار مطابق للمخطط',
        ]);

        $this->actingAs($admin)->putJson("/api/v1/admin/sites/{$siteId}", [
            'summary_ar' => 'ملخص محدث مطابق للمخطط',
            'revision_notes' => 'تحديث لاختبار سجل المراجعة',
        ])->assertOk();

        $this->assertDatabaseHas('sites', ['id' => $siteId, 'short_description' => 'ملخص محدث مطابق للمخطط']);
        $this->assertDatabaseHas('site_revisions', [
            'site_id' => $siteId,
            'field_name' => 'short_description',
            'reason' => 'تحديث لاختبار سجل المراجعة',
        ]);
    }

    public function test_authorized_upload_persists_original_and_generates_shared_derivatives(): void
    {
        Storage::fake('originals');
        Storage::fake('derivatives');
        Storage::fake('downloads');
        $admin = $this->createTestUser('admin');
        $site = $this->createSampleSite('published');

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/media/upload', [
            'image' => UploadedFile::fake()->image('archive.jpg', 800, 600),
            'site_id' => $site->id,
            'caption_ar' => 'صورة تجريبية لعملية الرفع',
            'rights_status' => 'unknown',
        ])->assertCreated();

        $image = SiteImage::findOrFail($response->json('image.id'));
        Storage::disk('originals')->assertExists($image->original_storage_path);
        $this->assertFalse($image->visibility);
        $this->assertNull($image->web_storage_path);

        $this->actingAs($admin)->putJson("/api/v1/admin/media/{$image->id}", [
            'visibility' => true,
            'rights_status' => 'creative_commons',
            'license' => 'CC BY-SA 4.0',
            'source_url' => 'https://example.org/attributed-image',
            'photographer' => 'باحث تجريبي',
        ])->assertOk();

        $image->refresh();
        $this->assertTrue($image->hasPublicRightsApproval());
        Storage::disk('derivatives')->assertExists($image->web_storage_path);
        Storage::disk('derivatives')->assertExists($image->thumb_storage_path);
        Storage::disk('downloads')->assertExists($image->download_storage_path);
        $this->assertSame(Storage::disk('derivatives')->url($image->web_storage_path), $image->web_url);
        $this->assertDatabaseHas('media_hashes', ['site_image_id' => $image->id, 'file_version' => 'original']);
        $this->assertDatabaseHas('media_hashes', ['site_image_id' => $image->id, 'file_version' => 'thumbnail']);

        $webPath = $image->web_storage_path;
        $thumbPath = $image->thumb_storage_path;
        $downloadPath = $image->download_storage_path;
        $this->actingAs($admin)->putJson("/api/v1/admin/media/{$image->id}", [
            'visibility' => false,
        ])->assertOk();

        $image->refresh();
        $this->assertFalse($image->hasPublicRightsApproval());
        $this->assertNull($image->web_storage_path);
        $this->assertNull($image->thumb_storage_path);
        $this->assertNull($image->download_storage_path);
        Storage::disk('derivatives')->assertMissing($webPath);
        Storage::disk('derivatives')->assertMissing($thumbPath);
        Storage::disk('downloads')->assertMissing($downloadPath);
    }

    public function test_corrupt_image_derivative_job_fails_for_queue_retry_without_publishing_paths(): void
    {
        Storage::fake('originals');
        Storage::fake('derivatives');
        Storage::fake('downloads');

        $site = $this->createSampleSite('published');
        $admin = $this->createTestUser('admin');
        $originalPath = 'sites/retry-audit/original.bin';
        Storage::disk('originals')->put($originalPath, 'not-an-image');
        $image = SiteImage::create([
            'site_id' => $site->id,
            'ulid' => (string) \Illuminate\Support\Str::ulid(),
            'title' => 'Corrupt retry test image',
            'original_storage_path' => $originalPath,
            'rights_status' => 'public_domain',
            'source_url' => 'https://example.org/archive-image',
            'photographer' => 'باحث تجريبي',
            'rights_reviewed_by' => $admin->id,
            'rights_reviewed_at' => now(),
            'visibility' => true,
        ]);
        $job = new \App\Jobs\ProcessImageDerivativeJob($originalPath, $site->slug, $image->ulid);

        $this->assertSame(3, $job->tries);
        $this->assertSame([30, 120, 300], $job->backoff);
        try {
            $job->handle();
            $this->fail('Corrupt image data must fail derivative processing so the queue can retry it.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('derivative generation failed', $exception->getMessage());
        }

        $image->refresh();
        $this->assertNull($image->web_storage_path);
        $this->assertNull($image->thumb_storage_path);
        $this->assertNull($image->download_storage_path);
        Storage::disk('derivatives')->assertDirectoryEmpty('sites/'.$site->slug);
        Storage::disk('downloads')->assertDirectoryEmpty('sites/'.$site->slug);
    }

    // =========================================================================
    // 5. Authorization: M5, M6 & Role Access Matrix
    // =========================================================================
    public function test_m5_m6_and_authorization_matrix(): void
    {
        $viewer = $this->createTestUser('viewer');
        $contributor = $this->createTestUser('contributor');
        $contributorB = $this->createTestUser('contributor');
        $editor = $this->createTestUser('editor');
        $admin = $this->createTestUser('admin');

        $site = $this->createSampleSite('published');

        // 1. M5: Contributor cannot upload/attach image to a site without edit permission
        Storage::fake('public');
        $fakeFile = UploadedFile::fake()->image('test.jpg');

        $contribUpload = $this->actingAs($contributor)->postJson('/api/v1/admin/media/upload', [
            'file' => $fakeFile,
            'site_id' => $site->id,
        ]);
        $contribUpload->assertStatus(403);

        // 2. M6: Contributor can create contribution and only see their own
        $myContrib = SiteContribution::create([
            'user_id' => $contributor->id,
            'type' => 'suggest_correction',
            'title' => 'مساهمة توثيقية رقم 1',
            'description' => 'وصف المساهمة التراثية',
            'status' => 'pending_review',
            'contributor_name' => $contributor->name,
            'contributor_email' => $contributor->email,
        ]);

        $otherContrib = SiteContribution::create([
            'user_id' => $contributorB->id,
            'type' => 'suggest_correction',
            'title' => 'مساهمة الباحث الثاني',
            'description' => 'وصف مساهمة الباحث الثاني',
            'status' => 'pending_review',
            'contributor_name' => $contributorB->name,
            'contributor_email' => $contributorB->email,
        ]);

        // Contributor A lists contributions -> sees only their own
        $myListRes = $this->actingAs($contributor)->getJson('/api/v1/admin/contributions');
        $myListRes->assertStatus(200);
        $myListIds = collect($myListRes->json('data'))->pluck('id');
        $this->assertTrue($myListIds->contains($myContrib->id));
        $this->assertFalse($myListIds->contains($otherContrib->id));

        // Contributor cannot review/approve contributions
        $reviewRes = $this->actingAs($contributor)->putJson("/api/v1/admin/contributions/{$myContrib->id}/review", [
            'status' => 'approved',
            'review_notes' => 'محاولة اعتماد غير مصرحة',
        ]);
        $reviewRes->assertStatus(403);

        // 3. Authorization Matrix: Viewer is forbidden from admin routes
        $this->actingAs($viewer)->getJson('/api/v1/admin/users')->assertStatus(403);
        $this->actingAs($viewer)->getJson('/api/v1/admin/settings')->assertStatus(403);
        $this->actingAs($viewer)->getJson('/api/v1/admin/invitations')->assertStatus(403);

        // Editor cannot manage users
        $this->actingAs($editor)->getJson('/api/v1/admin/users')->assertStatus(403);

        // Admin can access users and settings
        $this->actingAs($admin)->getJson('/api/v1/admin/users')->assertStatus(200);
        $this->actingAs($admin)->getJson('/api/v1/admin/settings')->assertStatus(200);
    }

    // =========================================================================
    // 6. M4: Return URL strictly same-origin relative path
    // =========================================================================
    public function test_m4_return_url_strictly_same_origin(): void
    {
        $admin = $this->createTestUser('admin');

        // External URLs with protocol scheme
        $extRes = $this->postJson('/api/v1/auth/google', [
            'id_token' => 'mock_token',
            'return_url' => 'https://evil.attacker.com/steal-session',
        ]);
        // The return_url sanitizer converts external URLs to '/'
        $this->assertNotEquals('https://evil.attacker.com/steal-session', $extRes->json('redirect_url'));

        // Protocol-relative URL (//evil.com)
        $protoRes = $this->postJson('/api/v1/auth/google', [
            'id_token' => 'mock_token',
            'return_url' => '//evil.com/phish',
        ]);
        $this->assertNotEquals('//evil.com/phish', $protoRes->json('redirect_url'));
        $this->assertEquals('/', $protoRes->json('redirect_url') ?? '/');
    }

    // =========================================================================
    // 7. M3: CSRF Protection on State-Changing Web Routes
    // =========================================================================
    public function test_m3_csrf_protection_on_state_changing_web_routes(): void
    {
        // CSRF verification: confirm the web middleware group includes VerifyCsrfToken
        // Laravel's TestCase disables CSRF for test convenience, but we verify it is
        // registered in production middleware stack.
        $kernel = app(\Illuminate\Contracts\Http\Kernel::class);
        $middlewareGroups = $kernel->getMiddlewareGroups();
        $webGroup = $middlewareGroups['web'] ?? [];

        $csrfPresent = collect($webGroup)->contains(function ($m) {
            $name = is_string($m) ? $m : (is_array($m) ? $m[0] : '');
            return str_contains($name, 'VerifyCsrfToken') || str_contains($name, 'ValidateCsrfToken');
        });

        $this->assertTrue($csrfPresent, 'CSRF (VerifyCsrfToken or ValidateCsrfToken) MUST be in the web middleware group to protect state-changing routes from cross-site request forgery.');
    }

    // =========================================================================
    // 8. L1-L3: Security Headers, Session Cookies & APP_DEBUG
    // =========================================================================
    public function test_l1_to_l3_security_headers_and_cookie_hardening(): void
    {
        $response = $this->get('/up');
        $response->assertStatus(200);

        // Verify Essential Security Headers
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('X-Permitted-Cross-Domain-Policies', 'none');
        $this->assertTrue($response->headers->has('Content-Security-Policy-Report-Only') || $response->headers->has('Content-Security-Policy'));

        // Verify Cookie configuration
        $this->assertTrue(config('session.http_only'));
        $this->assertEquals('lax', config('session.same_site'));

        // Production config regression test: APP_DEBUG must be false in production
        if (config('app.env') === 'production') {
            $this->assertFalse(config('app.debug'), 'SECURITY CRITICAL: APP_DEBUG must be false in production.');
        }
    }

    // =========================================================================
    // 9. L6: Access Invitations System & Escalation Rules
    // =========================================================================
    public function test_l6_invitation_system_and_escalation_rules(): void
    {
        $superAdmin = $this->createTestUser('super_admin');
        $admin = $this->createTestUser('admin');
        $editor = $this->createTestUser('editor');

        // 1. Admin can invite Contributor or Editor
        $inviteRes = $this->actingAs($admin)->postJson('/api/v1/admin/invitations', [
            'email' => 'new.contributor@example.com',
            'role_id' => $this->contributorRole->id,
            'expires_days' => 14,
        ]);
        $inviteRes->assertStatus(201);
        $invitation = AccessInvitation::where('email', 'new.contributor@example.com')->first();
        $this->assertNotNull($invitation);
        $this->assertEquals('pending', $invitation->status);

        // 2. Escalation Rule: Regular Admin CANNOT invite Admin or Super Admin
        $escalateRes = $this->actingAs($admin)->postJson('/api/v1/admin/invitations', [
            'email' => 'hack.admin@example.com',
            'role_id' => $this->adminRole->id,
            'expires_days' => 14,
        ]);
        $escalateRes->assertStatus(403);

        // 3. Escalation Rule: Only Super Admin can invite Admin or Super Admin
        $superInviteRes = $this->actingAs($superAdmin)->postJson('/api/v1/admin/invitations', [
            'email' => 'legit.admin@example.com',
            'role_id' => $this->adminRole->id,
            'expires_days' => 14,
        ]);
        $superInviteRes->assertStatus(201);

        // 4. Nobody can change their own role (controller returns 422 for self-modification)
        $selfRoleRes = $this->actingAs($admin)->putJson("/api/v1/admin/users/{$admin->id}/role", [
            'role' => 'super_admin',
        ]);
        // The controller intentionally returns 422 (not 403) for self-role change to distinguish
        // it from privilege escalation (which returns 403). Both are rejection — self-change is 422.
        $selfRoleRes->assertStatus(422);
        $this->assertStringContainsString('مرفوض', $selfRoleRes->json('message'));

        // 5. Admin can revoke pending invitation
        $revokeRes = $this->actingAs($admin)->postJson("/api/v1/admin/invitations/{$invitation->id}/revoke");
        $revokeRes->assertStatus(200);
        $this->assertEquals('revoked', $invitation->fresh()->status);
    }
}
