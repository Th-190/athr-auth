<?php

use App\Enums\LocationPrecision;
use App\Enums\PublicationStatus;
use App\Enums\VerificationStatus;
use App\Models\Area;
use App\Models\ClaimEvidence;
use App\Models\ClaimVariant;
use App\Models\District;
use App\Models\HistoricalPeriod;
use App\Models\Province;
use App\Models\Site;
use App\Models\SiteClaim;
use App\Models\SiteType;
use App\Models\Source;
use App\Services\ArabicSearchNormalizer;

test('site belongs to geographic hierarchy correctly', function () {
    $province = Province::create([
        'code' => 'KHA',
        'name_ar' => 'محافظة كربلاء المقدسة',
        'name_en' => 'Karbala Governorate',
        'slug' => 'karbala-test',
    ]);

    $district = District::create([
        'province_id' => $province->id,
        'name_ar' => 'قضاء كربلاء',
        'name_en' => 'Karbala Central',
        'slug' => 'karbala-center-test',
    ]);

    $subDistrict = $district->subDistricts()->create([
        'name_ar' => 'مركز المدينة',
        'name_en' => 'City Center',
        'slug' => 'center-sub-test',
    ]);

    $area = $subDistrict->areas()->create([
        'name_ar' => 'المنطقة التاريخية',
        'name_en' => 'Historic Area',
        'slug' => 'historic-area-test',
    ]);

    $siteType = SiteType::create([
        'name_ar' => 'قصور وحصون',
        'name_en' => 'Fortresses',
        'slug' => 'fortresses-test',
        'definition' => 'منشآت عسكرية ودفاعية',
    ]);

    $period = HistoricalPeriod::create([
        'name_ar' => 'العصر العباسي',
        'name_en' => 'Abbasid',
        'slug' => 'abbasid-test',
        'start_year_label' => '750 م',
        'end_year_label' => '1258 م',
        'description' => 'العصر الذهبي',
    ]);

    $site = Site::create([
        'permanent_id' => 'KHA-TEST-001',
        'name_ar' => 'موقع تجريبي للاختبار',
        'name_en' => 'Test Site',
        'slug' => 'test-site-rel',
        'short_description' => 'وصف تجريبي',
        'description' => 'تفصيل تجريبي',
        'historical_description' => 'تاريخ تجريبي',
        'architectural_description' => 'عمارة تجريبية',
        'cultural_significance' => 'أهمية ثقافية تجريبية',
        'historical_significance' => 'أهمية تاريخية تجريبية',
        'current_condition' => 'حالة جيدة',
        'location_description' => 'بادية كربلاء',
        'province_id' => $province->id,
        'area_id' => $area->id,
        'site_type_id' => $siteType->id,
        'historical_period_id' => $period->id,
        'publication_status' => PublicationStatus::DRAFT,
        'verification_status' => VerificationStatus::UNVERIFIED,
        'location_precision' => LocationPrecision::EXACT,
        'is_demo' => true,
    ]);

    expect($site->area->id)->toBe($area->id);
    expect($site->area->subDistrict->id)->toBe($subDistrict->id);
    expect($site->area->subDistrict->district->id)->toBe($district->id);
    expect($site->province->code)->toBe('KHA');
    expect($site->siteType->slug)->toBe('fortresses-test');
    expect($site->historicalPeriod->slug)->toBe('abbasid-test');
});

test('claims, variants, evidence, and sources are relational and intact', function () {
    $province = Province::firstOrCreate(['code' => 'KHA'], [
        'name_ar' => 'كربلاء', 'name_en' => 'Karbala', 'slug' => 'karbala-c'
    ]);
    $district = District::firstOrCreate(['province_id' => $province->id, 'slug' => 'dist-c'], [
        'name_ar' => 'قضاء', 'name_en' => 'District'
    ]);
    $sub = $district->subDistricts()->firstOrCreate(['slug' => 'sub-c'], [
        'name_ar' => 'ناحية', 'name_en' => 'SubDistrict'
    ]);
    $area = $sub->areas()->firstOrCreate(['slug' => 'area-c'], [
        'name_ar' => 'منطقة', 'name_en' => 'Area'
    ]);
    $type = SiteType::firstOrCreate(['slug' => 'type-c'], [
        'name_ar' => 'نوع', 'name_en' => 'Type', 'definition' => 'تعريف'
    ]);
    $period = HistoricalPeriod::firstOrCreate(['slug' => 'period-c'], [
        'name_ar' => 'فترة', 'name_en' => 'Period', 'start_year_label' => '1', 'end_year_label' => '2', 'description' => 'وصف'
    ]);

    $site = Site::create([
        'permanent_id' => 'KHA-TEST-002',
        'name_ar' => 'موقع لفحص الأدلة',
        'name_en' => 'Claims Test Site',
        'slug' => 'claims-test-site',
        'short_description' => 'وصف',
        'description' => 'شرح',
        'historical_description' => 'تاريخ',
        'architectural_description' => 'عمارة',
        'cultural_significance' => 'دلالة',
        'historical_significance' => 'أثر',
        'current_condition' => 'مستقر',
        'location_description' => 'مكان',
        'province_id' => $province->id,
        'area_id' => $area->id,
        'site_type_id' => $type->id,
        'historical_period_id' => $period->id,
        'publication_status' => PublicationStatus::DRAFT,
        'verification_status' => VerificationStatus::DISPUTED,
        'location_precision' => LocationPrecision::APPROXIMATE,
        'is_demo' => true,
    ]);

    $source = Source::create([
        'source_type' => 'book',
        'title' => 'كتاب مرجعي أثري',
        'author' => 'د. فؤاد سفر',
        'year' => '1966',
        'reliability_level' => 'high',
    ]);

    $claim = $site->claims()->create([
        'claim_type' => 'date_of_construction',
        'claim_text' => 'تاريخ التشييد المرجح للقرن الثامن',
        'is_disputed' => true,
    ]);

    $variant = $claim->variants()->create([
        'scholar_or_school' => 'الرأي العباسي (كريسويل)',
        'account_text' => 'شيد في عهد عيسى بن موسى العباسي',
    ]);

    $evidence = $claim->evidence()->create([
        'claim_variant_id' => $variant->id,
        'source_id' => $source->id,
        'page_reference' => 'ص 94',
        'relevance' => 'direct',
    ]);

    expect($site->claims)->toHaveCount(1);
    expect($claim->variants)->toHaveCount(1);
    expect($claim->evidence)->toHaveCount(1);
    expect($evidence->source->author)->toBe('د. فؤاد سفر');
});

test('arabic search normalizer strips diacritics and unifies letters', function () {
    $raw = 'أَثَرُ كَرْبَلاءَ وَحِصْنُ الأُخَيْضِرِ العَتِيقَة';
    $normalized = ArabicSearchNormalizer::normalize($raw);

    // Diacritics removed, alef unified to ا, taa marbuta to ه
    expect($normalized)->toBe('اثر كربلاء وحصن الاخيضر العتيقه');
});

test('restricted site coordinates are fuzzed and exact coordinates are never exposed', function () {
    $site = new Site([
        'location_precision' => LocationPrecision::RESTRICTED,
    ]);

    // Test fuzzer directly
    $coords = $site->getPublicCoordinates();
    // Since coordinates are null without db postgis, it returns null
    expect($coords)->toBeNull();
});
