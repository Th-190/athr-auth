import React from 'react';
import { archiveDB } from '../../../db/archiveStore';
import { AdminSection } from '../../../types/cms';
import { Landmark, BookOpen, Image, ShieldAlert, FileText, Users } from 'lucide-react';

interface Props {
  onOpen?: (section: AdminSection) => void;
  onNavigateSection?: (section: AdminSection) => void;
}

export const DashboardHome: React.FC<Props> = ({ onOpen, onNavigateSection }) => {
  const navigate = onNavigateSection || onOpen || (() => {});
  const stats = archiveDB.getArchiveStatistics();
  const all = archiveDB.getAllSites(true);
  const drafts = all.filter(s => s.publication_status === 'draft' || s.publication_status === 'pending_review');
  const pendingVerify = all.filter(
    s => s.publication_status === 'published' && s.verification_status !== 'verified'
  );
  const contributions = archiveDB.getContributions().filter(c => c.status === 'pending_review');
  const reports = archiveDB.getReports().filter(r => r.status === 'pending');
  const quality = archiveDB.runDataQualityAudit();

  const cards = [
    { label: 'المعالم المنشورة', value: stats.totalSites, section: 'sites' as const, icon: Landmark },
    { label: 'مسودات بانتظار النشر', value: drafts.length, section: 'sites' as const, icon: FileText },
    { label: 'سجلات تحتاج تحقيقاً', value: pendingVerify.length, section: 'verification' as const, icon: ShieldAlert },
    { label: 'مواد الموسوعة', value: archiveDB.getEncyclopedia().length, section: 'encyclopedia' as const, icon: BookOpen },
    { label: 'الصور في المكتبة', value: archiveDB.getAllImages().length, section: 'media' as const, icon: Image },
    { label: 'مساهمات وبلاغات معلّقة', value: contributions.length + reports.length, section: 'editorial' as const, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-[#78350F]">هيئة التحرير</p>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">لوحة إدارة الأرشيف</h1>
        <p className="text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
          من هنا تُدار السجلات الظاهرة للزوّار: المعالم، الموسوعة، المصادر، الواجهة والإعدادات. حالة النشر مستقلة عن حالة التحقيق؛ النشر لا يعني التحقق.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(card => (
          <button
            key={card.label}
            onClick={() => navigate(card.section)}
            className="text-right bg-white border border-[#E8E2D8] rounded-xl p-4 hover:border-[#78350F]/40 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-stone-500">{card.label}</p>
                <p className="text-3xl font-serif font-bold text-stone-900 tabular-nums mt-1">{card.value}</p>
              </div>
              <card.icon className="w-5 h-5 text-[#78350F]" />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5">
        <h2 className="font-serif font-bold text-stone-900 mb-2">فحوص جودة البيانات</h2>
        <p className="text-sm text-stone-600 mb-4">
          {quality.totalIssues} ملاحظة تحتاج مراجعة تحريرية (مصادر ناقصة، حقوق صور، إحداثيات، أو محتوى مُساعَد بالذكاء الاصطناعي بلا تحقيق).
        </p>
        <button
          onClick={() => navigate('editorial')}
          className="text-sm text-[#78350F] font-medium underline cursor-pointer"
        >
          فتح طابور التحرير والجودة ←
        </button>
      </div>
    </div>
  );
};
