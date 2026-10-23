<?php

namespace App\Http\Controllers;

use App\Exceptions\EditorialAiUnavailableException;
use App\Services\EditorialAiAssistant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EditorialAiController extends Controller
{
    public function __invoke(Request $request, EditorialAiAssistant $assistant): JsonResponse
    {
        $data = $request->validate([
            'record_type' => ['required', 'string', 'in:site,artifact,encyclopedia'],
            'title' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:4000'],
            'sources' => ['required', 'array', 'min:1', 'max:5'],
            'sources.*.citation_id' => ['required', 'string', 'distinct', 'max:80'],
            'sources.*.title' => ['required', 'string', 'max:255'],
            'sources.*.reference' => ['required', 'string', 'max:1000'],
            'sources.*.excerpt' => ['required', 'string', 'min:20', 'max:5000'],
        ]);

        try {
            $suggestion = $assistant->assist($data);
        } catch (EditorialAiUnavailableException $exception) {
            Log::notice('Editorial AI suggestion was not available.', ['reason' => $exception->getMessage()]);
            return response()->json([
                'message' => __('messages.editorial_ai_unavailable'),
            ], 503);
        }

        return response()->json([
            'data' => $suggestion,
            'ai_assisted' => true,
            'requires_human_review' => true,
            'message' => __('messages.editorial_ai_suggestion'),
        ]);
    }
}
