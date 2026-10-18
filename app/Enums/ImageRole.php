<?php

namespace App\Enums;

enum ImageRole: string
{
    case CURRENT_VIEW = 'current_view';
    case HISTORICAL_PHOTO = 'historical_photo';
    case DETAIL = 'detail';
    case PLAN_OR_MAP = 'plan_or_map';
    case AERIAL = 'aerial';
    case DRAWING = 'drawing';
    case OTHER = 'other';

    public function labelAr(): string
    {
        return match ($this) {
            self::CURRENT_VIEW => 'معاينة راهنة للموقع',
            self::HISTORICAL_PHOTO => 'صورة تاريخية قديمة',
            self::DETAIL => 'تفصيل معماري أو زخرفي',
            self::PLAN_OR_MAP => 'مخطط هندسي أو خارطة',
            self::AERIAL => 'لقطة جوية أو فضائية',
            self::DRAWING => 'رسم توثيقي أو كروكي',
            self::OTHER => 'أخرى',
        };
    }
}
