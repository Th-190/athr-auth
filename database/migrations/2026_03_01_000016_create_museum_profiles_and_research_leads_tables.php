<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('museum_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('operator_name')->nullable();
            $table->string('operator_type')->nullable(); // shrine_run_endowment, government, private, other
            $table->string('official_website')->nullable();
            $table->text('address_text')->nullable();
            $table->json('visiting_info')->nullable(); // {hours, admission, rules}
            $table->foreignId('visiting_info_source_id')->nullable()->constrained('sources')->nullOnDelete();
            $table->timestamp('visit_info_verified_at')->nullable();
            $table->text('accessibility_notes')->nullable();
            $table->string('founding_year')->nullable();
            $table->string('founding_year_precision')->nullable(); // exact, approximate, century, unknown
            $table->text('collection_summary')->nullable();
            $table->timestamps();
        });

        Schema::create('research_leads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('lead_url')->nullable();
            $table->text('note')->nullable();
            $table->string('created_by')->default('system');
            $table->string('status')->default('lead'); // lead, under_investigation, converted_to_site, rejected
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_leads');
        Schema::dropIfExists('museum_profiles');
    }
};
