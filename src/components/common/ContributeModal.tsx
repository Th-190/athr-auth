import React, { useState } from 'react';
import { archiveDB } from '../../db/archiveStore';
import { Send, CheckCircle2, X, PlusCircle } from 'lucide-react';

interface ContributeModalProps {
  onClose: () => void;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({ onClose }) => {
  const [type, setType] = useState<
    'suggest_site' | 'suggest_photo' | 'suggest_correction' | 'suggest_source'
  >('suggest_site');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [allowPublicCredit, setAllowPublicCredit] = useState(true);
  const [rightsDeclaration, setRightsDeclaration] = useState(
    'أشهد بأن المعلومات أو المواد المرفقة موثوقة ومطابقة للأمانة العلمية وقواعد الملكية الفكرية.'
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    archiveDB.submitContribution({
      type,
      title,
      description,
      source_reference: sourceReference,
      contributor_name: contributorName || 'باحث مستقل',
      contributor_email: contributorEmail,
      allow_public_credit: allowPublicCredit,
      rights_declaration: rightsDeclaration,
    });

    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FBF9F5] border border-stone-300 rounded max-w-xl w-full p-6 space-y-5 shadow-xl relative animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
          <div className="p-2 bg-[#EFECE6] text-[#78350F] rounded">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-stone-900">
              المساهمة في توثيق تراث كربلاء
            </h3>
            <p className="text-xs text-stone-500">
              تخضع جميع المساهمات لمراجعة هيئة التحرير والتدقيق الأكاديمي قبل النشر
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
            <h4 className="text-sm font-bold text-stone-900">تم تسجيل مساهمتكم بنجاح</h4>
            <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
              أُدرجت المساهمة في طابور المراجعة والتدقيق المكتبي (حالة: قيد المراجعة). لن يُنشر أي محتوى تلقائياً دون فحص مصادره. شكراً لإثرائكم الأرشيف.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 block">
                نوع المساهمة المقترحة
              </label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
              >
                <option value="suggest_site">اقتراح توثيق موقع أو تل أثري جديد</option>
                <option value="suggest_photo">إرسال لوحة فوتوغرافية تاريخية أو حديثة</option>
                <option value="suggest_source">إضافة مصدر أو دراسة أكاديمية أو وثيقة وقفية</option>
                <option value="suggest_correction">اقتراح تعديل أو تصويب معماري</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 block">
                عنوان المساهمة أو اسم المعلم المقترح <span className="text-rose-600">*</span>
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: خان المصلى القديم أو تل أثري في بادية عين التمر..."
                className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 block">
                الوصف والملاحظات الميدانية <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اذكر موقع المعلم، تاريخه المقدر، حالته الراهنة، وأية تفاصيل معمارية..."
                className="w-full bg-white border border-stone-300 rounded p-2.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 block">
                المصادر أو المراجع المستند إليها
              </label>
              <input
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="اسم الكتاب، الوثيقة، رقم الصفحة، أو شهادة الأهالي..."
                className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">
                  اسم الباحث / المساهم
                </label>
                <input
                  type="text"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="الاسم الثلاثي أو اللقب العلمي"
                  className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">
                  البريد الإلكتروني للتواصل
                </label>
                <input
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-200">
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPublicCredit}
                  onChange={(e) => setAllowPublicCredit(e.target.checked)}
                  className="rounded text-amber-800 focus:ring-amber-700"
                />
                <span>أوافق على ذكر اسمي كباحث مساهم في سجل المعلم بعد اعتماده</span>
              </label>
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
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#78350F] hover:bg-[#9A3412] rounded transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال المساهمة للمراجعة</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
