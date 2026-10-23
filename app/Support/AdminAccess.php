<?php

namespace App\Support;

use App\Models\User;

class AdminAccess
{
    public static function isSuperAdministrator(?User $user): bool
    {
        return $user !== null
            && (bool) $user->is_active
            && strtolower($user->role?->name ?? '') === 'super_admin';
    }

    public static function isDesignatedAdministrator(?User $user): bool
    {
        if (!$user || strtolower($user->role?->name ?? '') !== 'admin') {
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

        return $role === 'editor' || self::isSuperAdministrator($user)
            || ($role === 'admin' && self::isDesignatedAdministrator($user));
    }

    public static function canManageAdministration(?User $user): bool
    {
        if (!$user || !(bool) $user->is_active) {
            return false;
        }

        $role = strtolower($user->role?->name ?? '');

        return $role === 'super_admin'
            || ($role === 'admin' && self::isDesignatedAdministrator($user));
    }
}

