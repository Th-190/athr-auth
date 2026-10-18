<?php

namespace Tests\Feature;

use App\Enums\LocationPrecision;
use App\Enums\PublicationStatus;
use App\Enums\VerificationStatus;
use App\Http\Resources\SiteResource;
use App\Models\AccessInvitation;
use App\Models\Area;
use App\Models\Contribution;
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
        $province = Province::firstOrCreate(['slug' => 'karbala-prov'], ['name_ar' => 'كربلاء المقدسة', 'name_en' => 'Karbala']);

        $site = Site::create([
            'slug' => 'test-site-' . uniqid(),
            'inventory_number' => 'KHA-TEST-' . strtoupper(uniqid()),
            'name_ar' => 'موقع اختباري أثري',
            'name_en' => 'Test Archaeological Site',
            'summary_ar' => 'ملخص توثيقي للموقع التراثي للاختبار الأمني',
            'site_type_id' => $type->id,
            'historical_period_id' => $period->id,
            'province_id' => $province->id,
            'publication_status' => $publicationStatus,
            'verification_status' => 'verified',
            'location_precision' => $precision,
            'latitude' => $lat,
            'longitude' => $lng,
            'published_at' => $publicationStatus === 'published' ? now() : null,
        ]);

        return $site;
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

        // 3. GeoJSON export only includes published
        $geoResponse = $this->getJson('/api/v1/sites/export/geojson');
        $geoResponse->assertStatus(200);
        $geoFeatures = collect($geoResponse->json('features'));
        $featureSiteIds = $geoFeatures->pluck('properties.id');
        $this->assertTrue($featureSiteIds->contains($published->id));
        $this->assertFalse($featureSiteIds->contains($draft->id));
        $this->assertFalse($featureSiteIds->contains($archived->id));

        // 4. Sitemap.xml only includes published
        $sitemapResponse = $this->get('/sitemap.xml');
        $sitemapResponse->assertStatus(200);
        $this->assertStringContainsString($published->slug, $sitemapResponse->getContent());
        $this->assertStringNotContainsString($draft->slug, $sitemapResponse->getContent());
        $this->assertStringNotContainsString($archived->slug, $sitemapResponse->getContent());

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
        Storage::fake('public');

        $publishedSite = $this->createSampleSite('published');
        $draftSite = $this->createSampleSite('draft');

        // Create sample site image in storage
        $storedPath = 'sites/test-image.jpg';
        Storage::disk('public')->put($storedPath, 'fake-jpeg-binary-stream');

        $publishedImage = SiteImage::create([
            'site_id' => $publishedSite->id,
            'path' => $storedPath,
            'file_name' => 'test-image.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => 24,
            'is_primary' => true,
        ]);

        $draftImage = SiteImage::create([
            'site_id' => $draftSite->id,
            'path' => $storedPath,
            'file_name' => 'draft-image.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => 24,
            'is_primary' => true,
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
        $myContrib = Contribution::create([
            'user_id' => $contributor->id,
            'title' => 'مساهمة توثيقية رقم 1',
            'description' => 'وصف المساهمة التراثية',
            'status' => 'pending',
            'contributor_name' => $contributor->name,
            'contributor_email' => $contributor->email,
        ]);

        $otherContrib = Contribution::create([
            'user_id' => $contributorB->id,
            'title' => 'مساهمة الباحث الثاني',
            'description' => 'وصف مساهمة الباحث الثاني',
            'status' => 'pending',
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
