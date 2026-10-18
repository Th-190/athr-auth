<?php

namespace App\Policies;

use App\Models\Site;
use App\Models\SiteImage;
use App\Models\User;

class SiteImagePolicy
{
    /**
     * Determine whether the user can upload an image for a given site.
     * The image may attach only to a site the user is authorized to edit.
     */
    public function create(User $user, Site $site): bool
    {
        return $user->can('update', $site);
    }

    /**
     * Determine whether the user can update the image metadata.
     */
    public function update(User $user, SiteImage $image): bool
    {
        if (!$image->site) {
            $role = strtolower($user->role?->name ?? '');
            return in_array($role, ['admin', 'super_admin']);
        }

        return $user->can('update', $image->site);
    }

    /**
     * Determine whether the user can reattach image to another target site.
     */
    public function reattach(User $user, SiteImage $image, Site $targetSite): bool
    {
        return $user->can('update', $image) && $user->can('update', $targetSite);
    }

    /**
     * Determine whether the user can delete the image.
     */
    public function delete(User $user, SiteImage $image): bool
    {
        return $this->update($user, $image);
    }
}
