<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class HealthCheckController extends Controller
{
    /**
     * System health check evaluating database, PostGIS extensions, and storage disks.
     */
    public function __invoke(): JsonResponse
    {
        $dbStatus = 'ok';
        $postgisEnabled = false;
        $pgTrgmEnabled = false;
        $unaccentEnabled = false;

        try {
            DB::connection()->getPdo();
            
            if (DB::getDriverName() === 'pgsql') {
                $extensions = DB::table('pg_extension')->pluck('extname')->toArray();
                $postgisEnabled = in_array('postgis', $extensions);
                $pgTrgmEnabled = in_array('pg_trgm', $extensions);
                $unaccentEnabled = in_array('unaccent', $extensions);
            } else {
                $postgisEnabled = true;
                $pgTrgmEnabled = true;
                $unaccentEnabled = true;
            }
        } catch (\Throwable $e) {
            $dbStatus = 'error: '.$e->getMessage();
        }

        $disksConfigured = [
            'originals' => config('filesystems.disks.originals.driver'),
            'derivatives' => config('filesystems.disks.derivatives.driver'),
            'downloads' => config('filesystems.disks.downloads.driver'),
        ];

        $isHealthy = $dbStatus === 'ok' && $postgisEnabled && $pgTrgmEnabled && $unaccentEnabled;

        return response()->json([
            'status' => $isHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'app' => config('app.name'),
            'environment' => config('app.env'),
            'database' => [
                'connection' => config('database.default'),
                'status' => $dbStatus,
                'extensions' => [
                    'postgis' => $postgisEnabled,
                    'pg_trgm' => $pgTrgmEnabled,
                    'unaccent' => $unaccentEnabled,
                ],
            ],
            'storage' => [
                'disks' => $disksConfigured,
            ],
            'version' => '1.0.0-foundation',
        ], $isHealthy ? 200 : 503);
    }
}
