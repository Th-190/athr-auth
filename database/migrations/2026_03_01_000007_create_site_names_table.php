<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_names', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('language', 10)->default('ar'); // ar, en, sdc, arc, ota
            $table->string('script', 20)->nullable(); // Arabic, Latin, Syriac
            $table->string('name_type')->default('alternate'); // primary, historical, local, official, colonial
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['site_id', 'language']);
        });

        Schema::create('site_tags', function (Blueprint $table) {
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->primary(['site_id', 'tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_tags');
        Schema::dropIfExists('site_names');
    }
};
