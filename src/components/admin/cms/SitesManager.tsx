import React, { useMemo, useState, useEffect } from 'react';
import { apiFetch } from '../../../services/apiFetch';
import { Site, LocationPrecision, PublicationStatus, VerificationStatus } from '../../../types';
import { inputClass, labelClass, primaryBtn, ghostBtn } from './formStyles';
import { EditableSuggestionInput, SuggestionOption } from '../../common/EditableSuggestionInput';
import { CoordinatePickerInput } from '../../common/CoordinatePickerInput';
import { ShieldCheck, Globe, Clock, FileText, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface Props {
  actorName: string;
  entityId?: string;
  onOpenEntity?: (id?: string) => void;
  onSelectSite?: (site: Site) => void;
}

type Option = { id: string | number; name_ar: string; name_en?: string; slug?: string; district_name_ar?: string };
type SiteFormTaxonomies = { siteTypes: Option[]; periods: Option[]; areas: Option[]; province: Option };

const BUILTIN_SITE_TYPE_SUGGESTIONS: SuggestionOption[] = [
  { label: 'موقع أثري', subLabel: 'مستوطنات وتلال ومنشآت أثرية غير مكتملة التنقيب', badge: 'أثري' },
  { label: 'حصن / قلعة', subLabel: 'منشآت حربية ودفاعية وأبراج مراقبة (مثل حصن الأخيضر)', badge: 'عسكري' },
  { label: 'خان وقفي / استراحة قوافل', subLabel: 'محطات القوافل وطرق الحج والتجارة القديمة', badge: 'عمارة مدنية' },
  { label: 'جامع / مسجد / مرقد', subLabel: 'منشآت دينية وعمارة إسلامية وتاريخية', badge: 'ديني' },
  { label: 'متحف', subLabel: 'مؤسسات حفظ وعرض التراث والمقتنيات الأثرية', badge: 'متحفي' },
  { label: 'قصر تاريخي', subLabel: 'مقار الحكم والولاة والمنازل التاريخية الفارهة', badge: 'تاريخي' },
  { label: 'مئذنة أثرية', subLabel: 'مآذن ومنارات منفردة ومرفقة بالمساجد التاريخية', badge: 'عمارة' },
  { label: 'كنيسة / دير أثري', subLabel: 'مواقع مسيحية شرقية تاريخية (مثل كنيسة الأقيصر/القصير)', badge: 'أثري' },
  { label: 'مستوطنة أثرية / تل', subLabel: 'تلال أثرية ومستوطنات تعود لحقب ما قبل الإسلام', badge: 'استيطاني' },
  { label: 'مبنى تاريخي / دار تراثية', subLabel: 'بيوت وعمائر تراثية تمثل النسيج العمراني القديم', badge: 'تراثي' },
  { label: 'نصب تذكاري / معلم', subLabel: 'شواهد ومعالم تذكارية مرتبطة بأحداث تاريخية', badge: 'معلم' },
];

const BUILTIN_PERIOD_SUGGESTIONS: SuggestionOption[] = [
  { label: 'العصر الإسلامي المبكر (الراشدي والأموي)', subLabel: '632 – 750 م', badge: 'إسلامي' },
  { label: 'العصر العباسي', subLabel: '750 – 1258 م (ازدهار العمران والمنشآت المائية)', badge: 'إسلامي' },
  { label: 'العصر الإلخاني والجلائري', subLabel: '1258 – 1410 م', badge: 'وسيط' },
  { label: 'العصر التيموري ودولتا الخروف', subLabel: '1410 – 1508 م', badge: 'وسيط' },
  { label: 'العصر الصفوي', subLabel: '1508 – 1736 م', badge: 'إسلامي متأخر' },
  { label: 'العصر العثماني', subLabel: '1534 – 1917 م (الخانات والتحصينات والأسواق)', badge: 'عثماني' },
  { label: 'العصر الحديث والمعاصر', subLabel: '1917 م – الآن (العمارة التراثية الحديثة)', badge: 'حديث' },
  { label: 'العصر الساساني والفرثي', subLabel: '247 ق.م – 651 م (منشآت البادية والتحصينات)', badge: 'قديم' },
  { label: 'العصر البابلي والكلداني', subLabel: '626 – 539 ق.م', badge: 'قديم' },
  { label: 'العصر السومري والأكدي', subLabel: '3000 – 2000 ق.م', badge: 'قديم' },
  { label: 'حقبة غير محددة / قيد التوثيق', subLabel: 'معالم بحاجة إلى فحص كربوني أو تنقيب ميداني', badge: 'قيد البحث' },
];

const BUILTIN_PRECISION_SUGGESTIONS: SuggestionOption[] = [
  { id: 'exact', label: 'مسح ميداني / إحداثيات مساحية دقيقة (Field Survey / Exact)', subLabel: 'مأخوذة بجهاز مساحة GPS عالي الدقة في الموقع', badge: 'دقيقة' },
  { id: 'exact', label: 'مصدر جغرافي رسمي (دائرة الآثار العراقية)', subLabel: 'مطابقة لسجلات المسح الجغرافي الرسمي', badge: 'رسمية' },
  { id: 'approximate', label: 'موقع تقريبي / مركز المنطقة (Approximate)', subLabel: 'تقريبية بناءً على مراجع وخرائط تاريخية (~1 كم)', badge: 'تقريبية' },
  { id: 'approximate', label: 'مرجع منشور / أطلس المواقع الأثرية', subLabel: 'مستخرجة من أطلس تاريخي مطبوع', badge: 'مرجعية' },
  { id: 'restricted', label: 'محجوبة احترازياً لحماية المعلم (Restricted Protection)', subLabel: 'مخفاة عمداً لحماية الموقع من النبش والتخريب', badge: 'محجوبة' },
  { id: 'unknown', label: 'غير معلومة / قيد التحديد الميداني (Unknown)', subLabel: 'موقع أثري مثبت بالاسم لكن لم تُحدد إحداثياته بعد', badge: 'غير محددة' },
];

const emptyForm = (): Partial<Site> & { museum_profile?: Record<string, any> } => ({
  name_ar: '',
  name_en: '',
  short_description: '',
  description: '',
  historical_description: '',
  architectural_description: '',
  cultural_significance: '',
  current_condition: '',
  location_description: '',
  site_type_id: '',
  historical_period_id: '',
  area_id: '',
  lat: null,
  lng: null,
  location_precision: 'unknown',
  publication_status: 'draft',
  verification_status: 'unverified',
  is_demo: false,
  featured: false,
  is_lost_or_vanished: false,
  is_under_research: true,
  ai_assisted: false,
  museum_profile: {},
});

export const SitesManager: React.FC<Props> = ({ entityId, onOpenEntity }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [, setLoadingSites] = useState(true);
  const [taxonomies, setTaxonomies] = useState<SiteFormTaxonomies | null>(null);
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [internalEntityId, setInternalEntityId] = useState<string | undefined>(entityId);

  // Editable text inputs state with suggestions
  const [siteTypeText, setSiteTypeText] = useState('');
  const [periodText, setPeriodText] = useState('');
  const [areaText, setAreaText] = useState('');
  const [precisionText, setPrecisionText] = useState('غير معلومة / قيد التحديد الميداني (Unknown)');

  const currentEntityId = entityId !== undefined ? entityId : internalEntityId;
  const editing = currentEntityId === 'new' ? null : sites.find(s => s.id === currentEntityId);
  const isForm = Boolean(currentEntityId);
  const [form, setForm] = useState<Partial<Site> & { museum_profile?: Record<string, any> }>(emptyForm());
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState('');

  // Load taxonomies from Supabase / Laravel API
  const loadTaxonomies = async () => {
    try {
      const response = await apiFetch('/api/v1/taxonomies', { headers: { Accept: 'application/json' } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || `تعذر تحميل التصنيفات (${response.status}).`);
      const province = (body.provinces || []).find((item: any) => item.code === 'KHA') || body.provinces?.[0];
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
      setTaxonomies(loaded);
      return loaded;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل التصنيفات.');
      return null;
    } finally {
      setLoadingTaxonomies(false);
    }
  };

  useEffect(() => {
    void loadTaxonomies();
  }, []);

  // Load sites
  useEffect(() => {
    apiFetch('/api/v1/admin/editorial?kind=sites&per_page=50', { headers: { Accept: 'application/json' } })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || `تعذر تحميل المواقع (${response.status}).`);
        setSites(body.data || []);
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : 'تعذر تحميل المواقع.'))
      .finally(() => setLoadingSites(false));
  }, []);

  const openEntity = (id?: string) => {
    setInternalEntityId(id);
    if (id === 'new') {
      setForm(emptyForm());
      setSiteTypeText('');
      setPeriodText('');
      setAreaText('');
      setPrecisionText('غير معلومة / قيد التحديد الميداني (Unknown)');
    }
    if (onOpenEntity) onOpenEntity(id);
  };

  // Sync edit record to form and editable suggestion text
  useEffect(() => {
    if (entityId === 'new') {
      setForm(emptyForm());
      setSiteTypeText('');
      setPeriodText('');
      setAreaText('');
      setPrecisionText('غير معلومة / قيد التحديد الميداني (Unknown)');
    } else if (editing) {
      const row = editing as any;
      setForm({
        ...editing,
        site_type_id: String(row.site_type_id || ''),
        historical_period_id: String(row.historical_period_id || ''),
        area_id: String(row.area_id || ''),
        lat: row.latitude == null && row.lat == null ? null : Number(row.latitude ?? row.lat),
        lng: row.longitude == null && row.lng == null ? null : Number(row.longitude ?? row.lng),
        museum_profile: row.museum_profile || {},
      });

      // Find matching labels for editable suggestions
      const matchedType = taxonomies?.siteTypes.find(t => String(t.id) === String(row.site_type_id));
      if (matchedType) setSiteTypeText(matchedType.name_ar);

      const matchedPeriod = taxonomies?.periods.find(p => String(p.id) === String(row.historical_period_id));
      if (matchedPeriod) setPeriodText(matchedPeriod.name_ar);

      const matchedArea = taxonomies?.areas.find(a => String(a.id) === String(row.area_id));
      if (matchedArea) {
        setAreaText(matchedArea.name_ar + (matchedArea.district_name_ar ? ` · ${matchedArea.district_name_ar}` : ''));
      }

      const matchedPrecision = BUILTIN_PRECISION_SUGGESTIONS.find(p => p.id === row.location_precision);
      if (matchedPrecision) {
        setPrecisionText(matchedPrecision.label);
      } else if (row.location_precision) {
        setPrecisionText(row.location_precision);
      }
    }
  }, [entityId, editing?.id, taxonomies]);

  const filtered = useMemo(() => {
    const q = filter.trim();
    if (!q) return sites;
    return sites.filter(
      s => s.name_ar.includes(q) || s.name_en?.toLowerCase().includes(q.toLowerCase()) || s.permanent_id.includes(q)
    );
  }, [sites, filter]);

  const set = (key: keyof Site, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));
  const selectedType = taxonomies?.siteTypes.find(type => String(type.id) === String(form.site_type_id));
  const isMuseum = selectedType?.slug === 'museums' || siteTypeText.includes('متحف');
  const setMuseumProfile = (key: string, value: string) =>
    setForm(prev => ({ ...prev, museum_profile: { ...(prev as any).museum_profile, [key]: value } }));

  // Combined site type suggestions
  const siteTypeSuggestions = useMemo(() => {
    const fromDb: SuggestionOption[] = (taxonomies?.siteTypes || []).map(t => ({
      id: t.id,
      label: t.name_ar,
      subLabel: t.name_en,
      badge: 'معتمد',
    }));
    // Merge built-in suggestions avoiding duplicates
    const existingLabels = new Set(fromDb.map(d => d.label.trim()));
    const additional = BUILTIN_SITE_TYPE_SUGGESTIONS.filter(b => !existingLabels.has(b.label.trim()));
    return [...fromDb, ...additional];
  }, [taxonomies?.siteTypes]);

  // Combined period suggestions
  const periodSuggestions = useMemo(() => {
    const fromDb: SuggestionOption[] = (taxonomies?.periods || []).map(p => ({
      id: p.id,
      label: p.name_ar,
      subLabel: p.name_en,
      badge: 'معتمد',
    }));
    const existingLabels = new Set(fromDb.map(d => d.label.trim()));
    const additional = BUILTIN_PERIOD_SUGGESTIONS.filter(b => !existingLabels.has(b.label.trim()));
    return [...fromDb, ...additional];
  }, [taxonomies?.periods]);

  // Combined area suggestions
  const areaSuggestions = useMemo(() => {
    return (taxonomies?.areas || []).map((a: any) => ({
      id: a.id,
      label: a.name_ar,
      subLabel: a.district_name_ar ? `قضاء ${a.district_name_ar}` : undefined,
      badge: a.district_name_ar,
    }));
  }, [taxonomies?.areas]);

  // Action: Create new Site Type on the fly
  const handleCreateNewType = async (typeName: string) => {
    try {
      const res = await apiFetch('/api/v1/admin/taxonomies/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name_ar: typeName, name_en: typeName, definition: typeName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'تعذر حفظ نوع المعلم الجديد.');
      const newType = data.type;
      await loadTaxonomies();
      set('site_type_id', String(newType.id));
      setSiteTypeText(newType.name_ar);
      alert(`تمت إضافة «${newType.name_ar}» كنوع معلم جديد إلى قاعدة البيانات.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'تعذر إضافة نوع المعلم.');
    }
  };

  // Action: Create new Historical Period on the fly
  const handleCreateNewPeriod = async (periodName: string) => {
    try {
      const res = await apiFetch('/api/v1/admin/taxonomies/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name_ar: periodName, name_en: periodName, start_year_label: 'غير محدد', end_year_label: 'غير محدد', description: periodName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'تعذر حفظ الحقبة الجديدة.');
      const newPeriod = data.period;
      await loadTaxonomies();
      set('historical_period_id', String(newPeriod.id));
      setPeriodText(newPeriod.name_ar);
      alert(`تمت إضافة «${newPeriod.name_ar}» كحقبة تاريخية جديدة إلى قاعدة البيانات.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'تعذر إضافة الحقبة.');
    }
  };

  // Action: Create new Area on the fly
  const handleCreateNewArea = async (areaName: string) => {
    try {
      const res = await apiFetch('/api/v1/admin/taxonomies/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name_ar: areaName, name_en: areaName, description: areaName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'تعذر حفظ المنطقة الجديدة.');
      const newArea = data.area;
      await loadTaxonomies();
      set('area_id', String(newArea.id));
      setAreaText(newArea.name_ar);
      alert(`تمت إضافة «${newArea.name_ar}» كمنطقة جديدة إلى قاعدة البيانات.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'تعذر إضافة المنطقة.');
    }
  };

  // Save handler with dynamic suggestion support
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name_ar?.trim() || !form.short_description?.trim()) {
      alert('الاسم العربي والوصف المختصر إلزاميان.');
      return;
    }
    if (!siteTypeText.trim() || !periodText.trim() || !areaText.trim()) {
      alert('يلزم تحديد نوع المعلم والحقبة التاريخية والمنطقة.');
      return;
    }
    if (editing && !reason.trim()) {
      alert('يلزم ذكر سبب التعديل في سجل المراجعة.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Normalize location precision
      let precisionVal: LocationPrecision = 'approximate';
      const p = precisionText.toLowerCase();
      if (p.includes('مسح') || p.includes('دقيق') || p.includes('رسمي') || p === 'exact') {
        precisionVal = 'exact';
      } else if (p.includes('حجب') || p.includes('محجوب') || p === 'restricted') {
        precisionVal = 'restricted';
      } else if (p.includes('مجهول') || p.includes('غير معلوم') || p.includes('غير محدد') || p === 'unknown') {
        precisionVal = 'unknown';
      }

      const payload: Record<string, unknown> = {
        name_ar: form.name_ar,
        name_en: form.name_en || null,
        summary_ar: form.short_description,
        description_ar: form.description || null,
        historical_description: form.historical_description || null,
        architectural_description: form.architectural_description || null,
        cultural_significance: form.cultural_significance || null,
        current_condition: form.current_condition || null,
        location_description: form.location_description || null,

        // Pass resolved ID or typed string name for backend findOrCreate
        site_type_id: form.site_type_id ? Number(form.site_type_id) : undefined,
        site_type_name: siteTypeText.trim(),

        historical_period_id: form.historical_period_id ? Number(form.historical_period_id) : undefined,
        historical_period_name: periodText.trim(),

        area_id: form.area_id ? Number(form.area_id) : undefined,
        area_name: areaText.trim(),

        location_precision: precisionVal,
        latitude: form.lat ?? null,
        longitude: form.lng ?? null,

        ...(isMuseum ? { museum_profile: (form as any).museum_profile || {} } : {}),
        is_demo: Boolean(form.is_demo),
        featured: Boolean(form.featured),
        ai_assisted: Boolean(form.ai_assisted),
        is_lost_or_vanished: Boolean(form.is_lost_or_vanished),
        is_under_research: Boolean(form.is_under_research),
      };

      if (!editing && taxonomies?.province) {
        payload.province_id = Number(taxonomies.province.id);
      }
      if (editing) {
        payload.revision_notes = reason.trim();
      }

      const response = await apiFetch(editing ? `/api/v1/admin/sites/${editing.id}` : '/api/v1/admin/sites', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.errors ? Object.values(body.errors).flat().join(' ') : body.message || `تعذر الحفظ (${response.status}).`);
      }

      const saved = { ...body.site } as Site;
      setSites(current => (editing ? current.map(site => (String(site.id) === String(saved.id) ? saved : site)) : [saved, ...current]));
      setForm({
        ...form,
        ...saved,
        site_type_id: String(saved.site_type_id || form.site_type_id),
        historical_period_id: String(saved.historical_period_id || form.historical_period_id),
        area_id: String(saved.area_id || form.area_id),
        lat: (saved as any).latitude == null ? form.lat ?? null : Number((saved as any).latitude),
        lng: (saved as any).longitude == null ? form.lng ?? null : Number((saved as any).longitude),
      });

      if (!editing) {
        openEntity(String(saved.id));
      }

      alert(body.message || 'تم حفظ السجل بنجاح في قاعدة بيانات الأرشيف (Supabase).');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ السجل.');
    } finally {
      setSaving(false);
    }
  };

  if (isForm) {
    return (
      <form onSubmit={save} className="space-y-6 max-w-4xl" dir="rtl">
        {error && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              {editing ? `تحرير معلم: ${editing.name_ar}` : 'تسجيل معلم أثري أو تاريخي جديد'}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              جميع الحقول تقبل الكتابة المباشرة مع اقتراحات ذكية. المسودات لا تظهر للعموم حتى تُعتمد من هيئة التحرير.
            </p>
          </div>
          <button type="button" className={ghostBtn} onClick={() => openEntity(undefined)}>
            العودة للقائمة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white border border-[#E8E2D8] rounded-xl p-6 shadow-2xs">
          <div>
            <label className={labelClass}>الاسم بالعربية *</label>
            <input
              required
              className={inputClass}
              placeholder="مثال: خان النخيلة (خان الربع)"
              value={form.name_ar || ''}
              onChange={e => set('name_ar', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>الاسم بالإنجليزية (Latin Transliteration)</label>
            <input
              className={inputClass}
              placeholder="Khan al-Nukhaylah"
              value={form.name_en || ''}
              onChange={e => set('name_en', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>وصف مختصر يظهر في الفهرس وبطاقة المعلم *</label>
            <textarea
              required
              className={inputClass}
              rows={2}
              placeholder="خان أثري إسلامي يقع على طريق كربلاء - النجف القديم..."
              value={form.short_description || ''}
              onChange={e => set('short_description', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>الوصف العام المفصل</label>
            <textarea
              className={inputClass}
              rows={4}
              placeholder="التفاصيل المعمارية، عناصر البناء، السجلات الأثرية..."
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* 1. Type Input with Smart Suggestions */}
          <div>
            <EditableSuggestionInput
              label="نوع المعلم وتصنيفه الوظيفي"
              required
              value={siteTypeText}
              selectedId={form.site_type_id}
              onChange={text => {
                setSiteTypeText(text);
                const match = siteTypeSuggestions.find(s => s.label.trim() === text.trim());
                set('site_type_id', match?.id ? String(match.id) : '');
              }}
              onSelectSuggestion={opt => {
                setSiteTypeText(opt.label);
                if (opt.id) set('site_type_id', String(opt.id));
              }}
              suggestions={siteTypeSuggestions}
              onCreateCustom={handleCreateNewType}
              placeholder="اكتب نوع المعلم (حصن، خان، مسجد، كنيسة...)"
              helperText="اكتب بحرية أو اختر من اقتراحات التراث العراقي. يمكنك إضافة صنف جديد."
            />
          </div>

          {/* 2. Historical Period Input with Smart Suggestions */}
          <div>
            <EditableSuggestionInput
              label="الحقبة التاريخية أو فترة التشييد"
              required
              value={periodText}
              selectedId={form.historical_period_id}
              onChange={text => {
                setPeriodText(text);
                const match = periodSuggestions.find(s => s.label.trim() === text.trim());
                set('historical_period_id', match?.id ? String(match.id) : '');
              }}
              onSelectSuggestion={opt => {
                setPeriodText(opt.label);
                if (opt.id) set('historical_period_id', String(opt.id));
              }}
              suggestions={periodSuggestions}
              onCreateCustom={handleCreateNewPeriod}
              placeholder="اكتب الحقبة (العصر العباسي، العثماني، الساساني...)"
              helperText="اكتب توصيف الحقبة أو اختر من العصور التاريخية المعترف بها."
            />
          </div>

          {/* 3. Region / Locality Input with Smart Suggestions */}
          <div>
            <EditableSuggestionInput
              label="المنطقة أو الناحية الجغرافية"
              required
              value={areaText}
              selectedId={form.area_id}
              onChange={text => {
                setAreaText(text);
                const match = areaSuggestions.find(s => s.label.trim() === text.trim());
                set('area_id', match?.id ? String(match.id) : '');
              }}
              onSelectSuggestion={opt => {
                setAreaText(opt.label);
                if (opt.id) set('area_id', String(opt.id));
              }}
              suggestions={areaSuggestions}
              onCreateCustom={handleCreateNewArea}
              placeholder="اكتب اسم الناحية أو المحلة (العباسية، عين التمر، الحر...)"
              helperText="اكتب اسم المنطقة أو اختر من سجلات أقضية ونواحي كربلاء."
            />
          </div>

          {/* 4. Coordinate Accuracy with Smart Suggestions */}
          <div>
            <EditableSuggestionInput
              label="دقة تحديد الموقع والإسناد المساحي"
              value={precisionText}
              onChange={text => setPrecisionText(text)}
              onSelectSuggestion={opt => {
                setPrecisionText(opt.label);
                if (opt.id) set('location_precision', opt.id as LocationPrecision);
              }}
              suggestions={BUILTIN_PRECISION_SUGGESTIONS}
              placeholder="اختر أو اكتب مصدر دقة الموقع (مسح ميداني، تقريبي، محجوب...)"
              helperText="تحدد كيفية ظهور الإحداثيات للعموم (حماية للمواقع غير المنقبة)."
            />
          </div>

          {/* 5. Latitude and Longitude with Map Picker and Paste Parser */}
          <div className="md:col-span-2 rounded-xl border border-stone-200 bg-stone-50/60 p-4">
            <CoordinatePickerInput
              lat={form.lat}
              lng={form.lng}
              onChangeLat={newLat => set('lat', newLat)}
              onChangeLng={newLng => set('lng', newLng)}
            />
          </div>

          {/* Museum Institutional Profile (Dynamic when site is a museum) */}
          {isMuseum && (
            <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-4">
              <h2 className="font-semibold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#78350F]" />
                بيانات المؤسسة المتحفية ومعلومات الزيارة
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">الجهة المشرفة والتشغيل</label>
                  <EditableSuggestionInput
                    value={(form as any).museum_profile?.operator_name || ''}
                    onChange={val => setMuseumProfile('operator_name', val)}
                    suggestions={['العتبة الحسينية المقدسة', 'العتبة العباسية المقدسة', 'الهيئة العامة للآثار والتراث (وزارة الثقافة)', 'إدارة محلية / قطاع خاص']}
                    placeholder="اكتب اسم الجهة المشرفة..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">نوع الجهة</label>
                  <EditableSuggestionInput
                    value={(form as any).museum_profile?.operator_type || ''}
                    onChange={val => setMuseumProfile('operator_type', val)}
                    suggestions={[
                      { id: 'shrine_run_endowment', label: 'وقف ديني / عتبة مقدسة' },
                      { id: 'government', label: 'حكومي / وزارة الثقافة والآثار' },
                      { id: 'private', label: 'خاص / أهلي' },
                      { id: 'other', label: 'أخرى' },
                    ]}
                    placeholder="وقف ديني، حكومي، خاص..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">الموقع الإلكتروني الرسمي</label>
                  <input
                    type="url"
                    className={inputClass}
                    placeholder="https://..."
                    value={(form as any).museum_profile?.official_website || ''}
                    onChange={e => setMuseumProfile('official_website', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">سنة التأسيس كما وردت في المصادر</label>
                  <EditableSuggestionInput
                    value={(form as any).museum_profile?.founding_year || ''}
                    onChange={val => setMuseumProfile('founding_year', val)}
                    suggestions={['2011 م', '2015 م', '2009 م', 'القرن العشرين']}
                    placeholder="مثال: 2009 م"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">العنوان الجغرافي والوصول</label>
                  <textarea
                    rows={2}
                    className={inputClass}
                    placeholder="كربلاء المقدسة، باب قبلة الإمام الحسين..."
                    value={(form as any).museum_profile?.address_text || ''}
                    onChange={e => setMuseumProfile('address_text', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6 & 7. Publication and Verification Status Workflow Cards */}
          <div className="rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#78350F]" />
                حالة النشر الرقمي
              </span>
              <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-800">
                {form.publication_status === 'published' ? 'منشور للعموم' : form.publication_status === 'pending_review' ? 'بانتظار المراجعة' : form.publication_status === 'archived' ? 'مؤرشف' : 'مسودة خاصة'}
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {form.publication_status === 'published'
                ? 'السجل منشور حالياً في الفهرس العام. النشر يتطلب موافقة هيئة التحرير وتوثيقاً مرجعياً.'
                : 'المسودات محفوظة في قاعدة البيانات ولا تظهر لزوار الموقع حتى تُعتمد من المحرر.'}
            </p>
          </div>

          <div className="rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#78350F]" />
                حالة التحقيق العلمي
              </span>
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                {form.verification_status === 'verified' ? 'محقّق علمياً' : form.verification_status === 'partially_verified' ? 'محقّق جزئياً' : form.verification_status === 'disputed' ? 'محل خلاف' : 'غير محقّق بعد'}
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              حالة التحقيق مستقلة تماماً عن النشر؛ تُحدّث عبر قرار تحريري موثق ومسنود بالمراجع الأكاديمية.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>التوصيف التاريخي والنشأة</label>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="تسلسل الأحداث التاريخية، الفترات الزمنية المتعاقبة، والشخصيات المرتبطة..."
              value={form.historical_description || ''}
              onChange={e => set('historical_description', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>التوصيف المعماري والهندسي</label>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="مواد البناء (طين، آجر، جص، حجر)، التخطيط الهندسي، الأروقة والقباب..."
              value={form.architectural_description || ''}
              onChange={e => set('architectural_description', e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-stone-700 md:col-span-2 pt-2 border-t border-stone-200">
            <label className="inline-flex items-center gap-2 cursor-pointer bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100">
              <input type="checkbox" checked={!!form.featured} onChange={e => set('featured', e.target.checked)} />
              معلم بارز في واجهة الأرشيف
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100">
              <input type="checkbox" checked={!!form.is_demo} onChange={e => set('is_demo', e.target.checked)} />
              بيانات تجريبية (بيانات افتراضية)
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100">
              <input type="checkbox" checked={!!form.ai_assisted} onChange={e => set('ai_assisted', e.target.checked)} />
              مساعَد بالذكاء الاصطناعي (يتطلب مراجعة بشرية)
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100">
              <input type="checkbox" checked={!!form.is_lost_or_vanished} onChange={e => set('is_lost_or_vanished', e.target.checked)} />
              معلم مندثر / مفقود
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100">
              <input type="checkbox" checked={!!form.is_under_research} onChange={e => set('is_under_research', e.target.checked)} />
              قيد التحقيق والمسح الميداني
            </label>
          </div>

          {editing && (
            <div className="md:col-span-2 space-y-1.5 border-t border-amber-200 bg-amber-50/50 p-4 rounded-xl">
              <label className="block text-xs font-bold text-amber-950">
                سبب التعديل ومسوغ المراجعة * (إلزامي لسجل التدقيق والتاريخ التوثيقي)
              </label>
              <input
                required
                className={inputClass}
                placeholder="بيّن سبب التعديل (مثال: تصويب تاريخ التشييد استناداً إلى مسح هيئة الآثار 2024)..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" className={ghostBtn} onClick={() => openEntity(undefined)}>
            إلغاء والعودة
          </button>
          <button type="submit" disabled={saving} className={primaryBtn + ' px-8'}>
            {saving ? 'جارٍ الحفظ في Supabase…' : editing ? 'حفظ التعديلات في قاعدة البيانات' : 'تسجيل المعلم في الأرشيف'}
          </button>
        </div>
      </form>
    );
  }

  // List View
  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E2D8] pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">سجل المعالم والمواقع الأثرية</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            إدارة وتوثيق المعالم الأثرية والتاريخية في محافظة كربلاء ببيانات موثوقة ومسندة.
          </p>
        </div>
        <button type="button" className={primaryBtn} onClick={() => openEntity('new')}>
          + تسجيل معلم جديد
        </button>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          className={inputClass + ' max-w-sm'}
          placeholder="بحث بالاسم العربي، اللاتيني، أو المعرف الدائم..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      <div className="bg-white border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#FAF8F5] border-b border-[#E8E2D8] text-stone-700 font-serif">
            <tr>
              <th className="p-3">المعرف</th>
              <th className="p-3">اسم المعلم</th>
              <th className="p-3">النوع</th>
              <th className="p-3">المنطقة</th>
              <th className="p-3">الحقبة</th>
              <th className="p-3">حالة التحقيق</th>
              <th className="p-3">حالة النشر</th>
              <th className="p-3 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map(site => (
              <tr key={site.id} className="hover:bg-stone-50 transition-colors">
                <td className="p-3 font-mono text-[11px] text-stone-500">{site.permanent_id}</td>
                <td className="p-3 font-medium text-stone-900">{site.name_ar}</td>
                <td className="p-3 text-stone-600">{(site as any).site_type?.name_ar || site.site_type_id}</td>
                <td className="p-3 text-stone-600">{(site as any).area?.name_ar || site.area_id}</td>
                <td className="p-3 text-stone-600">{(site as any).historical_period?.name_ar || site.historical_period_id}</td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    site.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {site.verification_status}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    site.publication_status === 'published' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-700'
                  }`}>
                    {site.publication_status}
                  </span>
                </td>
                <td className="p-3 text-left">
                  <button type="button" onClick={() => openEntity(String(site.id))} className={ghostBtn + ' text-xs py-1 px-3'}>
                    تحرير
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
