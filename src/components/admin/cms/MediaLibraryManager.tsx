import React, { useState, useMemo } from 'react';
import { archiveDB } from '../../../db/archiveStore';
import { SiteImage, RightsStatus } from '../../../types';
import { inputClass, labelClass, primaryBtn, ghostBtn, dangerBtn } from './formStyles';
import { Image, Upload, Search, Filter, Trash2, CheckCircle2, AlertTriangle, Eye, ArrowUp, ArrowDown, Star, Link, Shield } from 'lucide-react';

interface Props {
  actorName: string;
}

export const MediaLibraryManager: React.FC<Props> = ({ actorName }) => {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const images = archiveDB.getAllImages();
  const sites = archiveDB.getAllSites(true);

  const [search, setSearch] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');
  const [selectedRightsFilter, setSelectedRightsFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<SiteImage | null>(null);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  // Upload modal state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSiteId, setUploadSiteId] = useState<string>(sites[0]?.id || '');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadPhotographer, setUploadPhotographer] = useState('أرشيف أثر كربلاء');
  const [uploadRights, setUploadRights] = useState<RightsStatus>('Creative Commons');
  const [uploadLicense, setUploadLicense] = useState('CC BY-NC 4.0');
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);

  // Edit metadata form state
  const [editCaption, setEditCaption] = useState('');
  const [editPhotographer, setEditPhotographer] = useState('');
  const [editAltText, setEditAltText] = useState('');
  const [editRights, setEditRights] = useState<RightsStatus>('Creative Commons');
  const [editLicense, setEditLicense] = useState('');
  const [editCopyrightNotice, setEditCopyrightNotice] = useState('');
  const [editSiteId, setEditSiteId] = useState('');

  const filteredImages = useMemo(() => {
    return images.filter(img => {
      if (selectedSiteFilter !== 'all' && img.site_id !== selectedSiteFilter) return false;
      if (selectedRightsFilter !== 'all' && img.rights_status !== selectedRightsFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const captionMatch = (img.caption || img.title || '').toLowerCase().includes(q);
        const photoMatch = (img.photographer || '').toLowerCase().includes(q);
        const altMatch = (img.alt_text || '').toLowerCase().includes(q);
        if (!captionMatch && !photoMatch && !altMatch) return false;
      }
      return true;
    });
  }, [images, selectedSiteFilter, selectedRightsFilter, search, tick]);

  const handleSelectImage = (img: SiteImage) => {
    setSelectedImage(img);
    setEditCaption(img.caption || img.title || '');
    setEditPhotographer(img.photographer || '');
    setEditAltText(img.alt_text || '');
    setEditRights(img.rights_status || 'Creative Commons');
    setEditLicense(img.license || 'CC BY-NC 4.0');
    setEditCopyrightNotice(img.credit_line || '');
    setEditSiteId(img.site_id);
    setIsEditingMetadata(true);
  };

  const handleSaveMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;

    archiveDB.updateImageMetadata(
      selectedImage.id,
      {
        caption: editCaption,
        title: editCaption,
        photographer: editPhotographer,
        alt_text: editAltText,
        rights_status: editRights as any,
        license: editLicense,
        credit_line: editCopyrightNotice,
        site_id: editSiteId,
      },
      actorName
    );

    refresh();
    setIsEditingMetadata(false);
    alert('تم حفظ البيانات الوصفية وحقوق الصورة بنجاح.');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('الحد الأقصى لحجم الصورة هو 15 ميغابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPreviewUrl) {
      alert('يرجى اختيار صورة للرفع.');
      return;
    }
    if (!uploadSiteId) {
      alert('يرجى اختيار المعلم المرتبط بالصورة.');
      return;
    }

    const newImage: Omit<SiteImage, 'id'> = {
      site_id: uploadSiteId,
      title: uploadCaption || 'صورة توثيقية للأثر',
      caption: uploadCaption || 'صورة توثيقية للأثر',
      description: uploadCaption || '',
      web_url: uploadPreviewUrl,
      thumb_url: uploadPreviewUrl,
      photographer: uploadPhotographer,
      rights_status: uploadRights as any,
      license: uploadLicense,
      credit_line: `جميع الحقوق محفوظة — ${uploadPhotographer}`,
      featured: false,
      sort_order: images.filter(i => i.site_id === uploadSiteId).length + 1,
      visibility: true,
      alt_text: uploadCaption || 'صورة من أرشيف كربلاء',
      date_taken: new Date().toISOString().split('T')[0],
      date_precision: 'approximate',
      image_role: 'current_view',
      ai_assisted: false,
      file_hash_sha256: `hash_${Date.now()}`,
    };

    archiveDB.addImage(newImage, actorName);
    setIsUploading(false);
    setUploadPreviewUrl(null);
    setUploadCaption('');
    refresh();
    alert('تم رفع الصورة وإدراجها في مكتبة الوسائط بنجاح.');
  };

  const handleDeleteImage = (img: SiteImage) => {
    const isPrimary = img.featured;
    const confirmMsg = isPrimary
      ? 'تحذير: هذه الصورة هي الصورة الرئيسية للمعلم. هل أنت متأكد من حذفها؟'
      : 'هل أنت متأكد من حذف هذه الصورة من مكتبة الوسائط؟';

    if (!confirm(confirmMsg)) return;

    archiveDB.deleteImage(img.id, actorName);
    if (selectedImage?.id === img.id) {
      setSelectedImage(null);
      setIsEditingMetadata(false);
    }
    refresh();
    alert('تم حذف الصورة من مكتبة الوسائط.');
  };

  const handleSetPrimary = (img: SiteImage) => {
    archiveDB.setFeaturedImage(img.site_id, img.id, actorName);
    refresh();
    alert('تم تعيين الصورة كصورة رئيسية شاخصة للمعلم.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#78350F]">الخزينة البصرية</p>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">مكتبة الوسائط والصور</h1>
          <p className="text-sm text-stone-600 mt-1">
            إدارة الصور، التوثيق الميداني، تجريد الميتاداتا، ضبط الحقوق والتراخيص، وتعيين الصور الرئيسية.
          </p>
        </div>
        <button onClick={() => setIsUploading(true)} className={primaryBtn}>
          <Upload className="w-4 h-4 ml-1.5" />
          رفع صورة جديدة
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-3 text-stone-400" />
          <input
            className={inputClass + ' pr-9'}
            placeholder="بحث بالوصف، المصور، أو النص البديل…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className={inputClass + ' !w-auto min-w-[160px]'}
            value={selectedSiteFilter}
            onChange={e => setSelectedSiteFilter(e.target.value)}
          >
            <option value="all">جميع المعالم ({images.length})</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name_ar}</option>
            ))}
          </select>
          <select
            className={inputClass + ' !w-auto min-w-[150px]'}
            value={selectedRightsFilter}
            onChange={e => setSelectedRightsFilter(e.target.value)}
          >
            <option value="all">جميع التراخيص</option>
            <option value="Public Domain">ملك عام (Public Domain)</option>
            <option value="Creative Commons">المشاع الإبداعي (CC)</option>
            <option value="Copyrighted">حقوق محفوظة (حق النشر للأرشيف)</option>
            <option value="Restricted">استخدام مقيد</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid & Metadata Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Images Grid */}
        <div className="lg:col-span-2">
          {filteredImages.length === 0 ? (
            <div className="bg-white border border-[#E8E2D8] rounded-xl p-12 text-center text-stone-500">
              <Image className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="font-medium">لم يتم العثور على صور مطابقة للبحث أو الفلتر.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredImages.map(img => {
                const site = sites.find(s => s.id === img.site_id);
                const isSelected = selectedImage?.id === img.id;
                return (
                  <div
                    key={img.id}
                    onClick={() => handleSelectImage(img)}
                    className={`group relative bg-white border rounded-xl overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#78350F] ring-2 ring-[#78350F]/20 shadow-md'
                        : 'border-[#E8E2D8] hover:border-[#78350F]/40'
                    }`}
                  >
                    <div className="aspect-square bg-stone-100 overflow-hidden relative">
                      <img
                        src={img.web_url || img.thumb_url}
                        alt={img.alt_text || img.caption || img.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {img.featured && (
                        <span className="absolute top-2 right-2 bg-[#78350F] text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" />
                          رئيسية
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-stone-900 truncate" title={img.caption || img.title}>
                        {img.caption || img.title || 'بلا تعليق'}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {site?.name_ar || 'غير محدد'}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-stone-400">
                        <span>{img.photographer || 'مجهول'}</span>
                        <span className="font-mono text-[#78350F]">{img.rights_status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Image Metadata & Actions Inspector */}
        <div className="lg:col-span-1">
          {selectedImage ? (
            <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 space-y-5 sticky top-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="font-serif font-bold text-stone-900 text-lg">تفاصيل الصورة والترخيص</h3>
                <button
                  type="button"
                  onClick={() => handleDeleteImage(selectedImage)}
                  className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1 cursor-pointer"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </div>

              {/* Preview with quick badge */}
              <div className="rounded-lg overflow-hidden border border-stone-200 aspect-video relative bg-stone-900">
                <img
                  src={selectedImage.web_url || selectedImage.thumb_url}
                  alt={selectedImage.caption || selectedImage.title}
                  className="w-full h-full object-contain"
                />
                {!selectedImage.featured && (
                  <button
                    onClick={() => handleSetPrimary(selectedImage)}
                    className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-stone-900 text-xs px-2.5 py-1 rounded shadow text-center cursor-pointer font-medium flex items-center gap-1"
                  >
                    <Star className="w-3 h-3 text-amber-600" />
                    تعيين كصورة رئيسية
                  </button>
                )}
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveMetadata} className="space-y-3 text-sm">
                <div>
                  <label className={labelClass}>التعليق العربي (Caption) *</label>
                  <input
                    className={inputClass}
                    value={editCaption}
                    onChange={e => setEditCaption(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>المعلم المرتبط</label>
                  <select
                    className={inputClass}
                    value={editSiteId}
                    onChange={e => setEditSiteId(e.target.value)}
                  >
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.name_ar} ({s.permanent_id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>المصور / الجهة الموثقة</label>
                  <input
                    className={inputClass}
                    value={editPhotographer}
                    onChange={e => setEditPhotographer(e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>النص البديل لإمكانية الوصول (Alt Text)</label>
                  <input
                    className={inputClass}
                    value={editAltText}
                    onChange={e => setEditAltText(e.target.value)}
                    placeholder="وصف تفصيلي لمحتوى الصورة لفاقدي البصر"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>حالة الحقوق</label>
                    <select
                      className={inputClass}
                      value={editRights}
                      onChange={e => setEditRights(e.target.value as RightsStatus)}
                    >
                      <option value="Public Domain">Public Domain</option>
                      <option value="Creative Commons">Creative Commons</option>
                      <option value="Copyrighted">Copyrighted</option>
                      <option value="Restricted">Restricted</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>الرخصة المحددة</label>
                    <input
                      className={inputClass}
                      value={editLicense}
                      onChange={e => setEditLicense(e.target.value)}
                      placeholder="CC BY-NC 4.0"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>إشعار حقوق الملكية</label>
                  <input
                    className={inputClass}
                    value={editCopyrightNotice}
                    onChange={e => setEditCopyrightNotice(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <button type="submit" className={primaryBtn + ' w-full'}>
                    حفظ التعديلات الوصفية
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-[#E8E2D8] rounded-xl p-8 text-center text-stone-500">
              <Eye className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-sm">اختر صورة من المكتبة لمعاينة تفاصيلها وتعديل حقوقها والجهة الموثقة.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-serif font-bold text-stone-900">رفع صورة جديدة إلى الأرشيف</h2>
              <button
                onClick={() => setIsUploading(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>اختر ملف الصورة (JPEG, PNG, WebP — حتى 15MB) *</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="w-full text-sm text-stone-500 file:mr-0 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#78350F] file:text-white hover:file:bg-[#92400E] cursor-pointer"
                  required
                />
              </div>

              {uploadPreviewUrl && (
                <div className="rounded-lg overflow-hidden border aspect-video bg-stone-100">
                  <img src={uploadPreviewUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}

              <div>
                <label className={labelClass}>المعلم الأثري المرتبط *</label>
                <select
                  className={inputClass}
                  value={uploadSiteId}
                  onChange={e => setUploadSiteId(e.target.value)}
                  required
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name_ar} ({s.permanent_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>التعليق العربي التوثيقي *</label>
                <input
                  className={inputClass}
                  value={uploadCaption}
                  onChange={e => setUploadCaption(e.target.value)}
                  placeholder="مثال: الواجهة الشرقية لحصن الأخيضر ملتقطة في موسم 2024"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>المصور / المصدر الموثق</label>
                <input
                  className={inputClass}
                  value={uploadPhotographer}
                  onChange={e => setUploadPhotographer(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>حالة الحقوق</label>
                  <select
                    className={inputClass}
                    value={uploadRights}
                    onChange={e => setUploadRights(e.target.value as RightsStatus)}
                  >
                    <option value="Creative Commons">المشاع الإبداعي</option>
                    <option value="Public Domain">ملك عام</option>
                    <option value="Copyrighted">حقوق محفوظة</option>
                    <option value="Restricted">مقيد الاستخدام</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>الرخصة</label>
                  <input
                    className={inputClass}
                    value={uploadLicense}
                    onChange={e => setUploadLicense(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button type="submit" className={primaryBtn + ' flex-1'}>
                  تأكيد الرفع والإدراج
                </button>
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className={ghostBtn}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
