import React from 'react';

/**
 * «أثر كربلاء» — Karbala Heritage Archive
 * Official Brand System & Scalable Vector Graphics (SVG)
 * Inspired by baked Iraqi bricks (الآجر العراقي), ancient arches of Al-Ukhaidir,
 * mud-brick masonry, and Mesopotamian manuscript stamps.
 */

interface BrandProps {
  className?: string;
  size?: number;
  monochrome?: boolean;
}

// 1. Archival Emblem / Seal / Logo
export const ArchivalLogo: React.FC<BrandProps> = ({
  className = '',
  size = 40,
  monochrome = false,
}) => {
  const primaryColor = monochrome ? 'currentColor' : '#78350F'; // Terracotta / Brick
  const accentColor = monochrome ? 'currentColor' : '#9A3412';  // Clay / Bronze
  const paperColor = monochrome ? 'transparent' : '#FBF9F5';   // Archival warm paper

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="شعار أثر كربلاء - Karbala Heritage Archive Logo"
    >
      {/* Outer Archival Stepped Brick Border */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="8"
        fill={paperColor}
        stroke={primaryColor}
        strokeWidth="3.5"
      />

      {/* Decorative corner crenellations (Iraqi brick masonry motif) */}
      <path
        d="M6 22H22V6M94 22H78V6M6 78H22V94M94 78H78V94"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Ancient Mesopotamian / Abbasid Horseshoe Arch (Al-Ukhaidir vault geometry) */}
      <path
        d="M26 78V48C26 34.7452 36.7452 24 50 24C63.2548 24 74 34.7452 74 48V78"
        stroke={primaryColor}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Inner Vault Rib / Arch Keystones */}
      <path
        d="M36 78V50C36 42.268 42.268 36 50 36C57.732 36 64 42.268 64 50V78"
        stroke={accentColor}
        strokeWidth="2"
        strokeDasharray="4 3"
      />

      {/* Central Arabic Calligraphic Monogram 'أ' (أثر / الأخيضر) styled as ancient monument */}
      <path
        d="M50 44V68"
        stroke={primaryColor}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Hamza / Arch crown */}
      <path
        d="M44 38C46 36 52 36 54 39C55.5 41 53 43 50 43C47 43 45 42 45 40"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Ground baseline masonry */}
      <line x1="20" y1="78" x2="80" y2="78" stroke={primaryColor} strokeWidth="3" />
      <line x1="16" y1="83" x2="84" y2="83" stroke={accentColor} strokeWidth="2" />
    </svg>
  );
};

// 2. Full Wordmark with Arabic Calligraphy & English Subtitle
export const ArchivalWordmark: React.FC<{ className?: string; inverted?: boolean }> = ({
  className = '',
  inverted = false,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <ArchivalLogo size={42} />
      <div className="text-right">
        <span
          className={`block text-xl sm:text-2xl font-serif font-bold tracking-tight leading-tight ${
            inverted ? 'text-stone-100' : 'text-[#1C1917]'
          }`}
        >
          أثر كربلاء
        </span>
        <span
          className={`block text-[10px] tracking-widest uppercase font-mono ${
            inverted ? 'text-stone-400' : 'text-stone-500'
          }`}
        >
          Karbala Heritage Archive
        </span>
      </div>
    </div>
  );
};

// 3. Official Watermark Stamp (for Public Image Derivatives)
export const WatermarkStamp: React.FC<{
  siteName?: string;
  year?: string;
  rights?: string;
  className?: string;
}> = ({ siteName, year = '2026', rights = 'CC BY-NC 4.0', className = '' }) => {
  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 bg-black/75 backdrop-blur-xs text-[#FBF9F5] border border-stone-600/60 rounded text-xs select-none ${className}`}
      dir="rtl"
    >
      <ArchivalLogo size={18} monochrome />
      <div className="flex items-center gap-1.5 font-serif text-[11px] leading-none">
        <span className="font-bold">أثر كربلاء</span>
        <span className="text-stone-400">·</span>
        <span className="font-mono text-[10px]">Karbala Heritage Archive</span>
        {siteName && (
          <>
            <span className="text-stone-400">·</span>
            <span className="text-stone-300">{siteName}</span>
          </>
        )}
        <span className="text-stone-400">·</span>
        <span className="text-stone-400 font-mono text-[10px]">{year}</span>
      </div>
    </div>
  );
};
