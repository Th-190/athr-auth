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
    protected $signature = 'make:admin 
                            {--email= : The email address for the administrator}
                            {--name= : The full name of the administrator}
                            {--password= : The secure password for the administrator}';

    protected $description = 'Create or promote the initial authorized administrator account for Karbala Heritage Archive';

    public function handle(CreateAuditLogAction $auditLogAction): int
    {
        $this->info('====================================================');
        $this->info(' «أثر كربلاء» — إنشاء حساب المدير العام (Admin CLI)');
        $this->info('====================================================');

        $email = $this->option('email') ?: $this->ask('البريد الإلكتروني للمدير (Email)');
        $name = $this->option('name') ?: $this->ask('الاسم الكامل (Full Name)');
        $password = $this->option('password') ?: $this->secret('كلمة المرور الآمنة (Password, min 8 chars)');

        $validator = Validator::make([
            'email' => $email,
            'name' => $name,
            'password' => $password,
        ], [
            'email' => 'required|email|max:255',
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:8',
        ], [
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'email.email' => 'البريد الإلكتروني غير صالح.',
            'name.required' => 'الاسم مطلوب.',
            'password.min' => 'كلمة المرور يجب أن لا تقل عن 8 خانات.',
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $err) {
                $this->error("خطأ: {$err}");
            }
            return self::FAILURE;
        }

        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            [
                'name_ar' => 'مدير النظام العام',
                'description' => 'صلاحيات إدارة كاملة للأرشيف والمعالم والمستخدمين والتحقيق والنشر',
            ]
        );

        $user = User::where('email', strtolower($email))->first();

        if ($user) {
            $user->role_id = $adminRole->id;
            $user->password = Hash::make($password);
            $user->name = $name;
            $user->email_verified_at = now();
            if (isset($user->is_active)) {
                $user->is_active = true;
                $user->deactivated_at = null;
            }
            $user->save();

            $this->info("✓ تم ترقية المستخدم الحالي ({$user->email}) إلى رتبة مدير معتمد بنجاح.");
        } else {
            $user = User::create([
                'name' => $name,
                'email' => strtolower($email),
                'password' => Hash::make($password),
                'role_id' => $adminRole->id,
                'email_verified_at' => now(),
                'is_active' => true,
            ]);

            $this->info("✓ تم إنشاء حساب المدير الجديد ({$user->email}) وتوثيقه بنجاح.");
        }

        try {
            $auditLogAction->execute(
                action: 'admin.cli_created',
                entityType: 'User',
                entityId: (string) $user->id,
                performedBy: 'CLI System Console',
                details: "تم إنشاء/ترقية المدير الأرشيفي ({$user->email}) عبر أمر CLI الآمن",
                ipAddress: '127.0.0.1'
            );
        } catch (\Throwable $e) {
            // Ignore audit log error in CLI if DB not fully seeded
        }

        $this->table(
            ['الحقل', 'القيمة'],
            [
                ['المعرف', $user->id],
                ['الاسم', $user->name],
                ['البريد الإلكتروني', $user->email],
                ['الصلاحية', $adminRole->name_ar . ' (admin)'],
                ['حالة الحساب', 'نشط وموثق'],
            ]
        );

        return self::SUCCESS;
    }
}
