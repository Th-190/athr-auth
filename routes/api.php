<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\ContributionController;
use App\Http\Controllers\EncyclopediaController;
use App\Http\Controllers\HealthCheckController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\MuseumController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\TaxonomyController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — «أثر كربلاء» (Karbala Heritage Archive API v1)
|--------------------------------------------------------------------------
*/

Route::get('/health', HealthCheckController::class)->name('api.health');

Route::prefix('v1')->group(function () {
    // System Health & Architecture Status
    Route::get('/health', HealthCheckController::class)->name('api.v1.health');

    // Authentication & Session (Rate limited to prevent brute force / flooding)
    Route::post('/auth/google', [AuthController::class, 'handleGoogleLogin'])
        ->middleware('throttle:15,1')
        ->name('api.v1.auth.google');
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me'])->name('api.v1.auth.me');
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.v1.auth.logout');
    });

    // Public Taxonomies
    Route::get('/taxonomies', [TaxonomyController::class, 'index'])->name('api.v1.taxonomies.index');
    Route::get('/taxonomies/types', [TaxonomyController::class, 'siteTypes'])->name('api.v1.taxonomies.types');
    Route::get('/taxonomies/periods', [TaxonomyController::class, 'historicalPeriods'])->name('api.v1.taxonomies.periods');
    Route::get('/taxonomies/geography', [TaxonomyController::class, 'geography'])->name('api.v1.taxonomies.geography');

    // Public Sites
    Route::get('/sites', [SiteController::class, 'index'])->name('api.v1.sites.index');
    Route::get('/sites/export/geojson', [SiteController::class, 'exportGeoJson'])->name('api.v1.sites.geojson');
    Route::get('/sites/{slug}', [SiteController::class, 'show'])->name('api.v1.sites.show');

    // Public Encyclopedia
    Route::get('/encyclopedia', [EncyclopediaController::class, 'index'])->name('api.v1.encyclopedia.index');
    Route::get('/encyclopedia/{slug}', [EncyclopediaController::class, 'show'])->name('api.v1.encyclopedia.show');

    // Public Museums
    Route::get('/museums', [MuseumController::class, 'index'])->name('api.v1.museums.index');
    Route::get('/museums/{slug}', [MuseumController::class, 'show'])->name('api.v1.museums.show');

    // Community Contributions & Reports (Rate limited to 10 per minute per IP)
    Route::post('/contributions', [ContributionController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('api.v1.contributions.store');

    // Media Downloads (Watermarked & Logged, rate limited to 30 per minute per IP)
    Route::get('/media/{id}/download', [MediaController::class, 'download'])
        ->middleware('throttle:30,1')
        ->name('api.v1.media.download');

    // -------------------------------------------------------------------------
    // Protected Admin & Editorial CMS Routes
    // -------------------------------------------------------------------------
    Route::prefix('admin')->middleware(['admin'])->group(function () {
        // Users & Role Management (Admin only)
        Route::get('/users', [AdminUserController::class, 'index'])->name('api.v1.admin.users.index');
        Route::post('/users', [AdminUserController::class, 'store'])->name('api.v1.admin.users.store');
        Route::put('/users/{id}/role', [AdminUserController::class, 'updateRole'])->name('api.v1.admin.users.role');
        Route::post('/users/{id}/deactivate', [AdminUserController::class, 'deactivate'])->name('api.v1.admin.users.deactivate');
        Route::post('/users/{id}/activate', [AdminUserController::class, 'activate'])->name('api.v1.admin.users.activate');
        Route::post('/users/{id}/revoke-sessions', [AdminUserController::class, 'revokeSessions'])->name('api.v1.admin.users.revoke_sessions');
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy'])->name('api.v1.admin.users.destroy');

        // Access Invitations (L6 Invitation System)
        Route::get('/invitations', [InvitationController::class, 'index'])->name('api.v1.admin.invitations.index');
        Route::post('/invitations', [InvitationController::class, 'store'])->name('api.v1.admin.invitations.store');
        Route::post('/invitations/{invitation}/revoke', [InvitationController::class, 'revoke'])->name('api.v1.admin.invitations.revoke');

        // Sites CRUD & Publishing Workflow
        Route::post('/sites', [SiteController::class, 'store'])->name('api.v1.admin.sites.store');
        Route::put('/sites/{site}', [SiteController::class, 'update'])->name('api.v1.admin.sites.update');
        Route::delete('/sites/{site}', [SiteController::class, 'destroy'])->name('api.v1.admin.sites.destroy');
        Route::post('/sites/{id}/publish', [SiteController::class, 'publish'])->name('api.v1.admin.sites.publish');
        Route::post('/sites/{id}/unpublish', [SiteController::class, 'unpublish'])->name('api.v1.admin.sites.unpublish');
        Route::post('/sites/{id}/archive', [SiteController::class, 'archive'])->name('api.v1.admin.sites.archive');
        Route::post('/sites/{id}/restore', [SiteController::class, 'restore'])->name('api.v1.admin.sites.restore');
        Route::post('/sites/{id}/verify', [SiteController::class, 'verify'])->name('api.v1.admin.sites.verify');

        // Claims & Evidence
        Route::post('/sites/{site}/claims', [ClaimController::class, 'store'])->name('api.v1.admin.claims.store');
        Route::post('/claims/{claim}/evidence', [ClaimController::class, 'addEvidence'])->name('api.v1.admin.claims.evidence');

        // Encyclopedia / Articles CRUD
        Route::post('/encyclopedia', [EncyclopediaController::class, 'store'])->name('api.v1.admin.encyclopedia.store');
        Route::put('/encyclopedia/{id}', [EncyclopediaController::class, 'update'])->name('api.v1.admin.encyclopedia.update');
        Route::delete('/encyclopedia/{id}', [EncyclopediaController::class, 'destroy'])->name('api.v1.admin.encyclopedia.destroy');

        // Taxonomies Management (Types, Periods, Areas, Tags)
        Route::post('/taxonomies/types', [TaxonomyController::class, 'storeType'])->name('api.v1.admin.taxonomies.types.store');
        Route::put('/taxonomies/types/{id}', [TaxonomyController::class, 'updateType'])->name('api.v1.admin.taxonomies.types.update');
        Route::delete('/taxonomies/types/{id}', [TaxonomyController::class, 'destroyType'])->name('api.v1.admin.taxonomies.types.destroy');

        Route::post('/taxonomies/periods', [TaxonomyController::class, 'storePeriod'])->name('api.v1.admin.taxonomies.periods.store');
        Route::put('/taxonomies/periods/{id}', [TaxonomyController::class, 'updatePeriod'])->name('api.v1.admin.taxonomies.periods.update');
        Route::delete('/taxonomies/periods/{id}', [TaxonomyController::class, 'destroyPeriod'])->name('api.v1.admin.taxonomies.periods.destroy');

        Route::post('/taxonomies/areas', [TaxonomyController::class, 'storeArea'])->name('api.v1.admin.taxonomies.areas.store');
        Route::put('/taxonomies/areas/{id}', [TaxonomyController::class, 'updateArea'])->name('api.v1.admin.taxonomies.areas.update');
        Route::delete('/taxonomies/areas/{id}', [TaxonomyController::class, 'destroyArea'])->name('api.v1.admin.taxonomies.areas.destroy');

        Route::post('/taxonomies/tags', [TaxonomyController::class, 'storeTag'])->name('api.v1.admin.taxonomies.tags.store');
        Route::put('/taxonomies/tags/{id}', [TaxonomyController::class, 'updateTag'])->name('api.v1.admin.taxonomies.tags.update');
        Route::delete('/taxonomies/tags/{id}', [TaxonomyController::class, 'destroyTag'])->name('api.v1.admin.taxonomies.tags.destroy');

        // Media Library & Digital Vault
        Route::get('/media', [MediaController::class, 'index'])->name('api.v1.admin.media.index');
        Route::post('/media/upload', [MediaController::class, 'upload'])->name('api.v1.admin.media.upload');
        Route::put('/media/{id}', [MediaController::class, 'updateMetadata'])->name('api.v1.admin.media.update');
        Route::delete('/media/{id}', [MediaController::class, 'destroy'])->name('api.v1.admin.media.destroy');
        Route::get('/media/{id}/usage', [MediaController::class, 'usage'])->name('api.v1.admin.media.usage');
        Route::get('/media/verify-hashes', [MediaController::class, 'verifyHashes'])->name('api.v1.admin.media.verify-hashes');

        // Site Settings & Homepage Configuration
        Route::get('/settings', [SettingController::class, 'index'])->name('api.v1.admin.settings.index');
        Route::post('/settings', [SettingController::class, 'update'])->name('api.v1.admin.settings.update');

        // Audit Trail (Immutable)
        Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('api.v1.admin.audit.index');

        // Contributions & Leads Review
        Route::get('/contributions', [ContributionController::class, 'index'])->name('api.v1.admin.contributions.index');
        Route::put('/contributions/{contribution}/review', [ContributionController::class, 'review'])->name('api.v1.admin.contributions.review');
        Route::get('/leads', [MuseumController::class, 'leads'])->name('api.v1.admin.leads.index');
        Route::post('/leads', [MuseumController::class, 'storeLead'])->name('api.v1.admin.leads.store');
    });
});
