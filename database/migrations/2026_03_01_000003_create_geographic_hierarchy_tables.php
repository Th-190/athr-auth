<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provinces', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('code', 10)->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('province_id')->constrained()->cascadeOnDelete();
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('slug');
            $table->unique(['province_id', 'slug']);
            $table->timestamps();
        });

        Schema::create('sub_districts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('district_id')->constrained()->cascadeOnDelete();
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('slug');
            $table->unique(['district_id', 'slug']);
            $table->timestamps();
        });

        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_district_id')->constrained()->cascadeOnDelete();
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->unique(['sub_district_id', 'slug']);
            $table->timestamps();
        });

        // Add PostGIS point column & GIST index for areas in PostgreSQL
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE areas ADD COLUMN coordinates geography(Point, 4326) NULL;');
            DB::statement('CREATE INDEX areas_coordinates_gist ON areas USING GIST (coordinates);');
            DB::statement('ALTER TABLE provinces ADD COLUMN coordinates geography(Point, 4326) NULL;');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('areas');
        Schema::dropIfExists('sub_districts');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('provinces');
    }
};
