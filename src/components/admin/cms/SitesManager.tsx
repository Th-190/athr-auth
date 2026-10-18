import React, { useMemo, useState } from 'react';
import { archiveDB } from '../../../db/archiveStore';
import { PublicationStatus, Site, VerificationStatus } from '../../../types';
import { inputClass, labelClass, primaryBtn, ghostBtn, dangerBtn } from './formStyles';

interface Props {
  actorName: string;
  entityId?: string;
  onOpenEntity?: (id?: string) => void;
  onSelectSite?: (site: Site) => void;
}

const emptyForm = (): Partial<Site> => ({
  name_ar: '',
  name_en: '',
  short_description: '',
  description: '',
  historical_description: '',
  architectural_description: '',
  cultural_significance: '',
  current_condition: '',
  location_description: '',
  site_type_id: archiveDB.getSiteTypes()[0]?.id,
  historical_period_id: archiveDB.getHistoricalPeriods()[0]?.id,
  area_id: archiveDB.getAreas()[0]?.id,
  lat: 32.616,
  lng: 44.0249,
  location_precision: 'approximate',
  publication_status: 'draft',
  verification_status: 'unverified',
  is_demo: true,
  featured: false,
  is_lost_or_vanished: false,
  is_under_research: true,
  ai_assisted: false,
});

export const SitesManager: React.FC<Props> = ({ actorName, entityId, onOpenEntity, onSelectSite }) => {
  const [, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  const sites = archiveDB.getAllSites(true);
  const [internalEntityId, setInternalEntityId] = useState<string | undefined>(entityId);
  const currentEntityId = entityId !== undefined ? entityId : internalEntityId;

  const openEntity = (id?: string) => {
    setInternalEntityId(id);
    if (onOpenEntity) onOpenEntity(id);
  };

  const editing = currentEntityId === 'new' ? null : sites.find(s => s.id === currentEntityId);
  const isForm = Boolean(currentEntityId);
  const [form, setForm] = useState<Partial<Site>>(editing || emptyForm());
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState('');

  React.useEffect(() => {
    if (entityId === 'new') setForm(emptyForm());
    else if (editing) setForm(editing);
  }, [entityId]);

  const filtered = useMemo(() => {
    const q = filter.trim();
    if (!q) return sites;
    return sites.filter(
      s => s.name_ar.includes(q) || s.name_en.toLowerCase().includes(q.toLowerCase()) || s.permanent_id.includes(q)
    );
  }, [sites, filter]);

  const set = (key: keyof Site, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name_ar?.trim() || !form.short_description?.trim()) {
      alert('الاسم العربي والوصف المختصر إلزاميان.');
      return;
    }
    if (!form.site_type_id || !form.historical_period_id || !form.area_id) {
      alert('يلزم اختيار النوع والحقبة والمنطقة.');
      return;
    }
    if (editing) {
      if (!reason.trim()) {
        alert('يلزم ذكر سبب التعديل في سجل المراجعة.');
        return;
      }
      archiveDB.updateSite(editing.id, form, reason.trim(), actorName);
    } else {
      const created = archiveDB.createSite(
        {
          ...(form as Site),
          name_ar: form.name_ar!,
          short_description: form.short_description!,
          site_type_id: form.site_type_id!,
          historical_period_id: form.historical_period_id!,
          area_id: form.area_id!,
        },
        actorName
      );
      openEntity(created.id);
    }
    refresh();
    alert('تم حفظ السجل. التغييرات تظهر في الموقع العام بحسب حالة النشر.');
  };

  if (isForm) {
    return (
      <form onSubmit={save} className="space-y-5 max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              {editing ? `تحرير: ${editing.name_ar}` : 'تسجيل معلم جديد'}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              المسودة لا تظهر للزوّار حتى تُنشر. النشر لا يغيّر حالة التحقيق.
            </p>
          </div>
          <button type="button" className={ghostBtn} onClick={() => openEntity(undefined)}>
            العودة للقائمة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-[#E8E2D8] rounded-xl p-5">
          <div>
            <label className={labelClass}>الاسم بالعربية *</label>
            <input className={inputClass} value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>الاسم بالإنجليزية</label>
            <input className={inputClass} value={form.name_en || ''} onChange={e => set('name_en', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>وصف مختصر يظهر في الفهرس *</label>
            <textarea className={inputClass} rows={2} value={form.short_description || ''} onChange={e => set('short_description', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>الوصف التفصيلي</label>
            <textarea className={inputClass} rows={4} value={form.description || ''} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>النوع</label>
            <select className={inputClass} value={form.site_type_id} onChange={e => set('site_type_id', e.target.value)}>
              {archiveDB.getSiteTypes().map(t => (
                <option key={t.id} value={t.id}>{t.name_ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>الحقبة التاريخية</label>
            <select className={inputClass} value={form.historical_period_id} onChange={e => set('historical_period_id', e.target.value)}>
              {archiveDB.getHistoricalPeriods().map(t => (
                <option key={t.id} value={t.id}>{t.name_ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>المنطقة</label>
            <select className={inputClass} value={form.area_id} onChange={e => set('area_id', e.target.value)}>
              {archiveDB.getAreas().map(t => (
                <option key={t.id} value={t.id}>{t.name_ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>دقة الإحداثيات</label>
            <select className={inputClass} value={form.location_precision} onChange={e => set('location_precision', e.target.value)}>
              <option value="exact">دقيقة</option>
              <option value="approximate">تقريبية</option>
              <option value="restricted">محجوبة احترازياً</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>خط العرض</label>
            <input type="number" step="0.0001" className={inputClass} value={form.lat ?? ''} onChange={e => set('lat', parseFloat(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>خط الطول</label>
            <input type="number" step="0.0001" className={inputClass} value={form.lng ?? ''} onChange={e => set('lng', parseFloat(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>حالة النشر</label>
            <select className={inputClass} value={form.publication_status} onChange={e => set('publication_status', e.target.value as PublicationStatus)}>
              <option value="draft">مسودة</option>
              <option value="pending_review">بانتظار المراجعة</option>
              <option value="published">منشور</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>حالة التحقيق</label>
            <select className={inputClass} value={form.verification_status} onChange={e => set('verification_status', e.target.value as VerificationStatus)}>
              <option value="unverified">غير محقّق</option>
              <option value="partially_verified">محقّق جزئياً</option>
              <option value="verified">محقّق</option>
              <option value="disputed">متنازع عليه</option>
              <option value="unknown">غير معلوم</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>الوصف التاريخي</label>
            <textarea className={inputClass} rows={3} value={form.historical_description || ''} onChange={e => set('historical_description', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>الوصف المعماري</label>
            <textarea className={inputClass} rows={3} value={form.architectural_description || ''} onChange={e => set('architectural_description', e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-stone-700 md:col-span-2">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.featured} onChange={e => set('featured', e.target.checked)} /> معلم بارز في الرئيسية</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.is_demo} onChange={e => set('is_demo', e.target.checked)} /> بيانات تجريبية</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.ai_assisted} onChange={e => set('ai_assisted', e.target.checked)} /> مساعَد بالذكاء الاصطناعي</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.is_lost_or_vanished} onChange={e => set('is_lost_or_vanished', e.target.checked)} /> مندثر / مفقود</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.is_under_research} onChange={e => set('is_under_research', e.target.checked)} /> قيد التحقيق</label>
          </div>
          {editing && (
            <div className="md:col-span-2">
              <label className={labelClass}>سبب التعديل (يُحفظ في سجل المراجعة) *</label>
              <input className={inputClass} value={reason} onChange={e => setReason(e.target.value)} placeholder="مثال: استكمال الوصف المعماري من تقرير سومر 1979" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className={primaryBtn}>حفظ السجل</button>
          {editing && (
            <button
              type="button"
              className={dangerBtn}
              onClick={() => {
                if (!confirm('سيتم أرشفة السجل المنشور أو حذف المسودة. المتابعة؟')) return;
                archiveDB.deleteDraftSite(editing.id, actorName);
                openEntity(undefined);
              }}
            >
              أرشفة / حذف
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">المواقع الأثرية والتراثية</h1>
          <p className="text-sm text-stone-600 mt-1">{sites.length} سجلاً في الأرشيف (بما فيها المسودات).</p>
        </div>
        <button className={primaryBtn} onClick={() => openEntity('new')}>تسجيل معلم جديد</button>
      </div>
      <input className={inputClass + ' max-w-md'} placeholder="بحث بالاسم أو الرقم الأرشيفي…" value={filter} onChange={e => setFilter(e.target.value)} />
      <div className="bg-white border border-[#E8E2D8] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F1EA] text-stone-600 text-xs">
            <tr>
              <th className="text-right p-3 font-medium">المعلم</th>
              <th className="text-right p-3 font-medium hidden md:table-cell">النشر</th>
              <th className="text-right p-3 font-medium hidden md:table-cell">التحقيق</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(site => (
              <tr key={site.id} className="border-t border-stone-100">
                <td className="p-3">
                  <div className="font-medium text-stone-900">{site.name_ar}</div>
                  <div className="text-[11px] font-mono text-stone-500">{site.permanent_id}</div>
                </td>
                <td className="p-3 hidden md:table-cell text-xs">{site.publication_status}</td>
                <td className="p-3 hidden md:table-cell text-xs">{site.verification_status}</td>
                <td className="p-3 text-left">
                  <button className={ghostBtn + ' !min-h-0 py-1.5'} onClick={() => openEntity(site.id)}>تحرير</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
