import React, { useState, useMemo, useEffect } from 'react';
import { archiveDB } from '../../../db/archiveStore';
import { SiteImage, RightsStatus } from '../../../types';
import { authService } from '../../../services/authService';
import { inputClass, labelClass, primaryBtn, ghostBtn, dangerBtn } from './formStyles';
import { Image, Upload, Search, Filter, Trash2, CheckCircle2, AlertTriangle, Eye, ArrowUp, ArrowDown, Star, Link, Shield } from 'lucide-react';

function rightsToApi(value: RightsStatus): string {
  return {
    'Public Domain': 'public_domain',
    'Creative Commons': 'creative_commons',
    'Copyrighted - Permission Granted': 'copyrighted_permitted',
    Unknown: 'unknown',
    Restricted: 'restricted',
  }[value];
}

interface Props {
  actorName: string;
}

export const MediaLibraryManager: React.FC<Props> = ({ actorName }) => {
  const [tick, setTick] = useState(0);
  const [images, setImages] = useState<SiteImage[]>([]);
  const refresh = async () => {
    const token = authService.getToken();
    if (!token) return;
    const response = await fetch('/api/v1/admin/media?per_page=100', {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('تعذر تحميل مكتبة الصور من الخادم.');
    const result = await response.json();
    const rights: Record<string, RightsStatus> = {
      public_domain: 'Public Domain', creative_commons: 'Creative Commons',
      copyrighted_permitted: 'Copyrighted - Permission Granted', unknown: 'Unknown', restricted: 'Restricted',
    };
    setImages((result.data || []).map((image: any) => ({
      id: String(image.id), site_id: String(image.site_id), title: image.title || '', caption: image.caption || '',
      description: image.description || '', alt_text: image.alt_text || '', date_taken: image.date_taken || '',
      date_precision: image.date_precision || 'unknown', photographer: image.photographer || '', credit_line: image.credit_line || '',
      license: image.license || '', usage_restrictions: image.usage_restrictions || '',
      rights_status: rights[image.rights_status] || 'Unknown', image_role: image.image_role || 'current_view',
      sort_order: Number(image.sort_order || 0), featured: Boolean(image.featured), visibility: Boolean(image.visibility),
      ai_assisted: Boolean(image.ai_assisted), web_url: image.web_url || '', thumb_url: image.thumbnail_url || '',
      download_url: '', source_ids: [], file_hash_sha256: '',
    })));
    setTick(t => t + 1);
  };
  useEffect(() => { void refresh().catch(error => alert(error.message)); }, []);

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
  const [uploadFile, setUploadFile] = useState<File | null>(null);

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

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;

    try {
      const response = await fetch(`/api/v1/admin/media/${selectedImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${authService.getToken()}` },
        body: JSON.stringify({
          caption_ar: editCaption, photographer: editPhotographer, alt_text: editAltText,
          rights_status: rightsToApi(editRights), license: editLicense, copyright_notice: editCopyrightNotice, site_id: editSiteId,
        }),
      });
      if (!response.ok) throw new Error('تعذر حفظ بيانات الصورة.');
      await refresh();
      setIsEditingMetadata(false);
      alert('تم حفظ البيانات الوصفية وحقوق الصورة بنجاح.');
    } catch (error: any) { alert(error.message); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);

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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPreviewUrl || !uploadFile) {
      alert('يرجى اختيار صورة للرفع.');
      return;
    }
    if (!uploadSiteId) {
      alert('يرجى اختيار المعلم المرتبط بالصورة.');
      return;
    }

    const form = new FormData();
    form.append('image', uploadFile);
    form.append('site_id', uploadSiteId);
    form.append('caption_ar', uploadCaption);
    form.append('photographer', uploadPhotographer);
    form.append('rights_status', rightsToApi(uploadRights));
    form.append('license', uploadLicense);
    try {
      const response = await fetch('/api/v1/admin/media/upload', {
        method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${authService.getToken()}` }, body: form,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || 'تعذر رفع الصورة إلى الخادم.');
      }
      setIsUploading(false); setUploadPreviewUrl(null); setUploadFile(null); setUploadCaption('');
      await refresh();
      alert('تم حفظ الصورة الأصلية في التخزين الدائم. ستظهر بعد اكتمال معالجة المشتقات.');
    } catch (error: any) { alert(error.message); }
  };

  const handleDeleteImage = (img: SiteImage) => {
    const isPrimary = img.featured;
    const confirmMsg = isPrimary
      ? 'تحذير: هذه الصورة هي الصورة الرئيسية للمعلم. هل أنت متأكد من حذفها؟'
      : 'هل أنت متأكد من حذف هذه الصورة من مكتبة الوسائط؟';

    if (!confirm(confirmMsg)) return;

    void fetch(`/api/v1/admin/media/${img.id}`, {
      method: 'DELETE', headers: { Accept: 'application/json', Authorization: `Bearer ${authService.getToken()}` },
    }).then(async response => {
      if (!response.ok) throw new Error('تعذر حذف الصورة من الخادم.');
      if (selectedImage?.id === img.id) { setSelectedImage(null); setIsEditingMetadata(false); }
      await refresh(); alert('تم حذف الصورة من مكتبة الوسائط.');
    }).catch(error => alert(error.message));
  };

  const handleSetPrimary = (img: SiteImage) => {
    void fetch(`/api/v1/admin/media/${img.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${authService.getToken()}` },
      body: JSON.stringify({ is_primary: true }),
    }).then(async response => {
      if (!response.ok) throw new Error('تعذر تعيين الصورة الرئيسية.');
      await refresh(); alert('تم تعيين الصورة كصورة رئيسية شاخصة للمعلم.');
    }).catch(error => alert(error.message));
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
