<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table): void {
            $table->timestamp('two_factor_verified_at')->nullable()->after('last_used_at');
        });

        Schema::table('encyclopedia_entries', function (Blueprint $table): void {
            $table->string('publication_status', 30)->default('draft')->index();
            $table->timestamp('published_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('encyclopedia_entries', function (Blueprint $table): void {
            $table->dropIndex(['publication_status']);
            $table->dropColumn(['publication_status', 'published_at']);
        });

        Schema::table('personal_access_tokens', function (Blueprint $table): void {
            $table->dropColumn('two_factor_verified_at');
        });
    }
};
