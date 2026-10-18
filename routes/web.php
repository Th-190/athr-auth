<?php

use App\Http\Controllers\HealthCheckController;
use App\Http\Controllers\SiteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes — «أثر كربلاء»
|--------------------------------------------------------------------------
*/

// Health check endpoint for load balancers & monitoring
Route::get('/up', HealthCheckController::class)->name('health.up');

Route::get('/', function () {
    return view('welcome');
})->name('home');

Route::get('/sites', function () {
    return view('welcome');
})->name('sites.index');

Route::get('/sites/{slug}', function ($slug) {
    return view('welcome', ['slug' => $slug]);
})->name('sites.show');

Route::get('/admin/{any?}', function () {
    return view('welcome');
})->where('any', '.*')->name('admin');

Route::get('/sitemap.xml', [SiteController::class, 'sitemap'])->name('sitemap');
Route::get('/rss.xml', [SiteController::class, 'rss'])->name('rss');
Route::get('/feed', [SiteController::class, 'rss'])->name('feed');

// State-changing web route to prove CSRF protection
Route::post('/web/action', function () {
    return response()->json(['status' => 'success']);
})->name('web.action');

