<?php

namespace Database\Seeders;

use App\Models\SiteType;
use Illuminate\Database\Seeder;

class SiteTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'name_ar' => 'قصور وحصون دفاعية',
                'name_en' => 'Palaces & Fortresses',
                'slug' => 'palaces-and-forts',
                'definition' => 'المنشآت العسكرية والقصور الحصينة ذات الأسوار والأبراج الدفاعية المقامة في البادية ومفارق الطرق.',
                'icon' => 'Shield',
                'sort_order' => 1,
            ],
            [
                'name_ar' => 'خانات ومحطات القوافل',
                'name_en' => 'Caravansaries & Road Khans',
                'slug' => 'caravansaries',
                'definition' => 'المحطات المشيدة لإيواء المسافرين والقوافل التجارية وقوافل الحجيج على طول الطرق القديمة.',
                'icon' => 'Building2',
                'sort_order' => 2,
            ],
            [
                'name_ar' => 'معالم دينية ومزارات ومقامات',
                'name_en' => 'Religious & Sacred Sites',
                'slug' => 'religious-and-shrines',
                'definition' => 'العتبات والمساجد التاريخية والمقامات المشيدة التي تمثل شواهد على الحقب الروحية والفكرية.',
                'icon' => 'Moon',
                'sort_order' => 3,
            ],
            [
                'name_ar' => 'منشآت مائية وسدود وعيون',
                'name_en' => 'Hydraulic & Water Architecture',
                'slug' => 'hydraulic-and-springs',
                'definition' => 'العيون المائية الطبيعية المنظمة، قنوات الري القديمة، البرك، النواعير والخزانات الحجرية.',
                'icon' => 'Droplets',
                'sort_order' => 4,
            ],
            [
                'name_ar' => 'كنائس وأديرة قديمة',
                'name_en' => 'Ancient Churches & Monasteries',
                'slug' => 'churches-and-monasteries',
                'definition' => 'المعالم الرهبانية والكنائس الشرقية المشيدة في بادية الفرات قبل الإسلام والعصر الإسلامي المبكر.',
                'icon' => 'Cross',
                'sort_order' => 5,
            ],
            [
                'name_ar' => 'تلول ومستوطنات قديمة',
                'name_en' => 'Archaeological Tells & Settlements',
                'slug' => 'archaeological-tells',
                'definition' => 'التلال الأثرية الحاوية على طبقات سكنية تاريخية من العصور البابلية والبارثية والساسانية.',
                'icon' => 'Mountain',
                'sort_order' => 6,
            ],
            [
                'name_ar' => 'أسواق وخانات تجارية حضرية',
                'name_en' => 'Historic Bazaars & Markets',
                'slug' => 'bazaars-and-commercial',
                'definition' => 'الأسواق المسقوفة، القيصريات، وخانات التبادل التجاري داخل النسيج الحضري للمدينة.',
                'icon' => 'Store',
                'sort_order' => 7,
            ],
            [
                'name_ar' => 'دور ومساكن تراثية',
                'name_en' => 'Traditional Vernacular Houses',
                'slug' => 'vernacular-houses',
                'definition' => 'المنازل التقليدية ذات الفناء الأوسط والشناشيل الخشبية والبادكيرات (ملاقف الهواء).',
                'icon' => 'Home',
                'sort_order' => 8,
            ],
            [
                'name_ar' => 'أسوار وأبراج ومداخل',
                'name_en' => 'Defensive Walls & Gates',
                'slug' => 'defensive-walls-gates',
                'definition' => 'التحصينات المحيطة بالمدن والأبواب التاريخية التي نظمت الدخول والخروج في الفترات السابقة.',
                'icon' => 'DoorClosed',
                'sort_order' => 9,
            ],
            [
                'name_ar' => 'معالم صناعية وحرفية قديمة',
                'name_en' => 'Traditional Workshops & Kilns',
                'slug' => 'craft-workshops-kilns',
                'definition' => 'كوار الفخار، معاصر الزيوت، ومشاغل الحرف التقليدية التي قامت عليها اقتصاديات المنطقة.',
                'icon' => 'Hammer',
                'sort_order' => 10,
            ],
            [
                'name_ar' => 'مسارات وطرق تاريخية',
                'name_en' => 'Historic Routes & Trails',
                'slug' => 'historic-routes',
                'definition' => 'المسارات القديمة كطريق الحج الكوفي، مسار الفرات، وطرق التجارة الرابطة بين الشام والعراق.',
                'icon' => 'Compass',
                'sort_order' => 11,
            ],
            [
                'name_ar' => 'متاحف ومعارض تراثية',
                'name_en' => 'Museums & Heritage Galleries',
                'slug' => 'museums',
                'definition' => 'المؤسسات والمعارض التراثية والمتاحف التخصصية التي تحفظ المقتنيات والنفائس التاريخية والمخطوطات.',
                'icon' => 'Landmark',
                'sort_order' => 12,
            ],
        ];

        foreach ($types as $type) {
            SiteType::firstOrCreate(['slug' => $type['slug']], $type);
        }
    }
}
