# Backend AI assistance and Supabase compatibility

## Current architecture

The application does not currently use Supabase services or the Supabase client. Laravel is the API and authorization boundary, PostgreSQL/PostGIS is the authoritative relational data store, and the current deployment host remains unchanged. Replacing the database or media storage with a JSON file would discard relational constraints, transactions, concurrent-write safety, spatial queries, and durable managed storage; this implementation does not do that.

The small `config/ai/editorial-assistant.json` file is backend-only, versioned configuration for a non-authoritative AI helper (model default, generation limits, and safety instructions). It is not served from the web root and contains no credentials or archive records. It is intentionally not writable runtime data. AI suggestions are returned for immediate human review and are not persisted; editors must make and save any content changes through the existing editorial workflow.

This JSON configuration is not a replacement for Supabase Database, Auth, Storage, Realtime, Edge Functions, or backups. The project continues to use its current Laravel/PostgreSQL and R2/CDN integrations. Administrator access uses Laravel sessions; Firebase Authentication has been removed. If Supabase Postgres is selected later as a database provider, use its PostgreSQL endpoint and the existing Laravel PostgreSQL/PostGIS configuration; do not copy live archive records into JSON.

## Google AI configuration

Provision a Gemini API key for the intended Google project through Google AI Studio or the Google Cloud Console's supported Gemini API key flow. Apply provider-side API restrictions and usage limits where available. Set these server-side variables in the current host's secret manager:

- `GEMINI_API_KEY`: private server credential. Never use a `VITE_` prefix.
- `GEMINI_MODEL`: optional model override; the backend JSON supplies the default.

The backend sends the key in the `x-goog-api-key` HTTP header. Requests are available only to active server-authorized editors and administrators, are rate limited, validate source excerpts, and return suggestions marked as AI-assisted and requiring human review. They do not change archive records or grant verification or publishing rights. Missing credentials fail closed with HTTP 503. Do not place a real key in `.env.example`, source files, frontend configuration, request URLs, or version control. For local work, set the key in an ignored local `.env`; for production, use the host's encrypted variable store. Restart services and refresh Laravel's cached configuration after changing secrets.

## Data handling limits

Submitted source excerpts and title are sent to Google's Gemini API to generate a suggestion. Do not submit personal, restricted, confidential, or unpublished copyrighted material unless the source's terms and the institution's privacy policy permit that processing. The application does not save the prompt or response, but provider-side processing and retention are governed by Google's current terms and project settings. The endpoint is synchronous, subject to provider availability, quotas, and request timeouts. It is not a durable job queue or source repository.

The configured model and safety policy are JSON so maintainers can review changes in Git. Do not put API keys, user-specific settings, or mutable editorial records in that file.
