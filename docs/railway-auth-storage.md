# Railway database, Google sign-in, and image storage

## Railway variables

Use Railway's PostgreSQL `DATABASE_URL` in the web and queue-worker services. Set `DB_CONNECTION=pgsql`, `APP_ENV=production`, `APP_DEBUG=false`, and `APP_URL=https://<your-public-domain>`. The Laravel PostgreSQL connection reads `DATABASE_URL` directly; `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` remain available for local development. Set `DB_SSLMODE` to the mode required by the database provider.

Configure `FIREBASE_PROJECT_ID` to the Firebase project used by the frontend. The backend verifies Firebase ID-token signatures and the exact project audience. `VITE_FIREBASE_*` variables are public browser configuration; never put a private service-account key in them.

Configure Cloudflare R2 with `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_REGION=auto`, `R2_ORIGINALS_BUCKET`, `CDN_DERIVATIVES_BUCKET`, `R2_DOWNLOADS_BUCKET`, and `CDN_URL`. The originals and downloads buckets must remain private. Publish the derivatives bucket through a Cloudflare custom domain and set that domain as `CDN_URL`. Do not enable public access on the originals or downloads buckets.

Set `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=lax`, and `SANCTUM_EXPIRATION=720` in production. Add the production frontend host to Firebase Authentication's authorized domains. The Laravel API and Vite app should be same-origin; if they are split across origins, configure the exact frontend origin in Firebase and CORS/Sanctum instead of using a wildcard.

## Deploy

Run the additive schema migration before or as the release step for the application:

```sh
php artisan migrate --force
php artisan config:cache
```

Run a separate Railway service from the same image for the database queue worker, with the same database and R2 environment variables:

```sh
php artisan queue:work --sleep=3 --tries=3 --max-time=3600
```

The worker must run the same release as the web service so uploaded originals are turned into public web/thumb derivatives and private watermarked download derivatives. Do not use `migrate:fresh`, `db:wipe`, or database reset commands on production.

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
