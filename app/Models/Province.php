<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Province extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function districts(): HasMany
    {
        return $this->hasMany(District::class);
    }

    public function sites(): HasMany
    {
        return $this->hasMany(Site::class);
    }
}
