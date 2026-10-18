<?php

namespace App\Enums;

enum ContributionType: string
{
    case SUGGEST_SITE = 'suggest_site';
    case SUGGEST_PHOTO = 'suggest_photo';
    case SUGGEST_CORRECTION = 'suggest_correction';
    case SUGGEST_SOURCE = 'suggest_source';
    case OTHER = 'other';

    public function labelAr(): string
    {
        return match ($this) {
            self::SUGGEST_SITE => 'اقتراح توثيق معلم أو تل أثري',
            self::SUGGEST_PHOTO => 'إرسال صورة أرشيفية أو حديثة',
            self::SUGGEST_CORRECTION => 'تصويب خطأ في البيانات',
            self::SUGGEST_SOURCE => 'إضافة مصدر أو دراسة موثقة',
            self::OTHER => 'مساهمة أخرى',
        };
    }
}
