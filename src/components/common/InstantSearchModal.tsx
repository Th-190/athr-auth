import React, { useState, useEffect, useRef } from 'react';
import { Site, Area, HistoricalPeriod, Source, EncyclopediaEntry } from '../../types';
import { archiveDB } from '../../db/archiveStore';
import { normalizeArabic, matchesArabicSearch } from '../../utils/arabic';
import { Search, X, History, MapPin, Calendar, BookOpen, Layers, ArrowLeft, CornerDownLeft } from 'lucide-react';

interface InstantSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSite: (site: Site) => void;
  onNavigate: (tab: string, param?: string) => void;
}

export const InstantSearchModal: React.FC<InstantSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSite,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(archiveDB.getRecentSearches());
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allSites = archiveDB.getAllSites(false);
  const allAreas = archiveDB.getAreas();
  const allPeriods = archiveDB.getHistoricalPeriods();
  const allSources = archiveDB.getAllSources();
  const allEncyclopedia = archiveDB.getEncyclopedia();

  // Matched results
  const matchedSites = query.trim()
    ? allSites.filter(s =>
        matchesArabicSearch(
          `${s.name_ar} ${s.name_en || ''} ${s.permanent_id} ${s.short_description}`,
          query
        )
      ).slice(0, 5)
    : [];

  const matchedAreas = query.trim()
    ? allAreas.filter(a => matchesArabicSearch(`${a.name_ar} ${a.name_en || ''}`, query)).slice(0, 3)
    : [];

  const matchedPeriods = query.trim()
    ? allPeriods.filter(p => matchesArabicSearch(`${p.name_ar} ${p.name_en || ''}`, query)).slice(0, 2)
    : [];

  const matchedEncyclopedia = query.trim()
    ? allEncyclopedia.filter(e => matchesArabicSearch(`${e.term_ar} ${e.short_summary}`, query)).slice(0, 2)
    : [];

  // Flattened items for keyboard indexing
  interface FlatItem {
    type: 'site' | 'area' | 'period' | 'encyclopedia';
    data: any;
  }

  const flatItems: FlatItem[] = [
    ...matchedSites.map(s => ({ type: 'site' as const, data: s })),
    ...matchedAreas.map(a => ({ type: 'area' as const, data: a })),
    ...matchedPeriods.map(p => ({ type: 'period' as const, data: p })),
    ...matchedEncyclopedia.map(e => ({ type: 'encyclopedia' as const, data: e })),
  ];

  const handleSelectFlatItem = (item: FlatItem) => {
    archiveDB.logSearchQuery(query);
    onClose();
    if (item.type === 'site') {
      onSelectSite(item.data);
    } else if (item.type === 'area') {
      onNavigate('hierarchy');
    } else if (item.type === 'period') {
      onNavigate('timeline');
    } else if (item.type === 'encyclopedia') {
      onNavigate('encyclopedia', item.data.term_ar);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (flatItems.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        archiveDB.logSearchQuery(query);
        onClose();
        onNavigate('registry', query.trim());
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        handleSelectFlatItem(flatItems[selectedIndex]);
      } else if (query.trim()) {
        archiveDB.logSearchQuery(query);
        onClose();
        onNavigate('registry', query.trim());
      }
    }
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    archiveDB.logSearchQuery(term);
  };

  const handleRemoveRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    archiveDB.removeRecentSearch(term);
    setRecentSearches(archiveDB.getRecentSearches());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="البحث الفوري الشامل"
    >
      <div
        className="w-full max-w-2xl bg-[#FBF9F5] border border-stone-300 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Input Header */}
        <div className="relative flex items-center border-b border-stone-200 bg-white px-4 py-3">
          <Search className="w-5 h-5 text-stone-500 mr-2 shrink-0 ml-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="ابحث باسم المعلم أو المنطقة أو الفترة أو المصطلح (مثال: الأخيضر، عين التمر)…"
            className="w-full text-base text-stone-900 bg-transparent focus:outline-none placeholder:text-stone-400 font-sans"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-stone-400 hover:text-stone-600 rounded"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded mr-3 shrink-0"
          >
            إلغاء [Esc]
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 space-y-5 text-sm">
          {!query.trim() ? (
            /* Recent Searches & Popular Suggestions */
            <div className="space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-700 font-bold mb-2">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-stone-600" />
                      <span>عمليات البحث الأخيرة على جهازك:</span>
                    </span>
                    <button
                      onClick={() => {
                        archiveDB.clearRecentSearches();
                        setRecentSearches([]);
                      }}
                      className="text-[11px] text-stone-500 hover:text-red-700"
                    >
                      مسح السجل
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map(term => (
                      <span
                        key={term}
                        onClick={() => handleRecentClick(term)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-200 hover:border-[#78350F] hover:text-[#78350F] rounded text-xs text-stone-800 cursor-pointer transition-colors"
                      >
                        <span>{term}</span>
                        <button
                          onClick={e => handleRemoveRecent(e, term)}
                          className="text-stone-400 hover:text-stone-700"
                          title="حذف"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs text-stone-700 font-bold block mb-2 font-serif">
                  الأصناف ومسارات التصفح السريعة:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('registry');
                    }}
                    className="p-2.5 bg-white border border-stone-200 rounded text-right hover:border-[#78350F] hover:bg-stone-50 transition-colors"
                  >
                    <span className="font-bold text-stone-900 block">السجل الكامل للمعالم</span>
                    <span className="text-stone-500 text-[11px]">استعراض كافة الشواهد والآثار الموثقة</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('map');
                    }}
                    className="p-2.5 bg-white border border-stone-200 rounded text-right hover:border-[#78350F] hover:bg-stone-50 transition-colors"
                  >
                    <span className="font-bold text-stone-900 block">الخريطة الأثرية</span>
                    <span className="text-stone-500 text-[11px]">المسح الطوبوغرافي المكاني</span>
                  </button>
                </div>
              </div>
            </div>
          ) : flatItems.length === 0 ? (
            /* Empty State */
            <div className="py-8 text-center space-y-2">
              <p className="text-stone-700 font-serif font-bold">لا توجد نتائج مطابقة لـ «{query}»</p>
              <p className="text-xs text-stone-500">
                تأكد من كتابة الاسم أو جرب البحث في السجل العام الشامل.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    archiveDB.logSearchQuery(query);
                    onClose();
                    onNavigate('registry', query);
                  }}
                  className="px-4 py-2 bg-[#78350F] text-white text-xs font-medium rounded hover:bg-[#9A3412]"
                >
                  البحث في السجل الكامل عن «{query}»
                </button>
              </div>
            </div>
          ) : (
            /* Grouped Results */
            <div className="space-y-4">
              {matchedSites.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-stone-600 block mb-1.5 font-serif">
                    المواقع والشواهد الأثرية ({matchedSites.length}):
                  </span>
                  <div className="space-y-1">
                    {matchedSites.map((site, idx) => {
                      const itemIdx = idx;
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <div
                          key={site.id}
                          onClick={() => handleSelectFlatItem({ type: 'site', data: site })}
                          className={`p-2.5 rounded border transition-colors cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#F4EFE6] border-[#78350F] text-[#78350F]'
                              : 'bg-white border-stone-200 hover:border-stone-400 text-stone-800'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-serif text-sm">{site.name_ar}</span>
                              <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                                {site.permanent_id}
                              </span>
                            </div>
                            <p className="text-xs text-stone-600 line-clamp-1">{site.short_description}</p>
                          </div>
                          <span className="text-xs text-stone-400 font-mono shrink-0 ml-2">
                            {isSelected && <CornerDownLeft className="w-3.5 h-3.5 inline" />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchedAreas.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-stone-600 block mb-1.5 font-serif">
                    المناطق والبوادي ({matchedAreas.length}):
                  </span>
                  <div className="space-y-1">
                    {matchedAreas.map((area, idx) => {
                      const itemIdx = matchedSites.length + idx;
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <div
                          key={area.id}
                          onClick={() => handleSelectFlatItem({ type: 'area', data: area })}
                          className={`p-2 rounded border transition-colors cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#F4EFE6] border-[#78350F] text-[#78350F]'
                              : 'bg-white border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#78350F]" />
                            <span className="font-medium text-xs text-stone-900">{area.name_ar}</span>
                            <span className="text-[11px] text-stone-500 font-mono">{area.name_en}</span>
                          </div>
                          <ArrowLeft className="w-3 h-3 text-stone-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchedPeriods.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-stone-600 block mb-1.5 font-serif">
                    الفترات التاريخية ({matchedPeriods.length}):
                  </span>
                  <div className="space-y-1">
                    {matchedPeriods.map((period, idx) => {
                      const itemIdx = matchedSites.length + matchedAreas.length + idx;
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <div
                          key={period.id}
                          onClick={() => handleSelectFlatItem({ type: 'period', data: period })}
                          className={`p-2 rounded border transition-colors cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#F4EFE6] border-[#78350F] text-[#78350F]'
                              : 'bg-white border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#78350F]" />
                            <span className="font-medium text-xs text-stone-900">{period.name_ar}</span>
                            <span className="text-[10px] font-mono text-stone-500">
                              ({period.start_year} — {period.end_year})
                            </span>
                          </div>
                          <ArrowLeft className="w-3 h-3 text-stone-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchedEncyclopedia.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-stone-600 block mb-1.5 font-serif">
                    المعجم والمصطلحات ({matchedEncyclopedia.length}):
                  </span>
                  <div className="space-y-1">
                    {matchedEncyclopedia.map((entry, idx) => {
                      const itemIdx = matchedSites.length + matchedAreas.length + matchedPeriods.length + idx;
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <div
                          key={entry.id}
                          onClick={() => handleSelectFlatItem({ type: 'encyclopedia', data: entry })}
                          className={`p-2 rounded border transition-colors cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#F4EFE6] border-[#78350F] text-[#78350F]'
                              : 'bg-white border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-[#78350F]" />
                            <span className="font-medium text-xs text-stone-900">{entry.term_ar}</span>
                            <span className="text-[11px] text-stone-500 line-clamp-1">{entry.short_summary}</span>
                          </div>
                          <ArrowLeft className="w-3 h-3 text-stone-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-600">
          <div className="flex items-center gap-3">
            <span>↑↓ للتنقل</span>
            <span>↵ للاختيار</span>
            <span>Esc للإغلاق</span>
          </div>
          {query.trim() && (
            <button
              onClick={() => {
                archiveDB.logSearchQuery(query);
                onClose();
                onNavigate('registry', query);
              }}
              className="text-[#78350F] hover:underline font-medium cursor-pointer"
            >
              عرض كافة نتائج «{query}» في السجل الكامل ←
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
