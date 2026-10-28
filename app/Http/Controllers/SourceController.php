<?php

namespace App\Http\Controllers;

use App\Actions\CreateAuditLogAction;
use App\Enums\ReliabilityLevel;
use App\Enums\SourceType;
use App\Models\Source;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SourceController extends Controller
{
    public function __construct(private readonly CreateAuditLogAction $auditLogAction) {}

    public function index(Request $request): JsonResponse
    {
        $query = Source::query()->withCount(['sites', 'images', 'encyclopediaEntries'])->orderBy('title');

        if ($search = trim((string) $request->query('q', ''))) {
            $pattern = '%'.$search.'%';
            $query->where(fn ($builder) => $builder
                ->whereRaw('LOWER(title) LIKE LOWER(?)', [$pattern])
                ->orWhereRaw('LOWER(author) LIKE LOWER(?)', [$pattern])
                ->orWhereRaw('LOWER(publisher) LIKE LOWER(?)', [$pattern]));
        }

        return response()->json($query->paginate(min(max($request->integer('per_page', 100), 1), 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request, true);
        $data['created_by'] = $request->user()?->id;
        $source = DB::transaction(function () use ($data, $request): Source {
            $source = Source::create($data);
            $this->auditLogAction->execute('source.created', Source::class, (string) $source->id, $request->user()?->name ?? 'إدارة الأرشيف', 'إضافة مصدر جديد: '.$source->title, $request->ip(), $request->user()?->id);
            return $source;
        });

        return response()->json(['message' => 'تم حفظ المصدر في قاعدة البيانات.', 'source' => $source->fresh()], 201);
    }

    public function update(Request $request, Source $source): JsonResponse
    {
        $data = $this->validated($request, false);
        $oldTitle = $source->title;
        $data['updated_by'] = $request->user()?->id;
        DB::transaction(function () use ($source, $data, $oldTitle, $request): void {
            $source->update($data);
            $this->auditLogAction->execute('source.updated', Source::class, (string) $source->id, $request->user()?->name ?? 'إدارة الأرشيف', 'تحديث المصدر: '.$oldTitle, $request->ip(), $request->user()?->id);
        });

        return response()->json(['message' => 'تم تحديث المصدر في قاعدة البيانات.', 'source' => $source->fresh()], 200);
    }

    public function destroy(Request $request, Source $source): JsonResponse
    {
        if ($source->sites()->exists() || $source->images()->exists() || $source->encyclopediaEntries()->exists() || $source->claimEvidence()->exists()) {
            return response()->json(['message' => 'لا يمكن حذف مصدر مرتبط بسجلات أو استشهادات. أزل الارتباط أو عطّل المصدر بعد مراجعة المحرر.'], 422);
        }

        $title = $source->title;
        DB::transaction(function () use ($source, $title, $request): void {
            $source->delete();
            $this->auditLogAction->execute('source.deleted', Source::class, (string) $source->id, $request->user()?->name ?? 'إدارة الأرشيف', 'حذف المصدر: '.$title, $request->ip(), $request->user()?->id);
        });

        return response()->json(['message' => 'تم حذف المصدر من قاعدة البيانات.']);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, bool $creating): array
    {
        return $request->validate([
            'source_type' => [$creating ? 'required' : 'sometimes', Rule::enum(SourceType::class)],
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:255'],
            'author' => [$creating ? 'required' : 'sometimes', 'string', 'max:255'],
            'publisher' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'string', 'max:30'],
            'url' => ['nullable', 'url', 'max:2000'],
            'isbn' => ['nullable', 'string', 'max:64'],
            'archive_reference' => ['nullable', 'string', 'max:255'],
            'page_reference' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'excerpt' => ['nullable', 'string'],
            'language' => ['sometimes', 'string', 'max:10'],
            'reliability_level' => [$creating ? 'required' : 'sometimes', Rule::enum(ReliabilityLevel::class)],
            'reliability_notes' => ['nullable', 'string'],
        ]);
    }
}
