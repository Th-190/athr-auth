<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    /** @return BelongsTo<SubDistrict, $this> */
    public function subDistrict(): BelongsTo
    {
        return $this->belongsTo(SubDistrict::class);
    }

    /** @return HasMany<Site, $this> */
    public function sites(): HasMany
    {
        return $this->hasMany(Site::class);
    }
}
