<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('source_id')->constrained()->cascadeOnDelete();
            $table->string('page_reference')->nullable();
            $table->text('excerpt')->nullable();
            $table->text('editor_note')->nullable();
            $table->string('relevance')->default('direct'); // direct, supporting, contextual
            $table->timestamps();

            $table->unique(['site_id', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_sources');
    }
};
