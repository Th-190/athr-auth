<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function __construct(
        protected CreateAuditLogAction $auditLogAction
    ) {}

    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : (string) $value,
                    'type' => is_array($value) ? 'json' : 'string',
                ]
            );
        }

        $this->auditLogAction->execute(
            action: 'settings.updated',
            entityType: 'Setting',
            entityId: 'global',
            performedBy: (string) ($request->user()?->name ?? 'مدير النظام'),
            details: "تحديث إعدادات الموقع والصفحة الرئيسية",
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'تم حفظ وتحديث إعدادات الموقع بنجاح',
            'settings' => Setting::all()->pluck('value', 'key'),
        ]);
    }
}
