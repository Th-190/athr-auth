<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sites', function (Blueprint $table): void {
            $table->text('description_en')->nullable();
            $table->text('historical_description_en')->nullable();
            $table->text('architectural_description_en')->nullable();
            $table->text('current_condition_en')->nullable();
            $table->text('location_description_en')->nullable();
        });

        Schema::table('museum_artifacts', function (Blueprint $table): void {
            $table->text('description_en')->nullable();
        });

        Schema::create('museum_artifact_sources', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('museum_artifact_id')->constrained()->cascadeOnDelete();
            $table->foreignId('source_id')->constrained()->cascadeOnDelete();
            $table->string('page_reference')->nullable();
            $table->text('excerpt')->nullable();
            $table->text('editor_note')->nullable();
            $table->string('relevance')->nullable();
            $table->timestamps();
            $table->unique(['museum_artifact_id', 'source_id'], 'museum_artifact_sources_unique');
        });

        Schema::create('museum_artifact_revisions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('museum_artifact_id')->constrained()->cascadeOnDelete();
            $table->string('field_name');
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason');
            $table->string('verification_status_at_time');
            $table->timestamps();
            $table->index(['museum_artifact_id', 'created_at'], 'museum_artifact_revisions_history_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('museum_artifact_revisions');
        Schema::dropIfExists('museum_artifact_sources');

        Schema::table('museum_artifacts', function (Blueprint $table): void {
            $table->dropColumn('description_en');
        });

        Schema::table('sites', function (Blueprint $table): void {
            $table->dropColumn([
                'description_en',
                'historical_description_en',
                'architectural_description_en',
                'current_condition_en',
                'location_description_en',
            ]);
        });
    }
};
