<?php

namespace App\Models;

use App\Enums\EvidenceRelevance;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClaimEvidence extends Model
{
    use HasFactory;

    protected $table = 'claim_evidence';

    protected $guarded = ['id'];

    protected $casts = [
        'relevance' => EvidenceRelevance::class,
    ];

    public function claim(): BelongsTo
    {
        return $this->belongsTo(SiteClaim::class, 'claim_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ClaimVariant::class, 'claim_variant_id');
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(Source::class);
    }
}
