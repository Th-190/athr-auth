import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, X, Plus, Check } from 'lucide-react';
import { matchesArabicSearch } from '../../utils/arabic';

export interface SuggestionOption {
  id?: string | number;
  label: string;
  subLabel?: string;
  badge?: string;
  group?: string;
  payload?: any;
}

export interface EditableSuggestionInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedId?: string | number | null;
  onSelectSuggestion?: (option: SuggestionOption) => void;
  suggestions: (string | SuggestionOption)[];
  allowCustom?: boolean;
  onCreateCustom?: (typedText: string) => Promise<void> | void;
  customActionText?: string;
  placeholder?: string;
  label?: string;
  sublabel?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  name?: string;
  id?: string;
  dir?: 'rtl' | 'ltr';
  helperText?: string;
  emptyText?: string;
}

export const EditableSuggestionInput: React.FC<EditableSuggestionInputProps> = ({
  value,
  onChange,
  selectedId,
  onSelectSuggestion,
  suggestions,
  allowCustom = true,
  onCreateCustom,
  customActionText,
  placeholder,
  label,
  sublabel,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  name,
  id,
  dir = 'rtl',
  helperText,
  emptyText = 'لا توجد اقتراحات مطابقة',
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  // Normalize suggestions to SuggestionOption objects
  const normalizedOptions: SuggestionOption[] = React.useMemo(() => {
    return suggestions.map(item => {
      if (typeof item === 'string') {
        return { label: item, id: item };
      }
      return item;
    });
  }, [suggestions]);

  // Filter suggestions based on typed query with Arabic normalization
  const filteredOptions = React.useMemo(() => {
    const q = (value || '').trim();
    if (!q) return normalizedOptions;

    return normalizedOptions.filter(opt => {
      if (matchesArabicSearch(opt.label, q)) return true;
      if (opt.subLabel && matchesArabicSearch(opt.subLabel, q)) return true;
      if (opt.badge && matchesArabicSearch(opt.badge, q)) return true;
      return false;
    });
  }, [normalizedOptions, value]);

  // Check if current typed value exactly matches an existing suggestion label
  const exactMatch = React.useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return null;
    return normalizedOptions.find(
      opt => opt.label.trim().toLowerCase() === q || String(opt.id).toLowerCase() === q
    );
  }, [normalizedOptions, value]);

  const showCustomOption =
    allowCustom &&
    Boolean(value?.trim()) &&
    !exactMatch &&
    (onCreateCustom !== undefined || allowCustom);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: SuggestionOption) => {
    onChange(option.label);
    if (onSelectSuggestion) {
      onSelectSuggestion(option);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreateCustom = async () => {
    const typed = value.trim();
    if (!typed) return;

    if (onCreateCustom) {
      setIsSubmittingCustom(true);
      try {
        await onCreateCustom(typed);
      } finally {
        setIsSubmittingCustom(false);
      }
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        const total = filteredOptions.length + (showCustomOption ? 1 : 0);
        setHighlightedIndex(prev => (prev + 1 < total ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const total = filteredOptions.length + (showCustomOption ? 1 : 0);
        setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : total - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0) {
        e.preventDefault();
        if (highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (showCustomOption) {
          void handleCreateCustom();
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative space-y-1 ${className}`} dir={dir}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-stone-700">
          {label} {required && <span className="text-rose-600">*</span>}
          {sublabel && <span className="mr-1.5 text-[11px] font-normal text-stone-500 font-sans">{sublabel}</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${inputId}-listbox`}
          role="combobox"
          autoComplete="off"
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full min-h-[42px] rounded-lg border border-[#D5CEBF] bg-white px-3 py-2 text-sm text-stone-900 transition-colors placeholder:text-stone-400 focus:border-[#78350F] focus:outline-none focus:ring-1 focus:ring-[#78350F] disabled:cursor-not-allowed disabled:bg-stone-100 ${
            value ? 'pl-16' : 'pl-9'
          } ${inputClassName}`}
        />

        <div className="absolute left-2 flex items-center gap-1 text-stone-400">
          {value && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              title="مسح الحقل"
              className="p-1 rounded hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(prev => !prev)}
            title="عرض الاقتراحات"
            className="p-1 rounded hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {helperText && <p className="text-[11px] text-stone-500">{helperText}</p>}

      {/* Floating Suggestions Dropdown */}
      {isOpen && !disabled && (
        <div
          id={`${inputId}-listbox`}
          className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-[#D5CEBF] bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100"
          style={{ minWidth: '220px' }}
        >
          {filteredOptions.length === 0 && !showCustomOption && (
            <div className="p-3 text-center text-xs text-stone-500">{emptyText}</div>
          )}

          <ul className="py-1 divide-y divide-stone-100 text-sm">
            {filteredOptions.map((opt, index) => {
              const isSelected =
                (selectedId !== undefined && selectedId !== null && String(selectedId) === String(opt.id)) ||
                opt.label.trim().toLowerCase() === (value || '').trim().toLowerCase();
              const isHighlighted = highlightedIndex === index;

              return (
                <li
                  key={`${opt.id ?? opt.label}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(opt)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors ${
                    isHighlighted
                      ? 'bg-amber-50 text-[#78350F]'
                      : isSelected
                      ? 'bg-stone-50 font-medium text-stone-900'
                      : 'text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                    {opt.subLabel && (
                      <div className="text-[11px] text-stone-500 truncate mt-0.5">{opt.subLabel}</div>
                    )}
                  </div>

                  {opt.badge && (
                    <span className="shrink-0 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                      {opt.badge}
                    </span>
                  )}
                </li>
              );
            })}

            {/* Custom Option: Add new value */}
            {showCustomOption && (
              <li
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                onClick={() => void handleCreateCustom()}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold cursor-pointer border-t border-amber-200 transition-colors ${
                  highlightedIndex === filteredOptions.length
                    ? 'bg-amber-100/80 text-amber-950'
                    : 'bg-amber-50 text-[#78350F] hover:bg-amber-100/60'
                }`}
              >
                <Plus className="w-4 h-4 shrink-0 text-[#78350F]" />
                <div className="flex-1 truncate">
                  {customActionText ? (
                    customActionText
                  ) : (
                    <span>
                      استخدام <bdi className="font-bold underline decoration-amber-500">«{value.trim()}»</bdi> كقيمة جديدة
                    </span>
                  )}
                </div>
                {isSubmittingCustom && (
                  <span className="text-[10px] text-amber-700 animate-pulse">جارٍ الحفظ…</span>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
