import React from 'react';
import { Type, Eye, Hash, X, Check } from 'lucide-react';

export interface ReadingPreferences {
  fontSize: 'normal' | 'medium' | 'large';
  highContrast: boolean;
  numeralSystem: 'arabic' | 'latin';
}

interface ReadingPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: ReadingPreferences;
  onUpdatePreferences: (newPrefs: Partial<ReadingPreferences>) => void;
}

export const ReadingPreferencesModal: React.FC<ReadingPreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="تفضيلات راحة القراءة والعرض"
    >
      <div
        className="w-full max-w-md bg-[#FBF9F5] border border-stone-300 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#78350F]" />
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900">
                تفضيلات القراءة والعرض
              </h2>
              <span className="text-xs text-stone-500">
                تخصيص سهولة القراءة وتناسق الأرقام والتباين
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 text-sm">
          {/* 1. Font Size */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-[#78350F]" />
              <span>حجم الخط والنصوص:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'عادي (100%)' },
                { id: 'medium', label: 'متوسط (110%)' },
                { id: 'large', label: 'كبير (120%)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => onUpdatePreferences({ fontSize: opt.id as any })}
                  className={`py-2 px-3 text-xs rounded border text-center transition-colors cursor-pointer ${
                    preferences.fontSize === opt.id
                      ? 'bg-[#78350F] text-white border-[#78350F] font-bold shadow-2xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:border-stone-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Numeral System */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-[#78350F]" />
              <span>نظام كتابة الأرقام:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdatePreferences({ numeralSystem: 'arabic' })}
                className={`py-2 px-3 text-xs rounded border text-center transition-colors cursor-pointer ${
                  preferences.numeralSystem === 'arabic'
                    ? 'bg-[#78350F] text-white border-[#78350F] font-bold shadow-2xs'
                    : 'bg-white text-stone-800 border-stone-300 hover:border-stone-400'
                }`}
              >
                أرقام مشرقية (١، ٢، ٣)
              </button>
              <button
                onClick={() => onUpdatePreferences({ numeralSystem: 'latin' })}
                className={`py-2 px-3 text-xs rounded border text-center transition-colors cursor-pointer ${
                  preferences.numeralSystem === 'latin'
                    ? 'bg-[#78350F] text-white border-[#78350F] font-bold shadow-2xs'
                    : 'bg-white text-stone-800 border-stone-300 hover:border-stone-400'
                }`}
              >
                أرقام لاتينية (1, 2, 3)
              </button>
            </div>
          </div>

          {/* 3. High Contrast Mode */}
          <div className="pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-800 block">نمط عالي التباين (High Contrast)</span>
                <span className="text-[11px] text-stone-500">
                  يزيد وضوح الحواف والخطوط والنصوص لقراءة مريحة
                </span>
              </div>
              <button
                onClick={() => onUpdatePreferences({ highContrast: !preferences.highContrast })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  preferences.highContrast ? 'bg-[#78350F] justify-end' : 'bg-stone-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-200 bg-stone-50 px-5 py-3 flex items-center justify-between text-xs text-stone-500">
          <span>يتم حفظ التفضيلات على جهازك تلقائياً</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#78350F] hover:bg-[#9A3412] text-white text-xs font-medium rounded"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
