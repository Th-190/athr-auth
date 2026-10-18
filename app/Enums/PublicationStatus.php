<?php

namespace App\Enums;

enum PublicationStatus: string
{
    case DRAFT = 'draft';
    case PENDING_REVIEW = 'pending_review';
    case PUBLISHED = 'published';
    case ARCHIVED = 'archived';

    public function labelAr(): string
    {
        return match ($this) {
            self::DRAFT => 'مسودة خاصة',
            self::PENDING_REVIEW => 'قيد المراجعة',
            self::PUBLISHED => 'منشور للعموم',
            self::ARCHIVED => 'مؤرشف ومحفوظ',
        };
    }
}
