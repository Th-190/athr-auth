import React from 'react';
import { ArchivalLogo } from '../foundation/BrandAssets';
import { ShieldAlert, FileQuestion, Clock, AlertTriangle, Server, ArrowRight } from 'lucide-react';

interface BrandedErrorPageProps {
  code: 403 | 404 | 419 | 429 | 500;
  onGoHome: () => void;
  customMessage?: string;
}

export const BrandedErrorPage: React.FC<BrandedErrorPageProps> = ({
  code,
  onGoHome,
  customMessage,
}) => {
  const configs = {
    403: {
      title: 'ممنوع الوصول (403 Forbidden)',
      subtitle: 'صلاحيات غير كافية أو وصول إلى بيانات أثرية مقيدة',
      description:
        'الإجراء المطلوب أو السجل المحدد محمي بموجب سياسة أمن الأرشيف. يتطلب تنفيذ هذا الإجراء صلاحيات محرر معتمد، أو أن الإحداثيات محجوبة احترازياً لحماية الموقع الأثري.',
      icon: ShieldAlert,
      badgeColor: 'text-rose-900 bg-rose-50 border-rose-200',
    },
    404: {
      title: 'السجل غير موجود (404 Not Found)',
      subtitle: 'لم يتم العثور على المعلم أو الوثيقة المطلوبة',
      description:
        'المعرف الأرشيفي أو الرابط المطلوب غير مسجل في قاعدة البيانات الحالية. قد يكون الموقع قيد الإدراج والتحقيق، أو تم تغيير اسمه الأرشيفي وفق مراجعات التوثيق الأخيرة.',
      icon: FileQuestion,
      badgeColor: 'text-stone-800 bg-stone-100 border-stone-300',
    },
    419: {
      title: 'انتهت صلاحية الجلسة (419 Session Expired)',
      subtitle: 'يرجى إعادة تحديث الصفحة للمتابعة الآمنة',
      description:
        'انتهت فترة التحقق الأمني المخصصة للنموذج لتأمين البيانات ضد هجمات تزوير الطلبات (CSRF). يرجى إعادة تحميل الصفحة والمحاولة مجدداً.',
      icon: Clock,
      badgeColor: 'text-amber-900 bg-amber-50 border-amber-200',
    },
    429: {
      title: 'تجاوز معدل الطلبات (429 Rate Limit Exceeded)',
      subtitle: 'تم تقييد الوصول مؤقتاً لحماية خوادم الأرشيف',
      description:
        'تم تسجيل عدد كبير من الطلبات في فترة زمنية وجيزة. تفرض منصة أثر كربلاء حدوداً صارمة على معدل الاستعلامات العامة لحماية قواعد البيانات وتفادي الزحف الآلي العنيف.',
      icon: AlertTriangle,
      badgeColor: 'text-amber-900 bg-amber-50 border-amber-200',
    },
    500: {
      title: 'خطأ داخلي في الخادم (500 Server Error)',
      subtitle: 'حدث عارض فني يجري تدقيقه من قبل فريق الصيانة',
      description:
        'واجه النظام خطأ غير متوقع أثناء معالجة الطلب. تم تدوين تفاصيل الخلل بأمان في سجلات الخادم الداخلية دون تسريب أي مسارات أو بيانات حساسة.',
      icon: Server,
      badgeColor: 'text-rose-900 bg-rose-50 border-rose-200',
    },
  };

  const config = configs[code] || configs[500];
  const Icon = config.icon;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white border border-[#EBE6DF] rounded p-8 sm:p-10 text-center space-y-6 shadow-2xs">
        {/* Archival Seal & Icon */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#F5F2EB] border border-[#E7E2D6] flex items-center justify-center text-[#78350F]">
            <Icon className="w-8 h-8" />
          </div>
        </div>

        <div className="space-y-2">
          <span
            className={`inline-block font-mono text-xs px-2.5 py-0.5 rounded border font-bold ${config.badgeColor}`}
          >
            رمز الاستجابة {code}
          </span>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            {config.title}
          </h1>
          <p className="text-xs text-stone-500 font-medium">{config.subtitle}</p>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
          {customMessage || config.description}
        </p>

        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#78350F] hover:bg-[#9A3412] text-white text-xs font-medium rounded transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للصفحة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
