<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_contributions', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('site_id')->constrained()->nullOnDelete();
            $table->string('contributor_affiliation')->nullable()->after('contributor_email');
            $table->json('proposed_changes')->nullable()->after('source_reference');
        });
    }

    public function down(): void
    {
        Schema::table('site_contributions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['contributor_affiliation', 'proposed_changes']);
        });
    }
};
