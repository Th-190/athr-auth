<?php

namespace App\Observers;

use App\Models\Site;
use App\Services\ArabicSearchNormalizer;

class SiteObserver
{
    /**
     * Handle the Site "saving" event.
     * Keeps normalized search_text column synchronized for pg_trgm GIN indexing.
     */
    public function saving(Site $site): void
    {
        $textToNormalize = implode(' ', array_filter([
            $site->name_ar,
            $site->name_en,
            $site->permanent_id,
            $site->short_description,
            $site->description,
            $site->historical_description,
            $site->architectural_description,
            $site->location_description,
        ]));

        $site->search_text = ArabicSearchNormalizer::normalize($textToNormalize);
    }
}
