# CMS audit and Supabase compatibility notes

Scope audited: admin React modules under `src/components/admin/cms`, their Laravel API routes/controllers/models, and the existing Laravel migrations. This document describes the application contract; it is not evidence of the live Supabase schema. Production schema/data were not queried or changed in this task.

## Module inventory

| CMS module | Primary persistence/API | Main related records |
| --- | --- | --- |
| Dashboard and review queue | `HeritageEditorialController`, `ContributionController`, reports endpoints | sites, museum artifacts, contributions, reports |
| Sites | `SiteController` and editorial routes | site types, historical periods, province/area, sources, revisions, verifications, images |
| Museums | Sites classified by `site_types.slug = museums`; `museum_profiles` relation | sites, museum profile, museum artifacts, visiting information source |
| Artifacts | `/api/v1/admin/editorial/artifacts` | museum profile, source, citation pivot, artifact revisions |
| Encyclopedia | `EncyclopediaController` admin endpoints | related sites and sources |
| Sources | `SourceController` admin endpoints | claims, sites, artifacts, encyclopedia entries |
| Media and rights | `MediaController` | site/image relationships, private originals, derivatives, rights metadata |
| Taxonomies and geography | `TaxonomyController` plus admin taxonomy routes | site types, periods, provinces, districts, sub-districts, areas, tags |
| Home page and site settings | `/api/v1/cms/public`, `/api/v1/admin/cms` | JSON `settings` keys; featured sites |
| Users and roles | `AdminUserController` | users, roles, permissions, active status, two-factor state |
| Audit and revisions | `AuditLogController`, editorial revisions | audit logs, site revisions, artifact revisions, verification decisions |

## Confirmed defects and changes

| Finding | Root cause | Change |
| --- | --- | --- |
| CMS config could silently remain browser-local | CMS API wrapper swallowed errors; admin routes/controller were missing and several panels wrote only to the local archive store | Added authenticated admin CMS read/write and public config read endpoints; panels now wait for server persistence before updating local cache |
| Audit screen could show demo/local records and server query referenced wrong audit fields | Manager read `archiveDB`; controller queried non-existent `auditable_type` and `performed_by` columns | Audit manager now reads the protected API; controller uses actual `entity_type`/`actor_name` fields and validated pagination/filters |
| New site forms prefilled Karbala city-center coordinates and first taxonomy records | Hardcoded coordinates and automatic first-option selection were presented as if verified | Removed fabricated coordinates and implicit taxonomy selection; editors must select a real taxonomy row and coordinates remain unknown unless entered |
| New museum metadata was not managed by the site form | Museum is a site type with a one-to-one `museum_profiles` table, but site write flow only handled `sites` | Site create/update accepts validated museum profile fields only when the selected type is `museums`; writes remain in the existing transaction and profile changes are audited |
| Artifact editor supported editing but not creation | API had only `PUT /artifacts/{artifact}` | Added staff-protected create route; validates a real museum profile and at least one existing source citation, creates an unverified draft, pivot links, revision and audit record |
| Tag count used local archive demo state | Areas manager rendered `archiveDB.getTags().length` even while fetching database data | Removed the misleading local count |

## Field handling

- Server-generated: primary keys, slugs/permanent IDs for sites, timestamps, workflow state at creation, actor IDs, audit and revision rows.
- Database-backed selectors: site type, historical period, geographic area, museum, source citations.
- Derived: museum profile association from the selected site type; human-readable related-record names from API relations.
- Manually entered: names, descriptions, museum operator/address/website/collection summary, artifact descriptions/material/date/provenance/context and citation details.
- Conditional: museum profile fields only for museum site types; geographic coordinates can be omitted and precision defaults to `unknown`; publication remains a separate explicit workflow.
- Internal-only: IDs, slug/permanent ID, timestamps, creator/editor metadata, verification and publication timestamps.

## Existing schema summary (from checked-in migrations)

- `sites`: identity, descriptions, taxonomy/geography foreign keys, publication and verification states, PostGIS geography, revisions and source links.
- `museum_profiles`: unique `site_id` FK, operator and website, address, visiting info and its optional source, accessibility, founding date precision, collection summary.
- `museum_artifacts`: `museum_profile_id` and optional legacy `source_id`, bilingual titles/descriptions, category/material/date/origin/context and separate publication/verification strings.
- `museum_artifact_sources`: unique artifact/source pivot with page, excerpt, editor note and relevance.
- `sources`: bibliographic and archive metadata, language, reliability, creator/editor and soft deletes.
- Controlled vocabularies/geography: `site_types`, `historical_periods`, `provinces`, `districts`, `sub_districts`, `areas`, `tags`.
- Workflow/security: `roles`, `permissions`, `role_permission`, users, site/artifact revisions, verification decisions, audit logs, media/image records.

## Migration and production-safety status

No schema migration was added because the changes use existing tables and columns. No production connection, migration, seed, data update, or deployment was performed. Checked-in migrations alone cannot establish that the live Supabase schema has no drift. Before a future deployment, compare the migration ledger and actual schema using read-only inspection, especially the museum profile fields, artifact citation pivot, revisions and audit columns.

## Remaining gaps / limits

- Live Supabase schema and PostgreSQL/PostGIS behavior were not verified in this local-only task. Run the PostgreSQL-specific feature suite against a disposable PostgreSQL/PostGIS database before deployment; SQLite is not sufficient.
- Existing editor workflows for media/source management remain dependent on configured storage and source records; no remote bucket or upload credentials were inspected.
- A site can still be created without a source citation through the basic Sites screen; citations can be added in editorial review. A strict cite-before-save rule requires a broader UI/API contract change and should be done with explicit source availability tests.
- Several legacy taxonomy/content utilities still contain demo data paths for the public/demo archive. They are not used as persistence by the CMS write screens after these changes, but require a separate audit to remove or label every public demo fallback.
- No data migration or destructive schema operation is part of this change. Any additive schema proposal requires a separate read-only impact report first.
