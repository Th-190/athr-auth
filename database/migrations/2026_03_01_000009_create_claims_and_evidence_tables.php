<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('claim_type'); // date_of_construction, founder_identity, architectural_phase, function, event
            $table->text('claim_text');
            $table->boolean('is_disputed')->default(false);
            $table->text('editor_synthesis')->nullable();
            $table->timestamps();

            $table->index(['site_id', 'claim_type']);
        });

        Schema::create('claim_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->constrained('site_claims')->cascadeOnDelete();
            $table->string('scholar_or_school');
            $table->text('account_text');
            $table->text('historical_arguments')->nullable();
            $table->timestamps();
        });

        Schema::create('claim_evidence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->constrained('site_claims')->cascadeOnDelete();
            $table->foreignId('claim_variant_id')->nullable()->constrained('claim_variants')->nullOnDelete();
            $table->foreignId('source_id')->constrained()->cascadeOnDelete();
            $table->string('page_reference')->nullable();
            $table->text('excerpt')->nullable();
            $table->text('editor_note')->nullable();
            $table->string('relevance')->default('direct'); // EvidenceRelevance enum
            $table->timestamps();

            $table->index(['claim_id', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('claim_evidence');
        Schema::dropIfExists('claim_variants');
        Schema::dropIfExists('site_claims');
    }
};
