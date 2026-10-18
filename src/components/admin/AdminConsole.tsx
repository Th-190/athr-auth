import React, { useState, useEffect } from 'react';
import { UserRole, Site } from '../../types';
import { AdminSection } from '../../types/cms';
import { ADMIN_NAV, parseAdminLocation, adminPath } from './cms/adminNav';
import { DashboardHome } from './cms/DashboardHome';
import { SitesManager } from './cms/SitesManager';
import {
  EncyclopediaManager,
  SourcesManager,
  PeriodsManager,
  TypesManager,
  AreasManager,
  TagsManager,
} from './cms/ContentManagers';
import { MediaLibraryManager } from './cms/MediaLibraryManager';
import { HomepageManager } from './cms/HomepageManager';
import { NavigationFooterManager } from './cms/NavigationFooterManager';
import { UsersManager } from './cms/UsersManager';
import { VerificationManager } from './cms/VerificationManager';
import { SettingsManager } from './cms/SettingsManager';
import { AuditLogManager } from './cms/AuditLogManager';
import { HeritageEditorialManager } from './cms/HeritageEditorialManager';
import { authService } from '../../services/authService';
import {
  LayoutDashboard,
  Landmark,
  BookOpen,
  Image as ImageIcon,
  Library,
  Clock,
  Layers,
  MapPin,
  Home,
  Menu as MenuIcon,
  CheckCircle,
  FileCheck,
  Users,
  Settings as SettingsIcon,
  History,
  Shield,
  ArrowRight,
  ExternalLink,
  LogOut,
  X,
  Compass,
  AlertCircle,
  FolderGit2,
  FileEdit,
} from 'lucide-react';

interface AdminConsoleProps {
  currentUserRole: UserRole;
  onSelectSite?: (site: Site) => void;
  initialTab?: string;
  onNavigateHome?: () => void;
}

const SECTION_ICONS: Record<AdminSection, React.ReactNode> = {
  dashboard: <LayoutDashboard className="w-4 h-4" />,
  sites: <Landmark className="w-4 h-4" />,
  encyclopedia: <BookOpen className="w-4 h-4" />,
  media: <ImageIcon className="w-4 h-4" />,
  sources: <Library className="w-4 h-4" />,
  periods: <Clock className="w-4 h-4" />,
  types: <Layers className="w-4 h-4" />,
  areas: <MapPin className="w-4 h-4" />,
  homepage: <Home className="w-4 h-4" />,
  navigation: <MenuIcon className="w-4 h-4" />,
  verification: <FileCheck className="w-4 h-4" />,
  editorial: <FolderGit2 className="w-4 h-4" />,
  heritage_editorial: <FileEdit className="w-4 h-4" />,
  users: <Users className="w-4 h-4" />,
  settings: <SettingsIcon className="w-4 h-4" />,
  audit: <History className="w-4 h-4" />,
};

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUserRole,
  onSelectSite,
  initialTab,
  onNavigateHome,
}) => {
  const [section, setSection] = useState<AdminSection>(() => {
    if (initialTab && (ADMIN_NAV.some(i => i.id === initialTab))) {
      return initialTab as AdminSection;
    }
    const loc = parseAdminLocation();
    return loc.section;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = authService.getCurrentUser();
  const actorName = user?.name || (currentUserRole === 'Admin' ? 'مدير الأرشيف' : 'محرر توثيق');

  // Sync browser URL when section changes
  const handleSelectSection = (newSection: AdminSection) => {
    setSection(newSection);
    setIsMobileMenuOpen(false);
    const path = adminPath(newSection);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const loc = parseAdminLocation();
      setSection(loc.section);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Access Control: Only Admin and Editor roles may access Admin CMS
  const hasAccess =
    currentUserRole === 'Admin' ||
    currentUserRole === 'Editor' ||
    user?.role === 'admin' ||
    user?.role === 'editor';

  if (!hasAccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 text-center shadow-lg space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900">
            الوصول مقيّد — منطقة إدارية
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            لوحة الإدارة مخصصة لهيئة التحرير والمحققين الأكاديميين المعتمدين في مشروع «أثر كربلاء». ليس لديك صلاحيات كافية لاستعراض هذا القسم.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              العودة إلى الواجهة العامة للأرشيف
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Navigation items grouped by category
  const groups = Array.from(new Set(ADMIN_NAV.map(i => i.group)));

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-stone-900 flex flex-col antialiased" dir="rtl">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-30 bg-[#1C1917] text-[#FAF8F5] border-b border-stone-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-stone-800 cursor-pointer"
            aria-label="القائمة الإدارية"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#78350F] text-amber-200 flex items-center justify-center font-serif font-bold text-xs shadow-inner">
              أثر
            </div>
            <div>
              <div className="font-serif font-bold text-sm tracking-wide text-[#FAF8F5]">
                أثر كربلاء
                <span className="text-amber-500 text-xs mr-2 font-normal">| لوحة إدارة المحتوى (CMS)</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Info & Link to Public Site */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-300 bg-stone-900/80 px-3 py-1.5 rounded-lg border border-stone-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium">{actorName}</span>
            <span className="text-[10px] text-amber-400 font-mono">
              ({currentUserRole === 'Admin' ? 'مدير عام' : 'محرر'})
            </span>
          </div>

          <button
            onClick={() => {
              if (onNavigateHome) onNavigateHome();
              else {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg transition-colors cursor-pointer border border-stone-700"
            title="الانتقال للموقع العام"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">عرض الموقع العام</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </button>
        </div>
      </header>

      {/* Main Admin Workspace (Sidebar + Content) */}
      <div className="flex-1 flex w-full max-w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-l border-[#E8E2D8] min-h-[calc(100vh-53px)] shrink-0 p-4 space-y-6">
          <nav className="space-y-5">
            {groups.map(group => {
              const items = ADMIN_NAV.filter(i => i.group === group);
              return (
                <div key={group} className="space-y-1">
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-2 pb-1">
                    {group}
                  </div>
                  {items.map(item => {
                    // Check adminOnly restriction
                    if (item.adminOnly && currentUserRole !== 'Admin' && user?.role !== 'admin') {
                      return null;
                    }
                    const isActive = section === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSection(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-right ${
                          isActive
                            ? 'bg-[#78350F] text-white shadow-xs font-bold'
                            : 'text-stone-700 hover:bg-stone-100/80 hover:text-stone-900'
                        }`}
                      >
                        <span className={isActive ? 'text-amber-200' : 'text-stone-400'}>
                          {SECTION_ICONS[item.id]}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full p-4 overflow-y-auto space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
                <div className="font-serif font-bold text-stone-900">أقسام لوحة الإدارة</div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-4">
                {groups.map(group => {
                  const items = ADMIN_NAV.filter(i => i.group === group);
                  return (
                    <div key={group} className="space-y-1">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-2 pb-1">
                        {group}
                      </div>
                      {items.map(item => {
                        if (item.adminOnly && currentUserRole !== 'Admin' && user?.role !== 'admin') {
                          return null;
                        }
                        const isActive = section === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectSection(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-right cursor-pointer ${
                              isActive
                                ? 'bg-[#78350F] text-white font-bold'
                                : 'text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            <span className={isActive ? 'text-amber-200' : 'text-stone-400'}>
                              {SECTION_ICONS[item.id]}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </nav>
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)}></div>
          </div>
        )}

        {/* Dynamic Section Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden min-w-0">
          {section === 'dashboard' && <DashboardHome onNavigateSection={handleSelectSection} />}
          {section === 'sites' && <SitesManager actorName={actorName} onSelectSite={onSelectSite} />}
          {section === 'encyclopedia' && <EncyclopediaManager actorName={actorName} />}
          {section === 'media' && <MediaLibraryManager actorName={actorName} />}
          {section === 'sources' && <SourcesManager actorName={actorName} />}
          {section === 'periods' && <PeriodsManager actorName={actorName} />}
          {section === 'types' && <TypesManager actorName={actorName} />}
          {section === 'areas' && <AreasManager actorName={actorName} />}
          {section === 'homepage' && <HomepageManager actorName={actorName} />}
          {section === 'navigation' && <NavigationFooterManager actorName={actorName} />}
          {section === 'verification' && <VerificationManager actorName={actorName} />}
          {section === 'editorial' && <VerificationManager actorName={actorName} />}
          {section === 'heritage_editorial' && <HeritageEditorialManager />}
          {section === 'users' && <UsersManager actorName={actorName} />}
          {section === 'settings' && <SettingsManager actorName={actorName} />}
          {section === 'audit' && <AuditLogManager />}
        </main>
      </div>
    </div>
  );
};
