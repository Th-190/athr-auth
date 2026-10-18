<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_images', function (Blueprint $table) {
            $table->text('source_url')->nullable();
            $table->text('permission_details')->nullable();
            $table->foreignId('rights_reviewed_by')->nullable()->after('updated_by')->constrained('users')->nullOnDelete();
            $table->timestamp('rights_reviewed_at')->nullable();
            $table->boolean('visibility')->default(false)->change();
        });

        // The newly added reviewer fields are empty for every pre-existing image.
        // Keep all legacy derivatives hidden until an editor explicitly re-reviews
        // their source, attribution, license/permission, and publication decision.
        DB::table('site_images')->where('visibility', true)->update(['visibility' => false]);
    }

    public function down(): void
    {
        Schema::table('site_images', function (Blueprint $table) {
            $table->dropForeign(['rights_reviewed_by']);
            $table->dropColumn(['source_url', 'permission_details', 'rights_reviewed_by', 'rights_reviewed_at']);
            $table->boolean('visibility')->default(false)->change();
        });
    }
};
