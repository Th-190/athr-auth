<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sources', function (Blueprint $table) {
            $table->id();
            $table->string('source_type'); // SourceType enum
            $table->string('title');
            $table->string('author');
            $table->string('publisher')->nullable();
            $table->string('year')->nullable();
            $table->string('url')->nullable();
            $table->string('isbn')->nullable();
            $table->string('archive_reference')->nullable();
            $table->string('page_reference')->nullable();
            $table->text('description')->nullable();
            $table->text('excerpt')->nullable();
            $table->string('language', 10)->default('ar');
            $table->string('reliability_level')->default('high'); // ReliabilityLevel enum
            $table->text('reliability_notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('source_type');
            $table->index('reliability_level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sources');
    }
};
