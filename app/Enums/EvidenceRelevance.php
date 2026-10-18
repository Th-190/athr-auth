<?php

namespace App\Enums;

enum EvidenceRelevance: string
{
    case DIRECT = 'direct';
    case SUPPORTING = 'supporting';
    case CONTEXTUAL = 'contextual';
    case CONTRADICTORY = 'contradictory';

    public function labelAr(): string
    {
        return match ($this) {
            self::DIRECT => 'دليل مباشر وصريح',
            self::SUPPORTING => 'دليل معزز ومساند',
            self::CONTEXTUAL => 'قرينة سياقية عامة',
            self::CONTRADICTORY => 'رأي مخالف أو ناقض',
        };
    }
}
