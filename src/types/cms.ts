/**
 * CMS configuration for the public archive chrome.
 * Stored in archiveStore and mirrored to Laravel `settings` when the API is available.
 */

export interface CmsNavItem {
  id: string;
  label_ar: string;
  tab: string;
  visible: boolean;
  sort_order: number;
}

export interface CmsFooterLink {
  id: string;
  label_ar: string;
  tab: string;
}

export interface CmsFooterColumn {
  id: string;
  title_ar: string;
  links: CmsFooterLink[];
}

export interface CmsHomepage {
  headline: string;
  description: string;
  search_placeholder: string;
  announcement_active: boolean;
  announcement_text: string;
  announcement_link_text: string;
  announcement_link_tab: string;
}

export interface CmsSiteSettings {
  site_name_ar: string;
  site_name_en: string;
  tagline_ar: string;
  contact_email: string;
  contact_note: string;
  footer_copyright: string;
  allow_public_contributions: boolean;
}

export interface CmsConfig {
  homepage: CmsHomepage;
  navigation: CmsNavItem[];
  footer_columns: CmsFooterColumn[];
  settings: CmsSiteSettings;
}

export const DEFAULT_CMS_CONFIG: CmsConfig = {
  homepage: {
    headline: 'ذاكرة كربلاء المعمارية والأثرية',
    description:
      'سجل رقمي توثيقي مكرّس لحصر وتوثيق المعالم الأثرية والتاريخية في محافظة كربلاء، مسنداً بالمصادر الأكاديمية وسجلات التوثيق والمطابقة العلمية.',
    search_placeholder: 'ابحث باسم المعلم، الموقع، الفترة، أو الرقم الأرشيفي…',
    announcement_active: false,
    announcement_text: '',
    announcement_link_text: '',
    announcement_link_tab: 'registry',
  },
  navigation: [
    { id: 'nav_home', label_ar: 'الرئيسية', tab: 'home', visible: true, sort_order: 1 },
    { id: 'nav_registry', label_ar: 'الآثار والمعالم', tab: 'registry', visible: true, sort_order: 2 },
    { id: 'nav_museums', label_ar: 'المتاحف', tab: 'museums', visible: true, sort_order: 3 },
    { id: 'nav_map', label_ar: 'الخريطة', tab: 'map', visible: true, sort_order: 4 },
    { id: 'nav_sources', label_ar: 'المصادر', tab: 'sources', visible: true, sort_order: 5 },
    { id: 'nav_about', label_ar: 'عن المشروع', tab: 'about', visible: true, sort_order: 6 },
  ],
  footer_columns: [
    {
      id: 'footer_archive',
      title_ar: 'أقسام الأرشيف',
      links: [
        { id: 'fl_registry', label_ar: 'سجل المواقع الشامل (A-Z)', tab: 'registry' },
        { id: 'fl_map', label_ar: 'الخريطة الطوبوغرافية والأثرية', tab: 'map' },
        { id: 'fl_timeline', label_ar: 'الخط الزمني للحقب التاريخية', tab: 'timeline' },
        { id: 'fl_hierarchy', label_ar: 'تصفح المناطق والبوادي', tab: 'hierarchy' },
        { id: 'fl_lost', label_ar: 'المواقع المندثرة والمفقودة', tab: 'lost_sites' },
        { id: 'fl_research', label_ar: 'مواقع قيد التحقيق الميداني', tab: 'under_research' },
      ],
    },
    {
      id: 'footer_knowledge',
      title_ar: 'المعرفة والإسناد',
      links: [
        { id: 'fl_sources', label_ar: 'فهرس المصادر والمراجع (Bibliography)', tab: 'sources' },
        { id: 'fl_ency', label_ar: 'المعجم الموسوعي للمصطلحات', tab: 'encyclopedia' },
        { id: 'fl_method', label_ar: 'منهجية التحقيق وسياسة الذكاء الاصطناعي', tab: 'methodology' },
        { id: 'fl_changelog', label_ar: 'سجل التعديلات وما استجدّ', tab: 'changelog' },
      ],
    },
    {
      id: 'footer_policy',
      title_ar: 'الشفافية والسياسات',
      links: [
        { id: 'fl_about', label_ar: 'عن المشروع وهيئة التحرير والتواصل', tab: 'about' },
        { id: 'fl_privacy', label_ar: 'سياسة الخصوصية وحفظ البيانات', tab: 'privacy' },
        { id: 'fl_copyright', label_ar: 'سياسة حقوق الملكية الفكرية واستخدام الصور', tab: 'copyright' },
        { id: 'fl_terms', label_ar: 'شروط الاستخدام وسياسة المساهمات المجتمعية', tab: 'terms' },
        { id: 'fl_coords', label_ar: 'حماية وتعتيم الإحداثيات الحساسة', tab: 'data_policy' },
      ],
    },
  ],
  settings: {
    site_name_ar: 'أثر كربلاء',
    site_name_en: 'Karbala Heritage Archive',
    tagline_ar: 'الأرشيف الرقمي للمواقع التاريخية والتراثية',
    contact_email: 'archive@karbalaheritage.iq',
    contact_note: 'للتواصل العلمي وهيئة التحرير',
    footer_copyright:
      'أثر كربلاء — الأرشيف الرقمي للتراث والآثار. جميع الحقوق المعنوية محفوظة للباحثين والمصورين والجهات الموثقة.',
    allow_public_contributions: true,
  },
};

export type AdminSection =
  | 'dashboard'
  | 'sites'
  | 'encyclopedia'
  | 'media'
  | 'sources'
  | 'periods'
  | 'types'
  | 'areas'
  | 'homepage'
  | 'navigation'
  | 'users'
  | 'verification'
  | 'settings'
  | 'audit'
  | 'reports'
  | 'heritage_editorial';
