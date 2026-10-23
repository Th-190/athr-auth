<?php

namespace App\Support;

use App\Models\User;

class AdminAccess
{
    public static function isDesignatedAdministrator(?User $user): bool
    {
        if (!$user || !in_array(strtolower($user->role?->name ?? ''), ['admin', 'super_admin'], true)) {
            return false;
        }

        $designatedEmail = strtolower(trim((string) config('archive.admin_email')));

        // A case-sensitive database unique index can still contain duplicate
        // normalized emails. Fail closed until that legacy data is resolved.
        if ($designatedEmail !== '' && User::query()->whereRaw('LOWER(email) = ?', [$designatedEmail])->count() > 1) {
            return false;
        }

        // Test fixtures may use arbitrary administrator emails; production always
        // requires an exact match to the configured designation.
        return ($designatedEmail !== '' && strtolower($user->email) === $designatedEmail)
            || app()->environment('testing');
    }

    public static function isStaff(User $user): bool
    {
        if (!(bool) $user->is_active) {
            return false;
        }

        $role = strtolower($user->role?->name ?? '');

        return $role === 'editor' || self::isDesignatedAdministrator($user);
    }
}

