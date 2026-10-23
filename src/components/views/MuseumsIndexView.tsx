import React, { useState, useMemo } from 'react';
import { Site, OperatorType, VerificationStatus } from '../../types';
import { archiveDB } from '../../db/archiveStore';
import { VerificationBadge, LocationPrecisionBadge } from '../common/VerificationBadge';
import { ArchiveMap } from '../map/ArchiveMap';
import { AuthUser } from '../../services/authService';
import {
  Landmark,
  Grid,
  List,
  Map as MapIcon,
  Search,
  Filter,
  ArrowUpDown,
  Building,
  Clock,
  ExternalLink,
  HelpCircle,
  Shield,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface MuseumsIndexViewProps {
  onSelectSite: (site: Site) => void;
  onNavigate: (tab: string, param?: string) => void;
  currentUser?: AuthUser | null;
}

export const MuseumsIndexView: React.FC<MuseumsIndexViewProps> = ({
  onSelectSite,
  onNavigate,
  currentUser,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperatorType, setSelectedOperatorType] = useState<OperatorType | ''>('');
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState<VerificationStatus | ''>('');
  const [hasVisitingInfoFilter, setHasVisitingInfoFilter] = useState<'all' | 'has_info' | 'no_info'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'newest'>('name');

  const isEditorialUser = currentUser?.role === 'editor' || currentUser?.role === 'admin';

  // Public visitors see published museums only; editorial users can see drafts
  const publishedMuseums = archiveDB.getMuseums(false);
  const allDraftMuseums = archiveDB.getMuseums(true).filter(m => m.publication_status === 'draft');

  const museumsToDisplay = useMemo(() => {
    // Regular public list is published museums only
    let list = [...publishedMuseums];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(m => m.name_ar.toLowerCase().includes(q) || m.name_en.toLowerCase().includes(q) || m.permanent_id.toLowerCase().includes(q));
    }

    if (selectedOperatorType) {
      list = list.filter(m => {
        const profile = archiveDB.getMuseumProfile(m.id);
        return profile?.operator_type === selectedOperatorType;
      });
    }

    if (selectedVerificationStatus) {
      list = list.filter(m => m.verification_status === selectedVerificationStatus);
    }

    if (hasVisitingInfoFilter !== 'all') {
      list = list.filter(m => {
        const profile = archiveDB.getMuseumProfile(m.id);
        const hasInfo = Boolean(profile?.visiting_info && (profile.visiting_info.hours || profile.visiting_info.admission));
        return hasVisitingInfoFilter === 'has_info' ? hasInfo : !hasInfo;
      });
    }

    if (sortBy === 'name') {
      list.sort((a, b) => a.name_ar.localeCompare(b.name_ar, 'ar'));
    } else {
      list.sort((a, b) => b.permanent_id.localeCompare(a.permanent_id));
    }

    return list;
  }, [publishedMuseums, searchQuery, selectedOperatorType, selectedVerificationStatus, hasVisitingInfoFilter, sortBy]);

  // Schema.org structured data (omitting unverified fields)
  const museumJsonLd = useMemo(() => {
    return publishedMuseums
      .filter(m => m.verification_status === 'verified')
      .map(m => {
        const profile = archiveDB.getMuseumProfile(m.id);
        const data: Record<string, any> = {
          '@context': 'https://schema.org',
          '@type': 'Museum',
          name: m.name_ar,
          alternateName: m.name_en,
          identifier: m.permanent_id,
        };
        if (m.location_precision === 'exact' && m.lat && m.lng) {
          data.geo = {
            '@type': 'GeoCoordinates',
            latitude: m.lat,
            longitude: m.lng,
          };
        }
        if (profile?.official_website) {
          data.url = profile.official_website;
        }
        if (profile?.address_text) {
          data.address = {
            '@type': 'PostalAddress',
            streetAddress: profile.address_text,
            addressLocality: 'Karbala',
            addressCountry: 'IQ',
          };
        }
        return data;
      });
  }, [publishedMuseums]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 pb-12">
      {/* Schema.org JSON-LD output for verified museums */}
      {museumJsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(museumJsonLd) }}
        />
      )}

      {/* Header */}
      <div className="border-b border-stone-200 pb-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
              <span className="text-xs font-mono text-[#78350F] font-bold uppercase tracking-wider">
                فهرس المتاحف والمعارض التراثية
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
              متاحف كربلاء
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              سجل المتاحف التخصصية والمعارض التراثية والنفائس والمخطوطات في محافظة كربلاء. يخضع كل بيان لمطابقة الوثائق الرسمية والتحقيق الميداني الصارم.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher with accessible 44px targets */}
            <div className="inline-flex items-center p-1 bg-stone-200/80 rounded-lg border border-stone-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="عرض شبكي"
                aria-label="عرض شبكي"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="عرض قائمة"
                aria-label="عرض قائمة"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                  viewMode === 'map' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="عرض الخريطة"
                aria-label="عرض الخريطة"
              >
                <MapIcon className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-[#F7F4EE] border border-[#EBE6DF] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-stone-600 block">بحث في المتاحف</label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="اسم المتحف..."
                className="w-full bg-white border border-stone-300 rounded-lg py-2 pr-9 pl-3 text-xs text-stone-900 min-h-[44px] focus:outline-none focus:border-[#78350F]"
              />
            </div>
          </div>

          {/* Operator Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-stone-600 block">الجهة المشرفة والتشغيل</label>
            <select
              value={selectedOperatorType}
              onChange={e => setSelectedOperatorType(e.target.value as any)}
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-800 min-h-[44px] focus:outline-none"
            >
              <option value="">جميع الجهات المشرفة</option>
              <option value="shrine_run_endowment">عتبة مقدسة / وقف ديني</option>
              <option value="government">حكومي / وزارة الثقافة والآثار</option>
              <option value="private">خاص / أهلي</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          {/* Verification Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-stone-600 block">حالة التحقيق الأكاديمي</label>
            <select
              value={selectedVerificationStatus}
              onChange={e => setSelectedVerificationStatus(e.target.value as any)}
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-800 min-h-[44px] focus:outline-none"
            >
              <option value="">جميع الحالات</option>
              <option value="verified">محقق ومعتمد</option>
              <option value="partially_verified">محقق جزئياً</option>
              <option value="unverified">غير محقق (قيد التدقيق)</option>
            </select>
          </div>

          {/* Visiting Info Exists */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-stone-600 block">معلومات الزيارة الموثقة</label>
            <select
              value={hasVisitingInfoFilter}
              onChange={e => setHasVisitingInfoFilter(e.target.value as any)}
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-800 min-h-[44px] focus:outline-none"
            >
              <option value="all">الكل</option>
              <option value="has_info">معلومات الزيارة متوفرة</option>
              <option value="no_info">بانتظار توثيق الزيارة</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-600 font-medium">الترتيب:</span>
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1.5 rounded-md min-h-[44px] cursor-pointer ${
                sortBy === 'name' ? 'bg-[#78350F] text-white font-bold' : 'bg-white text-stone-700 border border-stone-300'
              }`}
            >
              هجائياً (أ - ي)
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1.5 rounded-md min-h-[44px] cursor-pointer ${
                sortBy === 'newest' ? 'bg-[#78350F] text-white font-bold' : 'bg-white text-stone-700 border border-stone-300'
              }`}
            >
              الأحدث تسجيلاً
            </button>
          </div>

          <span className="text-stone-500 font-mono">
            المتاحف المنشورة للعموم: <bdi>{publishedMuseums.length}</bdi>
          </span>
        </div>
      </div>

      {/* Main Content: Published Museums or Honest Empty State */}
      {publishedMuseums.length === 0 ? (
        /* Honest empty-state card mandated by Prompt */
        <div className="bg-[#FAF8F5] border-2 border-dashed border-[#DCD6C9] rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-3xl mx-auto my-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-[#78350F] flex items-center justify-center mx-auto shadow-xs">
            <Landmark className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              يجري توثيق متاحف كربلاء
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
              وفقاً لمبادئ الأرشيف والنزاهة المعرفية، لا يتم نشر أي سجل متحفي للعموم إلا بعد التحقيق الميداني الصارم والتثبت من المصادر المعتمدة ومراجعة هيئة التحرير.
            </p>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('registry')}
              className="inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] text-xs sm:text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl transition-colors cursor-pointer"
            >
              استعراض سجل الآثار والمعالم ←
            </button>
          </div>
        </div>
      ) : museumsToDisplay.length === 0 ? (
        <div className="p-8 text-center bg-white border border-stone-200 rounded-xl text-stone-500 text-xs sm:text-sm">
          لا توجد نتائج تطابق معايير التصفية المختارة.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {museumsToDisplay.map(museum => {
            const profile = archiveDB.getMuseumProfile(museum.id);
            return (
              <div
                key={museum.id}
                onClick={() => onSelectSite(museum)}
                className="bg-white border border-[#EBE6DF] hover:border-stone-400 p-5 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#78350F] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <bdi>{museum.permanent_id}</bdi>
                    </span>
                    <VerificationBadge status={museum.verification_status} size="sm" />
                  </div>

                  <h3 className="text-lg font-serif font-bold text-stone-900 hover:text-[#78350F] transition-colors">
                    {museum.name_ar}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2">
                    {museum.short_description || 'متحف تراثي موثق'}
                  </p>

                  <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs text-stone-600 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">الجهة المشرفة:</span>
                      <span className="font-medium text-stone-800">
                        {profile?.operator_name || 'غير موثّق بعد'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">سنة التأسيس:</span>
                      <span className="font-mono text-stone-800">
                        {profile?.founding_year || 'غير موثّق بعد'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-[#78350F] font-semibold">
                  <span>فتح بطاقة المتحف</span>
                  <span>←</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-[#EBE6DF] rounded-xl divide-y divide-stone-100">
          {museumsToDisplay.map(museum => {
            const profile = archiveDB.getMuseumProfile(museum.id);
            return (
              <div
                key={museum.id}
                onClick={() => onSelectSite(museum)}
                className="p-4 sm:p-5 hover:bg-[#FBF9F5] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#78350F] font-bold">
                      <bdi>{museum.permanent_id}</bdi>
                    </span>
                    <VerificationBadge status={museum.verification_status} size="sm" />
                  </div>
                  <h3 className="text-base font-serif font-bold text-stone-900">{museum.name_ar}</h3>
                  <p className="text-xs text-stone-500 font-sans">{museum.name_en}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-stone-600 shrink-0">
                  <span>المشرف: {profile?.operator_name || 'غير موثّق بعد'}</span>
                  <span className="text-[#78350F] font-semibold min-h-[44px] flex items-center">تفاصيل المتحف ←</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <ArchiveMap
            sites={museumsToDisplay}
            onSelectSite={onSelectSite}
            height="500px"
          />
        </div>
      )}

      {/* Editorial Working Section (Visible to authenticated Editors and Admins only) */}
      {isEditorialUser && allDraftMuseums.length > 0 && (
        <div className="mt-12 bg-[#FAF7F2] border border-amber-300 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[#78350F]" />
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900">
                  لوحة مراجعة مسودات المتاحف (خاصة بهيئة التحرير)
                </h3>
                <p className="text-xs text-stone-600">
                  المتاحف التالية مدرجة كمسودات غير معتمدة (<bdi>draft</bdi> / <bdi>unverified</bdi>) استناداً إلى مقترحات صاحب الأرشيف، ولا تظهر للزوار العاديين.
                </p>
              </div>
            </div>
            <span className="bg-[#78350F] text-white text-xs font-mono px-2.5 py-1 rounded-full font-bold">
              {allDraftMuseums.length} مسودة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allDraftMuseums.map(draft => {
              const profile = archiveDB.getMuseumProfile(draft.id);
              return (
                <div
                  key={draft.id}
                  onClick={() => onSelectSite(draft)}
                  className="bg-white border border-stone-300 p-4 rounded-xl space-y-3 cursor-pointer hover:border-[#78350F] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                      <bdi>{draft.permanent_id}</bdi>
                    </span>
                    <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                      مسودة غير محققة
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-serif font-bold text-stone-900">{draft.name_ar}</h4>
                    {draft.alternate_names?.[0] && (
                      <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                        اسم بديل: {draft.alternate_names[0].name}
                      </p>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded border border-stone-200 line-clamp-3">
                    {draft.verification_notes || 'بانتظار التحقق المكتبي والميداني.'}
                  </p>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-[#78350F] font-bold">
                    <span>مراجعة وتدقيق السجل</span>
                    <span>←</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
