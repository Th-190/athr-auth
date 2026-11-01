<?php

namespace App\Database;

use DateTimeInterface;
use Illuminate\Database\PostgresConnection;

/**
 * Preserve PostgreSQL boolean bindings as boolean literals with PDO emulation.
 * Laravel's base connection converts booleans to 0/1, which PostgreSQL rejects
 * for boolean columns when using the Supavisor transaction pooler.
 */
class SupavisorPostgresConnection extends PostgresConnection
{
    public function prepareBindings(array $bindings): array
    {
        $dateFormat = $this->getQueryGrammar()->getDateFormat();

        foreach ($bindings as $key => $value) {
            if ($value instanceof DateTimeInterface) {
                $bindings[$key] = $value->format($dateFormat);
            } elseif (is_bool($value)) {
                $bindings[$key] = $value ? 'true' : 'false';
            }
        }

        return $bindings;
    }
}
