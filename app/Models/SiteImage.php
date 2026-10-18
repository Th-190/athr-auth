<?php

namespace App\Models;

use App\Enums\ImageRole;
use App\Enums\RightsStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

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
    ];

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

    public function getWebUrlAttribute(): ?string
    {
        return $this->web_storage_path
            ? Storage::disk('derivatives')->url($this->web_storage_path)
            : null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumb_storage_path
            ? Storage::disk('derivatives')->url($this->thumb_storage_path)
            : null;
    }
}
