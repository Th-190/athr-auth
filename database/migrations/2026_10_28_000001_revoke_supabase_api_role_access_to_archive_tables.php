<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Laravel is the only supported application gateway for archive data.
     * Supabase anon/authenticated are PostgREST client roles and must not be
     * able to bypass Laravel policies by writing directly to these tables.
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

        $schema = DB::selectOne('select current_schema() as schema_name')?->schema_name;
        if (! is_string($schema) || $schema === '') {
            return;
        }

        $quote = fn (string $identifier): string => '"'.str_replace('"', '""', $identifier).'"';
        $schemaIdentifier = $quote($schema);
        $roles = DB::select("select rolname from pg_roles where rolname in ('anon', 'authenticated')");
        $existingRoles = array_column($roles, 'rolname');
        $targets = array_values(array_intersect(['anon', 'authenticated'], $existingRoles));

        foreach (self::TABLES as $table) {
            $exists = DB::selectOne('select to_regclass(?) as relation', [$schema.'.'.$table]);
            if (! $exists?->relation) {
                continue;
            }

            foreach (['PUBLIC', ...$targets] as $role) {
                $roleIdentifier = $role === 'PUBLIC' ? 'PUBLIC' : $quote($role);
                DB::statement('REVOKE ALL PRIVILEGES ON TABLE '.$schemaIdentifier.'.'.$quote($table).' FROM '.$roleIdentifier);
            }
        }

        $sequences = DB::select(
            "select distinct sequence.relname as sequence_name
             from pg_class sequence
             join pg_namespace namespace on namespace.oid = sequence.relnamespace
             join pg_depend dependency on dependency.objid = sequence.oid and dependency.deptype in ('a', 'i')
             join pg_class owning_table on owning_table.oid = dependency.refobjid
             where sequence.relkind = 'S' and namespace.nspname = ? and owning_table.relname = any(?)",
            [$schema, '{'.implode(',', self::TABLES).'}']
        );

        foreach ($sequences as $sequence) {
            foreach (['PUBLIC', ...$targets] as $role) {
                $roleIdentifier = $role === 'PUBLIC' ? 'PUBLIC' : $quote($role);
                DB::statement('REVOKE ALL PRIVILEGES ON SEQUENCE '.$schemaIdentifier.'.'.$quote($sequence->sequence_name).' FROM '.$roleIdentifier);
            }
        }

        foreach (['PUBLIC', ...$targets] as $role) {
            $roleIdentifier = $role === 'PUBLIC' ? 'PUBLIC' : $quote($role);
            DB::statement('ALTER DEFAULT PRIVILEGES IN SCHEMA '.$schemaIdentifier.' REVOKE ALL ON TABLES FROM '.$roleIdentifier);
            DB::statement('ALTER DEFAULT PRIVILEGES IN SCHEMA '.$schemaIdentifier.' REVOKE ALL ON SEQUENCES FROM '.$roleIdentifier);
        }
    }

    public function down(): void
    {
        // Deliberately do not restore public Supabase API grants on rollback.
    }
};
