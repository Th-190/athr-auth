<?php

namespace App\Models;

use App\Enums\ContributionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteContribution extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'type' => ContributionType::class,
        'allow_public_credit' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
