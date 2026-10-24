import React, { useEffect, useRef } from 'react';
import { Type, Eye, Hash, X } from 'lucide-react';

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
  saveError: boolean;
}

export const ReadingPreferencesModal: React.FC<ReadingPreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  saveError,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-3 sm:p-5"
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-preferences-title"
      aria-describedby="reading-preferences-description"
    >
      <div
        ref={dialogRef}
        className="my-auto flex max-h-[min(90dvh,46rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-stone-300 bg-[#FBF9F5] text-stone-900 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <Eye aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#78350F]" />
            <div>
              <p className="mb-1 text-[11px] font-semibold text-stone-600">تفضيلات القراءة <span aria-hidden="true">/</span> النص</p>
              <h2 id="reading-preferences-title" className="font-serif text-lg font-bold text-stone-950">
                تفضيلات القراءة والعرض
              </h2>
              <p id="reading-preferences-description" className="mt-1 text-xs leading-6 text-stone-700">
                تخصيص سهولة القراءة وتناسق الأرقام والتباين
              </p>
            </div>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="إغلاق تفضيلات القراءة" className="touch-target -mt-1 -me-2 rounded-md text-stone-700 hover:bg-stone-100 hover:text-stone-950">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-5 text-sm sm:p-6">
          <section aria-labelledby="reading-font-size-heading" className="space-y-3">
            <h3 id="reading-font-size-heading" className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <Type aria-hidden="true" className="h-4 w-4 text-[#78350F]" /> حجم الخط والنصوص
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { id: 'normal', label: 'عادي (100%)' },
                { id: 'medium', label: 'متوسط (110%)' },
                { id: 'large', label: 'كبير (120%)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdatePreferences({ fontSize: opt.id as ReadingPreferences['fontSize'] })}
                  aria-pressed={preferences.fontSize === opt.id}
                  className={`min-h-11 rounded-md border px-3 py-2 text-xs text-center transition-colors ${
                    preferences.fontSize === opt.id
                      ? 'border-[#78350F] bg-[#78350F] font-bold text-white'
                      : 'border-stone-400 bg-white text-stone-900 hover:border-stone-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="reading-numerals-heading" className="space-y-3">
            <h3 id="reading-numerals-heading" className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <Hash aria-hidden="true" className="h-4 w-4 text-[#78350F]" /> نظام كتابة الأرقام
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdatePreferences({ numeralSystem: 'arabic' })}
                aria-pressed={preferences.numeralSystem === 'arabic'}
                className={`min-h-11 rounded-md border px-3 py-2 text-xs text-center transition-colors ${
                  preferences.numeralSystem === 'arabic'
                    ? 'border-[#78350F] bg-[#78350F] font-bold text-white'
                    : 'border-stone-400 bg-white text-stone-900 hover:border-stone-700'
                }`}
              >
                أرقام مشرقية (١، ٢، ٣)
              </button>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ numeralSystem: 'latin' })}
                aria-pressed={preferences.numeralSystem === 'latin'}
                className={`min-h-11 rounded-md border px-3 py-2 text-xs text-center transition-colors ${
                  preferences.numeralSystem === 'latin'
                    ? 'border-[#78350F] bg-[#78350F] font-bold text-white'
                    : 'border-stone-400 bg-white text-stone-900 hover:border-stone-700'
                }`}
              >
                أرقام لاتينية (1, 2, 3)
              </button>
            </div>
          </section>

          <section aria-labelledby="reading-contrast-heading" className="border-t border-stone-300 pt-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 id="reading-contrast-heading" className="text-sm font-bold text-stone-950">تباين القراءة</h3>
                <p id="reading-contrast-description" className="mt-1 max-w-sm text-xs leading-6 text-stone-700">
                  يقوّي تباين النصوص والروابط والحدود ومؤشرات التركيز في صفحات الأرشيف.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-label="نمط عالي التباين"
                aria-describedby="reading-contrast-description"
                aria-checked={preferences.highContrast}
                onClick={() => onUpdatePreferences({ highContrast: !preferences.highContrast })}
                className={`inline-flex h-11 w-[4.25rem] shrink-0 items-center rounded-full border p-1 transition-colors ${
                  preferences.highContrast ? 'justify-start border-[#5B260D] bg-[#78350F]' : 'justify-end border-stone-500 bg-stone-300'
                }`}
              >
                <span className="sr-only">{preferences.highContrast ? 'مفعّل' : 'متوقف'}</span>
                <span aria-hidden="true" className="h-7 w-7 rounded-full border border-black/20 bg-white shadow-sm" />
              </button>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-300 bg-stone-50 px-5 py-4 text-xs sm:px-6">
          <div className="min-w-0">
            {saveError ? (
              <p role="alert" className="text-red-900">تعذّر حفظ التفضيل. لم يتغير الاختيار.</p>
            ) : (
              <p className="text-stone-700">تُحفظ التفضيلات على هذا الجهاز تلقائياً.</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-md bg-[#78350F] px-5 py-2 text-sm font-semibold text-white hover:bg-[#642D10]"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
