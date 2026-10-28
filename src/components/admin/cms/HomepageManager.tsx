import React, { useEffect, useState } from 'react';
import { archiveDB } from '../../../db/archiveStore';
import { CmsConfig, CmsHomepage, mergeCmsConfig } from '../../../types/cms';
import { cmsApi } from '../../../services/cmsApi';
import { apiFetch } from '../../../services/apiFetch';
import { inputClass, labelClass, primaryBtn, ghostBtn } from './formStyles';
import { LayoutTemplate, Star, Eye, EyeOff, Save, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  actorName: string;
}

type SiteOption = { id: string; name_ar: string; permanent_id: string; publication_status: string; is_demo: boolean };

export const HomepageManager: React.FC<Props> = ({ actorName }) => {
  const [cms, setCms] = useState<CmsConfig>(() => mergeCmsConfig(archiveDB.getCms()));
  const [homepage, setHomepage] = useState<CmsHomepage>(cms.homepage);
  const [allSites, setAllSites] = useState<SiteOption[]>([]);
  const [featuredSiteIds, setFeaturedSiteIds] = useState<string[]>(cms.featured_site_ids);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      cmsApi.getAdminCms(),
      (async () => {
        const rows: SiteOption[] = [];
        let page = 1;
        let lastPage = 1;
        do {
          const response = await apiFetch(`/api/v1/admin/site-options?per_page=500&page=${page}`, { headers: { Accept: 'application/json' } });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.message || `تعذر تحميل المعالم (${response.status}).`);
          rows.push(...(body.data || []).map((row: any) => ({
            id: String(row.id), name_ar: row.name_ar, permanent_id: row.permanent_id || String(row.id),
            publication_status: row.publication_status, is_demo: Boolean(row.is_demo),
          })));
          lastPage = Number(body.last_page || 1); page += 1;
        } while (page <= lastPage);
        return rows;
      })(),
    ]).then(([config, sites]) => {
      const loaded = mergeCmsConfig(config.cms);
      setCms(loaded); setHomepage(loaded.homepage); setFeaturedSiteIds(loaded.featured_site_ids); setAllSites(sites);
    }).catch(error => setErrorMessage(error instanceof Error ? error.message : 'تعذر تحميل بيانات الصفحة الرئيسية.'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleFeatured = (siteId: string) => {
    setFeaturedSiteIds(prev =>
      prev.includes(siteId) ? prev.filter(id => id !== siteId) : [...prev, siteId]
    );
  };

  const handleMoveOrder = (siteId: string, direction: 'up' | 'down') => {
    setFeaturedSiteIds(prev => {
      const idx = prev.indexOf(siteId);
      if (idx === -1) return prev;
      const copy = [...prev];
      if (direction === 'up' && idx > 0) {
        [copy[idx], copy[idx - 1]] = [copy[idx - 1], copy[idx]];
      } else if (direction === 'down' && idx < copy.length - 1) {
        [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
      }
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErrorMessage(''); setStatusMessage(null);
    try {
      const result = await cmsApi.saveCms({ ...cms, homepage, featured_site_ids: featuredSiteIds });
      const saved = mergeCmsConfig(result.cms);
      archiveDB.updateCms(saved, actorName);
      setCms(saved); setHomepage(saved.homepage); setFeaturedSiteIds(saved.featured_site_ids);
      setStatusMessage(result.message || 'تم حفظ إعدادات الصفحة الرئيسية.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر حفظ إعدادات الصفحة الرئيسية.');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#78350F]">واجهة الزوار</p>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">إدارة الصفحة الرئيسية</h1>
          <p className="text-sm text-stone-600 mt-1">
            التحكم في العناوين والوصف والشريط الإعلاني، وترتيب المعالم الشاخصة البارزة ونموذج البطل ثلاثي الأبعاد.
          </p>
        </div>
        <button type="submit" disabled={loading || saving} className={primaryBtn + ' disabled:opacity-60'}>
          <Save className="w-4 h-4 ml-1.5" />
          حفظ التغييرات
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {loading && <p role="status" className="text-sm text-stone-600">جارٍ تحميل إعدادات الصفحة والمعالم من الخادم…</p>}
      {errorMessage && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{errorMessage}</p>}

      {/* Predefined Hero Section */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 space-y-4">
        <h2 className="font-serif font-bold text-stone-900 text-lg flex items-center gap-2 border-b border-stone-100 pb-2">
          <LayoutTemplate className="w-5 h-5 text-[#78350F]" />
          قسم الترويسة الرئيسية (Hero Section)
        </h2>

        <div>
          <label className={labelClass}>العنوان الرئيسي المقروء (Headline) *</label>
          <input
            className={inputClass}
            value={homepage.headline}
            onChange={e => setHomepage({ ...homepage, headline: e.target.value })}
            required
          />
        </div>

        <div>
          <label className={labelClass}>النص الوصفي التقديمي (Intro Description) *</label>
          <textarea
            className={inputClass}
            rows={3}
            value={homepage.description}
            onChange={e => setHomepage({ ...homepage, description: e.target.value })}
            required
          />
        </div>

        <div>
          <label className={labelClass}>نص تلميح حقل البحث (Search Placeholder)</label>
          <input
            className={inputClass}
            value={homepage.search_placeholder}
            onChange={e => setHomepage({ ...homepage, search_placeholder: e.target.value })}
          />
        </div>
      </div>

      {/* Announcement Bar Settings */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <h2 className="font-serif font-bold text-stone-900 text-lg">شريط الإعلانات والتنبيهات التحريرية</h2>
          <label className="inline-flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={homepage.announcement_active}
              onChange={e => setHomepage({ ...homepage, announcement_active: e.target.checked })}
              className="rounded text-[#78350F] focus:ring-[#78350F]"
            />
            تفعيل الشريط في أعلى الموقع
          </label>
        </div>

        {homepage.announcement_active && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="md:col-span-2">
              <label className={labelClass}>نص الإعلان أو التنويه العلمي</label>
              <input
                className={inputClass}
                value={homepage.announcement_text}
                onChange={e => setHomepage({ ...homepage, announcement_text: e.target.value })}
                placeholder="مثال: تم إطلاق المسح التوثيقي الميداني لخانات طريق القوافل القديم"
              />
            </div>
            <div>
              <label className={labelClass}>نص الرابط</label>
              <input
                className={inputClass}
                value={homepage.announcement_link_text}
                onChange={e => setHomepage({ ...homepage, announcement_link_text: e.target.value })}
                placeholder="تصفح السجل ←"
              />
            </div>
          </div>
        )}
      </div>

      {/* Featured Sites Picker & Ordering */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 space-y-4">
        <h2 className="font-serif font-bold text-stone-900 text-lg flex items-center justify-between border-b border-stone-100 pb-2">
          <span>المعالم البارزة في الصفحة الرئيسية ({featuredSiteIds.length})</span>
          <span className="text-xs font-normal text-stone-500">اختر المعالم ورتّب أسبقيتها</span>
        </h2>

        {/* Ordered Selected List */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-600 mb-2">الترتيب الحالي للمعالم المعروضة:</p>
          {featuredSiteIds.length === 0 ? (
            <p className="text-sm text-stone-400 italic py-2">لم يتم تحديد معالم بارزة حتى الآن.</p>
          ) : (
            featuredSiteIds.map((id, index) => {
              const site = allSites.find(s => s.id === id);
              if (!site) return null;
              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#78350F] text-white flex items-center justify-center text-xs font-mono">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium text-stone-900">{site.name_ar}</span>
                  <span className="text-xs text-stone-500 mr-2 font-mono">({site.permanent_id})</span>
                  {(site.publication_status !== 'published' || site.is_demo) && <span className="mr-2 text-xs text-rose-700">غير مؤهل للنشر</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-stone-200 rounded disabled:opacity-30 cursor-pointer"
                      title="تحريك لأعلى"
                    >
                      <ArrowUp className="w-4 h-4 text-stone-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(id, 'down')}
                      disabled={index === featuredSiteIds.length - 1}
                      className="p-1 hover:bg-stone-200 rounded disabled:opacity-30 cursor-pointer"
                      title="تحريك لأسفل"
                    >
                      <ArrowDown className="w-4 h-4 text-stone-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(id)}
                      className="text-xs text-rose-600 hover:text-rose-800 px-2 py-1 mr-2 cursor-pointer"
                    >
                      إلغاء التمييز
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* All Available Sites to Add */}
        <div className="pt-4 border-t border-stone-200">
          <p className="text-xs font-medium text-stone-600 mb-2">إضافة من بقية سجلات الأرشيف:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
            {allSites
              .filter(s => s.publication_status === 'published' && !s.is_demo && !featuredSiteIds.includes(s.id))
              .map(s => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => handleToggleFeatured(s.id)}
                  className="text-right p-2 text-xs border border-stone-200 rounded-lg hover:border-[#78350F] hover:bg-amber-50/50 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{s.name_ar}</span>
                  <span className="text-[#78350F] font-bold text-sm mr-1">+</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </form>
  );
};
