import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../../../services/authService';

type Choice = { id: number; name_ar?: string; name_en?: string; title?: string; slug?: string };
type Citation = { source_id: number; page_reference?: string; excerpt?: string; editor_note?: string; relevance?: string };
type RecordRow = Record<string, any> & { id: number; publication_status: string; verification_status: string };
type Filters = { museums: Choice[]; sites: Choice[]; periods: Choice[]; categories: Choice[]; artifact_categories: Choice[]; sources: Choice[]; statuses: { publication: string[]; verification: string[] } };

const API = '/api/v1/admin/editorial';
const request = async (path: string, init: RequestInit = {}) => {
  const token = authService.getToken();
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validation = body.errors ? Object.values(body.errors).flat().join(' ') : '';
    throw new Error(validation || body.message || `تعذر تنفيذ الطلب (${response.status}).`);
  }
  return body;
};

const label = (row: RecordRow, kind: string) => kind === 'sites' ? `${row.name_ar} · ${row.name_en || row.slug || ''}` : `${row.title_ar} · ${row.title_en || ''}`;
const value = (record: RecordRow | null, key: string) => record?.[key] == null ? '' : String(record[key]);

export const HeritageEditorialManager: React.FC = () => {
  const [kind, setKind] = useState<'sites' | 'artifacts'>('sites');
  const [filters, setFilters] = useState<Filters | null>(null);
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState({ museum_id: '', site_id: '', category: '', historical_period_id: '', status: '' });
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const loadFilters = useCallback(async () => setFilters(await request('/filters')), []);
  const loadRows = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const params = new URLSearchParams({ kind, page: String(page), per_page: '20' });
      if (query.trim()) params.set('q', query.trim());
      Object.entries(filter).forEach(([key, v]) => { if (v) params.set(key, v); });
      const result = await request(`/?${params}`);
      setRows(result.data || []); setLastPage(result.last_page || 1);
      if (selected) {
        const fresh = (result.data || []).find((item: RecordRow) => item.id === selected.id);
        if (fresh) setSelected(fresh);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر تحميل السجلات.'); }
    finally { setBusy(false); }
  }, [kind, page, query, filter, selected?.id]);

  useEffect(() => { loadFilters().catch(e => setError(e.message || 'تعذر تحميل المرشحات.')); }, [loadFilters]);
  useEffect(() => { void loadRows(); }, [loadRows]);
  useEffect(() => {
    if (!selected) { setCitations([]); return; }
    const attached = selected.sources || (selected.source ? [selected.source] : []);
    setCitations(attached.map((source: any) => ({ source_id: Number(source.id), page_reference: source.pivot?.page_reference || '', excerpt: source.pivot?.excerpt || '', editor_note: source.pivot?.editor_note || '', relevance: source.pivot?.relevance || 'direct' })));
    setRevisionNotes('');
  }, [selected?.id, kind]);

  const museums = useMemo(() => filters?.museums || [], [filters]);
  const selectedName = (item: Choice) => item.name_ar || item.title || String(item.id);
  const editFields = kind === 'sites'
    ? [['name_ar','الاسم بالعربية'],['name_en','الاسم بالإنجليزية'],['short_description','الملخص'],['description','الوصف بالعربية'],['description_en','الوصف بالإنجليزية'],['historical_description','السياق التاريخي بالعربية'],['historical_description_en','السياق التاريخي بالإنجليزية'],['architectural_description','الوصف المعماري'],['architectural_description_en','الوصف المعماري بالإنجليزية'],['current_condition','الحالة الراهنة'],['current_condition_en','الحالة الراهنة بالإنجليزية'],['location_description','وصف الموقع'],['location_description_en','وصف الموقع بالإنجليزية'],['approximate_date','التاريخ التقريبي'],['heritage_designation','صفة التسجيل/التصنيف'],['heritage_designation_url','رابط التصنيف'],['designation_year','سنة التصنيف']]
    : [['title_ar','اسم المقتنى بالعربية'],['title_en','اسم المقتنى بالإنجليزية'],['description','الوصف بالعربية'],['description_en','الوصف بالإنجليزية'],['category','الفئة'],['material','المادة'],['estimated_date','التاريخ التقديري'],['origin','المنشأ'],['archaeological_context','السياق التاريخي/الأثري']];

  const save = async () => {
    if (!selected) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const form = document.getElementById('heritage-editor-form') as HTMLFormElement;
      const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
      data.revision_notes = revisionNotes;
      data.citations = citations as any;
      const response = await request(`/${kind}/${selected.id}`, { method: 'PUT', body: JSON.stringify(data) });
      setNotice(response.message || 'تم الحفظ.'); setSelected(response.record); await loadRows();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل حفظ التعديلات.'); }
    finally { setSaving(false); }
  };

  const decide = async (action: string) => {
    if (!selected) return;
    const reason = window.prompt('أدخل سبب القرار التحريري (5 أحرف على الأقل):');
    if (!reason) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await request(`/${kind}/${selected.id}/decision`, { method: 'POST', body: JSON.stringify({ action, reason }) });
      setSelected(response.record); setNotice(response.message || 'تم تسجيل القرار.'); await loadRows();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل تسجيل القرار.'); }
    finally { setSaving(false); }
  };

  const updateRights = async (image: Record<string, any>) => {
    const approved = window.confirm('تأكيد اعتماد حقوق هذه الصورة وإتاحتها كمشتق عام؟ لا توافق إلا مع وجود إذن موثق.');
    const body = approved ? { visibility: true } : { visibility: false };
    try { await request(`/images/${image.id}/rights`, { method: 'PUT', body: JSON.stringify(body) }); setNotice(approved ? 'أُرسلت الصورة للمعالجة بعد اعتماد الحقوق.' : 'أُلغيت إتاحة الصورة.' ); await loadRows(); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر تحديث حقوق الصورة.'); }
  };

  return <section className="space-y-5" dir="rtl">
    <header><h1 className="text-2xl font-serif font-bold">تحرير المواقع والمقتنيات</h1><p className="mt-1 text-sm text-stone-600">تعديلات وقرارات مرتبطة مباشرة بسجلات الأرشيف وسجل المراجعة.</p></header>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:grid-cols-3">
      <select className="rounded-lg border p-2" value={kind} onChange={e => { setKind(e.target.value as any); setSelected(null); setPage(1); }}><option value="sites">المواقع والمعالم</option><option value="artifacts">مقتنيات المتاحف</option></select>
      <input className="rounded-lg border p-2" placeholder="بحث بالاسم أو السجل" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
      <select className="rounded-lg border p-2" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}><option value="">كل حالات المراجعة</option>{[...(filters?.statuses.publication || []), ...(filters?.statuses.verification || [])].map(s => <option key={s}>{s}</option>)}</select>
      <select className="rounded-lg border p-2" value={filter.museum_id} onChange={e => setFilter({ ...filter, museum_id: e.target.value })}><option value="">كل المتاحف</option>{museums.map(m => <option key={m.id} value={m.id}>{selectedName(m)}</option>)}</select>
      <select className="rounded-lg border p-2" value={filter.site_id} onChange={e => setFilter({ ...filter, site_id: e.target.value })}><option value="">كل المواقع</option>{(filters?.sites || []).map(site => <option key={site.id} value={site.id}>{selectedName(site)}</option>)}</select>
      <select className="rounded-lg border p-2" value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })}><option value="">كل الفئات</option>{(kind === 'sites' ? filters?.categories || [] : filters?.artifact_categories || []).map(c => <option key={c.id} value={kind === 'sites' ? c.slug : c.id}>{selectedName(c)}</option>)}</select>
      <select className="rounded-lg border p-2" value={filter.historical_period_id} onChange={e => setFilter({ ...filter, historical_period_id: e.target.value })}><option value="">كل الحقب</option>{(filters?.periods || []).map(p => <option key={p.id} value={p.id}>{selectedName(p)}</option>)}</select>
    </div>
    <div className="grid gap-5 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)]">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="border-b p-4 font-semibold">السجلات {busy && <span className="text-xs text-stone-500">جارٍ التحميل…</span>}</div>
        {!busy && rows.length === 0 ? <p className="p-6 text-sm text-stone-500">لا توجد سجلات مطابقة.</p> : <ul className="divide-y">{rows.map(row => <li key={row.id}><button className={`w-full p-4 text-right hover:bg-amber-50 ${selected?.id === row.id ? 'bg-amber-50' : ''}`} onClick={() => setSelected(row)}><span className="block font-medium">{label(row, kind)}</span><span className="mt-1 block text-xs text-stone-500">{row.publication_status} · {row.verification_status}</span></button></li>)}</ul>}
        <div className="flex items-center justify-between border-t p-3 text-sm"><button disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>السابق</button><span>{page} / {lastPage}</span><button disabled={page >= lastPage || busy} onClick={() => setPage(page + 1)}>التالي</button></div>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
        {!selected ? <p className="py-12 text-center text-sm text-stone-500">اختر سجلاً لعرضه وتحريره.</p> : <>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{label(selected, kind)}</h2><p className="mt-1 text-xs text-stone-500">الحالة: {selected.publication_status} · التحقق: {selected.verification_status}</p></div><div className="flex flex-wrap gap-2">{[['approve','اعتماد'],['return','إعادة للتصحيح'],['reject','رفض'],['publish','نشر'],['unpublish','إلغاء النشر'],['archive','أرشفة']].map(([action,text]) => <button key={action} disabled={saving} onClick={() => void decide(action)} className="rounded-lg border border-stone-300 px-3 py-2 text-xs hover:bg-stone-100 disabled:opacity-50">{text}</button>)}</div></div>
          <form id="heritage-editor-form" onSubmit={e => { e.preventDefault(); void save(); }} className="grid gap-3 md:grid-cols-2">{editFields.map(([field,title]) => <label key={field} className="space-y-1 text-sm"><span>{title}</span>{['description','description_en','historical_description','historical_description_en','architectural_description','architectural_description_en','current_condition','current_condition_en','location_description','location_description_en','archaeological_context'].includes(field) ? <textarea name={field} defaultValue={value(selected,field)} rows={3} className="w-full rounded-lg border p-2" /> : <input name={field} defaultValue={value(selected,field)} className="w-full rounded-lg border p-2" />}</label>)}
            {kind === 'sites' && <label className="space-y-1 text-sm"><span>دقة الموقع</span><select name="location_precision" defaultValue={selected.location_precision || 'unknown'} className="w-full rounded-lg border p-2">{['exact','approximate','restricted','unknown'].map(s => <option key={s}>{s}</option>)}</select></label>}
          </form>
          <div className="mt-5 border-t pt-4"><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">المصادر والاستشهادات</h3><button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => setCitations([...citations, { source_id: Number(filters?.sources[0]?.id || 0), relevance: 'direct' }])}>إضافة مصدر</button></div>
            {citations.map((citation,index) => <div key={`${index}-${citation.source_id}`} className="mb-2 grid gap-2 rounded-xl bg-stone-50 p-3 md:grid-cols-[1fr_1fr_1fr_auto]"><select className="rounded border p-2" value={citation.source_id} onChange={e => setCitations(citations.map((c,i) => i === index ? {...c,source_id:Number(e.target.value)} : c))}>{(filters?.sources || []).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select><input aria-label="رقم الصفحة" placeholder="الصفحة" value={citation.page_reference || ''} onChange={e => setCitations(citations.map((c,i) => i === index ? {...c,page_reference:e.target.value} : c))} className="rounded border p-2"/><input aria-label="ملاحظة المحرر" placeholder="ملاحظة المحرر" value={citation.editor_note || ''} onChange={e => setCitations(citations.map((c,i) => i === index ? {...c,editor_note:e.target.value} : c))} className="rounded border p-2"/><button type="button" onClick={() => setCitations(citations.filter((_,i) => i !== index))} className="text-rose-700">حذف</button></div>)}
          </div>
          {kind === 'sites' && selected.images?.length > 0 && <div className="mt-5 border-t pt-4"><h3 className="mb-2 font-semibold">حقوق الصور</h3>{selected.images.map((image: any) => <div key={image.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm"><span>صورة #{image.id} · الحقوق: {image.rights_status} · {image.visibility ? 'ظاهرة' : 'مخفية'}</span><button type="button" disabled={saving} onClick={() => void updateRights(image)} className="rounded border px-3 py-1">{image.visibility ? 'إلغاء الإتاحة' : 'مراجعة وإتاحة'}</button></div>)}</div>}
          <div className="mt-5 grid gap-3 border-t pt-4"><label className="space-y-1 text-sm"><span>سبب التعديل (إلزامي لسجل المراجعة)</span><textarea value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)} minLength={5} maxLength={1000} rows={2} className="w-full rounded-lg border p-2" /></label><button form="heritage-editor-form" disabled={saving || revisionNotes.trim().length < 5 || citations.length === 0} className="rounded-xl bg-[#78350F] px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}</button></div>
        </>}
      </div>
    </div>
  </section>;
};
