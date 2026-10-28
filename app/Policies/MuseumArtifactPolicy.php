<?php

namespace App\Policies;

use App\Models\MuseumArtifact;
use App\Models\Role;
use App\Models\User;

class MuseumArtifactPolicy
{
    public function editorialViewAny(User $user): bool
    {
        return $this->isEditor($user);
    }

    public function create(User $user): bool
    {
        return $this->isEditor($user);
    }

    public function update(User $user, MuseumArtifact $artifact): bool
    {
        return $this->isEditor($user);
    }

    public function review(User $user, MuseumArtifact $artifact): bool
    {
        return $this->isEditor($user);
    }

    public function publish(User $user, MuseumArtifact $artifact): bool
    {
        return $this->isEditor($user);
    }

    private function isEditor(User $user): bool
    {
        $role = $user->role;

        return (bool) $user->is_active
            && $role instanceof Role
            && in_array(strtolower($role->name), ['admin', 'super_admin', 'editor'], true);
    }
}
