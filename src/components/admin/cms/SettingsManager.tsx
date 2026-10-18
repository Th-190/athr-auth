import React, { useState } from 'react';
import { archiveDB } from '../../../db/archiveStore';
import { CmsSiteSettings } from '../../../types/cms';
import { inputClass, labelClass, primaryBtn, ghostBtn } from './formStyles';
import { Settings, Save, CheckCircle2, Globe, Mail, Shield, Sparkles } from 'lucide-react';

export const SettingsManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [, setTick] = useState(0);
  const cms = archiveDB.getCms();
  const [form, setForm] = useState<CmsSiteSettings>({ ...cms.settings });
  const [seoDescription, setSeoDescription] = useState(
    'سجل رقمي توثيقي مكرّس لحصر وتوثيق المعالم الأثرية والتاريخية في محافظة كربلاء، مسنداً بالمصادر الأكاديمية وسجلات التوثيق والمطابقة العلمية.'
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.site_name_ar.trim() || !form.contact_email.trim()) {
      alert('اسم الموقع والبريد الإلكتروني حقول إلزامية.');
      return;
    }

    archiveDB.updateCms({ settings: form }, actorName);

    // Also sync to backend API if token exists
    try {
      const token = localStorage.getItem('kha_auth_token');
      if (token) {
        await fetch('/api/v1/admin/settings', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            settings: [
              { key: 'site_name_ar', value: form.site_name_ar },
              { key: 'site_name_en', value: form.site_name_en },
              { key: 'tagline_ar', value: form.tagline_ar },
              { key: 'contact_email', value: form.contact_email },
              { key: 'contact_note', value: form.contact_note },
              { key: 'footer_copyright', value: form.footer_copyright },
              { key: 'allow_public_contributions', value: form.allow_public_contributions ? '1' : '0' },
              { key: 'seo_description', value: seoDescription },
            ],
          }),
        });
      }
    } catch {}

    setTick(t => t + 1);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    alert('تم حفظ وتحديث إعدادات الموقع بنجاح، وستنعكس فوراً على الواجهة العامة.');
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#78350F]" />
            إعدادات الموقع العامة
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            الهوية الرسمية، معلومات التواصل، إشعارات الحقوق، وضوابط المساهمات المجتمعية.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Site Identity */}
        <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 space-y-4">
          <h2 className="font-serif font-bold text-base text-stone-900 border-b border-[#E8E2D8] pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#78350F]" />
            الهوية والبيانات التعريفية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>اسم الأرشيف بالعربية *</label>
              <input
                type="text"
                required
                className={inputClass}
                value={form.site_name_ar}
                onChange={e => setForm({ ...form, site_name_ar: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>اسم الأرشيف بالإنجليزية</label>
              <input
                type="text"
                className={inputClass}
                value={form.site_name_en}
                onChange={e => setForm({ ...form, site_name_en: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>الشعار اللفظي (العنوان الفرعي)</label>
            <input
              type="text"
              className={inputClass}
              value={form.tagline_ar}
              onChange={e => setForm({ ...form, tagline_ar: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>الوصف الافتراضي لمحركات البحث (SEO Meta Description)</label>
            <textarea
              rows={3}
              className={inputClass}
              value={seoDescription}
              onChange={e => setSeoDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Contact and Legal */}
        <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 space-y-4">
          <h2 className="font-serif font-bold text-base text-stone-900 border-b border-[#E8E2D8] pb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#78350F]" />
            التواصل وحقوق الملكية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>البريد الإلكتروني الرسمي للتواصل *</label>
              <input
                type="email"
                required
                className={inputClass}
                value={form.contact_email}
                onChange={e => setForm({ ...form, contact_email: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>تنويه التواصل وهيئة التحرير</label>
              <input
                type="text"
                className={inputClass}
                value={form.contact_note}
                onChange={e => setForm({ ...form, contact_note: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>إشعار حقوق الملكية الفكرية في التذييل (Copyright Notice)</label>
            <input
              type="text"
              className={inputClass}
              value={form.footer_copyright}
              onChange={e => setForm({ ...form, footer_copyright: e.target.value })}
            />
          </div>
        </div>

        {/* Community & Governance */}
        <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 space-y-4">
          <h2 className="font-serif font-bold text-base text-stone-900 border-b border-[#E8E2D8] pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#78350F]" />
            المساهمات المجتمعية والنزاهة
          </h2>

          <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <div>
              <div className="font-medium text-stone-900 text-xs sm:text-sm">السماح بالمساهمات المجتمعية العامة</div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                إتاحة نموذج اقتراح وتصحيح المعالم للباحثين والمواطنين، على أن تخضع للمراجعة والتدقيق الإلزامي قبل النشر.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.allow_public_contributions}
                onChange={e => setForm({ ...form, allow_public_contributions: e.target.checked })}
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#78350F]"></div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className={primaryBtn + ' flex items-center gap-2'}>
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </button>
          {isSaved && (
            <span className="text-emerald-700 text-xs flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              تم الحفظ بنجاح
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
