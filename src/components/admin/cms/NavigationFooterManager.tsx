import React, { useEffect, useState } from 'react';
import { archiveDB } from '../../../db/archiveStore';
import { CmsConfig, CmsNavItem, CmsFooterColumn, mergeCmsConfig } from '../../../types/cms';
import { cmsApi } from '../../../services/cmsApi';
import { inputClass, labelClass, primaryBtn, ghostBtn, dangerBtn } from './formStyles';
import { Compass, Columns, Eye, EyeOff, Save, CheckCircle2, ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';

interface Props {
  actorName: string;
}

export const NavigationFooterManager: React.FC<Props> = ({ actorName }) => {
  const [cms, setCms] = useState<CmsConfig>(() => mergeCmsConfig(archiveDB.getCms()));
  const [navItems, setNavItems] = useState<CmsNavItem[]>(cms.navigation);
  const [footerColumns, setFooterColumns] = useState<CmsFooterColumn[]>(cms.footer_columns);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void cmsApi.getAdminCms().then(result => {
      const loaded = mergeCmsConfig(result.cms);
      setCms(loaded); setNavItems(loaded.navigation); setFooterColumns(loaded.footer_columns);
    }).catch(error => setErrorMessage(error instanceof Error ? error.message : 'تعذر تحميل إعدادات التنقل.'))
      .finally(() => setLoading(false));
  }, []);

  // Reorder Navigation Item
  const handleMoveNav = (index: number, direction: 'up' | 'down') => {
    const copy = [...navItems];
    if (direction === 'up' && index > 0) {
      [copy[index], copy[index - 1]] = [copy[index - 1], copy[index]];
    } else if (direction === 'down' && index < copy.length - 1) {
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
    }
    // Update sort_order numbers
    copy.forEach((item, idx) => {
      item.sort_order = idx + 1;
    });
    setNavItems(copy);
  };

  const handleToggleNavVisibility = (id: string) => {
    setNavItems(prev =>
      prev.map(item => (item.id === id ? { ...item, visible: !item.visible } : item))
    );
  };

  const handleNavLabelChange = (id: string, newLabel: string) => {
    setNavItems(prev =>
      prev.map(item => (item.id === id ? { ...item, label_ar: newLabel } : item))
    );
  };

  // Footer Column Title Change
  const handleColumnTitleChange = (colIndex: number, newTitle: string) => {
    const copy = [...footerColumns];
    copy[colIndex].title_ar = newTitle;
    setFooterColumns(copy);
  };

  // Footer Link Label Change
  const handleFooterLinkLabelChange = (colIndex: number, linkIndex: number, newLabel: string) => {
    const copy = [...footerColumns];
    copy[colIndex].links[linkIndex].label_ar = newLabel;
    setFooterColumns(copy);
  };

  // Add Link to Column
  const handleAddFooterLink = (colIndex: number) => {
    const copy = [...footerColumns];
    copy[colIndex].links.push({
      id: `fl_${Date.now()}`,
      label_ar: 'رابط جديد',
      tab: 'registry',
    });
    setFooterColumns(copy);
  };

  // Delete Link from Column
  const handleDeleteFooterLink = (colIndex: number, linkIndex: number) => {
    const copy = [...footerColumns];
    copy[colIndex].links.splice(linkIndex, 1);
    setFooterColumns(copy);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErrorMessage('');
    try {
      const result = await cmsApi.saveCms({ ...cms, navigation: navItems, footer_columns: footerColumns });
      const saved = mergeCmsConfig(result.cms);
      archiveDB.updateCms(saved, actorName);
      setCms(saved); setNavItems(saved.navigation); setFooterColumns(saved.footer_columns);
      setStatusMessage(result.message || 'تم حفظ إعدادات التنقل والتذييل.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر حفظ إعدادات التنقل والتذييل.');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#78350F]">هيكلية الواجهة</p>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">التنقل والتذييل (Navigation & Footer)</h1>
          <p className="text-sm text-stone-600 mt-1">
            إدارة روابط شريط الترويسة العلوي وأعمدة التذييل، وتعديل المسميات والترتيب والظهور في الموقع العام.
          </p>
        </div>
        <button type="submit" disabled={loading || saving} className={primaryBtn + ' disabled:opacity-60'}>
          <Save className="w-4 h-4 ml-1.5" />
          حفظ التغييرات
        </button>
      </div>

      {loading && <p role="status" className="text-sm text-stone-600">جارٍ تحميل الإعدادات المحفوظة…</p>}
      {errorMessage && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{errorMessage}</p>}

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Navigation Bar Settings */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 space-y-4">
        <h2 className="font-serif font-bold text-stone-900 text-lg flex items-center gap-2 border-b border-stone-100 pb-2">
          <Compass className="w-5 h-5 text-[#78350F]" />
          شريط التنقل العلوي الرئيسي (Header Navbar)
        </h2>

        <div className="divide-y divide-stone-100">
          {navItems.map((item, index) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-xs font-mono">
                  {index + 1}
                </span>
                <input
                  className={inputClass + ' max-w-xs font-medium'}
                  value={item.label_ar}
                  onChange={e => handleNavLabelChange(item.id, e.target.value)}
                />
                <span className="text-xs text-stone-400 font-mono">({item.tab})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleNavVisibility(item.id)}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    item.visible
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-stone-200 bg-stone-50 text-stone-400'
                  }`}
                  title={item.visible ? 'الرابط ظاهر للعموم' : 'الرابط مخفي'}
                >
                  {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{item.visible ? 'ظاهر' : 'مخفي'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMoveNav(index, 'up')}
                  disabled={index === 0}
                  className="p-1.5 hover:bg-stone-100 rounded border border-stone-200 disabled:opacity-30 cursor-pointer"
                  title="تحريك لأعلى"
                >
                  <ArrowUp className="w-4 h-4 text-stone-600" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveNav(index, 'down')}
                  disabled={index === navItems.length - 1}
                  className="p-1.5 hover:bg-stone-100 rounded border border-stone-200 disabled:opacity-30 cursor-pointer"
                  title="تحريك لأسفل"
                >
                  <ArrowDown className="w-4 h-4 text-stone-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Columns Settings */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 space-y-6">
        <h2 className="font-serif font-bold text-stone-900 text-lg flex items-center gap-2 border-b border-stone-100 pb-2">
          <Columns className="w-5 h-5 text-[#78350F]" />
          أعمدة وروابط التذييل (Footer Columns)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {footerColumns.map((col, colIdx) => (
            <div key={col.id} className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3">
              <div>
                <label className={labelClass}>عنوان العمود {colIdx + 1}</label>
                <input
                  className={inputClass + ' font-bold'}
                  value={col.title_ar}
                  onChange={e => handleColumnTitleChange(colIdx, e.target.value)}
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                  <span>الروابط المدرجة ({col.links.length})</span>
                  <button
                    type="button"
                    onClick={() => handleAddFooterLink(colIdx)}
                    className="text-[#78350F] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة رابط
                  </button>
                </div>

                {col.links.map((link, linkIdx) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <input
                      className={inputClass + ' text-xs !py-1.5'}
                      value={link.label_ar}
                      onChange={e => handleFooterLinkLabelChange(colIdx, linkIdx, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteFooterLink(colIdx, linkIdx)}
                      className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                      title="حذف الرابط"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
