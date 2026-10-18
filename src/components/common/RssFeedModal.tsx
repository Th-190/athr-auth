import React, { useState } from 'react';
import { archiveDB } from '../../db/archiveStore';
import { generateAtomFeed } from '../../utils/arabic';
import { Rss, Copy, Check, X, ExternalLink } from 'lucide-react';

interface RssFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RssFeedModal: React.FC<RssFeedModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sites = archiveDB.getAllSites(false);
  const feedXml = generateAtomFeed(sites);
  const feedUrl = 'https://karbalaheritage.iq/feed.atom';

  const handleCopy = () => {
    navigator.clipboard.writeText(feedXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="تغذية الأخبار والتحديثات RSS/Atom"
    >
      <div
        className="w-full max-w-2xl bg-[#FBF9F5] border border-stone-300 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <Rss className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                تغذية التحديثات الأرشيفية (RSS / Atom Feed)
              </h2>
              <span className="text-xs text-stone-500">
                لمتابعة ما استجدّ في السجل الأثري عبر برامج قراءة الخلاصات
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 leading-relaxed">
            يصدر الأرشيف تغذية بصيغة Atom 1.0 القياسية تتضمن آخر السجلات المحدثة والمراجعة أكاديمياً. يمكنك إدراج الرابط في قارئ الخلاصات المفضل لديك.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">رابط التغذية الرسمي:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-stone-300 rounded text-stone-800"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(feedUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-2 bg-[#78350F] text-white text-xs rounded hover:bg-[#9A3412] shrink-0"
              >
                {copied ? 'تم النسخ' : 'نسخ الرابط'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">معاينة شفرة Atom XML:</label>
              <button
                onClick={handleCopy}
                className="text-xs text-[#78350F] hover:underline inline-flex items-center gap-1 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم نسخ الشفرة' : 'نسخ شفرة XML'}</span>
              </button>
            </div>
            <pre className="p-3 bg-stone-900 text-stone-200 text-[11px] font-mono rounded max-h-56 overflow-auto text-left" dir="ltr">
              {feedXml}
            </pre>
          </div>
        </div>

        <div className="border-t border-stone-200 bg-stone-50 px-5 py-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs rounded"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
