import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../services/apiFetch';
import { AuditLogEntry } from '../../../types';
import { inputClass, ghostBtn } from './formStyles';
import { Shield, Search, Filter, History, RefreshCw, Lock, Terminal } from 'lucide-react';

export const AuditLogManager: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), per_page: '50' });
    if (search.trim()) params.set('q', search.trim());
    if (actionFilter !== 'all') params.set('action', actionFilter);
    if (entityFilter !== 'all') params.set('entity_type', entityFilter);
    setLoading(true); setError('');
    void apiFetch(`/api/v1/admin/audit-logs?${params}`, { headers: { Accept: 'application/json' } })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || `تعذر تحميل سجل التدقيق (${response.status}).`);
        if (cancelled) return;
        setLogs((body.data || []).map((entry: any) => ({
          id: String(entry.id), action: entry.action, entity_type: entry.entity_type,
          entity_id: String(entry.entity_identifier || entry.entity_id || ''),
          performed_by: entry.actor_name || entry.user?.name || 'غير معروف',
          ip_hash: entry.ip_hash || '', details: entry.details || '', created_at: entry.created_at || '',
        })));
        setLastPage(Number(body.last_page || 1));
      })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'تعذر تحميل سجل التدقيق.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, actionFilter, entityFilter, page]);

  const actions = Array.from(new Set(logs.map(l => l.action))).filter(Boolean);
  const entities = Array.from(new Set(logs.map(l => l.entity_type))).filter(Boolean);

  const filtered = logs;

  const getActionBadgeClass = (action: string) => {
    if (action.includes('delete') || action.includes('rejected')) return 'bg-rose-50 text-rose-800 border-rose-200';
    if (action.includes('verification') || action.includes('verified')) return 'bg-purple-50 text-purple-800 border-purple-200';
    if (action.includes('create') || action.includes('save') || action.includes('add'))
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <History className="w-6 h-6 text-[#78350F]" />
            سجل النشاط والتدقيق الأرشيفي
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            سجل تدقيق رقمي متسلسل وغير قابل للتعديل يوثق كافة التحركات، القرارات التوثيقية، وتعديلات المحتوى.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-stone-100 text-stone-700 text-xs rounded-lg border border-stone-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span>سجل الخادم ({filtered.length} قيد في هذه الصفحة)</span>
          </div>
          <button onClick={() => setPage(1)} className={ghostBtn + ' flex items-center gap-1 text-xs py-1.5'}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-3 text-stone-400" />
          <input
            type="text"
            className={inputClass + ' pr-9'}
            placeholder="بحث بالمسؤول، الكيان، الإجراء، أو التفاصيل..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <select
            className={inputClass + ' w-auto text-xs'}
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="all">كافة الإجراءات</option>
            {actions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            className={inputClass + ' w-auto text-xs'}
            value={entityFilter}
            onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
          >
            <option value="all">كافة الكيانات</option>
            {entities.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#FAF8F5] text-stone-700 border-b border-[#E8E2D8]">
              <tr>
                <th className="py-3 px-4 font-bold">التوقيت</th>
                <th className="py-3 px-4 font-bold">المستخدم المنفذ</th>
                <th className="py-3 px-4 font-bold">نوع الإجراء</th>
                <th className="py-3 px-4 font-bold">الكيان / المعرف</th>
                <th className="py-3 px-4 font-bold">التفاصيل والمسوغ</th>
                <th className="py-3 px-4 font-bold">رمز الجلسة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {loading && <tr><td colSpan={6} className="py-5 text-center text-stone-500">جارٍ تحميل السجل من الخادم…</td></tr>}
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                    {entry.created_at}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-stone-900 whitespace-nowrap">
                    {entry.performed_by}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded border text-[10px] font-mono font-medium ${getActionBadgeClass(
                        entry.action
                      )}`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                    <span className="font-semibold text-stone-800">{entry.entity_type}</span>
                    <span className="text-stone-400 mx-1">/</span>
                    <span className="font-mono text-stone-600">{entry.entity_id}</span>
                  </td>
                  <td className="py-3.5 px-4 text-stone-700 max-w-md leading-relaxed">
                    {entry.details}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-stone-400 whitespace-nowrap">
                    {entry.ip_hash ? `${entry.ip_hash.substring(0, 14)}…` : '—'}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    لا توجد قيود تدقيق مطابقة لبحثك.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-stone-600">
        <button type="button" className={ghostBtn} disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}>السابق</button>
        <span>الصفحة {page} من {lastPage}</span>
        <button type="button" className={ghostBtn} disabled={page >= lastPage || loading} onClick={() => setPage(value => value + 1)}>التالي</button>
      </div>
    </div>
  );
};
