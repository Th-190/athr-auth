<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('glb_path');
            $table->string('poster_path');
            $table->string('model_kind'); // scan, photogrammetry, reconstruction, illustrative
            $table->string('credit');
            $table->string('license');
            $table->string('rights_status');
            $table->foreignId('source_id')->nullable()->constrained('sources')->nullOnDelete();
            $table->boolean('ai_assisted')->default(false);
            $table->boolean('editor_approved')->default(false);
            $table->string('publication_status')->default('draft');
            $table->boolean('is_featured_on_home')->default(false);
            $table->integer('sort_order')->default(0);
            $table->string('camera_orbit')->nullable();
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_featured_on_home', 'publication_status']);
            $table->index('site_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_models');
    }
};
