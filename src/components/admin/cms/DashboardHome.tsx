import React from 'react';
import { AdminSection } from '../../../types/cms';
import { BookOpen, FileCheck2, FilePlus2, History, Image, LibraryBig, MapPinned } from 'lucide-react';

interface Props {
  onOpen?: (section: AdminSection) => void;
  onNavigateSection?: (section: AdminSection) => void;
}

const workflows: Array<{ title: string; description: string; section: AdminSection; icon: React.ElementType; primary?: boolean }> = [
  { title: 'سجل المواقع الأثرية', description: 'استعراض السجلات أو بدء تسجيل موقع جديد وحفظه كمسودة.', section: 'sites', icon: FilePlus2, primary: true },
  { title: 'تحرير السجلات والاستشهادات', description: 'تعديل المواقع والمقتنيات، وإدارة مصادرها وقرارات النشر والمراجعة.', section: 'heritage_editorial', icon: MapPinned, primary: true },
  { title: 'التحقيق والتحقق', description: 'مراجعة حالة التحقق وأسباب القرارات التحريرية.', section: 'verification', icon: FileCheck2 },
  { title: 'المصادر والمراجع', description: 'إدارة الفهارس المرجعية التي تسند بيانات السجل.', section: 'sources', icon: LibraryBig },
  { title: 'الصور والوسائط', description: 'إدارة الصور والحقوق وإتاحتها عبر المسارات المعتمدة.', section: 'media', icon: Image },
  { title: 'المعجم التاريخي', description: 'إدارة المواد الموسوعية المرتبطة بالأسماء والمفاهيم التاريخية.', section: 'encyclopedia', icon: BookOpen },
  { title: 'سجل التدقيق', description: 'الرجوع إلى سجل العمليات التحريرية والإدارية.', section: 'audit', icon: History },
];

export const DashboardHome: React.FC<Props> = ({ onOpen, onNavigateSection }) => {
  const navigate = onNavigateSection || onOpen || (() => {});

  return (
    <div className="space-y-7" dir="rtl">
      <header>
        <p className="text-[11px] font-mono uppercase tracking-widest text-[#78350F]">إدارة الأرشيف</p>
        <h1 className="mt-1 text-2xl font-serif font-bold text-stone-900 sm:text-3xl">سجلات كربلاء وشواهدها</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          ابدأ من السجل أو الدليل الذي تعمل عليه. تبقى حالة النشر منفصلة عن حالة التحقق؛ نشر السجل لا يعني توثيقه.
        </p>
      </header>

      <section aria-labelledby="record-workflows" className="space-y-3">
        <h2 id="record-workflows" className="font-serif text-lg font-bold text-stone-900">مهام الأرشفة</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {workflows.map(({ title, description, section, icon: Icon, primary }) => (
            <button
              key={section}
              type="button"
              onClick={() => navigate(section)}
              className={`rounded-xl border p-4 text-right transition-colors hover:border-[#78350F]/50 hover:bg-amber-50/40 ${primary ? 'border-[#C9A77A] bg-white' : 'border-[#E8E2D8] bg-white'}`}
            >
              <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5F1EA] text-[#78350F]"><Icon className="h-5 w-5" /></span>
              <span className="block font-semibold text-stone-900">{title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-stone-600">{description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
