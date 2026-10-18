import React, { useState } from 'react';
import { Site, Source, SiteImage, EncyclopediaEntry, CuratedCollection, HistoricalPeriod } from '../../types';
import { archiveDB } from '../../db/archiveStore';
import { VerificationBadge, LocationPrecisionBadge } from '../common/VerificationBadge';
import {
  BookOpen,
  Calendar,
  Layers,
  MapPin,
  Camera,
  Compass,
  ArrowRight,
  Shield,
  FileText,
  Search,
  ExternalLink,
  Download,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface SupportingViewProps {
  viewType:
    | 'timeline'
    | 'types'
    | 'lost_sites'
    | 'under_research'
    | 'collections'
    | 'gallery'
    | 'sources'
    | 'encyclopedia'
    | 'stats'
    | 'changelog'
    | 'methodology'
    | 'about'
    | 'rights_policy'
    | 'data_policy';
  activeParam?: string;
  onSelectSite: (site: Site) => void;
  onNavigate: (tab: string, param?: string) => void;
}

export const SupportingViews: React.FC<SupportingViewProps> = ({
  viewType,
  activeParam,
  onSelectSite,
  onNavigate,
}) => {
  const allSites = archiveDB.getAllSites(false);
  const periods = archiveDB.getHistoricalPeriods();
  const siteTypes = archiveDB.getSiteTypes();
  const sources = archiveDB.getAllSources();
  const images = archiveDB.getAllImages();
  const encyclopedia = archiveDB.getEncyclopedia();
  const collections = archiveDB.getCollections();
  const stats = archiveDB.getArchiveStatistics();
  const revisions = archiveDB.getAllRevisions();

  // 1. MASTER TIMELINE & PERIODS
  if (viewType === 'timeline') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            التسلسل التاريخي
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            الخط الزمني للحقب التاريخية في كربلاء
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            استعراض المعالم الموثقة عبر العصور المتعاقبة من العصور البابلية والساسانية حتى التراث الحديث.
          </p>
        </div>

        <div className="space-y-12">
          {periods.map((period) => {
            const periodSites = allSites.filter(s => s.historical_period_id === period.id);

            return (
              <div key={period.id} className="relative border-r-2 border-stone-300 mr-2 pr-6 space-y-4">
                <div className="absolute right-[-7px] top-1.5 w-3 h-3 rounded-full bg-[#78350F] border-2 border-white" />

                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono text-xs text-[#78350F] font-bold">
                    <span>{period.start_year}</span>
                    <span>—</span>
                    <span>{period.end_year}</span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-stone-900">
                    {period.name_ar}
                  </h2>
                  <p className="text-xs text-stone-600 max-w-3xl leading-relaxed">
                    {period.description}
                  </p>
                </div>

                {/* Sites in this period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {periodSites.map(site => (
                    <div
                      key={site.id}
                      onClick={() => onSelectSite(site)}
                      className="p-3.5 bg-white border border-[#EBE6DF] rounded hover:border-stone-400 transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-[#78350F] font-bold">
                          {site.permanent_id}
                        </span>
                        <VerificationBadge status={site.verification_status} size="sm" />
                      </div>
                      <h4 className="font-serif font-bold text-stone-900 text-sm">
                        {site.name_ar}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-2">
                        {site.short_description}
                      </p>
                    </div>
                  ))}
                  {periodSites.length === 0 && (
                    <p className="text-xs text-stone-400 italic">لا توجد معالم مسجلة لهذه الحقبة حالياً.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. THE 11 SITE TYPES
  if (viewType === 'types') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            التصنيفات المعمارية
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            أصناف المعالم التراثية والأثرية (11 صنفاً)
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            التعريفات المعيارية المعتمدة في الأرشيف لتصنيف المنشآت والأنماط المعمارية في وادي الرافدين.
          </p>
        </div>

        <div className="space-y-6">
          {siteTypes.map((type) => {
            const typeSites = allSites.filter(s => s.site_type_id === type.id);

            return (
              <div key={type.id} className="bg-white border border-[#EBE6DF] rounded p-6 space-y-4">
                <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-stone-900">
                      {type.name_ar} <span className="text-xs font-sans text-stone-500 font-normal">({type.name_en})</span>
                    </h2>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {type.definition}
                    </p>
                  </div>
                  <span className="font-mono text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded">
                    {typeSites.length} معالم
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {typeSites.map(site => (
                    <div
                      key={site.id}
                      onClick={() => onSelectSite(site)}
                      className="p-3 bg-[#FBF9F5] border border-stone-200 rounded hover:border-stone-400 cursor-pointer space-y-1 text-xs"
                    >
                      <span className="font-mono text-[10px] text-[#78350F] font-bold block">
                        {site.permanent_id}
                      </span>
                      <h4 className="font-serif font-bold text-stone-900 truncate">
                        {site.name_ar}
                      </h4>
                      <p className="text-stone-500 line-clamp-1">{site.short_description}</p>
                    </div>
                  ))}
                  {typeSites.length === 0 && (
                    <p className="text-xs text-stone-400 italic">لا توجد معالم مسجلة تحت هذا الصنف بعد.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. LOST & VANISHED SITES (المواقع المندثرة والمفقودة)
  if (viewType === 'lost_sites') {
    const lostSites = allSites.filter(s => s.is_lost_or_vanished);

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            الذاكرة المعمارية المفقودة
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            سجل المواقع المندثرة والمفقودة
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            معالم تاريخية شيدت في كربلاء واندثرت مادياً بسبب الزلازل أو الحروب أو التوسع العمراني، موثقة عبر الخرائط القديمة والصور الأرشيفية.
          </p>
        </div>

        <div className="space-y-4">
          {lostSites.map(site => (
            <div
              key={site.id}
              onClick={() => onSelectSite(site)}
              className="p-5 bg-white border border-[#EBE6DF] rounded hover:border-stone-400 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#78350F] font-bold">{site.permanent_id}</span>
                  <span className="text-xs text-stone-700 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded">
                    معلم مندثر
                  </span>
                  <VerificationBadge status={site.verification_status} size="sm" />
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {site.name_ar}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                  {site.description}
                </p>
              </div>

              <div className="shrink-0 text-left text-xs text-[#78350F] font-medium">
                عرض السجل الأرشيفي ←
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. SITES UNDER RESEARCH (مواقع قيد التحقيق)
  if (viewType === 'under_research') {
    const researchSites = allSites.filter(s => s.is_under_research);

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            المسح الميداني
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            مواقع قيد التحقيق والمراجعة الميدانية
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            شواهد وتلول ومستوطنات صحراوية رُصدت حديثاً بالمسح الاستطلاعي وتنتظر استكمال التنقيب وإسناد الوثائق التاريخية.
          </p>
        </div>

        <div className="space-y-4">
          {researchSites.map(site => (
            <div
              key={site.id}
              onClick={() => onSelectSite(site)}
              className="p-5 bg-white border border-[#EBE6DF] rounded hover:border-stone-400 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#78350F] font-bold">{site.permanent_id}</span>
                  <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    قيد التحقيق المكتبي
                  </span>
                  <LocationPrecisionBadge precision={site.location_precision} />
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {site.name_ar}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                  {site.short_description}
                </p>
              </div>

              <div className="shrink-0 text-left text-xs text-[#78350F] font-medium">
                فحص السجل والاستكشاف ←
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. CURATED COLLECTIONS
  if (viewType === 'collections') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            الملفات التحريرية
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            المجموعات التوثيقية المختارة
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            مجموعات موضوعية أعدتها هيئة التحرير لربط المعالم المتقاربة وظيفياً وجغرافياً.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map(col => (
            <div
              key={col.id}
              className="bg-white border border-[#EBE6DF] rounded overflow-hidden shadow-2xs space-y-3 p-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="aspect-16/10 bg-stone-900 rounded overflow-hidden">
                  <img
                    src={col.cover_image}
                    alt={col.title_ar}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-base font-serif font-bold text-stone-900">
                  {col.title_ar}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {col.description_ar}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-mono">
                <span>{col.site_ids.length} مواقع موثقة</span>
                <button
                  onClick={() => onNavigate('registry')}
                  className="text-[#78350F] font-sans font-medium hover:underline"
                >
                  استعراض السجلات ←
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. PHOTO ARCHIVE (أرشيف الصور الشامل)
  if (viewType === 'gallery') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            المتحف البصري
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            أرشيف الصور واللوحات التوثيقية
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            مستودع اللوحات الفوتوغرافية والمخططات المعمارية لمعالم كربلاء، مصنفة بحسب المصور وسنة الالتقاط وحالة الحقوق.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, idx) => {
            const site = allSites.find(s => s.id === img.site_id);

            return (
              <div
                key={img.id}
                onClick={() => site && onSelectSite(site)}
                className="group bg-white border border-[#EBE6DF] rounded overflow-hidden shadow-2xs hover:border-stone-400 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-16/10 bg-stone-950 overflow-hidden">
                    <img
                      src={img.web_url}
                      alt={img.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      لوحة #{idx + 1}
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <span className="text-[11px] font-mono text-[#78350F] block">
                      {site?.name_ar}
                    </span>
                    <h3 className="text-sm font-bold font-serif text-stone-900 leading-snug">
                      {img.title}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {img.caption}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#FBF9F5] border-t border-stone-100 text-[11px] text-stone-500 font-mono flex items-center justify-between">
                  <span>المصور: {img.photographer}</span>
                  <span>{img.date_taken}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 7. SOURCES BIBLIOGRAPHY (فهرس المصادر والمراجع)
  if (viewType === 'sources') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            الببليوغرافيا
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            فهرس المصادر والمراجع والدراسات المعتمدة
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            الكتب، الأبحاث المحكمة، السجلات الرسمية، وتقارير التنقيب الآثاري التي يستند إليها الأرشيف.
          </p>
        </div>

        <div className="space-y-4">
          {sources.map(src => (
            <div
              key={src.id}
              className="p-5 bg-white border border-[#EBE6DF] rounded space-y-2 text-xs shadow-2xs"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-serif font-bold text-stone-900">
                  {src.title}
                </h3>
                <span className="font-mono text-[10px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  {src.source_type}
                </span>
              </div>

              <p className="text-stone-700">
                <span className="font-semibold text-stone-900">المؤلف / الباحث:</span> {src.author} ({src.year})
                {src.publisher && <span> · الناشر: {src.publisher}</span>}
              </p>

              {src.archive_reference && (
                <p className="text-stone-500 font-mono text-[11px]">
                  المرجع الأرشيفي: {src.archive_reference} · {src.page_reference}
                </p>
              )}

              {src.excerpt && (
                <p className="text-stone-600 bg-[#FBF9F5] p-3 rounded border border-stone-150 italic font-serif leading-relaxed">
                  «{src.excerpt}»
                </p>
              )}

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>مستوى الموثوقية الأكاديمية: {src.reliability_level === 'high' ? 'عالية (دراسة تأسيسية)' : 'معاينة حقلية'}</span>
                <span className="text-stone-400">لغة المصدر: {src.language}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 8. ENCYCLOPEDIA (المعجم الموسوعي للمصطلحات)
  if (viewType === 'encyclopedia') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            المفاهيم والمصطلحات
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            معجم العمارة والآثار في كربلاء
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            شرح المفردات المعمارية الرافدينية والإسلامية، الأعلام، والأماكن التاريخية الواردة في السجلات.
          </p>
        </div>

        <div className="space-y-6">
          {encyclopedia.map(entry => (
            <div key={entry.id} className="bg-white border border-[#EBE6DF] rounded p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {entry.term_ar} <span className="text-xs font-sans text-stone-500 font-normal">({entry.term_en})</span>
                </h3>
                <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  {entry.category}
                </span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                {entry.full_text}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 9. ARCHIVE IN NUMBERS (الأرشيف في أرقام)
  if (viewType === 'stats') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            البيانات المفتوحة
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            الأرشيف في أرقام وإحصاءات
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            إحصاءات مباشرة محسوبة في الوقت الفعلي من قاعدة البيانات العلائقية لأثر كربلاء.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 p-5 rounded text-center space-y-1">
            <span className="text-3xl font-serif font-bold text-stone-900 tabular-nums">{stats.totalSites}</span>
            <span className="text-xs text-stone-500 block">إجمالي المعالم</span>
          </div>
          <div className="bg-white border border-stone-200 p-5 rounded text-center space-y-1">
            <span className="text-3xl font-serif font-bold text-emerald-800 tabular-nums">{stats.verificationCounts.verified}</span>
            <span className="text-xs text-stone-500 block">معالم محققة مسندة</span>
          </div>
          <div className="bg-white border border-stone-200 p-5 rounded text-center space-y-1">
            <span className="text-3xl font-serif font-bold text-stone-900 tabular-nums">{stats.totalSources}</span>
            <span className="text-xs text-stone-500 block">دراسات ومراجع</span>
          </div>
          <div className="bg-white border border-stone-200 p-5 rounded text-center space-y-1">
            <span className="text-3xl font-serif font-bold text-stone-900 tabular-nums">{stats.totalImages}</span>
            <span className="text-xs text-stone-500 block">لوحات مصورة</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded p-6 space-y-4">
          <h3 className="text-base font-serif font-bold text-stone-900">
            توزيع السجلات بحسب حالة التحقيق والإسناد العلمي
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-[#EFECE6] rounded border border-stone-300">
              <span className="font-bold text-stone-900 block">محقَّق ومسنَد: {stats.verificationCounts.verified}</span>
              <span className="text-[11px] text-stone-600 mt-1 block">استوفى المعاينة ومطابقة المصادر</span>
            </div>
            <div className="p-3 bg-amber-50 rounded border border-amber-200">
              <span className="font-bold text-amber-900 block">محقَّق جزئياً: {stats.verificationCounts.partially_verified}</span>
              <span className="text-[11px] text-stone-600 mt-1 block">توجد عناصر قيد التدقيق</span>
            </div>
            <div className="p-3 bg-stone-50 rounded border border-stone-200">
              <span className="font-bold text-stone-700 block">غير محقَّق: {stats.verificationCounts.unverified}</span>
              <span className="text-[11px] text-stone-600 mt-1 block">مسودة أولية أو تل غير منقب</span>
            </div>
            <div className="p-3 bg-rose-50 rounded border border-rose-200">
              <span className="font-bold text-rose-900 block">محل خلاف: {stats.verificationCounts.disputed}</span>
              <span className="text-[11px] text-stone-600 mt-1 block">روايات تاريخية متنافسة</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 10. CHANGELOG (ما استجدّ في التوثيق)
  if (viewType === 'changelog') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            الشفافية التحريرية
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            سجل التعديلات وما استجدّ في التوثيق
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            سجل علني مشتق من حركات المراجعة يعكس التحديثات الجوهرية على المعالم دون كشف بيانات سرية.
          </p>
        </div>

        <div className="space-y-4">
          {revisions.map(rev => (
            <div key={rev.id} className="p-4 bg-white border border-[#EBE6DF] rounded text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-stone-900 text-sm">
                  {rev.site_name}
                </span>
                <span className="font-mono text-stone-500 text-[11px]">{rev.changed_at}</span>
              </div>
              <p className="text-stone-700">
                تعديل حقل <span className="font-mono text-[#78350F]">{rev.changed_field}</span>: {rev.reason}
              </p>
              <div className="pt-1 text-[11px] text-stone-500 font-mono">
                المحرر المسؤول: {rev.changed_by} · الحالة حينها: {rev.verification_status_at_time}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 11. METHODOLOGY & ETHICS (منهجية التحقيق وسياسة الذكاء الاصطناعي)
  if (viewType === 'methodology') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-8 leading-relaxed text-stone-800 text-xs sm:text-sm">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            الميثاق المعرفي
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            منهجية التوثيق وسياسة النشر والتحقيق
          </h1>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            1. مبدأ استقلال حالة التحقيق عن حالة النشر
          </h2>
          <p className="text-stone-700">
            في أرشيف «أثر كربلاء»، تُفصل حالة النشر (مسودة، قيد المراجعة، منشور، مؤرشف) فصلاً باتاً عن حالة التحقيق (محقّق، محقّق جزئياً، غير محقّق، محل خلاف). لا تعني صفة «منشور» أن المعلومة مقطوع بصحتها، بل إن كل سجل يحمل علامة تحقيق مستقلة ومبررة بالمسوغ العلمي.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            2. سياسة الذكاء الاصطناعي الصارمة
          </h2>
          <p className="text-stone-700">
            يُحظر منعاً باتاً تفويض نماذج الذكاء الاصطناعي بأي سلطة نشر أو توثيق أو اختلاق مصادر أو تواريخ أو أسماء. أي محتوى يُستعان فيه بالذكاء الاصطناعي (مثل المعالجة اللغوية للمسوحات) يُوسم وجوباً بـ <code className="bg-stone-150 px-1 font-mono">ai_assisted</code> ولا ينتقل إلى صفة «محقّق» إلا بعد مراجعة نقدية بشرية من باحث أو محرر معتمد.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            3. التعامل مع الخلافات التاريخية
          </h2>
          <p className="text-stone-700">
            لا يتبنى الأرشيف رأياً مدرسياً أو طائفياً في المسائل التاريخية الخلافية (مثل تأريخ بناء حصن الأخيضر بين العصرين الساساني والعباسي). بل تُعرض الروايات المتنافسة جنباً إلى جنب مع مراجعها ومحققيها، مع بيان الرأي الأرجح أكاديمياً دون شطب الروايات الأخرى.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            4. حماية المواقع الأثرية الحساسة
          </h2>
          <p className="text-stone-700">
            المواقع والتلال الأثرية غير المنقبة أو المعرضة لخطر النبش العشوائي تُحجب إحداثياتها الدقيقة وجوباً من الاستجابات العامة (<code className="bg-stone-150 px-1 font-mono">restricted</code>)، وتُعرض للجمهور بإحداثيات تقريبية عامة لحماية التراث الوطني من التعديات.
          </p>
        </section>
      </div>
    );
  }

  // 12. ABOUT (عن الأرشيف)
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-8 leading-relaxed text-stone-800 text-xs sm:text-sm">
      <div className="border-b border-stone-200 pb-4">
        <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
          الهوية والرسالة
        </span>
        <h1 className="text-3xl font-serif font-bold text-stone-900">
          عن أرشيف أثر كربلاء
        </h1>
      </div>

      <div className="space-y-4 text-stone-700">
        <p>
          «أثر كربلاء» هو أرشيف رقمي توثيقي مستقل للمواقع الأثرية، التاريخية، والتراثية في محافظة كربلاء، العراق. أُنشئ لسد الفجوة الرقمية في توثيق التراث المادي للفرات الأوسط والبادية الغربية، وتقديم منصة معرفية رصينة ومفتوحة للباحثين والمؤرخين والجمهور العام.
        </p>
        <p>
          لا يدعي الأرشيف تمثيل جهة حكومية رسمية، ولكنه يلتزم بأعلى معايير التوثيق الأكاديمي الدولي، ومطابقة البيانات مع نشرات الهيئة العامة للآثار والتراث العراقية ومصادر رواد علم الآثار في بلاد الرافدين.
        </p>
      </div>

      <div className="bg-[#F7F4EE] border border-[#EBE6DF] p-6 rounded space-y-3">
        <h3 className="text-base font-serif font-bold text-stone-900">
          هيئة التحرير واللجان العلمية
        </h3>
        <p className="text-xs text-stone-600">
          تتولى الإشراف والمراجعة لجنة مستقلة من الباحثين في تاريخ العمارة الإسلامية، الآثار القديمة، وتوثيق التراث المائي والبيئي في العراق.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate('registry')}
            className="px-4 py-2 bg-[#78350F] text-white text-xs rounded"
          >
            تصفح سجل المواقع الشامل
          </button>
        </div>
      </div>
    </div>
  );
};
