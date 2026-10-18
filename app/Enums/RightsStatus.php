<?php

namespace App\Enums;

enum RightsStatus: string
{
    case PUBLIC_DOMAIN = 'public_domain';
    case CREATIVE_COMMONS = 'creative_commons';
    case COPYRIGHTED_PERMITTED = 'copyrighted_permitted';
    case UNKNOWN = 'unknown';
    case RESTRICTED = 'restricted';

    public function labelAr(): string
    {
        return match ($this) {
            self::PUBLIC_DOMAIN => 'ملك عام (Public Domain)',
            self::CREATIVE_COMMONS => 'المشاع الإبداعي (Creative Commons)',
            self::COPYRIGHTED_PERMITTED => 'حقوق محفوظة بإذن نشر مكتوب',
            self::UNKNOWN => 'غير مؤكدة (قيد المراجعة والتحقق)',
            self::RESTRICTED => 'مقيدة الاستخدام',
        };
    }
}
