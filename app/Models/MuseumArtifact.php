<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MuseumArtifact extends Model
{
    protected $guarded = ['id'];

    /** @return BelongsTo<MuseumProfile, $this> */
    public function museumProfile(): BelongsTo
    {
        return $this->belongsTo(MuseumProfile::class);
    }

    /** @return BelongsTo<Source, $this> */
    public function source(): BelongsTo
    {
        return $this->belongsTo(Source::class);
    }

    /** @return BelongsToMany<Source, $this> */
    public function sources(): BelongsToMany
    {
        return $this->belongsToMany(Source::class, 'museum_artifact_sources')
            ->withPivot(['page_reference', 'excerpt', 'editor_note', 'relevance'])
            ->withTimestamps();
    }

    /** @return \Illuminate\Database\Eloquent\Relations\HasMany<MuseumArtifactRevision, $this> */
    public function revisions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(MuseumArtifactRevision::class)->latest();
    }
}
