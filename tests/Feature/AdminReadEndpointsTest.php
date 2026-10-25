<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('admin media and site option endpoints return valid empty pages', function () {
    $this->getJson('/api/v1/admin/media')->assertUnauthorized();
    $this->getJson('/api/v1/admin/site-options')->assertUnauthorized();

    $role = Role::firstOrCreate(['name' => 'admin'], ['name_ar' => 'مدير الأرشيف']);
    $admin = User::create([
        'name' => 'مدير اختبار المكتبة',
        'email' => 'media.admin@example.org',
        'password' => Hash::make('password123'),
        'role_id' => $role->id,
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $this->actingAs($admin)->getJson('/api/v1/admin/media')
        ->assertOk()
        ->assertJsonPath('data', []);

    $this->actingAs($admin)->getJson('/api/v1/admin/site-options')
        ->assertOk()
        ->assertJsonPath('data', []);

    $this->actingAs($admin)->getJson('/api/v1/admin/editorial?kind=sites')
        ->assertOk()
        ->assertJsonPath('data', []);
});
