<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BootstrapReferenceDataCommand extends Command
{
    protected $signature = 'archive:bootstrap-reference-data {--force : Confirm additive reference-data initialization in production}';

    protected $description = 'Add missing Karbala geography, site types, and historical periods without overwriting existing records';

    public function handle(): int
    {
        if (app()->environment('production') && ! $this->option('force')) {
            $this->error('في الإنتاج، أعد تشغيل الأمر مع --force بعد التأكد من اتصال قاعدة البيانات المقصودة.');

            return self::FAILURE;
        }

        $countsBefore = [
            'provinces' => DB::table('provinces')->count(),
            'areas' => DB::table('areas')->count(),
            'site_types' => DB::table('site_types')->count(),
            'historical_periods' => DB::table('historical_periods')->count(),
        ];

        DB::transaction(function (): void {
            app(\Database\Seeders\GeographicHierarchySeeder::class)->run();
            app(\Database\Seeders\SiteTypeSeeder::class)->run();
            app(\Database\Seeders\HistoricalPeriodSeeder::class)->run();
        });

        $countsAfter = [
            'provinces' => DB::table('provinces')->count(),
            'areas' => DB::table('areas')->count(),
            'site_types' => DB::table('site_types')->count(),
            'historical_periods' => DB::table('historical_periods')->count(),
        ];

        $this->info('Reference data initialized additively. Existing rows were preserved.');
        $this->line('Counts before: '.json_encode($countsBefore));
        $this->line('Counts after: '.json_encode($countsAfter));

        return self::SUCCESS;
    }
}
