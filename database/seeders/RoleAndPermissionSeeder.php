<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'visitor' => ['name_ar' => 'زائر', 'description' => 'تصفح عام وقراءة فقط'],
            'contributor' => ['name_ar' => 'مساهم', 'description' => 'اقتراح معالم وإرسال صور وتصويبات'],
            'editor' => ['name_ar' => 'محرر وباحث', 'description' => 'تحرير السجلات والمصادقة على التحقيق ونشر المحتوى'],
            'admin' => ['name_ar' => 'مدير أرشيف', 'description' => 'إدارة المستخدمين والمستودع والتدقيق الإداري'],
            'super_admin' => ['name_ar' => 'مدير النظام', 'description' => 'كامل الصلاحيات الفنية وقواعد البيانات'],
        ];

        $roleModels = [];
        foreach ($roles as $key => $data) {
            $roleModels[$key] = Role::firstOrCreate(
                ['name' => $key],
                ['name_ar' => $data['name_ar'], 'description' => $data['description']]
            );
        }

        // Seed a default admin user for testing
        User::firstOrCreate(
            ['email' => 'admin@karbala-archive.iq'],
            [
                'name' => 'مدير الأرشيف النموذجي',
                'password' => Hash::make('password123'),
                'role_id' => $roleModels['admin']->id,
                'email_verified_at' => now(),
            ]
        );
    }
}
