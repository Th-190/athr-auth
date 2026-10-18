<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_relations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('related_site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('relation_type'); // nearby, route_stage, architectural_twin, dependent, defense_network
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'related_site_id', 'relation_type']);
        });

        Schema::create('site_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('event_type'); // construction, restoration, battle, earthquake, abandonment, excavation
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('year_label')->nullable();
            $table->integer('year_numeric')->nullable();
            $table->foreignId('source_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('site_timeline', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('year_label');
            $table->integer('year_numeric')->nullable();
            $table->string('title');
            $table->text('description');
            $table->foreignId('source_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['site_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_timeline');
        Schema::dropIfExists('site_events');
        Schema::dropIfExists('site_relations');
    }
};
