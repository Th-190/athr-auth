<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MuseumProfile extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'visiting_info' => 'array',
        'visit_info_verified_at' => 'datetime',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function visitingInfoSource(): BelongsTo
    {
        return $this->belongsTo(Source::class, 'visiting_info_source_id');
    }
}
