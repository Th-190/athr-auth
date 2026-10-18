<?php

namespace App\Policies;

use App\Models\SiteContribution;
use App\Models\User;

class ContributionPolicy
{
    /**
     * Determine whether the user can view any contributions list.
     * Staff can view all contributions; contributors can only view their own submissions.
     */
    public function viewAny(User $user): bool
    {
        $role = strtolower($user->role?->name ?? '');
        return in_array($role, ['admin', 'super_admin', 'editor', 'contributor']);
    }

    /**
     * Determine whether the user can view a specific contribution.
     */
    public function view(User $user, SiteContribution $contribution): bool
    {
        $role = strtolower($user->role?->name ?? '');
        if (in_array($role, ['admin', 'super_admin', 'editor'])) {
            return true;
        }

        // Contributors can only view their own
        return (int) $contribution->user_id === (int) $user->id;
    }

    /**
     * Determine whether the user can review/approve/reject a contribution.
     */
    public function review(User $user, SiteContribution $contribution): bool
    {
        $role = strtolower($user->role?->name ?? '');
        return in_array($role, ['admin', 'super_admin', 'editor']);
    }
}
