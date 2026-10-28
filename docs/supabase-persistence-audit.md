# Supabase persistence audit and safe recovery

## Architecture and findings

Laravel uses its native `pgsql` connection for archive reads and writes. The frontend calls the Laravel API; no Supabase JavaScript client is configured. Production media storage is Cloudflare R2 through Laravel's private `originals`, public derivative, and private download disks. The image original and `site_images`/hash rows are separate operations: the controller stores the object first, inserts metadata in a database transaction, and deletes the uploaded object if metadata insertion fails. Derivatives are created only after a permitted rights review.

The available local `.env` connection successfully reached a Supabase PostgreSQL pooler and reported the expected application migration history and schema/extensions. The audited core tables had the columns expected by the repository migrations. The local settings use individual `DB_*` variables and `DB_SSLMODE=prefer`; the default is now `require` for TLS. This inspection cannot prove that Railway has the same environment variables or points to the same Supabase project; confirm those separately in Railway without pasting secret values.

The audited live database had zero rows in `provinces`, `site_types`, `historical_periods`, `areas`, `sites`, `site_images`, `museum_profiles`, `museum_artifacts`, and `sources`. That explains the create-site form's classification/region validation failure: valid foreign-key options did not exist. Schema migrations being complete does not create those reference rows. No content records were inserted during the audit.

The application has no Supabase client; Laravel's database role owns/bypasses RLS for the inspected tables. RLS was not enabled on the inspected tables, and `anon`/`authenticated` had broad direct table grants, including write access. The additive PostgreSQL migration in this change revokes table/sequence access from `PUBLIC`, `anon`, and `authenticated` for allowlisted application tables and revokes matching default grants. Laravel's migration/database role remains the authorized app connection. The migration is deliberately not run here and its rollback does not restore public grants. Review the deployment DB role's ownership/grant authority before applying it.

## Safe local reference setup

After migrating a local disposable database, run:

```sh
php artisan archive:bootstrap-reference-data
```

This explicit command only creates missing Karbala geography, site types, and historical periods. It does not run demo seeders, add sites/museums/artifacts, overwrite rows with matching slugs, or publish anything. Placeholder area and period descriptions remain marked for editor confirmation and must be reviewed before being used as historical claims. For an intentionally selected production database, deploy/review first, then run `php artisan archive:bootstrap-reference-data --force` from the Railway service shell only after verifying the database target and taking a backup. Do not run `db:seed` for this repair.

## Supabase API role grants

Apply the new grant-revocation migration only after confirming it runs as the owner or grant-capable role for the application tables. Laravel's direct PostgreSQL connection continues to use its configured database role; Supabase PostgREST roles will no longer have direct table access. If the project later adds a Supabase browser/client integration, design explicit least-privilege grants and RLS policies before enabling it; never restore broad write grants.

## Verification limits

The schema and migration history were checked with read-only SQL in a transaction. RLS state and table privileges were also inspected read-only. No live write, migration, seed, reset, Railway deploy, or GitHub push was performed. PostgreSQL/PostGIS create/update integration tests and R2 upload integration tests still require a disposable test database/storage service; they must not target the audited production database.
