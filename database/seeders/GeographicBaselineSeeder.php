<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeds the Karbala geographic reference hierarchy required by site records.
 *
 * The existing hierarchy seeder uses firstOrCreate, so rerunning this seeder
 * does not overwrite reference data that an editor has already maintained.
 */
class GeographicBaselineSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(GeographicHierarchySeeder::class);
    }
}
