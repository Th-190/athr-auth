<?php

namespace Database\Seeders;

use App\Enums\LocationPrecision;
use App\Enums\PublicationStatus;
use App\Enums\ReliabilityLevel;
use App\Enums\SourceType;
use App\Enums\VerificationStatus;
use App\Models\Area;
use App\Models\HistoricalPeriod;
use App\Models\MuseumArtifact;
use App\Models\MuseumProfile;
use App\Models\Province;
use App\Models\Site;
use App\Models\SiteName;
use App\Models\SiteType;
use App\Models\Source;
use Illuminate\Database\Seeder;

class MuseumSeeder extends Seeder
{
    public function run(): void
    {
        $province = Province::where('code', 'KHA')->firstOrFail();
        $area = Area::whereHas('subDistrict.district', fn ($query) => $query
            ->where('province_id', $province->id)
            ->where('slug', 'karbala-center'))
            ->firstOrFail();
        $museumType = SiteType::where('slug', 'museums')->firstOrFail();
        $period = HistoricalPeriod::where('slug', 'institutional-present')->firstOrFail();

        $source = Source::firstOrCreate(
            ['url' => 'https://museum.imamhussain.org/'],
            [
                'source_type' => SourceType::OFFICIAL_SITE,
                'title' => 'الموقع الرسمي لمتحف العتبة الحسينية المقدسة',
                'author' => 'متحف العتبة الحسينية المقدسة',
                'publisher' => 'العتبة الحسينية المقدسة',
                'description' => 'موقع المؤسسة الرسمي؛ يستعمل لإسناد وصف المؤسسة والمعلومات التي تنشرها عن مجموعاتها. تفاصيل الزيارة قابلة للتغيير وتحتاج تحققاً قبل العرض.',
                'language' => 'ar',
                'reliability_level' => ReliabilityLevel::PRIMARY,
            ]
        );

        $site = Site::firstOrCreate(
            ['permanent_id' => 'KHA-MUS-001'],
            [
                'name_ar' => 'متحف العتبة الحسينية المقدسة',
                'name_en' => 'Imam Hussein Holy Shrine Museum',
                'slug' => 'imam-hussein-shrine-museum',
                'short_description' => 'متحف تابع للعتبة الحسينية المقدسة؛ تفاصيل المجموعات والزيارة تُعرض وفق ما تنشره المؤسسة وبعد المراجعة التحريرية.',
                'description' => 'تذكر الصفحة الرسمية أن المتحف تأسس سنة 2009، وتعرض مقتنيات مصنفة تشمل الأسلحة والمخطوطات وغيرها. هذا السجل قيد المراجعة، ولا يعني وصف المؤسسة أن كل بيانات القطع قد تحققت مستقلاً.',
                'historical_description' => 'تذكر الصفحة الرسمية للمتحف تأسيسه سنة 2009. يلزم توثيق مستقل لتفاصيل مراحل التأسيس.',
                'architectural_description' => 'لم تُضف تفاصيل معمارية لعدم توفر توثيق كافٍ في المصدر المستخدم.',
                'cultural_significance' => 'مؤسسة متحفية تديرها العتبة الحسينية المقدسة وتوثق مقتنيات تعرضها على موقعها الرسمي.',
                'historical_significance' => 'لا تُسند هذه الخانة قيمة أثرية للمؤسسة؛ تُراجع طبيعة مجموعاتها ومقتنياتها ضمن المصدر الرسمي.',
                'current_condition' => 'معلومات الحالة التشغيلية وساعات الزيارة غير معتمدة في هذا السجل؛ يرجى الرجوع إلى الموقع الرسمي.',
                'location_description' => 'كربلاء المقدسة، العراق. الإحداثيات والعنوان التفصيلي غير مثبتين في هذا السجل.',
                'approximate_date' => 'تذكر المؤسسة سنة التأسيس 2009؛ يحتاج التاريخ إلى مراجعة تحريرية قبل النشر.',
                'province_id' => $province->id,
                'area_id' => $area->id,
                'site_type_id' => $museumType->id,
                'historical_period_id' => $period->id,
                'publication_status' => PublicationStatus::PENDING_REVIEW,
                'verification_status' => VerificationStatus::UNVERIFIED,
                'verification_notes' => 'مصدر المؤسسة الأولي مسجل. يلزم محرر مخول مراجعة أوصاف المؤسسة والمجموعات قبل النشر.',
                'location_precision' => LocationPrecision::UNKNOWN,
                'is_demo' => false,
                'ai_assisted' => false,
            ]
        );

        $site->sources()->syncWithoutDetaching([$source->id => [
            'relevance' => 'direct',
            'editor_note' => 'مصدر المؤسسة الرسمي؛ لا يثبت وحده بيانات تشغيلية متغيرة خارج ما ينشره الموقع وقت المراجعة.',
        ]]);

        SiteName::firstOrCreate([
            'site_id' => $site->id,
            'name' => 'متحف الإمام الحسين (عليه السلام)',
            'name_type' => 'alternate',
            'language' => 'ar',
        ]);

        $profile = MuseumProfile::firstOrCreate(
            ['site_id' => $site->id],
            [
                'operator_name' => 'العتبة الحسينية المقدسة',
                'operator_type' => 'shrine_run_endowment',
                'official_website' => 'https://museum.imamhussain.org/',
                'address_text' => 'كربلاء المقدسة، العراق؛ العنوان التفصيلي غير موثق في هذا السجل.',
                'visiting_info' => null,
                'visiting_info_source_id' => null,
                'visit_info_verified_at' => null,
                'accessibility_notes' => null,
                'founding_year' => '2009',
                'founding_year_precision' => 'exact',
                'collection_summary' => 'يعرض الموقع الرسمي فئات منها السيوف والدروع والخناجر والبنادق والمخطوطات. أوصاف القطع منسوبة إلى المؤسسة وتحتاج مراجعة تحريرية قبل النشر.',
            ]
        );

        $artifacts = [
            [
                'title_ar' => 'درع جلائري مصنوع من الجلد المضغوط',
                'title_en' => null,
                'category' => 'دروع',
                'description' => 'عنوان مقتنى منشور في قائمة الموقع الرسمي؛ لم تُضف بيانات تاريخ أو منشأ غير متاحة في صفحة المصدر.',
                'material' => 'جلد مضغوط، بحسب عنوان المقتنى المنشور',
            ],
            [
                'title_ar' => 'خنجر يماني من الفضة',
                'title_en' => null,
                'category' => 'خناجر',
                'description' => 'يذكر الموقع الرسمي أن صناعة الخنجر تعود إلى بداية القرن العشرين؛ لا يتضمن هذا السجل سياقاً أثرياً غير منشور.',
                'material' => 'فضة، بحسب وصف الموقع الرسمي',
                'estimated_date' => 'بداية القرن العشرين، بحسب وصف المؤسسة',
                'origin' => 'منسوب إلى اليمن في عنوان ووصف المقتنى لدى المؤسسة',
            ],
            [
                'title_ar' => 'مسدس فرنسي من طراز Mle 1892',
                'title_en' => 'French Mle 1892 pistol',
                'category' => 'مسدسات',
                'description' => 'يصفه الموقع الرسمي بأنه صنع في ورش مدينة سانت إتيان بفرنسا؛ لا تُضاف هنا قصة اقتناء أو سياق آخر.',
                'material' => null,
                'estimated_date' => 'الطراز Mle 1892، كما يسميه الموقع الرسمي؛ تاريخ هذه القطعة غير محدد هنا.',
                'origin' => 'ورش سانت إتيان، فرنسا، بحسب وصف المؤسسة',
            ],
        ];

        foreach ($artifacts as $artifact) {
            MuseumArtifact::firstOrCreate(
                ['museum_profile_id' => $profile->id, 'title_ar' => $artifact['title_ar']],
                $artifact + [
                    'source_id' => $source->id,
                    'publication_status' => PublicationStatus::PENDING_REVIEW->value,
                    'verification_status' => VerificationStatus::UNVERIFIED->value,
                ]
            );
        }
    }
}
