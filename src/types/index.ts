/**
 * «أثر كربلاء» — Karbala Heritage Archive
 * Database Schema and Domain Types
 */

export type PublicationStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export type VerificationStatus = 'verified' | 'partially_verified' | 'unverified' | 'disputed' | 'unknown';

export type LocationPrecision = 'exact' | 'approximate' | 'restricted';

export type SourceType =
  | 'book'
  | 'academic_paper'
  | 'document'
  | 'archive'
  | 'official_site'
  | 'government_record'
  | 'field_source'
  | 'interview'
  | 'historical_photo'
  | 'map'
  | 'press'
  | 'other';

export type ReliabilityLevel = 'high' | 'medium' | 'preliminary';

export type ImageRole = 'current_view' | 'historical_photo' | 'detail' | 'plan_or_map' | 'other';

export type RightsStatus = 'Public Domain' | 'Creative Commons' | 'Copyrighted - Permission Granted' | 'Unknown' | 'Restricted';

export type UserRole = 'Visitor' | 'Contributor' | 'Editor' | 'Admin' | 'Super Admin';

export interface Province {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
  center_lat: number;
  center_lng: number;
}

export interface District {
  id: string;
  province_id: string;
  name_ar: string;
  name_en: string;
}

export interface SubDistrict {
  id: string;
  district_id: string;
  name_ar: string;
  name_en: string;
}

export interface Area {
  id: string;
  sub_district_id: string;
  district_id: string;
  name_ar: string;
  name_en: string;
  description?: string;
  lat: number | null;
  lng: number | null;
}

export interface SiteType {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  definition: string;
  icon_name: string;
}

export interface HistoricalPeriod {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  start_year: string;
  end_year: string;
  description: string;
}

export interface Tag {
  id: string;
  name_ar: string;
  name_en?: string;
  slug?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface Source {
  id: string;
  source_type: SourceType;
  title: string;
  author: string;
  publisher?: string;
  year?: string;
  isbn?: string;
  archive_reference?: string;
  page_reference?: string;
  excerpt?: string;
  url?: string;
  reliability_level: ReliabilityLevel;
  reliability_notes?: string;
  language: string;
}

export interface ClaimEvidence {
  id: string;
  claim_id: string;
  source_id: string;
  page_reference?: string;
  excerpt?: string;
  editor_note?: string;
  relevance: 'direct' | 'supporting' | 'contextual';
}

export interface ClaimVariant {
  id: string;
  claim_id: string;
  account_text: string;
  scholar_or_school: string;
  source_ids: string[];
}

export interface SiteClaim {
  id: string;
  site_id: string;
  claim_text: string;
  claim_type: 'date_of_construction' | 'founder_identity' | 'architectural_phase' | 'historical_event' | 'function';
  is_disputed: boolean;
  variants?: ClaimVariant[];
  evidence?: ClaimEvidence[];
}

export interface SiteImage {
  id: string;
  site_id: string;
  title: string;
  caption: string;
  description: string;
  alt_text: string;
  date_taken: string;
  date_precision: 'exact' | 'approximate' | 'unknown';
  photographer: string;
  credit_line: string;
  license: string;
  usage_restrictions?: string;
  rights_status: RightsStatus;
  image_role: ImageRole;
  sort_order: number;
  featured: boolean;
  visibility: boolean;
  ai_assisted: boolean;
  web_url: string;
  thumb_url: string;
  download_url?: string;
  source_ids?: string[];
  file_hash_sha256: string;
  viewpoint_lat?: number;
  viewpoint_lng?: number;
}

export interface SiteTimelineEvent {
  id: string;
  site_id: string;
  year: string;
  title: string;
  description: string;
  source_id?: string;
}

export interface Site {
  id: string;
  permanent_id: string; // e.g. KHA-000101
  slug: string;
  name_ar: string;
  name_en: string;
  alternate_names: { name: string; lang: string }[];
  short_description: string;
  description: string;
  historical_description: string;
  architectural_description: string;
  cultural_significance: string;
  historical_significance: string;
  current_condition: string;
  location_description: string;
  province_id: string;
  district_id: string;
  area_id: string;
  site_type_id: string;
  historical_period_id: string;
  
  // Coordinates & PostGIS Location Precision
  lat: number;
  lng: number;
  location_precision: LocationPrecision;

  // Statuses
  publication_status: PublicationStatus;
  verification_status: VerificationStatus;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  last_reviewed_at: string;
  created_by: string;
  updated_by: string;
  published_at?: string;
  
  // Heritage specific
  is_demo: boolean;
  is_lost_or_vanished: boolean;
  is_under_research: boolean;
  ai_assisted: boolean;
  view_count: number;
  featured: boolean;
  
  // Relations counts
  source_count: number;
  image_count: number;
}

export interface SiteRevision {
  id: string;
  site_id: string;
  site_name: string;
  changed_field: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_at: string;
  reason: string;
  verification_status_at_time: VerificationStatus;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string;
  ip_hash: string;
  details: string;
  created_at: string;
}

export interface SiteContribution {
  id: string;
  type: 'suggest_site' | 'suggest_museum' | 'suggest_photo' | 'suggest_correction' | 'suggest_source';
  target_site_id?: string;
  contributor_name: string;
  contributor_email: string;
  allow_public_credit: boolean;
  title: string;
  description: string;
  source_reference?: string;
  image_file_name?: string;
  rights_declaration?: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'needs_clarification';
  admin_decision_reason?: string;
  reviewed_by?: string;
  created_at: string;
}

export interface EncyclopediaEntry {
  id: string;
  slug: string;
  term_ar: string;
  term_en: string;
  category: 'architecture' | 'historical_event' | 'person' | 'geography' | 'dynasty';
  short_summary: string;
  full_text: string;
  related_site_ids: string[];
  source_ids: string[];
}

export interface CuratedCollection {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  cover_image: string;
  site_ids: string[];
}

export interface SlugHistoryEntry {
  id: string;
  site_id: string;
  old_slug: string;
  current_slug: string;
  redirect_type: 301 | 302;
  created_at: string;
}

export interface ImageSourcePivot {
  id: string;
  image_id: string;
  source_id: string;
  page_reference?: string;
  excerpt?: string;
  editor_note?: string;
}

export type OperatorType = 'shrine_run_endowment' | 'government' | 'private' | 'other';

export type FoundingYearPrecision = 'exact' | 'approximate' | 'century' | 'unknown';

export interface MuseumVisitingInfo {
  hours?: string | null;
  admission?: string | null;
  rules?: string | null;
}

export interface MuseumProfile {
  id: string;
  site_id: string;
  operator_name: string | null;
  operator_type: OperatorType | null;
  official_website: string | null;
  address_text: string | null;
  visiting_info: MuseumVisitingInfo | null;
  visiting_info_source_id: string | null;
  visit_info_verified_at: string | null;
  accessibility_notes: string | null;
  founding_year: string | null;
  founding_year_precision: FoundingYearPrecision | null;
  collection_summary: string | null;
  artifacts?: MuseumArtifact[];
}

export interface MuseumArtifact {
  id: string;
  title_ar: string;
  title_en: string | null;
  category: string | null;
  description: string | null;
  material: string | null;
  estimated_date: string | null;
  origin: string | null;
  archaeological_context: string | null;
  source_url?: string | null;
}

export interface SiteRelation {
  id: string;
  source_site_id: string;
  target_site_id: string;
  relation_type: 'located_within' | 'part_of_complex' | 'adjacent_to';
  relation_label_ar: string; // e.g. «يقع داخل»
  source_id?: string;
  editor_notes?: string;
}

export interface ResearchLead {
  id: string;
  name: string;
  lead_url: string | null;
  note: string | null;
  created_by: string;
  status: 'lead' | 'under_investigation' | 'converted_to_site' | 'rejected';
  created_at: string;
}

export type ModelKind = 'scan' | 'photogrammetry' | 'reconstruction' | 'illustrative';

export interface SiteModel {
  id: string;
  site_id: string;
  glb_path: string;
  poster_path: string;
  model_kind: ModelKind;
  credit: string;
  license: string;
  rights_status: RightsStatus | string;
  source_id?: string | null;
  ai_assisted: boolean;
  editor_approved?: boolean;
  publication_status: PublicationStatus;
  is_featured_on_home: boolean;
  sort_order: number;
  camera_orbit?: string;
  is_demo?: boolean;
}

