<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteRelation extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    /** @return BelongsTo<Site, $this> */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    /** @return BelongsTo<Site, $this> */
    public function relatedSite(): BelongsTo
    {
        return $this->belongsTo(Site::class, 'related_site_id');
    }
}
