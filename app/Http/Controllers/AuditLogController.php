<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if ($action = $request->input('action')) {
            $query->where('action', 'LIKE', "%{$action}%");
        }

        if ($entityType = $request->input('entity_type')) {
            $query->where('auditable_type', 'LIKE', "%{$entityType}%");
        }

        if ($search = $request->input('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'LIKE', "%{$search}%")
                  ->orWhere('details', 'LIKE', "%{$search}%")
                  ->orWhere('performed_by', 'LIKE', "%{$search}%");
            });
        }

        $logs = $query->paginate(50);

        return response()->json($logs);
    }
}
