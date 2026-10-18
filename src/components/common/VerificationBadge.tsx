import React from 'react';
import { VerificationStatus, LocationPrecision } from '../../types';
import { CheckCircle2, AlertCircle, HelpCircle, ShieldAlert, Clock } from 'lucide-react';

interface VerificationBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  size = 'md',
  showDescription = false,
}) => {
  const configs = {
    verified: {
      label: 'مُحقَّق ومسنَد',
      sub: 'خضع للفحص المكتبي والمطابقة مع المصادر المعتمدة',
      icon: CheckCircle2,
      style: 'text-stone-800 bg-[#EFECE6] border border-stone-300',
      dot: 'bg-emerald-700',
    },
    partially_verified: {
      label: 'محقَّق جزئياً',
      sub: 'ثبتت بعض معالمه وما تزال جوانب أخرى قيد التدقيق',
      icon: Clock,
      style: 'text-stone-800 bg-[#F5F2EB] border border-amber-300',
      dot: 'bg-amber-600',
    },
    unverified: {
      label: 'غير محقَّق بعد',
      sub: 'سجل أولي بانتظار إسناد المصادر والتحقيق الميداني',
      icon: HelpCircle,
      style: 'text-stone-600 bg-stone-100 border border-stone-200',
      dot: 'bg-stone-400',
    },
    disputed: {
      label: 'محل خلاف تاريخي',
      sub: 'توجد روايات أكاديمية متنافسة معروضة بإنصاف',
      icon: AlertCircle,
      style: 'text-amber-900 bg-amber-50 border border-amber-300',
      dot: 'bg-amber-700',
    },
    unknown: {
      label: 'غير محدد',
      sub: 'لم يتم تصنيف حالة التحقيق بعد',
      icon: ShieldAlert,
      style: 'text-stone-500 bg-stone-50 border border-stone-200',
      dot: 'bg-stone-300',
    },
  };

  const config = configs[status] || configs.unknown;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <div className="inline-flex flex-col gap-0.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded font-medium ${sizeClasses[size]} ${config.style}`}
        title={config.sub}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
        <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{config.label}</span>
      </span>
      {showDescription && (
        <span className="text-[11px] text-stone-500 mt-0.5">{config.sub}</span>
      )}
    </div>
  );
};

interface LocationPrecisionBadgeProps {
  precision: LocationPrecision;
}

export const LocationPrecisionBadge: React.FC<LocationPrecisionBadgeProps> = ({ precision }) => {
  if (precision === 'restricted') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded"
        title="الإحداثيات الدقيقة محجوبة عن الجمهور لحماية الموقع الأثري من النبش والتعديات"
      >
        <ShieldAlert className="w-3 h-3" />
        <span>إحداثيات محجوبة احترازياً</span>
      </span>
    );
  }

  if (precision === 'approximate') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded"
        title="الإحداثيات تمثل المنطقة العامة المحيطة بالمعلم"
      >
        <Clock className="w-3 h-3" />
        <span>إحداثيات تقريبية</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-stone-700 bg-[#EAE6DF] border border-stone-300 px-2 py-0.5 rounded"
      title="إحداثيات مساحية دقيقة ومثبتة ميدانياً"
    >
      <CheckCircle2 className="w-3 h-3 text-stone-600" />
      <span>إحداثيات دقيقة</span>
    </span>
  );
};
