<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\SecurityHeadersMiddleware::class);
        $middleware->statefulApi();
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdminRole::class,
            'staff' => \App\Http\Middleware\EnsureStaffRole::class,
            'firebase' => \App\Http\Middleware\VerifyFirebaseToken::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
