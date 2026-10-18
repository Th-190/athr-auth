<?php

namespace App\Policies;

use App\Models\Site;
use App\Models\User;

class SitePolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Site $site): bool
    {
        if ($site->isPubliclyAccessible()) {
            return true;
        }

        if (!$user) {
            return false;
        }

        $role = strtolower($user->role?->name ?? '');
        return in_array($role, ['admin', 'super_admin', 'editor']);
    }

    public function create(User $user): bool
    {
        $role = strtolower($user->role?->name ?? '');
        return in_array($role, ['admin', 'super_admin', 'editor']);
    }

    public function update(User $user, Site $site): bool
    {
        $role = strtolower($user->role?->name ?? '');
        return in_array($role, ['admin', 'super_admin', 'editor']);
    }

    public function delete(User $user, Site $site): bool
    {
        $role = strtolower($user->role?->name ?? '');
        return in_array($role, ['admin', 'super_admin']);
    }

    public function publish(User $user, Site $site): bool
    {
        $role = strtolower($user->role?->name ?? '');
        return in_array($role, ['admin', 'super_admin', 'editor']);
    }

    public function verify(User $user, Site $site): bool
    {
        $role = strtolower($user->role?->name ?? '');
        return in_array($role, ['admin', 'super_admin', 'editor']);
    }
}
