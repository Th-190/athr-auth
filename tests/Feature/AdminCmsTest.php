<?php

use App\Models\Area;
use App\Models\HistoricalPeriod;
use App\Models\Role;
use App\Models\Site;
use App\Models\SiteType;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

test('unauthorized users get 401 or 403 on admin routes', function () {
    // 1. Guest request
    $response = $this->getJson('/api/v1/admin/users');
    $response->assertStatus(401);

    // 2. Viewer user request
    $viewerRole = Role::firstOrCreate(['name' => 'viewer'], ['name_ar' => 'مشاهد']);
    $viewer = User::create([
        'name' => 'زائر تجريبي',
        'email' => 'viewer@test.com',
        'password' => Hash::make('password123'),
        'role_id' => $viewerRole->id,
        'email_verified_at' => now(),
    ]);

    $response = $this->actingAs($viewer)->getJson('/api/v1/admin/users');
    $response->assertStatus(403);
});

test('make:admin cli command creates initial admin', function () {
    Artisan::call('make:admin', [
        '--name' => 'مدير النظام الأول',
        '--email' => 'first.admin@karbalaheritage.iq',
        '--password' => 'SecurePass2026!',
    ]);

    $admin = User::where('email', 'first.admin@karbalaheritage.iq')->first();
    expect($admin)->not->toBeNull();
    expect($admin->role->name)->toBe('admin');
    expect($admin->is_active)->toBeTrue();
});

test('admin can manage users and cannot delete the last active admin', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin'], ['name_ar' => 'مدير الأرشيف']);
    $admin = User::create([
        'name' => 'المدير الوحيد',
        'email' => 'sole.admin@karbalaheritage.iq',
        'password' => Hash::make('password123'),
        'role_id' => $adminRole->id,
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    // Attempting to delete the last active admin must fail with 422
    $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/users/{$admin->id}");
    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'مرفوض: لا يمكن حذف آخر مدير نشط في النظام.']);

    // Attempting to deactivate the last active admin must fail with 422
    $response = $this->actingAs($admin)->postJson("/api/v1/admin/users/{$admin->id}/deactivate");
    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'مرفوض: لا يمكن تعطيل حساب آخر مدير نشط في النظام.']);

    // Admin creates second admin
    $response = $this->actingAs($admin)->postJson('/api/v1/admin/users', [
        'name' => 'مساعد مدير',
        'email' => 'assistant@karbalaheritage.iq',
        'password' => 'Assistant2026!',
        'role' => 'admin',
    ]);
    $response->assertStatus(201);

    $secondAdmin = User::where('email', 'assistant@karbalaheritage.iq')->first();
    expect($secondAdmin)->not->toBeNull();

    // Now second admin can be deactivated
    $response = $this->actingAs($admin)->postJson("/api/v1/admin/users/{$secondAdmin->id}/deactivate");
    $response->assertStatus(200);
    expect($secondAdmin->fresh()->is_active)->toBeFalse();
});

test('taxonomies in use cannot be deleted', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin'], ['name_ar' => 'مدير الأرشيف']);
    $admin = User::create([
        'name' => 'مدير التصنيفات',
        'email' => 'tax.admin@karbalaheritage.iq',
        'password' => Hash::make('password123'),
        'role_id' => $adminRole->id,
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $type = SiteType::create([
        'name_ar' => 'حصون تاريخية',
        'name_en' => 'Forts',
        'slug' => 'forts-tax-test',
        'definition' => 'قلاع وحصون دفاعية',
    ]);

    // Attach to a dummy site
    $province = \App\Models\Province::create(['code' => 'K1', 'name_ar' => 'كربلاء', 'name_en' => 'Karbala', 'slug' => 'k1']);
    $district = $province->districts()->create(['name_ar' => 'مركز', 'name_en' => 'Center', 'slug' => 'c1']);
    $subDistrict = $district->subDistricts()->create(['name_ar' => 'ناحية', 'name_en' => 'Sub', 'slug' => 's1']);
    $area = $subDistrict->areas()->create(['name_ar' => 'حي', 'name_en' => 'Area', 'slug' => 'a1']);
    $period = HistoricalPeriod::create(['name_ar' => 'إسلامي', 'name_en' => 'Islamic', 'slug' => 'isl', 'start_year_label' => '600', 'end_year_label' => '1200', 'description' => 'عصر إسلامي']);

    Site::create([
        'permanent_id' => 'KHA-TEST-999',
        'name_ar' => 'موقع تجريبي للحذف',
        'slug' => 'test-delete-site',
        'short_description' => 'وصف قصير',
        'description' => 'وصف كامل',
        'historical_description' => 'تاريخ',
        'architectural_description' => 'عمارة',
        'cultural_significance' => 'ثقافة',
        'historical_significance' => 'تاريخية',
        'current_condition' => 'جيدة',
        'location_description' => 'موقع',
        'province_id' => $province->id,
        'district_id' => $district->id,
        'sub_district_id' => $subDistrict->id,
        'area_id' => $area->id,
        'site_type_id' => $type->id,
        'historical_period_id' => $period->id,
        'publication_status' => 'draft',
        'verification_status' => 'unverified',
    ]);

    // Deleting in-use type must fail with 422
    $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/taxonomies/types/{$type->id}");
    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'مرفوض: لا يمكن حذف هذا النوع لوجود معالم أثرية مرتبطة به (1). يمكنك تعطيله بدلاً من حذفه.']);
});

test('publishing workflow and verification with mandatory rationale works', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin'], ['name_ar' => 'مدير الأرشيف']);
    $admin = User::create([
        'name' => 'مدير النشر',
        'email' => 'publish.admin@karbalaheritage.iq',
        'password' => Hash::make('password123'),
        'role_id' => $adminRole->id,
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $province = \App\Models\Province::create(['code' => 'K2', 'name_ar' => 'كربلاء', 'name_en' => 'Karbala', 'slug' => 'k2']);
    $district = $province->districts()->create(['name_ar' => 'قضاء', 'name_en' => 'Dist', 'slug' => 'd2']);
    $subDistrict = $district->subDistricts()->create(['name_ar' => 'ناحية', 'name_en' => 'Sub2', 'slug' => 's2']);
    $area = $subDistrict->areas()->create(['name_ar' => 'منطقة', 'name_en' => 'Area2', 'slug' => 'a2']);
    $type = SiteType::create(['name_ar' => 'خانات', 'name_en' => 'Caravansaries', 'slug' => 'caravans', 'definition' => 'محطات']);
    $period = HistoricalPeriod::create(['name_ar' => 'عثماني', 'name_en' => 'Ottoman', 'slug' => 'ott', 'start_year_label' => '1534', 'end_year_label' => '1918', 'description' => 'عهد عثماني']);

    $site = Site::create([
        'permanent_id' => 'KHA-TEST-888',
        'name_ar' => 'خان النخيلة الأثري',
        'slug' => 'nukhaylah-test',
        'short_description' => 'خان قوافل شهير يقع على طريق كربلاء النجف',
        'description' => 'وصف كامل للخان ومرافقه',
        'historical_description' => 'تاريخ الخان في العصر العثماني',
        'architectural_description' => 'عمارة الإيوان والقباب',
        'cultural_significance' => 'محطة استراحة الزوار',
        'historical_significance' => 'شاهد تجاري وديني',
        'current_condition' => 'شاخص ويحتاج صيانة',
        'location_description' => 'طريق كربلاء النجف القديم',
        'province_id' => $province->id,
        'district_id' => $district->id,
        'sub_district_id' => $subDistrict->id,
        'area_id' => $area->id,
        'site_type_id' => $type->id,
        'historical_period_id' => $period->id,
        'publication_status' => 'draft',
        'verification_status' => 'unverified',
    ]);

    // 1. Publish site
    $res = $this->actingAs($admin)->postJson("/api/v1/admin/sites/{$site->id}/publish");
    $res->assertStatus(200);
    expect($site->fresh()->publication_status->value)->toBe('published');

    // 2. Unpublish site
    $res = $this->actingAs($admin)->postJson("/api/v1/admin/sites/{$site->id}/unpublish");
    $res->assertStatus(200);
    expect($site->fresh()->publication_status->value)->toBe('draft');

    // 3. Verification requires reason
    $res = $this->actingAs($admin)->postJson("/api/v1/admin/sites/{$site->id}/verify", [
        'verification_status' => 'verified',
        'reason' => 'قصيرة', // Too short, requires min 10
    ]);
    $res->assertStatus(422);

    $res = $this->actingAs($admin)->postJson("/api/v1/admin/sites/{$site->id}/verify", [
        'verification_status' => 'verified',
        'reason' => 'تم التحقق بمطابقة مسوح دائرة الآثار والتراث العامة لسنة 1974 والمسح الميداني الأخير.',
    ]);
    $res->assertStatus(200);
    expect($site->fresh()->verification_status->value)->toBe('verified');
});
