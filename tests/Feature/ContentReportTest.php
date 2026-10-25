<?php

use App\Models\ContentReport;
use App\Models\Role;
use App\Models\Source;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('a visitor report is persisted and available to authorized administration only', function () {
    $source = Source::create([
        'source_type' => 'book',
        'title' => 'مرجع اختبار البلاغ',
        'author' => 'باحث اختبار',
    ]);

    $response = $this->postJson('/api/v1/reports', [
        'target_type' => 'source',
        'target_id' => $source->id,
        'reason_category' => 'incorrect_source',
        'details' => 'بيانات المرجع تحتاج إلى مراجعة دقيقة.',
        'suggested_correction' => 'يرجى مراجعة سنة النشر.',
        'reporter_email' => 'researcher@example.org',
    ]);

    $response->assertCreated()->assertJsonPath('report.status', 'pending');
    $this->assertDatabaseHas('content_reports', [
        'reportable_type' => Source::class,
        'reportable_id' => $source->id,
        'status' => 'pending',
    ]);
    $this->getJson('/api/v1/admin/reports')->assertUnauthorized();

    $role = Role::firstOrCreate(['name' => 'admin'], ['name_ar' => 'مدير الأرشيف']);
    $admin = User::create([
        'name' => 'مدير اختبار',
        'email' => 'reports.admin@example.org',
        'password' => Hash::make('password123'),
        'role_id' => $role->id,
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $this->actingAs($admin)->getJson('/api/v1/admin/reports')
        ->assertOk()
        ->assertJsonPath('data.0.target_name', 'مرجع اختبار البلاغ');

    $report = ContentReport::firstOrFail();
    $this->actingAs($admin)->putJson("/api/v1/admin/reports/{$report->id}", [
        'status' => 'resolved',
        'resolution_note' => 'تمت مطابقة المصدر وتصحيح بياناته.',
    ])->assertOk();

    $this->assertDatabaseHas('content_reports', [
        'id' => $report->id,
        'status' => 'resolved',
        'resolution_note' => 'تمت مطابقة المصدر وتصحيح بياناته.',
    ]);
});

test('invalid report submissions do not produce a success response', function () {
    $this->postJson('/api/v1/reports', [
        'target_type' => 'site',
        'target_id' => 999999,
        'reason_category' => 'not-a-category',
        'details' => 'قصيرة',
    ])->assertUnprocessable();

    $this->assertDatabaseCount('content_reports', 0);
});
