import React, { useState, useEffect } from 'react';
import { SiteImage, Source } from '../../types';
import { archiveDB } from '../../db/archiveStore';
import {
  Download,
  ZoomIn,
  ShieldAlert,
  Calendar,
  Camera,
  BookOpen,
  X,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
} from 'lucide-react';

interface MuseumGalleryProps {
  images: SiteImage[];
  siteName: string;
  onOpenReportModal?: (imageId: string, imageTitle: string) => void;
}

export const MuseumGallery: React.FC<MuseumGalleryProps> = ({
  images,
  siteName,
  onOpenReportModal,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-stone-300 rounded bg-[#F7F4EE]">
        <Camera className="w-8 h-8 mx-auto text-stone-400 mb-2" />
        <p className="text-sm text-stone-600 font-medium">لا تتوفر لوحات فوتوغرافية منشورة لهذا المعلم بعد</p>
        <p className="text-xs text-stone-500 mt-1">يخضع توثيق الصور للتدقيق والمطابقة مع الحقوق الفكرية قبل النشر.</p>
      </div>
    );
  }

  const activeImage = activeImageIndex !== null ? images[activeImageIndex] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-serif font-bold text-stone-900">
            معرض اللوحات الأرشيفية
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            توثيق فوتوغرافي ومخططي مسند بالحقوق وسجلات المعاينة الميدانية
          </p>
        </div>
        <span className="text-xs font-mono text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded">
          {images.length} {images.length === 1 ? 'لوحة' : 'لوحات'}
        </span>
      </div>

      {/* Museum Plates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {images.map((image, idx) => (
          <div
            key={image.id}
            className="group bg-[#FFFFFF] border border-[#EBE6DF] rounded overflow-hidden shadow-2xs hover:border-stone-400 transition-all cursor-pointer"
            onClick={() => setActiveImageIndex(idx)}
          >
            {/* Museum Plate Frame */}
            <div className="relative aspect-16/10 bg-[#1C1917] overflow-hidden">
              <img
                src={image.web_url}
                alt={image.alt_text || image.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute top-2.5 right-2.5 bg-[#1C1917]/85 backdrop-blur-xs text-[#FBF9F5] text-[11px] px-2 py-0.5 rounded font-mono">
                لوحة {idx + 1} من {images.length}
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/80 text-white text-xs font-medium">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>تكبير وفحص الحواشي</span>
                </span>
              </div>
            </div>

            {/* Catalogue-style caption */}
            <div className="p-4 space-y-2 border-t border-stone-100">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-stone-900 leading-snug">
                  {image.title}
                </h4>
                {image.featured && (
                  <span className="shrink-0 text-[10px] font-medium text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    رئيسية
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                {image.caption}
              </p>

              <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] text-stone-500 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{image.date_taken}</span>
                </span>
                <span>المصور: {image.photographer}</span>
                <span className="font-mono text-[10px] text-stone-400">
                  {image.rights_status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* High-Resolution Viewer Modal with Museum Rigor */}
      {activeImage && (
        <ImageModal
          image={activeImage}
          siteName={siteName}
          plateNumber={activeImageIndex! + 1}
          totalPlates={images.length}
          onClose={() => setActiveImageIndex(null)}
          onNext={() =>
            setActiveImageIndex((activeImageIndex! + 1) % images.length)
          }
          onPrev={() =>
            setActiveImageIndex(
              (activeImageIndex! - 1 + images.length) % images.length
            )
          }
          onReport={() => {
            if (onOpenReportModal) {
              onOpenReportModal(activeImage.id, activeImage.title);
            }
          }}
        />
      )}
    </div>
  );
};

interface ImageModalProps {
  image: SiteImage;
  siteName: string;
  plateNumber: number;
  totalPlates: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReport: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  image,
  siteName,
  plateNumber,
  totalPlates,
  onClose,
  onNext,
  onPrev,
  onReport,
}) => {
  // Keyboard listener for Escape & Arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onPrev(); // In RTL, right is previous
      if (e.key === 'ArrowLeft') onNext();  // In RTL, left is next
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  // Load associated sources
  const sources: Source[] = (image.source_ids || [])
    .map(id => archiveDB.getSourceById(id))
    .filter((s): s is Source => s !== undefined);

  // Controlled download with watermark note
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.web_url;
    link.download = `KarbalaArchive_${image.id}_watermarked.jpg`;
    link.target = '_blank';
    link.click();

    // Log the download to audit trail
    archiveDB.logAudit({
      action: 'DOWNLOAD_WATERMARKED_IMAGE',
      entity_type: 'SiteImage',
      entity_id: image.id,
      performed_by: 'Public Visitor',
      ip_hash: 'download_client',
      details: `تنزيل نسخة مائية مصرحة من اللوحة: ${image.title}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col md:flex-row overflow-y-auto">
      {/* Top Close Button for mobile */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-50 p-2 text-stone-300 hover:text-white bg-stone-800/80 rounded-full"
        aria-label="إغلاق النافذة"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Image Viewport Area */}
      <div className="relative flex-1 flex items-center justify-center p-4 md:p-8 min-h-[50vh] bg-stone-950">
        <img
          src={image.web_url}
          alt={image.alt_text || image.title}
          referrerPolicy="no-referrer"
          className="max-h-[85vh] max-w-full object-contain rounded border border-stone-800 shadow-2xl select-none"
        />

        {/* Navigation Arrows */}
        {totalPlates > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all cursor-pointer"
              aria-label="اللوحة السابقة"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={onNext}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all cursor-pointer"
              aria-label="اللوحة التالية"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Floating plate watermark indicator */}
        <div className="absolute bottom-4 left-4 bg-black/70 text-stone-300 text-xs px-3 py-1 rounded font-mono">
          أثر كربلاء · Karbala Heritage Archive
        </div>
      </div>

      {/* Archival Metadata Sidebar */}
      <div className="w-full md:w-96 bg-[#FBF9F5] p-6 text-stone-900 border-r border-stone-300 overflow-y-auto flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="border-b border-stone-200 pb-3">
            <div className="flex items-center justify-between text-xs text-stone-500 font-mono mb-1">
              <span>{siteName}</span>
              <span>لوحة {plateNumber} من {totalPlates}</span>
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-900">
              {image.title}
            </h3>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 font-serif">
              الوصف والتحقيق المعماري
            </h4>
            <p className="text-xs text-stone-700 leading-relaxed">
              {image.description || image.caption}
            </p>
          </div>

          {/* Archival Plate Metadata */}
          <div className="bg-[#F7F4EE] border border-[#EBE6DF] rounded p-3 text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="text-stone-500">تاريخ الالتقاط:</span>
              <span className="font-medium text-stone-800">{image.date_taken}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="text-stone-500">المصور / الجهة:</span>
              <span className="font-medium text-stone-800">{image.photographer}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="text-stone-500">جهة التوثيق:</span>
              <span className="font-medium text-stone-800">{image.credit_line}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="text-stone-500">حالة الحقوق:</span>
              <span className="font-medium text-stone-800">
                {image.rights_status === 'Unknown' ? (
                  <span className="text-rose-700 font-bold">غير مؤكدة (قيد المراجعة)</span>
                ) : (
                  image.rights_status
                )}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500">البصمة الرقمية:</span>
              <span className="font-mono text-[10px] text-stone-600 truncate max-w-[150px]">
                {image.file_hash_sha256}
              </span>
            </div>
          </div>

          {/* Linked Sources */}
          {sources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 font-serif flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>المراجع المرتبطة باللوحة</span>
              </h4>
              <div className="space-y-2">
                {sources.map(src => (
                  <div key={src.id} className="p-2.5 rounded bg-white border border-stone-200 text-xs">
                    <p className="font-bold text-stone-800">{src.title}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">{src.author} ({src.year})</p>
                    {src.page_reference && (
                      <p className="text-[10px] text-stone-400 mt-0.5">{src.page_reference}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-stone-200 space-y-2.5">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#78350F] hover:bg-[#9A3412] text-white text-xs font-medium rounded transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تنزيل نسخة مائية مصرحة للبحث</span>
          </button>

          <button
            onClick={onReport}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-xs rounded transition-colors border border-stone-200"
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>الإبلاغ عن تصحيح أو خطأ في اللوحة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
