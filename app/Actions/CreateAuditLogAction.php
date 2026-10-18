<?php

namespace App\Actions;

use App\Models\AuditLog;

class CreateAuditLogAction
{
    /**
     * Executes append-only immutable audit logging.
     */
    public function execute(
        string $action,
        string $entityType,
        string $entityId,
        string $performedBy,
        string $details,
        ?string $ipAddress = null,
        ?int $performedById = null
    ): void {
        $numericId = ctype_digit($entityId) ? (int) $entityId : null;

        AuditLog::create([
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $numericId,
            'entity_identifier' => $numericId === null ? mb_substr($entityId, 0, 255) : null,
            'user_id' => $performedById ?? request()->user()?->getAuthIdentifier() ?? auth('sanctum')->id() ?? auth()->id(),
            'actor_name' => $performedBy,
            'ip_hash' => $ipAddress ? hash('sha256', $ipAddress) : null,
            'user_agent' => request()->userAgent() ? mb_substr(request()->userAgent(), 0, 255) : null,
            'details' => $details,
            'created_at' => now(),
        ]);
    }
}
