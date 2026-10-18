<?php

namespace Database\Seeders;

use App\Enums\PublicationStatus;
use App\Enums\RightsStatus;
use App\Models\Site;
use App\Models\SiteModel;
use App\Models\Source;
use Illuminate\Database\Seeder;

class SiteModelSeeder extends Seeder
{
    public function run(): void
    {
        $site = Site::first();
        $source = Source::first();

        if ($site) {
            SiteModel::create([
                'site_id' => $site->id,
                'glb_path' => 'storage/app/models/home-hero.glb',
                'poster_path' => 'storage/app/models/home-hero-poster.webp',
                'model_kind' => 'reconstruction',
                'credit' => 'أرشيف أثر كربلاء للتراث الرقمي',
                'license' => 'CC BY-NC 4.0',
                'rights_status' => RightsStatus::CREATIVE_COMMONS->value,
                'source_id' => $source?->id,
                'ai_assisted' => false,
                'editor_approved' => true,
                'publication_status' => PublicationStatus::PUBLISHED->value,
                'is_featured_on_home' => true,
                'sort_order' => 1,
                'camera_orbit' => '0deg 75deg 105%',
                'is_demo' => true,
            ]);
        }
    }
}
