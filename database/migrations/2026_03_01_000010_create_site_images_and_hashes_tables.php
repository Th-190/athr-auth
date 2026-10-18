<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('ulid', 36)->unique();
            $table->string('title');
            $table->string('caption')->nullable();
            $table->text('description')->nullable();
            $table->string('alt_text')->nullable();
            $table->string('date_taken')->nullable();
            $table->string('date_precision')->default('unknown'); // exact, approximate, unknown
            $table->string('photographer')->nullable();
            $table->string('credit_line')->nullable();
            $table->string('copyright')->nullable();
            $table->string('license')->nullable();
            $table->text('usage_restrictions')->nullable();
            $table->string('rights_status')->default('unknown'); // RightsStatus enum
            $table->string('image_role')->default('current_view'); // ImageRole enum
            $table->integer('sort_order')->default(0);
            $table->boolean('featured')->default(false);
            $table->boolean('visibility')->default(true);
            $table->boolean('ai_assisted')->default(false);

            // Storage paths
            $table->string('original_storage_path'); // Private disk
            $table->string('web_storage_path')->nullable(); // Derivatives CDN
            $table->string('thumb_storage_path')->nullable();
            $table->string('download_storage_path')->nullable(); // Watermarked private

            // Image dimensions & mime
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size_bytes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['site_id', 'sort_order']);
            $table->index('rights_status');
        });

        // Viewpoint geography point for images
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE site_images ADD COLUMN viewpoint_coordinates geography(Point, 4326) NULL;');
        }

        Schema::create('media_hashes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_image_id')->constrained()->cascadeOnDelete();
            $table->string('file_version'); // original, web, thumbnail, download
            $table->string('hash_algorithm', 20)->default('sha256');
            $table->string('hash_value', 64);
            $table->unsignedBigInteger('file_size_bytes');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['site_image_id', 'file_version']);
            $table->index('hash_value');
        });

        Schema::create('image_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_image_id')->constrained()->cascadeOnDelete();
            $table->foreignId('source_id')->constrained()->cascadeOnDelete();
            $table->string('page_reference')->nullable();
            $table->text('excerpt')->nullable();
            $table->text('editor_note')->nullable();
            $table->timestamps();

            $table->unique(['site_image_id', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('image_sources');
        Schema::dropIfExists('media_hashes');
        Schema::dropIfExists('site_images');
    }
};
