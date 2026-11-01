<?php

namespace App\Providers;

use App\Database\SupavisorPostgresConnection;
use Illuminate\Database\Connection;
use Illuminate\Support\ServiceProvider;

class SupavisorPostgresServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        Connection::resolverFor('pgsql', static function ($pdo, string $database, string $prefix, array $config) {
            return new SupavisorPostgresConnection($pdo, $database, $prefix, $config);
        });
    }
}
