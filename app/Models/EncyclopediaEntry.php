<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class EncyclopediaEntry extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function sites(): BelongsToMany
    {
        return $this->belongsToMany(Site::class, 'encyclopedia_sites');
    }

    public function sources(): BelongsToMany
    {
        return $this->belongsToMany(Source::class, 'encyclopedia_sources');
    }
}
