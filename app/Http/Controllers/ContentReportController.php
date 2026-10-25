<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Enums\ReportCategory;
use App\Models\ContentReport;
use App\Models\Site;
use App\Models\SiteImage;
use App\Models\Source;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ContentReportController extends Controller
{
    private const TARGETS = [
        'site' => Site::class,
        'image' => SiteImage::class,
        'source' => Source::class,
    ];

    public function store(Request $request, CreateAuditLogAction $auditLog): JsonResponse
    {
        $validated = $request->validate([
            'target_type' => ['required', Rule::in(array_keys(self::TARGETS))],
            'target_id' => ['required', 'integer', 'min:1'],
            'reason_category' => ['required', Rule::in(array_map(fn ($case) => $case->value, ReportCategory::cases()))],
            'details' => ['required', 'string', 'min:10', 'max:4000'],
            'suggested_correction' => ['nullable', 'string', 'max:4000'],
            'reporter_email' => ['nullable', 'email:rfc', 'max:255'],
        ]);

        $target = self::TARGETS[$validated['target_type']];
        abort_unless($target::query()->whereKey($validated['target_id'])->exists(), 404);

        $report = DB::transaction(function () use ($validated, $target, $request, $auditLog) {
            $report = ContentReport::create([
                'reportable_type' => $target,
                'reportable_id' => $validated['target_id'],
                'reason_category' => $validated['reason_category'],
                'reporter_email' => $validated['reporter_email'] ?? null,
                'details' => trim($validated['details']),
                'suggested_correction' => isset($validated['suggested_correction']) ? trim($validated['suggested_correction']) : null,
                'status' => 'pending',
            ]);

            $auditLog->execute(
                action: 'content_report.submitted',
                entityType: 'ContentReport',
                entityId: (string) $report->id,
                performedBy: 'زائر الأرشيف',
                details: 'إبلاغ توثيقي جديد — التصنيف: '.$validated['reason_category'],
                ipAddress: $request->ip()
            );

            return $report;
        });

        return response()->json([
            'message' => 'تم استلام البلاغ وإحالته إلى قائمة المراجعة.',
            'report' => ['id' => $report->id, 'status' => $report->status],
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $status = $request->validate(['status' => ['sometimes', Rule::in(['pending', 'resolved', 'dismissed'])]])['status'] ?? 'pending';
        $reports = ContentReport::query()->where('status', $status)->latest()->paginate(50);

        $reports->getCollection()->transform(function (ContentReport $report) {
            $targetName = match ($report->reportable_type) {
                Site::class => Site::query()->whereKey($report->reportable_id)->value('name_ar'),
                SiteImage::class => SiteImage::query()->whereKey($report->reportable_id)->value('title'),
                Source::class => Source::query()->whereKey($report->reportable_id)->value('title'),
                default => null,
            };

            return [
                'id' => $report->id,
                'target_type' => array_search($report->reportable_type, self::TARGETS, true) ?: 'unknown',
                'target_id' => $report->reportable_id,
                'target_name' => $targetName ?: 'سجل أرشيفي',
                'reason_category' => $report->reason_category?->value ?? $report->reason_category,
                'reporter_email' => $report->reporter_email,
                'details' => $report->details,
                'suggested_correction' => $report->suggested_correction,
                'status' => $report->status,
                'resolution_note' => $report->resolution_note,
                'created_at' => $report->created_at,
            ];
        });

        return response()->json($reports);
    }

    public function resolve(Request $request, ContentReport $report, CreateAuditLogAction $auditLog): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'resolved', 'dismissed'])],
            'resolution_note' => ['required_unless:status,pending', 'nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($report, $validated, $request, $auditLog) {
            $report->update([
                'status' => $validated['status'],
                'resolution_note' => $validated['resolution_note'] ?? null,
                'resolved_by' => $validated['status'] === 'pending' ? null : $request->user()?->id,
                'resolved_at' => $validated['status'] === 'pending' ? null : now(),
            ]);

            $auditLog->execute(
                action: 'content_report.reviewed',
                entityType: 'ContentReport',
                entityId: (string) $report->id,
                performedBy: $request->user()?->name ?? 'إدارة الأرشيف',
                details: 'تحديث حالة البلاغ إلى '.$validated['status'],
                ipAddress: $request->ip(),
                performedById: $request->user()?->id
            );
        });

        return response()->json(['message' => 'تم تحديث حالة البلاغ.', 'report' => $report->fresh()]);
    }
}
