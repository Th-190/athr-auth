<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class SiteSource extends Pivot
{
    protected $table = 'site_sources';

    protected $guarded = ['id'];
}
