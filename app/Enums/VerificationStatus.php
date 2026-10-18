<?php

namespace App\Enums;

enum VerificationStatus: string
{
    case VERIFIED = 'verified';
    case PARTIALLY_VERIFIED = 'partially_verified';
    case UNVERIFIED = 'unverified';
    case DISPUTED = 'disputed';
    case UNKNOWN = 'unknown';

    public function labelAr(): string
    {
        return match ($this) {
            self::VERIFIED => 'محقَّق ومسنَد',
            self::PARTIALLY_VERIFIED => 'محقَّق جزئياً',
            self::UNVERIFIED => 'غير محقَّق بعد',
            self::DISPUTED => 'محل خلاف تاريخي',
            self::UNKNOWN => 'غير محدد',
        };
    }
}
