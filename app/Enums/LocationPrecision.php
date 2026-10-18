<?php

namespace App\Enums;

enum LocationPrecision: string
{
    case EXACT = 'exact';
    case APPROXIMATE = 'approximate';
    case RESTRICTED = 'restricted';
    case UNKNOWN = 'unknown';

    public function labelAr(): string
    {
        return match ($this) {
            self::EXACT => 'إحداثيات مساحية دقيقة',
            self::APPROXIMATE => 'إحداثيات تقريبية',
            self::RESTRICTED => 'إحداثيات محجوبة احترازياً لحماية الموقع',
            self::UNKNOWN => 'الموقع الجغرافي غير محدد',
        };
    }
}
