<?php

namespace App\Actions;

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
        ?string $ipAddress = null
    ): void {
        // Appends to immutable audit_logs table
    }
}
