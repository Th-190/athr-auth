/**
 * «أثر كربلاء» — Karbala Heritage Archive
 * Main Application Entry Point
 */

import React, { useState, useEffect } from 'react';
import { Site, UserRole } from './types';
import { archiveDB } from './db/archiveStore';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomeView } from './components/views/HomeView';
import { RegistryView } from './components/views/RegistryView';
import { MuseumsIndexView } from './components/views/MuseumsIndexView';
import { SiteDetailView } from './components/views/SiteDetailView';
import { SupportingViews } from './components/views/SupportingViews';
import { AdminConsole } from './components/admin/AdminConsole';
import { ArchiveMap } from './components/map/ArchiveMap';
import { DesignSystemCatalog } from './components/foundation/DesignSystemCatalog';
import { SecurityReviewConsole } from './components/admin/SecurityReviewConsole';
import { BrandedErrorPage } from './components/views/BrandedErrorPages';
import { PolicyPages } from './components/views/PolicyPages';
import { InstantSearchModal } from './components/common/InstantSearchModal';
import { MyListModal } from './components/common/MyListModal';
import { ReadingPreferencesModal, ReadingPreferences } from './components/common/ReadingPreferencesModal';
import { authService, AuthUser } from './services/authService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    return 'home';
  });
  const [tabParam, setTabParam] = useState<string | undefined>(undefined);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [, setArchiveTick] = useState(0);

  // Authenticated user session managed by Laravel sessions and server-side RBAC.
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

  // Modal visibility states
  const [isInstantSearchOpen, setIsInstantSearchOpen] = useState(false);
  const [isMyListOpen, setIsMyListOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Synchronize currentUser from authService
  useEffect(() => {
    void archiveDB.syncPublishedFromBackend().catch(() => {
      // Keep demo fixtures available during local work; production must not present
      // stale browser/demo content as the shared archive database.
      if (!import.meta.env.DEV) archiveDB.clearPublishedCache();
    });
    void authService.refreshSession();
    return authService.subscribe(user => {
      setCurrentUser(user);
    });
  }, []);

  // Synchronize with archiveDB so any admin edit immediately re-renders public pages
  useEffect(() => {
    return archiveDB.subscribe(() => {
      setArchiveTick(t => t + 1);
    });
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        setCurrentTab('admin');
      } else if (currentTab === 'admin') {
        setCurrentTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentTab]);

  const currentUserRole: UserRole =
    currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
      ? 'Admin'
      : currentUser?.role === 'editor'
      ? 'Editor'
      : 'Visitor';

  // Reading-comfort preferences (remembered in localStorage)
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('kha_reading_preferences') : null;
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (
          parsed && typeof parsed === 'object' &&
          'fontSize' in parsed && ['normal', 'medium', 'large'].includes(String(parsed.fontSize)) &&
          'highContrast' in parsed && typeof parsed.highContrast === 'boolean' &&
          'numeralSystem' in parsed && ['arabic', 'latin'].includes(String(parsed.numeralSystem))
        ) {
          return parsed as ReadingPreferences;
        }
      }
    } catch {
      // Storage can be unavailable in private browsing or locked-down contexts.
    }
    return {
      fontSize: 'normal',
      highContrast: false,
      numeralSystem: 'latin',
    };
  });
  const [preferenceSaveError, setPreferenceSaveError] = useState(false);

  const handleUpdatePreferences = (newPrefs: Partial<ReadingPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    try {
      window.localStorage.setItem('kha_reading_preferences', JSON.stringify(updated));
      setPreferences(updated);
      setPreferenceSaveError(false);
    } catch {
      setPreferenceSaveError(true);
    }
  };



  // Keyboard shortcut: Press "/" to focus instant search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !isInstantSearchOpen &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsInstantSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isInstantSearchOpen]);

  // Dynamic document title & meta tags per page
  useEffect(() => {
    let title = 'أثر كربلاء | Karbala Heritage Archive';
    let desc = 'الأرشيف الرقمي الموثّق للمواقع الأثرية والتاريخية والتراثية في محافظة كربلاء، العراق.';

    if (currentTab === 'site_detail' && selectedSite) {
      title = `${selectedSite.name_ar} (${selectedSite.permanent_id}) | أثر كربلاء`;
      desc = selectedSite.short_description || desc;
    } else if (currentTab === 'registry') {
      title = 'سجل المواقع الأثرية والتراثية | أثر كربلاء';
      desc = 'فهرس الشواهد والمواقع الأثرية الشاخصة في كربلاء ومسارات القوافل والتحقيق الميداني.';
    } else if (currentTab === 'museums') {
      title = 'متاحف ومعارض كربلاء التراثية | أثر كربلاء';
      desc = 'فهرس المتاحف التخصصية والمعارض التراثية في محافظة كربلاء وتوثيق مقتنياتها وإجراءات زيارتها.';
    } else if (currentTab === 'map') {
      title = 'الخريطة الأثرية الشاملة | أثر كربلاء';
      desc = 'المسح الطوبوغرافي والتوزيع الجغرافي للمواقع الأثرية والبوادي في محافظة كربلاء.';
    } else if (currentTab === 'sources') {
      title = 'فهرس المصادر والمراجع الأكاديمية | أثر كربلاء';
      desc = 'ببليوغرافيا الدراسات التاريخية والمسوح الأثرية المعتمدة في توثيق آثار كربلاء.';
    } else if (currentTab === 'methodology') {
      title = 'منهجية التحقيق وسياسة الذكاء الاصطناعي | أثر كربلاء';
      desc = 'معايير التدقيق الأكاديمي، ضوابط النزاهة المعرفية، وسياسة التحقق البشري الصارم.';
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
  }, [currentTab, selectedSite]);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTab, selectedSite]);

  const handleNavigate = (tab: string, param?: string) => {
    setCurrentTab(tab);
    setTabParam(param);
    setSelectedSite(null);
    if (tab === 'admin') {
      const targetPath = param ? `/admin/${param}` : '/admin';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } else if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/');
    }
  };

  const handleSelectSite = (site: Site) => {
    setSelectedSite(site);
    setCurrentTab('site_detail');
  };

  const allSites = archiveDB.getAllSites(false);

  // Compute root font size class based on comfort preferences
  const fontSizeClass =
    preferences.fontSize === 'large'
      ? 'text-[17px]'
      : preferences.fontSize === 'medium'
      ? 'text-[16px]'
      : 'text-[15px]';

  const contrastAttribute = preferences.highContrast ? 'high' : 'standard';

  // Dedicated layout for Admin CMS
  if (currentTab === 'admin') {
    return (
      <div className={`min-h-screen bg-[#F8F6F2] text-[#1C1917] w-full max-w-full ${fontSizeClass}`}>
        <AdminConsole
          currentUserRole={currentUserRole}
          onSelectSite={handleSelectSite}
          initialTab={tabParam}
          onNavigateHome={() => handleNavigate('home')}
        />
      </div>
    );
  }

  return (
    <div data-reading-contrast={contrastAttribute} className={`min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917] w-full max-w-full overflow-x-hidden ${fontSizeClass}`}>
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenInstantSearch={() => setIsInstantSearchOpen(true)}
        onOpenMyList={() => setIsMyListOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onSelectSite={handleSelectSite}
        numeralSystem={preferences.numeralSystem}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-6 sm:py-8 w-full max-w-full min-w-0">
        {/* Detail view */}
        {currentTab === 'site_detail' && selectedSite ? (
          <SiteDetailView
            site={selectedSite}
            onBack={() => handleNavigate('registry')}
            onSelectSite={handleSelectSite}
            onNavigate={handleNavigate}
          />
        ) : currentTab === 'home' ? (
          <HomeView
            onNavigate={handleNavigate}
            onSelectSite={handleSelectSite}
            numeralSystem={preferences.numeralSystem}
          />
        ) : currentTab === 'registry' ? (
          <RegistryView
            initialSearchQuery={tabParam || ''}
            onSelectSite={handleSelectSite}
            onNavigate={handleNavigate}
          />
        ) : currentTab === 'museums' ? (
          <MuseumsIndexView
            onSelectSite={handleSelectSite}
            onNavigate={handleNavigate}
            currentUser={currentUser}
          />
        ) : currentTab === 'map' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="border-b border-stone-200 pb-3">
              <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
                المسح الطوبوغرافي
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                الخريطة الأثرية الشاملة لمحافظة كربلاء
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
                استعراض التوزيع الجغرافي للمعالم الشاخصة والتلول الأثرية مع مراعاة حجب وتعتيم إحداثيات المواقع الحساسة.
              </p>
            </div>
            <ArchiveMap
              sites={allSites}
              onSelectSite={handleSelectSite}
              height="650px"
            />
          </div>
        ) : currentTab === 'hierarchy' ? (
          <PolicyPages
            policyType="hierarchy"
            onSelectSite={handleSelectSite}
            onNavigate={handleNavigate}
          />
        ) : currentTab === 'privacy' || currentTab === 'data_policy' || currentTab === 'data_retention' ? (
          <PolicyPages
            policyType="privacy"
            onNavigate={handleNavigate}
          />
        ) : currentTab === 'copyright' || currentTab === 'rights_policy' || currentTab === 'image_usage' ? (
          <PolicyPages
            policyType="copyright"
            onNavigate={handleNavigate}
          />
        ) : currentTab === 'terms' || currentTab === 'contribution_policy' ? (
          <PolicyPages
            policyType="terms"
            onNavigate={handleNavigate}
          />
        ) : currentTab === 'design_system' ? (
          <DesignSystemCatalog onBackToApp={() => handleNavigate('home')} />
        ) : currentTab === 'security_audit' ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-6">
            <SecurityReviewConsole currentUserRole={currentUserRole} />
          </div>
        ) : currentTab === 'admin' ? (
          <AdminConsole
            currentUserRole={currentUserRole}
            onSelectSite={handleSelectSite}
            initialTab={tabParam || 'quality'}
          />
        ) : currentTab.startsWith('error_') ? (
          <BrandedErrorPage
            code={parseInt(currentTab.replace('error_', ''), 10) as any || 404}
            onGoHome={() => handleNavigate('home')}
          />
        ) : (
          <SupportingViews
            viewType={currentTab as any}
            activeParam={tabParam}
            onSelectSite={handleSelectSite}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        numeralSystem={preferences.numeralSystem}
      />

      {/* Feature 1: Instant Search Modal */}
      {isInstantSearchOpen && (
        <InstantSearchModal
          isOpen={isInstantSearchOpen}
          onClose={() => setIsInstantSearchOpen(false)}
          onSelectSite={handleSelectSite}
          onNavigate={handleNavigate}
        />
      )}

      {/* Feature 3: My List / Bookmarks Modal */}
      {isMyListOpen && (
        <MyListModal
          isOpen={isMyListOpen}
          onClose={() => setIsMyListOpen(false)}
          onSelectSite={handleSelectSite}
        />
      )}

      {/* Feature 6: Reading Comfort Preferences Modal */}
      {isPreferencesOpen && (
        <ReadingPreferencesModal
          isOpen={isPreferencesOpen}
          onClose={() => setIsPreferencesOpen(false)}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          saveError={preferenceSaveError}
        />
      )}

    </div>
  );
}
