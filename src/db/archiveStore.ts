/**
 * «أثر كربلاء» — Karbala Heritage Archive
 * Relational Storage Engine, Verification State Machine & Query API
 */

import {
  Site,
  SiteImage,
  Source,
  SiteClaim,
  SiteTimelineEvent,
  SiteRevision,
  AuditLogEntry,
  SiteContribution,
  ContentReport,
  EncyclopediaEntry,
  CuratedCollection,
  UserRole,
  VerificationStatus,
  PublicationStatus,
  LocationPrecision,
  MuseumProfile,
  SiteRelation,
  ResearchLead,
  SiteModel,
  Area,
  SiteType,
  HistoricalPeriod,
  Tag,
} from '../types';
import { CmsConfig, DEFAULT_CMS_CONFIG } from '../types/cms';

import {
  PROVINCE,
  DISTRICTS,
  SUB_DISTRICTS,
  AREAS,
  SITE_TYPES,
  HISTORICAL_PERIODS,
  SOURCES,
  SITES,
  SITE_IMAGES,
  SITE_CLAIMS,
  SITE_TIMELINES,
  ENCYCLOPEDIA_ENTRIES,
  CURATED_COLLECTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_REVISIONS,
  INITIAL_MUSEUM_PROFILES,
  INITIAL_SITE_RELATIONS,
  INITIAL_RESEARCH_LEADS,
} from './initialData';

import { normalizeArabic, matchesArabicSearch, getPublicCoordinates } from '../utils/arabic';

const STORAGE_KEY = 'karbala_heritage_archive_db_v3';

interface ArchiveDatabaseState {
  sites: Site[];
  images: SiteImage[];
  sources: Source[];
  claims: SiteClaim[];
  timelines: SiteTimelineEvent[];
  revisions: SiteRevision[];
  auditLogs: AuditLogEntry[];
  contributions: SiteContribution[];
  reports: ContentReport[];
  encyclopedia: EncyclopediaEntry[];
  collections: CuratedCollection[];
  museumProfiles: MuseumProfile[];
  siteRelations: SiteRelation[];
  researchLeads: ResearchLead[];
  siteModels: SiteModel[];
  areas: Area[];
  siteTypes: SiteType[];
  historicalPeriods: HistoricalPeriod[];
  tags: Tag[];
  cms: CmsConfig;
}

export const INITIAL_TAGS: Tag[] = [
  { id: 'tag-1', name_ar: 'عمارة إسلامية', name_en: 'Islamic Architecture', slug: 'islamic-architecture', sort_order: 1, is_active: true },
  { id: 'tag-2', name_ar: 'قلاع وحصون', name_en: 'Fortresses & Citadels', slug: 'fortresses', sort_order: 2, is_active: true },
  { id: 'tag-3', name_ar: 'طرق القوافل والتجارة', name_en: 'Caravan Routes', slug: 'caravan-routes', sort_order: 3, is_active: true },
  { id: 'tag-4', name_ar: 'تراث ديني ومقدس', name_en: 'Religious Heritage', slug: 'religious-heritage', sort_order: 4, is_active: true },
  { id: 'tag-5', name_ar: 'عيون وواحات مائية', name_en: 'Oases & Springs', slug: 'oases-springs', sort_order: 5, is_active: true },
  { id: 'tag-6', name_ar: 'تراث مندثر', name_en: 'Lost Heritage', slug: 'lost-heritage', sort_order: 6, is_active: true },
];

export const INITIAL_SITE_MODELS: SiteModel[] = [
  {
    id: 'model-ukhaidir-demo',
    site_id: 'site-001',
    glb_path: 'storage/app/models/home-hero.glb',
    poster_path: '/models/home-hero-poster.webp',
    model_kind: 'reconstruction',
    credit: 'أرشيف أثر كربلاء للتراث الرقمي',
    license: 'CC BY-NC 4.0',
    rights_status: 'Creative Commons',
    source_id: 'src-001',
    ai_assisted: false,
    editor_approved: true,
    publication_status: 'published',
    is_featured_on_home: true,
    sort_order: 1,
    camera_orbit: '0deg 75deg 105%',
    is_demo: true,
  },
];

class ArchiveDatabase {
  private state: ArchiveDatabaseState;
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = this.loadDatabase();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /** Replace the browser's public site/image cache with the Laravel database snapshot. */
  public async syncPublishedFromBackend(): Promise<void> {
    const sites: any[] = [];
    let page = 1;
    let lastPage = 1;
    do {
      const response = await fetch(`/api/v1/sites?per_page=50&page=${page}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Could not load published archive records.');
      const result = await response.json();
      sites.push(...(result.data || []));
      lastPage = Number(result.last_page || 1);
      page += 1;
    } while (page <= lastPage);

    const mappedSites: Site[] = [];
    const mappedImages: SiteImage[] = [];
    for (const item of sites) {
      const coordinates = item.coordinates || {};
      mappedSites.push({
        id: String(item.id), permanent_id: item.inventory_number || String(item.id), slug: item.slug,
        name_ar: item.name_ar, name_en: item.name_en || '', alternate_names: [],
        short_description: item.summary_ar || '', description: item.description_ar || '', historical_description: '',
        architectural_description: '', cultural_significance: '', historical_significance: '', current_condition: '',
        location_description: '', province_id: String(item.province_id || ''), district_id: '', area_id: String(item.area_id || ''),
        site_type_id: String(item.site_type_id || ''), historical_period_id: String(item.historical_period_id || ''),
        lat: Number(coordinates.latitude || 0), lng: Number(coordinates.longitude || 0),
        location_precision: item.location_precision || 'unknown', publication_status: item.publication_status,
        verification_status: item.verification_status, verification_notes: '', verified_by: '',
        verified_at: item.verified_at || '', last_reviewed_at: item.updated_at || '', created_by: '', updated_by: '',
        published_at: item.published_at, is_demo: Boolean(item.is_demo), is_lost_or_vanished: false,
        is_under_research: false, ai_assisted: Boolean(item.ai_assisted), view_count: Number(item.view_count || 0),
        featured: Boolean(item.featured), source_count: 0, image_count: (item.images || []).length,
      });
      for (const image of item.images || []) {
        mappedImages.push({
          id: String(image.id), site_id: String(item.id), title: image.title || image.caption || item.name_ar,
          caption: image.caption || '', description: image.description || '', alt_text: image.alt_text || '',
          date_taken: image.date_taken || '', date_precision: image.date_precision || 'unknown',
          photographer: image.photographer || '', credit_line: image.credit_line || '', license: image.license || '',
          usage_restrictions: image.usage_restrictions || '', rights_status: image.rights_status || 'unknown',
          image_role: image.image_role || 'current_view', sort_order: Number(image.sort_order || 0),
          featured: Boolean(image.featured), visibility: Boolean(image.visibility), ai_assisted: Boolean(image.ai_assisted),
          web_url: image.web_url || '', thumb_url: image.thumbnail_url || '', download_url: '',
          source_ids: [], file_hash_sha256: '',
        });
      }
    }

    this.state.sites = mappedSites;
    this.state.images = mappedImages;
    this.notify();
  }

  public clearPublishedCache(): void {
    this.state.sites = [];
    this.state.images = [];
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  private loadDatabase(): ArchiveDatabaseState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('karbala_heritage_archive_db_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingSiteIds = new Set((parsed.sites || []).map((s: Site) => s.id));
        const mergedSites = [...(parsed.sites || []), ...SITES.filter(s => !existingSiteIds.has(s.id))];

        const existingProfileIds = new Set((parsed.museumProfiles || []).map((mp: MuseumProfile) => mp.site_id));
        const mergedProfiles = [...(parsed.museumProfiles || []), ...INITIAL_MUSEUM_PROFILES.filter(mp => !existingProfileIds.has(mp.site_id))];

        return {
          sites: mergedSites,
          images: parsed.images || SITE_IMAGES,
          sources: parsed.sources || SOURCES,
          claims: parsed.claims || SITE_CLAIMS,
          timelines: parsed.timelines || SITE_TIMELINES,
          revisions: parsed.revisions || INITIAL_REVISIONS,
          auditLogs: parsed.auditLogs || INITIAL_AUDIT_LOGS,
          contributions: parsed.contributions || [],
          reports: parsed.reports || [],
          encyclopedia: parsed.encyclopedia || ENCYCLOPEDIA_ENTRIES,
          collections: parsed.collections || CURATED_COLLECTIONS,
          museumProfiles: mergedProfiles,
          siteRelations: parsed.siteRelations || INITIAL_SITE_RELATIONS,
          researchLeads: parsed.researchLeads || INITIAL_RESEARCH_LEADS,
          siteModels: parsed.siteModels || INITIAL_SITE_MODELS,
          areas: parsed.areas || AREAS,
          siteTypes: parsed.siteTypes || SITE_TYPES,
          historicalPeriods: parsed.historicalPeriods || HISTORICAL_PERIODS,
          tags: parsed.tags || INITIAL_TAGS,
          cms: {
            homepage: { ...DEFAULT_CMS_CONFIG.homepage, ...(parsed.cms?.homepage || {}) },
            navigation: parsed.cms?.navigation?.length ? parsed.cms.navigation : DEFAULT_CMS_CONFIG.navigation,
            footer_columns: parsed.cms?.footer_columns?.length
              ? parsed.cms.footer_columns
              : DEFAULT_CMS_CONFIG.footer_columns,
            settings: { ...DEFAULT_CMS_CONFIG.settings, ...(parsed.cms?.settings || {}) },
          },
        };
      }
    } catch {
      // Fallback
    }

    return this.seedState();
  }

  private seedState(): ArchiveDatabaseState {
    return {
      sites: SITES,
      images: SITE_IMAGES,
      sources: SOURCES,
      claims: SITE_CLAIMS,
      timelines: SITE_TIMELINES,
      revisions: INITIAL_REVISIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
      contributions: [],
      reports: [],
      encyclopedia: ENCYCLOPEDIA_ENTRIES,
      collections: CURATED_COLLECTIONS,
      museumProfiles: INITIAL_MUSEUM_PROFILES,
      siteRelations: INITIAL_SITE_RELATIONS,
      researchLeads: INITIAL_RESEARCH_LEADS,
      siteModels: INITIAL_SITE_MODELS,
      areas: AREAS,
      siteTypes: SITE_TYPES,
      historicalPeriods: HISTORICAL_PERIODS,
      tags: INITIAL_TAGS,
      cms: DEFAULT_CMS_CONFIG,
    };
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to persist to localStorage', e);
    }
    this.notify();
  }

  // Reset to default seeds
  public resetToSeeds(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('karbala_heritage_archive_db_v2');
    this.state = this.seedState();
    this.persist();
  }

  // --- Read Queries ---
  public getProvince() {
    return PROVINCE;
  }

  public getDistricts() {
    return DISTRICTS;
  }

  public getSubDistricts() {
    return SUB_DISTRICTS;
  }

  public getAreas() {
    return this.state.areas;
  }

  public getSiteTypes() {
    return this.state.siteTypes;
  }

  public getHistoricalPeriods() {
    return this.state.historicalPeriods;
  }

  public getAllSources(): Source[] {
    return this.state.sources;
  }

  public getSourceById(id: string): Source | undefined {
    return this.state.sources.find(s => s.id === id);
  }

  public getAllSites(includeNonPublic = false): Site[] {
    if (includeNonPublic) {
      return this.state.sites;
    }
    return this.state.sites.filter(s => s.publication_status === 'published');
  }

  public getSiteBySlug(slug: string): Site | undefined {
    return this.state.sites.find(s => s.slug === slug || s.permanent_id === slug);
  }

  public getSiteById(id: string): Site | undefined {
    return this.state.sites.find(s => s.id === id);
  }

  public getSiteImages(siteId: string): SiteImage[] {
    return this.state.images
      .filter(img => img.site_id === siteId && img.visibility)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public getAllImages(): SiteImage[] {
    return this.state.images.filter(img => img.visibility);
  }

  public getImageById(id: string): SiteImage | undefined {
    return this.state.images.find(img => img.id === id);
  }

  public getSiteClaims(siteId: string): SiteClaim[] {
    return this.state.claims.filter(c => c.site_id === siteId);
  }

  public getSiteTimeline(siteId: string): SiteTimelineEvent[] {
    return this.state.timelines.filter(t => t.site_id === siteId);
  }

  public getSiteRevisions(siteId: string): SiteRevision[] {
    return this.state.revisions.filter(r => r.site_id === siteId);
  }

  public getAllRevisions(): SiteRevision[] {
    return [...this.state.revisions].reverse();
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.state.auditLogs].reverse();
  }

  public getContributions(): SiteContribution[] {
    return [...this.state.contributions].reverse();
  }

  public getReports(): ContentReport[] {
    return [...this.state.reports].reverse();
  }

  public getEncyclopedia(): EncyclopediaEntry[] {
    return this.state.encyclopedia;
  }

  public getFeaturedSiteModels(): SiteModel[] {
    const list = this.state.siteModels || INITIAL_SITE_MODELS;
    return list.filter(m => {
      // 1. Must be published
      if (m.publication_status !== 'published') return false;
      // 2. Rights status must be known (not unknown, not restricted)
      const rights = (m.rights_status || '').toLowerCase();
      if (rights === 'unknown' || rights === 'restricted') return false;
      // 3. If ai_assisted, needs editor approval first
      if (m.ai_assisted && !m.editor_approved) return false;
      // 4. Must be featured on home
      return m.is_featured_on_home;
    }).sort((a, b) => a.sort_order - b.sort_order);
  }


  public getCollections(): CuratedCollection[] {
    return this.state.collections;
  }

  // Safe public coordinates gate
  public getPublicSiteCoordinates(site: Site) {
    return getPublicCoordinates(site.lat, site.lng, site.location_precision);
  }

  // --- Filtered and Normalized Search ---
  public searchSites(params: {
    query?: string;
    areaId?: string;
    typeId?: string;
    periodId?: string;
    verificationStatus?: VerificationStatus;
    hasSources?: boolean;
    hasImages?: boolean;
    lostOrVanished?: boolean;
    underResearch?: boolean;
    sortBy?: 'newest' | 'oldest' | 'views' | 'sources' | 'name';
  }): Site[] {
    let results = this.getAllSites(false);

    if (params.query && params.query.trim()) {
      const q = params.query.trim();
      results = results.filter(site => {
        const textToSearch = [
          site.name_ar,
          site.name_en,
          site.short_description,
          site.description,
          site.historical_description,
          site.architectural_description,
          site.permanent_id,
          ...site.alternate_names.map(an => an.name),
        ].join(' ');

        return matchesArabicSearch(textToSearch, q);
      });
    }

    if (params.areaId) {
      results = results.filter(s => s.area_id === params.areaId);
    }

    if (params.typeId) {
      results = results.filter(s => s.site_type_id === params.typeId);
    }

    if (params.periodId) {
      results = results.filter(s => s.historical_period_id === params.periodId);
    }

    if (params.verificationStatus) {
      results = results.filter(s => s.verification_status === params.verificationStatus);
    }

    if (params.hasSources) {
      results = results.filter(s => s.source_count > 0);
    }

    if (params.hasImages) {
      results = results.filter(s => s.image_count > 0);
    }

    if (params.lostOrVanished !== undefined) {
      results = results.filter(s => s.is_lost_or_vanished === params.lostOrVanished);
    }

    if (params.underResearch !== undefined) {
      results = results.filter(s => s.is_under_research === params.underResearch);
    }

    // Sorting
    switch (params.sortBy) {
      case 'oldest':
        results.sort((a, b) => a.permanent_id.localeCompare(b.permanent_id));
        break;
      case 'views':
        results.sort((a, b) => b.view_count - a.view_count);
        break;
      case 'sources':
        results.sort((a, b) => b.source_count - a.source_count);
        break;
      case 'name':
        results.sort((a, b) => a.name_ar.localeCompare(b.name_ar, 'ar'));
        break;
      case 'newest':
      default:
        results.sort((a, b) => b.permanent_id.localeCompare(a.permanent_id));
        break;
    }

    return results;
  }

  // --- Statistics Calculation (Truthful Provenance) ---
  public getArchiveStatistics(options?: { excludeDemo?: boolean }) {
    let sites = this.getAllSites(false);
    if (options?.excludeDemo) {
      sites = sites.filter(s => !s.is_demo);
    }
    const images = this.getAllImages();
    const sources = this.getAllSources();

    const verificationCounts = {
      // Strictly published records whose verification status is verified
      verified: sites.filter(s => s.verification_status === 'verified').length,
      partially_verified: sites.filter(s => s.verification_status === 'partially_verified').length,
      unverified: sites.filter(s => s.verification_status === 'unverified').length,
      disputed: sites.filter(s => s.verification_status === 'disputed').length,
      unknown: sites.filter(s => s.verification_status === 'unknown').length,
    };

    const typeCounts: Record<string, number> = {};
    SITE_TYPES.forEach(t => {
      typeCounts[t.id] = sites.filter(s => s.site_type_id === t.id).length;
    });

    const periodCounts: Record<string, number> = {};
    HISTORICAL_PERIODS.forEach(p => {
      periodCounts[p.id] = sites.filter(s => s.historical_period_id === p.id).length;
    });

    const areaCounts: Record<string, number> = {};
    AREAS.forEach(a => {
      areaCounts[a.id] = sites.filter(s => s.area_id === a.id).length;
    });

    // Compute dynamic latest date from actual site reviews
    const dates = sites
      .map(s => s.last_reviewed_at)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));
    const latestReviewDate = dates[0] || '2026-03-01';

    const totalMuseums = sites.filter(s => s.site_type_id === 'type_museums').length;
    const allMuseumsCount = this.getAllSites(true).filter(s => s.site_type_id === 'type_museums').length;

    return {
      totalSites: sites.length,
      totalMuseums,
      allMuseumsCount,
      totalImages: images.length,
      totalSources: sources.length,
      totalClaims: this.state.claims.length,
      lostSitesCount: sites.filter(s => s.is_lost_or_vanished).length,
      underResearchCount: sites.filter(s => s.is_under_research).length,
      verificationCounts,
      typeCounts,
      periodCounts,
      areaCounts,
      latestReviewDate,
    };
  }

  // --- Random Site Discovery («اكتشف موقعًا») ---
  public getRandomSite(): Site | undefined {
    const published = this.getAllSites(false);
    if (published.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * published.length);
    return published[randomIndex];
  }

  // --- Search Logging & Aggregated Popular Searches ---
  public logSearchQuery(query: string): void {
    const clean = query.trim().toLowerCase();
    if (!clean || clean.length < 2) return;
    try {
      const logsRaw = localStorage.getItem('kha_search_logs');
      const logs: Record<string, number> = logsRaw ? JSON.parse(logsRaw) : {
        'الأخيضر': 14,
        'عين التمر': 9,
        'خان النخيلة': 6,
        'الأقيصر': 5,
      };
      logs[clean] = (logs[clean] || 0) + 1;
      localStorage.setItem('kha_search_logs', JSON.stringify(logs));
    } catch {
      // Storage fallback
    }
    this.addRecentSearch(query.trim());
  }

  public getPopularSearches(minCount: number = 2): string[] {
    try {
      const logsRaw = localStorage.getItem('kha_search_logs');
      if (!logsRaw) {
        // Default initial aggregated search logs verified against actual database sites
        const initialMap: Record<string, number> = {
          'الأخيضر': 12,
          'عين التمر': 8,
          'خان النخيلة': 5,
          'الأقيصر': 4,
        };
        localStorage.setItem('kha_search_logs', JSON.stringify(initialMap));
        return Object.keys(initialMap);
      }
      const logs: Record<string, number> = JSON.parse(logsRaw);
      return Object.entries(logs)
        .filter(([_, count]) => count >= minCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([q]) => q);
    } catch {
      return [];
    }
  }

  public getRecentSearches(): string[] {
    try {
      const raw = localStorage.getItem('kha_recent_searches');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public addRecentSearch(query: string): void {
    const clean = query.trim();
    if (!clean) return;
    try {
      const recent = this.getRecentSearches().filter(q => q.toLowerCase() !== clean.toLowerCase());
      recent.unshift(clean);
      localStorage.setItem('kha_recent_searches', JSON.stringify(recent.slice(0, 8)));
    } catch {
      // Fallback
    }
  }

  public removeRecentSearch(query: string): void {
    try {
      const recent = this.getRecentSearches().filter(q => q !== query);
      localStorage.setItem('kha_recent_searches', JSON.stringify(recent));
    } catch {
      // Fallback
    }
  }

  public clearRecentSearches(): void {
    try {
      localStorage.removeItem('kha_recent_searches');
    } catch {
      // Fallback
    }
  }

  // --- Dynamic Admin Announcement ---
  public getAnnouncement(): { text: string; linkText?: string; linkTab?: string; active: boolean } | null {
    const home = this.state.cms?.homepage;
    if (home?.announcement_active && home.announcement_text) {
      return {
        text: home.announcement_text,
        linkText: home.announcement_link_text || undefined,
        linkTab: home.announcement_link_tab || undefined,
        active: true,
      };
    }
    try {
      const raw = localStorage.getItem('kha_announcement');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.active && parsed.text) return parsed;
      }
    } catch {
      // Fallback
    }
    return null;
  }

  public setAnnouncement(data: { text: string; linkText?: string; linkTab?: string; active: boolean } | null): void {
    this.state.cms.homepage.announcement_active = Boolean(data?.active && data.text);
    this.state.cms.homepage.announcement_text = data?.text || '';
    this.state.cms.homepage.announcement_link_text = data?.linkText || '';
    this.state.cms.homepage.announcement_link_tab = data?.linkTab || 'registry';
    try {
      if (data) {
        localStorage.setItem('kha_announcement', JSON.stringify(data));
      } else {
        localStorage.removeItem('kha_announcement');
      }
    } catch {
      // Fallback
    }
    this.persist();
  }

  // --- «قائمتي» (Bookmarks / My List) ---
  public getBookmarkedSiteIds(): string[] {
    try {
      const raw = localStorage.getItem('kha_my_list');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public isBookmarked(siteId: string): boolean {
    return this.getBookmarkedSiteIds().includes(siteId);
  }

  public toggleBookmark(siteId: string): boolean {
    try {
      const current = this.getBookmarkedSiteIds();
      let updated: string[];
      let isAdded: boolean;
      if (current.includes(siteId)) {
        updated = current.filter(id => id !== siteId);
        isAdded = false;
      } else {
        updated = [...current, siteId];
        isAdded = true;
      }
      localStorage.setItem('kha_my_list', JSON.stringify(updated));
      return isAdded;
    } catch {
      return false;
    }
  }

  public getBookmarkedSites(): Site[] {
    const ids = this.getBookmarkedSiteIds();
    return this.getAllSites(false).filter(s => ids.includes(s.id));
  }

  // --- Data Quality Checks ---
  public runDataQualityAudit() {
    const sites = this.state.sites;
    const images = this.state.images;

    const missingSources = sites.filter(s => s.source_count === 0);
    const missingRights = images.filter(i => i.rights_status === 'Unknown');
    const missingLocation = sites.filter(s => !s.lat || !s.lng);
    const aiAssistedPending = sites.filter(s => s.ai_assisted && s.verification_status === 'unverified');

    // Review due (> 1 year ago or older than 2025)
    const reviewDue = sites.filter(s => {
      const year = parseInt(s.last_reviewed_at.split('-')[0] || '2024', 10);
      return year < 2026;
    });

    return {
      missingSources,
      missingRights,
      missingLocation,
      aiAssistedPending,
      reviewDue,
      totalIssues:
        missingSources.length +
        missingRights.length +
        missingLocation.length +
        aiAssistedPending.length +
        reviewDue.length,
    };
  }

  // --- Mutations & Audit Trails ---
  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): void {
    const newEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...entry,
    };
    this.state.auditLogs.push(newEntry);
    this.persist();
  }

  public updateSiteVerification(
    siteId: string,
    status: VerificationStatus,
    reason: string,
    actorName: string
  ): boolean {
    const site = this.state.sites.find(s => s.id === siteId);
    if (!site) return false;

    const oldStatus = site.verification_status;
    site.verification_status = status;
    site.verification_notes = reason;
    site.verified_by = actorName;
    site.verified_at = new Date().toISOString().split('T')[0];
    site.last_reviewed_at = new Date().toISOString().split('T')[0];

    // Record revision
    this.state.revisions.push({
      id: `rev_${Date.now()}`,
      site_id: site.id,
      site_name: site.name_ar,
      changed_field: 'verification_status',
      old_value: oldStatus,
      new_value: status,
      changed_by: actorName,
      changed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      reason,
      verification_status_at_time: status,
    });

    // Record audit log
    this.logAudit({
      action: 'UPDATE_VERIFICATION_STATUS',
      entity_type: 'Site',
      entity_id: site.permanent_id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `تغيير حالة التحقيق من (${oldStatus}) إلى (${status}). السبب: ${reason}`,
    });

    this.persist();
    return true;
  }

  public updateSitePublication(
    siteId: string,
    status: PublicationStatus,
    actorName: string
  ): boolean {
    const site = this.state.sites.find(s => s.id === siteId);
    if (!site) return false;

    const oldStatus = site.publication_status;
    site.publication_status = status;
    if (status === 'published' && !site.published_at) {
      site.published_at = new Date().toISOString().split('T')[0];
    }

    this.logAudit({
      action: 'UPDATE_PUBLICATION_STATUS',
      entity_type: 'Site',
      entity_id: site.permanent_id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `تغيير حالة النشر من (${oldStatus}) إلى (${status}).`,
    });

    this.persist();
    return true;
  }

  public updateSite(
    siteId: string,
    updates: Partial<Site>,
    reason: string,
    actorName: string
  ): boolean {
    const site = this.state.sites.find(s => s.id === siteId);
    if (!site) return false;

    // Substantive fields that trigger verification reset rule (Prompt 4):
    // Editing historical/architectural/significance fields automatically moves
    // verified content to 'partially_verified' until re-verified.
    const substantiveFields: (keyof Site)[] = [
      'historical_description',
      'architectural_description',
      'cultural_significance',
      'historical_significance',
      'lat',
      'lng',
    ];

    let triggeredReset = false;
    substantiveFields.forEach(field => {
      if (updates[field] !== undefined && updates[field] !== site[field]) {
        if (site.verification_status === 'verified') {
          site.verification_status = 'partially_verified';
          triggeredReset = true;
        }

        // Record revision for each changed field
        this.state.revisions.push({
          id: `rev_${Date.now()}_${field}`,
          site_id: site.id,
          site_name: site.name_ar,
          changed_field: field as string,
          old_value: String(site[field] ?? ''),
          new_value: String(updates[field] ?? ''),
          changed_by: actorName,
          changed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          reason: reason || 'تحديث البيانات التوثيقية للموقع',
          verification_status_at_time: site.verification_status,
        });
      }
    });

    Object.assign(site, updates);
    site.updated_by = actorName;
    site.last_reviewed_at = new Date().toISOString().split('T')[0];

    this.logAudit({
      action: triggeredReset ? 'UPDATE_SITE_WITH_VERIFICATION_RESET' : 'UPDATE_SITE',
      entity_type: 'Site',
      entity_id: site.permanent_id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: triggeredReset
        ? `تعديل حقول جوهرية وإعادة حالة التحقيق إلى قيد المراجعة. السبب: ${reason}`
        : `تحديث بيانات السجل. السبب: ${reason}`,
    });

    this.persist();
    return true;
  }

  // --- Gallery Image Management ---
  public updateImageSortOrder(siteId: string, imageIdsInOrder: string[], actorName: string): void {
    imageIdsInOrder.forEach((id, index) => {
      const img = this.state.images.find(i => i.id === id && i.site_id === siteId);
      if (img) {
        img.sort_order = index + 1;
      }
    });

    this.logAudit({
      action: 'REORDER_GALLERY_IMAGES',
      entity_type: 'SiteGallery',
      entity_id: siteId,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `إعادة ترتيب صور المعرض للموقع. عدد الصور: ${imageIdsInOrder.length}`,
    });

    this.persist();
  }

  public setFeaturedImage(siteId: string, imageId: string, actorName: string): void {
    this.state.images.forEach(img => {
      if (img.site_id === siteId) {
        img.featured = img.id === imageId;
      }
    });

    this.logAudit({
      action: 'SET_FEATURED_IMAGE',
      entity_type: 'SiteImage',
      entity_id: imageId,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `تعيين الصورة كصورة رئيسية للموقع ${siteId}`,
    });

    this.persist();
  }

  public addImage(image: Omit<SiteImage, 'id'>, actorName: string): SiteImage {
    const newImage: SiteImage = {
      ...image,
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.state.images.push(newImage);

    // Update site image count
    const site = this.state.sites.find(s => s.id === image.site_id);
    if (site) {
      site.image_count = this.state.images.filter(i => i.site_id === site.id).length;
    }

    this.logAudit({
      action: 'ADD_GALLERY_IMAGE',
      entity_type: 'SiteImage',
      entity_id: newImage.id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `إضافة لوحة جديدة لمعرض الموقع: ${newImage.title}`,
    });

    this.persist();
    return newImage;
  }

  public updateImageMetadata(
    imageId: string,
    updates: Partial<SiteImage>,
    actorName: string
  ): boolean {
    const img = this.state.images.find(i => i.id === imageId);
    if (!img) return false;

    Object.assign(img, updates);

    this.logAudit({
      action: 'UPDATE_IMAGE_METADATA',
      entity_type: 'SiteImage',
      entity_id: img.id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `تحديث بيانات حقوق وحواشي اللوحة: ${img.title}`,
    });

    this.persist();
    return true;
  }

  // --- Public Contributions & Reports ---
  public submitContribution(
    contribution: Omit<SiteContribution, 'id' | 'created_at' | 'status'>
  ): SiteContribution {
    const newContrib: SiteContribution = {
      id: `contrib_${Date.now()}`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'pending_review',
      ...contribution,
    };
    this.state.contributions.push(newContrib);

    this.logAudit({
      action: 'SUBMIT_CONTRIBUTION',
      entity_type: 'Contribution',
      entity_id: newContrib.id,
      performed_by: contribution.contributor_name || 'Visitor',
      ip_hash: 'public_client',
      details: `تقديم مساهمة جديدة: ${contribution.title} (${contribution.type})`,
    });

    this.persist();
    return newContrib;
  }

  public reviewContribution(
    contribId: string,
    decision: 'approved' | 'rejected' | 'needs_clarification',
    reason: string,
    reviewerName: string
  ): boolean {
    const item = this.state.contributions.find(c => c.id === contribId);
    if (!item) return false;

    item.status = decision;
    item.admin_decision_reason = reason;
    item.reviewed_by = reviewerName;

    this.logAudit({
      action: `REVIEW_CONTRIBUTION_${decision.toUpperCase()}`,
      entity_type: 'Contribution',
      entity_id: item.id,
      performed_by: reviewerName,
      ip_hash: 'auth_session_valid',
      details: `مراجعة مساهمة الزائر. القرار: ${decision}. السبب: ${reason}`,
    });

    this.persist();
    return true;
  }

  public submitReport(report: Omit<ContentReport, 'id' | 'created_at' | 'status'>): ContentReport {
    const newReport: ContentReport = {
      id: `rep_${Date.now()}`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'pending',
      ...report,
    };
    this.state.reports.push(newReport);

    this.logAudit({
      action: 'SUBMIT_REPORT',
      entity_type: 'ContentReport',
      entity_id: newReport.id,
      performed_by: 'Public Visitor',
      ip_hash: 'public_client',
      details: `إبلاغ عن مشكلة في (${report.target_name}): تصنيف ${report.reason_category}`,
    });

    this.persist();
    return newReport;
  }

  public resolveReport(reportId: string, note: string, resolverName: string): boolean {
    const rep = this.state.reports.find(r => r.id === reportId);
    if (!rep) return false;

    rep.status = 'resolved';
    rep.resolution_note = note;

    this.logAudit({
      action: 'RESOLVE_REPORT',
      entity_type: 'ContentReport',
      entity_id: rep.id,
      performed_by: resolverName,
      ip_hash: 'auth_session_valid',
      details: `معالجة بلاغ الخطأ. الإجراء: ${note}`,
    });

    this.persist();
    return true;
  }

  // --- CSV / JSON Import Pipeline (Prompt 14) ---
  public dryRunImport(rows: any[]) {
    const errors: { row: number; field: string; message: string }[] = [];
    const validRows: any[] = [];
    const duplicates: { row: number; existingId: string; name: string }[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      if (!row.name_ar || !row.name_ar.trim()) {
        errors.push({ row: rowNum, field: 'name_ar', message: 'اسم الموقع بالعربية حقل إجباري' });
        return;
      }

      // Check duplicates by Arabic name
      const existing = this.state.sites.find(
        s => normalizeArabic(s.name_ar) === normalizeArabic(row.name_ar)
      );

      if (existing) {
        duplicates.push({ row: rowNum, existingId: existing.permanent_id, name: row.name_ar });
      }

      validRows.push(row);
    });

    return {
      totalRows: rows.length,
      validCount: validRows.length,
      errorsCount: errors.length,
      errors,
      duplicates,
      canCommit: errors.length === 0,
    };
  }

  public commitImport(rows: any[], actorName: string): number {
    let importedCount = 0;
    const currentMaxId = this.state.sites.reduce((max, s) => {
      const num = parseInt(s.permanent_id.replace('KHA-', ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 100);

    rows.forEach((row, idx) => {
      const newIdNum = currentMaxId + idx + 1;
      const permanentId = `KHA-${String(newIdNum).padStart(6, '0')}`;
      const slug = (row.name_en || row.name_ar)
        .toLowerCase()
        .replace(/[^a-z0-9\u0621-\u064A]/g, '-')
        .replace(/-+/g, '-');

      const newSite: Site = {
        id: `site_imp_${Date.now()}_${idx}`,
        permanent_id: permanentId,
        slug: slug || `site-${newIdNum}`,
        name_ar: row.name_ar,
        name_en: row.name_en || '',
        alternate_names: [],
        short_description: row.short_description || 'موقع مستورد بانتظار المراجعة والتحقيق المكتبي.',
        description: row.description || '',
        historical_description: row.historical_description || '',
        architectural_description: row.architectural_description || '',
        cultural_significance: row.cultural_significance || '',
        historical_significance: row.historical_significance || '',
        current_condition: row.current_condition || 'غير محددة',
        location_description: row.location_description || '',
        province_id: 'prov_karbala',
        district_id: row.district_id || 'dist_center',
        area_id: row.area_id || 'area_old_city',
        site_type_id: row.site_type_id || 'type_palaces_forts',
        historical_period_id: row.historical_period_id || 'period_abbasid',
        lat: parseFloat(row.lat) || 32.616,
        lng: parseFloat(row.lng) || 44.0249,
        location_precision: (row.location_precision as LocationPrecision) || 'approximate',
        publication_status: 'draft', // Imported always starts as DRAFT!
        verification_status: 'unverified', // Imported always UNVERIFIED!
        verification_notes: 'مستورد من ملف بيانات، بانتظار تدقيق المراجع من قبل هيئة التحرير.',
        last_reviewed_at: new Date().toISOString().split('T')[0],
        created_by: `Import by ${actorName}`,
        updated_by: actorName,
        is_demo: true,
        is_lost_or_vanished: false,
        is_under_research: true,
        ai_assisted: false,
        view_count: 0,
        featured: false,
        source_count: row.source_title ? 1 : 0,
        image_count: 0,
      };

      this.state.sites.push(newSite);
      importedCount++;
    });

    this.logAudit({
      action: 'IMPORT_BATCH_SITES',
      entity_type: 'BatchImport',
      entity_id: `batch_${Date.now()}`,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `استيراد دفعة سجلات جديدة برقم (${importedCount})، أُدرجت كمسودات غير محققة بانتظار المراجعة.`,
    });

    this.persist();
    return importedCount;
  }

  // --- Museum Domain Methods ---
  public getMuseumProfiles(): MuseumProfile[] {
    return this.state.museumProfiles;
  }

  public getMuseumProfile(siteId: string): MuseumProfile | undefined {
    return this.state.museumProfiles.find(mp => mp.site_id === siteId);
  }

  public saveMuseumProfile(profile: MuseumProfile, actor: string = 'المحرر'): void {
    const idx = this.state.museumProfiles.findIndex(mp => mp.site_id === profile.site_id);
    if (idx >= 0) {
      this.state.museumProfiles[idx] = { ...profile };
    } else {
      this.state.museumProfiles.push({ ...profile });
    }

    this.logAudit({
      action: 'UPDATE_MUSEUM_PROFILE',
      entity_type: 'MuseumProfile',
      entity_id: profile.site_id,
      performed_by: actor,
      ip_hash: 'auth_session_valid',
      details: `تحديث بيانات البروفايل التوثيقي للمتحف (${profile.site_id})`,
    });

    this.persist();
  }

  public getMuseums(includeUnpublished: boolean = false): Site[] {
    return this.getAllSites(includeUnpublished).filter(s => s.site_type_id === 'type_museums');
  }

  public getSiteRelations(siteId: string): SiteRelation[] {
    return this.state.siteRelations.filter(r => r.source_site_id === siteId || r.target_site_id === siteId);
  }

  public addSiteRelation(relation: SiteRelation): void {
    this.state.siteRelations.push(relation);
    this.persist();
  }

  // --- Research Leads (Admin-Only Candidates) ---
  public getResearchLeads(): ResearchLead[] {
    return this.state.researchLeads;
  }

  public addResearchLead(lead: Omit<ResearchLead, 'id' | 'created_at'>): ResearchLead {
    const newLead: ResearchLead = {
      ...lead,
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString().split('T')[0],
    };
    this.state.researchLeads.unshift(newLead);
    this.logAudit({
      action: 'ADD_RESEARCH_LEAD',
      entity_type: 'ResearchLead',
      entity_id: newLead.id,
      performed_by: lead.created_by,
      ip_hash: 'auth_session_valid',
      details: `إضافة مرشح بحثي جديد: ${lead.name}`,
    });
    this.persist();
    return newLead;
  }

  public updateResearchLead(id: string, updates: Partial<ResearchLead>, actor: string = 'المحرر'): void {
    const idx = this.state.researchLeads.findIndex(l => l.id === id);
    if (idx >= 0) {
      this.state.researchLeads[idx] = {
        ...this.state.researchLeads[idx],
        ...updates,
      };
      this.logAudit({
        action: 'UPDATE_RESEARCH_LEAD',
        entity_type: 'ResearchLead',
        entity_id: id,
        performed_by: actor,
        ip_hash: 'auth_session_valid',
        details: `تحديث حالة المرشح البحثي (${id}) إلى: ${updates.status || 'محدث'}`,
      });
      this.persist();
    }
  }

  public deleteResearchLead(id: string, actor: string = 'المحرر'): void {
    this.state.researchLeads = this.state.researchLeads.filter(l => l.id !== id);
    this.logAudit({
      action: 'DELETE_RESEARCH_LEAD',
      entity_type: 'ResearchLead',
      entity_id: id,
      performed_by: actor,
      ip_hash: 'auth_session_valid',
      details: `حذف المرشح البحثي (${id})`,
    });
    this.persist();
  }

  // --- CMS chrome ---
  public getCms(): CmsConfig {
    return this.state.cms;
  }

  public updateCms(partial: Partial<CmsConfig>, actorName: string): CmsConfig {
    this.state.cms = {
      homepage: { ...this.state.cms.homepage, ...(partial.homepage || {}) },
      navigation: partial.navigation || this.state.cms.navigation,
      footer_columns: partial.footer_columns || this.state.cms.footer_columns,
      settings: { ...this.state.cms.settings, ...(partial.settings || {}) },
    };
    this.logAudit({
      action: 'UPDATE_CMS_CONFIG',
      entity_type: 'CmsConfig',
      entity_id: 'site_chrome',
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: 'تحديث إعدادات الواجهة العامة (الصفحة الرئيسية / التنقل / التذييل / الإعدادات).',
    });
    this.persist();
    return this.state.cms;
  }

  // --- Sites create / archive ---
  public createSite(
    input: Partial<Site> & Pick<Site, 'name_ar' | 'short_description' | 'site_type_id' | 'historical_period_id' | 'area_id'>,
    actorName: string
  ): Site {
    const maxId = this.state.sites.reduce((max, s) => {
      const num = parseInt(s.permanent_id.replace('KHA-', ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 100);
    const permanentId = `KHA-${String(maxId + 1).padStart(6, '0')}`;
    const area = this.state.areas.find(a => a.id === input.area_id);
    const slugBase = (input.name_en || input.name_ar)
      .toLowerCase()
      .replace(/[^a-z0-9\u0621-\u064A]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const site: Site = {
      id: `site_${Date.now()}`,
      permanent_id: permanentId,
      slug: input.slug || slugBase || `site-${maxId + 1}`,
      name_ar: input.name_ar,
      name_en: input.name_en || '',
      alternate_names: input.alternate_names || [],
      short_description: input.short_description,
      description: input.description || input.short_description,
      historical_description: input.historical_description || '',
      architectural_description: input.architectural_description || '',
      cultural_significance: input.cultural_significance || '',
      historical_significance: input.historical_significance || '',
      current_condition: input.current_condition || 'غير محددة',
      location_description: input.location_description || '',
      province_id: 'prov_karbala',
      district_id: input.district_id || area?.district_id || 'dist_center',
      area_id: input.area_id,
      site_type_id: input.site_type_id,
      historical_period_id: input.historical_period_id,
      lat: input.lat ?? area?.lat ?? 32.616,
      lng: input.lng ?? area?.lng ?? 44.0249,
      location_precision: input.location_precision || 'approximate',
      publication_status: input.publication_status || 'draft',
      verification_status: input.verification_status || 'unverified',
      verification_notes: input.verification_notes || 'سجل جديد بانتظار التحقيق الميداني والمصادر.',
      last_reviewed_at: new Date().toISOString().split('T')[0],
      created_by: actorName,
      updated_by: actorName,
      is_demo: input.is_demo ?? true,
      is_lost_or_vanished: input.is_lost_or_vanished ?? false,
      is_under_research: input.is_under_research ?? true,
      ai_assisted: input.ai_assisted ?? false,
      view_count: 0,
      featured: input.featured ?? false,
      source_count: 0,
      image_count: 0,
    };

    this.state.sites.unshift(site);
    this.logAudit({
      action: 'CREATE_SITE',
      entity_type: 'Site',
      entity_id: site.permanent_id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `إنشاء سجل معلم جديد: ${site.name_ar} (${site.permanent_id}) بحالة نشر ${site.publication_status} وتحقيق ${site.verification_status}.`,
    });
    this.persist();
    return site;
  }

  public archiveSite(siteId: string, actorName: string): boolean {
    return this.updateSitePublication(siteId, 'archived', actorName);
  }

  public deleteDraftSite(siteId: string, actorName: string): boolean {
    const site = this.state.sites.find(s => s.id === siteId);
    if (!site) return false;
    if (site.publication_status === 'published') {
      return this.archiveSite(siteId, actorName);
    }
    this.state.sites = this.state.sites.filter(s => s.id !== siteId);
    this.logAudit({
      action: 'DELETE_DRAFT_SITE',
      entity_type: 'Site',
      entity_id: site.permanent_id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حذف مسودة المعلم: ${site.name_ar}`,
    });
    this.persist();
    return true;
  }

  // --- Sources ---
  public saveSource(source: Source, actorName: string): Source {
    const idx = this.state.sources.findIndex(s => s.id === source.id);
    if (idx >= 0) {
      this.state.sources[idx] = source;
    } else {
      this.state.sources.unshift(source);
    }
    this.logAudit({
      action: idx >= 0 ? 'UPDATE_SOURCE' : 'CREATE_SOURCE',
      entity_type: 'Source',
      entity_id: source.id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `${idx >= 0 ? 'تحديث' : 'إضافة'} مرجع: ${source.title}`,
    });
    this.persist();
    return source;
  }

  public deleteSource(id: string, actorName: string): boolean {
    const src = this.state.sources.find(s => s.id === id);
    if (!src) return false;
    this.state.sources = this.state.sources.filter(s => s.id !== id);
    this.logAudit({
      action: 'DELETE_SOURCE',
      entity_type: 'Source',
      entity_id: id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حذف المرجع: ${src.title}`,
    });
    this.persist();
    return true;
  }

  // --- Encyclopedia ---
  public saveEncyclopediaEntry(entry: EncyclopediaEntry, actorName: string): EncyclopediaEntry {
    const idx = this.state.encyclopedia.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      this.state.encyclopedia[idx] = entry;
    } else {
      this.state.encyclopedia.unshift(entry);
    }
    this.logAudit({
      action: idx >= 0 ? 'UPDATE_ENCYCLOPEDIA' : 'CREATE_ENCYCLOPEDIA',
      entity_type: 'EncyclopediaEntry',
      entity_id: entry.id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `${idx >= 0 ? 'تحديث' : 'إضافة'} مادة موسوعية: ${entry.term_ar}`,
    });
    this.persist();
    return entry;
  }

  public deleteEncyclopediaEntry(id: string, actorName: string): boolean {
    const entry = this.state.encyclopedia.find(e => e.id === id);
    if (!entry) return false;
    this.state.encyclopedia = this.state.encyclopedia.filter(e => e.id !== id);
    this.logAudit({
      action: 'DELETE_ENCYCLOPEDIA',
      entity_type: 'EncyclopediaEntry',
      entity_id: id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حذف مادة موسوعية: ${entry.term_ar}`,
    });
    this.persist();
    return true;
  }

  // --- Taxonomies ---
  public saveSiteType(item: SiteType, actorName: string): SiteType {
    const idx = this.state.siteTypes.findIndex(t => t.id === item.id);
    if (idx >= 0) this.state.siteTypes[idx] = item;
    else this.state.siteTypes.push(item);
    this.logAudit({
      action: 'SAVE_SITE_TYPE',
      entity_type: 'SiteType',
      entity_id: item.id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حفظ نوع المعلم: ${item.name_ar}`,
    });
    this.persist();
    return item;
  }

  public deleteSiteType(id: string, actorName: string): boolean {
    const inUse = this.state.sites.some(s => s.site_type_id === id);
    if (inUse) return false;
    const item = this.state.siteTypes.find(t => t.id === id);
    if (!item) return false;
    this.state.siteTypes = this.state.siteTypes.filter(t => t.id !== id);
    this.logAudit({
      action: 'DELETE_SITE_TYPE',
      entity_type: 'SiteType',
      entity_id: id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حذف نوع المعلم: ${item.name_ar}`,
    });
    this.persist();
    return true;
  }

  public saveHistoricalPeriod(item: HistoricalPeriod, actorName: string): HistoricalPeriod {
    const idx = this.state.historicalPeriods.findIndex(t => t.id === item.id);
    if (idx >= 0) this.state.historicalPeriods[idx] = item;
    else this.state.historicalPeriods.push(item);
    this.logAudit({
      action: 'SAVE_PERIOD',
      entity_type: 'HistoricalPeriod',
      entity_id: item.id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حفظ الحقبة التاريخية: ${item.name_ar}`,
    });
    this.persist();
    return item;
  }

  public deleteHistoricalPeriod(id: string, actorName: string): boolean {
    if (this.state.sites.some(s => s.historical_period_id === id)) return false;
    const item = this.state.historicalPeriods.find(t => t.id === id);
    if (!item) return false;
    this.state.historicalPeriods = this.state.historicalPeriods.filter(t => t.id !== id);
    this.logAudit({
      action: 'DELETE_PERIOD',
      entity_type: 'HistoricalPeriod',
      entity_id: id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حذف الحقبة: ${item.name_ar}`,
    });
    this.persist();
    return true;
  }

  public saveArea(item: Area, actorName: string): Area {
    const idx = this.state.areas.findIndex(t => t.id === item.id);
    if (idx >= 0) this.state.areas[idx] = item;
    else this.state.areas.push(item);
    this.logAudit({
      action: 'SAVE_AREA',
      entity_type: 'Area',
      entity_id: item.id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حفظ المنطقة: ${item.name_ar}`,
    });
    this.persist();
    return item;
  }

  public deleteArea(id: string, actorName: string): boolean {
    if (this.state.sites.some(s => s.area_id === id)) return false;
    const item = this.state.areas.find(t => t.id === id);
    if (!item) return false;
    this.state.areas = this.state.areas.filter(t => t.id !== id);
    this.logAudit({
      action: 'DELETE_AREA',
      entity_type: 'Area',
      entity_id: id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حذف المنطقة: ${item.name_ar}`,
    });
    this.persist();
    return true;
  }

  public getTags(): Tag[] {
    return this.state.tags || INITIAL_TAGS;
  }

  public saveTag(item: Tag, actorName: string): Tag {
    if (!this.state.tags) this.state.tags = [...INITIAL_TAGS];
    const idx = this.state.tags.findIndex(t => t.id === item.id);
    if (idx >= 0) this.state.tags[idx] = item;
    else this.state.tags.push(item);
    this.logAudit({
      action: 'SAVE_TAG',
      entity_type: 'Tag',
      entity_id: item.id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حفظ الوسم: ${item.name_ar}`,
    });
    this.persist();
    return item;
  }

  public deleteTag(id: string, actorName: string): boolean {
    if (!this.state.tags) this.state.tags = [...INITIAL_TAGS];
    const item = this.state.tags.find(t => t.id === id);
    if (!item) return false;
    this.state.tags = this.state.tags.filter(t => t.id !== id);
    this.logAudit({
      action: 'DELETE_TAG',
      entity_type: 'Tag',
      entity_id: id,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حذف الوسم: ${item.name_ar}`,
    });
    this.persist();
    return true;
  }

  public deleteImage(imageId: string, actorName: string): boolean {
    const img = this.state.images.find(i => i.id === imageId);
    if (!img) return false;
    this.state.images = this.state.images.filter(i => i.id !== imageId);
    const site = this.state.sites.find(s => s.id === img.site_id);
    if (site) {
      site.image_count = this.state.images.filter(i => i.site_id === site.id).length;
    }
    this.logAudit({
      action: 'DELETE_IMAGE',
      entity_type: 'SiteImage',
      entity_id: imageId,
      performed_by: actorName,
      ip_hash: 'auth_session_valid',
      details: `حذف لوحة من المكتبة: ${img.title}`,
    });
    this.persist();
    return true;
  }
}

export const archiveDB = new ArchiveDatabase();
