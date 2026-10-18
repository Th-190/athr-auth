<?php

namespace App\Enums;

enum ReliabilityLevel: string
{
    case PRIMARY = 'primary';
    case HIGH = 'high';
    case MEDIUM = 'medium';
    case PRELIMINARY = 'preliminary';
    case LOW = 'low';

    public function labelAr(): string
    {
        return match ($this) {
            self::PRIMARY => 'مصدر أولي أصيل',
            self::HIGH => 'موثوقية أكاديمية عالية',
            self::MEDIUM => 'موثوقية متوسطة / دراسة مساعدة',
            self::PRELIMINARY => 'معاينة أولية غير مكتملة',
            self::LOW => 'رواية ضعيفة أو غير محققة',
        };
    }
}
