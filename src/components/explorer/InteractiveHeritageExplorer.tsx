import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { Site } from '../../types';
import { archiveDB } from '../../db/archiveStore';
import { authService, AuthUser } from '../../services/authService';
import { getPublicCoordinates, normalizeArabic, matchesArabicSearch, formatNumeral } from '../../utils/arabic';
import { VerificationBadge, LocationPrecisionBadge } from '../common/VerificationBadge';
import { AdminUserRoleModal } from '../auth/AdminUserRoleModal';
import {
  Search,
  MapPin,
  Compass,
  Layers,
  Shield,
  User,
  LogIn,
  LogOut,
  X,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Bookmark,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export type HeritageCategory = 'all' | 'religious' | 'historical' | 'heritage';

interface InteractiveHeritageExplorerProps {
  onSelectSite: (site: Site) => void;
  onNavigate: (tab: string, param?: string) => void;
  numeralSystem?: 'arabic' | 'latin';
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

const CATEGORY_CHIPS: { id: HeritageCategory; label_ar: string; icon: string; countHint?: number }[] = [
  { id: 'all', label_ar: 'جميع المواقع', icon: '🏛️' },
  { id: 'religious', label_ar: 'مراقد دينية', icon: '🕌' },
  { id: 'historical', label_ar: 'آثار تاريخية', icon: '🏰' },
  { id: 'heritage', label_ar: 'أماكن تراثية كربلائية', icon: '🏺' },
];

export const InteractiveHeritageExplorer: React.FC<InteractiveHeritageExplorerProps> = ({
  onSelectSite,
  onNavigate,
  numeralSystem = 'latin',
  searchQuery: externalSearchQuery,
  onSearchQueryChange,
}) => {
  // Filter & Search states
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = onSearchQueryChange || setInternalSearchQuery;

  const [activeCategory, setActiveCategory] = useState<HeritageCategory>('all');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  // Authentication & RBAC states (Synchronized with global authService)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    return authService.subscribe(user => {
      setCurrentUser(user);
    });
  }, []);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const cardListRef = useRef<HTMLDivElement>(null);

  // Saved bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(archiveDB.getBookmarkedSiteIds());

  // All database sites
  const allSites = useMemo(() => archiveDB.getAllSites(false), []);

  // Filter sites based on Search query & Category chip
  const filteredSites = useMemo(() => {
    return allSites.filter(site => {
      // 1. Category Filter
      let matchesCategory = true;
      if (activeCategory === 'religious') {
        matchesCategory =
          ['type_religious', 'type_churches'].includes(site.site_type_id) ||
          site.name_ar.includes('مرقد') ||
          site.name_ar.includes('مقام') ||
          site.name_ar.includes('مزار') ||
          site.name_ar.includes('كنيسة') ||
          site.name_ar.includes('مسجد');
      } else if (activeCategory === 'historical') {
        matchesCategory = ['type_palaces_forts', 'type_tells', 'type_defensive'].includes(site.site_type_id);
      } else if (activeCategory === 'heritage') {
        matchesCategory = [
          'type_caravansaries',
          'type_hydraulic',
          'type_bazaars',
          'type_vernacular',
          'type_crafts',
        ].includes(site.site_type_id);
      }

      if (!matchesCategory) return false;

      // 2. Search Query Filter with Arabic normalization
      if (activeSearchQuery.trim()) {
        const fullSearchText = `${site.name_ar} ${site.name_en || ''} ${site.permanent_id} ${site.short_description} ${site.location_description}`;
        return matchesArabicSearch(fullSearchText, activeSearchQuery.trim());
      }

      return true;
    });
  }, [allSites, activeCategory, activeSearchQuery]);

  // Leaflet 1.9.4 Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [32.616, 44.0249], // Karbala City center
        zoom: 10,
        zoomControl: false,
      });

      // Add zoom control on bottom-left for RTL layout
      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      // Warm archival cartography tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | أثر كربلاء',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      // Cleanup on unmount handled gracefully
    };
  }, []);

  // Update Leaflet markers dynamically when filtered sites or selected site changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersMapRef.current.clear();

    const bounds = L.latLngBounds([]);

    filteredSites.forEach(site => {
      const { lat, lng, isFuzzed } = getPublicCoordinates(site.lat, site.lng, site.location_precision);
      bounds.extend([lat, lng]);

      const isSelected = site.id === selectedSiteId;
      const isRestricted = site.location_precision === 'restricted';

      // Category color determination
      let pinColor = '#78350F'; // Default Bronze
      let pinIcon = '🏛️';

      if (['type_religious', 'type_churches'].includes(site.site_type_id) || site.name_ar.includes('مرقد') || site.name_ar.includes('مقام')) {
        pinColor = '#065F46'; // Emerald for religious
        pinIcon = '🕌';
      } else if (['type_palaces_forts', 'type_tells'].includes(site.site_type_id)) {
        pinColor = '#9A3412'; // Terracotta for historical
        pinIcon = '🏰';
      } else if (['type_caravansaries', 'type_hydraulic'].includes(site.site_type_id)) {
        pinColor = '#B45309'; // Amber/Gold for heritage
        pinIcon = '🏺';
      }

      if (isRestricted) {
        pinColor = '#991B1B'; // Rose red for restricted
        pinIcon = '🛡️';
      }

      const customIcon = L.divIcon({
        className: 'custom-heritage-pin',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '38px' : '30px'};
            height: ${isSelected ? '38px' : '30px'};
            background-color: ${pinColor};
            border: ${isSelected ? '3px solid #FEF08A' : '2px solid #FBF9F5'};
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            font-size: ${isSelected ? '14px' : '11px'};
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          ">
            <span>${pinIcon}</span>
          </div>
        `,
        iconSize: [isSelected ? 38 : 30, isSelected ? 38 : 30],
        iconAnchor: [isSelected ? 19 : 15, isSelected ? 19 : 15],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Record values are editor supplied; build popup content with text nodes
      // so markup in a title or description cannot become executable HTML.
      const popup = document.createElement('div');
      popup.dir = 'rtl';
      popup.style.cssText = "text-align:right;font-family:'Cairo',sans-serif;min-width:200px";
      const metadata = document.createElement('div');
      metadata.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px';
      const accession = document.createElement('span');
      accession.textContent = site.permanent_id;
      accession.style.cssText = "font-size:10px;color:#78350F;font-family:'JetBrains Mono',monospace;font-weight:bold";
      metadata.append(accession);
      if (isFuzzed) {
        const locationNote = document.createElement('span');
        locationNote.textContent = isRestricted ? 'إحداثيات محجوبة احترازياً' : 'إحداثيات تقريبية';
        locationNote.style.cssText = 'font-size:9px;background:#FEF2F2;color:#991B1B;padding:1px 4px;border-radius:2px';
        metadata.append(locationNote);
      }
      const title = document.createElement('h4');
      title.textContent = site.name_ar;
      title.style.cssText = "font-size:15px;font-weight:bold;margin:0 0 4px;color:#1C1917;font-family:'Amiri',serif";
      const description = document.createElement('p');
      description.textContent = site.short_description;
      description.style.cssText = 'font-size:11px;color:#57534E;margin:0 0 8px;line-height:1.4';
      const footer = document.createElement('div');
      footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;border-top:1px solid #E7E5E4;padding-top:6px;font-size:11px';
      const verification = document.createElement('span');
      verification.textContent = site.verification_status === 'verified' ? '✓ محقق ومسند' : 'قيد التحقيق';
      verification.style.cssText = 'color:#065F46;font-weight:bold';
      const viewButton = document.createElement('button');
      viewButton.type = 'button';
      viewButton.textContent = 'تفاصيل السجل ←';
      viewButton.setAttribute('aria-label', `تفاصيل سجل ${site.name_ar}`);
      viewButton.style.cssText = 'color:#78350F;font-weight:bold;cursor:pointer;background:none;border:0;text-decoration:underline';
      viewButton.addEventListener('click', () => onSelectSite(site));
      footer.append(verification, viewButton);
      popup.append(metadata, title, description, footer);
      marker.bindPopup(popup);

      marker.on('click', () => {
        setSelectedSiteId(site.id);
        // Scroll the matching card into view in the side deck
        const cardElem = document.getElementById(`credit-card-${site.id}`);
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      marker.addTo(layer);
      markersMapRef.current.set(site.id, marker);
    });

    // Auto-fit bounds if markers exist
    if (filteredSites.length > 0 && bounds.isValid() && !selectedSiteId) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredSites, selectedSiteId, onSelectSite]);

  // Center on site when card is clicked
  const handleCardClick = (site: Site) => {
    setSelectedSiteId(site.id);
    const map = mapInstanceRef.current;
    if (map) {
      const { lat, lng } = getPublicCoordinates(site.lat, site.lng, site.location_precision);
      map.flyTo([lat, lng], 13, { duration: 1 });
      const marker = markersMapRef.current.get(site.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const handleToggleBookmark = (e: React.MouseEvent, siteId: string) => {
    e.stopPropagation();
    archiveDB.toggleBookmark(siteId);
    setBookmarkedIds(archiveDB.getBookmarkedSiteIds());
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Category Chips & Map Filtering Bar */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Chips Filter Bar [جميع المواقع, مراقد دينية, آثار تاريخية, أماكن تراثية كربلائية] */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-serif font-bold text-stone-700 ml-1">التصنيف:</span>
            {CATEGORY_CHIPS.map(chip => {
              const isActive = activeCategory === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setActiveCategory(chip.id);
                    setSelectedSiteId(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#78350F] text-white shadow-xs font-bold scale-102'
                      : 'bg-[#F7F4EE] text-stone-700 hover:bg-[#EFEAE1] border border-[#E5DFD5]'
                  }`}
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label_ar}</span>
                </button>
              );
            })}
          </div>

          {/* Counts & Active Search / Filter Indicators */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-mono">
            {activeSearchQuery && (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-[#78350F] border border-amber-200 px-3 py-1 rounded-full font-sans text-xs">
                <span>تصفية بالبحث: &ldquo;{activeSearchQuery}&rdquo;</span>
                <button
                  onClick={() => handleSearchChange('')}
                  className="p-0.5 hover:text-stone-900 rounded-full cursor-pointer"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            <span className="font-medium text-stone-700 bg-stone-100 px-3 py-1 rounded-full">
              عرض {formatNumeral(filteredSites.length, numeralSystem)} معلماً
            </span>
            {activeCategory !== 'all' && (
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSelectedSiteId(null);
                }}
                className="text-[#78350F] hover:underline font-sans cursor-pointer min-h-[44px] flex items-center px-1"
              >
                (إلغاء الفلتر)
              </button>
            )}
          </div>
        </div>

        {/* Active User Session & Role Bar if logged in */}
        {currentUser && (
          <div className="pt-2.5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <img
                src={
                  currentUser.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`
                }
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover border border-stone-300 shrink-0"
              />
              <span className="font-medium text-stone-800">{currentUser.name}</span>
              <span
                className={`inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : currentUser.role === 'editor'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : currentUser.role === 'viewer'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {currentUser.role_ar || currentUser.role}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="px-2.5 py-1 text-xs bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-lg border border-purple-200 flex items-center gap-1 font-medium cursor-pointer"
                  title="فتح لوحة إدارة صلاحيات المستخدمين (Admin RBAC)"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>إدارة الأدوار</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-1 text-stone-400 hover:text-red-700 rounded transition-colors cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 2. Primary Responsive Layout: Primary Leaflet Map + Sleek 'Credit/Card' Preview List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Primary View: Leaflet 1.9.4 Map (Takes Primary View ~65% desktop width) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white border border-[#EBE6DF] rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-3 bg-[#F7F4EE] border-b border-stone-200 flex items-center justify-between text-xs text-stone-700">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#78350F]" />
              <span className="font-serif font-bold text-sm">الخارطة الجغرافية والأثرية التفاعلية</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-stone-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#065F46]" /> مراقد
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#9A3412]" /> آثار
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#B45309]" /> تراث
              </span>
            </div>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-[520px] sm:h-[600px] z-10"
            style={{ minHeight: '480px' }}
          />

          <div className="p-2.5 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-600 flex items-center justify-between">
            <span>انقر على أي علامة في الخارطة لتحديد المعلم واستعراض بطاقته الائتمانية الأرشيفية.</span>
            <button
              onClick={() => {
                const map = mapInstanceRef.current;
                if (map) map.setView([32.616, 44.0249], 10);
              }}
              className="text-[#78350F] hover:underline font-mono inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط الزاوية</span>
            </button>
          </div>
        </div>

        {/* Secondary Column: Sleek 'Credit/Card' Style Preview Deck (~35% desktop width) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900">
                بطاقات الشواهد التوثيقية
              </h3>
              <p className="text-[11px] text-stone-500">
                معاينة الأثر المعماري بنمط البطاقات الرقمية المعتمدة
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#78350F] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              {formatNumeral(filteredSites.length, numeralSystem)} بطاقة
            </span>
          </div>

          {/* Scrollable Credit/Card Preview Deck */}
          <div
            ref={cardListRef}
            className="space-y-4 max-h-[620px] overflow-y-auto pr-1 pl-1 no-scrollbar"
          >
            {filteredSites.length === 0 ? (
              <div className="py-16 text-center bg-white border border-dashed border-stone-300 rounded-xl p-6 space-y-2">
                <Compass className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="font-serif font-bold text-stone-800 text-sm">لا توجد معالم مطابقة لهذا التصنيف</p>
                <p className="text-xs text-stone-500">جرّب اختيار صنف «جميع المواقع» أو مسح عبارة البحث.</p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    handleSearchChange('');
                  }}
                  className="mt-2 px-3.5 py-1.5 bg-[#78350F] text-white text-xs rounded hover:bg-[#9A3412]"
                >
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              filteredSites.map(site => {
                const isSelected = site.id === selectedSiteId;
                const isSaved = bookmarkedIds.includes(site.id);

                return (
                  <div
                    key={site.id}
                    id={`credit-card-${site.id}`}
                    onClick={() => handleCardClick(site)}
                    className={`relative rounded-xl p-4 sm:p-5 transition-all duration-300 cursor-pointer overflow-hidden border shadow-sm hover:shadow-md hover:scale-[1.01] group ${
                      isSelected
                        ? 'bg-[#FCFAF7] border-[#78350F] ring-2 ring-[#78350F]/20 shadow-md'
                        : 'bg-white border-[#E8E2D8] hover:border-amber-800/40 text-stone-900'
                    }`}
                  >
                    {/* Header: Accession ID Badge, Classification & Bookmark */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {/* Refined Archival Accession Badge */}
                        <span className="font-mono text-xs font-bold tracking-wider px-2.5 py-1 rounded bg-[#F7F4EE] border border-[#E5DFD5] text-[#78350F]">
                          {site.permanent_id}
                        </span>

                        <span className="text-[11px] text-stone-500 font-sans">
                          {site.site_type_id === 'type_religious'
                            ? 'معلم ديني'
                            : site.site_type_id === 'type_palaces_forts'
                            ? 'حصن تاريخي'
                            : site.site_type_id === 'type_caravansaries'
                            ? 'خان تراثي'
                            : 'شاهد أثري'}
                        </span>
                      </div>

                      {/* Bookmark Icon with accessible tap target */}
                      <button
                        onClick={e => handleToggleBookmark(e, site.id)}
                        className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                          isSaved
                            ? 'bg-[#78350F] text-white shadow-xs'
                            : 'bg-stone-100 text-stone-500 hover:text-[#78350F] hover:bg-stone-200'
                        }`}
                        title={isSaved ? 'محفوظ في قائمتك' : 'حفظ في قائمتي'}
                        aria-label={isSaved ? 'محفوظ في قائمتك' : 'حفظ في قائمتي'}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Site Title in dignified Arabic serif */}
                    <div className="space-y-1 mb-2.5">
                      <h4 className="text-base sm:text-lg font-serif font-bold text-stone-900 group-hover:text-[#78350F] transition-colors leading-tight">
                        {site.name_ar}
                      </h4>
                      {site.name_en && (
                        <p className="text-[11px] text-stone-500 font-sans tracking-wide">
                          {site.name_en}
                        </p>
                      )}
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4 font-sans">
                      {site.short_description}
                    </p>

                    {/* Card Footer: Metadata badges and Full Record Link */}
                    <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          site.verification_status === 'verified'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}>
                          {site.verification_status === 'verified' ? '✓ محقق ومسند' : 'قيد التحقيق'}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">
                          {formatNumeral(site.source_count, numeralSystem)} مصادر
                        </span>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectSite(site);
                        }}
                        className="min-h-[44px] px-2 text-xs font-serif font-bold text-[#78350F] hover:text-[#9A3412] inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>فتح السجل</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>



      {/* Admin User Role Management Modal (RBAC Endpoint UI) */}
      {isAdminModalOpen && (
        <AdminUserRoleModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          onUserRoleUpdated={() => setCurrentUser(authService.getCurrentUser())}
        />
      )}
    </div>
  );
};
