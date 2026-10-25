<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Enums\PublicationStatus;
use App\Enums\VerificationStatus;
use App\Models\HistoricalPeriod;
use App\Models\MuseumArtifact;
use App\Models\MuseumArtifactRevision;
use App\Models\MuseumProfile;
use App\Models\Site;
use App\Models\SiteRevision;
use App\Models\SiteType;
use App\Models\Source;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class HeritageEditorialController extends Controller
{
    public function __construct(private readonly CreateAuditLogAction $auditLogAction) {}

    public function filters(): JsonResponse
    {
        Gate::authorize('editorialViewAny', Site::class);

        return response()->json([
            'museums' => Site::query()->whereHas('siteType', fn (Builder $query) => $query->where('slug', 'museums'))
                ->orderBy('name_ar')->get(['id', 'name_ar', 'name_en']),
            'sites' => Site::query()->orderBy('name_ar')->get(['id', 'name_ar', 'name_en']),
            'periods' => HistoricalPeriod::query()->orderBy('sort_order')->get(['id', 'name_ar', 'name_en']),
            'categories' => SiteType::query()->orderBy('name_ar')->get(['id', 'name_ar', 'name_en', 'slug']),
            'artifact_categories' => MuseumArtifact::query()->whereNotNull('category')->distinct()->orderBy('category')->pluck('category')->values()->map(fn (string $category, int $index) => ['id' => $category, 'name_ar' => $category]),
            'sources' => Source::query()->orderBy('title')->get(['id', 'title', 'author', 'publisher', 'year', 'url', 'isbn', 'archive_reference', 'page_reference']),
            'statuses' => [
                'publication' => array_column(PublicationStatus::cases(), 'value'),
                'verification' => array_column(VerificationStatus::cases(), 'value'),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('editorialViewAny', Site::class);

        $filters = $request->validate([
            'kind' => ['sometimes', Rule::in(['sites', 'artifacts'])],
            'q' => ['nullable', 'string', 'max:200'],
            'museum_id' => ['nullable', 'integer', 'exists:sites,id'],
            'site_id' => ['nullable', 'integer', 'exists:sites,id'],
            'category' => ['nullable', 'string', 'max:100'],
            'historical_period_id' => ['nullable', 'integer', 'exists:historical_periods,id'],
            'status' => ['nullable', 'string', 'max:40'],
            'per_page' => ['nullable', 'integer', 'between:1,50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = $filters['per_page'] ?? 20;
        $kind = $filters['kind'] ?? 'sites';

        if ($kind === 'artifacts') {
            $query = MuseumArtifact::query()->with([
                'museumProfile.site:id,name_ar,name_en,slug,site_type_id,historical_period_id',
                'museumProfile.site.siteType:id,name_ar,name_en,slug',
                'museumProfile.site.historicalPeriod:id,name_ar,name_en,slug',
                'source', 'sources', 'revisions.user',
            ]);
            if (!empty($filters['museum_id'])) {
                $query->whereHas('museumProfile', fn (Builder $builder) => $builder->where('site_id', $filters['museum_id']));
            }
            if (!empty($filters['site_id'])) {
                $query->whereHas('museumProfile.site', fn (Builder $builder) => $builder->where('id', $filters['site_id']));
            }
            if (!empty($filters['category'])) {
                $query->where('category', $filters['category']);
            }
            if (!empty($filters['historical_period_id'])) {
                $query->whereHas('museumProfile.site', fn (Builder $builder) => $builder->where('historical_period_id', $filters['historical_period_id']));
            }
            if (!empty($filters['status'])) {
                $query->where(fn (Builder $builder) => $builder
                    ->where('publication_status', $filters['status'])
                    ->orWhere('verification_status', $filters['status']));
            }
            if (!empty($filters['q'])) {
                $like = '%'.$filters['q'].'%';
                $query->where(fn (Builder $builder) => $builder
                    ->where('title_ar', 'like', $like)
                    ->orWhere('title_en', 'like', $like)
                    ->orWhere('category', 'like', $like));
            }

            return response()->json($query->orderBy('id')->paginate($perPage));
        }

        $query = Site::query()->with([
            'siteType', 'historicalPeriod', 'province', 'area.subDistrict.district', 'names', 'sources',
            'images' => fn ($builder) => $builder->orderBy('sort_order'),
            'revisions.user', 'verifications.verifier',
        ]);
        if (!empty($filters['site_id'])) {
            $query->whereKey($filters['site_id']);
        }
        if (!empty($filters['category'])) {
            $query->whereHas('siteType', fn (Builder $builder) => $builder->where(function (Builder $category) use ($filters): void {
                $category->where('id', $filters['category'])->orWhere('slug', $filters['category']);
            }));
        }
        if (!empty($filters['historical_period_id'])) {
            $query->where('historical_period_id', $filters['historical_period_id']);
        }
        if (!empty($filters['museum_id'])) {
            $query->whereHas('relations', fn (Builder $builder) => $builder->where('related_site_id', $filters['museum_id']));
        }
        if (!empty($filters['status'])) {
            $query->where(fn (Builder $builder) => $builder
                ->where('publication_status', $filters['status'])
                ->orWhere('verification_status', $filters['status']));
        }
        if (!empty($filters['q'])) {
            $like = '%'.$filters['q'].'%';
            $query->where(fn (Builder $builder) => $builder
                ->where('name_ar', 'like', $like)
                ->orWhere('name_en', 'like', $like)
                ->orWhere('permanent_id', 'like', $like)
                ->orWhereHas('names', fn (Builder $names) => $names->where('name', 'like', $like)));
        }

        $sites = $query->orderBy('id')->paginate($perPage);
        // A raw PostGIS geography value is not an API field. Keeping it out of
        // model serialization also avoids binary/driver-specific JSON failures.
        $sites->getCollection()->each(fn (Site $site) => $site->makeHidden(['coordinates']));

        return response()->json($sites);
    }

    public function updateSite(Request $request, Site $site): JsonResponse
    {
        Gate::authorize('update', $site);
        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'short_description' => ['required', 'string', 'max:1000'],
            'description' => ['required', 'string'],
            'description_en' => ['nullable', 'string'],
            'historical_description' => ['nullable', 'string'],
            'historical_description_en' => ['nullable', 'string'],
            'architectural_description' => ['nullable', 'string'],
            'architectural_description_en' => ['nullable', 'string'],
            'current_condition' => ['nullable', 'string'],
            'current_condition_en' => ['nullable', 'string'],
            'location_description' => ['nullable', 'string'],
            'location_description_en' => ['nullable', 'string'],
            'approximate_date' => ['nullable', 'string', 'max:500'],
            'heritage_designation' => ['nullable', 'string', 'max:255'],
            'heritage_designation_url' => ['nullable', 'url', 'max:2000'],
            'designation_year' => ['nullable', 'integer', 'between:1,2200'],
            'location_precision' => ['required', 'in:exact,approximate,restricted,unknown'],
            'citations' => ['required', 'array', 'min:1'],
            'citations.*.source_id' => ['required', 'integer', 'distinct', 'exists:sources,id'],
            'citations.*.page_reference' => ['nullable', 'string', 'max:255'],
            'citations.*.excerpt' => ['nullable', 'string', 'max:2000'],
            'citations.*.editor_note' => ['nullable', 'string', 'max:2000'],
            'citations.*.relevance' => ['nullable', 'in:direct,contextual,comparative'],
            'revision_notes' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        DB::transaction(function () use ($site, $data, $request): void {
            $oldCitationIds = $site->sources()->pluck('sources.id')->map(fn ($id) => (int) $id)->all();
            $citations = $data['citations'];
            $reason = $data['revision_notes'];
            unset($data['citations'], $data['revision_notes']);
            $this->recordSiteChanges($site, $data, $reason, $request);
            $citationSync = [];
            foreach ($citations as $citation) {
                $sourceId = $citation['source_id'];
                unset($citation['source_id']);
                $citationSync[$sourceId] = $citation;
            }
            $site->sources()->sync($citationSync);
            $newCitationIds = array_map('intval', array_keys($citationSync));
            sort($oldCitationIds);
            sort($newCitationIds);
            if ($oldCitationIds !== $newCitationIds) {
                SiteRevision::create([
                    'site_id' => $site->id,
                    'field_name' => 'citations',
                    'old_value' => json_encode($oldCitationIds),
                    'new_value' => json_encode($newCitationIds),
                    'changed_by' => $request->user()->id,
                    'reason' => $reason,
                    'verification_status_at_time' => $site->verification_status->value,
                ]);
            }
            $site->updated_by = $request->user()->id;
            $site->save();
            $this->auditLogAction->execute('site.editorial_updated', Site::class, (string) $site->id, $request->user()->name, $reason, $request->ip(), $request->user()->id);
        });

        return response()->json(['message' => 'تم حفظ التعديلات وسجل المراجعة.', 'record' => $site->fresh(['sources', 'siteType', 'historicalPeriod'])]);
    }

    public function updateArtifact(Request $request, MuseumArtifact $artifact): JsonResponse
    {
        Gate::authorize('update', $artifact);
        $data = $request->validate([
            'title_ar' => ['required', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'description_en' => ['nullable', 'string'],
            'category' => ['required', 'string', 'max:150'],
            'material' => ['nullable', 'string', 'max:255'],
            'estimated_date' => ['nullable', 'string', 'max:255'],
            'origin' => ['nullable', 'string', 'max:255'],
            'archaeological_context' => ['nullable', 'string'],
            'citations' => ['required', 'array', 'min:1'],
            'citations.*.source_id' => ['required', 'integer', 'distinct', 'exists:sources,id'],
            'citations.*.page_reference' => ['nullable', 'string', 'max:255'],
            'citations.*.excerpt' => ['nullable', 'string', 'max:2000'],
            'citations.*.editor_note' => ['nullable', 'string', 'max:2000'],
            'citations.*.relevance' => ['nullable', 'in:direct,contextual,comparative'],
            'revision_notes' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        DB::transaction(function () use ($artifact, $data, $request): void {
            $oldSourceIds = $artifact->sources()->pluck('sources.id')->map(fn ($id) => (int) $id)->all();
            $citations = $data['citations'];
            $reason = $data['revision_notes'];
            unset($data['citations'], $data['revision_notes']);
            foreach ($data as $field => $value) {
                $old = $artifact->getAttribute($field);
                if ($old instanceof \BackedEnum) {
                    $old = $old->value;
                }
                if ($old === $value) {
                    continue;
                }
                MuseumArtifactRevision::create([
                    'museum_artifact_id' => $artifact->id,
                    'field_name' => $field,
                    'old_value' => is_scalar($old) ? (string) $old : null,
                    'new_value' => is_scalar($value) ? (string) $value : null,
                    'changed_by' => $request->user()->id,
                    'reason' => $reason,
                    'verification_status_at_time' => $artifact->verification_status,
                ]);
            }
            $artifact->fill($data);
            $citationSync = [];
            $sourceIds = [];
            foreach ($citations as $citation) {
                $sourceIds[] = $citation['source_id'];
                $sourceId = $citation['source_id'];
                unset($citation['source_id']);
                $citationSync[$sourceId] = $citation;
            }
            $artifact->sources()->sync($citationSync);
            $artifact->source_id = $sourceIds[0] ?? null;
            $substantiveFields = ['title_ar', 'title_en', 'description', 'description_en', 'category', 'material', 'estimated_date', 'origin', 'archaeological_context'];
            $substantiveChange = collect($substantiveFields)->contains(fn (string $field) => $artifact->isDirty($field));
            if ($substantiveChange && $artifact->verification_status === VerificationStatus::VERIFIED->value) {
                $artifact->verification_status = VerificationStatus::UNVERIFIED->value;
                MuseumArtifactRevision::create([
                    'museum_artifact_id' => $artifact->id,
                    'field_name' => 'verification_status',
                    'old_value' => VerificationStatus::VERIFIED->value,
                    'new_value' => VerificationStatus::UNVERIFIED->value,
                    'changed_by' => $request->user()->id,
                    'reason' => $reason,
                    'verification_status_at_time' => VerificationStatus::VERIFIED->value,
                ]);
            }
            $artifact->save();
            $this->auditLogAction->execute('museum_artifact.editorial_updated', MuseumArtifact::class, (string) $artifact->id, $request->user()->name, $reason, $request->ip(), $request->user()->id);
            sort($oldSourceIds);
            sort($sourceIds);
            if ($oldSourceIds !== $sourceIds) MuseumArtifactRevision::create([
                'museum_artifact_id' => $artifact->id,
                'field_name' => 'citations',
                'old_value' => json_encode($oldSourceIds),
                'new_value' => json_encode($sourceIds),
                'changed_by' => $request->user()->id,
                'reason' => $reason,
                'verification_status_at_time' => $artifact->verification_status,
            ]);
        });

        return response()->json(['message' => 'تم حفظ تعديلات المقتنى وسجل المراجعة.', 'record' => $artifact->fresh(['source', 'sources', 'museumProfile.site'])]);
    }

    public function decide(Request $request, string $kind, int $id): JsonResponse
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['approve', 'reject', 'return', 'publish', 'unpublish', 'archive'])],
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);
        $isArtifact = $kind === 'artifacts';
        abort_unless(in_array($kind, ['sites', 'artifacts'], true), 404);
        $record = $isArtifact ? MuseumArtifact::with(['museumProfile.site', 'sources', 'source'])->findOrFail($id) : Site::with('sources')->findOrFail($id);
        Gate::authorize('review', $record);
        if ($data['action'] === 'publish') {
            Gate::authorize('publish', $record);
            $this->assertPublishable($record, $isArtifact);
        }

        DB::transaction(function () use ($record, $data, $request, $isArtifact): void {
            $action = (string) $data['action'];
            $reason = $data['reason'];
            $previous = $isArtifact ? $record->publication_status : $record->publication_status->value;

            match ($action) {
                'approve' => $this->approve($record, $isArtifact, $reason, $request),
                'reject' => $this->setDecisionState($record, $isArtifact, PublicationStatus::ARCHIVED, VerificationStatus::DISPUTED, 'rejected', $reason, $request),
                'return' => $this->setDecisionState($record, $isArtifact, PublicationStatus::DRAFT, VerificationStatus::UNVERIFIED, 'returned_for_correction', $reason, $request),
                'publish' => $this->setDecisionState($record, $isArtifact, PublicationStatus::PUBLISHED, null, 'published', $reason, $request),
                'unpublish' => $this->setDecisionState($record, $isArtifact, PublicationStatus::PENDING_REVIEW, null, 'unpublished', $reason, $request),
                'archive' => $this->setDecisionState($record, $isArtifact, PublicationStatus::ARCHIVED, null, 'archived', $reason, $request),
                default => throw new \LogicException('Unsupported editorial decision.'),
            };

            $newPublicationStatus = $record->publication_status instanceof \BackedEnum
                ? $record->publication_status->value
                : (string) $record->publication_status;
            $this->auditLogAction->execute(
                ($isArtifact ? 'museum_artifact.' : 'site.').$action,
                $isArtifact ? MuseumArtifact::class : Site::class,
                (string) $record->id,
                $request->user()->name,
                "{$reason}; previous={$previous}; new={$newPublicationStatus}",
                $request->ip(),
                $request->user()->id,
            );
        });

        return response()->json(['message' => 'تم تسجيل القرار التحريري.', 'record' => $record->fresh()]);
    }

    /** @param array<string, mixed> $data */
    private function recordSiteChanges(Site $site, array $data, string $reason, Request $request): void
    {
        $map = ['short_description' => 'short_description'];
        foreach ($data as $field => $newValue) {
            $old = $site->getAttribute($map[$field] ?? $field);
            if ($old instanceof \BackedEnum) {
                $old = $old->value;
            }
            if ($old === $newValue) {
                continue;
            }
            SiteRevision::create([
                'site_id' => $site->id,
                'field_name' => $field,
                'old_value' => is_scalar($old) ? (string) $old : null,
                'new_value' => is_scalar($newValue) ? (string) $newValue : null,
                'changed_by' => $request->user()->id,
                'reason' => $reason,
                'verification_status_at_time' => $site->verification_status->value,
            ]);
        }
        $site->fill($data);
        if (array_intersect(array_keys($data), ['name_ar', 'name_en', 'short_description', 'description', 'description_en', 'historical_description', 'architectural_description'])) {
            $site->verification_status = VerificationStatus::UNVERIFIED;
            $site->verified_at = null;
            $site->verified_by = null;
        }
    }

    private function approve(Site|MuseumArtifact $record, bool $isArtifact, string $reason, Request $request): void
    {
        $previous = $record->verification_status instanceof \BackedEnum
            ? $record->verification_status->value
            : (string) $record->verification_status;
        $record->verification_status = $isArtifact ? VerificationStatus::VERIFIED->value : VerificationStatus::VERIFIED;
        if (!$isArtifact) {
            $record->verified_by = $request->user()->id;
            $record->verified_at = now();
            $record->last_reviewed_at = now();
            $record->verification_notes = $reason;
            $record->save();
            $record->verifications()->create([
                'previous_status' => $previous,
                'new_status' => VerificationStatus::VERIFIED->value,
                'decision_reason' => $reason,
                'verified_by' => $request->user()->id,
            ]);
            return;
        }
        $record->save();
        MuseumArtifactRevision::create([
            'museum_artifact_id' => $record->id,
            'field_name' => 'verification_status',
            'old_value' => $previous,
            'new_value' => VerificationStatus::VERIFIED->value,
            'changed_by' => $request->user()->id,
            'reason' => $reason,
            'verification_status_at_time' => $previous,
        ]);
    }

    private function setDecisionState(Site|MuseumArtifact $record, bool $isArtifact, PublicationStatus $publication, ?VerificationStatus $verification, string $newStatus, string $reason, Request $request): void
    {
        $previousStatus = $record->publication_status instanceof \BackedEnum ? $record->publication_status->value : $record->publication_status;
        $previousVerification = $record->verification_status instanceof \BackedEnum ? $record->verification_status->value : $record->verification_status;
        $record->publication_status = $publication->value;
        if ($verification) {
            $record->verification_status = $verification->value;
        }
        if (!$isArtifact) {
            if ($publication === PublicationStatus::PUBLISHED) {
                $record->published_at = now();
            }
            $record->last_reviewed_at = now();
            $record->verification_notes = $reason;
            $record->save();
            $record->verifications()->create([
                'previous_status' => $previousVerification,
                'new_status' => $newStatus,
                'decision_reason' => $reason,
                'verified_by' => $request->user()->id,
            ]);
            return;
        }
        $record->save();
        MuseumArtifactRevision::create([
            'museum_artifact_id' => $record->id,
            'field_name' => 'editorial_decision',
            'old_value' => $previousStatus.'/'.$previousVerification,
            'new_value' => $newStatus.'/'.($record->verification_status instanceof \BackedEnum ? $record->verification_status->value : $record->verification_status),
            'changed_by' => $request->user()->id,
            'reason' => $reason,
            'verification_status_at_time' => $previousVerification,
        ]);
    }

    private function assertPublishable(Site|MuseumArtifact $record, bool $isArtifact): void
    {
        $verified = $record->verification_status === VerificationStatus::VERIFIED
            || $record->verification_status === VerificationStatus::VERIFIED->value;
        abort_unless($verified, 422, 'يجب اعتماد حالة التحقق قبل النشر.');
        $sources = $isArtifact
            ? $record->sources->merge($record->source ? collect([$record->source]) : collect())
            : $record->sources;
        $hasCitation = $sources->contains(fn (Source $source): bool => filled($source->url) || filled($source->isbn) || filled($source->archive_reference));
        abort_unless($hasCitation, 422, 'يلزم إرفاق مرجع ذي رابط أو رقم فهرسة قبل النشر.');
        if ($isArtifact) {
            $profile = $record->museumProfile;
            $museum = $profile instanceof MuseumProfile ? $profile->site : null;
            abort_unless($museum instanceof Site && $museum->isPubliclyAccessible(), 422, 'يجب نشر سجل المتحف قبل نشر مقتنياته.');
        }
    }
}
