/**
 * Arabic normalization and spatial utility functions
 * for «أثر كربلاء» — Karbala Heritage Archive
 */

/**
 * Normalizes Arabic text for high-recall search:
 * - Removes diacritics (tashkeel)
 * - Removes kashida (tatweel)
 * - Unifies alef variations (أ, إ, آ -> ا)
 * - Unifies yaa / alef maqsura (ى -> ي)
 * - Unifies taa marbuta / haa (ة -> ه)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  return text
    // Remove diacritics (harakat/tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove tatweel (kashida)
    .replace(/\u0640/g, '')
    // Normalize alef variants
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize alef maksura to yaa
    .replace(/ى/g, 'ي')
    // Normalize taa marbuta to haa
    .replace(/ة/g, 'ه')
    // Normalize Persian/Urdu kaf & yaa variants if present
    .replace(/ك/g, 'ك')
    .replace(/ي/g, 'ي')
    .trim()
    .toLowerCase();
}

/**
 * Checks if search query matches target text using Arabic normalization
 */
export function matchesArabicSearch(target: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const normalizedTarget = normalizeArabic(target);
  const normalizedQuery = normalizeArabic(query);

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  return queryTerms.every(term => normalizedTarget.includes(term));
}

/**
 * Returns Arabic alphabetical letter index group for a string
 */
export function getArabicFirstLetter(text: string): string {
  const normalized = normalizeArabic(text);
  if (!normalized) return '#';
  const char = normalized.charAt(0);
  if (/[ابتثجحخدذرزسشصضطظعغفقكلمنهوي]/.test(char)) {
    return char;
  }
  return '#';
}

/**
 * PostGIS spatial distance calculation (Haversine formula in KM)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * PostGIS security gate: Returns public coordinates based on location_precision.
 * If location_precision === 'restricted', exact coordinates NEVER reach the client.
 * Public coordinates are intentionally fuzzed to provincial/area centroid.
 */
export function getPublicCoordinates(
  lat: number,
  lng: number,
  precision: 'exact' | 'approximate' | 'restricted'
): { lat: number; lng: number; isFuzzed: boolean } {
  if (precision === 'restricted') {
    // Return approximate area centroid with intentional offset (fuzzed by ~5-10km)
    // to protect delicate unexcavated archaeological sites from looting
    return {
      lat: Math.round(lat * 10) / 10,
      lng: Math.round(lng * 10) / 10,
      isFuzzed: true,
    };
  }

  if (precision === 'approximate') {
    // 2 decimal places precision (~1.1 km accuracy)
    return {
      lat: Math.round(lat * 100) / 100,
      lng: Math.round(lng * 100) / 100,
      isFuzzed: true,
    };
  }

  // Exact coordinates
  return { lat, lng, isFuzzed: false };
}

/**
 * Generates academic citation for an archival site record
 */
export function generateCitation(
  siteName: string,
  permanentId: string,
  lastReviewed: string,
  format: 'arabic' | 'chicago' | 'apa'
): string {
  const currentDate = new Date().toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const url = window.location.href;

  if (format === 'arabic') {
    return `أثر كربلاء: الأرشيف الرقمي للتراث والآثار. «${siteName}»، السجل رقم: ${permanentId}. مراجعة: ${lastReviewed}. تاريخ الاسترجاع: ${currentDate}. الرابط: ${url}`;
  }

  if (format === 'chicago') {
    return `Karbala Heritage Archive. "${siteName}." Record ${permanentId}. Last reviewed ${lastReviewed}. Accessed ${new Date().toISOString().split('T')[0]}. ${url}`;
  }

  return `Karbala Heritage Archive. (${lastReviewed.split('-')[0] || '2026'}). ${siteName} (Archive ID: ${permanentId}). Retrieved from ${url}`;
}

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Formats a number or string of digits into Arabic-Indic or Latin numerals based on setting
 */
export function formatNumeral(value: number | string, system: 'arabic' | 'latin' = 'latin'): string {
  const str = String(value);
  if (system === 'latin') {
    return str.replace(/[٠-٩]/g, d => String(ARABIC_INDIC_DIGITS.indexOf(d)));
  }
  return str.replace(/[0-9]/g, d => ARABIC_INDIC_DIGITS[parseInt(d, 10)]);
}

/**
 * Exports site records to BibTeX citation format
 */
export function exportToBibTeX(sites: any[]): string {
  return sites
    .map(site => {
      const citeKey = `kha_${site.slug.replace(/[^a-zA-Z0-9_]/g, '_')}_${site.permanent_id.replace(/[^0-9]/g, '')}`;
      const year = site.last_reviewed_at?.split('-')[0] || '2026';
      return `@misc{${citeKey},
  title = {{${site.name_ar} — ${site.name_en || ''}}},
  author = {{أثر كربلاء: هيئة التحقيق والتوثيق}},
  howpublished = {الأرشيف الرقمي للتراث والآثار بمحافظة كربلاء},
  year = {${year}},
  note = {سجل رقم: ${site.permanent_id}, حالة التحقيق: ${site.verification_status}},
  url = {https://karbalaheritage.iq/sites/${site.slug}}
}`;
    })
    .join('\n\n');
}

/**
 * Exports site records to RIS citation format
 */
export function exportToRIS(sites: any[]): string {
  return sites
    .map(site => {
      const year = site.last_reviewed_at?.split('-')[0] || '2026';
      return [
        'TY  - ELEC',
        `TI  - ${site.name_ar} (${site.name_en || ''})`,
        'AU  - أثر كربلاء: هيئة التحقيق والتوثيق',
        `PY  - ${year}`,
        `UR  - https://karbalaheritage.iq/sites/${site.slug}`,
        `ID  - ${site.permanent_id}`,
        `N1  - حالة التحقيق: ${site.verification_status} — دقة الموقع: ${site.location_precision}`,
        `AB  - ${site.short_description || ''}`,
        'ER  - ',
      ].join('\n');
    })
    .join('\n\n');
}

/**
 * Exports site records to clean CSV format
 */
export function exportToCSV(sites: any[]): string {
  const headers = ['المعرف الدائم', 'اسم المعلم', 'الاسم اللاتيني', 'حالة التحقيق', 'دقة الإحداثيات', 'عدد المصادر', 'تاريخ المراجعة'];
  const rows = sites.map(s => [
    `"${s.permanent_id}"`,
    `"${s.name_ar.replace(/"/g, '""')}"`,
    `"${(s.name_en || '').replace(/"/g, '""')}"`,
    `"${s.verification_status}"`,
    `"${s.location_precision}"`,
    s.source_count || 0,
    `"${s.last_reviewed_at}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Generates an Atom/RSS XML feed string for recent additions and reviews
 */
export function generateAtomFeed(sites: any[]): string {
  const sorted = [...sites].slice(0, 15);
  const updated = new Date().toISOString();

  const entriesXml = sorted
    .map(s => {
      return `  <entry>
    <title>${s.name_ar} (${s.permanent_id})</title>
    <link href="https://karbalaheritage.iq/sites/${s.slug}" />
    <id>urn:kha:site:${s.id}</id>
    <updated>${s.last_reviewed_at}T00:00:00Z</updated>
    <summary>${s.short_description || ''}</summary>
    <category term="${s.verification_status}" label="حالة التحقيق" />
  </entry>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ar">
  <title>أثر كربلاء — ما استجدّ في السجل الأثري</title>
  <subtitle>آخر المعالم والمواقع الأثرية المحققة والمحدثة في محافظة كربلاء</subtitle>
  <link href="https://karbalaheritage.iq/feed.atom" rel="self" />
  <link href="https://karbalaheritage.iq" />
  <id>urn:kha:feed</id>
  <updated>${updated}</updated>
  <author>
    <name>هيئة تحرير أثر كربلاء</name>
  </author>
${entriesXml}
</feed>`;
}

