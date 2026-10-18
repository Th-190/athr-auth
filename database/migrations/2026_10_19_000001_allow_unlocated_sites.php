<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE sites ALTER COLUMN coordinates DROP NOT NULL');
        }
    }

    public function down(): void
    {
        // Coordinates can be absent for sites with unknown or restricted locations;
        // restoring NOT NULL would make valid existing rows unrepresentable.
    }
};
