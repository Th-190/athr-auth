import React, { useState } from 'react';
import { UserRole } from '../../types';
import { Shield, KeyRound, UserCheck, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Editor');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني للمحرر أو الباحث');
      return;
    }
    setError(null);
    onLoginSuccess(selectedRole);
    onClose();
  };

  const handleQuickLogin = (role: UserRole) => {
    onLoginSuccess(role);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="تسجيل دخول المحررين والباحثين"
    >
      <div
        className="w-full max-w-md bg-[#FBF9F5] border border-stone-300 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#78350F]" />
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900">
                بوابة دخول هيئة التحرير والتدقيق
              </h2>
              <span className="text-xs text-stone-500">
                مخصصة للباحثين والمحررين المعتمدين في الأرشيف
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">البريد الإلكتروني المعتمد:</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="editor@karbalaheritage.iq"
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded focus:border-[#78350F] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">كلمة المرور:</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded focus:border-[#78350F] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">صلاحية الجلسة المعتمدة:</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded focus:border-[#78350F] focus:outline-none"
            >
              <option value="Editor">محرر وباحث ميداني (Editor)</option>
              <option value="Admin">مدير أرشيف وهيئة تدقيق (Admin)</option>
              <option value="Super Admin">مدير النظام (Super Admin)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-[#78350F] hover:bg-[#9A3412] text-white text-xs font-bold rounded transition-colors shadow-2xs"
            >
              تسجيل الدخول وبدء جلسة التحرير
            </button>
          </div>

          {/* Quick Demo Credentials shortcut */}
          <div className="pt-3 border-t border-stone-200 text-center space-y-2">
            <span className="text-[11px] text-stone-500 block">
              جلسة تجريبية سريعة لتقييم منظومة الصلاحيات:
            </span>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('Editor')}
                className="px-2.5 py-1 text-[11px] bg-white border border-stone-300 hover:border-amber-700 rounded text-stone-800"
              >
                دخول كمحرر (Editor)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('Admin')}
                className="px-2.5 py-1 text-[11px] bg-white border border-stone-300 hover:border-amber-700 rounded text-stone-800"
              >
                دخول كمدير (Admin)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
