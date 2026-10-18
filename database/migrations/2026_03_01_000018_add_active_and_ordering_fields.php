<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'is_active')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('role_id');
                $table->timestamp('deactivated_at')->nullable()->after('is_active');
            });
        }

        if (Schema::hasTable('historical_periods') && !Schema::hasColumn('historical_periods', 'is_active')) {
            Schema::table('historical_periods', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('needs_editor_confirmation');
            });
        }

        if (Schema::hasTable('areas')) {
            Schema::table('areas', function (Blueprint $table) {
                if (!Schema::hasColumn('areas', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
                if (!Schema::hasColumn('areas', 'sort_order')) {
                    $table->integer('sort_order')->default(0);
                }
            });
        }

        if (Schema::hasTable('tags')) {
            Schema::table('tags', function (Blueprint $table) {
                if (!Schema::hasColumn('tags', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
                if (!Schema::hasColumn('tags', 'sort_order')) {
                    $table->integer('sort_order')->default(0);
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'is_active')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn(['is_active', 'deactivated_at']);
            });
        }

        if (Schema::hasTable('historical_periods') && Schema::hasColumn('historical_periods', 'is_active')) {
            Schema::table('historical_periods', function (Blueprint $table) {
                $table->dropColumn('is_active');
            });
        }

        if (Schema::hasTable('areas')) {
            Schema::table('areas', function (Blueprint $table) {
                $table->dropColumn(['is_active', 'sort_order']);
            });
        }

        if (Schema::hasTable('tags')) {
            Schema::table('tags', function (Blueprint $table) {
                $table->dropColumn(['is_active', 'sort_order']);
            });
        }
    }
};
