import { apiFetch } from '../../../services/apiFetch';
import React, { useState } from 'react';
import { Site, VerificationStatus } from '../../../types';
import { inputClass, labelClass, primaryBtn, ghostBtn } from './formStyles';
import { VerificationBadge } from '../../common/VerificationBadge';
import {
  FileCheck,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  ExternalLink,
  BookOpen,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const VerificationManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  React.useEffect(() => {
    apiFetch('/api/v1/admin/editorial?kind=sites&per_page=50', { headers: { Accept: 'application/json' } })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || `تعذر تحميل السجلات (${response.status}).`);
        setSites(body.data || []);
      })
      .catch(error => setLoadError(error instanceof Error ? error.message : 'تعذر تحميل السجلات.'))
      .finally(() => setLoading(false));
  }, []);
  const qualityAudit = {
    missingSources: sites.filter(site => !Array.isArray((site as any).sources) || (site as any).sources.length === 0),
    aiAssistedPending: sites.filter(site => site.ai_assisted && site.verification_status !== 'verified'),
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('unverified');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [newStatus, setNewStatus] = useState<VerificationStatus>('verified');
  const [reason, setReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openVerificationModal = (site: Site) => {
    setSelectedSite(site);
    setNewStatus(site.verification_status);
    setReason(site.verification_notes || '');
    setIsModalOpen(true);
  };

  const handleSaveVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;
    if (!reason.trim()) {
      alert('يجب ذكر مسوغ التحقيق العلمي والمصادر المعتمدة لإتمام العملية.');
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch(`/api/v1/admin/sites/${selectedSite.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ verification_status: newStatus, reason: reason.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.errors ? Object.values(body.errors).flat().join(' ') : body.message || `تعذر الحفظ (${response.status}).`);
      setSites(current => current.map(site => String(site.id) === String(body.site.id) ? body.site : site));
      setIsModalOpen(false);
      setSelectedSite(null);
      setReason('');
      alert('تم تحديث حالة التحقيق العلمي وتوثيق المسوغ في سجل النشاط بنجاح.');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'تعذر حفظ التحقيق.');
    } finally {
      setSaving(false);
    }
  };

  const filteredSites = sites.filter(s => {
    if (statusFilter !== 'all' && s.verification_status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name_ar.toLowerCase().includes(q) ||
        s.permanent_id.toLowerCase().includes(q) ||
        (s.name_en && s.name_en.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {loadError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{loadError}</div>}
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-[#78350F]" />
            طابور التحقيق العلمي وضبط الجودة
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            الفصل الصارم بين حالة النشر (مسودة / منشور) وحالة المطابقة الأكاديمية (محقق / قيد التحقيق / محل خلاف).
          </p>
        </div>
      </div>

      {/* Quality Audit Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('unverified')}
          className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100/60 transition-colors"
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-medium">
            <span>بانتظار التحقيق المكتبي</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-950 mt-2">
            {sites.filter(s => s.verification_status === 'unverified').length}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">سجلات مسودة أو مستوردة</div>
        </div>

        <div
          onClick={() => setStatusFilter('disputed')}
          className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl cursor-pointer hover:bg-rose-100/60 transition-colors"
        >
          <div className="flex items-center justify-between text-rose-800 text-xs font-medium">
            <span>محل خلاف علمي ومطابقة</span>
            <AlertTriangle className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-2xl font-bold font-serif text-rose-950 mt-2">
            {sites.filter(s => s.verification_status === 'disputed').length}
          </div>
          <div className="text-[11px] text-rose-700 mt-1">تتطلب دراسة نقدية مقارنة</div>
        </div>

        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
          <div className="flex items-center justify-between text-stone-700 text-xs font-medium">
            <span>بدون مصادر موثقة</span>
            <BookOpen className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-stone-900 mt-2">
            {qualityAudit.missingSources.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">سجلات تفتقر للمراجع</div>
        </div>

        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl">
          <div className="flex items-center justify-between text-purple-800 text-xs font-medium">
            <span>مراجعة ذكاء اصطناعي</span>
            <Sparkles className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-2xl font-bold font-serif text-purple-950 mt-2">
            {qualityAudit.aiAssistedPending.length}
          </div>
          <div className="text-[11px] text-purple-700 mt-1">بانتظار التحقق البشري الصارم</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-3 text-stone-400" />
          <input
            type="text"
            className={inputClass + ' pr-9'}
            placeholder="ابحث بالاسم أو الرقم الأرشيفي..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'unverified', label: 'غير محقق' },
            { id: 'partially_verified', label: 'محقق جزئياً' },
            { id: 'disputed', label: 'محل خلاف' },
            { id: 'unknown', label: 'مجهول' },
            { id: 'verified', label: 'محقق علمياً' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-[#78350F] text-white font-bold'
                  : 'bg-white border border-[#E8E2D8] text-stone-600 hover:bg-stone-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Site Verification Table */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#FAF8F5] text-stone-700 border-b border-[#E8E2D8]">
              <tr>
                <th className="py-3 px-4 font-bold">المعلم الأثري</th>
                <th className="py-3 px-4 font-bold">حالة التحقيق</th>
                <th className="py-3 px-4 font-bold">حالة النشر</th>
                <th className="py-3 px-4 font-bold">المصادر</th>
                <th className="py-3 px-4 font-bold">آخر مراجعة / المحقق</th>
                <th className="py-3 px-4 font-bold text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {loading && <tr><td colSpan={6} className="py-8 text-center text-stone-500">جارٍ تحميل سجلات قاعدة البيانات…</td></tr>}
              {filteredSites.map(site => (
                <tr key={site.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-stone-900">{site.name_ar}</div>
                    <div className="text-[11px] font-mono text-stone-500">{site.permanent_id}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <VerificationBadge status={site.verification_status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        site.publication_status === 'published'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : site.publication_status === 'draft'
                          ? 'bg-stone-100 text-stone-700 border border-stone-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {site.publication_status === 'published' ? 'منشور للعامة' : site.publication_status === 'draft' ? 'مسودة داخلية' : 'مؤرشف'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-stone-700">
                    {site.source_count > 0 ? (
                      <span className="text-emerald-700 font-bold">{site.source_count} مرجع</span>
                    ) : (
                      <span className="text-rose-600 font-bold">0 مراجع</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-stone-600 text-[11px]">
                    <div>{site.last_reviewed_at || '—'}</div>
                    <div className="text-stone-400">{site.verified_by || 'لم يعيّن'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => openVerificationModal(site)}
                      className={ghostBtn + ' text-xs py-1 px-3'}
                    >
                      تحقيق السجل
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    لا توجد معالم مطابقة لتصنيف التحقيق الحالي.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Rationale Modal */}
      {isModalOpen && selectedSite && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E8E2D8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#E8E2D8] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  قرار التحقيق والمطابقة الأكاديمية
                </h2>
                <div className="text-xs text-stone-500 font-mono mt-0.5">
                  {selectedSite.name_ar} ({selectedSite.permanent_id})
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
            <form onSubmit={handleSaveVerification} className="p-5 space-y-4">
              <div>
                <label className={labelClass}>حالة التحقيق العلمي المعتمدة *</label>
                <select
                  className={inputClass}
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as VerificationStatus)}
                >
                  <option value="verified">محقق علمياً (مطابق للمصادر الأكاديمية الموثقة)</option>
                  <option value="partially_verified">محقق جزئياً (يتطلب مصادر إضافية أو تدقيق ميداني)</option>
                  <option value="unverified">غير محقق (معلومات أولية قيد البحث)</option>
                  <option value="disputed">محل خلاف علمي (تباين بين الروايات التاريخية والمصادر)</option>
                  <option value="unknown">مجهول الحالة</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>مسوغ القرار وسند المطابقة العلمية * (إلزامي للتوثيق والنزاهة)</label>
                <textarea
                  required
                  rows={4}
                  className={inputClass}
                  placeholder="بيّن المراجع الأكاديمية المعتمدة، وسجلات المسح الآثاري، أو أسباب الشك والخلاف المعرفي..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  سياسة النزاهة والشفافية التوثيقية:
                </div>
                <p>
                  سيتم تسجيل اسمك ({actorName}) وتاريخ اليوم ومسوغ القرار في سجل التدقيق الأرشيفي غير القابل للمحو.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className={primaryBtn + ' flex-1 disabled:opacity-60'}>{saving ? 'جارٍ الحفظ…' : 'اعتماد وحفظ القرار'}</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className={ghostBtn}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
