<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccessInvitation extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'accepted_at' => 'datetime',
        'revoked_at'  => 'datetime',
        'expires_at'  => 'datetime',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Scope for valid, active, non-expired invitations.
     */
    public function scopeValid(Builder $query): Builder
    {
        return $query->where('status', 'pending')
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now());
    }

    public function isPending(): bool
    {
        return $this->status === 'pending'
            && is_null($this->accepted_at)
            && is_null($this->revoked_at)
            && $this->expires_at->isFuture();
    }
}
