import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../../services/apiFetch';

interface ReportRow {
  id: number;
  target_type: string;
  target_id: number;
  target_name: string;
  reason_category: string;
  reporter_email: string | null;
  details: string;
  suggested_correction: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  resolution_note: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  wrong_information: 'معلومة غير دقيقة', incorrect_source: 'عزو أو مصدر غير صحيح',
  wrong_image: 'صورة لا تخص السجل', wrong_image_rights: 'حقوق الصورة أو نسبتها',
  wrong_location: 'الموقع الجغرافي', offensive_content: 'محتوى غير لائق', other: 'ملاحظة أخرى',
};
const TARGET_LABELS: Record<string, string> = { site: 'سجل موقع', image: 'صورة أرشيفية', source: 'مصدر' };

export const ReportsManager: React.FC = () => {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [status, setStatus] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch(`/api/v1/admin/reports?status=${status}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'تعذر تحميل البلاغات.');
      setReports(Array.isArray(payload.data) ? payload.data : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void refresh(); }, [refresh]);

  const updateReport = async (report: ReportRow, nextStatus: 'resolved' | 'dismissed') => {
    const note = notes[report.id]?.trim() || '';
    if (!note) {
      setError('أضف ملاحظة مراجعة قبل إغلاق البلاغ.');
      return;
    }
    setBusyId(report.id);
    setError('');
    try {
      const response = await apiFetch(`/api/v1/admin/reports/${report.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, resolution_note: note }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'تعذر تحديث حالة البلاغ.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="reports-manager-title">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h1 id="reports-manager-title" className="text-2xl font-serif font-bold text-stone-900">بلاغات تصويب الأرشيف</h1>
          <p className="mt-1 text-sm text-stone-600">بلاغات الزوار محفوظة في قاعدة بيانات الأرشيف وتُراجع هنا.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="report-status" className="text-sm text-stone-700">الحالة</label>
          <select id="report-status" value={status} onChange={event => setStatus(event.target.value as typeof status)} className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm">
            <option value="pending">قيد المراجعة</option>
            <option value="resolved">تمت المعالجة</option>
            <option value="dismissed">مستبعدة</option>
          </select>
          <button type="button" onClick={() => void refresh()} className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm hover:bg-stone-50">تحديث</button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading ? <p role="status" className="p-6 text-center text-stone-600">جارٍ تحميل البلاغات…</p> : reports.length === 0 ? <p className="rounded-lg border border-stone-200 bg-white p-8 text-center text-stone-600">لا توجد بلاغات بهذه الحالة.</p> : (
        <ul className="space-y-4">
          {reports.map(report => (
            <li key={report.id} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-stone-900">{report.target_name}</h2>
                  <p className="mt-1 text-xs text-stone-600">{CATEGORY_LABELS[report.reason_category] || 'ملاحظة توثيقية'} · {TARGET_LABELS[report.target_type] || 'سجل أرشيفي'}</p>
                </div>
                <time className="text-xs text-stone-500" dateTime={report.created_at}>{new Date(report.created_at).toLocaleString('ar-IQ')}</time>
              </div>
              <p className="whitespace-pre-wrap leading-7 text-stone-800">{report.details}</p>
              {report.suggested_correction && <p className="rounded-md bg-amber-50 p-3 text-sm leading-6 text-stone-800"><strong>التصويب المقترح: </strong>{report.suggested_correction}</p>}
              {report.reporter_email && <p className="text-xs text-stone-600">بريد للتواصل: <bdi>{report.reporter_email}</bdi></p>}
              {report.status === 'pending' ? (
                <div className="space-y-2 border-t border-stone-200 pt-3">
                  <label className="block text-sm font-medium text-stone-800" htmlFor={`report-note-${report.id}`}>ملاحظة المراجعة <span className="text-stone-500">(مطلوبة للإغلاق)</span></label>
                  <textarea id={`report-note-${report.id}`} rows={2} maxLength={2000} value={notes[report.id] || ''} onChange={event => setNotes(current => ({ ...current, [report.id]: event.target.value }))} className="w-full rounded-lg border border-stone-300 p-3 text-sm" />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busyId === report.id} onClick={() => void updateReport(report, 'resolved')} className="min-h-11 rounded-lg bg-[#78350F] px-4 text-sm font-semibold text-white disabled:opacity-50">اعتماد المعالجة</button>
                    <button type="button" disabled={busyId === report.id} onClick={() => void updateReport(report, 'dismissed')} className="min-h-11 rounded-lg border border-stone-400 px-4 text-sm text-stone-800 disabled:opacity-50">استبعاد البلاغ</button>
                  </div>
                </div>
              ) : report.resolution_note && <p className="border-t border-stone-200 pt-3 text-sm text-stone-700"><strong>ملاحظة المراجعة: </strong>{report.resolution_note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
