import React, { useState, useMemo } from 'react';
import { Site, VerificationStatus, SiteType, HistoricalPeriod, Area } from '../../types';
import { archiveDB } from '../../db/archiveStore';
import { VerificationBadge, LocationPrecisionBadge } from '../common/VerificationBadge';
import { ArchiveMap } from '../map/ArchiveMap';
import { getArabicFirstLetter, formatNumeral } from '../../utils/arabic';
import {
  Search,
  Filter,
  Grid,
  List,
  Map as MapIcon,
  Table as TableIcon,
  X,
  ArrowUpDown,
  BookOpen,
  Camera,
  Layers,
  Calendar,
  AlertCircle,
  Landmark,
  CheckCircle2,
  MapPin,
  ArrowLeft,
} from 'lucide-react';

interface RegistryViewProps {
  initialSearchQuery?: string;
  onSelectSite: (site: Site) => void;
  onNavigate: (tab: string, param?: string) => void;
}

const ARABIC_ALPHABET = [
  'الكل', 'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

export const RegistryView: React.FC<RegistryViewProps> = ({
  initialSearchQuery = '',
  onSelectSite,
  onNavigate,
}) => {
  const isVerifiedInitial = initialSearchQuery === '__filter_verified__';
  const [searchQuery, setSearchQuery] = useState(isVerifiedInitial ? '' : initialSearchQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map' | 'table'>('grid');
  const [selectedLetter, setSelectedLetter] = useState('الكل');

  // Filters
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState<VerificationStatus | ''>(
    isVerifiedInitial ? 'verified' : ''
  );
  const [hasSourcesOnly, setHasSourcesOnly] = useState(false);
  const [hasImagesOnly, setHasImagesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'sources' | 'name'>('newest');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const areas = archiveDB.getAreas();
  const siteTypes = archiveDB.getSiteTypes();
  const periods = archiveDB.getHistoricalPeriods();
  const allSites = useMemo(() => archiveDB.getAllSites(false), []);
  const stats = useMemo(() => archiveDB.getArchiveStatistics(), []);

  // Interactive Category Counters
  const categoryCounters = useMemo(() => {
    return [
      {
        id: 'all',
        label: 'جميع المعالم',
        count: allSites.length,
        isActive: !selectedTypeId,
        onClick: () => setSelectedTypeId(''),
      },
      {
        id: 'religious',
        label: 'مراقد ومساجد',
        count: allSites.filter(s => ['type_religious', 'type_churches'].includes(s.site_type_id) || s.name_ar.includes('مرقد') || s.name_ar.includes('مقام')).length,
        isActive: selectedTypeId === 'type_religious',
        onClick: () => setSelectedTypeId(selectedTypeId === 'type_religious' ? '' : 'type_religious'),
      },
      {
        id: 'forts',
        label: 'حصون وقلاع',
        count: allSites.filter(s => ['type_palaces_forts', 'type_tells', 'type_defensive'].includes(s.site_type_id)).length,
        isActive: selectedTypeId === 'type_palaces_forts',
        onClick: () => setSelectedTypeId(selectedTypeId === 'type_palaces_forts' ? '' : 'type_palaces_forts'),
      },
      {
        id: 'khans',
        label: 'خانات وأسواق',
        count: allSites.filter(s => ['type_caravansaries', 'type_bazaars', 'type_vernacular'].includes(s.site_type_id)).length,
        isActive: selectedTypeId === 'type_caravansaries',
        onClick: () => setSelectedTypeId(selectedTypeId === 'type_caravansaries' ? '' : 'type_caravansaries'),
      },
      {
        id: 'hydraulic',
        label: 'منشآت مائية وعيون',
        count: allSites.filter(s => s.site_type_id === 'type_hydraulic').length,
        isActive: selectedTypeId === 'type_hydraulic',
        onClick: () => setSelectedTypeId(selectedTypeId === 'type_hydraulic' ? '' : 'type_hydraulic'),
      },
    ];
  }, [allSites, selectedTypeId]);

  // Query database
  const filteredSites = useMemo(() => {
    let sites = archiveDB.searchSites({
      query: searchQuery,
      areaId: selectedAreaId || undefined,
      typeId: selectedTypeId || undefined,
      periodId: selectedPeriodId || undefined,
      verificationStatus: (selectedVerificationStatus as VerificationStatus) || undefined,
      hasSources: hasSourcesOnly || undefined,
      hasImages: hasImagesOnly || undefined,
      sortBy,
    });

    if (selectedLetter !== 'الكل') {
      sites = sites.filter(s => getArabicFirstLetter(s.name_ar) === selectedLetter);
    }

    return sites;
  }, [
    searchQuery,
    selectedAreaId,
    selectedTypeId,
    selectedPeriodId,
    selectedVerificationStatus,
    hasSourcesOnly,
    hasImagesOnly,
    sortBy,
    selectedLetter,
  ]);

  const activeFiltersCount = [
    selectedAreaId,
    selectedTypeId,
    selectedPeriodId,
    selectedVerificationStatus,
    hasSourcesOnly ? 'sources' : '',
    hasImagesOnly ? 'images' : '',
    selectedLetter !== 'الكل' ? 'letter' : '',
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSelectedAreaId('');
    setSelectedTypeId('');
    setSelectedPeriodId('');
    setSelectedVerificationStatus('');
    setHasSourcesOnly(false);
    setHasImagesOnly(false);
    setSelectedLetter('الكل');
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
      {/* 1. Header & Coverage Note */}
      <div className="border-b border-stone-200 pb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <h1 className="text-3xl font-serif font-bold text-stone-900">
              سجل المواقع الأثرية والتراثية
            </h1>

            {/* Sleek, Modern Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F7F4EE] text-[#78350F] border border-[#E5DFD5]">
                <Landmark className="w-3.5 h-3.5 text-[#78350F]" />
                <span>{formatNumeral(allSites.length, 'latin')} موقعاً مسجلاً بالسجل</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{formatNumeral(stats.verificationCounts.verified, 'latin')} محقق ومعتمد علمياً</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                <span>{formatNumeral(stats.totalSources, 'latin')} مرجعاً مسنداً</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200 font-mono">
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                <span>كربلاء والبادية</span>
              </span>
            </div>

            {/* Interactive Category Counters */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-stone-500 ml-1">أصناف رئيسية:</span>
              {categoryCounters.map(cat => (
                <button
                  key={cat.id}
                  onClick={cat.onClick}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[38px] rounded-full text-xs font-medium transition-all cursor-pointer ${
                    cat.isActive
                      ? 'bg-[#78350F] text-white shadow-xs font-bold scale-102'
                      : 'bg-white text-stone-700 hover:bg-[#F7F4EE] border border-[#E8E2D8] hover:border-amber-800/40'
                  }`}
                  title={`تصفية حسب ${cat.label}`}
                >
                  <span>{cat.label}</span>
                  <span className={`font-mono text-[11px] px-1.5 py-0.2 rounded-full ${
                    cat.isActive ? 'bg-amber-950/60 text-amber-100' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {formatNumeral(cat.count, 'latin')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View switcher buttons with touch targets >= 44px */}
            <div className="inline-flex items-center p-1 bg-stone-200/80 rounded-lg border border-stone-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'}`}
                title="عرض شبكي (بطاقات متحفية)"
                aria-label="عرض شبكي"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'}`}
                title="عرض قائمة مفصلة"
                aria-label="عرض قائمة مفصلة"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'}`}
                title="جدول الباحثين الأكاديمي"
                aria-label="جدول الباحثين"
              >
                <TableIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors cursor-pointer ${viewMode === 'map' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'}`}
                title="عرض الخريطة التفاعلية"
                aria-label="عرض الخريطة التفاعلية"
              >
                <MapIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Arabic Alphabet A-Z Jump Links Strip (Fluid flex-wrap, no overflow, 44px tap targets) */}
      <div className="w-full pb-2 border-b border-stone-200">
        <div className="flex flex-wrap items-center gap-1.5 text-xs py-1">
          <span className="text-stone-500 font-serif ml-2 shrink-0 font-medium text-xs">الفهرس الهجائي:</span>
          {ARABIC_ALPHABET.map((char) => (
            <button
              key={char}
              onClick={() => setSelectedLetter(char)}
              className={`min-w-[44px] min-h-[44px] px-2.5 flex items-center justify-center rounded-lg font-serif text-sm transition-colors cursor-pointer ${
                selectedLetter === char
                  ? 'bg-[#78350F] text-white font-bold shadow-xs'
                  : 'text-stone-700 bg-stone-100 hover:bg-stone-200'
              }`}
            >
              {char}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Search Bar and Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم العربي، اللاتيني، أو رقم السجل KHA..."
            className="w-full bg-white border border-stone-300 rounded-lg py-2.5 pr-10 pl-4 text-sm text-stone-900 focus:outline-none focus:border-[#78350F] min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-stone-700 bg-white border border-stone-300 rounded-lg px-3 py-2 min-h-[44px]">
            <ArrowUpDown className="w-4 h-4 text-stone-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="newest">الترتيب: الأحدث تسجيلاً</option>
              <option value="oldest">الترتيب: الأقدم تسجيلاً</option>
              <option value="name">الترتيب: هجائياً (أ-ي)</option>
              <option value="sources">الترتيب: الأكثر إسناداً بالمصادر</option>
              <option value="views">الترتيب: الأكثر تصفحاً</option>
            </select>
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer min-h-[44px] ${
              activeFiltersCount > 0
                ? 'bg-[#78350F] text-white border-[#78350F]'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>تصفية متقدمة</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-[#78350F] text-[10px] font-bold flex items-center justify-center font-mono">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Drawer / Expanded Box */}
      {isFilterDrawerOpen && (
        <div className="bg-[#F7F4EE] border border-[#EBE6DF] rounded-xl p-5 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-serif">
              معايير التصفية والفرز
            </h4>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-stone-600 hover:text-stone-900 underline min-h-[44px] flex items-center px-2 cursor-pointer"
              >
                مسح جميع الفلاتر
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Area Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-600 block">
                المنطقة الجغرافية
              </label>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none min-h-[44px]"
              >
                <option value="">جميع المناطق والبوادي</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name_ar}</option>
                ))}
              </select>
            </div>

            {/* Site Type Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-600 block">
                نوع المعلم (12 صنفاً)
              </label>
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
              >
                <option value="">جميع أصناف المعالم</option>
                {siteTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name_ar}</option>
                ))}
              </select>
            </div>

            {/* Historical Period Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-600 block">
                الحقبة التاريخية
              </label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
              >
                <option value="">جميع الحقب التاريخية</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.name_ar}</option>
                ))}
              </select>
            </div>

            {/* Verification Status Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-600 block">
                حالة التحقيق والإسناد
              </label>
              <select
                value={selectedVerificationStatus}
                onChange={(e: any) => setSelectedVerificationStatus(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
              >
                <option value="">جميع الحالات</option>
                <option value="verified">محقَّق ومسنَد</option>
                <option value="partially_verified">محقَّق جزئياً</option>
                <option value="unverified">غير محقَّق بعد</option>
                <option value="disputed">محل خلاف تاريخي</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-stone-200 text-xs text-stone-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasSourcesOnly}
                onChange={(e) => setHasSourcesOnly(e.target.checked)}
                className="rounded text-amber-800"
              />
              <span>يحتوي على مراجع مسندة فقط</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasImagesOnly}
                onChange={(e) => setHasImagesOnly(e.target.checked)}
                className="rounded text-amber-800"
              />
              <span>يحتوي على لوحات مصورة فقط</span>
            </label>
          </div>
        </div>
      )}

      {/* Results Count bar */}
      <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
        <span>نتائج البحث: {filteredSites.length} موقع مسجل</span>
        {activeFiltersCount > 0 && (
          <button onClick={handleClearFilters} className="text-[#78350F] underline font-sans">
            إعادة تعيين الفلاتر
          </button>
        )}
      </div>

      {/* Empty State */}
      {filteredSites.length === 0 && (
        <div className="p-12 text-center border border-dashed border-stone-300 rounded bg-white space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-stone-400" />
          <h3 className="text-sm font-bold text-stone-800 font-serif">
            لم يُعثر على سجلات تطابق معايير البحث الحالية
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            تأكد من كتابة الاسم بدون أخطاء إملائية، أو جرب توسيع معايير التصفية والمنطقة الجغرافية.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-1.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded font-medium"
          >
            مسح الفلاتر والبحث مجدداً
          </button>
        </div>
      )}

      {/* 4. Views Rendering */}

      {/* VIEW A: Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => {
            const images = archiveDB.getSiteImages(site.id);
            const featuredImg = images.find(img => img.featured) || images[0];

            return (
              <div
                key={site.id}
                onClick={() => onSelectSite(site)}
                className="group bg-white border border-[#E8E2D8] hover:border-amber-800/40 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-16/10 bg-stone-900 overflow-hidden">
                    {featuredImg ? (
                      <img
                        src={featuredImg.web_url}
                        alt={site.name_ar}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-500 text-xs font-mono">
                        لوحة بانتظار التوثيق
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 bg-black/75 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      {site.permanent_id}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <VerificationBadge status={site.verification_status} size="sm" />
                      <LocationPrecisionBadge precision={site.location_precision} />
                    </div>

                    <h3 className="text-base font-serif font-bold text-stone-900 group-hover:text-[#78350F] transition-colors leading-snug">
                      {site.name_ar}
                    </h3>
                    <p className="text-[11px] text-stone-500 font-sans -mt-1">
                      {site.name_en}
                    </p>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {site.short_description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-[#FBF9F5] border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                  <span>{site.source_count} مصادر</span>
                  <span className="text-[#78350F] font-sans font-medium group-hover:underline">
                    تفاصيل السجل ←
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW B: List View */}
      {viewMode === 'list' && (
        <div className="bg-white border border-[#EBE6DF] rounded divide-y divide-stone-100">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              onClick={() => onSelectSite(site)}
              className="p-4 hover:bg-[#FBF9F5] transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#78350F] font-bold">
                    {site.permanent_id}
                  </span>
                  <VerificationBadge status={site.verification_status} size="sm" />
                  <LocationPrecisionBadge precision={site.location_precision} />
                </div>
                <h3 className="text-base font-serif font-bold text-stone-900 hover:text-[#78350F]">
                  {site.name_ar} <span className="text-xs font-sans text-stone-500 font-normal">({site.name_en})</span>
                </h3>
                <p className="text-xs text-stone-600 line-clamp-1 max-w-3xl">
                  {site.short_description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-stone-500 font-mono shrink-0">
                <span>{site.source_count} مصادر</span>
                <span>{site.image_count} لوحات</span>
                <span className="text-[#78350F] font-sans font-medium">عرض ←</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW C: Researcher Table View */}
      {viewMode === 'table' && (
        <div className="space-y-3">
          {/* Mobile Stacked Cards */}
          <div className="sm:hidden space-y-3">
            {filteredSites.map((site) => (
              <div
                key={site.id}
                onClick={() => onSelectSite(site)}
                className="p-4 bg-white border border-[#EBE6DF] rounded-xl space-y-2 text-xs shadow-2xs cursor-pointer hover:border-stone-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#78350F] font-bold"><bdi>{site.permanent_id}</bdi></span>
                  <VerificationBadge status={site.verification_status} size="sm" />
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-sm">{site.name_ar}</h4>
                <div className="flex items-center justify-between text-stone-500 text-[11px] font-mono pt-1 border-t border-stone-100">
                  <span>{site.source_count} مصادر مسندة</span>
                  <span>آخر مراجعة: {site.last_reviewed_at}</span>
                  <span className="text-[#78350F] font-bold font-sans">عرض السجل ←</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table with Sticky First Column */}
          <div className="hidden sm:block bg-white border border-[#EBE6DF] rounded-xl overflow-x-auto shadow-2xs max-w-full">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F7F4EE] border-b border-stone-200 text-stone-700 font-serif">
                <tr>
                  <th className="py-3.5 px-4 font-bold sticky right-0 bg-[#F7F4EE] z-10 shadow-xs">المعرف الدائم</th>
                  <th className="py-3.5 px-4 font-bold">اسم المعلم الأثري</th>
                  <th className="py-3.5 px-4 font-bold">الحقبة</th>
                  <th className="py-3.5 px-4 font-bold">المنطقة</th>
                  <th className="py-3.5 px-4 font-bold">حالة التحقيق</th>
                  <th className="py-3.5 px-4 font-bold text-center">المصادر</th>
                  <th className="py-3.5 px-4 font-bold">آخر مراجعة</th>
                  <th className="py-3.5 px-4 font-bold">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {filteredSites.map((site) => {
                  const period = periods.find(p => p.id === site.historical_period_id);
                  const area = areas.find(a => a.id === site.area_id);

                  return (
                    <tr
                      key={site.id}
                      onClick={() => onSelectSite(site)}
                      className="hover:bg-[#FBF9F5] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono text-[#78350F] font-bold whitespace-nowrap sticky right-0 bg-white group-hover:bg-[#FBF9F5] z-10 shadow-xs">
                        <bdi>{site.permanent_id}</bdi>
                      </td>
                      <td className="py-3.5 px-4 font-serif font-bold text-stone-900 whitespace-nowrap">
                        {site.name_ar}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                        {period?.name_ar || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                        {area?.name_ar || '-'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <VerificationBadge status={site.verification_status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-center tabular-nums">
                        <bdi>{site.source_count}</bdi>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-500 whitespace-nowrap">
                        <bdi>{site.last_reviewed_at}</bdi>
                      </td>
                      <td className="py-3.5 px-4 text-[#78350F] font-medium whitespace-nowrap min-h-[44px]">
                        عرض السجل ←
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW D: Map View */}
      {viewMode === 'map' && (
        <div className="space-y-4">
          <ArchiveMap
            sites={filteredSites}
            onSelectSite={onSelectSite}
            height="550px"
          />
        </div>
      )}
    </div>
  );
};
