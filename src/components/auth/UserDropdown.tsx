import React, { useState, useRef, useEffect } from 'react';
import { AuthUser } from '../../services/authService';
import {
  Shield,
  LogOut,
  ChevronDown,
  User,
  Sliders,
  Bookmark,
  CheckCircle,
} from 'lucide-react';

interface UserDropdownProps {
  user: AuthUser;
  onNavigate: (tab: string, param?: string) => void;
  onLogout: () => void;
  onOpenMyList?: () => void;
  onOpenAdminModal?: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  onNavigate,
  onLogout,
  onOpenMyList,
  onOpenAdminModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isEditorOrAdmin = user.role === 'editor' || user.role === 'admin';
  const isAdmin = user.role === 'admin';

  // Role Badge Styling
  const roleBadgeStyle = (() => {
    switch (user.role) {
      case 'admin':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'editor':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'viewer':
        return 'bg-amber-50 text-[#78350F] border-amber-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  })();

  const avatarSrc =
    user.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;

  return (
    <div className="relative inline-block text-right" ref={dropdownRef} dir="rtl">
      {/* Trigger: User Avatar, Name, and Role Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pl-2.5 bg-white hover:bg-stone-50 active:bg-stone-100 border border-stone-200 rounded-full transition-all shadow-2xs cursor-pointer group"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <img
          src={avatarSrc}
          alt={user.name}
          className="w-7 h-7 rounded-full object-cover border border-stone-300 shrink-0"
        />

        <div className="hidden sm:flex flex-col text-right leading-none">
          <span className="text-xs font-bold text-stone-900 group-hover:text-[#78350F] transition-colors truncate max-w-[120px]">
            {user.name}
          </span>
          <span className="text-[10px] text-stone-500 font-sans mt-0.5">
            {user.role_ar || user.role}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white border border-[#EBE6DF] rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs text-stone-800">
          {/* User Details Header */}
          <div className="px-4 py-3 border-b border-stone-100 flex items-start gap-3">
            <img
              src={avatarSrc}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="font-bold text-sm text-stone-900 truncate leading-tight">
                {user.name}
              </h4>
              <p className="text-[11px] text-stone-500 truncate font-mono">
                {user.email}
              </p>
              <div className="pt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${roleBadgeStyle}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{user.role_ar || user.role}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Role-Specific Actions */}
          <div className="py-1">
            {/* Link to Administrative Control Panel (Only if editor or admin) */}
            {isEditorOrAdmin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('admin');
                }}
                className="w-full text-right px-4 py-2 hover:bg-stone-50 flex items-center justify-between text-stone-800 font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2 text-[#78350F]">
                  <Shield className="w-4 h-4 text-[#78350F]" />
                  <span>لوحة التحرير والإدارة</span>
                </div>
                <span className="text-[10px] bg-amber-50 text-[#78350F] px-1.5 py-0.5 rounded border border-amber-200 font-mono">
                  Admin
                </span>
              </button>
            )}

            {/* Admin RBAC Role Management Modal trigger (Admin only) */}
            {isAdmin && onOpenAdminModal && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAdminModal();
                }}
                className="w-full text-right px-4 py-2 hover:bg-stone-50 flex items-center gap-2 text-purple-900 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-purple-700" />
                <span>إدارة صلاحيات الباحثين (RBAC)</span>
              </button>
            )}

            {/* My Bookmarks list */}
            {onOpenMyList && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenMyList();
                }}
                className="w-full text-right px-4 py-2 hover:bg-stone-50 flex items-center gap-2 text-stone-700 cursor-pointer"
              >
                <Bookmark className="w-4 h-4 text-stone-500" />
                <span>قائمتي التوثيقية المحفوظة</span>
              </button>
            )}
          </div>

          {/* Logout Action */}
          <div className="border-t border-stone-100 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-700 flex items-center gap-2 transition-colors cursor-pointer font-medium"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>تسجيل الخروج من الجلسة</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
