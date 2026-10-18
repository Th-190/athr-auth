<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sites', function (Blueprint $table) {
            $table->id();
            $table->string('permanent_id', 20)->unique(); // e.g. KHA-000101
            $table->string('name_ar');
            $table->string('name_en')->nullable();
            $table->string('slug');
            $table->text('short_description');
            $table->text('description');
            $table->text('historical_description');
            $table->text('architectural_description');
            $table->text('cultural_significance');
            $table->text('historical_significance');
            $table->text('current_condition');
            $table->text('location_description');

            // Foreign keys & scoping
            $table->foreignId('province_id')->constrained()->cascadeOnDelete();
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->foreignId('site_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('historical_period_id')->constrained()->cascadeOnDelete();

            // Publication & Verification state machine
            $table->string('publication_status')->default('draft'); // PublicationStatus enum
            $table->string('verification_status')->default('unverified'); // VerificationStatus enum
            $table->text('verification_notes')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('last_reviewed_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();

            // Flags & Precision
            $table->boolean('is_demo')->default(false);
            $table->boolean('ai_assisted')->default(false);
            $table->string('location_precision')->default('approximate'); // LocationPrecision enum

            // Special flags
            $table->boolean('is_lost_or_vanished')->default(false);
            $table->boolean('is_under_research')->default(false);
            $table->boolean('featured')->default(false);
            $table->unsignedBigInteger('view_count')->default(0);

            // Normalized Arabic search column (maintained by Observer)
            $table->text('search_text')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Unique constraint: province-scoped slugs
            $table->unique(['province_id', 'slug']);

            // Query indexes
            $table->index(['publication_status', 'verification_status']);
            $table->index('site_type_id');
            $table->index('historical_period_id');
            $table->index('area_id');
            $table->index('is_demo');
        });

        // PostgreSQL PostGIS geography point & GIN index for search_text
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE sites ADD COLUMN coordinates geography(Point, 4326) NULL;');
            DB::statement('CREATE INDEX sites_coordinates_gist ON sites USING GIST (coordinates);');
            DB::statement('CREATE INDEX sites_search_text_trgm_gin ON sites USING GIN (search_text gin_trgm_ops);');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};
