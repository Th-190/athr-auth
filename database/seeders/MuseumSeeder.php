<?php

namespace Database\Seeders;

use App\Enums\LocationPrecision;
use App\Enums\PublicationStatus;
use App\Enums\VerificationStatus;
use App\Models\Area;
use App\Models\HistoricalPeriod;
use App\Models\MuseumProfile;
use App\Models\Province;
use App\Models\ResearchLead;
use App\Models\Site;
use App\Models\SiteName;
use App\Models\SiteType;
use App\Models\User;
use Illuminate\Database\Seeder;

class MuseumSeeder extends Seeder
{
    public function run(): void
    {
        $province = Province::where('code', 'KHA')->first();
        $area = Area::first();
        $museumType = SiteType::where('slug', 'museums')->first() ?? SiteType::first();
        $period = HistoricalPeriod::first();
        $user = User::first();

        // 1. متحف العتبة الحسينية المقدسة
        $m1 = Site::firstOrCreate(
            ['permanent_id' => 'KHA-MUS-001'],
            [
                'name_ar' => 'متحف العتبة الحسينية المقدسة',
                'name_en' => 'Holy Shrine of Imam Hussain Museum',
                'slug' => 'imam-hussain-shrine-museum',
                'short_description' => 'متحف توثيقي تخصصي في كربلاء المقدسة',
                'description' => 'متحف متخصص في عرض المقتنيات والنفائس التاريخية والتراثية في كربلاء.',
                'historical_description' => 'تاريخ تأسيس وتوثيق المتحف والمقتنيات التاريخية',
                'architectural_description' => 'العمارة والتصميم الداخلي للقاعات والمعارض',
                'cultural_significance' => 'قيمة تراثية وثقافية عالية لأهالي وزوار كربلاء',
                'historical_significance' => 'توثيق شواهد التاريخ الإسلامي والتراث الكربلائي',
                'current_condition' => 'مفتوح للزيارة وصيانته مستمرة وفق المعايير المتحفية',
                'location_description' => 'كربلاء المقدسة',
                'province_id' => $province?->id,
                'area_id' => $area?->id,
                'site_type_id' => $museumType?->id,
                'historical_period_id' => $period?->id,
                'publication_status' => PublicationStatus::DRAFT,
                'verification_status' => VerificationStatus::UNVERIFIED,
                'location_precision' => LocationPrecision::APPROXIMATE,
                'is_demo' => false,
                'ai_assisted' => false,
                'created_by' => $user?->id,
            ]
        );
        SiteName::firstOrCreate([
            'site_id' => $m1->id,
            'name' => 'متحف الإمام الحسين',
            'name_type' => 'alternate',
            'language' => 'ar',
        ]);
        MuseumProfile::firstOrCreate(['site_id' => $m1->id], [
            'operator_name' => 'العتبة الحسينية المقدسة',
            'operator_type' => 'shrine_run_endowment',
            'official_website' => 'https://imamhussain.org',
            'address_text' => 'داخل الصحن الحسيني الشريف، مركز كربلاء القديمة',
        ]);

        // 2. متحف العتبة العباسية المقدسة
        $m2 = Site::firstOrCreate(
            ['permanent_id' => 'KHA-MUS-002'],
            [
                'name_ar' => 'متحف العتبة العباسية المقدسة',
                'name_en' => 'Al-Kafeel Museum of Treasures and Manuscripts',
                'slug' => 'al-kafeel-museum',
                'short_description' => 'متحف توثيقي تخصصي في كربلاء المقدسة',
                'description' => 'متحف متخصص في عرض المقتنيات والنفائس التاريخية والتراثية في كربلاء.',
                'historical_description' => 'تاريخ تأسيس وتوثيق المتحف والمقتنيات التاريخية',
                'architectural_description' => 'العمارة والتصميم الداخلي للقاعات والمعارض',
                'cultural_significance' => 'قيمة تراثية وثقافية عالية لأهالي وزوار كربلاء',
                'historical_significance' => 'توثيق شواهد التاريخ الإسلامي والتراث الكربلائي',
                'current_condition' => 'مفتوح للزيارة وصيانته مستمرة وفق المعايير المتحفية',
                'location_description' => 'كربلاء المقدسة',
                'province_id' => $province?->id,
                'area_id' => $area?->id,
                'site_type_id' => $museumType?->id,
                'historical_period_id' => $period?->id,
                'publication_status' => PublicationStatus::DRAFT,
                'verification_status' => VerificationStatus::UNVERIFIED,
                'location_precision' => LocationPrecision::APPROXIMATE,
                'is_demo' => false,
                'ai_assisted' => false,
                'created_by' => $user?->id,
            ]
        );
        SiteName::firstOrCreate([
            'site_id' => $m2->id,
            'name' => 'متحف الكفيل للنفائس والمخطوطات',
            'name_type' => 'official',
            'language' => 'ar',
        ]);
        MuseumProfile::firstOrCreate(['site_id' => $m2->id], [
            'operator_name' => 'العتبة العباسية المقدسة',
            'operator_type' => 'shrine_run_endowment',
            'official_website' => 'https://museum.alkafeel.net/',
            'address_text' => 'الصحن العباسي المطهر، كربلاء',
        ]);

        // 3. متحف ذاكرة الإسلام
        Site::firstOrCreate(
            ['permanent_id' => 'KHA-MUS-003'],
            [
                'name_ar' => 'متحف ذاكرة الإسلام',
                'name_en' => 'Memory of Islam Museum',
                'slug' => 'memory-of-islam-museum',
                'short_description' => 'متحف توثيقي تخصصي في كربلاء المقدسة',
                'description' => 'متحف متخصص في عرض المقتنيات والنفائس التاريخية والتراثية في كربلاء.',
                'historical_description' => 'تاريخ تأسيس وتوثيق المتحف والمقتنيات التاريخية',
                'architectural_description' => 'العمارة والتصميم الداخلي للقاعات والمعارض',
                'cultural_significance' => 'قيمة تراثية وثقافية عالية لأهالي وزوار كربلاء',
                'historical_significance' => 'توثيق شواهد التاريخ الإسلامي والتراث الكربلائي',
                'current_condition' => 'مفتوح للزيارة وصيانته مستمرة وفق المعايير المتحفية',
                'location_description' => 'كربلاء المقدسة',
                'province_id' => $province?->id,
                'area_id' => $area?->id,
                'site_type_id' => $museumType?->id,
                'historical_period_id' => $period?->id,
                'publication_status' => PublicationStatus::DRAFT,
                'verification_status' => VerificationStatus::UNVERIFIED,
                'location_precision' => LocationPrecision::APPROXIMATE,
                'is_demo' => false,
                'ai_assisted' => false,
                'created_by' => $user?->id,
            ]
        );

        // 4. متحف سعيد هويدي
        Site::firstOrCreate(
            ['permanent_id' => 'KHA-MUS-004'],
            [
                'name_ar' => 'متحف سعيد هويدي',
                'name_en' => 'Saeed Huwaidi Museum',
                'slug' => 'saeed-huwaidi-museum',
                'short_description' => 'متحف توثيقي تخصصي في كربلاء المقدسة',
                'description' => 'متحف متخصص في عرض المقتنيات والنفائس التاريخية والتراثية في كربلاء.',
                'historical_description' => 'تاريخ تأسيس وتوثيق المتحف والمقتنيات التاريخية',
                'architectural_description' => 'العمارة والتصميم الداخلي للقاعات والمعارض',
                'cultural_significance' => 'قيمة تراثية وثقافية عالية لأهالي وزوار كربلاء',
                'historical_significance' => 'توثيق شواهد التاريخ الإسلامي والتراث الكربلائي',
                'current_condition' => 'مفتوح للزيارة وصيانته مستمرة وفق المعايير المتحفية',
                'location_description' => 'كربلاء المقدسة',
                'province_id' => $province?->id,
                'area_id' => $area?->id,
                'site_type_id' => $museumType?->id,
                'historical_period_id' => $period?->id,
                'publication_status' => PublicationStatus::DRAFT,
                'verification_status' => VerificationStatus::UNVERIFIED,
                'location_precision' => LocationPrecision::APPROXIMATE,
                'is_demo' => false,
                'ai_assisted' => false,
                'created_by' => $user?->id,
            ]
        );

        // 5. متحف تراث كربلاء
        Site::firstOrCreate(
            ['permanent_id' => 'KHA-MUS-005'],
            [
                'name_ar' => 'متحف تراث كربلاء',
                'name_en' => 'Karbala Heritage Museum',
                'slug' => 'karbala-heritage-museum',
                'short_description' => 'متحف توثيقي تخصصي في كربلاء المقدسة',
                'description' => 'متحف متخصص في عرض المقتنيات والنفائس التاريخية والتراثية في كربلاء.',
                'historical_description' => 'تاريخ تأسيس وتوثيق المتحف والمقتنيات التاريخية',
                'architectural_description' => 'العمارة والتصميم الداخلي للقاعات والمعارض',
                'cultural_significance' => 'قيمة تراثية وثقافية عالية لأهالي وزوار كربلاء',
                'historical_significance' => 'توثيق شواهد التاريخ الإسلامي والتراث الكربلائي',
                'current_condition' => 'مفتوح للزيارة وصيانته مستمرة وفق المعايير المتحفية',
                'location_description' => 'كربلاء المقدسة',
                'province_id' => $province?->id,
                'area_id' => $area?->id,
                'site_type_id' => $museumType?->id,
                'historical_period_id' => $period?->id,
                'publication_status' => PublicationStatus::DRAFT,
                'verification_status' => VerificationStatus::UNVERIFIED,
                'location_precision' => LocationPrecision::APPROXIMATE,
                'is_demo' => false,
                'ai_assisted' => false,
                'created_by' => $user?->id,
            ]
        );

        // Research leads (internal, non-public)
        ResearchLead::firstOrCreate([
            'name' => 'متحف العتبة الحسينية - توثيق الروايات',
            'lead_url' => 'https://ar.wikipedia.org/wiki/قائمة_متاحف_العراق',
            'note' => 'قائمة ويكيبيديا لمتاحف العراق، مصدر ثانوي يتطلب تدقيقاً ميدانياً من إعلام العتبة.',
            'created_by' => 'owner_lead',
            'status' => 'under_investigation',
        ]);

        ResearchLead::firstOrCreate([
            'name' => 'متحف الكفيل للنفائس والمخطوطات',
            'lead_url' => 'https://museum.alkafeel.net/',
            'note' => 'موقع رسمي تابع للعتبة العباسية، سجل ذاتي النشر يتطلب توثيق ساعات الزيارة والقطع.',
            'created_by' => 'owner_lead',
            'status' => 'under_investigation',
        ]);

        ResearchLead::firstOrCreate([
            'name' => 'متحف ذاكرة الإسلام',
            'lead_url' => 'https://karbala.gov.iq/news/3426',
            'note' => 'خبر رسمي على بوابة محافظة كربلاء، بحاجة للتحقق من الجهة المشغلة وطبيعة المعروضات.',
            'created_by' => 'owner_lead',
            'status' => 'lead',
        ]);

        ResearchLead::firstOrCreate([
            'name' => 'متحف سعيد هويدي الشخصي / التراثي',
            'lead_url' => null,
            'note' => 'متحف خاص أو مجموعة فولكلورية لم يُعثر على توثيق رسمي لها بعد في السجلات الحكومية.',
            'created_by' => 'owner_lead',
            'status' => 'lead',
        ]);
    }
}
