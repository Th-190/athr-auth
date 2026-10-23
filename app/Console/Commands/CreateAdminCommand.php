<?php

namespace App\Console\Commands;

use App\Actions\CreateAuditLogAction;
use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdminCommand extends Command
{
    protected $signature = 'make:admin {--name= : The administrator display name}';

    protected $description = 'Initialize or recover the single administrator designated by ARCHIVE_ADMIN_EMAIL';

    public function handle(CreateAuditLogAction $auditLogAction): int
    {
        $email = strtolower(trim((string) config('archive.admin_email')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Set ARCHIVE_ADMIN_EMAIL to the designated account before running this command.');
            return self::FAILURE;
        }

        $name = $this->option('name') ?: $this->ask('Administrator name');
        $password = $this->secret('Choose a new administrator password (at least 12 characters)');
        $confirmation = $this->secret('Confirm the administrator password');
        $validator = Validator::make([
            'name' => $name,
            'password' => $password,
            'confirmation' => $confirmation,
        ], [
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:12|max:1024',
            'confirmation' => 'required|same:password',
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return self::FAILURE;
        }

        if (User::withTrashed()->whereRaw('LOWER(email) = ?', [$email])->count() > 1) {
            $this->error('Multiple accounts share ARCHIVE_ADMIN_EMAIL ignoring case. Resolve the duplicate records before initialization.');
            return self::FAILURE;
        }

        $role = Role::firstOrCreate(['name' => 'admin'], [
            'name_ar' => 'مدير الأرشيف',
            'description' => 'الحساب الإداري الوحيد المحدد عبر ARCHIVE_ADMIN_EMAIL',
        ]);
        $user = User::withTrashed()->whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$user) {
            $user = new User();
            $user->email = $email;
        } elseif ($user->trashed()) {
            $user->restore();
        }

        $user->forceFill([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role_id' => $role->id,
            'email_verified_at' => $user->email_verified_at ?? now(),
            'is_active' => true,
            'deactivated_at' => null,
        ])->save();
        $user->tokens()->delete();

        $auditLogAction->execute(
            action: 'admin.cli_initialized',
            entityType: 'User',
            entityId: (string) $user->id,
            performedBy: 'CLI deployment operator',
            details: 'Initialized or recovered the designated archive administrator account.',
            ipAddress: '127.0.0.1',
            performedById: $user->id
        );

        $this->info('The designated administrator account is ready. The password was stored as a hash.');
        return self::SUCCESS;
    }
}
