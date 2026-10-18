import React, { useState } from 'react';
import { archiveDB } from '../../../db/archiveStore';
import { Area, EncyclopediaEntry, HistoricalPeriod, SiteType, Source, SourceType, Tag } from '../../../types';
import { inputClass, labelClass, primaryBtn, ghostBtn, dangerBtn } from './formStyles';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u0621-\u064A]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const EncyclopediaManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [, setTick] = useState(0);
  const entries = archiveDB.getEncyclopedia();
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

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.term_ar?.trim() || !form.full_text?.trim()) {
      alert('المصطلح العربي والنص الكامل إلزاميان.');
      return;
    }
    const entry: EncyclopediaEntry = {
      id: editing?.id || `ency_${Date.now()}`,
      slug: editing?.slug || slugify(form.term_en || form.term_ar || `entry-${Date.now()}`),
      term_ar: form.term_ar,
      term_en: form.term_en || '',
      category: (form.category as EncyclopediaEntry['category']) || 'architecture',
      short_summary: form.short_summary || form.full_text.slice(0, 180),
      full_text: form.full_text,
      related_site_ids: form.related_site_ids || [],
      source_ids: form.source_ids || [],
    };
    archiveDB.saveEncyclopediaEntry(entry, actorName);
    setTick(t => t + 1);
    setEditing(entry);
    alert('حُفظت المادة وتظهر في المعجم الموسوعي العام.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold">المقالات والمعجم</h1>
          <button className={ghostBtn} onClick={startNew}>مادة جديدة</button>
        </div>
        <div className="bg-white border border-[#E8E2D8] rounded-xl divide-y max-h-[70vh] overflow-auto">
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
          <label className={labelClass}>التصنيف</label>
          <select className={inputClass} value={form.category} onChange={e => setForm({ ...form, category: e.target.value as EncyclopediaEntry['category'] })}>
            <option value="architecture">عمارة</option>
            <option value="historical_event">حدث تاريخي</option>
            <option value="person">علم</option>
            <option value="geography">جغرافيا</option>
            <option value="dynasty">دولة / سلالة</option>
          </select>
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
          <button className={primaryBtn} type="submit">حفظ المادة</button>
          {editing && (
            <button type="button" className={dangerBtn} onClick={() => {
              if (!confirm('حذف هذه المادة من المعجم العام؟')) return;
              archiveDB.deleteEncyclopediaEntry(editing.id, actorName);
              startNew();
              setTick(t => t + 1);
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
  const [, setTick] = useState(0);
  const sources = archiveDB.getAllSources();
  const [form, setForm] = useState<Source | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.title.trim() || !form.author.trim()) {
      alert('العنوان والمؤلف إلزاميان.');
      return;
    }
    archiveDB.saveSource(form, actorName);
    setTick(t => t + 1);
    alert('حُفظ المرجع ويظهر في فهرس المصادر.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold">المصادر والمراجع</h1>
          <button className={ghostBtn} onClick={() => setForm({
            id: `src_${Date.now()}`,
            source_type: 'book',
            title: '',
            author: '',
            reliability_level: 'medium',
            language: 'ar',
          })}>مرجع جديد</button>
        </div>
        <div className="bg-white border border-[#E8E2D8] rounded-xl divide-y max-h-[70vh] overflow-auto">
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
              <label className={labelClass}>النوع</label>
              <select className={inputClass} value={form.source_type} onChange={e => setForm({ ...form, source_type: e.target.value as SourceType })}>
                {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
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
            <label className={labelClass}>مستوى الموثوقية</label>
            <select className={inputClass} value={form.reliability_level} onChange={e => setForm({ ...form, reliability_level: e.target.value as Source['reliability_level'] })}>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="preliminary">أولية</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>ملاحظات الموثوقية</label>
            <textarea className={inputClass} rows={2} value={form.reliability_notes || ''} onChange={e => setForm({ ...form, reliability_notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button className={primaryBtn} type="submit">حفظ المرجع</button>
            <button type="button" className={dangerBtn} onClick={() => {
              if (!confirm('حذف هذا المرجع؟')) return;
              archiveDB.deleteSource(form.id, actorName);
              setForm(null);
              setTick(t => t + 1);
            }}>حذف</button>
          </div>
        </form>
      )}
    </div>
  );
};

export const TypesManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [, setTick] = useState(0);
  const items = archiveDB.getSiteTypes();
  const [form, setForm] = useState<SiteType | null>(null);
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.name_ar.trim()) return;
    archiveDB.saveSiteType({ ...form, slug: form.slug || slugify(form.name_en || form.name_ar) }, actorName);
    setTick(t => t + 1);
  };
  return (
    <TaxonomyList
      title="أنواع المعالم"
      items={items.map(i => ({ id: i.id, label: i.name_ar }))}
      onNew={() => setForm({ id: `type_${Date.now()}`, slug: '', name_ar: '', name_en: '', definition: '', icon_name: 'Landmark' })}
      onSelect={id => setForm(items.find(i => i.id === id) || null)}
      form={form && (
        <form onSubmit={save} className="space-y-3">
          <div><label className={labelClass}>الاسم بالعربية</label><input className={inputClass} value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} /></div>
          <div><label className={labelClass}>الاسم بالإنجليزية</label><input className={inputClass} value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} /></div>
          <div><label className={labelClass}>التعريف</label><textarea className={inputClass} rows={3} value={form.definition} onChange={e => setForm({ ...form, definition: e.target.value })} /></div>
          <div className="flex gap-2">
            <button className={primaryBtn} type="submit">حفظ النوع</button>
            <button type="button" className={dangerBtn} onClick={() => {
              if (!archiveDB.deleteSiteType(form.id, actorName)) {
                alert('لا يمكن حذف نوع مرتبط بسجلات قائمة.');
                return;
              }
              setForm(null);
              setTick(t => t + 1);
            }}>حذف</button>
          </div>
        </form>
      )}
    />
  );
};

export const PeriodsManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [, setTick] = useState(0);
  const items = archiveDB.getHistoricalPeriods();
  const [form, setForm] = useState<HistoricalPeriod | null>(null);
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.name_ar.trim()) return;
    archiveDB.saveHistoricalPeriod({ ...form, slug: form.slug || slugify(form.name_en || form.name_ar) }, actorName);
    setTick(t => t + 1);
  };
  return (
    <TaxonomyList
      title="الحقبات التاريخية"
      items={items.map(i => ({ id: i.id, label: `${i.name_ar} (${i.start_year} – ${i.end_year})` }))}
      onNew={() => setForm({ id: `period_${Date.now()}`, slug: '', name_ar: '', name_en: '', start_year: '', end_year: '', description: '' })}
      onSelect={id => setForm(items.find(i => i.id === id) || null)}
      form={form && (
        <form onSubmit={save} className="space-y-3">
          <div><label className={labelClass}>الاسم بالعربية</label><input className={inputClass} value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} /></div>
          <div><label className={labelClass}>الاسم بالإنجليزية</label><input className={inputClass} value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>بداية الحقبة</label><input className={inputClass} value={form.start_year} onChange={e => setForm({ ...form, start_year: e.target.value })} /></div>
            <div><label className={labelClass}>نهاية الحقبة</label><input className={inputClass} value={form.end_year} onChange={e => setForm({ ...form, end_year: e.target.value })} /></div>
          </div>
          <div><label className={labelClass}>الوصف</label><textarea className={inputClass} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex gap-2">
            <button className={primaryBtn} type="submit">حفظ الحقبة</button>
            <button type="button" className={dangerBtn} onClick={() => {
              if (!archiveDB.deleteHistoricalPeriod(form.id, actorName)) {
                alert('لا يمكن حذف حقبة مرتبطة بسجلات قائمة.');
                return;
              }
              setForm(null);
              setTick(t => t + 1);
            }}>حذف</button>
          </div>
        </form>
      )}
    />
  );
};

export const TagsManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [, setTick] = useState(0);
  const items = archiveDB.getTags();
  const [form, setForm] = useState<Tag | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.name_ar.trim()) return;
    archiveDB.saveTag(form, actorName);
    setTick(t => t + 1);
    alert('تم حفظ الوسم بنجاح.');
  };

  return (
    <TaxonomyList
      title="الوسوم والكلمات الدلالية"
      items={items.map(i => ({ id: i.id, label: `${i.name_ar} ${i.name_en ? `(${i.name_en})` : ''}` }))}
      onNew={() => setForm({
        id: `tag_${Date.now()}`,
        name_ar: '',
        name_en: '',
        slug: '',
        sort_order: items.length + 1,
        is_active: true,
      })}
      onSelect={id => setForm(items.find(i => i.id === id) || null)}
      form={form && (
        <form onSubmit={save} className="space-y-4">
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
              onClick={() => {
                if (confirm('هل أنت متأكد من رغبتك بحذف هذا الوسم؟')) {
                  archiveDB.deleteTag(form.id, actorName);
                  setForm(null);
                  setTick(t => t + 1);
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
  const [, setTick] = useState(0);
  const items = archiveDB.getAreas();
  const districts = archiveDB.getDistricts();
  const [form, setForm] = useState<Area | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.name_ar.trim()) return;
    archiveDB.saveArea(form, actorName);
    setTick(t => t + 1);
    alert('تم حفظ المنطقة بنجاح.');
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
          الوسوم والكلمات الدلالية ({archiveDB.getTags().length})
        </button>
      </div>

      {tab === 'tags' ? (
        <TagsManager actorName={actorName} />
      ) : (
        <TaxonomyList
          title="المناطق والمواقع"
          items={items.map(i => ({ id: i.id, label: i.name_ar }))}
          onNew={() => setForm({
            id: `area_${Date.now()}`,
            sub_district_id: archiveDB.getSubDistricts()[0]?.id || 'sub_center',
            district_id: districts[0]?.id || 'dist_center',
            name_ar: '',
            name_en: '',
            description: '',
            lat: 32.616,
            lng: 44.0249,
          })}
          onSelect={id => setForm(items.find(i => i.id === id) || null)}
          form={form && (
            <form onSubmit={save} className="space-y-3">
              <div><label className={labelClass}>الاسم بالعربية</label><input className={inputClass} value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} /></div>
              <div><label className={labelClass}>الاسم بالإنجليزية</label><input className={inputClass} value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} /></div>
              <div>
                <label className={labelClass}>القضاء</label>
                <select className={inputClass} value={form.district_id} onChange={e => setForm({ ...form, district_id: e.target.value })}>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>الوصف</label><textarea className={inputClass} rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>خط العرض</label><input type="number" step="0.0001" className={inputClass} value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) })} /></div>
                <div><label className={labelClass}>خط الطول</label><input type="number" step="0.0001" className={inputClass} value={form.lng} onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) })} /></div>
              </div>
              <div className="flex gap-2">
                <button className={primaryBtn} type="submit">حفظ المنطقة</button>
                <button type="button" className={dangerBtn} onClick={() => {
                  if (!archiveDB.deleteArea(form.id, actorName)) {
                    alert('لا يمكن حذف منطقة مرتبطة بسجلات قائمة.');
                    return;
                  }
                  setForm(null);
                  setTick(t => t + 1);
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
