<?php

namespace App\Enums;

enum SourceType: string
{
    case BOOK = 'book';
    case ACADEMIC_PAPER = 'academic_paper';
    case DOCUMENT = 'document';
    case ARCHIVE = 'archive';
    case OFFICIAL_SITE = 'official_site';
    case GOVERNMENT_RECORD = 'government_record';
    case FIELD_SOURCE = 'field_source';
    case INTERVIEW = 'interview';
    case HISTORICAL_PHOTO = 'historical_photo';
    case MAP = 'map';
    case PRESS = 'press';
    case OTHER = 'other';

    public function labelAr(): string
    {
        return match ($this) {
            self::BOOK => 'كتاب مطبوع',
            self::ACADEMIC_PAPER => 'بحث أكاديمي محكّم',
            self::DOCUMENT => 'وثيقة تاريخية أو وقفية',
            self::ARCHIVE => 'سجل أرشيفي',
            self::OFFICIAL_SITE => 'موقع رسمي حكومي',
            self::GOVERNMENT_RECORD => 'سجل دائرة الآثار',
            self::FIELD_SOURCE => 'مصدر ميداني / استطلاع',
            self::INTERVIEW => 'شهادة شفوية موثقة',
            self::HISTORICAL_PHOTO => 'صورة تاريخية أرشيفية',
            self::MAP => 'خارطة أو مصور جغرافي',
            self::PRESS => 'مادة صحفية تاريخية',
            self::OTHER => 'مصدر آخر',
        };
    }
}
