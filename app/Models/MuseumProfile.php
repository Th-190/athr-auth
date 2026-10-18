<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MuseumProfile extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'visiting_info' => 'array',
        'visit_info_verified_at' => 'datetime',
    ];

    /** @return BelongsTo<Site, $this> */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    /** @return BelongsTo<Source, $this> */
    public function visitingInfoSource(): BelongsTo
    {
        return $this->belongsTo(Source::class, 'visiting_info_source_id');
    }

    /** @return HasMany<MuseumArtifact, $this> */
    public function artifacts(): HasMany
    {
        return $this->hasMany(MuseumArtifact::class);
    }
}
