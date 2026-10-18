import { AdminSection } from '../../../types/cms';

export interface AdminNavItem {
  id: AdminSection;
  label: string;
  group: string;
  adminOnly?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', group: 'عام' },
  { id: 'sites', label: 'المواقع الأثرية والتراثية', group: 'المحتوى' },
  { id: 'encyclopedia', label: 'المقالات والمعجم الموسوعي', group: 'المحتوى' },
  { id: 'media', label: 'الصور ومكتبة الوسائط', group: 'المحتوى' },
  { id: 'sources', label: 'المصادر والمراجع', group: 'المحتوى' },
  { id: 'periods', label: 'الحقبات التاريخية', group: 'التصنيفات' },
  { id: 'types', label: 'أنواع المعالم', group: 'التصنيفات' },
  { id: 'areas', label: 'المناطق والمواقع', group: 'التصنيفات' },
  { id: 'homepage', label: 'إدارة الصفحة الرئيسية', group: 'الواجهة' },
  { id: 'navigation', label: 'التنقل والتذييل', group: 'الواجهة' },
  { id: 'verification', label: 'تحقيق المحتوى', group: 'الجودة' },
  { id: 'editorial', label: 'طابور التحرير والاستيراد', group: 'الجودة' },
  { id: 'heritage_editorial', label: 'تحرير المواقع والمقتنيات', group: 'الجودة' },
  { id: 'users', label: 'المستخدمون والمديرون', group: 'النظام', adminOnly: true },
  { id: 'settings', label: 'إعدادات الموقع', group: 'النظام', adminOnly: true },
  { id: 'audit', label: 'سجل النشاط والتدقيق', group: 'النظام' },
];

export const ADMIN_SECTIONS = ADMIN_NAV.map(i => i.id);

export function parseAdminLocation(): { section: AdminSection; entityId?: string } {
  const parts = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parts[0] !== 'admin') {
    return { section: 'dashboard' };
  }
  const section = (parts[1] || 'dashboard') as AdminSection;
  const entityId = parts[2];
  if (!ADMIN_SECTIONS.includes(section)) {
    return { section: 'dashboard' };
  }
  return { section, entityId };
}

export function adminPath(section: AdminSection, entityId?: string): string {
  if (section === 'dashboard') return '/admin';
  return entityId ? `/admin/${section}/${entityId}` : `/admin/${section}`;
}
