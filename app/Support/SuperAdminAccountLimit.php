<?php

namespace App\Support;

use App\Models\Role;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class SuperAdminAccountLimit
{
    public const MAX_ACTIVE = 3;

    /** Lock the shared role row as a mutex for every active-account change. */
    public static function lockRole(): Role
    {
        return Role::query()->where('name', 'super_admin')->lockForUpdate()->firstOrFail();
    }

    public static function activeCount(Role $role, ?int $exceptUserId = null): int
    {
        return User::query()
            ->where('role_id', $role->id)
            ->where('is_active', true)
            ->when($exceptUserId !== null, fn ($query) => $query->where('id', '!=', $exceptUserId))
            ->count();
    }

    public static function ensureCapacity(Role $role, ?int $exceptUserId = null): void
    {
        if (self::activeCount($role, $exceptUserId) >= self::MAX_ACTIVE) {
            throw ValidationException::withMessages([
                'role' => 'بلغ عدد حسابات المدير العام النشطة الحد الأقصى (3). عطّل حساباً نشطاً قبل إضافة حساب آخر أو تفعيله.',
            ]);
        }
    }

    public static function ensureAnotherUsableAccount(Role $role, User $target): void
    {
        if ((bool) $target->is_active && self::activeCount($role, $target->id) === 0) {
            throw ValidationException::withMessages([
                'account' => 'لا يمكن تعطيل أو إزالة آخر حساب مدير عام نشط.',
            ]);
        }
    }
}
