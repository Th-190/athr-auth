<?php

namespace App\Models;

use App\Enums\ReliabilityLevel;
use App\Enums\SourceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Source extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    protected $casts = [
        'source_type' => SourceType::class,
        'reliability_level' => ReliabilityLevel::class,
    ];

    public function sites(): BelongsToMany
    {
        return $this->belongsToMany(Site::class, 'site_sources')
            ->withPivot(['page_reference', 'excerpt', 'editor_note', 'relevance'])
            ->withTimestamps();
    }

    public function claimEvidence(): HasMany
    {
        return $this->hasMany(ClaimEvidence::class);
    }

    public function images(): BelongsToMany
    {
        return $this->belongsToMany(SiteImage::class, 'image_sources')
            ->withPivot(['page_reference', 'excerpt', 'editor_note'])
            ->withTimestamps();
    }

    public function encyclopediaEntries(): BelongsToMany
    {
        return $this->belongsToMany(EncyclopediaEntry::class, 'encyclopedia_sources');
    }
}
