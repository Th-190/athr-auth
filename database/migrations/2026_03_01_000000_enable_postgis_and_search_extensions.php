<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Enables PostGIS for spatial coordinates, pg_trgm for trigram Arabic search,
     * and unaccent for diacritic-insensitive text normalization.
     */
    public function up(): void
    {
        // Only run on PostgreSQL drivers
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS postgis;');
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
            DB::statement('CREATE EXTENSION IF NOT EXISTS unaccent;');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP EXTENSION IF EXISTS postgis;');
            DB::statement('DROP EXTENSION IF EXISTS pg_trgm;');
            DB::statement('DROP EXTENSION IF EXISTS unaccent;');
        }
    }
};
