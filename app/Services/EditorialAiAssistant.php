<?php

namespace App\Services;

use App\Exceptions\EditorialAiUnavailableException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use JsonException;

class EditorialAiAssistant
{
    /**
     * @param array{record_type: string, title: string, notes?: string|null, sources: list<array{citation_id: string, title: string, reference: string, excerpt: string}>} $input
     * @return array{summary_ar: string, summary_en: string, uncertainty_notes: string, citations_used: list<string>}
     */
    public function assist(array $input): array
    {
        $key = (string) config('services.gemini.api_key', '');
        $settings = $this->settings();
        $model = config('services.gemini.model') ?: $settings['model'];
        if (!is_string($model) || !preg_match('/^[A-Za-z0-9._-]{1,100}$/', $model)) {
            throw new EditorialAiUnavailableException('Editorial AI configuration is invalid.');
        }

        if ($key === '') {
            throw new EditorialAiUnavailableException('Editorial AI is not configured.');
        }

        try {
            $response = Http::acceptJson()
                ->withHeaders(['x-goog-api-key' => $key])
                ->connectTimeout(5)
                ->timeout(35)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                    'system_instruction' => [
                        'parts' => [['text' => $settings['system_instruction']]],
                    ],
                    'contents' => [[
                        'role' => 'user',
                        'parts' => [[
                            'text' => "Prepare a source-bound bilingual editorial summary for this {$input['record_type']} record. Keep facts tied to the citations listed below. If the excerpts do not support a statement, omit it and explain the gap.\n\n".json_encode($input, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
                        ]],
                    ]],
                    'generationConfig' => [
                        'temperature' => $settings['temperature'],
                        'maxOutputTokens' => $settings['max_output_tokens'],
                        'responseMimeType' => 'application/json',
                    ],
                ]);
        } catch (JsonException $exception) {
            throw new EditorialAiUnavailableException('Could not prepare the editorial request.', previous: $exception);
        } catch (\Throwable $exception) {
            Log::warning('Editorial AI request failed before a response was received.', ['exception' => $exception::class]);
            throw new EditorialAiUnavailableException('Editorial AI is temporarily unavailable.', previous: $exception);
        }

        if (!$response->successful()) {
            // Do not log request content, API keys, or provider response bodies.
            Log::warning('Editorial AI provider returned an unsuccessful response.', ['status' => $response->status()]);
            throw new EditorialAiUnavailableException('Editorial AI is temporarily unavailable.');
        }

        $text = $response->json('candidates.0.content.parts.0.text');
        if (!is_string($text) || trim($text) === '') {
            throw new EditorialAiUnavailableException('Editorial AI returned no usable suggestion.');
        }

        try {
            $result = json_decode($text, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new EditorialAiUnavailableException('Editorial AI returned an invalid suggestion.', previous: $exception);
        }

        if (!is_array($result)
            || !is_string($result['summary_ar'] ?? null)
            || !is_string($result['summary_en'] ?? null)
            || !is_string($result['uncertainty_notes'] ?? null)
            || !is_array($result['citations_used'] ?? null)
            || count($result['citations_used']) > 20) {
            throw new EditorialAiUnavailableException('Editorial AI returned an invalid suggestion.');
        }

        $allowedCitations = array_column($input['sources'], 'citation_id');
        $citationsUsed = array_values(array_unique(array_filter(
            $result['citations_used'],
            static fn (mixed $citation): bool => is_string($citation) && in_array($citation, $allowedCitations, true),
        )));

        return [
            'summary_ar' => mb_substr($result['summary_ar'], 0, 4000),
            'summary_en' => mb_substr($result['summary_en'], 0, 4000),
            'uncertainty_notes' => mb_substr($result['uncertainty_notes'], 0, 2000),
            'citations_used' => $citationsUsed,
        ];
    }

    /** @return array{model: string, temperature: float, max_output_tokens: int, system_instruction: string} */
    private function settings(): array
    {
        $path = config_path('ai/editorial-assistant.json');
        $contents = @file_get_contents($path);
        if (!is_string($contents)) {
            throw new EditorialAiUnavailableException('Editorial AI configuration is unavailable.');
        }

        try {
            $settings = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new EditorialAiUnavailableException('Editorial AI configuration is invalid.', previous: $exception);
        }

        if (!is_array($settings)
            || !is_string($settings['model'] ?? null)
            || !preg_match('/^[A-Za-z0-9._-]{1,100}$/', $settings['model'])
            || !is_numeric($settings['temperature'] ?? null)
            || (float) $settings['temperature'] < 0
            || (float) $settings['temperature'] > 1
            || !is_int($settings['max_output_tokens'] ?? null)
            || $settings['max_output_tokens'] < 1
            || $settings['max_output_tokens'] > 4096
            || !is_string($settings['system_instruction'] ?? null)
            || $settings['system_instruction'] === ''
            || mb_strlen($settings['system_instruction']) > 5000) {
            throw new EditorialAiUnavailableException('Editorial AI configuration is invalid.');
        }

        return $settings;
    }
}
