import React, { useState } from 'react';
import { archiveDB } from '../../db/archiveStore';
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
  const [reasonCategory, setReasonCategory] = useState<
    'wrong_information' | 'incorrect_source' | 'wrong_image' | 'wrong_image_rights' | 'wrong_location' | 'offensive_content' | 'other'
  >('wrong_information');
  const [details, setDetails] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    archiveDB.submitReport({
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      reason_category: reasonCategory,
      details,
      suggested_correction: suggestedCorrection,
      reporter_email: reporterEmail,
    });

    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FBF9F5] border border-stone-300 rounded max-w-lg w-full p-6 space-y-5 shadow-xl relative animate-in fade-in duration-150">
        <button
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
            <h3 className="text-base font-serif font-bold text-stone-900">
              الإبلاغ عن تصحيح أو خطأ
            </h3>
            <p className="text-xs text-stone-500">
              المعني: {targetName} ({targetType === 'site' ? 'سجل موقع' : targetType === 'image' ? 'لوحة مصورة' : 'مرجع'})
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
            <h4 className="text-sm font-bold text-stone-800">تم استلام البلاغ بنجاح</h4>
            <p className="text-xs text-stone-600">
              أُحيل البلاغ إلى قائمة مراجعة هيئة التحرير للتدقيق ومطابقة المصادر. شكراً لحرصكم على دقة الأرشيف.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 block">
                طبيعة المشكلة أو الخطأ المرصود
              </label>
              <select
                value={reasonCategory}
                onChange={(e: any) => setReasonCategory(e.target.value)}
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
              <label className="text-xs font-semibold text-stone-700 block">
                تفاصيل الملاحظة والخطأ المرصود <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="وضح الموضع الدقيق للخطأ في النص أو التاريخ أو الصورة..."
                className="w-full bg-white border border-stone-300 rounded p-2.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 block">
                التصويب المقترح مع المصدر (إن وجد)
              </label>
              <input
                type="text"
                value={suggestedCorrection}
                onChange={(e) => setSuggestedCorrection(e.target.value)}
                placeholder="مثال: الباني الصحيح هو عيسى بن موسى استناداً لكتاب كريسويل ص 65"
                className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 block">
                البريد الإلكتروني للباحث للتواصل (اختياري)
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 rounded"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium text-white bg-[#78350F] hover:bg-[#9A3412] rounded transition-colors shadow-xs"
              >
                إرسال البلاغ للتحرير
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
