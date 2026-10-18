<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('encyclopedia_entries', function (Blueprint $table) {
            $table->id();
            $table->string('term_ar');
            $table->string('term_en')->nullable();
            $table->string('slug')->unique();
            $table->string('category'); // architecture, person, dynasty, event, geography, material
            $table->text('short_summary');
            $table->longText('full_text');
            $table->timestamps();
        });

        Schema::create('encyclopedia_sites', function (Blueprint $table) {
            $table->foreignId('encyclopedia_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->primary(['encyclopedia_entry_id', 'site_id']);
        });

        Schema::create('encyclopedia_sources', function (Blueprint $table) {
            $table->foreignId('encyclopedia_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('source_id')->constrained()->cascadeOnDelete();
            $table->primary(['encyclopedia_entry_id', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('encyclopedia_sources');
        Schema::dropIfExists('encyclopedia_sites');
        Schema::dropIfExists('encyclopedia_entries');
    }
};
