import { apiFetch } from '../../../services/apiFetch';
import React, { useMemo, useState } from 'react';
import { Site } from '../../../types';
import { inputClass, labelClass, primaryBtn, ghostBtn, dangerBtn } from './formStyles';

interface Props {
  actorName: string;
  entityId?: string;
  onOpenEntity?: (id?: string) => void;
  onSelectSite?: (site: Site) => void;
}

type Option = { id: string | number; name_ar: string; name_en?: string; slug?: string };
type SiteFormTaxonomies = { siteTypes: Option[]; periods: Option[]; areas: Option[]; province: Option };

const emptyForm = (taxonomies?: SiteFormTaxonomies): Partial<Site> => ({
  name_ar: '',
  name_en: '',
  short_description: '',
  description: '',
  historical_description: '',
  architectural_description: '',
  cultural_significance: '',
  current_condition: '',
  location_description: '',
  site_type_id: taxonomies?.siteTypes[0]?.id ? String(taxonomies.siteTypes[0].id) : '',
  historical_period_id: taxonomies?.periods[0]?.id ? String(taxonomies.periods[0].id) : '',
  area_id: taxonomies?.areas[0]?.id ? String(taxonomies.areas[0].id) : '',
  lat: 32.616,
  lng: 44.0249,
  location_precision: 'approximate',
  publication_status: 'draft',
  verification_status: 'unverified',
  is_demo: false,
  featured: false,
  is_lost_or_vanished: false,
  is_under_research: true,
  ai_assisted: false,
});

export const SitesManager: React.FC<Props> = ({ entityId, onOpenEntity }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [taxonomies, setTaxonomies] = useState<SiteFormTaxonomies | null>(null);
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  React.useEffect(() => {
    let cancelled = false;
    apiFetch('/api/v1/taxonomies', { headers: { Accept: 'application/json' } })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || `تعذر تحميل التصنيفات من قاعدة البيانات (${response.status}).`);
        const province = (body.provinces || []).find((item: any) => item.code === 'KHA');
        const areas = (province?.districts || []).flatMap((district: any) =>
          (district.sub_districts || district.subDistricts || []).flatMap((subDistrict: any) =>
            (subDistrict.areas || []).map((area: any) => ({ ...area, district_name_ar: district.name_ar }))
          )
        );
        const loaded: SiteFormTaxonomies = {
          siteTypes: body.site_types || [],
          periods: body.historical_periods || [],
          areas,
          province,
        };
        if (!loaded.siteTypes.length || !loaded.periods.length || !loaded.areas.length || !province) {
          throw new Error('لا توجد بيانات تصنيف أو مناطق كربلاء في قاعدة البيانات. يلزم تهيئة البيانات المرجعية قبل تسجيل معلم جديد.');
        }
        if (!cancelled) {
          setTaxonomies(loaded);
          setForm(current => ({
            ...current,
            site_type_id: loaded.siteTypes.some(item => String(item.id) === String(current.site_type_id)) ? String(current.site_type_id) : String(loaded.siteTypes[0].id),
            historical_period_id: loaded.periods.some(item => String(item.id) === String(current.historical_period_id)) ? String(current.historical_period_id) : String(loaded.periods[0].id),
            area_id: loaded.areas.some((item: any) => String(item.id) === String(current.area_id)) ? String(current.area_id) : String(loaded.areas[0].id),
          }));
        }
      })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'تعذر تحميل تصنيفات قاعدة البيانات.'); })
      .finally(() => { if (!cancelled) setLoadingTaxonomies(false); });
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    apiFetch('/api/v1/admin/editorial?kind=sites&per_page=50', { headers: { Accept: 'application/json' } })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || `تعذر تحميل المواقع (${response.status}).`);
        setSites(body.data || []);
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : 'تعذر تحميل المواقع.'))
      .finally(() => setLoadingSites(false));
  }, []);
  const [internalEntityId, setInternalEntityId] = useState<string | undefined>(entityId);
  const currentEntityId = entityId !== undefined ? entityId : internalEntityId;

  const openEntity = (id?: string) => {
    setInternalEntityId(id);
    if (id === 'new') setForm(emptyForm(taxonomies || undefined));
    if (onOpenEntity) onOpenEntity(id);
  };

  const editing = currentEntityId === 'new' ? null : sites.find(s => s.id === currentEntityId);
  const isForm = Boolean(currentEntityId);
  const [form, setForm] = useState<Partial<Site>>(editing || emptyForm());
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState('');

  React.useEffect(() => {
    if (entityId === 'new') setForm(emptyForm(taxonomies || undefined));
    else if (editing) {
      const row = editing as any;
      setForm({ ...editing, site_type_id: String(row.site_type_id || ''), historical_period_id: String(row.historical_period_id || ''), area_id: String(row.area_id || ''), lat: Number(row.latitude ?? row.lat ?? 0), lng: Number(row.longitude ?? row.lng ?? 0) });
    }
  }, [entityId, editing?.id, taxonomies]);

  const filtered = useMemo(() => {
    const q = filter.trim();
    if (!q) return sites;
    return sites.filter(
      s => s.name_ar.includes(q) || s.name_en.toLowerCase().includes(q.toLowerCase()) || s.permanent_id.includes(q)
    );
  }, [sites, filter]);

  const set = (key: keyof Site, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const save = async (e: React.FormEvent) => {
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
    }
    setSaving(true); setError('');
    try {
      if (!taxonomies) throw new Error('تعذر تحميل خيارات قاعدة البيانات. أعد تحميل الصفحة أو تواصل مع مسؤول النظام.');
      const payload: Record<string, unknown> = {
        name_ar: form.name_ar, name_en: form.name_en, summary_ar: form.short_description,
        description_ar: form.description, historical_description: form.historical_description,
        architectural_description: form.architectural_description, cultural_significance: form.cultural_significance,
        current_condition: form.current_condition, location_description: form.location_description,
        site_type_id: Number(form.site_type_id), historical_period_id: Number(form.historical_period_id), area_id: Number(form.area_id),
        location_precision: form.location_precision, latitude: form.lat, longitude: form.lng,
        is_demo: form.is_demo, featured: form.featured, ai_assisted: form.ai_assisted,
        is_lost_or_vanished: form.is_lost_or_vanished, is_under_research: form.is_under_research,
      };
      if (!editing) payload.province_id = Number(taxonomies.province.id);
      if (editing) payload.revision_notes = reason.trim();
      const response = await apiFetch(editing ? `/api/v1/admin/sites/${editing.id}` : '/api/v1/admin/sites', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.errors ? Object.values(body.errors).flat().join(' ') : body.message || `تعذر الحفظ (${response.status}).`);
      const saved = { ...body.site } as Site;
      setSites(current => editing ? current.map(site => String(site.id) === String(saved.id) ? saved : site) : [saved, ...current]);
      setForm({ ...form, ...saved, site_type_id: form.site_type_id, historical_period_id: form.historical_period_id, area_id: form.area_id, lat: Number((saved as any).latitude ?? form.lat ?? 0), lng: Number((saved as any).longitude ?? form.lng ?? 0) });
      if (!editing) {
        openEntity(String(saved.id));
      }
      alert(body.message || 'تم حفظ السجل في قاعدة البيانات.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر حفظ السجل.');
    } finally { setSaving(false); }
  };

  if (isForm) {
    return (
      <form onSubmit={save} className="space-y-5 max-w-4xl">
        {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
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
            <select className={inputClass} value={form.site_type_id || ''} disabled={loadingTaxonomies || !taxonomies} onChange={e => set('site_type_id', e.target.value)}>
              {(taxonomies?.siteTypes || []).map(t => (
                <option key={t.id} value={t.id}>{t.name_ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>الحقبة التاريخية</label>
            <select className={inputClass} value={form.historical_period_id || ''} disabled={loadingTaxonomies || !taxonomies} onChange={e => set('historical_period_id', e.target.value)}>
              {(taxonomies?.periods || []).map(t => (
                <option key={t.id} value={t.id}>{t.name_ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>المنطقة</label>
            <select className={inputClass} value={form.area_id || ''} disabled={loadingTaxonomies || !taxonomies} onChange={e => set('area_id', e.target.value)}>
              {(taxonomies?.areas || []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name_ar} · {t.district_name_ar}</option>
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
            <select className={inputClass} value={form.publication_status} disabled>
              <option value="draft">مسودة</option>
              <option value="pending_review">بانتظار المراجعة</option>
              <option value="published">منشور</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>حالة التحقيق</label>
            <select className={inputClass} value={form.verification_status} disabled>
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
          <button type="submit" disabled={saving || loadingTaxonomies || !taxonomies} className={primaryBtn + ' disabled:opacity-60'}>{saving ? 'جارٍ الحفظ…' : 'حفظ السجل'}</button>
          {editing && (
            <button
              type="button"
              className={dangerBtn}
              onClick={async () => {
                if (!confirm('سيتم أرشفة السجل المنشور أو حذف المسودة. المتابعة؟')) return;
                setSaving(true); setError('');
                try {
                  const response = await apiFetch(`/api/v1/admin/sites/${editing.id}`, { method: 'DELETE', headers: { Accept: 'application/json' } });
                  const body = await response.json().catch(() => ({}));
                  if (!response.ok) throw new Error(body.message || `تعذر الأرشفة (${response.status}).`);
                  setSites(current => current.filter(site => String(site.id) !== String(editing.id)));
                  openEntity(undefined);
                  alert(body.message || 'تمت أرشفة السجل.');
                } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر أرشفة السجل.'); }
                finally { setSaving(false); }
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
      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">المواقع الأثرية والتراثية</h1>
          <p className="text-sm text-stone-600 mt-1">{loadingSites ? 'جارٍ تحميل السجلات…' : `${sites.length} سجلاً من قاعدة البيانات.`}</p>
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
            {loadingSites && <tr><td colSpan={4} className="p-5 text-center text-stone-500">جارٍ تحميل السجلات…</td></tr>}
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
            {!loadingSites && filtered.length === 0 && <tr><td colSpan={4} className="p-5 text-center text-stone-500">لا توجد سجلات مطابقة.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
