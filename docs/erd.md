# Entity Relationship Diagram (ERD) — «أثر كربلاء»
### Karbala Heritage Archive Database Schema

This document details the relational data model for **«أثر كربلاء» (Karbala Heritage Archive)**, designed in accordance with Prompt 2.

---

```mermaid
erDiagram
    PROVINCES ||--o{ DISTRICTS : contains
    PROVINCES ||--o{ SITES : scopes
    DISTRICTS ||--o{ SUB_DISTRICTS : contains
    SUB_DISTRICTS ||--o{ AREAS : contains
    AREAS ||--o{ SITES : locates

    SITE_TYPES ||--o{ SITES : categorizes
    HISTORICAL_PERIODS ||--o{ SITES : dates

    SITES ||--o{ SITE_NAMES : has_alternate_names
    SITES ||--o{ SITE_IMAGES : documents_with
    SITES ||--o{ SITE_CLAIMS : asserts
    SITES ||--o{ SITE_TIMELINE : chronicles
    SITES ||--o{ SITE_EVENTS : records
    SITES ||--o{ SITE_REVISIONS : audits
    SITES ||--o{ SITE_VERIFICATIONS : validates
    SITES ||--o{ SITE_CONTRIBUTIONS : receives

    SITES }o--o{ TAGS : tagged_with
    SITES }o--o{ SOURCES : cites
    SITES }o--o{ SITES : relates_to

    SITE_CLAIMS ||--o{ CLAIM_VARIANTS : branches_into
    SITE_CLAIMS ||--o{ CLAIM_EVIDENCE : substantiated_by
    CLAIM_VARIANTS ||--o{ CLAIM_EVIDENCE : linked_to
    SOURCES ||--o{ CLAIM_EVIDENCE : provides_source

    SITE_IMAGES ||--o{ MEDIA_HASHES : fingerprinted_by
    SITE_IMAGES }o--o{ SOURCES : references_rights
    SITE_IMAGES ||--o{ DOWNLOAD_LOGS : tracks_access

    ENCYCLOPEDIA_ENTRIES }o--o{ SITES : links_to
    ENCYCLOPEDIA_ENTRIES }o--o{ SOURCES : references

    USERS ||--o{ ROLES : belongs_to
    ROLES }o--o{ PERMISSIONS : possesses
    USERS ||--o{ SITES : verifies_or_edits
    USERS ||--o{ AUDIT_LOGS : performs_actions

    PROVINCES {
        bigint id PK
        string code UK
        string name_ar
        string name_en
        string slug UK
        geography coordinates "Point 4326"
    }

    DISTRICTS {
        bigint id PK
        bigint province_id FK
        string name_ar
        string name_en
        string slug
    }

    SUB_DISTRICTS {
        bigint id PK
        bigint district_id FK
        string name_ar
        string name_en
        string slug
    }

    AREAS {
        bigint id PK
        bigint sub_district_id FK
        string name_ar
        string name_en
        string slug
        geography coordinates "Point 4326 GIST"
    }

    SITE_TYPES {
        bigint id PK
        string slug UK
        string name_ar
        string name_en
        text definition
        integer sort_order
    }

    HISTORICAL_PERIODS {
        bigint id PK
        string slug UK
        string name_ar
        string name_en
        string start_year_label
        string end_year_label
        boolean needs_editor_confirmation
    }

    SITES {
        bigint id PK
        string permanent_id UK "e.g. KHA-000101"
        string slug "province-scoped"
        string name_ar
        string name_en
        text short_description
        text description
        text historical_description
        text architectural_description
        text cultural_significance
        text historical_significance
        text current_condition
        text location_description
        bigint province_id FK
        bigint area_id FK
        bigint site_type_id FK
        bigint historical_period_id FK
        string publication_status "draft, pending_review, published, archived"
        string verification_status "verified, partially_verified, unverified, disputed, unknown"
        text verification_notes
        bigint verified_by FK
        timestamp verified_at
        timestamp last_reviewed_at
        boolean is_demo
        boolean ai_assisted
        string location_precision "exact, approximate, restricted"
        geography coordinates "Point 4326 GIST"
        text search_text "pg_trgm GIN"
    }

    SOURCES {
        bigint id PK
        string source_type "book, academic_paper, document, archive..."
        string title
        string author
        string publisher
        string year
        string isbn
        string archive_reference
        string page_reference
        text excerpt
        string language
        string reliability_level "primary, high, medium, preliminary, low"
        text reliability_notes
    }

    SITE_CLAIMS {
        bigint id PK
        bigint site_id FK
        string claim_type
        text claim_text
        boolean is_disputed
    }

    CLAIM_VARIANTS {
        bigint id PK
        bigint claim_id FK
        string scholar_or_school
        text account_text
    }

    CLAIM_EVIDENCE {
        bigint id PK
        bigint claim_id FK
        bigint claim_variant_id FK
        bigint source_id FK
        string page_reference
        text excerpt
        string relevance "direct, supporting, contextual, contradictory"
    }

    SITE_IMAGES {
        bigint id PK
        bigint site_id FK
        string ulid UK
        string title
        string caption
        text description
        string alt_text
        string date_taken
        string photographer
        string credit_line
        string rights_status "public_domain, creative_commons, copyrighted_permitted, unknown, restricted"
        string image_role "current_view, historical_photo, detail, plan_or_map..."
        integer sort_order
        boolean featured
        string original_storage_path "private disk"
        string web_storage_path "derivatives CDN"
        string download_storage_path "signed URL"
        geography viewpoint_coordinates "Point 4326"
    }

    MEDIA_HASHES {
        bigint id PK
        bigint site_image_id FK
        string file_version "original, web, thumbnail, download"
        string hash_algorithm "sha256"
        string hash_value UK
        bigint file_size_bytes
    }

    AUDIT_LOGS {
        bigint id PK
        string action
        string entity_type
        bigint entity_id
        string entity_identifier
        bigint user_id FK
        string actor_name
        string ip_hash
        json old_payload
        json new_payload
        text details
        timestamp created_at
    }

    DOWNLOAD_LOGS {
        bigint id PK
        bigint site_image_id FK
        bigint user_id FK
        string download_version
        string ip_hash
        timestamp downloaded_at
    }

    SITE_REVISIONS {
        bigint id PK
        bigint site_id FK
        string field_name
        text old_value
        text new_value
        bigint changed_by FK
        text reason
        string verification_status_at_time
    }

    SITE_VERIFICATIONS {
        bigint id PK
        bigint site_id FK
        string previous_status
        string new_status
        text decision_reason
        bigint verified_by FK
        timestamp created_at
    }
```

---

## 🔐 Key Data Architecture Invariants

1. **Geometry & Location Precision**:
   - The PostGIS `coordinates geography(Point, 4326)` column with a `GIST` index is the only coordinate source.
   - `latitude` and `longitude` are strictly derived accessors.
   - For records where `location_precision = 'restricted'`, exact coordinates are fuzzed and masked at the model level before leaving the backend to prevent archaeological looting.

2. **Arabic Full-Text Normalization**:
   - `search_text` is maintained by `SiteObserver` on saving.
   - It strips tashkeel, tatweel, and unifies alef/yaa/taa marbuta variants.
   - Indexed via `pg_trgm gin_trgm_ops` for fuzzy, diacritic-tolerant substring matching.

3. **Separation of Concerns**:
   - `publication_status` is independent from `verification_status`. A published record is never assumed to be verified.
   - Every substantive edit triggers a verification status review and logs an append-only revision.
