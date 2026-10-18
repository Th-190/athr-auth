<?php

namespace Database\Seeders;

use App\Enums\LocationPrecision;
use App\Enums\PublicationStatus;
use App\Enums\ReliabilityLevel;
use App\Enums\SourceType;
use App\Enums\VerificationStatus;
use App\Models\Area;
use App\Models\District;
use App\Models\HistoricalPeriod;
use App\Models\Province;
use App\Models\Site;
use App\Models\SiteName;
use App\Models\SiteType;
use App\Models\Source;
use App\Models\SubDistrict;
use Illuminate\Database\Seeder;

class HeritageSitesSeeder extends Seeder
{
    /**
     * Public authority and UNESCO records only. Seeded entries remain unpublished
     * until an authorized editor reviews and approves them.
     */
    public function run(): void
    {
        $records = [
            [
                'id' => 'KHA-000101', 'slug' => 'qasr-al-ukhaidir',
                'name_ar' => 'حصن الأخيضر', 'name_en' => 'Al-Ukhaidir Fortress',
                'aliases' => ['قصر الأخيضر', 'Fortress of Al-Ukhaydir'],
                'governorate' => ['code' => 'KHA', 'ar' => 'محافظة كربلاء المقدسة', 'en' => 'Karbala Governorate', 'slug' => 'karbala'],
                'district' => ['ar' => 'قضاء عين التمر', 'en' => 'Ayn al-Tamr District', 'slug' => 'ayn-al-tamr'],
                'locality' => ['ar' => 'بادية الأخيضر', 'en' => 'Al-Ukhaidir desert area', 'slug' => 'ukhaidir-desert'],
                'type' => 'palaces-and-forts', 'period' => 'abbasid-era',
                'location' => 'على مسافة تقارب 50 كم جنوب غرب مدينة كربلاء، وفق سجل محافظة كربلاء؛ لا تُسجل إحداثيات نقطية هنا.',
                'date' => 'تصفه قائمة اليونسكو الإرشادية بأنه إنشاء إسلامي من النصف الثاني من القرن الثاني الهجري؛ يحتاج التأريخ التفصيلي إلى مراجعة المصادر الأثرية.',
                'short' => 'حصن إسلامي في بادية كربلاء، مدرج على القائمة الإرشادية لليونسكو منذ 2000.',
                'description' => 'تصف قائمة العراق الإرشادية لدى اليونسكو الأخيضر بأنه منشأة دفاعية ذات تصميم عسكري مميز على طريق تجاري، وتذكر مرافق تشمل قاعة رئيسية وإيواناً كبيراً وقاعة استقبال ومساكن للخدم. تذكر محافظة كربلاء موقعه على بعد نحو 50 كم جنوب غرب المدينة. لم يُحسم هنا الجدل حول تأريخه الدقيق.',
                'architecture' => 'تذكر قائمة اليونسكو تخطيطاً مستطيلاً بأبعاد 176 × 146 متراً ومجموعة من القاعات والإيوانات؛ ينبغي مراجعة هذه القياسات ميدانياً ومقارنتها بتوثيق دائرة الآثار.',
                'condition' => 'الحالة الراهنة غير موثقة في هذا السجل؛ يلزم الرجوع إلى دائرة الآثار والتراث أو تقرير صون حديث.',
                'designation' => 'قائمة اليونسكو الإرشادية (Tentative List)', 'designation_url' => 'https://whc.unesco.org/en/tentativelists/1467', 'designation_year' => 2000,
                'sources' => [
                    ['url' => 'https://whc.unesco.org/en/tentativelists/1467', 'title' => 'The Fortress of Al-Ukhaidar', 'author' => 'UNESCO World Heritage Centre', 'publisher' => 'UNESCO', 'type' => SourceType::OFFICIAL_SITE, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'قائمة إرشادية مقدمة من الدولة الطرف؛ لا تعني إدراج الموقع في قائمة التراث العالمي.'],
                    ['url' => 'https://www.form.karbala.gov.iq/monuments/331', 'title' => 'حصن الأخيضر', 'author' => 'محافظة كربلاء المقدسة', 'publisher' => 'الموقع الرسمي لمحافظة كربلاء', 'type' => SourceType::GOVERNMENT_RECORD, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مصدر حكومي للموقع والمسافة التقريبية من مركز كربلاء.'],
                ],
            ],
            [
                'id' => 'KHA-000102', 'slug' => 'khan-al-nukhayla',
                'name_ar' => 'خان النخيلة (خان الربع)', 'name_en' => 'Khan Al-Nukhaila (Khan Al-Rub\')',
                'aliases' => ['خان الربع'],
                'governorate' => ['code' => 'KHA', 'ar' => 'محافظة كربلاء المقدسة', 'en' => 'Karbala Governorate', 'slug' => 'karbala'],
                'district' => ['ar' => 'قضاء كربلاء', 'en' => 'Karbala District', 'slug' => 'karbala-center'],
                'locality' => ['ar' => 'طريق كربلاء–النجف', 'en' => 'Karbala–Najaf route', 'slug' => 'nukhayla-route'],
                'type' => 'caravansaries', 'period' => 'ottoman-era',
                'location' => 'على الطريق بين كربلاء والنجف؛ لا تُسجل إحداثيات نقطية في هذا السجل.',
                'date' => 'تنسبه محافظة كربلاء إلى الخانات التي بنيت في العهد العثماني؛ تاريخ البناء المحدد غير مثبت هنا.',
                'short' => 'خان طريق يُعرف محلياً بخان النخيلة أو خان الربع، على طريق كربلاء–النجف.',
                'description' => 'يفيد الموقع الرسمي لمحافظة كربلاء بأن الاسم المحلي «خان الربع» يرتبط بموضعه على طريق كربلاء والنجف، ويصفه ضمن خانات الطريق العثمانية. ويذكر تخطيطاً بفناء مكشوف تحيط به غرف وإيوانات وعقود مدببة، مع استعمال الآجر والجص. حالة بقاء المنشأة الحالية تحتاج إلى توثيق ميداني حديث.',
                'architecture' => 'بحسب وصف محافظة كربلاء: فناء مكشوف، غرف وإيوانات، مدخل شرقي تعلوه قبة، وعقود مدببة؛ مواد البناء المذكورة الآجر والجص.',
                'condition' => 'توجد إشارة في صفحة المحافظة إلى تعرض خان النخيلة للهدم؛ مدى البقايا الحالية يحتاج إلى معاينة وتوثيق ميداني.',
                'designation' => null, 'designation_url' => null, 'designation_year' => null,
                'sources' => [
                    ['url' => 'https://www.karbala.gov.iq/monuments/monuments/17', 'title' => 'خان النخيلة الأثري', 'author' => 'محافظة كربلاء المقدسة', 'publisher' => 'الموقع الرسمي لمحافظة كربلاء', 'type' => SourceType::GOVERNMENT_RECORD, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مصدر حكومي للاسم المحلي، الموقع العام، ووصف التخطيط والمواد.'],
                ],
            ],
            [
                'id' => 'KHA-000103', 'slug' => 'khan-al-atayshi',
                'name_ar' => 'خان العطيشي', 'name_en' => 'Khan Al-Atayshi', 'aliases' => [],
                'governorate' => ['code' => 'KHA', 'ar' => 'محافظة كربلاء المقدسة', 'en' => 'Karbala Governorate', 'slug' => 'karbala'],
                'district' => ['ar' => 'قضاء الحسينية', 'en' => 'Al-Hussainiyah District', 'slug' => 'al-hussainiyah'],
                'locality' => ['ar' => 'منطقة العطيشي', 'en' => 'Al-Atayshi area', 'slug' => 'al-atayshi'],
                'type' => 'caravansaries', 'period' => 'ottoman-era',
                'location' => 'منطقة العطيشي التابعة لناحية الحسينية في كربلاء، وفق محافظة كربلاء؛ الإحداثيات غير مثبتة هنا.',
                'date' => 'تذكر صفحة المحافظة تاريخ إنشاء 1774م؛ وتصف نتائج تنقيب 2008 طبقات من فترات مختلفة، مع نسب بعض اللقى إلى العصر العباسي. يجب مراجعة تقرير التنقيب الأصلي قبل اعتماد التفصيل.',
                'short' => 'خان قوافل في ناحية الحسينية؛ توثق محافظة كربلاء تاريخ إنشائه بـ1774م وتنقيباً أثرياً سنة 2008.',
                'description' => 'تسجل محافظة كربلاء الخان في منطقة العطيشي بناحية الحسينية، وتذكر تاريخ 1774م. كما تنقل الصفحة نتائج تنقيب سنة 2008 عن طبقتين ولقى خزفية وزجاجية ومسكوكة، وتنقل إسناد بعض المواد إلى الفترة العباسية. هذه تفاصيل منقولة عن صفحة المحافظة وليست مراجعة مستقلة لتقرير التنقيب؛ تبقى قيد التحقق التحريري.',
                'architecture' => 'لم يُضف وصف معماري تفصيلي في هذا السجل؛ ينبغي نقله من توثيق دائرة الآثار أو مسح ميداني منشور.',
                'condition' => 'تصف صفحة المحافظة حالة إهمال عند نشرها في 2020؛ يلزم التحقق من وضع الصون الحالي قبل عرضه كحالة راهنة.',
                'designation' => null, 'designation_url' => null, 'designation_year' => null,
                'sources' => [
                    ['url' => 'https://www.form.karbala.gov.iq/monuments/1141', 'title' => 'خان العطيشي', 'author' => 'محافظة كربلاء المقدسة', 'publisher' => 'الموقع الرسمي لمحافظة كربلاء', 'type' => SourceType::GOVERNMENT_RECORD, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مصدر حكومي؛ التفاصيل الأثرية المنقولة تحتاج مراجعة تقرير التنقيب الأصلي.'],
                ],
            ],
            [
                'id' => 'KHA-000104', 'slug' => 'al-mawqida-minaret',
                'name_ar' => 'منارة الموقدة (الموجدة)', 'name_en' => 'Al-Mawqida Minaret', 'aliases' => ['منارة موجدة'],
                'governorate' => ['code' => 'KHA', 'ar' => 'محافظة كربلاء المقدسة', 'en' => 'Karbala Governorate', 'slug' => 'karbala'],
                'district' => ['ar' => 'قضاء عين التمر', 'en' => 'Ayn al-Tamr District', 'slug' => 'ayn-al-tamr'],
                'locality' => ['ar' => 'طريق عين التمر', 'en' => 'Ayn al-Tamr road', 'slug' => 'ayn-al-tamr-road'],
                'type' => 'palaces-and-forts', 'period' => 'period-undetermined',
                'location' => 'تبعد نحو 40 كم جنوب غرب كربلاء، على طريق عين التمر، وفق محافظة كربلاء؛ لا تتوفر إحداثيات نقطة موثقة في المصدر المستخدم.',
                'date' => 'التأريخ غير محسوم في المصدر؛ ينقل الموقع الرسمي دليلاً عراقياً منشوراً سنة 1935–1936م يذكر وجود المنارة آنذاك.',
                'short' => 'منارة قائمة قرب الأخيضر على طريق عين التمر؛ تاريخ إنشائها ووظيفتها الأصلية غير محسومين.',
                'description' => 'تذكر محافظة كربلاء أن المنارة تبعد نحو 40 كم جنوب غرب المدينة وعلى طريق عين التمر، وتنقل من دليل عراقي لعام 1935–1936م ذكر «قصر موقدة» ومنارة قائمة فوقه. ويصف المصدر قاعدة مربعة وبدناً أسطوانياً من الآجر والجص. يورد المصدر تفسيراً محلياً محتملاً لوظيفتها كعلامة للقوافل أو ملاحية، ولا يعرضه هذا السجل كحقيقة مثبتة.',
                'architecture' => 'بحسب المصدر الحكومي: قاعدة مكعبة مزينة بحنايا وبدن أسطواني، من الآجر والجص. القياسات المنشورة تحتاج مراجعة مساحية.',
                'condition' => 'يذكر المصدر أن جزءاً من المنارة ما زال قائماً؛ لم يُتحقق من حالتها الراهنة ميدانياً.',
                'designation' => null, 'designation_url' => null, 'designation_year' => null,
                'sources' => [
                    ['url' => 'https://karbala.gov.iq/tourism/16', 'title' => 'المنارة الموقدة', 'author' => 'محافظة كربلاء المقدسة', 'publisher' => 'الموقع الرسمي لمحافظة كربلاء', 'type' => SourceType::GOVERNMENT_RECORD, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'الموقع والمسافة والوصف المعماري؛ تفسير وظيفة المنارة منقول بوصفه اعتقاداً لا حقيقة مؤكدة.'],
                ],
            ],
            [
                'id' => 'KHA-000105', 'slug' => 'al-qusayr-church',
                'name_ar' => 'كنيسة القصير (كنيسة الأقيصر)', 'name_en' => 'Al-Qusayr Church (Al-Aqiser)', 'aliases' => ['كنيسة الأقيصر'],
                'governorate' => ['code' => 'KHA', 'ar' => 'محافظة كربلاء المقدسة', 'en' => 'Karbala Governorate', 'slug' => 'karbala'],
                'district' => ['ar' => 'قضاء عين التمر', 'en' => 'Ayn al-Tamr District', 'slug' => 'ayn-al-tamr'],
                'locality' => ['ar' => 'بادية عين التمر', 'en' => 'Ayn al-Tamr desert area', 'slug' => 'al-qusayr-area'],
                'type' => 'churches-and-monasteries', 'period' => 'period-undetermined',
                'location' => 'في الصحراء الغربية، نحو 65 كم جنوب غرب كربلاء وقرابة 7 كم شمال شرق حصن الأخيضر، وفق محافظة كربلاء.',
                'date' => 'لا يقدم المصدر الحكومي المستخدم تأريخاً دقيقاً؛ تُترك الفترة الزمنية غير محددة حتى مراجعة مصادر أثرية متخصصة.',
                'short' => 'مجمّع كنائس في بادية كربلاء يُعرف أيضاً بكنيسة الأقيصر؛ التاريخ الدقيق غير مثبت في هذا السجل.',
                'description' => 'تصف محافظة كربلاء الموقع بأنه جزء من مجمع مبانٍ تسمى كنائس القصير، وتذكر اسماً آخر هو كنيسة الأقيصر. ويورد المصدر أبعاداً ومواد بناء وسوراً، كما يذكر تعرض أجزاء الموقع للتخريب والنهب والإهمال في فترات سابقة. لا تُعتمد هنا عبارة «من أقدم الكنائس» كحقيقة زمنية مستقلة لعدم إيراد تأريخ دقيق أو مرجع أثري متخصص معها.',
                'architecture' => 'بحسب المصدر الحكومي: بناء من الآجر والجص، وسور طيني وأبراج في أركانه؛ الأبعاد المنشورة تحتاج تحققاً مساحياً.',
                'condition' => 'تسجل صفحة المحافظة تخريباً ونهباً وعوامل تدهور في الماضي؛ الحالة الراهنة لم تتحقق ميدانياً.',
                'designation' => null, 'designation_url' => null, 'designation_year' => null,
                'sources' => [
                    ['url' => 'https://karbala.gov.iq/monuments/15', 'title' => 'كنيسة القصير', 'author' => 'محافظة كربلاء المقدسة', 'publisher' => 'الموقع الرسمي لمحافظة كربلاء', 'type' => SourceType::GOVERNMENT_RECORD, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مصدر حكومي للموقع والأسماء والعمارة؛ التأريخ الدقيق يحتاج مصدراً متخصصاً.'],
                ],
            ],
            [
                'id' => 'KHA-000106', 'slug' => 'shamun-palace',
                'name_ar' => 'قصر شمعون الأثري', 'name_en' => 'Sham\'un Archaeological Palace', 'aliases' => ['قلعة شمعون'],
                'governorate' => ['code' => 'KHA', 'ar' => 'محافظة كربلاء المقدسة', 'en' => 'Karbala Governorate', 'slug' => 'karbala'],
                'district' => ['ar' => 'قضاء عين التمر', 'en' => 'Ayn al-Tamr District', 'slug' => 'ayn-al-tamr'],
                'locality' => ['ar' => 'قرب شثاثا', 'en' => 'Near Shithatha', 'slug' => 'shithatha-area'],
                'type' => 'palaces-and-forts', 'period' => 'period-undetermined',
                'location' => 'نحو 90 كم غرب كربلاء و3 كم شمال شرق مركز شثاثا، وفق محافظة كربلاء.',
                'date' => 'التأريخ ونسبة الاسم مختلف عليهما في صفحة محافظة كربلاء؛ تُنسب التسمية إلى شخصيتين مختلفتين في روايات منقولة، ولا يحسم هذا السجل أيهما.',
                'short' => 'بقايا قصر في منطقة شثاثا؛ أصل الاسم والتأريخ محل روايات متعارضة في المصدر المحلي.',
                'description' => 'تذكر محافظة كربلاء جداراً حجرياً كلسياً وطينياً وسراديب، وتنقل روايتين مختلفتين لنسبة اسم شمعون: إلى شخصية مسيحية من بني لخم، أو إلى ملك يهودي في رواية محلية. لا تقدم هذه الروايات هنا كوقائع مثبتة، ويحتاج الموقع إلى مراجعة مصادر أثرية وتاريخية مستقلة.',
                'architecture' => 'بحسب المصدر الحكومي: بقايا جدران من الحجر الكلسي والطين وسراديب؛ وصف البقايا وحالتها يحتاج إلى مسح حديث.',
                'condition' => 'تشير صفحة المحافظة إلى تغير معالم بسبب عوامل التعرية؛ لا توجد معاينة راهنة في هذا السجل.',
                'designation' => null, 'designation_url' => null, 'designation_year' => null,
                'sources' => [
                    ['url' => 'https://www.karbala.gov.iq/monuments/14', 'title' => 'قصر شمعون الأثري', 'author' => 'محافظة كربلاء المقدسة', 'publisher' => 'الموقع الرسمي لمحافظة كربلاء', 'type' => SourceType::GOVERNMENT_RECORD, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مصدر للموقع والوصف وروايات تسمية متعارضة؛ لا تُسجل الروايات كتأريخ محسوم.'],
                ],
            ],
            [
                'id' => 'IQ-BAB-001', 'slug' => 'babylon',
                'name_ar' => 'مدينة بابل الأثرية', 'name_en' => 'Babylon', 'aliases' => ['بابل'],
                'governorate' => ['code' => 'IQ-BAB', 'ar' => 'محافظة بابل', 'en' => 'Babil Governorate', 'slug' => 'babil'],
                'district' => ['ar' => 'قضاء الحلة', 'en' => 'Al-Hillah District', 'slug' => 'hillah'],
                'locality' => ['ar' => 'موقع مدينة بابل القديمة', 'en' => 'Ancient Babylon site', 'slug' => 'ancient-babylon'],
                'type' => 'archaeological-tells', 'period' => 'ancient-and-sasanian',
                'location' => 'تقع على مسافة نحو 85 كم جنوب بغداد، وفق مركز التراث العالمي لليونسكو.',
                'date' => 'تتضمن بقايا من عصر حمورابي حتى الفترة الهلنستية؛ وكانت عاصمة الإمبراطورية البابلية الحديثة بين 626 و539 ق.م، بحسب اليونسكو.',
                'short' => 'مدينة أثرية وعاصمة للإمبراطورية البابلية الحديثة؛ أدرجتها اليونسكو على قائمة التراث العالمي سنة 2019.',
                'description' => 'تصف اليونسكو بابل بأنها من أكبر المستوطنات القديمة في بلاد الرافدين، وتضم بقايا الأسوار والبوابات والقصور والمعابد. وتؤكد أن الموقع يشهد على الحضارة البابلية الحديثة، مع بقاء أجزاء كبيرة غير منقبة. الارتباط الشائع بالحدائق المعلقة يرد في سياقات تاريخية وثقافية متعددة، ولا ينبغي عرضه بوصفه اكتشافاً أثرياً مثبتاً في هذا السجل.',
                'architecture' => 'تشمل البقايا الحضرية التي تذكرها اليونسكو الأسوار الداخلية والخارجية والبوابات والقصور والمعابد، ومنها الزقورة.',
                'condition' => 'تصف صفحة اليونسكو تحديات صون وتهديدات مادية، وتدعو إلى إجراءات حماية مستمرة؛ يلزم الرجوع إلى أحدث تقرير حالة قبل تقديم وصف آني.',
                'designation' => 'قائمة التراث العالمي لليونسكو', 'designation_url' => 'https://whc.unesco.org/en/list/278/', 'designation_year' => 2019,
                'coords' => [32.541969, 44.420833],
                'sources' => [
                    ['url' => 'https://whc.unesco.org/en/list/278/', 'title' => 'Babylon', 'author' => 'UNESCO World Heritage Centre', 'publisher' => 'UNESCO', 'type' => SourceType::OFFICIAL_SITE, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مصدر التسجيل وتاريخ الإدراج والوصف وحدود ما يثبته بشأن البقايا.'],
                ],
            ],
            [
                'id' => 'IQ-DHI-001', 'slug' => 'ur-archaeological-city',
                'name_ar' => 'مدينة أور الأثرية', 'name_en' => 'Ur Archaeological City', 'aliases' => ['أور السومرية'],
                'governorate' => ['code' => 'IQ-DHI', 'ar' => 'محافظة ذي قار', 'en' => 'Dhi Qar Governorate', 'slug' => 'dhi-qar'],
                'district' => ['ar' => 'قضاء الناصرية', 'en' => 'Nasiriyah District', 'slug' => 'nasiriyah'],
                'locality' => ['ar' => 'موقع أور الأثري', 'en' => 'Ur archaeological site', 'slug' => 'ur-site'],
                'type' => 'archaeological-tells', 'period' => 'ancient-and-sasanian',
                'location' => 'جنوب العراق؛ أور أحد المكونات الثقافية المسجلة ضمن موقع الأهوار، والحدود الرسمية للموقع منفصلة ومثبتة في السجل العراقي بحسب اليونسكو.',
                'date' => 'تضع اليونسكو نمو المدن والمستوطنات السومرية في الموقع الأوسع بين الألفين الرابع والثالث قبل الميلاد؛ التفاصيل الزمنية لأور تحديداً تستند إلى ملف ترشيحها.',
                'short' => 'مدينة سومرية أثرية ومكوّن ثقافي ضمن موقع الأهوار المدرج على قائمة التراث العالمي.',
                'description' => 'تذكر اليونسكو أن مدن أور وأوروك وتل العبيد/إريدو تمثل مستوطنات سومرية في جنوب بلاد الرافدين. أور جزء من الممتلك الثقافي ضمن موقع الأهوار، لكنها موقع أثري مستقل ذو حدود ومنطقة عازلة مسجلتين في العراق. لا يختزل هذا السجل تاريخ المدينة في الزقورة وحدها.',
                'architecture' => 'تشير اليونسكو إلى الزقورات والمعابد والقصور والأسوار والمنشآت المائية باعتبارها سمات للمدن السومرية المشمولة بالموقع الأوسع؛ التفاصيل الخاصة بأور تُراجع عبر ملف الترشيح.',
                'condition' => 'الحالة الراهنة غير مدرجة هنا؛ يرجى الرجوع إلى تقارير حفظ مكونات الأهوار وأور.',
                'designation' => 'مكوّن ضمن موقع التراث العالمي «الأهوار»', 'designation_url' => 'https://whc.unesco.org/en/list/1481/', 'designation_year' => 2016,
                'sources' => [
                    ['url' => 'https://whc.unesco.org/en/list/1481/', 'title' => 'The Ahwar of Southern Iraq: Refuge of Biodiversity and the Relict Landscape of the Mesopotamian Cities', 'author' => 'UNESCO World Heritage Centre', 'publisher' => 'UNESCO', 'type' => SourceType::OFFICIAL_SITE, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مصدر يحدد أور كمكوّن ثقافي ضمن الممتلك ويعرض سياق مدن جنوب بلاد الرافدين.'],
                ],
            ],
            [
                'id' => 'IQ-NIN-001', 'slug' => 'ancient-nineveh',
                'name_ar' => 'مدينة نينوى القديمة', 'name_en' => 'The Ancient City of Nineveh', 'aliases' => ['نينوى'],
                'governorate' => ['code' => 'IQ-NIN', 'ar' => 'محافظة نينوى', 'en' => 'Nineveh Governorate', 'slug' => 'nineveh'],
                'district' => ['ar' => 'قضاء الموصل', 'en' => 'Mosul District', 'slug' => 'mosul'],
                'locality' => ['ar' => 'الضفة الشرقية لنهر دجلة', 'en' => 'East bank of the Tigris', 'slug' => 'nineveh-east-bank'],
                'type' => 'archaeological-tells', 'period' => 'ancient-and-sasanian',
                'location' => 'على الضفة الشرقية لنهر دجلة في مدينة الموصل؛ وصف الموقع الإرشادي العراقي يضعها شمال بغداد.',
                'date' => 'تدرجها قائمة العراق الإرشادية لدى اليونسكو؛ يذكر ملفها الاستيطان على تل كويونجق منذ نحو 6000 ق.م إلى 600م، ودمار المدينة سنة 612 ق.م. هذه بيانات ملف ترشيح قديم وتحتاج مراجعة مصادر أحدث.',
                'short' => 'مدينة آشورية قديمة على الضفة الشرقية لدجلة؛ مدرجة على القائمة الإرشادية لليونسكو منذ 2000.',
                'description' => 'تصف قائمة العراق الإرشادية نينوى مركزاً آشورياً رئيسياً، وتذكر تل كويونجق وأسوار المدينة وبواباتها وقصر سنحاريب. وتورد تاريخاً طويلاً للاستيطان والدمار في 612 ق.م. تُعرض هذه البيانات بوصفها ملخص ملف القائمة الإرشادية، لا بديلاً عن توثيق أثري حديث.',
                'architecture' => 'تذكر القائمة الإرشادية بقايا قصر سنحاريب وبعض ألواح النحت وبوابات وأسوار المدينة؛ يلزم التحقق من حالتها الراهنة.',
                'condition' => 'يلزم الرجوع إلى تقارير عراقية ودولية حديثة لتوثيق الأضرار والحالة الراهنة؛ لا يقدم هذا السجل حكماً حالياً.',
                'designation' => 'قائمة اليونسكو الإرشادية (Tentative List)', 'designation_url' => 'https://whc.unesco.org/en/tentativelists/1465', 'designation_year' => 2000,
                'sources' => [
                    ['url' => 'https://whc.unesco.org/en/tentativelists/1465', 'title' => 'The Ancient City of Nineveh', 'author' => 'UNESCO World Heritage Centre', 'publisher' => 'UNESCO', 'type' => SourceType::OFFICIAL_SITE, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'قائمة إرشادية للدولة الطرف؛ لا تعني إدراج الموقع في قائمة التراث العالمي.'],
                ],
            ],
            [
                'id' => 'IQ-NIN-002', 'slug' => 'hatra',
                'name_ar' => 'الحضر', 'name_en' => 'Hatra', 'aliases' => ['الحضرة'],
                'governorate' => ['code' => 'IQ-NIN', 'ar' => 'محافظة نينوى', 'en' => 'Nineveh Governorate', 'slug' => 'nineveh'],
                'district' => ['ar' => 'قضاء الحضر', 'en' => 'Al-Hadar District', 'slug' => 'al-hadar'],
                'locality' => ['ar' => 'موقع مدينة الحضر الأثرية', 'en' => 'Hatra archaeological site', 'slug' => 'hatra-site'],
                'type' => 'archaeological-tells', 'period' => 'ancient-and-sasanian',
                'location' => 'في محافظة نينوى، جنوب غرب الموصل، وفق اليونسكو.',
                'date' => 'مدينة محصنة ازدهرت تحت نفوذ الإمبراطورية البارثية، ويرجع أبرز سياقها إلى نحو 200 ق.م–220م بحسب اليونسكو.',
                'short' => 'مدينة محصنة بارثية أدرجتها اليونسكو على قائمة التراث العالمي سنة 1985، وما تزال على قائمة الخطر.',
                'description' => 'تصف اليونسكو الحضر مدينة محصنة ومركزاً دينياً وتجارياً، وتبرز فيها معابد تجمع عناصر معمارية هلنستية ورومانية وشرقية. سجلت سنة 1985 على قائمة التراث العالمي وأدرجت على قائمة التراث العالمي المعرض للخطر سنة 2015. هذه الحالة تستند إلى سجل اليونسكو ويجب تحديثها عند مراجعة تقارير الصون الجديدة.',
                'architecture' => 'تصف اليونسكو مخططاً دائرياً تقريباً وأسواراً مزدوجة ومعابد ذات إيوانات وقاعات مقببة؛ يجب التفريق بين الوصف المنشور وحالة البقايا الحالية.',
                'condition' => 'مدرجة على قائمة التراث العالمي المعرض للخطر منذ 2015 وفق سجل اليونسكو؛ لا تُضاف تفاصيل أضرار ميدانية حديثة دون مصدر محدث.',
                'designation' => 'قائمة التراث العالمي لليونسكو؛ قائمة التراث العالمي المعرض للخطر', 'designation_url' => 'https://whc.unesco.org/en/list/277/', 'designation_year' => 1985,
                'coords' => [35.588061, 42.718331],
                'sources' => [
                    ['url' => 'https://whc.unesco.org/en/list/277/', 'title' => 'Hatra', 'author' => 'UNESCO World Heritage Centre', 'publisher' => 'UNESCO', 'type' => SourceType::OFFICIAL_SITE, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مصدر الإدراج والتصنيف والوصف؛ حالة الخطر تحتاج متابعة أحدث تقارير الصون.'],
                ],
            ],
            [
                'id' => 'IQ-SAL-001', 'slug' => 'ashur-qalat-sherqat',
                'name_ar' => 'آشور (قلعة الشرقاط)', 'name_en' => 'Ashur (Qal\'at Sherqat)', 'aliases' => ['آشور'],
                'governorate' => ['code' => 'IQ-SAL', 'ar' => 'محافظة صلاح الدين', 'en' => 'Salah ad-Din Governorate', 'slug' => 'salah-ad-din'],
                'district' => ['ar' => 'قضاء الشرقاط', 'en' => 'Al-Shirqat District', 'slug' => 'al-shirqat'],
                'locality' => ['ar' => 'موقع آشور على نهر دجلة', 'en' => 'Ashur site on the Tigris', 'slug' => 'ashur-site'],
                'type' => 'archaeological-tells', 'period' => 'ancient-and-sasanian',
                'location' => 'على نهر دجلة في شمال بلاد الرافدين، محافظة صلاح الدين، وفق اليونسكو.',
                'date' => 'تعود البدايات الأثرية إلى الألف الثالث ق.م؛ وكانت آشور عاصمة آشورية رئيسية بين القرنين 14 و9 ق.م، بحسب اليونسكو.',
                'short' => 'مدينة آشورية قديمة على دجلة، مدرجة على قائمة التراث العالمي وقائمة الخطر منذ 2003.',
                'description' => 'تعرض الأدلة الأثرية والنصية في آشور استمرارية وتغيراً في العمارة والتخطيط والحياة الدينية والسياسية في بلاد آشور. تذكر اليونسكو موقعها على دجلة وعلاقاتها بمراحل ما قبل آشورية وآشورية. أدرجت على قائمة التراث العالمي وقائمة الخطر سنة 2003.',
                'architecture' => 'تذكر اليونسكو شواهد معمارية دينية وعامة وسكنية وتخطيطاً حضرياً عبر فترات تاريخية متعددة؛ تفاصيل كل مبنى لا تدرج دون مرجع متخصص.',
                'condition' => 'تظل على قائمة التراث العالمي المعرض للخطر منذ 2003؛ سجل اليونسكو يذكر مخاطر الحماية ومشروع السد السابق، وتحتاج التفاصيل إلى مراجعة التقارير السنوية.',
                'designation' => 'قائمة التراث العالمي لليونسكو؛ قائمة التراث العالمي المعرض للخطر', 'designation_url' => 'https://whc.unesco.org/en/list/1130/', 'designation_year' => 2003,
                'coords' => [35.456667, 43.261111],
                'sources' => [
                    ['url' => 'https://whc.unesco.org/en/list/1130/', 'title' => 'Ashur (Qal\'at Sherqat)', 'author' => 'UNESCO World Heritage Centre', 'publisher' => 'UNESCO', 'type' => SourceType::OFFICIAL_SITE, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مصدر التسجيل والتأريخ والموقع ومعلومات الخطر والصون.'],
                ],
            ],
            [
                'id' => 'IQ-SAL-002', 'slug' => 'samarra-archaeological-city',
                'name_ar' => 'مدينة سامراء الأثرية', 'name_en' => 'Samarra Archaeological City', 'aliases' => ['سامراء العباسية'],
                'governorate' => ['code' => 'IQ-SAL', 'ar' => 'محافظة صلاح الدين', 'en' => 'Salah ad-Din Governorate', 'slug' => 'salah-ad-din'],
                'district' => ['ar' => 'قضاء سامراء', 'en' => 'Samarra District', 'slug' => 'samarra'],
                'locality' => ['ar' => 'ضفاف نهر دجلة في سامراء', 'en' => 'Tigris banks in Samarra', 'slug' => 'samarra-site'],
                'type' => 'archaeological-tells', 'period' => 'abbasid-era',
                'location' => 'على ضفتي نهر دجلة، نحو 130 كم شمال بغداد، وفق اليونسكو.',
                'date' => 'العاصمة العباسية القديمة يرجع تاريخها إلى 836–892م بحسب اليونسكو.',
                'short' => 'بقايا عاصمة عباسية من القرن التاسع، أدرجت سنة 2007 وما تزال على قائمة الخطر.',
                'description' => 'تصف اليونسكو سامراء بأنها عاصمة عباسية احتفظت بمخططها الحضري وآثارها، ومنها الجامع الكبير والمئذنة الملوية. وتبرز ابتكاراتها المعمارية والفنية. أدرجت سنة 2007 على قائمة التراث العالمي وعلى قائمة الخطر؛ المعلومات التشغيلية والصون الحالية تحتاج مراجعة أحدث تقارير اليونسكو.',
                'architecture' => 'تضم المدينة الجامع الكبير والمئذنة الملوية وجامع أبي دلف وقصوراً وعمائر عباسية؛ العناصر موصوفة في ملف اليونسكو.',
                'condition' => 'مدرجة على قائمة التراث العالمي المعرض للخطر منذ 2007 وفق اليونسكو؛ راجع أحدث تقرير حالة لتقييم الوضع الراهن.',
                'designation' => 'قائمة التراث العالمي لليونسكو؛ قائمة التراث العالمي المعرض للخطر', 'designation_url' => 'https://whc.unesco.org/en/list/276/', 'designation_year' => 2007,
                'sources' => [
                    ['url' => 'https://whc.unesco.org/en/list/276/', 'title' => 'Samarra Archaeological City', 'author' => 'UNESCO World Heritage Centre', 'publisher' => 'UNESCO', 'type' => SourceType::OFFICIAL_SITE, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مصدر التسجيل والتأريخ والوصف المعماري وحالة الإدراج على قائمة الخطر.'],
                ],
            ],
            [
                'id' => 'IQ-ERB-001', 'slug' => 'erbil-citadel',
                'name_ar' => 'قلعة أربيل', 'name_en' => 'Erbil Citadel', 'aliases' => ['قلعة هولير'],
                'governorate' => ['code' => 'IQ-ERB', 'ar' => 'محافظة أربيل', 'en' => 'Erbil Governorate', 'slug' => 'erbil'],
                'district' => ['ar' => 'قضاء أربيل', 'en' => 'Erbil District', 'slug' => 'erbil-city'],
                'locality' => ['ar' => 'مركز مدينة أربيل', 'en' => 'Erbil city centre', 'slug' => 'erbil-citadel-area'],
                'type' => 'palaces-and-forts', 'period' => 'period-undetermined',
                'location' => 'في مركز مدينة أربيل بإقليم كردستان العراق، بحسب اليونسكو.',
                'date' => 'تسجل المصادر المكتوبة استيطاناً قديماً في الموضع؛ الواجهات المحيطة الظاهرة تعود إلى القرن التاسع عشر، وفق اليونسكو.',
                'short' => 'مستوطنة محصنة على تل أثري في مركز أربيل؛ مدرجة على قائمة التراث العالمي سنة 2014.',
                'description' => 'تصف اليونسكو قلعة أربيل بأنها مستوطنة محصنة قائمة على تل بيضوي الشكل تكون من تراكم سكن أجيال متعاقبة. ويربط السجل اسم الموقع بأربيل/أربلا القديمة ويذكر أن واجهات القرن التاسع عشر تشكل مظهره البصري. أدرج الموقع على قائمة التراث العالمي سنة 2014.',
                'architecture' => 'تذكر اليونسكو تلّاً بيضوياً وواجهات سكنية عالية من القرن التاسع عشر ونمطاً مروحياً متأخراً عثمانياً.',
                'condition' => 'تذكر اليونسكو خططاً للحفظ والإحياء؛ ينبغي مراجعة التقارير الأحدث قبل وصف وضع التنفيذ الحالي.',
                'designation' => 'قائمة التراث العالمي لليونسكو', 'designation_url' => 'https://whc.unesco.org/en/list/1437/', 'designation_year' => 2014,
                'coords' => [36.191111, 44.009167],
                'sources' => [
                    ['url' => 'https://whc.unesco.org/en/list/1437/', 'title' => 'Erbil Citadel', 'author' => 'UNESCO World Heritage Centre', 'publisher' => 'UNESCO', 'type' => SourceType::OFFICIAL_SITE, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مصدر الإدراج والوصف التاريخي والمعماري؛ الإحداثيات من صفحة الخرائط الرسمية.'],
                    ['url' => 'https://whc.unesco.org/en/list/1437/maps/', 'title' => 'Erbil Citadel - Maps', 'author' => 'UNESCO World Heritage Centre', 'publisher' => 'UNESCO', 'type' => SourceType::MAP, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'مرجع الإحداثيات المنشورة لموقع الممتلك.'],
                ],
            ],
            [
                'id' => 'IQ-BAG-001', 'slug' => 'aqar-quf-dur-kurigalzu',
                'name_ar' => 'عقرقوف (دور كوريغالزو)', 'name_en' => 'Aqar Quf (Dur-Kurigalzu)', 'aliases' => ['عقرقوف'],
                'governorate' => ['code' => 'IQ-BAG', 'ar' => 'محافظة بغداد', 'en' => 'Baghdad Governorate', 'slug' => 'baghdad'],
                'district' => ['ar' => 'قضاء أبو غريب', 'en' => 'Abu Ghraib District', 'slug' => 'abu-ghraib'],
                'locality' => ['ar' => 'موقع عقرقوف الأثري', 'en' => 'Aqar Quf archaeological site', 'slug' => 'aqar-quf-site'],
                'type' => 'archaeological-tells', 'period' => 'ancient-and-sasanian',
                'location' => 'ناحية أبو غريب في محافظة بغداد، وفق ملف القائمة الإرشادية لليونسكو؛ الإحداثيات المنشورة نطاق لممتلك الموقع وليست نقطة مفردة.',
                'date' => 'يُعرف الموقع بمدينة دور كوريغالزو الكاشية؛ راجع ملف القائمة الإرشادية لتفاصيل التسلسل التاريخي والتنقيبات.',
                'short' => 'موقع أثري يضم بقايا دور كوريغالزو وزقورتها؛ أدرجته العراق على القائمة الإرشادية لليونسكو سنة 2025.',
                'description' => 'تصف اليونسكو عقرقوف بأنه سجل أثري لحضارة كاشية، وتشير إلى الزقورة والقصر الملكي في تل أبيض. كما يذكر ملفها أعمال تنقيب عراقية منهجية بدأت في أربعينيات القرن العشرين. لم تُسجل نقطة مركزية على الخريطة لأن صفحة المصدر تنشر نطاقاً جغرافياً للممتلك.',
                'architecture' => 'يتضمن الموقع زقورة وقصراً ملكياً؛ تفاصيل الطوب واللوحات الجدارية وتاريخها تراجع في ملف القائمة الإرشادية.',
                'condition' => 'لا يقدم هذا السجل تقييماً ميدانياً للحالة الراهنة؛ يلزم تقرير حديث من دائرة الآثار والتراث.',
                'designation' => 'قائمة اليونسكو الإرشادية (Tentative List)', 'designation_url' => 'https://whc.unesco.org/en/tentativelists/6797/', 'designation_year' => 2025,
                'sources' => [
                    ['url' => 'https://whc.unesco.org/en/tentativelists/6797/', 'title' => 'Archaeological site of Aqar Quf (ancient Dur-Kurigalzu)', 'author' => 'Permanent Delegation of Iraq to UNESCO', 'publisher' => 'UNESCO World Heritage Centre', 'type' => SourceType::OFFICIAL_SITE, 'reliability' => ReliabilityLevel::HIGH, 'note' => 'قائمة إرشادية مقدمة من الدولة الطرف؛ وصفها لا يعني إدراج الموقع على قائمة التراث العالمي.'],
                ],
            ],
        ];

        foreach ($records as $record) {
            $province = $this->province($record['governorate']);
            $area = $this->area($province, $record['district'], $record['locality']);
            $type = SiteType::where('slug', $record['type'])->firstOrFail();
            $period = HistoricalPeriod::where('slug', $record['period'])->firstOrFail();

            $site = Site::firstOrCreate(
                ['permanent_id' => $record['id']],
                [
                    'name_ar' => $record['name_ar'],
                    'name_en' => $record['name_en'],
                    'slug' => $record['slug'],
                    'short_description' => $record['short'],
                    'description' => $record['description'],
                    'historical_description' => $record['date'],
                    'approximate_date' => $record['date'],
                    'architectural_description' => $record['architecture'],
                    'cultural_significance' => 'يحتاج تقييم الأهمية الثقافية إلى مراجعة تحريرية مستندة إلى الدراسات المتخصصة؛ هذا السجل لا يضيف استنتاجاً غير منسوب.',
                    'historical_significance' => $record['short'],
                    'current_condition' => $record['condition'],
                    'location_description' => $record['location'],
                    'province_id' => $province->id,
                    'area_id' => $area->id,
                    'site_type_id' => $type->id,
                    'historical_period_id' => $period->id,
                    'publication_status' => PublicationStatus::PENDING_REVIEW,
                    'verification_status' => VerificationStatus::UNVERIFIED,
                    'verification_notes' => 'أُدخل السجل بمراجع رسمية أولية؛ يلزم محرر مخول مراجعة البيانات وإقرارها قبل النشر.',
                    'location_precision' => isset($record['coords']) ? LocationPrecision::EXACT : LocationPrecision::UNKNOWN,
                    'heritage_designation' => $record['designation'],
                    'heritage_designation_url' => $record['designation_url'],
                    'designation_year' => $record['designation_year'],
                    'is_demo' => false,
                    'ai_assisted' => false,
                ]
            );

            if ($site->wasRecentlyCreated && isset($record['coords'])) {
                $site->setCoordinates($record['coords'][0], $record['coords'][1])->save();
            }

            foreach ($record['aliases'] as $alias) {
                SiteName::firstOrCreate(
                    ['site_id' => $site->id, 'name' => $alias, 'name_type' => 'alternate', 'language' => str_contains($alias, 'Fortress') || str_contains($alias, 'Khan') || str_contains($alias, 'Citadel') ? 'en' : 'ar'],
                    []
                );
            }

            foreach ($record['sources'] as $sourceData) {
                $source = Source::firstOrCreate(
                    ['url' => $sourceData['url']],
                    [
                        'source_type' => $sourceData['type'],
                        'title' => $sourceData['title'],
                        'author' => $sourceData['author'],
                        'publisher' => $sourceData['publisher'],
                        'description' => $sourceData['note'],
                        'language' => 'ar',
                        'reliability_level' => $sourceData['reliability'],
                    ]
                );

                $site->sources()->syncWithoutDetaching([$source->id => [
                    'relevance' => 'direct',
                    'editor_note' => $sourceData['note'],
                ]]);
            }
        }
    }

    /** @param array{code: string, ar: string, en: string, slug: string} $data */
    private function province(array $data): Province
    {
        return Province::firstOrCreate(
            ['code' => $data['code']],
            ['name_ar' => $data['ar'], 'name_en' => $data['en'], 'slug' => $data['slug']]
        );
    }

    /**
     * @param array{ar: string, en: string, slug: string} $districtData
     * @param array{ar: string, en: string, slug: string} $locality
     */
    private function area(Province $province, array $districtData, array $locality): Area
    {
        $district = District::firstOrCreate(
            ['province_id' => $province->id, 'slug' => $districtData['slug']],
            ['name_ar' => $districtData['ar'], 'name_en' => $districtData['en']]
        );
        $subDistrict = SubDistrict::firstOrCreate(
            ['district_id' => $district->id, 'slug' => 'heritage-sites'],
            ['name_ar' => 'مواضع المواقع التراثية', 'name_en' => 'Heritage site locations']
        );

        return Area::firstOrCreate(
            ['sub_district_id' => $subDistrict->id, 'slug' => $locality['slug']],
            [
                'name_ar' => $locality['ar'],
                'name_en' => $locality['en'],
                'description' => 'سجل موضع إداري للموقع؛ راجع وصف الموقع والمراجع المرتبطة للتحقق من حدود الموقع الدقيقة.',
            ]
        );
    }
}
