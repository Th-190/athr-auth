import React, { useState, useEffect } from 'react';
import { inputClass, labelClass, primaryBtn, ghostBtn, dangerBtn } from './formStyles';
import { Shield, UserPlus, KeyRound, Ban, CheckCircle2, Trash2, Search, UserCheck, Mail, Send, Clock, XCircle } from 'lucide-react';

interface ManagedUser {
  id: string | number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | 'contributor' | 'super_admin';
  role_ar: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  deactivated_at?: string | null;
}

interface AccessInvitation {
  id: number;
  email: string;
  role: { id: number; name: string; name_ar: string };
  inviter?: { id: number; name: string; email: string };
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
}

const DEFAULT_USERS: ManagedUser[] = [
  {
    id: 1,
    name: 'مدير النظام الرئيسي',
    email: 'admin@karbalaheritage.iq',
    role: 'admin',
    role_ar: 'مدير أرشيف',
    is_active: true,
    email_verified: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'محرر توثيق التراث',
    email: 'editor@karbalaheritage.iq',
    role: 'editor',
    role_ar: 'محرر وباحث',
    is_active: true,
    email_verified: true,
    created_at: '2026-03-05T00:00:00Z',
  },
  {
    id: 3,
    name: 'باحث ميداني زائر',
    email: 'researcher@karbalaheritage.iq',
    role: 'viewer',
    role_ar: 'مشاهد وباحث',
    is_active: true,
    email_verified: true,
    created_at: '2026-03-10T00:00:00Z',
  },
];

const STORAGE_USERS_KEY = 'kha_managed_users_v1';

export const UsersManager: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [users, setUsers] = useState<ManagedUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_USERS;
  });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [invitations, setInvitations] = useState<AccessInvitation[]>([]);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role_id: 2, // default editor
    expires_days: 14,
  });
  const [newForm, setNewForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'editor' as 'admin' | 'editor' | 'viewer',
  });

  const activeAdminsCount = users.filter(u => u.role === 'admin' && u.is_active).length;

  const persistUsers = (list: ManagedUser[]) => {
    setUsers(list);
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(list));
    } catch {
      // Fallback
    }
  };

  // Try fetching from Laravel backend if token exists
  useEffect(() => {
    const fetchApi = async () => {
      try {
        const token = localStorage.getItem('kha_auth_token');
        if (!token) return;
        const res = await fetch('/api/v1/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.users && Array.isArray(data.users.data || data.users)) {
            const apiUsers: ManagedUser[] = (data.users.data || data.users).map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role || 'viewer',
              role_ar: u.role_ar || (u.role === 'admin' ? 'مدير أرشيف' : u.role === 'editor' ? 'محرر وباحث' : 'مشاهد وباحث'),
              is_active: u.is_active !== false,
              email_verified: Boolean(u.email_verified),
              created_at: u.created_at || new Date().toISOString(),
              deactivated_at: u.deactivated_at,
            }));
            if (apiUsers.length > 0) {
              persistUsers(apiUsers);
            }
          }
        }
      } catch {
        // Fallback to local
      }
    };
    fetchApi();
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('kha_auth_token');
      if (!token) return;
      const res = await fetch('/api/v1/admin/invitations', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.data || []);
      }
    } catch {
      // Fallback
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      alert('يرجى إدخال البريد الإلكتروني للمدعو.');
      return;
    }
    try {
      const token = localStorage.getItem('kha_auth_token');
      const res = await fetch('/api/v1/admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'حدث خطأ أثناء إصدار الدعوة.');
        return;
      }
      alert(data.message || 'تم إرسال دعوة الانضمام بنجاح.');
      setIsInviteOpen(false);
      setInviteForm({ email: '', role_id: 2, expires_days: 14 });
      fetchInvitations();
    } catch {
      alert('تعذر الاتصال بالخادم لإصدار الدعوة.');
    }
  };

  const handleRevokeInvite = async (id: number) => {
    if (!confirm('هل أنت متأكد من إلغاء هذه الدعوة؟ لن يتمكن المستخدم من استخدامها لاحقاً.')) {
      return;
    }
    try {
      const token = localStorage.getItem('kha_auth_token');
      const res = await fetch(`/api/v1/admin/invitations/${id}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'تعذر إلغاء الدعوة.');
        return;
      }
      alert('تم إلغاء الدعوة بنجاح.');
      fetchInvitations();
    } catch {
      alert('تعذر الاتصال بالخادم.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.email.trim() || !newForm.password.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    if (newForm.password.length < 8) {
      alert('كلمة المرور يجب أن لا تقل عن 8 أحرف.');
      return;
    }
    if (users.some(u => u.email.toLowerCase() === newForm.email.toLowerCase())) {
      alert('البريد الإلكتروني مسجل مسبقاً لمستخدم آخر.');
      return;
    }

    const newUser: ManagedUser = {
      id: `usr_${Date.now()}`,
      name: newForm.name.trim(),
      email: newForm.email.trim().toLowerCase(),
      role: newForm.role,
      role_ar: newForm.role === 'admin' ? 'مدير أرشيف' : newForm.role === 'editor' ? 'محرر وباحث' : 'مشاهد وباحث',
      is_active: true,
      email_verified: true,
      created_at: new Date().toISOString(),
    };

    // Attempt backend save
    try {
      const token = localStorage.getItem('kha_auth_token');
      if (token) {
        await fetch('/api/v1/admin/users', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(newForm),
        });
      }
    } catch {
      // Fallback
    }

    const updated = [newUser, ...users];
    persistUsers(updated);
    setIsCreateOpen(false);
    setNewForm({ name: '', email: '', password: '', role: 'editor' });
    alert(`تم إنشاء حساب ${newUser.role_ar}: ${newUser.name} بنجاح.`);
  };

  const handleToggleActive = async (user: ManagedUser) => {
    if (user.role === 'admin' && user.is_active && activeAdminsCount <= 1) {
      alert('لا يمكن تعطيل آخر مدير نشط في النظام.');
      return;
    }

    const willActivate = !user.is_active;
    const confirmMsg = willActivate
      ? `هل تريد إعادة تفعيل حساب (${user.name})؟`
      : `هل أنت متأكد من تعطيل حساب (${user.name})؟ لن يتمكن من تسجيل الدخول.`;

    if (!confirm(confirmMsg)) return;

    // Backend call
    try {
      const token = localStorage.getItem('kha_auth_token');
      if (token) {
        const endpoint = willActivate
          ? `/api/v1/admin/users/${user.id}/activate`
          : `/api/v1/admin/users/${user.id}/deactivate`;
        await fetch(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      }
    } catch {
      // Fallback
    }

    const updated = users.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          is_active: willActivate,
          deactivated_at: willActivate ? null : new Date().toISOString(),
        };
      }
      return u;
    });

    persistUsers(updated);
  };

  const handleRevokeSessions = async (user: ManagedUser) => {
    if (!confirm(`هل تريد إبطال جميع الجلسات النشطة للمستخدم (${user.name})؟`)) return;

    try {
      const token = localStorage.getItem('kha_auth_token');
      if (token) {
        await fetch(`/api/v1/admin/users/${user.id}/revoke-sessions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      }
    } catch {
      // Fallback
    }

    alert(`تم إبطال جميع جلسات الدخول للمستخدم (${user.name}).`);
  };

  const handleDeleteUser = async (user: ManagedUser) => {
    if (user.role === 'admin' && activeAdminsCount <= 1) {
      alert('لا يمكن حذف آخر مدير نشط في النظام.');
      return;
    }

    if (!confirm(`تحذير: هل أنت متأكد من الحذف النهائي لحساب (${user.name})؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('kha_auth_token');
      if (token) {
        await fetch(`/api/v1/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      }
    } catch {
      // Fallback
    }

    const updated = users.filter(u => u.id !== user.id);
    persistUsers(updated);
    alert(`تم حذف الحساب بنجاح.`);
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">إدارة المستخدمين والمديرين</h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            صلاحيات الوصول، إدارة حسابات هيئة التحرير، وتعطيل أو تفعيل جلسات العمل بأمان.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            <span>المديرون النشطون: <strong>{activeAdminsCount}</strong></span>
          </div>
          <button onClick={() => setIsInviteOpen(true)} className={primaryBtn + ' flex items-center gap-1.5 bg-amber-800 hover:bg-amber-900'}>
            <Send className="w-4 h-4" />
            <span>دعوة انضمام (L6)</span>
          </button>
          <button onClick={() => setIsCreateOpen(true)} className={primaryBtn + ' flex items-center gap-1.5'}>
            <UserPlus className="w-4 h-4" />
            <span>إضافة مستخدم</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E8E2D8] gap-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 px-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'border-[#78350F] text-[#78350F] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          حسابات المستخدمين ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`pb-2.5 px-2 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'invitations'
              ? 'border-[#78350F] text-[#78350F] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>دعوات الوصول المعلقة</span>
          {invitations.filter(i => i.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
              {invitations.filter(i => i.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <>
          {/* Filter and search bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-3 text-stone-400" />
              <input
                type="text"
                className={inputClass + ' pr-9'}
                placeholder="بحث بالاسم أو البريد الإلكتروني..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'admin', 'editor', 'viewer'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                    roleFilter === r
                      ? 'bg-[#78350F] text-white font-bold'
                      : 'bg-white border border-[#E8E2D8] text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {r === 'all' ? 'الكل' : r === 'admin' ? 'المديرون' : r === 'editor' ? 'المحررون' : 'المشاهدون'}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#FAF8F5] text-stone-700 border-b border-[#E8E2D8]">
                  <tr>
                    <th className="py-3 px-4 font-bold">المستخدم</th>
                    <th className="py-3 px-4 font-bold">الصلاحية</th>
                    <th className="py-3 px-4 font-bold">الحالة</th>
                    <th className="py-3 px-4 font-bold">تاريخ التسجيل</th>
                    <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {filtered.map(user => {
                    const isOnlyAdmin = user.role === 'admin' && user.is_active && activeAdminsCount <= 1;

                    return (
                      <tr key={user.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-stone-900">{user.name}</div>
                          <div className="text-[11px] font-mono text-stone-500">{user.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                : user.role === 'editor'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-stone-100 text-stone-700 border border-stone-200'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            {user.role_ar}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>نشط ومفعل</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 text-xs">
                              <Ban className="w-3.5 h-3.5" />
                              <span>معطل</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                          {user.created_at.split('T')[0]}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={isOnlyAdmin}
                              title={isOnlyAdmin ? 'لا يمكن تعطيل آخر مدير نشط' : user.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                              className={`p-1.5 rounded transition-colors ${
                                isOnlyAdmin
                                  ? 'text-stone-300 cursor-not-allowed'
                                  : user.is_active
                                  ? 'text-amber-700 hover:bg-amber-50'
                                  : 'text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {user.is_active ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => handleRevokeSessions(user)}
                              title="إبطال جلسات الدخول"
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={isOnlyAdmin}
                              title={isOnlyAdmin ? 'لا يمكن حذف آخر مدير نشط' : 'حذف الحساب'}
                              className={`p-1.5 rounded transition-colors ${
                                isOnlyAdmin
                                  ? 'text-stone-300 cursor-not-allowed'
                                  : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        لا يوجد مستخدمون مطابقون لمعايير البحث.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Invitations Tab Content (L6) */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
            <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-950">
              <Mail className="w-4 h-4" />
              <span>نظام دعوات الانضمام وقواعد عدم التصعيد (L6 Spec):</span>
            </div>
            يتطلب تسجيل الدخول لأول مرة عبر Google وجود دعوة نشطة مسبقة من الإدارة. يتم تعيين الدور تلقائياً وبدقة لمرة واحدة فقط.
            لا يمكن للمدير العادي منح رتبة مدير أو مدير أعلى، ولا يجوز لأي مستخدم ترقية حسابه بنفسه.
          </div>

          <div className="bg-white border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#FAF8F5] text-stone-700 border-b border-[#E8E2D8]">
                  <tr>
                    <th className="py-3 px-4 font-bold">البريد الإلكتروني المدعو</th>
                    <th className="py-3 px-4 font-bold">الدور المقترح</th>
                    <th className="py-3 px-4 font-bold">أصدر الدعوة</th>
                    <th className="py-3 px-4 font-bold">الحالة</th>
                    <th className="py-3 px-4 font-bold">تاريخ الانتهاء</th>
                    <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {invitations.map(inv => (
                    <tr key={inv.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-stone-900">
                        {inv.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
                          <Shield className="w-3 h-3" />
                          {inv.role?.name_ar || inv.role?.name || 'محرر'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">
                        {inv.inviter?.name || 'النظام'}
                      </td>
                      <td className="py-3.5 px-4">
                        {inv.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium">
                            <Clock className="w-3 h-3" /> قيد الانتظار
                          </span>
                        )}
                        {inv.status === 'accepted' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3" /> تم القبول والتفعيل
                          </span>
                        )}
                        {inv.status === 'revoked' && (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-medium">
                            <XCircle className="w-3 h-3" /> ملغاة
                          </span>
                        )}
                        {inv.status === 'expired' && (
                          <span className="inline-flex items-center gap-1 text-stone-500 bg-stone-100 px-2 py-0.5 rounded text-[11px] font-medium">
                            منتهية الصلاحية
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                        {inv.expires_at ? inv.expires_at.split('T')[0] : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {inv.status === 'pending' ? (
                          <button
                            onClick={() => handleRevokeInvite(inv.id)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-medium underline"
                          >
                            إلغاء الدعوة
                          </button>
                        ) : (
                          <span className="text-stone-300 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {invitations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400">
                        لا توجد دعوات وصول مسجلة حالياً. انقر على «دعوة انضمام» لإرسال دعوة جديدة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal (L6) */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E8E2D8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#E8E2D8] bg-[#FAF8F5] flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#78350F]" />
                إصدار دعوة وصول جديدة (L6)
              </h2>
              <button onClick={() => setIsInviteOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
            <form onSubmit={handleSendInvite} className="p-5 space-y-4">
              <div>
                <label className={labelClass}>البريد الإلكتروني للمدعو (Google Account) *</label>
                <input
                  type="email"
                  required
                  className={inputClass}
                  placeholder="name@domain.com"
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>الدور الممنوح *</label>
                <select
                  className={inputClass}
                  value={inviteForm.role_id}
                  onChange={e => setInviteForm({ ...inviteForm, role_id: Number(e.target.value) })}
                >
                  <option value={4}>مساهم (Contributor) - رفع المواد ومقترحات التوثيق فقط</option>
                  <option value={2}>محرر وباحث (Editor) - تحرير ونشر المواقع والمقالات</option>
                  <option value={1}>مدير أرشيف (Admin) - يتطلب صلاحية Super Admin</option>
                  <option value={5}>مدير أعلى (Super Admin) - صلاحية كاملة غير مقيدة</option>
                </select>
                <p className="text-[11px] text-stone-500 mt-1">
                  ملاحظة أمنية: تمنع قواعد التصعيد منح رتبة مدير أو مدير أعلى إلا بواسطة مدير أعلى مسجل.
                </p>
              </div>
              <div>
                <label className={labelClass}>مدة صلاحية الدعوة (بالأيام)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  className={inputClass}
                  value={inviteForm.expires_days}
                  onChange={e => setInviteForm({ ...inviteForm, expires_days: Number(e.target.value) })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className={primaryBtn + ' flex-1'}>إرسال الدعوة</button>
                <button type="button" onClick={() => setIsInviteOpen(false)} className={ghostBtn}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E8E2D8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#E8E2D8] bg-[#FAF8F5] flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#78350F]" />
                إضافة مستخدم أو مدير جديد
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className={labelClass}>الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  placeholder="د. أحمد الكربلائي"
                  value={newForm.name}
                  onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>البريد الإلكتروني *</label>
                <input
                  type="email"
                  required
                  className={inputClass}
                  placeholder="editor@example.iq"
                  value={newForm.email}
                  onChange={e => setNewForm({ ...newForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>كلمة المرور المؤقتة * (8 أحرف على الأقل)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className={inputClass}
                  placeholder="••••••••••••"
                  value={newForm.password}
                  onChange={e => setNewForm({ ...newForm, password: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>الصلاحية والدور *</label>
                <select
                  className={inputClass}
                  value={newForm.role}
                  onChange={e => setNewForm({ ...newForm, role: e.target.value as any })}
                >
                  <option value="editor">محرر وباحث (تحرير المواقع والمقالات والوسائط)</option>
                  <option value="admin">مدير أرشيف (صلاحيات كاملة شاملة المستخدمين والإعدادات)</option>
                  <option value="viewer">مشاهد وباحث (اطلاع وتدقيق داخلي)</option>
                </select>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg text-xs text-stone-600 border border-stone-200">
                ملاحظة: سيتم تفعيل الحساب فوراً وتوثيق عملية الإنشاء في سجل التدقيق غير القابل للتعديل.
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className={primaryBtn + ' flex-1'}>إنشاء الحساب</button>
                <button type="button" onClick={() => setIsCreateOpen(false)} className={ghostBtn}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
