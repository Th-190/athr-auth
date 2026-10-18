<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteTimeline extends Model
{
    use HasFactory;

    protected $table = 'site_timeline';

    protected $guarded = ['id'];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(Source::class);
    }
}
