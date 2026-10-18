<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SiteClaim extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'is_disputed' => 'boolean',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ClaimVariant::class, 'claim_id');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(ClaimEvidence::class, 'claim_id');
    }
}
