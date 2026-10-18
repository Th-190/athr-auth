<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action'); // publish, update_verification, delete, modify_coordinates, import, etc.
            $table->string('entity_type'); // Site, SiteImage, Source, User, etc.
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('entity_identifier')->nullable(); // e.g. KHA-000101
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('actor_name');
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent')->nullable();
            $table->json('old_payload')->nullable();
            $table->json('new_payload')->nullable();
            $table->text('details')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['entity_type', 'entity_id']);
            $table->index(['action', 'created_at']);
        });

        Schema::create('download_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_image_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('download_version'); // watermarked_web, watermarked_highres, research_bundle
            $table->string('ip_hash', 64);
            $table->timestamp('downloaded_at')->useCurrent();

            $table->index(['site_image_id', 'downloaded_at']);
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, integer, boolean, json
            $table->string('group')->default('general');
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('download_logs');
        Schema::dropIfExists('audit_logs');
    }
};
