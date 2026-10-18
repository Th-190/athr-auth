import React, { useState } from 'react';
import { Site } from '../../types';
import { archiveDB } from '../../db/archiveStore';
import { exportToBibTeX, exportToRIS, exportToCSV } from '../../utils/arabic';
import { Bookmark, Trash2, Download, Printer, ExternalLink, X, FileText } from 'lucide-react';

interface MyListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSite: (site: Site) => void;
}

export const MyListModal: React.FC<MyListModalProps> = ({
  isOpen,
  onClose,
  onSelectSite,
}) => {
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const bookmarkedSites = archiveDB.getBookmarkedSites();

  const handleRemove = (siteId: string) => {
    archiveDB.toggleBookmark(siteId);
    // Trigger re-render
    setDownloadSuccessMessage(null);
  };

  const handleExport = (format: 'bibtex' | 'ris' | 'csv') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'bibtex') {
      content = exportToBibTeX(bookmarkedSites);
      filename = `karbala_heritage_citations_${new Date().toISOString().slice(0, 10)}.bib`;
      mimeType = 'text/plain;charset=utf-8';
    } else if (format === 'ris') {
      content = exportToRIS(bookmarkedSites);
      filename = `karbala_heritage_citations_${new Date().toISOString().slice(0, 10)}.ris`;
      mimeType = 'application/x-research-info-systems;charset=utf-8';
    } else {
      content = '\uFEFF' + exportToCSV(bookmarkedSites); // UTF-8 BOM for Arabic Excel
      filename = `karbala_heritage_list_${new Date().toISOString().slice(0, 10)}.csv`;
      mimeType = 'text/csv;charset=utf-8';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccessMessage(`تم تصدير ملف ${format.toUpperCase()} بنجاح`);
    setTimeout(() => setDownloadSuccessMessage(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="قائمتي التوثيقية"
    >
      <div
        className="w-full max-w-2xl bg-[#FBF9F5] border border-stone-300 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#78350F]" />
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                قائمتي التوثيقية ({bookmarkedSites.length})
              </h2>
              <span className="text-xs text-stone-500">
                المعالم المحفوظة على جهازك للدراسة والاستشهاد الأكاديمي
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {downloadSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-medium">
              ✓ {downloadSuccessMessage}
            </div>
          )}

          {bookmarkedSites.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Bookmark className="w-6 h-6" />
              </div>
              <p className="text-stone-800 font-serif font-bold text-base">لا توجد معالم محفوظة في قائمتك بعد</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                اضغط على أيقونة «حفظ في قائمتي» الموجودة في بطاقات وسجلات المعالم لحفظها ومراجعتها وتصدير الاستشهاد بها لاحقاً.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {bookmarkedSites.map(site => (
                <div
                  key={site.id}
                  className="p-3.5 bg-white border border-stone-200 rounded flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#78350F] bg-[#F5F2EB] px-1.5 py-0.5 rounded border border-[#E7E2D6]">
                        {site.permanent_id}
                      </span>
                      <h4
                        onClick={() => {
                          onClose();
                          onSelectSite(site);
                        }}
                        className="font-serif font-bold text-sm text-stone-900 hover:text-[#78350F] cursor-pointer"
                      >
                        {site.name_ar}
                      </h4>
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-1">{site.short_description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectSite(site);
                      }}
                      className="px-2.5 py-1 text-xs text-[#78350F] bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                      title="فتح السجل"
                    >
                      فتح
                    </button>
                    <button
                      onClick={() => handleRemove(site.id)}
                      className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors"
                      title="إزالة من القائمة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {bookmarkedSites.length > 0 && (
          <div className="border-t border-stone-200 bg-stone-50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-stone-500 font-mono">تصدير الاستشهادات:</span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('bibtex')}
                className="px-3 py-1.5 bg-white border border-stone-300 hover:border-[#78350F] text-stone-800 rounded font-mono text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#78350F]" />
                <span>BibTeX (.bib)</span>
              </button>

              <button
                onClick={() => handleExport('ris')}
                className="px-3 py-1.5 bg-white border border-stone-300 hover:border-[#78350F] text-stone-800 rounded font-mono text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#78350F]" />
                <span>RIS (.ris)</span>
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-1.5 bg-white border border-stone-300 hover:border-[#78350F] text-stone-800 rounded font-mono text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#78350F]" />
                <span>جدول Excel / CSV</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white border border-stone-300 hover:border-stone-500 text-stone-800 rounded text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
