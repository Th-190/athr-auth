<?php

namespace App\Models;

use App\Enums\LocationPrecision;
use App\Enums\PublicationStatus;
use App\Enums\VerificationStatus;
use App\Observers\SiteObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

#[ObservedBy([SiteObserver::class])]
class Site extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    protected $casts = [
        'publication_status' => PublicationStatus::class,
        'verification_status' => VerificationStatus::class,
        'location_precision' => LocationPrecision::class,
        'is_demo' => 'boolean',
        'ai_assisted' => 'boolean',
        'is_lost_or_vanished' => 'boolean',
        'is_under_research' => 'boolean',
        'featured' => 'boolean',
        'view_count' => 'integer',
        'verified_at' => 'datetime',
        'last_reviewed_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    /**
     * Scope: Published and Publicly Accessible Records Only.
     * Enforces the single source of truth for public visibility across the application.
     */
    public function scopePublishedAndPublic(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('publication_status', PublicationStatus::PUBLISHED->value ?? 'published')
                     ->whereNull('deleted_at');
    }

    /**
     * Determine if this record is currently published and viewable by the public.
     */
    public function isPubliclyAccessible(): bool
    {
        $status = $this->publication_status instanceof \BackedEnum
            ? $this->publication_status->value
            : (string) $this->publication_status;

        return $status === 'published' && !$this->trashed();
    }

    /**
     * Derived Accessor: Latitude
     * Extracts latitude from the underlying PostGIS geography(Point,4326) column.
     */
    protected function latitude(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (DB::getDriverName() === 'pgsql' && $this->id) {
                    $val = DB::selectOne('SELECT ST_Y(coordinates::geometry) as lat FROM sites WHERE id = ?', [$this->id]);
                    return $val ? (float) $val->lat : null;
                }
                return null;
            }
        );
    }

    /**
     * Derived Accessor: Longitude
     * Extracts longitude from the underlying PostGIS geography(Point,4326) column.
     */
    protected function longitude(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (DB::getDriverName() === 'pgsql' && $this->id) {
                    $val = DB::selectOne('SELECT ST_X(coordinates::geometry) as lng FROM sites WHERE id = ?', [$this->id]);
                    return $val ? (float) $val->lng : null;
                }
                return null;
            }
        );
    }

    /**
     * PostGIS Spatial Security Gate:
     * Derived public coordinates respecting location_precision.
     * CRITICAL RULE: Exact coordinates of restricted sites NEVER leave the backend!
     */
    public function getPublicCoordinates(): ?array
    {
        $lat = $this->latitude;
        $lng = $this->longitude;

        if ($lat === null || $lng === null) {
            return null;
        }

        if ($this->location_precision === LocationPrecision::RESTRICTED) {
            // Intentionally fuzzed to 1 decimal place (~11 km centroid) to protect sensitive unexcavated ruins
            return [
                'latitude' => round($lat, 1),
                'longitude' => round($lng, 1),
                'is_fuzzed' => true,
                'precision_label' => 'محجوبة احترازياً لحماية المعلم',
            ];
        }

        if ($this->location_precision === LocationPrecision::APPROXIMATE) {
            // Fuzzed to 2 decimal places (~1.1 km area centroid)
            return [
                'latitude' => round($lat, 2),
                'longitude' => round($lng, 2),
                'is_fuzzed' => true,
                'precision_label' => 'إحداثيات تقريبية',
            ];
        }

        // Exact coordinates
        return [
            'latitude' => $lat,
            'longitude' => $lng,
            'is_fuzzed' => false,
            'precision_label' => 'إحداثيات مساحية دقيقة',
        ];
    }

    /**
     * Helper to set point coordinates using ST_PointFromText.
     */
    public function setCoordinates(float $latitude, float $longitude): self
    {
        if (DB::getDriverName() === 'pgsql') {
            $this->coordinates = DB::raw("ST_SetSRID(ST_MakePoint({$longitude}, {$latitude}), 4326)::geography");
        }
        return $this;
    }

    // ==========================================
    // Relationships
    // ==========================================

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function siteType(): BelongsTo
    {
        return $this->belongsTo(SiteType::class);
    }

    public function historicalPeriod(): BelongsTo
    {
        return $this->belongsTo(HistoricalPeriod::class);
    }

    public function names(): HasMany
    {
        return $this->hasMany(SiteName::class);
    }

    public function sources(): BelongsToMany
    {
        return $this->belongsToMany(Source::class, 'site_sources')
            ->withPivot(['page_reference', 'excerpt', 'editor_note', 'relevance'])
            ->withTimestamps();
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'site_tags');
    }

    public function claims(): HasMany
    {
        return $this->hasMany(SiteClaim::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(SiteImage::class)->orderBy('sort_order');
    }

    public function events(): HasMany
    {
        return $this->hasMany(SiteEvent::class);
    }

    public function timeline(): HasMany
    {
        return $this->hasMany(SiteTimeline::class)->orderBy('sort_order');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(SiteRevision::class)->latest();
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(SiteVerification::class)->latest();
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(SiteContribution::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(ContentReport::class, 'reportable_id')
            ->where('reportable_type', self::class);
    }

    public function relations(): HasMany
    {
        return $this->hasMany(SiteRelation::class);
    }

    public function museumProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(MuseumProfile::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
