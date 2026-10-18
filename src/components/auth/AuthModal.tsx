import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { GoogleLoginButton } from './GoogleLoginButton';
import { signInWithGoogleFirebase } from '../../services/firebase';
import { authService, AuthUser } from '../../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      // 1. Firebase Google Auth Flow (GoogleAuthProvider)
      const firebaseResult = await signInWithGoogleFirebase();

      // 2. Synchronize with Laravel Backend (POST /api/v1/auth/google)
      // Note: Google accounts have email_verified: true, no secondary code sent!
      const syncResult = await authService.loginWithFirebaseGoogle(firebaseResult);

      setSuccessInfo(syncResult.message);

      // Brief delay to display clean feedback before closing
      setTimeout(() => {
        setIsLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess(syncResult.user);
        }
        onClose();
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(
        err?.message || 'تعذر إتمام تسجيل الدخول عبر Google، يرجى المحاولة مرة أخرى.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-[#FBF9F5] border border-[#EBE6DF] rounded-2xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle Archival Texture / Header Glow */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-[#78350F] via-amber-600 to-[#78350F]" />

        {/* Top Header with Close Button */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#78350F] block font-semibold">
              المصادقة الرقمية الموحدة
            </span>
            <h2
              id="auth-modal-title"
              className="text-2xl font-serif font-bold text-[#1C1917] tracking-tight"
            >
              تسجيل الدخول إلى أثر كربلاء
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-full transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Guidance & Verification Guarantee */}
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
          سجّل دخولك لحفظ وتتبع الشواهد التراثية، استعراض المجموعات الأرشيفية، وتقديم المساهمات التوثيقية المسندة.
        </p>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successInfo && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-relaxed">{successInfo}</span>
          </div>
        )}

        {/* Single Consolidated Action Button */}
        <div className="pt-1">
          <GoogleLoginButton
            onClick={handleGoogleLogin}
            isLoading={isLoading}
            size="large"
          />
        </div>

        {/* Architectural Trust Note */}
        <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-500 font-sans">
          <div className="flex items-center gap-1.5 text-stone-600">
            <ShieldCheck className="w-4 h-4 text-[#78350F]" />
            <span>مصادقة آمنة عبر Firebase وGoogle ID Token</span>
          </div>
          <span className="font-mono text-stone-400">OAuth 2.0</span>
        </div>
      </div>
    </div>
  );
};
