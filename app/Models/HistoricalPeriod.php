<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HistoricalPeriod extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'needs_editor_confirmation' => 'boolean',
        'sort_order' => 'integer',
        'start_year_numeric' => 'integer',
        'end_year_numeric' => 'integer',
    ];

    public function sites(): HasMany
    {
        return $this->hasMany(Site::class);
    }
}
