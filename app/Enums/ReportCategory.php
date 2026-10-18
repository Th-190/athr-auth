<?php

namespace App\Enums;

enum ReportCategory: string
{
    case WRONG_INFORMATION = 'wrong_information';
    case INCORRECT_SOURCE = 'incorrect_source';
    case WRONG_IMAGE = 'wrong_image';
    case WRONG_IMAGE_RIGHTS = 'wrong_image_rights';
    case WRONG_LOCATION = 'wrong_location';
    case OFFENSIVE_CONTENT = 'offensive_content';
    case OTHER = 'other';

    public function labelAr(): string
    {
        return match ($this) {
            self::WRONG_INFORMATION => 'معلومة تاريخية أو معمارية غير دقيقة',
            self::INCORRECT_SOURCE => 'عزو مرجعي أو اقتباس غير صحيح',
            self::WRONG_IMAGE => 'صورة لا تخص هذا المعلم',
            self::WRONG_IMAGE_RIGHTS => 'انتهاك حقوق ملكية أو نسبة غير دقيقة للمصور',
            self::WRONG_LOCATION => 'إحداثيات جغرافية أو توصيف مكاني خاطئ',
            self::OFFENSIVE_CONTENT => 'محتوى غير لائق',
            self::OTHER => 'ملاحظة توثيقية أخرى',
        };
    }
}
