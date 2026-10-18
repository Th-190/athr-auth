<?php

namespace App\Policies;

use App\Models\Site;
use App\Models\Role;
use App\Models\User;

class SitePolicy
{
    public function editorialViewAny(User $user): bool
    {
        $role = $user->role;

        return (bool) $user->is_active
            && $role instanceof Role
            && in_array(strtolower($role->name), ['admin', 'super_admin', 'editor'], true);
    }

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

        return $this->hasRole($user, ['admin', 'super_admin', 'editor']);
    }

    public function create(User $user): bool
    {
        return $this->hasRole($user, ['admin', 'super_admin', 'editor']);
    }

    public function update(User $user, Site $site): bool
    {
        return $this->editorialViewAny($user);
    }

    public function delete(User $user, Site $site): bool
    {
        return $this->hasRole($user, ['admin', 'super_admin']);
    }

    public function publish(User $user, Site $site): bool
    {
        return $this->editorialViewAny($user);
    }

    public function review(User $user, Site $site): bool
    {
        return $this->editorialViewAny($user);
    }

    public function verify(User $user, Site $site): bool
    {
        return $this->editorialViewAny($user);
    }

    /** @param list<string> $roles */
    private function hasRole(User $user, array $roles): bool
    {
        $role = $user->role;

        return $user->is_active && $role instanceof Role
            && in_array(strtolower($role->name), $roles, true);
    }
}
