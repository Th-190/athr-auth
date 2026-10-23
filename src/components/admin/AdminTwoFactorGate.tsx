import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/apiFetch';

const endpoint = '/api/v1/auth/2fa';

export const AdminTwoFactorGate: React.FC<{ onVerified: () => void }> = ({ onVerified }) => {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [secret, setSecret] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/v1/auth/me').then(async response => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'تعذر التحقق من إعداد المصادقة الثنائية.');
      setConfigured(Boolean(body.user?.two_factor_enabled));
    }).catch(reason => { setError(reason instanceof Error ? reason.message : 'تعذر التحقق من الإعداد.'); setConfigured(false); });
  }, []);

  const beginSetup = async () => {
    setBusy(true); setError('');
    try {
      const response = await apiFetch(`${endpoint}/setup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: password }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'تعذر بدء الإعداد.');
      setSecret(body.secret || '');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر بدء الإعداد.'); }
    finally { setBusy(false); }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const action = configured ? 'verify' : 'confirm';
      const response = await apiFetch(`${endpoint}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.errors ? Object.values(body.errors).flat().join(' ') : body.message || 'رمز المصادقة غير صحيح.');
      onVerified();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر التحقق من الرمز.'); }
    finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 p-4" dir="rtl"><section className="w-full max-w-lg space-y-4 rounded-2xl border border-stone-200 bg-[#FAF8F5] p-6 shadow-2xl">
    <div><p className="text-sm font-semibold text-amber-900">أثر كربلاء · حماية لوحة الإدارة</p><h1 className="mt-2 text-2xl font-serif font-bold text-stone-900">تحقق بخطوتين</h1></div>
    {configured === null ? <p className="text-sm text-stone-600">جارٍ التحقق من إعداد الحساب…</p> : configured ? <><p className="text-sm text-stone-700">أدخل الرمز الحالي من تطبيق المصادقة. يستمر التحقق الإداري عشر دقائق.</p><form onSubmit={verify} className="space-y-3"><input aria-label="رمز المصادقة" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value)} className="w-full rounded-lg border border-stone-300 bg-white p-3 text-center font-mono text-xl tracking-[0.4em]"/><button disabled={busy} className="w-full rounded-lg bg-[#78350F] px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? 'جارٍ التحقق…' : 'تحقق وافتح لوحة الإدارة'}</button></form></> : <>
      {!secret ? <div className="space-y-3"><p className="text-sm text-stone-700">أعد إدخال كلمة مرورك للتحقق من هويتك وبدء إعداد تطبيق المصادقة.</p><input aria-label="كلمة المرور الحالية" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-lg border border-stone-300 bg-white p-3"/><button onClick={() => void beginSetup()} disabled={busy || !password} className="w-full rounded-lg bg-[#78350F] px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? 'جارٍ الإعداد…' : 'إنشاء مفتاح الإعداد'}</button></div> : <><div className="break-all rounded-lg border border-amber-300 bg-amber-50 p-3 font-mono text-sm" dir="ltr">{secret}</div><p className="text-xs text-stone-600">أضف المفتاح إلى تطبيق المصادقة ثم أدخل الرمز.</p><form onSubmit={verify} className="space-y-3"><input aria-label="رمز المصادقة" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value)} className="w-full rounded-lg border border-stone-300 bg-white p-3 text-center font-mono text-xl tracking-[0.4em]"/><button disabled={busy} className="w-full rounded-lg bg-[#78350F] px-4 py-3 font-semibold text-white disabled:opacity-60">تأكيد الإعداد وفتح الإدارة</button></form></>}
    </>}{error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}</section></div>;
};
