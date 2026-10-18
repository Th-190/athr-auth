<?php

namespace Database\Seeders;

use App\Models\HistoricalPeriod;
use Illuminate\Database\Seeder;

class HistoricalPeriodSeeder extends Seeder
{
    public function run(): void
    {
        $periods = [
            [
                'name_ar' => 'العصور القديمة والساسانية (موضع للتأكيد)',
                'name_en' => 'Ancient & Sasanian Period',
                'slug' => 'ancient-and-sasanian',
                'start_year_label' => 'القرن الثالث ق.م',
                'end_year_label' => '634 م',
                'start_year_numeric' => -300,
                'end_year_numeric' => 634,
                'description' => 'حقبة أثرية سابقة للفتح الإسلامي تشمل الآثار البابلية والبارثية والمناذرية في بادية كربلاء وعين التمر.',
                'sort_order' => 1,
                'needs_editor_confirmation' => true,
            ],
            [
                'name_ar' => 'العصر الإسلامي المبكر والأموي (موضع للتأكيد)',
                'name_en' => 'Early Islamic & Umayyad',
                'slug' => 'early-islamic-umayyad',
                'start_year_label' => '634 م (12 هـ)',
                'end_year_label' => '750 م (132 هـ)',
                'start_year_numeric' => 634,
                'end_year_numeric' => 750,
                'description' => 'فترة الفتوحات الأولى ومعركة عين التمر وواقعة الطف الخالدة (61 هـ) وتأسيس النواة الأولى للحائر الحسيني.',
                'sort_order' => 2,
                'needs_editor_confirmation' => true,
            ],
            [
                'name_ar' => 'العصر العباسي (موضع للتأكيد)',
                'name_en' => 'Abbasid Caliphate',
                'slug' => 'abbasid-era',
                'start_year_label' => '750 م (132 هـ)',
                'end_year_label' => '1258 م (656 هـ)',
                'start_year_numeric' => 750,
                'end_year_numeric' => 1258,
                'description' => 'فترة ازدهار العمارة الحصينة في البادية وتشييد حصن الأخيضر، وازدهار شبكات الري في الفرات الأوسط.',
                'sort_order' => 3,
                'needs_editor_confirmation' => true,
            ],
            [
                'name_ar' => 'العصر الإيلخاني والجلائري (موضع للتأكيد)',
                'name_en' => 'Ilkhanid & Jalayirid',
                'slug' => 'ilkhanid-jalayirid',
                'start_year_label' => '1258 م',
                'end_year_label' => '1534 م',
                'start_year_numeric' => 1258,
                'end_year_numeric' => 1534,
                'description' => 'فترة تجديد العمارة في كربلاء وتوسعة الروضتين والقباب الجصية المقرنصة.',
                'sort_order' => 4,
                'needs_editor_confirmation' => true,
            ],
            [
                'name_ar' => 'العصر العثماني (موضع للتأكيد)',
                'name_en' => 'Ottoman Period',
                'slug' => 'ottoman-era',
                'start_year_label' => '1534 م',
                'end_year_label' => '1917 م',
                'start_year_numeric' => 1534,
                'end_year_numeric' => 1917,
                'description' => 'عصر بناء منظومة الخانات الطرقية الكبرى (النخيلة، العطيشي، المصلى) وأسوار المدينة وأسواقها القديمة.',
                'sort_order' => 5,
                'needs_editor_confirmation' => true,
            ],
            [
                'name_ar' => 'التراث المتأخر والحديث (موضع للتأكيد)',
                'name_en' => 'Late & Modern Heritage',
                'slug' => 'modern-heritage',
                'start_year_label' => '1917 م',
                'end_year_label' => '1960 م',
                'start_year_numeric' => 1917,
                'end_year_numeric' => 1960,
                'description' => 'العمارة المدنية التراثية ذات الشناشيل والجسور والمباني الإدارية المبكرة في القرن العشرين.',
                'sort_order' => 6,
                'needs_editor_confirmation' => true,
            ],
        ];

        foreach ($periods as $period) {
            HistoricalPeriod::updateOrCreate(['slug' => $period['slug']], $period);
        }
    }
}
