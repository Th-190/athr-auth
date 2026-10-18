<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClaimVariant extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function claim(): BelongsTo
    {
        return $this->belongsTo(SiteClaim::class, 'claim_id');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(ClaimEvidence::class);
    }
}
