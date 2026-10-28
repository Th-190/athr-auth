import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../../services/apiFetch';
import { Area, EncyclopediaEntry, HistoricalPeriod, SiteType, Source, SourceType, Tag } from '../../../types';
import { inputClass, labelClass, primaryBtn, ghostBtn, dangerBtn } from './formStyles';
import { EditableSuggestionInput } from '../../common/EditableSuggestionInput';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u0621-\u064A]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function requestApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validation = body.errors && Object.values(body.errors).flat().join(' ');
    throw new Error(validation || body.message || `تعذر إتمام العملية (${response.status}).`);
  }
  return body as T;
}

export const EncyclopediaManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [entries, setEntries] = useState<EncyclopediaEntry[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<EncyclopediaEntry | null>(null);
  const [form, setForm] = useState<Partial<EncyclopediaEntry>>({
    term_ar: '',
    term_en: '',
    category: 'architecture',
    short_summary: '',
    full_text: '',
    related_site_ids: [],
    source_ids: [],
  });

  const loadEntries = async () => {
    const result = await requestApi<{ data: any[] }>('/api/v1/admin/encyclopedia?per_page=100');
    setEntries((result.data || []).map(row => ({
      id: String(row.id), slug: row.slug, term_ar: row.term_ar, term_en: row.term_en || '',
      category: row.category, short_summary: row.short_summary, full_text: row.full_text,
      related_site_ids: (row.sites || []).map((site: any) => String(site.id)),
      source_ids: (row.sources || []).map((source: any) => String(source.id)),
    })));
  };

  useEffect(() => {
    void loadEntries().catch(reason => setError(reason instanceof Error ? reason.message : 'تعذر تحميل مواد المعجم من الخادم.'))
      .finally(() => setBusy(false));
  }, []);

  const startNew = () => {
    setEditing(null);
    setForm({
      term_ar: '',
      term_en: '',
      category: 'architecture',
      short_summary: '',
      full_text: '',
      related_site_ids: [],
      source_ids: [],
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.term_ar?.trim() || !form.full_text?.trim()) {
      alert('المصطلح العربي والنص الكامل إلزاميان.');
      return;
    }
    setBusy(true); setError('');
    try {
      const payload = {
      term_ar: form.term_ar,
      term_en: form.term_en || '',
      category: (form.category as EncyclopediaEntry['category']) || 'architecture',
      short_summary: form.short_summary || form.full_text.slice(0, 180),
      full_text: form.full_text,
      related_site_ids: (form.related_site_ids || []).map(Number).filter(Number.isFinite),
      source_ids: (form.source_ids || []).map(Number).filter(Number.isFinite),
      };
      const result = await requestApi<{ message: string; entry: any }>(editing ? `/api/v1/admin/encyclopedia/${editing.id}` : '/api/v1/admin/encyclopedia', {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload),
      });
      const saved: EncyclopediaEntry = {
        id: String(result.entry.id), slug: result.entry.slug, term_ar: result.entry.term_ar,
        term_en: result.entry.term_en || '', category: result.entry.category,
        short_summary: result.entry.short_summary, full_text: result.entry.full_text,
        related_site_ids: (result.entry.sites || []).map((site: any) => String(site.id)),
        source_ids: (result.entry.sources || []).map((source: any) => String(source.id)),
      };
      setEntries(current => editing ? current.map(item => item.id === saved.id ? saved : item) : [saved, ...current]);
      setEditing(saved); setForm(saved);
      alert(result.message || 'حُفظت المسودة في قاعدة البيانات.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر حفظ المادة في قاعدة البيانات.');
    } finally { setBusy(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold">المقالات والمعجم</h1>
          <button className={ghostBtn} onClick={startNew}>مادة جديدة</button>
        </div>
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <div className="bg-white border border-[#E8E2D8] rounded-xl divide-y max-h-[70vh] overflow-auto">
          {busy && <p className="p-3 text-sm text-stone-500">جارٍ تحميل المواد من قاعدة البيانات…</p>}
          {entries.map(e => (
            <button key={e.id} onClick={() => { setEditing(e); setForm(e); }} className="w-full text-right p-3 hover:bg-stone-50 cursor-pointer">
              <div className="font-medium text-stone-900">{e.term_ar}</div>
              <div className="text-[11px] text-stone-500">{e.category}</div>
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={save} className="lg:col-span-3 space-y-3 bg-white border border-[#E8E2D8] rounded-xl p-5">
        <div>
          <label className={labelClass}>المصطلح بالعربية *</label>
          <input className={inputClass} value={form.term_ar || ''} onChange={e => setForm({ ...form, term_ar: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>المصطلح بالإنجليزية</label>
          <input className={inputClass} value={form.term_en || ''} onChange={e => setForm({ ...form, term_en: e.target.value })} />
        </div>
        <div>
          <EditableSuggestionInput
            label="التصنيف الموضوعي"
            value={
              form.category === 'architecture' ? 'عمارة وتخطيط' :
              form.category === 'historical_event' ? 'حدث تاريخي' :
              form.category === 'person' ? 'علم / شخصية تاريخية' :
              form.category === 'geography' ? 'جغرافيا ومواقع' :
              form.category === 'dynasty' ? 'دولة / سلالة حاكمة' :
              form.category || ''
            }
            onChange={val => {
              const map: Record<string, EncyclopediaEntry['category']> = {
                'عمارة وتخطيط': 'architecture',
                'عمارة': 'architecture',
                'حدث تاريخي': 'historical_event',
                'علم / شخصية تاريخية': 'person',
                'علم': 'person',
                'جغرافيا ومواقع': 'geography',
                'جغرافيا': 'geography',
                'دولة / سلالة حاكمة': 'dynasty',
                'سلالة': 'dynasty',
              };
              setForm({ ...form, category: map[val] || (val as any) });
            }}
            suggestions={[
              { id: 'architecture', label: 'عمارة وتخطيط', subLabel: 'مساجد، خانات، مدارس، أسوار' },
              { id: 'historical_event', label: 'حدث تاريخي', subLabel: 'وقائع ومعارك وتحولات كبرى' },
              { id: 'person', label: 'علم / شخصية تاريخية', subLabel: 'علماء، رحالة، ولاة، معماريون' },
              { id: 'geography', label: 'جغرافيا ومواقع', subLabel: 'أنهار، تلال، بوادي، طرق قديمة' },
              { id: 'dynasty', label: 'دولة / سلالة حاكمة', subLabel: 'دول وخلافات وسلالات تاريخية' },
              { id: 'archaeology', label: 'آثار ومكتشفات', subLabel: 'لقى، مسكوكات، تنقيبات' },
              { id: 'manuscripts', label: 'مخطوطات ووثائق', subLabel: 'وقفيات، فرمانات، سجلات' },
            ]}
            placeholder="اختر أو اكتب تصنيف المادة..."
          />
        </div>
        <div>
          <label className={labelClass}>ملخص</label>
          <textarea className={inputClass} rows={2} value={form.short_summary || ''} onChange={e => setForm({ ...form, short_summary: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>النص الكامل *</label>
          <textarea className={inputClass} rows={8} value={form.full_text || ''} onChange={e => setForm({ ...form, full_text: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button className={primaryBtn} type="submit" disabled={busy}>حفظ المسودة</button>
          {editing && (
            <button type="button" className={dangerBtn} disabled={busy} onClick={async () => {
              if (!confirm('حذف هذه المادة من المعجم العام؟')) return;
              setBusy(true); setError('');
              try {
                const result = await requestApi<{ message: string }>(`/api/v1/admin/encyclopedia/${editing.id}`, { method: 'DELETE' });
                setEntries(current => current.filter(item => item.id !== editing.id)); startNew();
                alert(result.message || 'تم حذف المادة من قاعدة البيانات.');
              } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حذف المادة من قاعدة البيانات.'); }
              finally { setBusy(false); }
            }}>حذف</button>
          )}
        </div>
      </form>
    </div>
  );
};

const SOURCE_TYPES: SourceType[] = [
  'book', 'academic_paper', 'document', 'archive', 'official_site', 'government_record',
  'field_source', 'interview', 'historical_photo', 'map', 'press', 'other',
];

export const SourcesManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Source | null>(null);

  const loadSources = async () => {
    const result = await requestApi<{ data: any[] }>('/api/v1/admin/sources?per_page=100');
    setSources((result.data || []).map(source => ({ ...source, id: String(source.id), year: source.year || '', language: source.language || 'ar' })));
  };

  useEffect(() => {
    void loadSources().catch(reason => setError(reason instanceof Error ? reason.message : 'تعذر تحميل المصادر من الخادم.'))
      .finally(() => setBusy(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.title.trim() || !form.author.trim()) {
      alert('العنوان والمؤلف إلزاميان.');
      return;
    }
    setBusy(true); setError('');
    try {
      const creating = !/^\d+$/.test(form.id);
      const payload = {
        source_type: form.source_type, title: form.title, author: form.author,
        publisher: form.publisher || null, year: form.year || null, url: form.url || null,
        isbn: form.isbn || null, archive_reference: form.archive_reference || null,
        page_reference: form.page_reference || null, excerpt: form.excerpt || null,
        language: form.language || 'ar',
        reliability_level: form.reliability_level, reliability_notes: form.reliability_notes || null,
      };
      const result = await requestApi<{ message: string; source: Source }>(creating ? '/api/v1/admin/sources' : `/api/v1/admin/sources/${form.id}`, {
        method: creating ? 'POST' : 'PUT', body: JSON.stringify(payload),
      });
      const saved = { ...result.source, id: String(result.source.id) };
      setSources(current => creating ? [saved, ...current] : current.map(item => item.id === saved.id ? saved : item));
      setForm(saved);
      alert(result.message || 'تم حفظ المصدر في قاعدة البيانات.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر حفظ المصدر في قاعدة البيانات.');
    } finally { setBusy(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold">المصادر والمراجع</h1>
          <button className={ghostBtn} onClick={() => setForm({
            id: '',
            source_type: 'book',
            title: '',
            author: '',
            reliability_level: 'medium',
            language: 'ar',
          })}>مرجع جديد</button>
        </div>
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <div className="bg-white border border-[#E8E2D8] rounded-xl divide-y max-h-[70vh] overflow-auto">
          {busy && <p className="p-3 text-sm text-stone-500">جارٍ تحميل المصادر من قاعدة البيانات…</p>}
          {sources.map(s => (
            <button key={s.id} onClick={() => setForm(s)} className="w-full text-right p-3 hover:bg-stone-50 cursor-pointer">
              <div className="font-medium text-stone-900">{s.title}</div>
              <div className="text-[11px] text-stone-500">{s.author} · {s.year || '—'}</div>
            </button>
          ))}
        </div>
      </div>
      {form && (
        <form onSubmit={save} className="lg:col-span-3 space-y-3 bg-white border border-[#E8E2D8] rounded-xl p-5">
          <div>
            <label className={labelClass}>العنوان *</label>
            <input className={inputClass} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>المؤلف / الجهة *</label>
            <input className={inputClass} value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <EditableSuggestionInput
                label="نوع المصدر والتوثيق"
                value={
                  form.source_type === 'book' ? 'كتاب مطبوع' :
                  form.source_type === 'academic_paper' ? 'بحث أكاديمي محكّم' :
                  form.source_type === 'document' ? 'وثيقة تاريخية أو وقفية' :
                  form.source_type === 'archive' ? 'سجل أرشيفي' :
                  form.source_type === 'official_site' ? 'موقع رسمي حكومي' :
                  form.source_type === 'government_record' ? 'سجل دائرة الآثار' :
                  form.source_type === 'field_source' ? 'مصدر ميداني / استطلاع' :
                  form.source_type === 'interview' ? 'شهادة شفوية موثقة' :
                  form.source_type === 'historical_photo' ? 'صورة تاريخية أرشيفية' :
                  form.source_type === 'map' ? 'خارطة أو مصور جغرافي' :
                  form.source_type === 'press' ? 'مادة صحفية تاريخية' :
                  form.source_type === 'other' ? 'مصدر آخر' :
                  form.source_type || ''
                }
                onChange={val => {
                  const map: Record<string, SourceType> = {
                    'كتاب مطبوع': 'book',
                    'كتاب': 'book',
                    'بحث أكاديمي محكّم': 'academic_paper',
                    'بحث أكاديمي': 'academic_paper',
                    'وثيقة تاريخية أو وقفية': 'document',
                    'وثيقة': 'document',
                    'سجل أرشيفي': 'archive',
                    'موقع رسمي حكومي': 'official_site',
                    'سجل دائرة الآثار': 'government_record',
                    'مصدر ميداني / استطلاع': 'field_source',
                    'مصدر ميداني': 'field_source',
                    'شهادة شفوية موثقة': 'interview',
                    'صورة تاريخية أرشيفية': 'historical_photo',
                    'خارطة أو مصور جغرافي': 'map',
                    'خريطة': 'map',
                    'مادة صحفية تاريخية': 'press',
                    'صحافة': 'press',
                    'مصدر آخر': 'other',
                  };
                  setForm({ ...form, source_type: map[val] || (val as any) });
                }}
                suggestions={[
                  { id: 'book', label: 'كتاب مطبوع', subLabel: 'كتب تاريخية ومصادر بلدانية' },
                  { id: 'academic_paper', label: 'بحث أكاديمي محكّم', subLabel: 'أطروحات ودراسات علمية' },
                  { id: 'document', label: 'وثيقة تاريخية أو وقفية', subLabel: 'حجج شرعية، وقفيات، سجلات محاكم' },
                  { id: 'archive', label: 'سجل أرشيفي', subLabel: 'وثائق الأرشيف العثماني والعراقي' },
                  { id: 'official_site', label: 'موقع رسمي حكومي', subLabel: 'بيانات وزارية وهيئات رسمية' },
                  { id: 'government_record', label: 'سجل دائرة الآثار', subLabel: 'تقارير مفتشية آثار كربلاء' },
                  { id: 'field_source', label: 'مصدر ميداني / استطلاع', subLabel: 'مسح ومعاينة ميدانية مباشرة' },
                  { id: 'interview', label: 'شهادة شفوية موثقة', subLabel: 'روايات شفوية لكبار السن والباحثين' },
                  { id: 'historical_photo', label: 'صورة تاريخية أرشيفية', subLabel: 'صور جوية وأرشيفية قديمة' },
                  { id: 'map', label: 'خارطة أو مصور جغرافي', subLabel: 'خرائط تاريخية ومخططات قديمة' },
                  { id: 'press', label: 'مادة صحفية تاريخية', subLabel: 'صحف ومجلات عراقية قديمة' },
                  { id: 'other', label: 'مصدر آخر', subLabel: 'مصادر توثيقية أخرى' },
                ]}
                placeholder="كتاب، وثيقة، بحث أكاديمي..."
              />
            </div>
            <div>
              <label className={labelClass}>سنة النشر</label>
              <input className={inputClass} value={form.year || ''} onChange={e => setForm({ ...form, year: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelClass}>الناشر</label>
            <input className={inputClass} value={form.publisher || ''} onChange={e => setForm({ ...form, publisher: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>اقتباس / مقتطف</label>
            <textarea className={inputClass} rows={3} value={form.excerpt || ''} onChange={e => setForm({ ...form, excerpt: e.target.value })} />
          </div>
          <div>
            <EditableSuggestionInput
              label="مستوى الموثوقية التوثيقية"
              value={
                form.reliability_level === 'high' ? 'عالية / مصدر أكاديمي موثوق' :
                form.reliability_level === 'medium' ? 'متوسطة / دراسة مساعدة' :
                form.reliability_level === 'preliminary' ? 'أولية / معاينة غير مكتملة' :
                form.reliability_level || ''
              }
              onChange={val => {
                const map: Record<string, Source['reliability_level']> = {
                  'عالية / مصدر أكاديمي موثوق': 'high',
                  'عالية': 'high',
                  'متوسطة / دراسة مساعدة': 'medium',
                  'متوسطة': 'medium',
                  'أولية / معاينة غير مكتملة': 'preliminary',
                  'أولية': 'preliminary',
                };
                setForm({ ...form, reliability_level: map[val] || (val as any) });
              }}
              suggestions={[
                { id: 'high', label: 'عالية / مصدر أكاديمي موثوق', subLabel: 'مصادر أولية وبحوث محكمة' },
                { id: 'medium', label: 'متوسطة / دراسة مساعدة', subLabel: 'دراسات ومقالات مساندة' },
                { id: 'preliminary', label: 'أولية / معاينة غير مكتملة', subLabel: 'ملاحظات استطلاعية قيد التدقيق' },
              ]}
              placeholder="عالية، متوسطة، أولية..."
            />
          </div>
          <div>
            <label className={labelClass}>ملاحظات الموثوقية</label>
            <textarea className={inputClass} rows={2} value={form.reliability_notes || ''} onChange={e => setForm({ ...form, reliability_notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button className={primaryBtn} type="submit" disabled={busy}>حفظ المرجع</button>
            {/^[0-9]+$/.test(form.id) && <button type="button" className={dangerBtn} disabled={busy} onClick={async () => {
              if (!confirm('حذف هذا المرجع؟')) return;
              setBusy(true); setError('');
              try {
                const result = await requestApi<{ message: string }>(`/api/v1/admin/sources/${form.id}`, { method: 'DELETE' });
                setSources(current => current.filter(item => item.id !== form.id)); setForm(null);
                alert(result.message || 'تم حذف المصدر من قاعدة البيانات.');
              } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حذف المصدر.'); }
              finally { setBusy(false); }
            }}>حذف</button>}
          </div>
        </form>
      )}
    </div>
  );
};

export const TypesManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [items, setItems] = useState<SiteType[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState<SiteType | null>(null);
  const load = async () => {
    const rows = await requestApi<any[]>('/api/v1/taxonomies/types');
    setItems(rows.map(row => ({ ...row, id: String(row.id), icon_name: row.icon || row.icon_name || 'Landmark' })));
  };
  useEffect(() => { void load().catch(reason => setError(reason.message || 'تعذر تحميل الأنواع.')); }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.name_ar.trim()) return;
    setError('');
    try {
      const creating = !/^\d+$/.test(form.id);
      const result = await requestApi<{ type: any }>(creating ? '/api/v1/admin/taxonomies/types' : `/api/v1/admin/taxonomies/types/${form.id}`, {
        method: creating ? 'POST' : 'PUT', body: JSON.stringify({ name_ar: form.name_ar, name_en: form.name_en, definition: form.definition, icon: form.icon_name, sort_order: (form as any).sort_order || 0, is_active: true }),
      });
      await load(); setForm({ ...result.type, id: String(result.type.id), icon_name: result.type.icon || 'Landmark' });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حفظ النوع.'); }
  };
  return (
    <TaxonomyList
      title="أنواع المعالم"
      items={items.map(i => ({ id: i.id, label: i.name_ar }))}
      onNew={() => setForm({ id: '', slug: '', name_ar: '', name_en: '', definition: '', icon_name: 'Landmark' })}
      onSelect={id => setForm(items.find(i => i.id === id) || null)}
      form={form && (
        <form onSubmit={save} className="space-y-3">
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <div><label className={labelClass}>الاسم بالعربية</label><input className={inputClass} value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} /></div>
          <div><label className={labelClass}>الاسم بالإنجليزية</label><input className={inputClass} value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} /></div>
          <div><label className={labelClass}>التعريف</label><textarea className={inputClass} rows={3} value={form.definition} onChange={e => setForm({ ...form, definition: e.target.value })} /></div>
          <div className="flex gap-2">
            <button className={primaryBtn} type="submit">حفظ النوع</button>
            <button type="button" className={dangerBtn} onClick={async () => {
              try { await requestApi(`/api/v1/admin/taxonomies/types/${form.id}`, { method: 'DELETE' }); setForm(null); await load(); }
              catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حذف النوع.'); }
            }}>حذف</button>
          </div>
        </form>
      )}
    />
  );
};

export const PeriodsManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [items, setItems] = useState<HistoricalPeriod[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState<HistoricalPeriod | null>(null);
  const load = async () => {
    const rows = await requestApi<any[]>('/api/v1/taxonomies/periods');
    setItems(rows.map(row => ({ ...row, id: String(row.id), start_year: row.start_year_label || '', end_year: row.end_year_label || '' })));
  };
  useEffect(() => { void load().catch(reason => setError(reason.message || 'تعذر تحميل الحقب.')); }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.name_ar.trim()) return;
    setError('');
    try {
      const creating = !/^\d+$/.test(form.id);
      const result = await requestApi<{ period: any }>(creating ? '/api/v1/admin/taxonomies/periods' : `/api/v1/admin/taxonomies/periods/${form.id}`, {
        method: creating ? 'POST' : 'PUT', body: JSON.stringify({ name_ar: form.name_ar, name_en: form.name_en, start_year_label: form.start_year || 'غير محدد', end_year_label: form.end_year || 'غير محدد', description: form.description, sort_order: (form as any).sort_order || 0, is_active: true }),
      });
      await load(); setForm({ ...result.period, id: String(result.period.id), start_year: result.period.start_year_label, end_year: result.period.end_year_label });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حفظ الحقبة.'); }
  };
  return (
    <TaxonomyList
      title="الحقبات التاريخية"
      items={items.map(i => ({ id: i.id, label: `${i.name_ar} (${i.start_year} – ${i.end_year})` }))}
      onNew={() => setForm({ id: '', slug: '', name_ar: '', name_en: '', start_year: '', end_year: '', description: '' })}
      onSelect={id => setForm(items.find(i => i.id === id) || null)}
      form={form && (
        <form onSubmit={save} className="space-y-3">
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <div><label className={labelClass}>الاسم بالعربية</label><input className={inputClass} value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} /></div>
          <div><label className={labelClass}>الاسم بالإنجليزية</label><input className={inputClass} value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>بداية الحقبة</label><input className={inputClass} value={form.start_year} onChange={e => setForm({ ...form, start_year: e.target.value })} /></div>
            <div><label className={labelClass}>نهاية الحقبة</label><input className={inputClass} value={form.end_year} onChange={e => setForm({ ...form, end_year: e.target.value })} /></div>
          </div>
          <div><label className={labelClass}>الوصف</label><textarea className={inputClass} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex gap-2">
            <button className={primaryBtn} type="submit">حفظ الحقبة</button>
            <button type="button" className={dangerBtn} onClick={async () => {
              try { await requestApi(`/api/v1/admin/taxonomies/periods/${form.id}`, { method: 'DELETE' }); setForm(null); await load(); }
              catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حذف الحقبة.'); }
            }}>حذف</button>
          </div>
        </form>
      )}
    />
  );
};

export const TagsManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [items, setItems] = useState<Tag[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Tag | null>(null);

  const load = async () => {
    const result = await requestApi<{ tags: any[] }>('/api/v1/taxonomies');
    setItems((result.tags || []).map(row => ({ ...row, id: String(row.id) })));
  };
  useEffect(() => { void load().catch(reason => setError(reason.message || 'تعذر تحميل الوسوم.')); }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.name_ar.trim()) return;
    setError('');
    try {
      const creating = !/^\d+$/.test(form.id);
      await requestApi(creating ? '/api/v1/admin/taxonomies/tags' : `/api/v1/admin/taxonomies/tags/${form.id}`, {
        method: creating ? 'POST' : 'PUT', body: JSON.stringify({ name_ar: form.name_ar, name_en: form.name_en || null, sort_order: form.sort_order || 0, is_active: form.is_active !== false }),
      });
      await load(); alert('تم حفظ الوسم في قاعدة البيانات.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حفظ الوسم.'); }
  };

  return (
    <TaxonomyList
      title="الوسوم والكلمات الدلالية"
      items={items.map(i => ({ id: i.id, label: `${i.name_ar} ${i.name_en ? `(${i.name_en})` : ''}` }))}
      onNew={() => setForm({
        id: '',
        name_ar: '',
        name_en: '',
        slug: '',
        sort_order: items.length + 1,
        is_active: true,
      })}
      onSelect={id => setForm(items.find(i => i.id === id) || null)}
      form={form && (
        <form onSubmit={save} className="space-y-4">
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <div>
            <label className={labelClass}>الوسم بالعربية *</label>
            <input
              className={inputClass}
              value={form.name_ar}
              onChange={e => setForm({ ...form, name_ar: e.target.value, slug: slugify(form.name_en || e.target.value) })}
              placeholder="مثال: عمارة عباسية"
            />
          </div>
          <div>
            <label className={labelClass}>الوسم بالإنجليزية</label>
            <input
              className={inputClass}
              value={form.name_en || ''}
              onChange={e => setForm({ ...form, name_en: e.target.value, slug: slugify(e.target.value || form.name_ar) })}
              placeholder="e.g. Abbasid Architecture"
            />
          </div>
          <div>
            <label className={labelClass}>الاسم اللطيف (Slug)</label>
            <input
              className={inputClass}
              value={form.slug || ''}
              onChange={e => setForm({ ...form, slug: e.target.value })}
              placeholder="abbasid-architecture"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>ترتيب العرض</label>
              <input
                type="number"
                className={inputClass}
                value={form.sort_order || 1}
                onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
            <div>
              <label className={labelClass}>الحالة</label>
              <select
                className={inputClass}
                value={form.is_active !== false ? '1' : '0'}
                onChange={e => setForm({ ...form, is_active: e.target.value === '1' })}
              >
                <option value="1">نشط ومفعل</option>
                <option value="0">معطل مؤقتاً</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button className={primaryBtn} type="submit">حفظ الوسم</button>
            <button
              type="button"
              className={dangerBtn}
              onClick={async () => {
                if (confirm('هل أنت متأكد من رغبتك بحذف هذا الوسم؟')) {
                  try { await requestApi(`/api/v1/admin/taxonomies/tags/${form.id}`, { method: 'DELETE' }); setForm(null); await load(); }
                  catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حذف الوسم.'); }
                }
              }}
            >
              حذف
            </button>
          </div>
        </form>
      )}
    />
  );
};

export const AreasManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [tab, setTab] = useState<'areas' | 'tags'>('areas');
  const [items, setItems] = useState<Area[]>([]);
  const [subDistricts, setSubDistricts] = useState<{ id: string; name_ar: string; district_name_ar: string }[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Area | null>(null);

  const load = async () => {
    const body = await requestApi<any>('/api/v1/taxonomies');
    const districts = (body.provinces || []).flatMap((province: any) => province.districts || []);
    const subs = districts.flatMap((district: any) => (district.sub_districts || district.subDistricts || []).map((sub: any) => ({ id: String(sub.id), name_ar: sub.name_ar, district_name_ar: district.name_ar })));
    setSubDistricts(subs);
    setItems((body.areas || []).map((area: any) => ({
      ...area, id: String(area.id), sub_district_id: String(area.sub_district_id),
      district_id: String(subs.find((sub: any) => sub.id === String(area.sub_district_id))?.id || ''),
      lat: null, lng: null,
    })));
  };
  useEffect(() => { void load().catch(reason => setError(reason.message || 'تعذر تحميل المناطق.')); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.name_ar.trim()) return;
    setError('');
    try {
      const creating = !/^\d+$/.test(form.id);
      await requestApi(creating ? '/api/v1/admin/taxonomies/areas' : `/api/v1/admin/taxonomies/areas/${form.id}`, {
        method: creating ? 'POST' : 'PUT', body: JSON.stringify({ name_ar: form.name_ar, name_en: form.name_en || null, sub_district_id: Number(form.district_id), description: form.description || null, sort_order: 0, is_active: true }),
      });
      await load(); alert('تم حفظ المنطقة في قاعدة البيانات.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حفظ المنطقة.'); }
  };

  return (
    <div className="space-y-4">
      {/* Sub tabs for Areas vs Tags */}
      <div className="flex border-b border-[#E8E2D8] gap-4">
        <button
          onClick={() => setTab('areas')}
          className={`pb-2.5 font-medium text-sm transition-colors border-b-2 cursor-pointer ${
            tab === 'areas'
              ? 'border-[#78350F] text-[#78350F] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          المناطق والمواقع الجغرافية ({items.length})
        </button>
        <button
          onClick={() => setTab('tags')}
          className={`pb-2.5 font-medium text-sm transition-colors border-b-2 cursor-pointer ${
            tab === 'tags'
              ? 'border-[#78350F] text-[#78350F] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          الوسوم والكلمات الدلالية
        </button>
      </div>

      {tab === 'tags' ? (
        <TagsManager actorName={actorName} />
      ) : (
        <TaxonomyList
          title="المناطق والمواقع"
          items={items.map(i => ({ id: i.id, label: i.name_ar }))}
          onNew={() => setForm({
            id: '',
            sub_district_id: subDistricts[0]?.id || '',
            district_id: subDistricts[0]?.id || '',
            name_ar: '',
            name_en: '',
            description: '',
            lat: null,
            lng: null,
          })}
          onSelect={id => setForm(items.find(i => i.id === id) || null)}
          form={form && (
            <form onSubmit={save} className="space-y-3">
              {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
              <div><label className={labelClass}>الاسم بالعربية</label><input className={inputClass} value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} /></div>
              <div><label className={labelClass}>الاسم بالإنجليزية</label><input className={inputClass} value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} /></div>
              <div>
                  <label className={labelClass}>القضاء / الناحية</label>
                <select className={inputClass} required value={form.district_id} onChange={e => setForm({ ...form, district_id: e.target.value, sub_district_id: e.target.value })}>
                  {subDistricts.map(d => <option key={d.id} value={d.id}>{d.district_name_ar} — {d.name_ar}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>الوصف</label><textarea className={inputClass} rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>خط العرض</label><input type="number" step="0.0001" className={inputClass} value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) })} /></div>
                <div><label className={labelClass}>خط الطول</label><input type="number" step="0.0001" className={inputClass} value={form.lng} onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) })} /></div>
              </div>
              <div className="flex gap-2">
                <button className={primaryBtn} type="submit">حفظ المنطقة</button>
                <button type="button" className={dangerBtn} onClick={async () => {
                  try { await requestApi(`/api/v1/admin/taxonomies/areas/${form.id}`, { method: 'DELETE' }); setForm(null); await load(); }
                  catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حذف المنطقة.'); }
                }}>حذف</button>
              </div>
            </form>
          )}
        />
      )}
    </div>
  );
};

const TaxonomyList: React.FC<{
  title: string;
  items: { id: string; label: string }[];
  onNew: () => void;
  onSelect: (id: string) => void;
  form: React.ReactNode;
}> = ({ title, items, onNew, onSelect, form }) => (
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
    <div className="lg:col-span-2 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">{title}</h1>
        <button className={ghostBtn} onClick={onNew}>إضافة</button>
      </div>
      <div className="bg-white border border-[#E8E2D8] rounded-xl divide-y max-h-[70vh] overflow-auto">
        {items.map(i => (
          <button key={i.id} onClick={() => onSelect(i.id)} className="w-full text-right p-3 hover:bg-stone-50 cursor-pointer text-sm">
            {i.label}
          </button>
        ))}
      </div>
    </div>
    <div className="lg:col-span-3 bg-white border border-[#E8E2D8] rounded-xl p-5">
      {form || <p className="text-sm text-stone-500">اختر عنصراً للتحرير أو أضف تصنيفاً جديداً.</p>}
    </div>
  </div>
);
