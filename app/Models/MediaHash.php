<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaHash extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'file_size_bytes' => 'integer',
        'verified_at' => 'datetime',
    ];

    public function siteImage(): BelongsTo
    {
        return $this->belongsTo(SiteImage::class);
    }
}
