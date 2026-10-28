<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'action' => ['nullable', 'string', 'max:100'],
            'entity_type' => ['nullable', 'string', 'max:100'],
            'q' => ['nullable', 'string', 'max:200'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if (!empty($filters['action'])) {
            $query->where('action', 'LIKE', '%'.$filters['action'].'%');
        }

        if (!empty($filters['entity_type'])) {
            $query->where('entity_type', 'LIKE', '%'.$filters['entity_type'].'%');
        }

        if (!empty($filters['q'])) {
            $search = $filters['q'];
            $query->where(function ($q) use ($search) {
                $q->where('action', 'LIKE', "%{$search}%")
                  ->orWhere('entity_type', 'LIKE', "%{$search}%")
                  ->orWhere('entity_identifier', 'LIKE', "%{$search}%")
                  ->orWhere('details', 'LIKE', "%{$search}%")
                  ->orWhere('actor_name', 'LIKE', "%{$search}%");
            });
        }

        $logs = $query->paginate($filters['per_page'] ?? 50);

        return response()->json($logs);
    }
}
