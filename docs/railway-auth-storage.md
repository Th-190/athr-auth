# Railway database, administrator authentication, and image storage

## Railway variables

Use Railway's PostgreSQL `DATABASE_URL` in the web and queue-worker services. Set `DB_CONNECTION=pgsql`, `APP_ENV=production`, `APP_DEBUG=false`, and `APP_URL=https://<your-public-domain>`. The Laravel PostgreSQL connection reads `DATABASE_URL` directly; `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` remain available for local development. Set `DB_SSLMODE` to the mode required by the database provider.

Configure `ARCHIVE_ADMIN_EMAIL` as the bootstrap/recovery Super Admin email. From a trusted Railway shell, initialize the first account with `php artisan make:admin --name="Administrator name"`; enter its password at the hidden prompt. The command stores only a Laravel password hash. The configured email is not an allowlist for subsequent sign-ins. After the first Super Admin enables two-factor authentication and logs in, create the other two accounts through the protected Users interface, using separate emails and passwords of at least 12 characters. The server permits at most three active Super Admins; disabled and soft-deleted historical accounts do not count. A fourth active account and disabling/removing the last active account are rejected server-side.

For the optional editor-only Gemini suggestion endpoint, set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in Railway's encrypted service variables. Never use a `VITE_` name or commit the key. See [backend AI and Supabase compatibility](backend-ai-and-supabase.md) for its scope, data handling, and human-review restrictions.

Configure Cloudflare R2 with `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_REGION=auto`, `R2_ORIGINALS_BUCKET`, `CDN_DERIVATIVES_BUCKET`, `R2_DOWNLOADS_BUCKET`, and `CDN_URL`. The originals and downloads buckets must remain private. Publish the derivatives bucket through a Cloudflare custom domain and set that domain as `CDN_URL`. Do not enable public access on the originals or downloads buckets.

Set `SESSION_SECURE_COOKIE=true`, `SESSION_HTTP_ONLY=true`, `SESSION_SAME_SITE=lax`, and `SANCTUM_EXPIRATION=720` in production. Set `SANCTUM_STATEFUL_DOMAINS` to the frontend hostnames, including ports where applicable. Keep the Laravel application and frontend same-origin where possible; for split origins, configure exact trusted stateful domains and credentialed CORS without wildcards.

## Deploy

Run the additive schema migration before or as the release step for the application:

```sh
php artisan migrate --force
php artisan config:cache
```

Run a separate Railway service from the same image for the database queue worker, with the same database and R2 environment variables:

```sh
php artisan queue:work database --sleep=3 --tries=3 --timeout=90 --max-time=3600
```

The Docker image installs `pcntl` so the queue worker can enforce its timeout. The database queue uses a 120-second `retry_after`; keep the worker timeout shorter than this value. The worker must run the same release as the web service so uploaded originals are turned into web/thumb derivatives in a dedicated public derivatives bucket and private watermarked download derivatives. The R2 bucket attached to `CDN_URL` exposes every object in that derivatives bucket, so never store originals or private downloads in it. When image rights are revoked, the app deletes derivative objects and stops publishing their paths; clear any already cached Cloudflare copies as part of rights takedown. Do not use `migrate:fresh`, `db:wipe`, or database reset commands on production.

## Rights revocation and rollback

The R2 bucket attached to `CDN_URL` exposes every object in that derivatives bucket, so never store originals or private downloads in it. On the first release with rights-review fields, the migration hides every legacy visible image because those records have no server-side rights-review decision. The release operator must remove all legacy web and thumbnail objects from the dedicated derivatives bucket and purge their CDN URLs before treating them as private; only reprocess images after an editor records a fresh rights approval. When image rights are revoked or an image is deleted, the app removes public paths from the database and attempts to delete derivative objects; rights revocation also clears review approval. **The release operator must then purge each affected web and thumbnail URL from Cloudflare Cache (purge by exact URL or the narrowest matching cache tag), and verify the CDN URLs return 404 from an uncached request.** Until the purge is confirmed, previously cached copies may still be publicly accessible. Keep purge credentials in the operator's secret manager; do not put them in the repository or frontend environment.

The application image requires PHP 8.3 with `pdo_pgsql`, `intl`, `zip`, `gd`, `pcntl`, `fileinfo`, and OpenSSL support. The queue worker must use the same image as the web service and run with database connectivity and the R2 credentials needed by image jobs. `GD` performs derivative resizing and watermarked downloads; the current job does not require an external image binary.

Before the migration release, take a provider-managed PostgreSQL backup and confirm a restore to a disposable database. Apply only additive migrations using `php artisan migrate --force`; never use `migrate:fresh`, `db:wipe`, or database reset commands on production. If the release fails, roll back the application image first. Do not run migration rollback against production without reviewing that migration's `down()` operation and restoring from the verified backup if it could discard data.

## Local checks

```powershell
Copy-Item .env.example .env
docker compose up -d
docker compose exec laravel.test php artisan key:generate
docker compose exec laravel.test php artisan migrate
docker compose exec laravel.test php artisan storage:link
npm ci
npm run lint
npm run build
docker compose exec laravel.test php artisan test
```

For local image uploads, the `originals`, `derivatives`, and `downloads` disks use local storage. In production they use R2; a storage failure returns an error and never silently writes to an instance-local Railway filesystem.
