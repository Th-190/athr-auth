# AGENTS.md — «أثر كربلاء» (Karbala Heritage Archive)

You are working on «أثر كربلاء» (Karbala Heritage Archive): a trustworthy, source-backed digital archive of the archaeological, historical and heritage sites of Karbala province, Iraq. It is NOT a blog, a news site or a landing page. It is a real full-stack application.

Priority order for every decision:
`authenticity > historical accuracy > content provenance > security > usability > visual quality > performance`.

## Stack
- PHP 8.3+, Laravel 12+
- PostgreSQL + PostGIS (must run on plain PostgreSQL and on Supabase Postgres)
- Vite, Blade, Tailwind CSS, Alpine.js
- Leaflet + OpenStreetMap
- Laravel Queues (Redis/Database)
- Cloudflare R2 + CDN through Laravel Storage (S3 driver)
- Laravel Sanctum for the API
- Pest for tests, Pint for code formatting, Larastan for static analysis

## Non-Negotiable Rules
1. **Backend is the source of truth**: Authorization is always server-side (Policies, Gates, Form Requests). Never rely on hidden buttons or JavaScript.
2. **Arabic-first, RTL-first UI**: All user-facing strings live in lang files (`lang/ar/`); keep the structure English-ready (`lang/en/`).
3. **Scope is Karbala only in v1**: Keep a `provinces` table and scope data by province so other provinces can be added later without redesigning the schema.
4. **Publication status vs Verification status**: Publication status (`draft`, `pending_review`, `published`, `archived`) is strictly separate from verification status (`verified`, `partially_verified`, `unverified`, `disputed`, `unknown`). `Published` NEVER implies `Verified`.
5. **AI policy**: AI never has publishing authority and never invents sources, dates, names, events, quotes or sites. AI-assisted content is flagged `ai_assisted` until an authorized human Editor or Admin reviews and verifies it.
6. **No fabricated history**: Seed and demo content must be obviously fake and labelled «بيانات تجريبية» (`is_demo = true`).
7. **Image privacy**: Original images are private and immutable and are never publicly linked or served directly. Public access uses processed derivatives or time-limited signed URLs.
8. **Architecture**: Thin controllers, Form Requests, Action/Service classes, Policies, Events/Listeners, Jobs, API Resources, Enums for fixed states, DB transactions.
9. **Auditability**: Every sensitive operation writes an audit log entry; every meaningful content change writes a revision record.
10. **Visual identity**: Authentic cultural-archive / digital-museum atmosphere (clay, brick, Iraqi ornament, old paper, bronze, copper, charcoal). Avoid glassmorphism, neon or purple-blue AI gradients, generic SaaS look, excessive bento grids, oversized heroes, and stock imagery.

## Definition of Done (Prompt 1)
- Clean clone runs with `sail up` and `sail artisan migrate`.
- PostGIS, pg_trgm, and unaccent extensions are enabled via migrations.
- Complete, documented `.env.example`.
- Dedicated storage disks: originals (private), derivatives (web/thumbs via CDN), downloads (private signed).
- Code layout in place: Actions, Services, Enums, Policies, Requests, Resources, Jobs.
- Tooling configured: Pest, Pint, Larastan, GitHub Actions CI.
- Health-check endpoint `/up` and `/api/health` passing.
