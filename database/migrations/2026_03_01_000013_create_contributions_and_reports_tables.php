<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_contributions', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // ContributionType enum
            $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
            $table->string('contributor_name');
            $table->string('contributor_email')->nullable();
            $table->boolean('allow_public_credit')->default(true);
            $table->string('title');
            $table->text('description');
            $table->text('source_reference')->nullable();
            $table->string('rights_declaration')->nullable();
            $table->string('status')->default('pending_review'); // pending_review, approved, rejected
            $table->text('admin_decision_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });

        Schema::create('content_reports', function (Blueprint $table) {
            $table->id();
            $table->string('reportable_type'); // Site, SiteImage, Source
            $table->unsignedBigInteger('reportable_id');
            $table->string('reason_category'); // ReportCategory enum
            $table->string('reporter_email')->nullable();
            $table->text('details');
            $table->text('suggested_correction')->nullable();
            $table->string('status')->default('pending'); // pending, resolved, dismissed
            $table->text('resolution_note')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['reportable_type', 'reportable_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_reports');
        Schema::dropIfExists('site_contributions');
    }
};
