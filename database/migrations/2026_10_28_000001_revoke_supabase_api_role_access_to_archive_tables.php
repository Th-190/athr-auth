<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Laravel is the only supported application gateway for archive data.
     * Supabase anon/authenticated are PostgREST client roles and must not be
     * able to bypass Laravel policies by writing directly to these tables.
     *
     * NOTE: ALTER DEFAULT PRIVILEGES requires superuser on Supabase and is
     * intentionally omitted. Per-table REVOKE ALL is sufficient for the
     * tables that already exist.
     */
    private const TABLES = [
        'roles', 'permissions', 'role_permission', 'provinces', 'districts', 'sub_districts', 'areas',
        'users', 'site_types', 'historical_periods', 'tags', 'sites', 'site_names', 'site_tags',
        'sources', 'site_sources', 'site_claims', 'claim_variants', 'claim_evidence', 'site_images',
        'media_hashes', 'image_sources', 'site_relations', 'site_events', 'site_timeline',
        'encyclopedia_entries', 'encyclopedia_sites', 'encyclopedia_sources', 'site_contributions',
        'content_reports', 'site_revisions', 'site_verifications', 'museum_profiles', 'research_leads',
        'audit_logs', 'download_logs', 'settings', 'site_models', 'access_invitations', 'sessions',
        'personal_access_tokens', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs',
        'museum_artifacts', 'museum_artifact_sources', 'museum_artifact_revisions',
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $schemaRow = DB::selectOne('select current_schema() as schema_name');
        $schema = $schemaRow?->schema_name ?? '';
        if (! is_string($schema) || $schema === '') {
            return;
        }

        $quote = fn (string $id): string => '"' . str_replace('"', '""', $id) . '"';
        $schemaId = $quote($schema);

        // Identify which Supabase PostgREST roles actually exist in this database.
        $roles = DB::select("select rolname from pg_roles where rolname in ('anon', 'authenticated')");
        $existingRoles = array_column($roles, 'rolname');
        $targets = array_values(array_intersect(['anon', 'authenticated'], $existingRoles));

        // REVOKE on tables
        foreach (self::TABLES as $table) {
            try {
                $exists = DB::selectOne('select to_regclass(?) as relation', [$schema . '.' . $table]);
                if (! $exists?->relation) {
                    continue;
                }

                foreach (['PUBLIC', ...$targets] as $role) {
                    $roleId = $role === 'PUBLIC' ? 'PUBLIC' : $quote($role);
                    try {
                        DB::statement(
                            'REVOKE ALL PRIVILEGES ON TABLE ' . $schemaId . '.' . $quote($table) . ' FROM ' . $roleId
                        );
                    } catch (\Throwable $e) {
                        Log::warning("REVOKE on {$table} from {$role} skipped: " . $e->getMessage());
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Could not inspect table {$table}: " . $e->getMessage());
            }
        }

        // REVOKE on sequences
        try {
            $sequences = DB::select(
                "select distinct seq.relname as sequence_name
                 from pg_class seq
                 join pg_namespace ns  on ns.oid  = seq.relnamespace
                 join pg_depend   dep  on dep.objid = seq.oid and dep.deptype in ('a', 'i')
                 join pg_class   tbl  on tbl.oid  = dep.refobjid
                 where seq.relkind = 'S' and ns.nspname = ? and tbl.relname = any(?)",
                [$schema, '{' . implode(',', self::TABLES) . '}']
            );

            foreach ($sequences as $sequence) {
                foreach (['PUBLIC', ...$targets] as $role) {
                    $roleId = $role === 'PUBLIC' ? 'PUBLIC' : $quote($role);
                    try {
                        DB::statement(
                            'REVOKE ALL PRIVILEGES ON SEQUENCE ' . $schemaId . '.' . $quote($sequence->sequence_name) . ' FROM ' . $roleId
                        );
                    } catch (\Throwable $e) {
                        Log::warning("REVOKE on sequence {$sequence->sequence_name} from {$role} skipped: " . $e->getMessage());
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Could not enumerate sequences: ' . $e->getMessage());
        }
    }

    public function down(): void
    {
        // Deliberately do not restore public Supabase API grants on rollback.
    }
};
