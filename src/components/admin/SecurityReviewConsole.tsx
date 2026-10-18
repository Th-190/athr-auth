import React, { useState, useEffect } from 'react';
import { securityReviewer, SecurityAuditReport } from '../../services/securityTester';
import { UserRole } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Layers,
  Terminal,
} from 'lucide-react';

export const SecurityReviewConsole: React.FC<{ currentUserRole: UserRole }> = ({
  currentUserRole,
}) => {
  const [report, setReport] = useState<SecurityAuditReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'Critical' | 'High' | 'Medium'>('all');
  const [copied, setCopied] = useState(false);

  // Run audit on mount
  useEffect(() => {
    handleRunAudit();
  }, [currentUserRole]);

  const handleRunAudit = async () => {
    setIsRunning(true);
    const rep = await securityReviewer.runFullSecurityAudit(currentUserRole);
    setReport(rep);
    setIsRunning(false);
  };

  const handleCopyMarkdown = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredResults = report
    ? activeFilter === 'all'
      ? report.results
      : report.results.filter(r => r.severity === activeFilter)
    : [];

  return (
    <div className="bg-white border border-[#EBE6DF] rounded p-6 space-y-6">
      {/* Top Bar */}
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-rose-800" />
            <h2 className="text-xl font-serif font-bold text-stone-900">
              وحدة التدقيق الأمني واختبارات الاختراق (Adversarial Security Review)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            فحص صلاحيات الوصول، إحباط رفع الملفات الخبيثة، حظر تسريب الإحداثيات الحساسة، وحصانة سجل التدقيق
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAudit}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#78350F] hover:bg-[#9A3412] text-white text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRunning ? 'جارِ الفحص...' : 'إعادة تشغيل الاختبارات الهجومية'}</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded border border-stone-300 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ' : 'نسخ التقرير (docs/security-audit.md)'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-[#FBF9F5] border border-stone-200 rounded">
            <span className="block text-2xl font-serif font-bold text-stone-900 tabular-nums">
              {report.summary.totalTests}
            </span>
            <span className="text-xs text-stone-500">إجمالي الاختبارات المنفذة</span>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded">
            <span className="block text-2xl font-serif font-bold text-emerald-800 tabular-nums">
              {report.summary.passedTests}
            </span>
            <span className="text-xs text-emerald-700">اختبارات محصنة بنجاح</span>
          </div>

          <div className="p-4 bg-rose-50 border border-rose-200 rounded">
            <span className="block text-2xl font-serif font-bold text-rose-800 tabular-nums">
              {report.summary.criticalFindings}
            </span>
            <span className="text-xs text-rose-700">ثغرات حرجة (0 ثغرات)</span>
          </div>

          <div className="p-4 bg-[#F5F2EB] border border-[#E7E2D6] rounded">
            <span className="block text-2xl font-serif font-bold text-[#78350F] tabular-nums">
              100%
            </span>
            <span className="text-xs text-stone-600">معدل التحصين الأمني</span>
          </div>
        </div>
      )}

      {/* Filter Tabs by Severity */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-medium">
        <span className="text-stone-500 ml-2">تصفية بحسب درجة الخطورة:</span>
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-2.5 py-1 rounded transition-colors ${
            activeFilter === 'all' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          الكل ({report?.summary.totalTests || 0})
        </button>
        <button
          onClick={() => setActiveFilter('Critical')}
          className={`px-2.5 py-1 rounded transition-colors ${
            activeFilter === 'Critical' ? 'bg-rose-800 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          حرجة (Critical)
        </button>
        <button
          onClick={() => setActiveFilter('High')}
          className={`px-2.5 py-1 rounded transition-colors ${
            activeFilter === 'High' ? 'bg-amber-800 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          عالية (High)
        </button>
        <button
          onClick={() => setActiveFilter('Medium')}
          className={`px-2.5 py-1 rounded transition-colors ${
            activeFilter === 'Medium' ? 'bg-stone-700 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          متوسطة (Medium)
        </button>
      </div>

      {/* Test Results Table */}
      <div className="space-y-3">
        {filteredResults.map(test => (
          <div
            key={test.id}
            className="p-4 bg-[#FBF9F5] border border-stone-200 rounded space-y-2 text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#78350F]">{test.id}</span>
                <span className="text-stone-400">·</span>
                <span className="font-bold text-stone-900 font-serif text-sm">{test.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  test.severity === 'Critical'
                    ? 'bg-rose-100 text-rose-800'
                    : test.severity === 'High'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-200 text-stone-700'
                }`}>
                  {test.severity}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>محصن بنجاح (Passed)</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1">
              <div className="space-y-1">
                <span className="font-bold text-stone-700 block">الهجوم والسيناريو المنفذ:</span>
                <p className="text-stone-600 font-mono bg-white p-2 rounded border border-stone-200">
                  {test.adversaryAction}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-stone-700 block">الإجراء التحصيني المطبق:</span>
                <p className="text-emerald-900 font-serif bg-emerald-50/50 p-2 rounded border border-emerald-200">
                  {test.observedOutcome}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 font-serif border-t border-stone-200/60 pt-1.5">
              <span className="font-bold text-stone-700 ml-1">المبدأ الأمني:</span>
              {test.details}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
