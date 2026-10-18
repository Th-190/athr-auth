import React, { useState, useRef, useEffect } from 'react';
import { UserRole, Site } from '../../types';
import { ArchivalLogo } from '../foundation/BrandAssets';
import { archiveDB } from '../../db/archiveStore';
import { formatNumeral } from '../../utils/arabic';
import { AuthUser } from '../../services/authService';
import { UserDropdown } from '../auth/UserDropdown';
import {
  Shield,
  Search,
  Sparkles,
  Bookmark,
  ChevronDown,
  Menu,
  X,
  Compass,
  Eye,
  LogIn,
  Layers,
  MapPin,
  Calendar,
  BookOpen,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenContributeModal: () => void;
  onOpenInstantSearch: () => void;
  onOpenMyList: () => void;
  onOpenPreferences: () => void;
  onOpenAdminModal?: () => void;
  onSelectSite: (site: Site) => void;
  numeralSystem: 'arabic' | 'latin';
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenContributeModal,
  onOpenInstantSearch,
  onOpenMyList,
  onOpenPreferences,
  onOpenAdminModal,
  onSelectSite,
  numeralSystem,
}) => {
  const [isBrowseMenuOpen, setIsBrowseMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const browseMenuRef = useRef<HTMLDivElement>(null);

  const announcement = archiveDB.getAnnouncement();
  const bookmarkedCount = archiveDB.getBookmarkedSiteIds().length;
  const isEditorialUser = currentUser?.role === 'editor' || currentUser?.role === 'admin';

  // Close browse dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (browseMenuRef.current && !browseMenuRef.current.contains(e.target as Node)) {
        setIsBrowseMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRandomSite = () => {
    const site = archiveDB.getRandomSite();
    if (site) {
      onSelectSite(site);
    } else {
      onNavigate('registry');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#EBE6DF]">
      {/* 1. Optional Admin Announcement Bar (renders only when active) */}
      {announcement?.active && (
        <div className="bg-[#78350F] text-[#FDFBF7] text-xs py-2 px-4 sm:px-8 text-center flex items-center justify-center gap-3">
          <span>{announcement.text}</span>
          {announcement.linkText && (
            <button
              onClick={() => onNavigate(announcement.linkTab || 'registry')}
              className="underline font-bold hover:text-amber-200 transition-colors cursor-pointer"
            >
              {announcement.linkText} ←
            </button>
          )}
        </div>
      )}

      {/* 2. Slim Utility Bar */}
      <div className="bg-[#1C1917] text-[#D6CEBE] text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-600" />
            <span className="font-serif text-[12px] sm:text-xs">
              أثر كربلاء: الأرشيف الرقمي للمواقع التاريخية والتراثية
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Reading comfort shortcut */}
            <button
              onClick={onOpenPreferences}
              className="inline-flex items-center gap-1.5 text-[11px] text-stone-300 hover:text-white transition-colors cursor-pointer min-h-[44px] px-2 py-1"
              title="تفضيلات راحة القراءة والخط والتباين"
            >
              <Eye className="w-4 h-4 text-amber-500" />
              <span>راحة القراءة</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-6">
        {/* Brand Wordmark & SVG Seal */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-right cursor-pointer group shrink-0 min-w-0 min-h-[44px] py-1 transition-opacity hover:opacity-90"
        >
          <ArchivalLogo size={34} />
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#1C1917] whitespace-nowrap block leading-tight">
              أثر كربلاء
            </span>
            <span className="text-[10px] tracking-wider uppercase text-stone-500 hidden sm:block -mt-0.5 font-mono truncate">
              <bdi>Karbala Heritage Archive</bdi>
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links (>= 1024px) */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-xs font-medium text-stone-700">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap transition-colors hover:text-[#78350F] cursor-pointer min-h-[44px] flex items-center px-1 ${
              currentTab === 'home' ? 'text-[#78350F] font-bold border-b-2 border-[#78350F]' : ''
            }`}
          >
            الرئيسية
          </button>

          <button
            onClick={() => onNavigate('registry')}
            className={`whitespace-nowrap transition-colors hover:text-[#78350F] cursor-pointer min-h-[44px] flex items-center px-1 ${
              currentTab === 'registry' ? 'text-[#78350F] font-bold border-b-2 border-[#78350F]' : ''
            }`}
          >
            الآثار والمعالم
          </button>

          {/* PART B: Museums Navigation Link */}
          <button
            onClick={() => onNavigate('museums')}
            className={`whitespace-nowrap transition-colors hover:text-[#78350F] cursor-pointer min-h-[44px] flex items-center px-1 ${
              currentTab === 'museums' ? 'text-[#78350F] font-bold border-b-2 border-[#78350F]' : ''
            }`}
          >
            المتاحف
          </button>

          <button
            onClick={() => onNavigate('map')}
            className={`whitespace-nowrap transition-colors hover:text-[#78350F] cursor-pointer min-h-[44px] flex items-center px-1 ${
              currentTab === 'map' ? 'text-[#78350F] font-bold border-b-2 border-[#78350F]' : ''
            }`}
          >
            الخريطة
          </button>

          {/* Grouped Browse Menu («تصفّح») — For 1024px to 1279px and desktop */}
          <div className="relative" ref={browseMenuRef}>
            <button
              onClick={() => setIsBrowseMenuOpen(!isBrowseMenuOpen)}
              className={`whitespace-nowrap inline-flex items-center gap-1 transition-colors hover:text-[#78350F] cursor-pointer min-h-[44px] px-1 ${
                ['hierarchy', 'timeline', 'types', 'encyclopedia', 'lost_sites', 'under_research'].includes(currentTab)
                  ? 'text-[#78350F] font-bold border-b-2 border-[#78350F]'
                  : ''
              }`}
            >
              <span>تصفّح الأقسام</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
            </button>

            {isBrowseMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-lg py-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    setIsBrowseMenuOpen(false);
                    onNavigate('hierarchy');
                  }}
                  className="w-full text-right px-4 py-2.5 hover:bg-stone-50 flex items-center justify-between text-stone-800 min-h-[44px]"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#78350F]" />
                    <span>المناطق والبوادي</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono"><bdi>Hierarchy</bdi></span>
                </button>

                <button
                  onClick={() => {
                    setIsBrowseMenuOpen(false);
                    onNavigate('timeline');
                  }}
                  className="w-full text-right px-4 py-2.5 hover:bg-stone-50 flex items-center justify-between text-stone-800 min-h-[44px]"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#78350F]" />
                    <span>الفترات التاريخية</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono"><bdi>Timeline</bdi></span>
                </button>

                <button
                  onClick={() => {
                    setIsBrowseMenuOpen(false);
                    onNavigate('types');
                  }}
                  className="w-full text-right px-4 py-2.5 hover:bg-stone-50 flex items-center justify-between text-stone-800 min-h-[44px]"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#78350F]" />
                    <span>أنواع المعالم (12 صنفاً)</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono"><bdi>Types</bdi></span>
                </button>

                <button
                  onClick={() => {
                    setIsBrowseMenuOpen(false);
                    onNavigate('encyclopedia');
                  }}
                  className="w-full text-right px-4 py-2.5 hover:bg-stone-50 flex items-center justify-between text-stone-800 min-h-[44px]"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#78350F]" />
                    <span>المعجم الموسوعي</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono"><bdi>Encyclopedia</bdi></span>
                </button>

                <div className="border-t border-stone-100 my-1" />

                <button
                  onClick={() => {
                    setIsBrowseMenuOpen(false);
                    onNavigate('lost_sites');
                  }}
                  className="w-full text-right px-4 py-2.5 hover:bg-stone-50 text-stone-600 min-h-[44px] flex items-center"
                >
                  المواقع المندثرة والمفقودة
                </button>

                <button
                  onClick={() => {
                    setIsBrowseMenuOpen(false);
                    onNavigate('under_research');
                  }}
                  className="w-full text-right px-4 py-2.5 hover:bg-stone-50 text-stone-600 min-h-[44px] flex items-center"
                >
                  مواقع قيد التحقيق الميداني
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('sources')}
            className={`whitespace-nowrap transition-colors hover:text-[#78350F] cursor-pointer min-h-[44px] flex items-center px-1 ${
              currentTab === 'sources' ? 'text-[#78350F] font-bold border-b-2 border-[#78350F]' : ''
            }`}
          >
            المصادر
          </button>

          <button
            onClick={() => onNavigate('about')}
            className={`whitespace-nowrap transition-colors hover:text-[#78350F] cursor-pointer min-h-[44px] flex items-center px-1 ${
              currentTab === 'about' ? 'text-[#78350F] font-bold border-b-2 border-[#78350F]' : ''
            }`}
          >
            عن المشروع
          </button>

          {/* Only shown in main navigation to authenticated Editor/Admin users */}
          {isEditorialUser && (
            <button
              onClick={() => onNavigate('admin')}
              className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#EFECE6] text-stone-800 border border-stone-300 hover:bg-[#E5E0D5] transition-colors cursor-pointer min-h-[44px] ${
                currentTab === 'admin' ? 'border-[#78350F] text-[#78350F] font-bold' : ''
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#78350F]" />
              <span>لوحة التحرير</span>
            </button>
          )}
        </nav>

        {/* Action Controls & Utilities */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Instant Search Bar Button */}
          <button
            onClick={onOpenInstantSearch}
            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 min-h-[44px] min-w-[44px] text-xs text-stone-600 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="بحث فوري سريع (اضغط / من لوحة المفاتيح)"
            aria-label="بحث فوري سريع"
          >
            <Search className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">بحث…</span>
            <kbd className="hidden md:inline font-mono text-[10px] bg-stone-100 text-stone-500 px-1 rounded border border-stone-200">
              /
            </kbd>
          </button>

          {/* «اكتشف موقعًا» Button */}
          <button
            onClick={handleRandomSite}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] text-xs text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors cursor-pointer"
            title="عرض موقع أثري عشوائي للتعرف على تراث كربلاء"
          >
            <Compass className="w-4 h-4 text-[#78350F]" />
            <span className="hidden md:inline">اكتشف موقعًا</span>
          </button>

          {/* «قائمتي» Bookmark Button */}
          <button
            onClick={onOpenMyList}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 min-h-[44px] min-w-[44px] text-xs text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors cursor-pointer"
            title="قائمتي التوثيقية المحفوظة"
            aria-label="قائمتي التوثيقية المحفوظة"
          >
            <Bookmark className="w-4 h-4 text-[#78350F]" />
            <span className="font-mono text-xs font-bold text-[#78350F]">
              <bdi>{formatNumeral(bookmarkedCount, numeralSystem)}</bdi>
            </span>
          </button>

          {/* Primary Action Button: Contribute */}
          <button
            onClick={onOpenContributeModal}
            className="hidden md:inline-flex items-center justify-center px-4 min-h-[44px] text-xs font-medium text-white bg-[#78350F] hover:bg-[#9A3412] active:scale-[0.98] transition-all rounded-lg shadow-2xs whitespace-nowrap cursor-pointer"
          >
            ساهم في التوثيق
          </button>

          {/* Unified Authentication Action in Main Navigation Bar */}
          {currentUser ? (
            <UserDropdown
              user={currentUser}
              onNavigate={onNavigate}
              onLogout={onLogout}
              onOpenMyList={onOpenMyList}
              onOpenAdminModal={onOpenAdminModal}
            />
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] text-xs font-semibold text-stone-900 bg-white hover:bg-stone-50 active:bg-stone-100 border border-stone-300 hover:border-amber-700/60 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="تسجيل الدخول الموحد عبر Google"
            >
              <LogIn className="w-4 h-4 text-[#78350F]" />
              <span className="hidden sm:inline">تسجيل الدخول</span>
            </button>
          )}

          {/* Mobile Drawer Hamburger */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-lg cursor-pointer"
            aria-label="فتح القائمة الرئيسية"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 4. Accessible Slide-Over Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-black/60 backdrop-blur-xs"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="w-72 bg-[#FBF9F5] h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <span className="font-serif font-bold text-lg text-stone-900">أثر كربلاء</span>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 text-stone-500 hover:text-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile User Profile or Login Trigger */}
              <div className="p-3 bg-white border border-stone-200 rounded-xl">
                {currentUser ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          currentUser.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`
                        }
                        alt={currentUser.name}
                        className="w-9 h-9 rounded-full object-cover border border-stone-200"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-stone-900 block truncate">
                          {currentUser.name}
                        </span>
                        <span className="text-[10px] text-[#78350F] font-mono font-semibold">
                          {currentUser.role_ar || currentUser.role}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        onLogout();
                      }}
                      className="w-full text-right text-[11px] text-red-700 hover:underline pt-1 border-t border-stone-100"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full py-2 px-3 bg-[#78350F] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول عبر Google</span>
                  </button>
                )}
              </div>

              <div className="space-y-1 text-sm font-medium">
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onNavigate('home');
                  }}
                  className={`w-full text-right p-3 rounded-lg min-h-[44px] flex items-center ${currentTab === 'home' ? 'bg-[#EFECE6] text-[#78350F] font-bold' : 'text-stone-800 hover:bg-stone-100'}`}
                >
                  الرئيسية
                </button>
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onNavigate('registry');
                  }}
                  className={`w-full text-right p-3 rounded-lg min-h-[44px] flex items-center ${currentTab === 'registry' ? 'bg-[#EFECE6] text-[#78350F] font-bold' : 'text-stone-800 hover:bg-stone-100'}`}
                >
                  الآثار والمعالم الشاملة
                </button>
                {/* PART B: Museums in Drawer */}
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onNavigate('museums');
                  }}
                  className={`w-full text-right p-3 rounded-lg min-h-[44px] flex items-center ${currentTab === 'museums' ? 'bg-[#EFECE6] text-[#78350F] font-bold' : 'text-stone-800 hover:bg-stone-100'}`}
                >
                  المتاحف والمعارض التراثية
                </button>
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onNavigate('map');
                  }}
                  className={`w-full text-right p-3 rounded-lg min-h-[44px] flex items-center ${currentTab === 'map' ? 'bg-[#EFECE6] text-[#78350F] font-bold' : 'text-stone-800 hover:bg-stone-100'}`}
                >
                  الخريطة الطوبوغرافية
                </button>
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onNavigate('hierarchy');
                  }}
                  className={`w-full text-right p-3 rounded-lg min-h-[44px] flex items-center ${currentTab === 'hierarchy' ? 'bg-[#EFECE6] text-[#78350F] font-bold' : 'text-stone-800 hover:bg-stone-100'}`}
                >
                  المناطق والبوادي
                </button>
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onNavigate('timeline');
                  }}
                  className={`w-full text-right p-3 rounded-lg min-h-[44px] flex items-center ${currentTab === 'timeline' ? 'bg-[#EFECE6] text-[#78350F] font-bold' : 'text-stone-800 hover:bg-stone-100'}`}
                >
                  الفترات التاريخية
                </button>
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onNavigate('types');
                  }}
                  className={`w-full text-right p-3 rounded-lg min-h-[44px] flex items-center ${currentTab === 'types' ? 'bg-[#EFECE6] text-[#78350F] font-bold' : 'text-stone-800 hover:bg-stone-100'}`}
                >
                  أنواع المعالم (12 صنفاً)
                </button>
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onNavigate('encyclopedia');
                  }}
                  className={`w-full text-right p-3 rounded-lg min-h-[44px] flex items-center ${currentTab === 'encyclopedia' ? 'bg-[#EFECE6] text-[#78350F] font-bold' : 'text-stone-800 hover:bg-stone-100'}`}
                >
                  المعجم الموسوعي
                </button>
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onNavigate('sources');
                  }}
                  className={`w-full text-right p-3 rounded-lg min-h-[44px] flex items-center ${currentTab === 'sources' ? 'bg-[#EFECE6] text-[#78350F] font-bold' : 'text-stone-800 hover:bg-stone-100'}`}
                >
                  فهرس المصادر
                </button>
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onNavigate('about');
                  }}
                  className={`w-full text-right p-3 rounded-lg min-h-[44px] flex items-center ${currentTab === 'about' ? 'bg-[#EFECE6] text-[#78350F] font-bold' : 'text-stone-800 hover:bg-stone-100'}`}
                >
                  عن المشروع
                </button>

                {isEditorialUser && (
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onNavigate('admin');
                    }}
                    className="w-full text-right p-3 rounded-lg font-bold text-[#78350F] bg-amber-50 border border-amber-200 mt-2 flex items-center gap-2 min-h-[44px]"
                  >
                    <Shield className="w-4 h-4" />
                    <span>لوحة التحرير والإدارة</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 space-y-2">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onOpenContributeModal();
                }}
                className="w-full py-2.5 px-3 min-h-[44px] text-xs bg-[#78350F] text-white rounded-lg font-medium text-center flex items-center justify-center cursor-pointer"
              >
                ساهم في التوثيق
              </button>
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  handleRandomSite();
                }}
                className="w-full py-2.5 px-3 min-h-[44px] text-xs bg-white border border-stone-300 rounded-lg text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#78350F]" />
                <span>اكتشف موقعاً عشوائياً</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onOpenPreferences();
                }}
                className="w-full py-2.5 px-3 min-h-[44px] text-xs bg-white border border-stone-300 rounded-lg text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-stone-600" />
                <span>تفضيلات راحة القراءة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
