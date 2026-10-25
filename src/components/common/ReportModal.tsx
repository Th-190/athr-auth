import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../services/apiFetch';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ReportModalProps {
  targetType: 'site' | 'image' | 'source';
  targetId: string;
  targetName: string;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  targetType,
  targetId,
  targetName,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [reasonCategory, setReasonCategory] = useState<
    'wrong_information' | 'incorrect_source' | 'wrong_image' | 'wrong_image_rights' | 'wrong_location' | 'offensive_content' | 'other'
  >('wrong_information');
  const [details, setDetails] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab' && dialogRef.current) {
        const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
        ));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !details.trim()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await apiFetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason_category: reasonCategory,
          details: details.trim(),
          suggested_correction: suggestedCorrection.trim() || null,
          reporter_email: reporterEmail.trim() || null,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const validationMessages = Object.values(result.errors || {}).flat() as string[];
        setSubmitError(validationMessages[0] || result.message || 'تعذر إرسال البلاغ. تحقق من الاتصال وحاول مجدداً.');
        return;
      }
      setIsSubmitted(true);
    } catch {
      setSubmitError('تعذر الاتصال بالأرشيف. لم يُحفظ البلاغ؛ حاول مجدداً لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-reading-exempt="true" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="report-modal-title" className="bg-[#FBF9F5] border border-stone-300 rounded max-w-lg w-full max-h-[90dvh] overflow-y-auto p-6 space-y-5 shadow-xl relative animate-in fade-in duration-150" onClick={event => event.stopPropagation()}>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
          <div className="p-2 bg-amber-100 text-amber-900 rounded">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="report-modal-title" className="text-base font-serif font-bold text-stone-900">
              الإبلاغ عن تصحيح أو خطأ
            </h3>
            <p className="text-xs text-stone-500">
              المعني: {targetName} ({targetType === 'site' ? 'سجل موقع' : targetType === 'image' ? 'لوحة مصورة' : 'مرجع'})
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-2" role="status" aria-live="polite">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
            <h4 className="text-sm font-bold text-stone-800">تم استلام البلاغ بنجاح</h4>
            <p className="text-xs text-stone-600">
              أُحيل البلاغ إلى قائمة مراجعة هيئة التحرير. شكراً لحرصكم على دقة الأرشيف.
            </p>
            <button type="button" onClick={onClose} className="mt-3 min-h-11 rounded-md bg-[#78350F] px-5 py-2 text-sm font-semibold text-white">إغلاق</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="report-reason" className="text-xs font-semibold text-stone-700 block">
                طبيعة المشكلة أو الخطأ المرصود
              </label>
              <select
                id="report-reason"
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value as typeof reasonCategory)}
                className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
              >
                <option value="wrong_information">معلومة تاريخية أو معمارية غير دقيقة</option>
                <option value="incorrect_source">عزو مرجعي أو اقتباس غير صحيح</option>
                <option value="wrong_location">إحداثيات جغرافية أو توصيف مكاني خاطئ</option>
                <option value="wrong_image">صورة لا تخص هذا المعلم</option>
                <option value="wrong_image_rights">انتهاك لحقوق ملكية أو نسبة خاطئة للمصور</option>
                <option value="other">أمر توثيقي آخر</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="report-details" className="text-xs font-semibold text-stone-700 block">
                تفاصيل الملاحظة والخطأ المرصود <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="report-details"
                required
                minLength={10}
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="وضح الموضع الدقيق للخطأ في النص أو التاريخ أو الصورة..."
                className="w-full bg-white border border-stone-300 rounded p-2.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="report-correction" className="text-xs font-semibold text-stone-700 block">
                التصويب المقترح مع المصدر (إن وجد)
              </label>
              <input
                id="report-correction"
                type="text"
                value={suggestedCorrection}
                onChange={(e) => setSuggestedCorrection(e.target.value)}
                placeholder="مثال: الباني الصحيح هو عيسى بن موسى استناداً لكتاب كريسويل ص 65"
                className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="report-email" className="text-xs font-semibold text-stone-700 block">
                البريد الإلكتروني للباحث للتواصل (اختياري)
              </label>
              <input
                id="report-email"
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse items-stretch justify-end gap-2 border-t border-stone-200 sm:flex-row sm:items-center">
              {submitError && <p role="alert" className="me-auto text-xs text-red-800">{submitError}</p>}
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 rounded"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-medium text-white bg-[#78350F] hover:bg-[#9A3412] rounded transition-colors shadow-xs"
              >
                {isSubmitting ? 'جارٍ الإرسال…' : 'إرسال البلاغ للتحرير'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
