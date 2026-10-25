import { apiFetch } from './apiFetch';

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'contributor' | 'viewer' | 'pending';
export interface AuthUser { id: string | number; name: string; email: string; avatar?: string; role: UserRole; role_ar: string; email_verified?: boolean; is_active?: boolean; can_access_admin?: boolean; created_at?: string; two_factor_enabled?: boolean; }

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];
  constructor() {
    try {
      for (const key of ['kha_auth_user_v3', 'kha_auth_token_v3', 'kha_auth_token', 'kha_auth_role']) localStorage.removeItem(key);
    } catch {
      // Authentication is server-session based; unavailable browser storage must not prevent startup.
    }
  }
  public subscribe(callback: (user: AuthUser | null) => void): () => void { this.listeners.push(callback); return () => { this.listeners = this.listeners.filter(listener => listener !== callback); }; }
  private notify() { this.listeners.forEach(callback => callback(this.currentUser)); }
  public getCurrentUser() { return this.currentUser; }
  public isAuthenticated() { return !!this.currentUser; }
  public isAdmin() { return this.currentUser?.role === 'admin' || this.currentUser?.role === 'super_admin'; }
  public isEditor() { return ['editor', 'admin', 'super_admin'].includes(this.currentUser?.role || ''); }
  public async refreshSession(): Promise<void> {
    try {
      const response = await apiFetch('/api/v1/auth/me');
      if (!response.ok) throw new Error('Unauthenticated');
      const data = await response.json();
      this.currentUser = data.authenticated && data.user ? data.user : null;
    } catch { this.currentUser = null; }
    this.notify();
  }
  public async updateUserRole(userId: string | number, newRole: UserRole): Promise<{ success: boolean; message: string; updatedUser?: AuthUser }> {
    try {
      const response = await apiFetch(`/api/v1/admin/users/${userId}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
      const data = await response.json().catch(() => ({}));
      return response.ok ? { success: true, message: data.message || 'تم تحديث الصلاحية', updatedUser: data.user } : { success: false, message: data.message || 'تعذر تحديث الصلاحية من الخادم.' };
    } catch { return { success: false, message: 'تعذر الاتصال بالخادم.' }; }
  }
  public getAllRegisteredUsers(): AuthUser[] { return []; }
  public async fetchAdminUsers(): Promise<{ users: AuthUser[] }> {
    try { const response = await apiFetch('/api/v1/admin/users'); if (!response.ok) return { users: [] }; const data = await response.json(); const users = data.users?.data || data.users || []; return { users: Array.isArray(users) ? users : [] }; } catch { return { users: [] }; }
  }
  public async logout(): Promise<void> {
    try { await apiFetch('/api/v1/auth/logout', { method: 'POST' }); } catch { /* Session may already have expired. */ }
    this.currentUser = null;
    this.notify();
  }
}
export const authService = new AuthService();
