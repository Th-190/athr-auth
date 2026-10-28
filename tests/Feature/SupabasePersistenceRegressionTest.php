<?php

use App\Models\Role;
use App\Models\Source;
use App\Models\User;
use Database\Seeders\SiteTypeSeeder;

beforeEach(function (): void {
    $this->seed(Database\Seeders\RoleAndPermissionSeeder::class);
});

test('admin bibliography writes are persisted and returned from the database', function (): void {
    $role = Role::firstOrCreate(['name' => 'admin'], ['name_ar' => 'مدير']);
    $admin = User::create([
        'name' => 'Persistence test admin',
        'email' => 'source-persistence@example.test',
        'password' => 'safe-test-password',
        'role_id' => $role->id,
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->postJson('/api/v1/admin/sources', [
        'source_type' => 'book',
        'title' => 'Reference persistence test',
        'author' => 'Test author',
        'reliability_level' => 'medium',
        'language' => 'ar',
    ]);

    $response->assertCreated()->assertJsonPath('source.title', 'Reference persistence test');
    $this->assertDatabaseHas('sources', [
        'id' => $response->json('source.id'),
        'title' => 'Reference persistence test',
        'author' => 'Test author',
    ]);
    expect(Source::findOrFail($response->json('source.id'))->reliability_level->value)->toBe('medium');
});

test('reference seeder preserves existing editorial taxonomy values', function (): void {
    $type = \App\Models\SiteType::create([
        'name_ar' => 'تصنيف تحريري',
        'name_en' => 'Editorial taxonomy',
        'slug' => 'palaces-and-forts',
        'definition' => 'تعريف راجعه محرر.',
        'icon' => 'Landmark',
        'sort_order' => 12,
    ]);

    app(SiteTypeSeeder::class)->run();

    expect($type->fresh()->definition)->toBe('تعريف راجعه محرر.');
});
