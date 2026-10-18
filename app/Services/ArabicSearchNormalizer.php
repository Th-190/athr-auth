<?php

namespace App\Services;

class ArabicSearchNormalizer
{
    /**
     * Normalizes Arabic text for database search and pg_trgm indexing:
     * - Strips tashkeel (diacritics)
     * - Strips tatweel (kashida)
     * - Unifies alef forms (أ, إ, آ -> ا)
     * - Unifies yaa / alef maqsura (ى -> ي)
     * - Unifies taa marbuta (ة -> ه)
     */
    public static function normalize(string $text): string
    {
        // Strip tashkeel (Arabic diacritics: Fatha, Damma, Kasra, Sukun, Shadda, Tanween)
        $text = preg_replace('/[\x{064B}-\x{065F}\x{0670}]/u', '', $text) ?? $text;

        // Strip tatweel / kashida
        $text = preg_replace('/\x{0640}/u', '', $text) ?? $text;

        // Normalize Alef forms
        $text = preg_replace('/[أإآٱ]/u', 'ا', $text) ?? $text;

        // Normalize Alef Maqsura to Yaa
        $text = str_replace('ى', 'ي', $text);

        // Normalize Taa Marbuta to Haa
        $text = str_replace('ة', 'ه', $text);

        return trim(mb_strtolower($text, 'UTF-8'));
    }
}
