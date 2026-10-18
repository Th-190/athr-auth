<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MuseumArtifactRevision extends Model
{
    protected $guarded = ['id'];

    /** @return BelongsTo<MuseumArtifact, $this> */
    public function artifact(): BelongsTo
    {
        return $this->belongsTo(MuseumArtifact::class, 'museum_artifact_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
