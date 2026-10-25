import React from 'react';
import { archiveDB } from '../../db/archiveStore';
import { formatNumeral } from '../../utils/arabic';
import { ArrowUp } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string, param?: string) => void;
  numeralSystem?: 'arabic' | 'latin';
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  numeralSystem = 'latin',
}) => {
  const stats = archiveDB.getArchiveStatistics();

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1C1917] text-[#D6CEBE] border-t border-stone-800 mt-16 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity & Editorial Mission */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#78350F] text-[#FBF9F5] flex items-center justify-center font-bold font-serif text-lg">
                أ
              </div>
              <div>
                <span className="text-xl font-serif font-bold text-stone-100 block">أثر كربلاء</span>
                <span className="text-[10px] tracking-wider uppercase text-stone-400 block font-mono">
                  Karbala Heritage Archive
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
              سجل رقمي توثيقي مكرّس لجمع وتحقيق المعالم والمواقع الأثرية والتاريخية في محافظة كربلاء، العراق. يعتمد الإسناد الأكاديمي، التحقيق المعماري، وتوثيق المصادر الحصرية والميدانية.
            </p>
            <div className="pt-1">
              <span className="inline-block text-xs text-amber-300 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded">
                المحتوى التجريبي مؤشّر بـ «بيانات تجريبية» للأمانة المعرفية
              </span>
            </div>
          </div>

          {/* Col 2: Navigation & Archival Sections */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-200 font-serif">
              أقسام الأرشيف
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-300">
              <li>
                <button onClick={() => onNavigate('registry')} className="hover:text-white transition-colors cursor-pointer">
                  سجل المواقع الشامل (A-Z)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('map')} className="hover:text-white transition-colors cursor-pointer">
                  الخريطة الطوبوغرافية والأثرية
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('timeline')} className="hover:text-white transition-colors cursor-pointer">
                  الخط الزمني للحقب التاريخية
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('hierarchy')} className="hover:text-white transition-colors cursor-pointer">
                  تصفح المناطق والبوادي
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('lost_sites')} className="hover:text-white transition-colors cursor-pointer">
                  المواقع المندثرة والمفقودة
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('under_research')} className="hover:text-white transition-colors cursor-pointer">
                  مواقع قيد التحقيق الميداني
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Knowledge, Provenance & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-200 font-serif">
              المعرفة والإسناد
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-300">
              <li>
                <button onClick={() => onNavigate('sources')} className="hover:text-white transition-colors cursor-pointer">
                  فهرس المصادر والمراجع (Bibliography)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('encyclopedia')} className="hover:text-white transition-colors cursor-pointer">
                  المعجم الموسوعي للمصطلحات
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('methodology')} className="hover:text-white transition-colors cursor-pointer">
                  منهجية التحقيق وسياسة الذكاء الاصطناعي
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('changelog')} className="hover:text-white transition-colors cursor-pointer">
                  سجل التعديلات وما استجدّ
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Institutional & Legal Rigor */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-200 font-serif">
              الشفافية والسياسات
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-300">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">
                  عن المشروع وهيئة التحرير والتواصل
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors cursor-pointer">
                  سياسة الخصوصية وحفظ البيانات
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('copyright')} className="hover:text-white transition-colors cursor-pointer">
                  سياسة حقوق الملكية الفكرية واستخدام الصور
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors cursor-pointer">
                  شروط الاستخدام وسياسة المساهمات المجتمعية
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('data_policy')} className="hover:text-white transition-colors cursor-pointer">
                  حماية وتعتيم الإحداثيات الحساسة
                </button>
              </li>
            </ul>

            {/* Dynamic Latest Update Date */}
            <div className="pt-2">
              <span className="text-[11px] text-stone-400 font-mono block">
                آخر تحديث للبيانات: {stats.latestReviewDate}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-5 border-t border-stone-800 text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} أثر كربلاء — الأرشيف الرقمي للتراث والآثار. جميع الحقوق المعنوية محفوظة للباحثين والمصورين والجهات الموثقة.
          </p>
          <div className="flex items-center gap-4 text-stone-300">
            <span>العراق · محافظة كربلاء</span>
            <span>·</span>
            <button
              onClick={handleScrollTop}
              className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <span>إلى الأعلى</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
