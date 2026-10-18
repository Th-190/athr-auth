<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment('«أثر كربلاء» — صيانة التراث ذاكرة للأجيال');
})->purpose('Display an inspiring quote');
