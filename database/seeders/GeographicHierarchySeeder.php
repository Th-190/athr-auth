<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\District;
use App\Models\Province;
use App\Models\SubDistrict;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GeographicHierarchySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Province (Scoped for Karbala in v1, expandable later)
        $karbala = Province::firstOrCreate(
            ['code' => 'KHA'],
            [
                'name_ar' => 'محافظة كربلاء المقدسة',
                'name_en' => 'Karbala Governorate',
                'slug' => 'karbala',
                'description' => 'المحافظة الأساسية المشمولة بالتوثيق في الإصدار الأول.',
            ]
        );

        if ($karbala->wasRecentlyCreated && DB::getDriverName() === 'pgsql') {
            DB::update('UPDATE provinces SET coordinates = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ?', [44.0249, 32.6160, $karbala->id]);
        }

        // 2. Districts (Editable placeholders flagged for editor confirmation)
        $districts = [
            ['name_ar' => 'قضاء كربلاء (المركز)', 'name_en' => 'Karbala Central District', 'slug' => 'karbala-center'],
            ['name_ar' => 'قضاء عين التمر (شثاثا)', 'name_en' => 'Ayn al-Tamr District', 'slug' => 'ayn-al-tamr'],
            ['name_ar' => 'قضاء الهندية (طويريج)', 'name_en' => 'Al-Hindiyah District', 'slug' => 'al-hindiyah'],
            ['name_ar' => 'قضاء الحسينية', 'name_en' => 'Al-Hussainiyah District', 'slug' => 'al-hussainiyah'],
        ];

        foreach ($districts as $d) {
            $district = District::firstOrCreate(
                ['province_id' => $karbala->id, 'slug' => $d['slug']],
                ['name_ar' => $d['name_ar'], 'name_en' => $d['name_en']]
            );

            // Sub-districts
            $sub = SubDistrict::firstOrCreate(
                ['district_id' => $district->id, 'slug' => $d['slug'].'-sub'],
                ['name_ar' => 'مركز '.$d['name_ar'], 'name_en' => $d['name_en'].' Sub-district']
            );

            // Areas
            $area = Area::firstOrCreate(
                ['sub_district_id' => $sub->id, 'slug' => $d['slug'].'-main-area'],
                [
                    'name_ar' => 'منطقة '.$d['name_ar'].' (موضع أولي للتأكيد)',
                    'name_en' => $d['name_en'].' Area (Placeholder for Editor Confirmation)',
                    'description' => 'منطقة إدارية مكانية مؤقتة موضوعة للتأكيد والتدقيق الميداني.',
                ]
            );

            if ($area->wasRecentlyCreated && DB::getDriverName() === 'pgsql') {
                DB::update('UPDATE areas SET coordinates = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ?', [44.0249, 32.6160, $area->id]);
            }
        }
    }
}
