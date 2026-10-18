import React, { useState, useEffect } from 'react';
import { authService, AuthUser, UserRole } from '../../services/authService';
import { Shield, Check, X, RefreshCw, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';

interface AdminUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserRoleUpdated?: () => void;
}

export const AdminUserRoleModal: React.FC<AdminUserRoleModalProps> = ({
  isOpen,
  onClose,
  onUserRoleUpdated,
}) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await authService.fetchAdminUsers();
      setUsers(data.users);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setNotification(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = async (userId: string | number, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      const result = await authService.updateUserRole(userId, newRole);
      setNotification(result.message);
      await loadUsers();
      if (onUserRoleUpdated) onUserRoleUpdated();
      setTimeout(() => setNotification(null), 3500);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'editor':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'viewer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="لوحة تحكم إدارة صلاحيات المستخدمين (RBAC)"
    >
      <div
        className="w-full max-w-3xl bg-[#FBF9F5] border border-stone-300 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#78350F] text-white flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900">
                لوحة إدارة صلاحيات المستخدمين (RBAC Management)
              </h2>
              <span className="text-xs text-stone-500">
                التحكم في أدوار مستخدمي Google (مدير، محرر، مشاهد، معلق)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="p-1.5 text-stone-500 hover:text-stone-800 rounded border border-stone-200 bg-stone-50 cursor-pointer"
              title="تحديث القائمة"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="m-4 mb-0 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-lg flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Table */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-[#F7F4EE] border-b border-stone-200 text-stone-700 font-serif">
                <tr>
                  <th className="py-3 px-4 font-bold">المستخدم</th>
                  <th className="py-3 px-4 font-bold">البريد الإلكتروني</th>
                  <th className="py-3 px-4 font-bold">الحالة الحالية</th>
                  <th className="py-3 px-4 font-bold text-left">تعديل الصلاحية (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover border border-stone-200"
                        />
                        <div>
                          <span className="font-bold text-stone-900 block">{u.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('ar-IQ') : 'مسجل'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 font-mono text-stone-600">
                      {u.email}
                    </td>

                    {/* Current Role Badge */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getRoleBadge(u.role)}`}>
                        {u.role === 'pending' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        {u.role === 'admin' && <ShieldAlert className="w-3 h-3 text-purple-600" />}
                        <span>{u.role_ar || u.role}</span>
                      </span>
                    </td>

                    {/* Role Selector */}
                    <td className="py-3 px-4 text-left">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                        disabled={updatingUserId === u.id}
                        className="bg-white border border-stone-300 rounded px-2.5 py-1 text-xs text-stone-800 font-medium focus:outline-none focus:border-[#78350F] cursor-pointer"
                      >
                        <option value="admin">مدير أرشيف (Admin)</option>
                        <option value="editor">محرر وباحث (Editor)</option>
                        <option value="viewer">مشاهد وباحث (Viewer)</option>
                        <option value="pending">معلق (Pending)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-600 flex items-start gap-2">
            <UserCheck className="w-4 h-4 text-[#78350F] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>قواعد الصلاحيات:</strong> المستخدم المعلق (Pending) يمتلك حق التصفح العام فقط؛ المشاهد (Viewer) يحق له حفظ القوائم والتصدير؛ المحرر (Editor) يملك حق اعتماد التوثيق وتعديل السجلات؛ المدير (Admin) يملك التحكم الكامل في الصلاحيات والمستودع.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 bg-stone-50 px-5 py-3 flex items-center justify-between text-xs text-stone-500">
          <span>إجمالي المستخدمين المسجلين: {users.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#78350F] text-white rounded font-medium hover:bg-[#9A3412]"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
