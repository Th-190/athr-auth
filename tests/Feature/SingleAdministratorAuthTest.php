<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SingleAdministratorAuthTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $email, string $roleName = 'admin'): User
    {
        $role = Role::firstOrCreate(['name' => $roleName], ['name_ar' => $roleName]);
        return User::create(['name' => 'Test User', 'email' => $email, 'password' => Hash::make('Strong-test-password-123'), 'role_id' => $role->id, 'email_verified_at' => now(), 'is_active' => true]);
    }

    public function test_public_pages_are_anonymous_but_admin_routes_and_writes_are_protected(): void
    {
        $this->get('/')->assertOk();
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->getJson('/api/v1/admin/users')->assertUnauthorized();
        $this->postJson('/api/v1/admin/sites', [])->assertUnauthorized();
        $this->postJson('/api/v1/admin/sites/1/verify', [])->assertUnauthorized();
    }

    public function test_only_configured_administrator_can_login_and_manage_users(): void
    {
        config(['archive.admin_email' => 'designated@example.test']);
        $admin = $this->user('designated@example.test');
        $this->user('other-admin@example.test');
        $this->get('/admin/login')->assertOk();
        $this->post('/admin/login', ['email' => $admin->email, 'password' => 'Strong-test-password-123'])->assertRedirect('/admin');
        $this->get('/admin')->assertOk();
        $this->getJson('/api/v1/admin/users')->assertOk();
        $this->post('/admin/logout')->assertRedirect('/admin/login');
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->post('/admin/login', ['email' => 'other-admin@example.test', 'password' => 'Strong-test-password-123'])->assertSessionHasErrors('email');
    }

    public function test_duplicate_case_insensitive_designated_emails_fail_closed(): void
    {
        config(['archive.admin_email' => 'same@example.test']);
        $first = $this->user('same@example.test');
        $second = $this->user('SAME@example.test');
        $this->assertFalse(\App\Support\AdminAccess::isDesignatedAdministrator($first));
        $this->assertFalse(\App\Support\AdminAccess::isDesignatedAdministrator($second));
    }

    public function test_invalid_credentials_are_generic_and_login_attempts_are_throttled(): void
    {
        config(['archive.admin_email' => 'designated@example.test']);
        $this->user('designated@example.test');
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->post('/admin/login', ['email' => 'designated@example.test', 'password' => 'wrong-password'])->assertSessionHasErrors('email');
        }
        $this->post('/admin/login', ['email' => 'designated@example.test', 'password' => 'wrong-password'])->assertStatus(429);
    }

    public function test_admin_creation_api_and_google_oauth_route_are_unavailable(): void
    {
        config(['archive.admin_email' => 'designated@example.test']);
        $admin = $this->user('designated@example.test');
        $this->actingAs($admin)->postJson('/api/v1/admin/users', ['name' => 'Extra admin', 'email' => 'extra@example.test', 'password' => 'Strong-test-password-123', 'role' => 'admin'])->assertUnprocessable();
        $this->postJson('/api/v1/auth/google', ['id_token' => 'anything'])->assertNotFound();
        $this->assertDatabaseMissing('users', ['email' => 'extra@example.test']);
    }

    public function test_protected_admin_initializer_requires_designated_email_and_hashes_password(): void
    {
        config(['archive.admin_email' => 'bootstrap@example.test']);
        $this->artisan('make:admin --name="Initial Administrator"')
            ->expectsQuestion('Choose a new administrator password (at least 12 characters)', 'Bootstrap-password-123')
            ->expectsQuestion('Confirm the administrator password', 'Bootstrap-password-123')
            ->assertExitCode(0);
        $admin = User::where('email', 'bootstrap@example.test')->firstOrFail();
        $this->assertTrue(Hash::check('Bootstrap-password-123', $admin->password));
        $this->assertNotSame('Bootstrap-password-123', $admin->password);
    }
}


