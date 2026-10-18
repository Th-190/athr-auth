<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubDistrict extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function areas(): HasMany
    {
        return $this->hasMany(Area::class);
    }
}
