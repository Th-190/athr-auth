<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Models\Site;
use App\Models\SiteRevision;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CmsConfigController extends Controller
{
    private const KEYS = [
        'homepage' => 'cms.homepage',
        'navigation' => 'cms.navigation',
        'footer_columns' => 'cms.footer_columns',
        'settings' => 'cms.settings',
        'featured_site_ids' => 'cms.featured_site_ids',
    ];

    public function __construct(private readonly CreateAuditLogAction $auditLogAction) {}

    public function publicConfig(): JsonResponse
    {
        return response()->json(['cms' => $this->readConfig()]);
    }

    public function show(): JsonResponse
    {
        return response()->json(['cms' => $this->readConfig()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'homepage' => ['required', 'array'],
            'homepage.headline' => ['required', 'string', 'max:255'],
            'homepage.description' => ['required', 'string', 'max:2000'],
            'homepage.search_placeholder' => ['required', 'string', 'max:255'],
            'homepage.announcement_active' => ['required', 'boolean'],
            'homepage.announcement_text' => ['nullable', 'string', 'max:1000'],
            'homepage.announcement_link_text' => ['nullable', 'string', 'max:255'],
            'homepage.announcement_link_tab' => ['required', 'string', 'max:80'],
            'navigation' => ['required', 'array', 'max:30'],
            'navigation.*.id' => ['required', 'string', 'max:80'],
            'navigation.*.label_ar' => ['required', 'string', 'max:100'],
            'navigation.*.tab' => ['required', 'string', 'max:80'],
            'navigation.*.visible' => ['required', 'boolean'],
            'navigation.*.sort_order' => ['required', 'integer', 'min:0'],
            'footer_columns' => ['required', 'array', 'max:10'],
            'footer_columns.*.id' => ['required', 'string', 'max:80'],
            'footer_columns.*.title_ar' => ['required', 'string', 'max:150'],
            'footer_columns.*.links' => ['required', 'array', 'max:30'],
            'footer_columns.*.links.*.id' => ['required', 'string', 'max:80'],
            'footer_columns.*.links.*.label_ar' => ['required', 'string', 'max:150'],
            'footer_columns.*.links.*.tab' => ['required', 'string', 'max:80'],
            'settings' => ['required', 'array'],
            'settings.site_name_ar' => ['required', 'string', 'max:255'],
            'settings.site_name_en' => ['nullable', 'string', 'max:255'],
            'settings.tagline_ar' => ['nullable', 'string', 'max:500'],
            'settings.contact_email' => ['required', 'email', 'max:255'],
            'settings.contact_note' => ['nullable', 'string', 'max:500'],
            'settings.footer_copyright' => ['nullable', 'string', 'max:1000'],
            'settings.allow_public_contributions' => ['required', 'boolean'],
            'settings.seo_description' => ['required', 'string', 'max:1000'],
            'featured_site_ids' => ['present', 'array', 'max:50'],
            'featured_site_ids.*' => ['required', 'integer', 'distinct', 'exists:sites,id'],
        ]);

        $featuredIds = array_map('intval', $data['featured_site_ids']);
        $eligibleCount = Site::query()->whereIn('id', $featuredIds)
            ->where('publication_status', 'published')->where('is_demo', false)->count();
        if ($eligibleCount !== count($featuredIds)) {
            throw ValidationException::withMessages([
                'featured_site_ids' => ['يمكن إبراز المعالم المنشورة وغير التجريبية فقط.'],
            ]);
        }

        DB::transaction(function () use ($data, $featuredIds, $request): void {
            $sitesToUpdate = Site::query()->where('featured', true)->orWhereIn('id', $featuredIds)
                ->lockForUpdate()->get(['id', 'featured', 'verification_status']);
            foreach ($sitesToUpdate as $site) {
                $shouldBeFeatured = in_array((int) $site->id, $featuredIds, true);
                if ((bool) $site->featured === $shouldBeFeatured) {
                    continue;
                }

                SiteRevision::create([
                    'site_id' => $site->id,
                    'field_name' => 'featured',
                    'old_value' => $site->featured ? '1' : '0',
                    'new_value' => $shouldBeFeatured ? '1' : '0',
                    'changed_by' => $request->user()->id,
                    'reason' => 'تحديث قائمة المعالم البارزة في الصفحة الرئيسية',
                    'verification_status_at_time' => $site->verification_status->value,
                ]);
                $site->featured = $shouldBeFeatured;
                $site->save();
                $this->auditLogAction->execute(
                    'site.homepage_featured_updated', Site::class, (string) $site->id,
                    $request->user()->name, 'تحديث ظهور المعلم ضمن المعالم البارزة.',
                    $request->ip(), $request->user()->id,
                );
            }

            foreach (self::KEYS as $field => $key) {
                $value = $field === 'featured_site_ids' ? $featuredIds : $data[$field];
                Setting::updateOrCreate(['key' => $key], [
                    'value' => json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                    'type' => 'json',
                    'group' => 'cms',
                    'description' => 'CMS '.$field.' configuration',
                ]);
            }

            $this->auditLogAction->execute(
                'cms.configuration_updated', Setting::class, 'cms',
                $request->user()->name, 'تحديث إعدادات الصفحة الرئيسية والتنقل والتذييل.',
                $request->ip(), $request->user()->id,
            );
        });

        return response()->json([
            'message' => 'تم حفظ إعدادات إدارة المحتوى في قاعدة البيانات.',
            'cms' => $this->readConfig(),
        ]);
    }

    /** @return array<string, mixed> */
    private function readConfig(): array
    {
        $stored = Setting::query()->whereIn('key', array_values(self::KEYS))->pluck('value', 'key');
        $config = [];
        foreach (self::KEYS as $field => $key) {
            $value = $stored->get($key);
            if ($value !== null) {
                try {
                    $config[$field] = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
                } catch (\JsonException) {
                    report(new \UnexpectedValueException('Invalid JSON stored for CMS setting '.$field));
                }
            }
        }

        // Preserve site settings written by the earlier general-settings screen.
        if (! isset($config['settings'])) {
            $legacy = Setting::query()->whereIn('key', [
                'site_name_ar', 'site_name_en', 'tagline_ar', 'contact_email', 'contact_note',
                'footer_copyright', 'allow_public_contributions',
            ])->pluck('value', 'key');
            if ($legacy->isNotEmpty()) {
                $config['settings'] = [
                    'site_name_ar' => $legacy->get('site_name_ar'),
                    'site_name_en' => $legacy->get('site_name_en'),
                    'tagline_ar' => $legacy->get('tagline_ar'),
                    'contact_email' => $legacy->get('contact_email'),
                    'contact_note' => $legacy->get('contact_note'),
                    'footer_copyright' => $legacy->get('footer_copyright'),
                    'allow_public_contributions' => in_array($legacy->get('allow_public_contributions'), ['1', 'true', 'on'], true),
                ];
            }
        }

        return $config;
    }
}
