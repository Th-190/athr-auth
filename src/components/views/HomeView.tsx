import React, { useState } from 'react';
import { Site, SiteType, HistoricalPeriod, Area } from '../../types';
import { archiveDB } from '../../db/archiveStore';
import { VerificationBadge, LocationPrecisionBadge } from '../common/VerificationBadge';
import { ArchiveMap } from '../map/ArchiveMap';
import { formatNumeral } from '../../utils/arabic';
import { InteractiveHeritageExplorer } from '../explorer/InteractiveHeritageExplorer';
import { MonumentModelViewer } from '../common/MonumentModelViewer';
import {
  Search,
  BookOpen,
  Camera,
  Compass,
  ArrowLeft,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Bookmark,
  Check,
  Landmark,
  X,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: string, param?: string) => void;
  onSelectSite: (site: Site) => void;
  onOpenContributeModal: () => void;
  numeralSystem?: 'arabic' | 'latin';
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onSelectSite,
  onOpenContributeModal,
  numeralSystem = 'latin',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(archiveDB.getBookmarkedSiteIds());

  const stats = archiveDB.getArchiveStatistics();
  const allSites = archiveDB.getAllSites(false);
  const featuredSites = allSites.filter(s => s.featured);
  const popularSearches = archiveDB.getPopularSearches();
  const featuredModels = archiveDB.getFeaturedSiteModels();

  const recentlyReviewed = [...allSites].sort(
    (a, b) => new Date(b.last_reviewed_at).getTime() - new Date(a.last_reviewed_at).getTime()
  ).slice(0, 4);

  const siteTypes = archiveDB.getSiteTypes();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      archiveDB.logSearchQuery(searchQuery.trim());
      onNavigate('registry', searchQuery.trim());
    }
  };

  const handleToggleBookmark = (e: React.MouseEvent, siteId: string) => {
    e.stopPropagation();
    archiveDB.toggleBookmark(siteId);
    setBookmarkedIds(archiveDB.getBookmarkedSiteIds());
  };

  const handleRandomSite = () => {
    const site = archiveDB.getRandomSite();
    if (site) {
      onSelectSite(site);
    } else {
      onNavigate('registry');
    }
  };

  return (
    <div className="space-y-12">
      {/* Homepage Hero: Short Intro, Search Field, and 3D Model of Karbala Landmark */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Side (At Start / Right in RTL): Tagline, 2-line Description, Existing Search Field */}
          <div className="space-y-4 text-right">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1C1917] tracking-tight leading-tight">
              ذاكرة كربلاء المعمارية والأثرية
            </h1>
            <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-sans line-clamp-2">
              سجل رقمي توثيقي مكرّس لحصر وتوثيق المعالم الأثرية والتاريخية في محافظة كربلاء،
              مسنداً بالمصادر الأكاديمية وسجلات التوثيق والمطابقة العلمية.
            </p>

            {/* Repositioned Search Bar: Wide Pill-shaped Search Input (rounded-full) */}
            <div className="pt-1 w-full max-w-xl">
              <form onSubmit={handleSearchSubmit} className="relative w-full group">
                <div className="relative flex items-center bg-white border border-[#E8E2D8] hover:border-amber-800/40 rounded-full shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-[#78350F] focus-within:ring-4 focus-within:ring-[#78350F]/10 transition-all duration-300 px-4 py-1.5">
                  <Search className="w-5 h-5 text-stone-400 group-focus-within:text-[#78350F] mr-1 shrink-0 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المعلم، الموقع، الفترة، أو الرقم الأرشيفي…"
                    className="w-full py-2.5 px-3 text-sm sm:text-base text-stone-900 bg-transparent focus:outline-none placeholder:text-stone-400 font-sans"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 text-stone-400 hover:text-stone-600 rounded-full transition-colors ml-1 cursor-pointer"
                      title="مسح البحث"
                      aria-label="مسح البحث"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 min-h-[44px] rounded-full bg-[#78350F] hover:bg-[#9A3412] text-white text-xs sm:text-sm font-medium transition-colors shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>بحث</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Model Side: Large, transparent background over the white page, soft ground shadow, aspect-ratio reserved */}
          <div className="w-full flex justify-center">
            <MonumentModelViewer
              models={featuredModels}
              getSiteById={id => archiveDB.getSiteById(id)}
              onSelectSite={onSelectSite}
            />
          </div>
        </div>
      </section>

      {/* Main Landing Feature: Explorer, Map, and Card Previews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">

        {/* The Full-Stack Interactive Map & Dynamic Filtering Cards Feature */}
        <InteractiveHeritageExplorer
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSelectSite={onSelectSite}
          onNavigate={onNavigate}
          numeralSystem={numeralSystem}
        />

        {/* Real Live Database Statistics Strip (Each card links directly to matching filtered list) */}
        <div className="mt-8 max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3.5 px-2">
          <div
            onClick={() => onNavigate('registry')}
            className="bg-white border border-[#E8E2D8] hover:border-amber-800/40 p-4 rounded-xl text-center cursor-pointer shadow-xs hover:shadow-md transition-all duration-300 hover:scale-[1.01] group"
            title="استعراض كافة المعالم المسجلة بالسجل"
          >
            <span className="block text-2xl sm:text-3xl font-serif font-bold text-stone-900 tabular-nums group-hover:text-[#78350F] transition-colors">
              {formatNumeral(stats.totalSites, numeralSystem)}
            </span>
            <span className="text-xs sm:text-sm text-stone-600 mt-1 block font-sans">معلم مسجل بالسجل</span>
          </div>

          <div
            onClick={() => onNavigate('registry', '__filter_verified__')}
            className="bg-white border border-[#E8E2D8] hover:border-emerald-600 p-4 rounded-xl text-center cursor-pointer shadow-xs hover:shadow-md transition-all duration-300 hover:scale-[1.01] group"
            title="استعراض السجلات المحققة والمعتمدة"
          >
            <span className="block text-2xl sm:text-3xl font-serif font-bold text-emerald-800 tabular-nums group-hover:text-emerald-950 transition-colors">
              {formatNumeral(stats.verificationCounts.verified, numeralSystem)}
            </span>
            <span className="text-xs sm:text-sm text-stone-600 mt-1 block font-sans">سجل محقق ومعتمد</span>
          </div>

          <div
            onClick={() => onNavigate('sources')}
            className="bg-white border border-[#E8E2D8] hover:border-amber-800/40 p-4 rounded-xl text-center cursor-pointer shadow-xs hover:shadow-md transition-all duration-300 hover:scale-[1.01] group"
            title="استعراض فهرس المراجع والمصادر"
          >
            <span className="block text-2xl sm:text-3xl font-serif font-bold text-stone-900 tabular-nums group-hover:text-[#78350F] transition-colors">
              {formatNumeral(stats.totalSources, numeralSystem)}
            </span>
            <span className="text-xs sm:text-sm text-stone-600 mt-1 block font-sans">مرجع ودراسة مسندة</span>
          </div>

          <div
            onClick={() => onNavigate('collections')}
            className="bg-white border border-[#E8E2D8] hover:border-amber-800/40 p-4 rounded-xl text-center cursor-pointer shadow-xs hover:shadow-md transition-all duration-300 hover:scale-[1.01] group"
            title="استعراض المجموعات الفوتوغرافية الأرشيفية"
          >
            <span className="block text-2xl sm:text-3xl font-serif font-bold text-stone-900 tabular-nums group-hover:text-[#78350F] transition-colors">
              {formatNumeral(stats.totalImages, numeralSystem)}
            </span>
            <span className="text-xs sm:text-sm text-stone-600 mt-1 block font-sans">لوحة فوتوغرافية مؤرشفة</span>
          </div>
        </div>
      </section>

      {/* 2. Featured Heritage Sites (Museum Plate Cards above 1080p fold) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex items-end justify-between border-b border-stone-200 pb-2.5">
          <div>
            <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
              سجلات مختارة
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              أبرز الشواهد الأثرية في كربلاء
            </h2>
          </div>
          <button
            onClick={() => onNavigate('registry')}
            className="text-xs sm:text-sm font-medium text-[#78350F] hover:text-[#9A3412] inline-flex items-center gap-1 cursor-pointer min-h-[44px] px-2"
          >
            <span>استعراض السجل الكامل ({formatNumeral(stats.totalSites, numeralSystem)})</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {featuredSites.map((site) => {
            const images = archiveDB.getSiteImages(site.id);
            const featuredImg = images.find(img => img.featured) || images[0];
            const isSaved = bookmarkedIds.includes(site.id);

            return (
              <div
                key={site.id}
                onClick={() => onSelectSite(site)}
                className="group bg-white border border-[#E8E2D8] hover:border-amber-800/40 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Plate image container */}
                  <div className="relative aspect-16/10 bg-stone-900 overflow-hidden">
                    {featuredImg ? (
                      <img
                        src={featuredImg.web_url}
                        alt={site.name_ar}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-600 text-xs font-mono">
                        لوحة بانتظار التوثيق
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 bg-black/75 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      {site.permanent_id}
                    </div>

                    {/* Bookmark Toggle */}
                    <button
                      onClick={(e) => handleToggleBookmark(e, site.id)}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center absolute top-1.5 left-1.5 rounded-lg transition-colors cursor-pointer ${
                        isSaved ? 'bg-[#78350F] text-white' : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                      title={isSaved ? 'محفوظ في قائمتك' : 'حفظ في قائمتي'}
                      aria-label={isSaved ? 'محفوظ في قائمتك' : 'حفظ في قائمتي'}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <VerificationBadge status={site.verification_status} size="sm" />
                      <LocationPrecisionBadge precision={site.location_precision} />
                      {site.is_demo && (
                        <span className="text-[10px] text-stone-600 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded font-mono">
                          بيانات تجريبية
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-serif font-bold text-stone-900 group-hover:text-[#78350F] transition-colors leading-snug">
                      {site.name_ar}
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
                      {site.short_description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-[#FBF9F5] border-t border-stone-100 flex items-center justify-between text-xs text-stone-600 font-mono">
                  <span>{formatNumeral(site.source_count, numeralSystem)} مصادر مسندة</span>
                  <span className="text-[#78350F] font-sans font-medium group-hover:underline">
                    تفاصيل السجل ←
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Karbala Museums Section (PART B) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-end justify-between border-b border-stone-200 pb-2.5">
          <div>
            <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
              المتاحف والمعارض التراثية
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              متاحف كربلاء
            </h2>
          </div>
          <button
            onClick={() => onNavigate('museums')}
            className="text-xs sm:text-sm font-medium text-[#78350F] hover:text-[#9A3412] inline-flex items-center gap-1 min-h-[44px] px-2 py-1 cursor-pointer"
          >
            <span>استعراض قسم المتاحف</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {archiveDB.getMuseums(false).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {archiveDB.getMuseums(false).map(museum => (
              <div
                key={museum.id}
                onClick={() => onSelectSite(museum)}
                className="bg-white border border-[#E8E2D8] hover:border-amber-800/40 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#78350F]">{museum.permanent_id}</span>
                  <VerificationBadge status={museum.verification_status} size="sm" />
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900">{museum.name_ar}</h3>
                <p className="text-xs text-stone-600 line-clamp-2">{museum.short_description || 'متحف تراثي موثق'}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Honest Empty-State Card when none is published */
          <div className="bg-[#FAF8F5] border border-dashed border-[#DCD6C9] rounded-xl p-6 sm:p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-[#78350F] flex items-center justify-center mx-auto">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
              يجري توثيق متاحف كربلاء
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
              تخضع سجلات المتاحف التراثية والمعارض في كربلاء لإجراءات التحقيق الميداني والتدقيق المكتبي للمصادر المعتمدة قبل نشرها للعموم بصورة رسمية.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onOpenContributeModal}
                className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] text-xs font-medium text-white bg-[#78350F] hover:bg-[#9A3412] rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                اقترح متحفًا أو وثيقة للتوثيق
              </button>
              <button
                onClick={() => onNavigate('museums')}
                className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors cursor-pointer"
              >
                استعراض فهرس المتاحف ←
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. Interactive Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3.5">
        <div className="flex items-end justify-between border-b border-stone-200 pb-2.5">
          <div>
            <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
              التوزيع المكاني
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              خارطة المواقع والبوادي الكربلائية
            </h2>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="text-xs sm:text-sm font-medium text-[#78350F] hover:text-[#9A3412] inline-flex items-center gap-1 min-h-[44px] px-2 py-1 cursor-pointer"
          >
            <span>فتح الخريطة التفاعلية الكاملة</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <ArchiveMap
          sites={allSites}
          onSelectSite={onSelectSite}
          height="420px"
        />
      </section>

      {/* 5. Taxonomies Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="border-b border-stone-200 pb-2.5">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            التصنيفات المعتمدة
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            تصفح حسب نوع المعلم التاريخي (12 صنفاً)
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {siteTypes.map((type) => {
            const count = stats.typeCounts[type.id] || 0;
            return (
              <div
                key={type.id}
                onClick={() => onNavigate('types', type.slug)}
                className="p-3.5 bg-white border border-[#E8E2D8] rounded-xl hover:border-amber-800/40 hover:bg-[#FBF9F5] shadow-xs hover:shadow-sm transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-stone-900 font-serif">
                    {type.name_ar}
                  </h4>
                  <span className="text-xs font-mono text-stone-600 tabular-nums">
                    {formatNumeral(count, numeralSystem)}
                  </span>
                </div>
                <p className="text-xs text-stone-500 line-clamp-1 leading-relaxed">
                  {type.definition}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Recently Reviewed Records */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3.5">
        <div className="flex items-end justify-between border-b border-stone-200 pb-2.5">
          <div>
            <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
              تحديثات التحرير
            </span>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
              آخر السجلات التي تمت مراجعتها وتدقيقها
            </h2>
          </div>
          <button
            onClick={() => onNavigate('changelog')}
            className="text-xs sm:text-sm font-medium text-[#78350F] hover:text-[#9A3412] cursor-pointer min-h-[44px] flex items-center px-1"
          >
            <span>عرض سجل التعديلات وما استجدّ ←</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentlyReviewed.map(site => (
            <div
              key={site.id}
              onClick={() => onSelectSite(site)}
              className="p-4 bg-white border border-[#E8E2D8] hover:border-amber-800/40 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#78350F] font-bold">
                    {site.permanent_id}
                  </span>
                  <VerificationBadge status={site.verification_status} size="sm" />
                </div>
                <h4 className="text-sm font-bold font-serif text-stone-900">
                  {site.name_ar}
                </h4>
                <p className="text-xs text-stone-600 line-clamp-1">
                  {site.short_description}
                </p>
              </div>

              <div className="text-left shrink-0 text-xs text-stone-500 font-mono space-y-0.5">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>مراجعة: {site.last_reviewed_at}</span>
                </div>
                <span className="text-stone-500 block text-[11px]">{site.verified_by || 'هيئة التحرير'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Community Contribution Callout */}
      <section className="max-w-5xl mx-auto px-4 pb-4">
        <div className="bg-[#EFECE6] border border-[#DCD6C9] rounded p-6 sm:p-8 text-center space-y-3">
          <div className="w-9 h-9 rounded-full bg-[#78350F] text-white flex items-center justify-center mx-auto">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            هل لديك معلومة تاريخية، صورة أرشيفية أو تصويب؟
          </h2>
          <p className="text-xs sm:text-sm text-stone-700 max-w-xl mx-auto leading-relaxed">
            يستقبل الأرشيف مساهمات الباحثين والأهالي والمصورين لتسجيل المعالم وتصويب الروايات.
            تخضع كافة المساهمات للتدقيق المكتبي والمطابقة العلمية قبل اعتمادها في السجل.
          </p>
          <div className="pt-1">
            <button
              onClick={onOpenContributeModal}
              className="px-5 py-2 text-xs sm:text-sm font-medium text-white bg-[#78350F] hover:bg-[#9A3412] rounded transition-colors shadow-xs cursor-pointer"
            >
              تقديم مساهمة أو تصويب بحثي
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
