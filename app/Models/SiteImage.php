<?php

namespace App\Models;

use App\Enums\ImageRole;
use App\Enums\RightsStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

/** @method static Builder<SiteImage> publiclyUsable() */
class SiteImage extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    protected $hidden = [
        'original_storage_path',
        'download_storage_path',
    ];

    protected $appends = ['web_url', 'thumbnail_url'];

    protected $casts = [
        'rights_status' => RightsStatus::class,
        'image_role' => ImageRole::class,
        'sort_order' => 'integer',
        'featured' => 'boolean',
        'visibility' => 'boolean',
        'ai_assisted' => 'boolean',
        'rights_reviewed_at' => 'datetime',
    ];

    /** @return BelongsTo<Site, $this> */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function hashes(): HasMany
    {
        return $this->hasMany(MediaHash::class);
    }

    public function sources(): BelongsToMany
    {
        return $this->belongsToMany(Source::class, 'image_sources')
            ->withPivot(['page_reference', 'excerpt', 'editor_note'])
            ->withTimestamps();
    }

    public function downloadLogs(): HasMany
    {
        return $this->hasMany(DownloadLog::class);
    }

    /**
     * @param Builder<SiteImage> $query
     * @return Builder<SiteImage>
     */
    public function scopePubliclyUsable(Builder $query): Builder
    {
        return $query->where('visibility', true)
            ->whereNotNull('web_storage_path')
            ->whereNotNull('source_url')
            ->whereNotNull('rights_reviewed_by')
            ->whereNotNull('rights_reviewed_at')
            ->where(function (Builder $rights): void {
                $rights->where('rights_status', RightsStatus::PUBLIC_DOMAIN->value)
                    ->orWhere(function (Builder $creativeCommons): void {
                        $creativeCommons->where('rights_status', RightsStatus::CREATIVE_COMMONS->value)
                            ->whereNotNull('license')
                            ->whereRaw("TRIM(license) <> ''");
                    })
                    ->orWhere(function (Builder $permitted): void {
                        $permitted->where('rights_status', RightsStatus::COPYRIGHTED_PERMITTED->value)
                            ->whereNotNull('license')
                            ->whereRaw("TRIM(license) <> ''")
                            ->whereNotNull('permission_details')
                            ->whereRaw("TRIM(permission_details) <> ''");
                    });
            })
            ->where(function (Builder $attribution): void {
                $attribution->whereNotNull('photographer')->whereRaw("TRIM(photographer) <> ''")
                    ->orWhere(fn (Builder $credit): Builder => $credit
                        ->whereNotNull('credit_line')->whereRaw("TRIM(credit_line) <> ''"));
            });
    }

    public function hasClearedRightsForPublic(): bool
    {
        $status = $this->rights_status->value;

        return $this->visibility
            && filled($this->source_url)
            && $this->rights_reviewed_by !== null
            && $this->rights_reviewed_at !== null
            && (filled($this->photographer) || filled($this->credit_line))
            && match ($status) {
                RightsStatus::PUBLIC_DOMAIN->value => true,
                RightsStatus::CREATIVE_COMMONS->value => filled($this->license),
                RightsStatus::COPYRIGHTED_PERMITTED->value => filled($this->license) && filled($this->permission_details),
                default => false,
            };
    }

    public function hasPublicRightsApproval(): bool
    {
        return filled($this->web_storage_path) && $this->hasClearedRightsForPublic();
    }

    public function getWebUrlAttribute(): ?string
    {
        if (!$this->web_storage_path) {
            return null;
        }

        try {
            return Storage::disk('derivatives')->url($this->web_storage_path);
        } catch (\Throwable) {
            return null;
        }
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if (!$this->thumb_storage_path) {
            return null;
        }

        try {
            return Storage::disk('derivatives')->url($this->thumb_storage_path);
        } catch (\Throwable) {
            return null;
        }
    }
}
