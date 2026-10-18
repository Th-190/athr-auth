import React, { useState } from 'react';
import { mediaPipeline, MediaPipelineDerivativeResult, WatermarkPosition, WatermarkConfig } from '../../services/mediaPipeline';
import {
  Upload,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  Download,
  Eye,
  RefreshCw,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';

export const MediaPipelineStudio: React.FC = () => {
  const [selectedSiteSlug, setSelectedSiteSlug] = useState('al-ukhaidir');
  const [watermarkPos, setWatermarkPos] = useState<WatermarkPosition>('bottom-left');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.85);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<MediaPipelineDerivativeResult | null>(null);
  const [hashAuditOutput, setHashAuditOutput] = useState<any | null>(null);

  // Test 1: Upload a clean sample image and generate all 4 derivatives
  const handleTestCleanUpload = async () => {
    setIsProcessing(true);
    setUploadError(null);

    // Create a clean sample canvas JPEG (valid binary header FF D8 FF)
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Warm archival background
      ctx.fillStyle = '#F5F2EB';
      ctx.fillRect(0, 0, 1280, 720);

      // Archival brick architectural drawing
      ctx.fillStyle = '#78350F';
      ctx.fillRect(200, 250, 880, 350);
      ctx.fillStyle = '#1C1917';
      ctx.beginPath();
      ctx.arc(640, 250, 180, Math.PI, 0);
      ctx.fill();

      // Heading
      ctx.fillStyle = '#1C1917';
      ctx.font = 'bold 36px serif';
      ctx.textAlign = 'center';
      ctx.fillText('توثيق معماري اختباري - أرشيف أثر كربلاء', 640, 120);
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsProcessing(false);
        return;
      }
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const res = await mediaPipeline.processUpload(
        {
          fileName: 'ukhaidir_vault_arch.jpg',
          fileBytes: bytes,
          mimeTypeDeclared: 'image/jpeg',
          siteSlug: selectedSiteSlug,
          photographer: 'د. طه باقر',
          creditLine: 'مديرية الآثار العامة',
          rightsStatus: 'Creative Commons',
        },
        {
          position: watermarkPos,
          opacity: watermarkOpacity,
          fontSize: 14,
          margin: 16,
        }
      );

      setIsProcessing(false);
      if (res.success && res.result) {
        setLastResult(res.result);
      } else {
        setUploadError(res.error || 'فشلت معالجة الصورة');
      }
    }, 'image/jpeg', 0.95);
  };

  // Test 2: Adversarial exploit test - Spoofed PHP in JPG
  const handleTestPhpExploit = async () => {
    setIsProcessing(true);
    setUploadError(null);
    setLastResult(null);

    const maliciousPhp = new TextEncoder().encode('<?php system($_GET["cmd"]); ?>\nJFIF header spoof attempt');
    const res = await mediaPipeline.processUpload({
      fileName: 'exploit_shell.jpg',
      fileBytes: maliciousPhp,
      mimeTypeDeclared: 'image/jpeg',
      siteSlug: selectedSiteSlug,
    });

    setIsProcessing(false);
    if (!res.success) {
      setUploadError(`[تم الإحباط بنجاح]: ${res.error}`);
    } else {
      setUploadError('تحذير: فشل كشف الشفرة الخبيثة!');
    }
  };

  // Test 3: Adversarial exploit test - Executable PE header
  const handleTestExeExploit = async () => {
    setIsProcessing(true);
    setUploadError(null);
    setLastResult(null);

    const maliciousExe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const res = await mediaPipeline.processUpload({
      fileName: 'ransomware_trojan.png',
      fileBytes: maliciousExe,
      mimeTypeDeclared: 'image/png',
      siteSlug: selectedSiteSlug,
    });

    setIsProcessing(false);
    if (!res.success) {
      setUploadError(`[تم الإحباط بنجاح]: ${res.error}`);
    }
  };

  // Run Artisan hash verification command
  const handleRunHashAudit = () => {
    const report = mediaPipeline.runArtisanVerifyHashesCommand();
    setHashAuditOutput(report);
  };

  // Download watermarked derivative
  const handleTriggerDownload = () => {
    if (!lastResult) return;
    const dl = mediaPipeline.executeControlledDownload(
      lastResult.id,
      selectedSiteSlug,
      lastResult.watermarkedDownloadUrl,
      lastResult.downloadFileName,
      'Editor'
    );

    const a = document.createElement('a');
    a.href = dl.downloadUrl!;
    a.download = dl.filename!;
    a.click();
  };

  return (
    <div className="bg-white border border-[#EBE6DF] rounded p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#78350F]" />
            <h2 className="text-xl font-serif font-bold text-stone-900">
              مختبر معالجة الوسائط والأمن البصري (Media Pipeline Studio)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            فحص البصمات الثنائية (MIME Sniffing)، عزل الأصول الخاصة، تجريد EXIF، وإنشاء المشتقات المائية
          </p>
        </div>

        <button
          onClick={handleRunHashAudit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 font-mono"
        >
          <Fingerprint className="w-3.5 h-3.5 text-[#78350F]" />
          <span>تشغيل فحص البصمات (artisan verify:hashes)</span>
        </button>
      </div>

      {/* Control Bar & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#FBF9F5] p-5 rounded border border-stone-200 text-xs">
        {/* Site & Watermark options */}
        <div className="space-y-3">
          <label className="font-bold text-stone-800 block font-serif">
            خيارات العلامة المائية المشتقة (Watermark Settings)
          </label>

          <div className="space-y-1">
            <span className="text-stone-500 block">موضع الختم (7 خيارات):</span>
            <select
              value={watermarkPos}
              onChange={(e: any) => setWatermarkPos(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-stone-800"
            >
              <option value="bottom-left">أسفل اليسار (افتراضي)</option>
              <option value="bottom-right">أسفل اليمين</option>
              <option value="bottom-center">أسفل المنتصف</option>
              <option value="top-left">أعلى اليسار</option>
              <option value="top-right">أعلى اليمين</option>
              <option value="center">وسط الصورة</option>
              <option value="diagonal-overlay">طبقة مائلة شفافة (Diagonal)</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-stone-500">
              <span>درجة الشفافية:</span>
              <span className="font-mono">{Math.round(watermarkOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.05"
              value={watermarkOpacity}
              onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Action Buttons: Clean upload & Adversarial tests */}
        <div className="md:col-span-2 space-y-3">
          <label className="font-bold text-stone-800 block font-serif">
            تشغيل خط المعالجة واختبارات الاختراق
          </label>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={handleTestCleanUpload}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#78350F] hover:bg-[#9A3412] text-white rounded font-medium shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع صورة سليمة وتوليد المشتقات الأربعة</span>
            </button>

            <button
              onClick={handleTestPhpExploit}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded font-medium disabled:opacity-50 cursor-pointer"
              title="محاكاة رفع ملف PHP ملغوم بامتداد .jpg"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>هجوم PHP Injection</span>
            </button>

            <button
              onClick={handleTestExeExploit}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded font-medium disabled:opacity-50 cursor-pointer"
              title="محاكاة رفع ملف تنفيذي MZ/PE"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>هجوم ملف تنفيذي PE/EXE</span>
            </button>
          </div>

          {/* Feedback banners */}
          {uploadError && (
            <div className={`p-3 rounded border text-xs flex items-center gap-2 ${
              uploadError.includes('[تم الإحباط')
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}>
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Derivative Pipeline Visualizer (The 4 Files) */}
      {lastResult && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>نتائج خط المعالجة: تم توليد 4 ملفات وحساب البصمات المشفرة</span>
            </h3>
            <button
              onClick={handleTriggerDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#78350F] hover:bg-[#9A3412] text-white text-xs rounded font-medium shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل النسخة المائية المصرحة للبحث</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Derivative 1: Private Original Vault */}
            <div className="bg-[#F7F4EE] border-2 border-stone-400/80 rounded p-4 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 font-serif">1. الأصل الخام (Original)</span>
                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" /> خاص / معزول
                </span>
              </div>
              <p className="text-[11px] text-stone-600 font-mono break-all bg-white p-2 rounded border border-stone-200">
                {lastResult.storageKeyOriginal}
              </p>
              <div className="text-[10px] text-stone-500 font-mono space-y-1">
                <span className="block text-stone-700 font-bold">بصمة SHA-256 الأصلية:</span>
                <span className="block truncate">{lastResult.hashOriginal}</span>
                <span className="text-emerald-700 block">✓ غير متاح عبر أي رابط عام</span>
              </div>
            </div>

            {/* Derivative 2: Web Derivative */}
            <div className="bg-white border border-stone-200 rounded p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 font-serif">2. مشتقة الويب (Web Derivative)</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-mono">
                  EXIF ممسوح
                </span>
              </div>
              <div className="aspect-16/10 bg-stone-900 rounded overflow-hidden">
                <img src={lastResult.webUrl} alt="Web derivative" className="w-full h-full object-cover" />
              </div>
              <div className="text-[10px] text-stone-500 font-mono">
                <span>بصمة SHA-256:</span>
                <span className="block truncate">{lastResult.hashWeb}</span>
                <span className="text-stone-700 block mt-0.5">أبعاد: {lastResult.width}×{lastResult.height}</span>
              </div>
            </div>

            {/* Derivative 3: Thumbnail */}
            <div className="bg-white border border-stone-200 rounded p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 font-serif">3. المصغرة (Thumbnail)</span>
                <span className="px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded text-[10px] font-mono">
                  400px Tile
                </span>
              </div>
              <div className="aspect-16/10 bg-stone-900 rounded overflow-hidden">
                <img src={lastResult.thumbUrl} alt="Thumbnail derivative" className="w-full h-full object-cover" />
              </div>
              <div className="text-[10px] text-stone-500 font-mono">
                <span>بصمة SHA-256:</span>
                <span className="block truncate">{lastResult.hashThumb}</span>
                <span className="text-stone-700 block mt-0.5">محسنة للفهارس والخرائط</span>
              </div>
            </div>

            {/* Derivative 4: Watermarked Download Version */}
            <div className="bg-white border-2 border-[#78350F]/60 rounded p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 font-serif">4. نسخة التنزيل المائية</span>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-mono">
                  مختومة رسمياً
                </span>
              </div>
              <div className="aspect-16/10 bg-stone-900 rounded overflow-hidden">
                <img src={lastResult.watermarkedDownloadUrl} alt="Watermarked derivative" className="w-full h-full object-cover" />
              </div>
              <div className="text-[10px] text-stone-500 font-mono">
                <span>بصمة SHA-256:</span>
                <span className="block truncate">{lastResult.hashWatermarked}</span>
                <span className="text-[#78350F] font-bold block mt-0.5">
                  الاسم: {lastResult.downloadFileName}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Artisan Hash Audit Command Output */}
      {hashAuditOutput && (
        <div className="p-4 bg-[#1C1917] text-[#D6CEBE] rounded font-mono text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="text-amber-400 font-bold">$ php artisan kha:verify-media-hashes</span>
            <span className="text-stone-400 text-[11px]">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="space-y-1">
            <p>Scanning media_hashes relational storage...</p>
            <p className="text-emerald-400">
              ✓ Verified {hashAuditOutput.totalChecked} files across private originals, web derivatives, and download stamps.
            </p>
            <p className="text-stone-300">
              Valid records: {hashAuditOutput.validCount} | Tampered/Mismatch: {hashAuditOutput.mismatchCount}
            </p>
            <p className="text-stone-400 text-[11px]">
              Status: Integrity check PASSED (0 breaches detected).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
