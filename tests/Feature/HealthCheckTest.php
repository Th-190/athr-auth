<?php

test('health check endpoint responds with 200 and healthy payload', function () {
    $response = $this->getJson('/up');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'status',
            'timestamp',
            'app',
            'environment',
            'database' => [
                'connection',
                'status',
                'extensions' => [
                    'postgis',
                    'pg_trgm',
                    'unaccent',
                ],
            ],
            'storage' => [
                'disks' => [
                    'originals',
                    'derivatives',
                    'downloads',
                ],
            ],
            'version',
        ]);
});

test('api v1 health endpoint responds successfully', function () {
    $response = $this->getJson('/api/v1/health');

    $response->assertStatus(200)
        ->assertJson([
            'status' => 'healthy',
        ]);
});
