<?php

namespace Database\Seeders;

use App\Enums\EvidenceRelevance;
use App\Enums\LocationPrecision;
use App\Enums\PublicationStatus;
use App\Enums\ReliabilityLevel;
use App\Enums\SourceType;
use App\Enums\VerificationStatus;
use App\Models\Area;
use App\Models\HistoricalPeriod;
use App\Models\Province;
use App\Models\Site;
use App\Models\SiteClaim;
use App\Models\SiteType;
use App\Models\Source;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $province = Province::where('code', 'KHA')->firstOrFail();
        $area = Area::firstOrFail();
        $siteType = SiteType::firstOrFail();
        $period = HistoricalPeriod::firstOrFail();
        $user = User::first();

        // 1. Clearly Fake Demo Source
        $demoSource = Source::create([
            'source_type' => SourceType::BOOK,
            'title' => '[بيانات تجريبية] كتاب اختباري وهمي لفحص العلاقات في قاعدة البيانات',
            'author' => 'مؤلف افتراضي غير حقيقي (Demo Author)',
            'publisher' => 'دار نشر تجريبية للاختبار البرمجي',
            'year' => '2026',
            'page_reference' => 'ص 100-105',
            'excerpt' => 'هذا نص اقتباس تجريبي صريح لإثبات سلامة الحقول والعلاقات البرمجية.',
            'reliability_level' => ReliabilityLevel::PRELIMINARY,
            'reliability_notes' => 'سجل تجريبي صريح غير حقيقي.',
            'created_by' => $user?->id,
        ]);

        // 2. Demo Site 1 (Public Exact)
        $demoSite1 = Site::create([
            'permanent_id' => 'KHA-DEMO-001',
            'name_ar' => '[بيانات تجريبية] موقع اختباري افتراضي رقم 1 (أ)',
            'name_en' => '[Demo Data] Synthetic Test Site 1',
            'slug' => 'demo-test-site-001',
            'short_description' => 'سجل اختباري تجريبي للتحقق من سلامة البنية التقنية لقاعدة البيانات.',
            'description' => 'هذا السجل ليس معلماً حقيقياً، وقد أُنشئ عمداً لاختبار جداول قاعدة البيانات والتهجيرات البرمجية.',
            'historical_description' => 'سياق تاريخي تجريبي صريح وغير حقيقي.',
            'architectural_description' => 'وصف معماري تجريبي صريح وغير حقيقي.',
            'cultural_significance' => 'دلالة تجريبية غير حقيقية.',
            'historical_significance' => 'أهمية تجريبية غير حقيقية.',
            'current_condition' => 'حالة تجريبية للاختبار البرمجي.',
            'location_description' => 'موقع تجريبي في بادية كربلاء الافتراضية.',
            'province_id' => $province->id,
            'area_id' => $area->id,
            'site_type_id' => $siteType->id,
            'historical_period_id' => $period->id,
            'publication_status' => PublicationStatus::PUBLISHED,
            'verification_status' => VerificationStatus::UNVERIFIED,
            'location_precision' => LocationPrecision::EXACT,
            'is_demo' => true,
            'ai_assisted' => false,
            'created_by' => $user?->id,
            'last_reviewed_at' => now(),
        ]);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("UPDATE sites SET coordinates = ST_SetSRID(ST_MakePoint(44.0249, 32.6160), 4326)::geography WHERE id = {$demoSite1->id};");
        }

        // Attach Source
        $demoSite1->sources()->attach($demoSource->id, [
            'page_reference' => 'ص 42',
            'excerpt' => 'اقتباس تجريبي',
            'relevance' => 'direct',
        ]);

        // 3. Demo Claim & Evidence
        $claim = SiteClaim::create([
            'site_id' => $demoSite1->id,
            'claim_type' => 'date_of_construction',
            'claim_text' => '[بيانات تجريبية] دعوى تاريخية وهمية لاختبار ربط الأدلة المتنافسة.',
            'is_disputed' => true,
        ]);

        $variant = $claim->variants()->create([
            'scholar_or_school' => 'مدرسة تجريبية افتراضية (أ)',
            'account_text' => 'رواية تجريبية تنافسية أولى لأغراض الاختبار.',
        ]);

        $claim->evidence()->create([
            'claim_variant_id' => $variant->id,
            'source_id' => $demoSource->id,
            'page_reference' => 'ص 55',
            'relevance' => EvidenceRelevance::SUPPORTING,
            'editor_note' => 'ملاحظة تدقيق تجريبية.',
        ]);

        // 4. Demo Site 2 (Restricted Coordinates to test PostGIS security gate)
        $demoSite2 = Site::create([
            'permanent_id' => 'KHA-DEMO-002',
            'name_ar' => '[بيانات تجريبية] تل أثري افتراضي لاختبار حجب الإحداثيات',
            'name_en' => '[Demo Data] Restricted Coordinates Test Mound',
            'slug' => 'demo-test-site-002',
            'short_description' => 'سجل تجريبي لفحص حجب الإحداثيات الدقيقة للمواقع الحساسة.',
            'description' => 'سجل تجريبي صريح غير حقيقي.',
            'historical_description' => 'وصف تجريبي صريح.',
            'architectural_description' => 'وصف تجريبي صريح.',
            'cultural_significance' => 'دلالة تجريبية.',
            'historical_significance' => 'أهمية تجريبية.',
            'current_condition' => 'حالة تجريبية.',
            'location_description' => 'موضع تجريبي حساس.',
            'province_id' => $province->id,
            'area_id' => $area->id,
            'site_type_id' => $siteType->id,
            'historical_period_id' => $period->id,
            'publication_status' => PublicationStatus::PUBLISHED,
            'verification_status' => VerificationStatus::UNVERIFIED,
            'location_precision' => LocationPrecision::RESTRICTED, // RESTRICTED
            'is_demo' => true,
            'ai_assisted' => false,
            'created_by' => $user?->id,
            'last_reviewed_at' => now(),
        ]);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("UPDATE sites SET coordinates = ST_SetSRID(ST_MakePoint(43.6031, 32.4419), 4326)::geography WHERE id = {$demoSite2->id};");
        }
    }
}
