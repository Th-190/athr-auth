<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('field_name');
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason');
            $table->string('source_reference')->nullable();
            $table->string('verification_status_at_time');
            $table->timestamps();

            $table->index(['site_id', 'created_at']);
        });

        Schema::create('site_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('previous_status');
            $table->string('new_status');
            $table->text('decision_reason');
            $table->foreignId('verified_by')->constrained('users')->cascadeOnDelete();
            $table->string('scholarly_affiliation')->nullable();
            $table->timestamps();

            $table->index(['site_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_verifications');
        Schema::dropIfExists('site_revisions');
    }
};
