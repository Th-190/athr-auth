import React, { useState } from 'react';
import { generateCitation } from '../../utils/arabic';
import { Copy, Check, X, Quote } from 'lucide-react';

interface CiteModalProps {
  siteName: string;
  permanentId: string;
  lastReviewed: string;
  onClose: () => void;
}

export const CiteModal: React.FC<CiteModalProps> = ({
  siteName,
  permanentId,
  lastReviewed,
  onClose,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const arabicCitation = generateCitation(siteName, permanentId, lastReviewed, 'arabic');
  const chicagoCitation = generateCitation(siteName, permanentId, lastReviewed, 'chicago');
  const apaCitation = generateCitation(siteName, permanentId, lastReviewed, 'apa');

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div data-reading-exempt="true" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FBF9F5] border border-stone-300 rounded max-w-xl w-full p-6 space-y-6 shadow-xl relative animate-in fade-in duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
          <div className="p-2 bg-[#EFECE6] text-[#78350F] rounded">
            <Quote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-stone-900">
              اقتبس هذا السجل الأرشيفي
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              معرف السجل الدائم: {permanentId}
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          يرجى تضمين المعرف الدائم وتاريخ آخر مراجعة مع الرابط الإلكتروني في الدراسات والأبحاث لضمان التوثيق العلمي المستمر:
        </p>

        {/* Format 1: Arabic Academic */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
            <span>التوثيق العربي الأكاديمي المعتمد</span>
            <button
              onClick={() => copyToClipboard(arabicCitation, 'arabic')}
              className="inline-flex items-center gap-1 text-[11px] text-[#78350F] hover:text-[#9A3412] font-normal"
            >
              {copiedFormat === 'arabic' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFormat === 'arabic' ? 'تم النسخ' : 'نسخ الاقتباس'}</span>
            </button>
          </div>
          <div className="p-3 bg-white border border-stone-200 rounded text-xs text-stone-800 font-serif leading-relaxed select-all">
            {arabicCitation}
          </div>
        </div>

        {/* Format 2: Chicago Style */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
            <span dir="ltr" className="font-sans">Chicago Manual of Style (17th ed.)</span>
            <button
              onClick={() => copyToClipboard(chicagoCitation, 'chicago')}
              className="inline-flex items-center gap-1 text-[11px] text-[#78350F] hover:text-[#9A3412] font-normal"
            >
              {copiedFormat === 'chicago' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFormat === 'chicago' ? 'تم النسخ' : 'Copy'}</span>
            </button>
          </div>
          <div dir="ltr" className="p-3 bg-white border border-stone-200 rounded text-xs text-stone-800 font-serif leading-relaxed text-left select-all">
            {chicagoCitation}
          </div>
        </div>

        {/* Format 3: APA Style */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
            <span dir="ltr" className="font-sans">APA Format (7th ed.)</span>
            <button
              onClick={() => copyToClipboard(apaCitation, 'apa')}
              className="inline-flex items-center gap-1 text-[11px] text-[#78350F] hover:text-[#9A3412] font-normal"
            >
              {copiedFormat === 'apa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFormat === 'apa' ? 'تم النسخ' : 'Copy'}</span>
            </button>
          </div>
          <div dir="ltr" className="p-3 bg-white border border-stone-200 rounded text-xs text-stone-800 font-serif leading-relaxed text-left select-all">
            {apaCitation}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-200 hover:bg-stone-300 rounded transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
