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
        $this->get('/admin/login')->assertOk()->assertSee('action="/admin/login"', false);
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->getJson('/api/v1/admin/users')->assertUnauthorized();
        $this->postJson('/api/v1/admin/sites', [])->assertUnauthorized();
        $this->postJson('/api/v1/admin/sites/1/verify', [])->assertUnauthorized();
    }

    public function test_admin_login_emits_session_cookie_and_disables_caching(): void
    {
        $response = $this->get('/admin/login');

        $response->assertOk()
            ->assertCookie(config('session.cookie'))
            ->assertHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0')
            ->assertSee('name="_token"', false);

        $sessionConfig = file_get_contents(config_path('session.php'));
        $this->assertIsString($sessionConfig);
        $this->assertStringStartsNotWith("\xEF\xBB\xBF", $sessionConfig, 'Session config must not emit a UTF-8 BOM before HTTP headers.');
    }

    public function test_three_super_admins_authenticate_independently_and_fourth_active_account_is_rejected(): void
    {
        config(['auth.require_admin_2fa' => false]);
        $admin = $this->user('first@example.test', 'super_admin');
        $this->actingAs($admin)->postJson('/api/v1/admin/users', [
            'name' => 'Second Super Admin', 'email' => 'second@example.test',
            'password' => 'Second-Strong-password-456', 'role' => 'super_admin',
        ])->assertCreated();
        $this->actingAs($admin)->postJson('/api/v1/admin/users', [
            'name' => 'Third Super Admin', 'email' => 'third@example.test',
            'password' => 'Third-Strong-password-789', 'role' => 'super_admin',
        ])->assertCreated();

        for ($index = 0; $index < 35; $index++) {
            $this->user("editor-{$index}@example.test", 'editor');
        }
        $this->actingAs($admin)->getJson('/api/v1/admin/users')
            ->assertOk()
            ->assertJsonPath('users.data.0.role', 'super_admin')
            ->assertJsonPath('users.data.1.role', 'super_admin')
            ->assertJsonPath('users.data.2.role', 'super_admin');

        $this->post('/admin/logout');
        $this->get('/admin/login')->assertOk();
        foreach ([
            'first@example.test' => 'Strong-test-password-123',
            'second@example.test' => 'Second-Strong-password-456',
            'third@example.test' => 'Third-Strong-password-789',
        ] as $email => $password) {
            $this->post('/admin/login', ['email' => $email, 'password' => $password])->assertRedirect('/admin');
            $this->get('/admin')->assertOk();
            $this->getJson('/api/v1/admin/users')
                ->assertOk()
                ->assertJsonPath('super_admin_limit', 3)
                ->assertJsonPath('active_super_admin_count', 3);
            $this->getJson('/api/v1/admin/editorial/filters')->assertOk();
            $this->postJson('/api/v1/admin/sites', [])->assertUnprocessable();
            $this->post('/admin/logout')->assertRedirect('/admin/login');
        }

        $this->actingAs($admin)->postJson('/api/v1/admin/users', [
            'name' => 'Disabled Historical Super Admin', 'email' => 'inactive-fourth@example.test',
            'password' => 'Strong-test-password-123', 'role' => 'super_admin', 'is_active' => false,
        ])->assertCreated();
        $inactiveFourth = User::where('email', 'inactive-fourth@example.test')->firstOrFail();
        $this->actingAs($admin)->postJson("/api/v1/admin/users/{$inactiveFourth->id}/activate")->assertUnprocessable();

        $this->actingAs($admin)->postJson('/api/v1/admin/users', [
            'name' => 'Fourth Super Admin', 'email' => 'fourth@example.test',
            'password' => 'Strong-test-password-123', 'role' => 'super_admin',
        ])->assertUnprocessable();
        $this->assertDatabaseMissing('users', ['email' => 'fourth@example.test']);

        $this->actingAs($admin)->postJson('/api/v1/admin/users', [
            'name' => 'Editor to Promote', 'email' => 'promote-me@example.test',
            'password' => 'Strong-test-password-123', 'role' => 'editor',
        ])->assertCreated();
        $promoteMe = User::where('email', 'promote-me@example.test')->firstOrFail();
        $this->actingAs($admin)->putJson("/api/v1/admin/users/{$promoteMe->id}/role", ['role' => 'super_admin'])->assertUnprocessable();
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

    public function test_only_active_super_admin_can_create_or_manage_super_admin_accounts(): void
    {
        config(['auth.require_admin_2fa' => false]);
        $editor = $this->user('editor@example.test', 'editor');
        $this->actingAs($editor)->postJson('/api/v1/admin/users', [
            'name' => 'Escalated Account', 'email' => 'escalated@example.test',
            'password' => 'Strong-test-password-123', 'role' => 'super_admin',
        ])->assertForbidden();

        $admin = $this->user('active-super@example.test', 'super_admin');
        $disabledAdmin = $this->user('disabled-super@example.test', 'super_admin');
        config(['archive.admin_email' => 'legacy-admin@example.test']);
        $legacyAdmin = $this->user('legacy-admin@example.test', 'admin');
        $this->actingAs($legacyAdmin)->postJson('/api/v1/admin/users', [
            'name' => 'Unauthorized Super Admin', 'email' => 'legacy-promotion@example.test',
            'password' => 'Strong-test-password-123', 'role' => 'super_admin',
        ])->assertForbidden();
        $editorTarget = $this->user('promotion-target@example.test', 'editor');
        $this->actingAs($legacyAdmin)->putJson("/api/v1/admin/users/{$editorTarget->id}/role", ['role' => 'super_admin'])->assertForbidden();

        $disabledAdmin->update(['is_active' => false, 'deactivated_at' => now()]);
        $this->actingAs($admin)->postJson("/api/v1/admin/users/{$disabledAdmin->id}/activate")->assertOk();
        $this->assertTrue($disabledAdmin->fresh()->is_active);

        $disabledAdmin->update(['is_active' => false, 'deactivated_at' => now()]);
        $this->actingAs($disabledAdmin)->getJson('/api/v1/admin/users')->assertForbidden();
        $this->post('/admin/login', ['email' => $disabledAdmin->email, 'password' => 'Strong-test-password-123'])->assertSessionHasErrors('email');
    }

    public function test_last_active_super_admin_cannot_be_deactivated_deleted_or_demoted(): void
    {
        config(['auth.require_admin_2fa' => false]);
        $admin = $this->user('only-super@example.test', 'super_admin');

        $this->actingAs($admin)->postJson("/api/v1/admin/users/{$admin->id}/deactivate")->assertUnprocessable();
        $this->actingAs($admin)->deleteJson("/api/v1/admin/users/{$admin->id}")->assertUnprocessable();
        $this->actingAs($admin)->putJson("/api/v1/admin/users/{$admin->id}/role", ['role' => 'editor'])->assertUnprocessable();

        $this->assertTrue($admin->fresh()->is_active);
        $this->assertSame('super_admin', $admin->fresh()->role->name);
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
        $this->assertSame('super_admin', $admin->role->name);
    }
}


