<?php

use App\Http\Controllers\HealthCheckController;
use App\Http\Controllers\AdminSessionController;
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

Route::get('/admin/login', [AdminSessionController::class, 'show'])->name('login');
Route::post('/admin/login', [AdminSessionController::class, 'store'])
    ->middleware('throttle:5,1')->name('admin.login.store');
Route::post('/admin/logout', [AdminSessionController::class, 'destroy'])
    ->middleware('auth')->name('admin.logout');

Route::get('/admin/{any?}', function () {
    // Docker copies the compiled React application into public/. During local
    // development the same build remains in dist/ instead.
    $index = public_path('index.html');

    if (!is_file($index)) {
        $index = base_path('dist/index.html');
    }

    abort_unless(is_file($index), 503, 'The administration interface has not been built.');

    return response()->file($index);
})->where('any', '.*')->middleware(['auth', 'designated.staff'])->name('admin');

Route::get('/sitemap.xml', [SiteController::class, 'sitemap'])->name('sitemap');
Route::get('/rss.xml', [SiteController::class, 'rss'])->name('rss');
Route::get('/feed', [SiteController::class, 'rss'])->name('feed');

// State-changing web route to prove CSRF protection
Route::post('/web/action', function () {
    return response()->json(['status' => 'success']);
})->name('web.action');

