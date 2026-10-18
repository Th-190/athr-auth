<?php

namespace App\Models;

use App\Enums\PublicationStatus;
use App\Enums\RightsStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SiteModel extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    protected $casts = [
        'ai_assisted' => 'boolean',
        'editor_approved' => 'boolean',
        'is_featured_on_home' => 'boolean',
        'is_demo' => 'boolean',
        'sort_order' => 'integer',
        'publication_status' => PublicationStatus::class,
        'rights_status' => RightsStatus::class,
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(Source::class);
    }

    public function scopePubliclyVisible($query)
    {
        return $query->where('publication_status', PublicationStatus::PUBLISHED->value)
            ->whereNotIn('rights_status', [RightsStatus::UNKNOWN->value, RightsStatus::RESTRICTED->value])
            ->where(function ($q) {
                $q->where('ai_assisted', false)
                  ->orWhere('editor_approved', true);
            });
    }
}
