<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->text('approximate_date')->nullable()->after('location_description');
            $table->string('heritage_designation')->nullable()->after('approximate_date');
            $table->string('heritage_designation_url')->nullable()->after('heritage_designation');
            $table->unsignedSmallInteger('designation_year')->nullable()->after('heritage_designation_url');
        });

        Schema::create('museum_artifacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('museum_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('source_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title_ar');
            $table->string('title_en')->nullable();
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->string('material')->nullable();
            $table->string('estimated_date')->nullable();
            $table->string('origin')->nullable();
            $table->text('archaeological_context')->nullable();
            $table->string('publication_status')->default('pending_review');
            $table->string('verification_status')->default('unverified');
            $table->timestamps();

            $table->index(['museum_profile_id', 'publication_status', 'verification_status'], 'museum_artifacts_editorial_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('museum_artifacts');

        Schema::table('sites', function (Blueprint $table) {
            $table->dropColumn([
                'approximate_date',
                'heritage_designation',
                'heritage_designation_url',
                'designation_year',
            ]);
        });
    }
};
