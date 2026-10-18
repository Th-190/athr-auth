import React, { useState } from 'react';
import { Site, Source } from '../../types';
import { archiveDB } from '../../db/archiveStore';
import { VerificationBadge, LocationPrecisionBadge } from '../common/VerificationBadge';
import { ArchiveMap } from '../map/ArchiveMap';
import { MuseumGallery } from '../gallery/MuseumGallery';
import { CiteModal } from '../common/CiteModal';
import { ReportModal } from '../common/ReportModal';
import { calculateDistanceKm } from '../../utils/arabic';
import {
  Printer,
  Quote,
  AlertTriangle,
  Share2,
  BookOpen,
  Calendar,
  MapPin,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  FileText,
  Landmark,
} from 'lucide-react';

interface SiteDetailViewProps {
  site: Site;
  onBack: () => void;
  onSelectSite: (site: Site) => void;
  onNavigate: (tab: string, param?: string) => void;
}

export const SiteDetailView: React.FC<SiteDetailViewProps> = ({
  site,
  onBack,
  onSelectSite,
  onNavigate,
}) => {
  const [isCiteModalOpen, setIsCiteModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    name: string;
    type: 'site' | 'image';
  } | null>(null);

  const images = archiveDB.getSiteImages(site.id);
  const featuredImg = images.find(img => img.featured) || images[0];
  const claims = archiveDB.getSiteClaims(site.id);
  const timeline = archiveDB.getSiteTimeline(site.id);
  const allSites = archiveDB.getAllSites(false);

  // Find area, type, period
  const area = archiveDB.getAreas().find(a => a.id === site.area_id);
  const siteType = archiveDB.getSiteTypes().find(t => t.id === site.site_type_id);
  const period = archiveDB.getHistoricalPeriods().find(p => p.id === site.historical_period_id);

  // All sources linked
  const allSources = archiveDB.getAllSources();
  const museumProfile = site.site_type_id === 'type_museums' ? archiveDB.getMuseumProfile(site.id) : undefined;
  const siteRelations = archiveDB.getSiteRelations(site.id);
  const visitingSource = museumProfile?.visiting_info_source_id ? allSources.find(s => s.id === museumProfile.visiting_info_source_id) : undefined;

  // Find nearby sites using spatial distance
  const nearbySites = allSites
    .filter(s => s.id !== site.id && (s.lat !== 0 || s.lng !== 0))
    .map(s => ({
      site: s,
      distanceKm: calculateDistanceKm(site.lat, site.lng, s.lat, s.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(archiveDB.isBookmarked(site.id));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('تم نسخ الرابط الدائم للسجل إلى الحافظة');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `أثر كربلاء: ${site.name_ar} (${site.permanent_id})`,
          text: site.short_description,
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or fallback
      }
    }
    handleCopyLink();
  };

  const handleToggleBookmark = () => {
    const nextState = archiveDB.toggleBookmark(site.id);
    setIsBookmarked(nextState);
    showToast(nextState ? 'تمت إضافة السجل إلى قائمتك التوثيقية' : 'تمت إزالة السجل من قائمتك');
  };

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-8 space-y-10 pb-16">
      {/* Schema.org Museum structured data with only verified fields */}
      {site.site_type_id === 'type_museums' && site.verification_status === 'verified' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Museum',
              name: site.name_ar,
              alternateName: site.name_en,
              identifier: site.permanent_id,
              ...(museumProfile?.official_website ? { url: museumProfile.official_website } : {}),
              ...(museumProfile?.address_text ? { address: { '@type': 'PostalAddress', streetAddress: museumProfile.address_text } } : {}),
              ...(site.location_precision === 'exact' && site.lat && site.lng ? { geo: { '@type': 'GeoCoordinates', latitude: site.lat, longitude: site.lng } } : {})
            })
          }}
        />
      )}

      {/* In-App Accessible Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1C1917] text-[#FBF9F5] px-4 py-2.5 rounded-lg shadow-xl text-xs sm:text-sm font-medium border border-stone-700 flex items-center gap-2 max-w-[90vw]"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Navigation & Record Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3.5 no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-[44px] text-xs sm:text-sm font-medium text-stone-700 hover:text-stone-900 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى سجل المواقع</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs rounded-lg border transition-colors cursor-pointer ${
              isBookmarked
                ? 'bg-[#78350F] text-white border-[#78350F] font-bold shadow-2xs'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
            title={isBookmarked ? 'إزالة من قائمتي' : 'حفظ في قائمتي للدراسة'}
          >
            <span>{isBookmarked ? 'محفوظ بقائمتي' : 'حفظ في قائمتي'}</span>
          </button>

          {/* Cite button */}
          <button
            onClick={() => setIsCiteModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5 text-[#78350F]" />
            <span>اقتبس السجل</span>
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة الرابط</span>
          </button>

          {/* Report Issue shortcut */}
          <button
            onClick={() => setReportTarget({ id: site.id, name: site.name_ar, type: 'site' })}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[44px] text-xs text-stone-600 hover:text-amber-800 transition-colors cursor-pointer"
            title="الإبلاغ عن تصويب أو خطأ في هذا السجل"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>إبلاغ عن تصحيح</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Presentation: Title, Accession Number, & Featured Plate */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-[#78350F] bg-[#F5F2EB] border border-[#E7E2D6] px-2.5 py-1 rounded">
              <bdi>{site.permanent_id}</bdi>
            </span>
            <VerificationBadge status={site.verification_status} size="md" />
            <LocationPrecisionBadge precision={site.location_precision} />
            {site.is_demo && (
              <span className="text-[11px] text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">
                بيانات تجريبية
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight">
            {site.name_ar}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-sans">
            <span className="text-stone-700 font-medium">{site.name_en}</span>
            {site.alternate_names.length > 0 && (
              <>
                <span>·</span>
                <span>الأسماء البديلة: {site.alternate_names.map(an => an.name).join('، ')}</span>
              </>
            )}
          </div>
        </div>

        {/* Featured Museum Plate Presentation */}
        {featuredImg && (
          <div className="bg-white border border-[#EBE6DF] rounded overflow-hidden shadow-2xs">
            <div className="relative aspect-16/9 bg-stone-950 overflow-hidden">
              <img
                src={featuredImg.web_url}
                alt={site.name_ar}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/80 text-white text-xs px-2.5 py-1 rounded font-mono">
                لوحة توثيقية رئيسية · أثر كربلاء
              </div>
            </div>

            <div className="p-4 bg-[#FBF9F5] border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-600 gap-2">
              <p className="font-serif italic text-stone-800">
                {featuredImg.caption}
              </p>
              <div className="flex items-center gap-3 text-stone-500 text-[11px] shrink-0 font-mono">
                <span>المصور: {featuredImg.photographer}</span>
                <span>·</span>
                <span>الترخيص: {featuredImg.rights_status}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Archival Transparency & Verification Panel */}
      <section className="bg-[#F7F4EE] border border-[#EBE6DF] rounded p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#78350F]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 font-serif">
              لوحة الشفافية والتحقيق المعرفي
            </h3>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            حالة النشر: {site.publication_status === 'published' ? 'منشور للعموم' : 'مسودة قيد المراجعة'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-stone-500 block mb-0.5">حالة التحقيق العلمي:</span>
            <VerificationBadge status={site.verification_status} size="sm" showDescription />
          </div>

          <div>
            <span className="text-stone-500 block mb-0.5">آخر مراجعة وتدقيق:</span>
            <span className="font-mono text-stone-800 block">{site.last_reviewed_at}</span>
            <span className="text-[11px] text-stone-500 block">
              المدقق: {site.verified_by || 'لجنة التحرير الأكاديمية'}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block mb-0.5">عدد المصادر المسندة:</span>
            <span className="font-mono text-stone-800 font-bold block">{site.source_count} مصادر معتمدة</span>
            <span className="text-[11px] text-stone-500 block">
              {site.location_precision === 'restricted' ? 'الإحداثيات محجوبة احترازياً' : 'موقع جغرافي مصادق عليه'}
            </span>
          </div>
        </div>

        {site.verification_notes && (
          <div className="pt-2 border-t border-stone-200 text-xs text-stone-700 bg-white/60 p-2.5 rounded border border-stone-200">
            <span className="font-bold text-stone-900 ml-1">ملاحظات هيئة التحقيق:</span>
            <span>{site.verification_notes}</span>
          </div>
        )}

        {/* Auto-generated Open Graph Share Card Preview (Phase 4 Feature 4) */}
        <div className="mt-4 bg-[#1C1917] text-[#FBF9F5] p-4 rounded border border-stone-800 shadow-xs space-y-2 no-print">
          <div className="flex items-center justify-between text-[11px] text-[#D6CEBE]">
            <span className="font-mono text-amber-400 font-medium">بطاقة المشاركة الرقمية المعتمدة (Open Graph Preview)</span>
            <span className="font-mono text-stone-400">{site.permanent_id}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="space-y-0.5">
              <span className="text-xs text-amber-300 font-serif block">
                {siteType?.name_ar || 'معلم أثري'} · {period?.name_ar || 'تراث كربلاء'}
              </span>
              <h4 className="text-lg font-serif font-bold text-white">
                {site.name_ar}
              </h4>
              <p className="text-xs text-stone-300 line-clamp-1 max-w-lg">
                {site.short_description}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 bg-stone-900/90 px-3 py-1.5 rounded border border-stone-700">
              <div className="w-6 h-6 rounded bg-[#78350F] text-white flex items-center justify-center font-serif text-xs font-bold">
                أ
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-white block">أثر كربلاء</span>
                <span className="text-[9px] text-stone-400 font-mono block">karbalaheritage.iq</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Museum Information Panel (PART B) */}
      {site.site_type_id === 'type_museums' && (
        <section className="bg-white border-2 border-[#78350F]/20 rounded-xl p-5 sm:p-7 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-3.5 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-[#78350F] flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900">
                  لوحة التوثيق المتحفي والمعلومات الميدانية
                </h2>
                <p className="text-xs text-stone-500 font-sans">
                  بيانات الجهة المشرفة، الموقع، ضوابط الزيارة، وسجل المطابقة المعتمد
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-xs font-mono bg-amber-50 text-[#78350F] px-2.5 py-1 rounded border border-amber-200 font-semibold">
              سجل متحفي
            </span>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
            {/* Operator */}
            <div className="space-y-1 bg-[#FAF8F5] p-3.5 rounded-lg border border-stone-200">
              <span className="text-stone-500 font-medium block text-xs">الجهة المشرفة والتشغيل:</span>
              <div className="font-serif font-bold text-stone-900 text-base">
                {museumProfile?.operator_name || 'غير موثّق بعد'}
              </div>
              <span className="text-xs text-stone-600 block">
                {museumProfile?.operator_type === 'shrine_run_endowment'
                  ? 'عتبة مقدسة / وقف ديني'
                  : museumProfile?.operator_type === 'government'
                  ? 'حكومي / وزارة الثقافة والآثار'
                  : museumProfile?.operator_type === 'private'
                  ? 'خاص / أهلي'
                  : museumProfile?.operator_type === 'other'
                  ? 'أخرى'
                  : 'نوع التشغيل: غير موثّق بعد'}
              </span>
            </div>

            {/* Official Website */}
            <div className="space-y-1 bg-[#FAF8F5] p-3.5 rounded-lg border border-stone-200">
              <span className="text-stone-500 font-medium block text-xs">الموقع الرسمي / منصة النشر:</span>
              {museumProfile?.official_website ? (
                <a
                  href={museumProfile.official_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#78350F] hover:underline font-mono text-xs font-medium break-all min-h-[44px]"
                >
                  <bdi>{museumProfile.official_website}</bdi>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              ) : (
                <span className="text-stone-500 font-mono text-xs block py-2">غير موثّق بعد</span>
              )}
            </div>

            {/* Address & Complex Relation («يقع داخل») */}
            <div className="space-y-1 bg-[#FAF8F5] p-3.5 rounded-lg border border-stone-200">
              <span className="text-stone-500 font-medium block text-xs">العنوان والموقع المكاني:</span>
              <div className="text-stone-800">
                {museumProfile?.address_text || 'غير موثّق بعد'}
              </div>
              {siteRelations.map(rel => (
                <div key={rel.id} className="mt-2 text-xs text-[#78350F] bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                  <span className="font-bold">{rel.relation_label_ar}</span>
                  {rel.editor_notes && <span className="text-stone-600 block text-[11px] mt-0.5">{rel.editor_notes}</span>}
                </div>
              ))}
            </div>

            {/* Founding Year */}
            <div className="space-y-1 bg-[#FAF8F5] p-3.5 rounded-lg border border-stone-200">
              <span className="text-stone-500 font-medium block text-xs">سنة التأسيس:</span>
              <div className="font-mono text-stone-800 font-bold text-base">
                {museumProfile?.founding_year ? (
                  <span>
                    <bdi>{museumProfile.founding_year}</bdi>
                    {museumProfile.founding_year_precision && (
                      <span className="text-stone-500 text-xs font-sans mr-2">
                        ({museumProfile.founding_year_precision === 'exact' ? 'دقيقة' : 'تقريبية'})
                      </span>
                    )}
                  </span>
                ) : (
                  'غير موثّق بعد'
                )}
              </div>
            </div>

            {/* Collection Summary */}
            <div className="md:col-span-2 space-y-1 bg-[#FAF8F5] p-3.5 rounded-lg border border-stone-200">
              <span className="text-stone-500 font-medium block text-xs">ملخص المقتنيات والمعروضات:</span>
              <p className="text-stone-800 leading-relaxed text-xs sm:text-sm">
                {museumProfile?.collection_summary || 'غير موثّق بعد'}
              </p>
            </div>

            {/* Accessibility Notes */}
            <div className="md:col-span-2 space-y-1 bg-[#FAF8F5] p-3.5 rounded-lg border border-stone-200">
              <span className="text-stone-500 font-medium block text-xs">تسهيلات الوصول وذوي الإعاقة:</span>
              <p className="text-stone-800 text-xs sm:text-sm">
                {museumProfile?.accessibility_notes || 'غير موثّق بعد'}
              </p>
            </div>
          </div>

          {/* Visiting Info Box with Mandatory Notice */}
          <div className="bg-[#FFFBEB] border border-amber-300 rounded-xl p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
              <Clock className="w-4 h-4 text-amber-800" />
              <span>أوقات وضوابط الزيارة الميدانية</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-amber-950">
              <div>
                <span className="text-amber-800 block font-medium mb-0.5">ساعات الزيارة:</span>
                <span className="font-medium">{museumProfile?.visiting_info?.hours || 'غير موثّق بعد'}</span>
              </div>
              <div>
                <span className="text-amber-800 block font-medium mb-0.5">رسوم الدخول:</span>
                <span className="font-medium">{museumProfile?.visiting_info?.admission || 'غير موثّق بعد'}</span>
              </div>
              <div>
                <span className="text-amber-800 block font-medium mb-0.5">ضوابط الزيارة:</span>
                <span className="font-medium">{museumProfile?.visiting_info?.rules || 'غير موثّق بعد'}</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-amber-900 gap-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span>آخر تحقق: {museumProfile?.visit_info_verified_at || 'غير موثّق بعد'}</span>
                {visitingSource && (
                  <span className="text-amber-800">
                    (المصدر: {visitingSource.title})
                  </span>
                )}
              </div>
              {/* MANDATORY WARNING NOTE */}
              <div className="text-xs font-bold text-amber-950 bg-amber-200/80 px-3 py-1.5 rounded-lg border border-amber-300 inline-block self-start sm:self-auto">
                تحقق من أوقات الزيارة لدى المتحف مباشرة
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Core Archival Narrative & Technical Descriptions */}
      <section className="space-y-8">
        {/* Definition & Abstract */}
        <div className="space-y-2">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            الوصف العام والموقع
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed max-w-prose">
            {site.description}
          </p>
          <div className="pt-1 text-xs text-stone-600 font-serif">
            <span className="font-bold text-stone-800 ml-1">التوصيف المكاني:</span>
            <span>{site.location_description}</span>
          </div>
        </div>

        {/* Architectural Analysis */}
        <div className="space-y-2">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            التحقيق المعماري والإنشائي
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed max-w-prose">
            {site.architectural_description}
          </p>
        </div>

        {/* Historical Chronology */}
        <div className="space-y-2">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            التحقيق التاريخي ومراحل التشييد
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed max-w-prose">
            {site.historical_description}
          </p>
        </div>

        {/* The Three Significance Aspects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FFFFFF] border border-[#EBE6DF] p-6 rounded">
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              الأهمية الثقافية والرمزية
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {site.cultural_significance}
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              الأهمية التاريخية والأثرية
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {site.historical_significance}
            </p>
          </div>
        </div>

        {/* Current Condition */}
        <div className="p-4 bg-stone-50 border border-stone-200 rounded space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 font-serif">
            الحالة الراهنة وتحديات الحفظ الإنشائي
          </h3>
          <p className="text-xs text-stone-700 leading-relaxed">
            {site.current_condition}
          </p>
        </div>
      </section>

      {/* 5. Scholarly Claims & Competing Variants (Prompt 4: Never pick one automatically!) */}
      {claims.length > 0 && (
        <section className="space-y-4 border-t border-stone-200 pt-8">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-stone-900">
              الدعاوى التاريخية والروايات الأكاديمية
            </h2>
            <p className="text-xs text-stone-500">
              يعرض الأرشيف الآراء العلمية المتنافسة بإنصاف مع أدلتها ومصادرها دون تبنٍ غير محقق
            </p>
          </div>

          <div className="space-y-4">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white border border-[#EBE6DF] rounded p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#78350F] font-serif">
                    مسألة: {claim.claim_text}
                  </span>
                  {claim.is_disputed ? (
                    <span className="text-[11px] font-medium text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      روايات متنافسة
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      رأي مستقر
                    </span>
                  )}
                </div>

                {claim.variants && claim.variants.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {claim.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="p-3 bg-[#FBF9F5] border border-stone-200 rounded text-xs space-y-2"
                      >
                        <h4 className="font-bold text-stone-900 font-serif">
                          {variant.scholar_or_school}
                        </h4>
                        <p className="text-stone-700 leading-relaxed">
                          {variant.account_text}
                        </p>
                        <div className="pt-1 text-[11px] text-stone-500 font-mono">
                          المراجع: {variant.source_ids.join('، ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Timeline of Milestones */}
      {timeline.length > 0 && (
        <section className="space-y-4 border-t border-stone-200 pt-8">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            الخط الزمني للمحطات التاريخية
          </h2>

          <div className="relative border-r-2 border-stone-200 mr-2 space-y-6">
            {timeline.map((event) => (
              <div key={event.id} className="relative pr-6">
                <div className="absolute right-[-7px] top-1 w-3 h-3 rounded-full bg-[#78350F] border-2 border-white" />
                <span className="text-xs font-mono font-bold text-[#78350F]">
                  {event.year}
                </span>
                <h4 className="text-sm font-bold text-stone-900 font-serif mt-0.5">
                  {event.title}
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  {event.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Per-Site Museum Photo Gallery (Prompt 13) */}
      <section className="border-t border-stone-200 pt-8">
        <MuseumGallery
          images={images}
          siteName={site.name_ar}
          onOpenReportModal={(imgId, imgTitle) =>
            setReportTarget({ id: imgId, name: imgTitle, type: 'image' })
          }
        />
      </section>

      {/* 8. Map & Location Spatial Safety */}
      <section className="space-y-4 border-t border-stone-200 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              الموقع الطوبوغرافي على الخارطة
            </h2>
            <p className="text-xs text-stone-500">
              {site.location_precision === 'restricted'
                ? 'تنبيه: الإحداثيات المعروضة عامة لحماية التلول الأثرية من أعمال النبش.'
                : 'إحداثيات مساحية معتمدة وفق النظام الجغرافي WGS84.'}
            </p>
          </div>
          <LocationPrecisionBadge precision={site.location_precision} />
        </div>

        <ArchiveMap
          sites={[site]}
          selectedSiteId={site.id}
          onSelectSite={() => {}}
          height="380px"
          center={[site.lat, site.lng]}
          zoom={12}
        />
      </section>

      {/* 9. Sources Bibliography Cards */}
      <section className="space-y-4 border-t border-stone-200 pt-8">
        <div className="space-y-1">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            فهرس المصادر والمراجع المعتمدة
          </h2>
          <p className="text-xs text-stone-500">
            المراجع الأكاديمية والوثائق التي استند إليها هذا السجل في إثبات المعالم والتواريخ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allSources.slice(0, site.source_count || 2).map((source) => (
            <div
              key={source.id}
              className="bg-white border border-[#EBE6DF] rounded p-4 text-xs space-y-2 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-serif font-bold text-stone-900 leading-snug">
                  {source.title}
                </h4>
                <span className="shrink-0 text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                  {source.source_type}
                </span>
              </div>

              <p className="text-stone-700">
                <span className="font-semibold">{source.author}</span> ({source.year})
                {source.publisher && <span>، {source.publisher}</span>}
              </p>

              {source.page_reference && (
                <p className="text-stone-500 font-mono text-[11px]">
                  موضع الإحالة: {source.page_reference}
                </p>
              )}

              {source.excerpt && (
                <p className="text-stone-600 bg-[#FBF9F5] p-2 rounded border border-stone-150 italic font-serif leading-relaxed">
                  «{source.excerpt}»
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 10. Nearby & Related Sites */}
      {nearbySites.length > 0 && (
        <section className="space-y-4 border-t border-stone-200 pt-8 no-print">
          <h2 className="text-lg font-serif font-bold text-stone-900">
            معالم مجاورة في المحيط الجغرافي
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {nearbySites.map(({ site: nearby, distanceKm }) => (
              <div
                key={nearby.id}
                onClick={() => onSelectSite(nearby)}
                className="p-3.5 bg-white border border-[#EBE6DF] rounded hover:border-stone-400 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                  <span>{nearby.permanent_id}</span>
                  <span>يبعد قرابة {distanceKm} كم</span>
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-sm">
                  {nearby.name_ar}
                </h4>
                <p className="text-xs text-stone-600 line-clamp-2">
                  {nearby.short_description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      {isCiteModalOpen && (
        <CiteModal
          siteName={site.name_ar}
          permanentId={site.permanent_id}
          lastReviewed={site.last_reviewed_at}
          onClose={() => setIsCiteModalOpen(false)}
        />
      )}

      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetName={reportTarget.name}
          onClose={() => setReportTarget(null)}
        />
      )}
    </article>
  );
};
