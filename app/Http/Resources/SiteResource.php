<?php

namespace App\Http\Resources;

use App\Enums\LocationPrecision;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Site
 */
class SiteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        /** @var Site $site */
        $site   = $this->resource;
        $coords = $site->getPublicCoordinates();

        $precisionVal = $site->location_precision instanceof \BackedEnum
            ? $site->location_precision->value
            : (string) $site->location_precision;

        $isRestricted = $precisionVal === 'restricted';

        $data = [
            'id'                  => $site->id,
            'slug'                => $site->slug,
            'inventory_number'    => $site->inventory_number,
            'name_ar'             => $site->name_ar,
            'name_en'             => $site->name_en,
            'summary_ar'          => $site->summary_ar,
            'description_ar'      => $site->description_ar,
            'description_en'      => $site->description_en,
            'historical_description' => $site->historical_description,
            'historical_description_en' => $site->historical_description_en,
            'architectural_description' => $site->architectural_description,
            'architectural_description_en' => $site->architectural_description_en,
            'cultural_significance' => $site->cultural_significance,
            'historical_significance' => $site->historical_significance,
            'current_condition' => $site->current_condition,
            'current_condition_en' => $site->current_condition_en,
            'location_description' => $site->location_description,
            'location_description_en' => $site->location_description_en,
            'approximate_date' => $site->approximate_date,
            'heritage_designation' => $site->heritage_designation,
            'heritage_designation_url' => $site->heritage_designation_url,
            'designation_year' => $site->designation_year,
            'site_type_id'        => $site->site_type_id,
            'historical_period_id'=> $site->historical_period_id,
            'province_id'         => $site->province_id,
            'area_id'             => $site->area_id,
            'publication_status'  => $site->publication_status instanceof \BackedEnum ? $site->publication_status->value : (string) $site->publication_status,
            'verification_status' => $site->verification_status instanceof \BackedEnum ? $site->verification_status->value : (string) $site->verification_status,
            'location_precision'  => $precisionVal,
            'is_restricted'       => $isRestricted,
            'coordinates'         => $coords,
            'featured'            => (bool) $site->featured,
            'is_demo'             => (bool) $site->is_demo,
            'ai_assisted'         => (bool) $site->ai_assisted,
            'view_count'          => (int) $site->view_count,
            'verified_at'         => $site->verified_at?->toIso8601String(),
            'published_at'        => $site->published_at?->toIso8601String(),
            'created_at'          => $site->created_at?->toIso8601String(),
            'updated_at'          => $site->updated_at?->toIso8601String(),
        ];

        // Conditional relations if loaded
        if ($site->relationLoaded('siteType')) {
            $data['site_type'] = $site->siteType?->only(['id', 'name_ar', 'name_en', 'slug']);
        }
        if ($site->relationLoaded('historicalPeriod')) {
            $data['historical_period'] = $site->historicalPeriod?->only(['id', 'name_ar', 'name_en', 'slug']);
        }
        if ($site->relationLoaded('province')) {
            $data['province'] = $site->province?->only(['id', 'name_ar', 'name_en', 'code', 'slug']);
        }
        if ($site->relationLoaded('area')) {
            $data['area'] = $site->area?->only(['id', 'name_ar', 'name_en', 'slug']);
            if ($site->area?->relationLoaded('subDistrict') && $site->area->subDistrict?->relationLoaded('district')) {
                $data['district'] = $site->area->subDistrict->district?->only(['id', 'name_ar', 'name_en', 'slug']);
            }
        }
        if ($site->relationLoaded('images')) {
            $data['images']        = $site->images;
            $data['thumbnail_url'] = $site->images->first()?->thumbnail_url;
        }
        if ($site->relationLoaded('claims')) {
            $data['claims'] = $site->claims;
        }
        if ($site->relationLoaded('names')) {
            $data['names'] = $site->names;
        }
        if ($site->relationLoaded('sources')) {
            $data['sources'] = $site->sources;
        }
        if ($site->relationLoaded('museumProfile')) {
            $data['museum_profile'] = $site->museumProfile;
        }
        if ($site->relationLoaded('events')) {
            $data['events'] = $site->events;
        }
        if ($site->relationLoaded('timeline')) {
            $data['timeline'] = $site->timeline;
        }
        if ($site->relationLoaded('relations')) {
            $data['relations'] = $site->relations;
        }

        return $data;
    }

    /**
     * Export as standard RFC 7946 GeoJSON Feature
     */
    public function toGeoJsonFeature(): ?array
    {
        /** @var Site $site */
        $site   = $this->resource;
        $coords = $site->getPublicCoordinates();

        if (!$coords) {
            return null;
        }

        return [
            'type'       => 'Feature',
            'geometry'   => [
                'type'        => 'Point',
                'coordinates' => [(float) $coords['longitude'], (float) $coords['latitude']],
            ],
            'properties' => [
                'id'                 => $site->id,
                'slug'               => $site->slug,
                'inventory_number'   => $site->inventory_number,
                'name_ar'            => $site->name_ar,
                'name_en'            => $site->name_en,
                'summary_ar'         => $site->summary_ar,
                'location_precision' => $site->location_precision instanceof \BackedEnum ? $site->location_precision->value : (string) $site->location_precision,
                'precision_label'    => $coords['precision_label'] ?? '',
                'is_fuzzed'          => (bool) ($coords['is_fuzzed'] ?? false),
            ],
        ];
    }

    /**
     * Export as Schema.org JSON-LD structured data
     */
    public function toJsonLd(): array
    {
        /** @var Site $site */
        $site   = $this->resource;
        $coords = $site->getPublicCoordinates();

        $jsonLd = [
            '@context'     => 'https://schema.org',
            '@type'        => 'Place',
            'name'         => $site->name_ar,
            'alternateName'=> $site->name_en,
            'description'  => $site->summary_ar,
            'identifier'   => $site->inventory_number,
            'url'          => url("/sites/{$site->slug}"),
        ];

        if ($coords) {
            $jsonLd['geo'] = [
                '@type'    => 'GeoCoordinates',
                'latitude' => $coords['latitude'],
                'longitude'=> $coords['longitude'],
            ];
            if (!empty($coords['is_fuzzed'])) {
                $jsonLd['geo']['description'] = $coords['precision_label'];
            }
        }

        return $jsonLd;
    }

    /**
     * Export sanitized HTML data attributes for DOM rendering
     */
    public function toHtmlDataAttributes(): string
    {
        /** @var Site $site */
        $site   = $this->resource;
        $coords = $site->getPublicCoordinates();

        $attrs = [
            'data-site-id'  => htmlspecialchars((string) $site->id, ENT_QUOTES),
            'data-slug'     => htmlspecialchars((string) $site->slug, ENT_QUOTES),
            'data-precision'=> htmlspecialchars((string) ($site->location_precision instanceof \BackedEnum ? $site->location_precision->value : $site->location_precision), ENT_QUOTES),
        ];

        if ($coords) {
            $attrs['data-latitude']  = (string) $coords['latitude'];
            $attrs['data-longitude'] = (string) $coords['longitude'];
            $attrs['data-fuzzed']    = $coords['is_fuzzed'] ? 'true' : 'false';
        }

        return implode(' ', array_map(fn ($k, $v) => "{$k}=\"{$v}\"", array_keys($attrs), $attrs));
    }
}
