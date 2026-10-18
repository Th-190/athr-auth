<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            GeographicHierarchySeeder::class,
            SiteTypeSeeder::class,
            HistoricalPeriodSeeder::class,
            DemoDataSeeder::class,
            MuseumSeeder::class,
            HeritageSitesSeeder::class,
            SiteModelSeeder::class,
        ]);
    }
}
