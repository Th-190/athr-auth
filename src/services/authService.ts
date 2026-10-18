/**
 * Google OAuth & RBAC Service for Karbala Heritage Archive
 * Coordinates Firebase Auth (GoogleAuthProvider), Laravel Backend (POST /api/v1/auth/google),
 * and Role-Based Access Control (RBAC).
 */

import { signOutFirebase } from './firebase';

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'contributor' | 'viewer' | 'pending';

export interface AuthUser {
  id: string | number;
  firebase_uid?: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  role_ar: string;
  email_verified?: boolean;
  created_at?: string;
}

const AUTH_USER_KEY = 'kha_auth_user_v3';
const AUTH_TOKEN_KEY = 'kha_auth_token_v3';
const LEGACY_API_TOKEN_KEY = 'kha_auth_token';

class AuthService {
  private currentUser: AuthUser | null = null;
  private token: string | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    try {
      const userRaw = localStorage.getItem(AUTH_USER_KEY);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (userRaw && token) {
        this.currentUser = JSON.parse(userRaw);
        this.token = token;
        localStorage.setItem(LEGACY_API_TOKEN_KEY, token);
      }
    } catch {
      this.currentUser = null;
      this.token = null;
    }
  }

  public subscribe(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public getToken(): string | null {
    return this.token;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  public async refreshSession(): Promise<void> {
    if (!this.token) return;
    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: { Accept: 'application/json', Authorization: `Bearer ${this.token}` },
      });
      if (!response.ok) throw new Error('Session expired');
      const data = await response.json();
      if (!data.authenticated || !data.user) throw new Error('Session expired');
      const updatedUser: AuthUser = { ...this.currentUser!, ...data.user };
      this.currentUser = updatedUser;
      this.persistSession(updatedUser, this.token);
      this.notify();
    } catch {
      this.currentUser = null;
      this.token = null;
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(LEGACY_API_TOKEN_KEY);
      localStorage.removeItem('kha_auth_role');
      this.notify();
    }
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'super_admin';
  }

  public isEditor(): boolean {
    return ['editor', 'admin', 'super_admin'].includes(this.currentUser?.role || '');
  }

  /**
   * Synchronize Firebase ID Token with Laravel API (POST /api/v1/auth/google)
   * Automatically sets default role to viewer (أو بانتظار الاعتماد).
   * NO manual confirmation codes required for Google users.
   */
  public async loginWithFirebaseGoogle(firebaseResult: {
    idToken: string;
    user: {
      uid: string;
      email: string;
      displayName: string;
      photoURL?: string;
      emailVerified: boolean;
    };
  }): Promise<{ user: AuthUser; token: string; isNewUser: boolean; message: string }> {
    const payload = {
      id_token: firebaseResult.idToken,
    };

    // Attempt Laravel backend sync first
    try {
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const mappedUser: AuthUser = {
          id: data.user.id,
          firebase_uid: firebaseResult.user.uid,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar || firebaseResult.user.photoURL,
          role: data.user.role || 'viewer',
          role_ar: data.user.role_ar || 'مشاهد وباحث',
          email_verified: true,
          created_at: data.user.created_at,
        };

        this.currentUser = mappedUser;
        this.token = data.token;
        this.persistSession(mappedUser, data.token);
        this.notify();

        return {
          user: mappedUser,
          token: data.token,
          isNewUser: data.is_new_user ?? false,
          message: data.message || 'تم تسجيل الدخول بنجاح عبر Google',
        };
      }
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'تعذر التحقق من حساب Google على الخادم.');
    } catch (error) {
      if (error instanceof Error && error.message !== 'Failed to fetch') throw error;
      throw new Error('تعذر الاتصال بخادم الأرشيف للتحقق من حساب Google.');
    }
  }

  /**
   * Admin Endpoint: Update user role in Laravel and local cache.
   */
  public async updateUserRole(
    userId: string | number,
    newRole: UserRole
  ): Promise<{ success: boolean; message: string; updatedUser?: AuthUser }> {
    const roleArMap: Record<UserRole, string> = {
      super_admin: 'مدير أعلى',
      admin: 'مدير أرشيف',
      editor: 'محرر وباحث',
      contributor: 'مساهم',
      viewer: 'مشاهد وباحث',
      pending: 'معلق (بانتظار الاعتماد)',
    };

    // Attempt Laravel API first: PUT /api/v1/admin/users/:id/role
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          message: data.message || `تم ترقية الصلاحية إلى: ${roleArMap[newRole]}`,
          updatedUser: data.user,
        };
      }
    } catch {
      // The server is the only source of truth for roles.
    }

    return { success: false, message: 'تعذر تحديث الصلاحية من الخادم.' };
  }

  public getAllRegisteredUsers(): AuthUser[] {
    return [];
  }

  public async fetchAdminUsers(): Promise<{ users: AuthUser[] }> {
    try {
      const res = await fetch('/api/v1/admin/users', {
        headers: {
          'Accept': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const usersList = data.users?.data || data.users || [];
        if (Array.isArray(usersList) && usersList.length > 0) {
          return { users: usersList };
        }
      }
    } catch {
      // Fallback
    }
    return { users: [] };
  }

  private persistSession(user: AuthUser, token: string) {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      // Existing CMS panels read this key; keep it synchronized with the verified Sanctum token.
      localStorage.setItem(LEGACY_API_TOKEN_KEY, token);
      // Synchronize with app header role key
      const roleMap: Record<UserRole, string> = {
        super_admin: 'Admin',
        admin: 'Admin',
        editor: 'Editor',
        contributor: 'Visitor',
        viewer: 'Visitor',
        pending: 'Visitor',
      };
      localStorage.setItem('kha_auth_role', roleMap[user.role] || 'Visitor');
    } catch {
      // Fallback
    }
  }

  public async logout(): Promise<void> {
    try {
      await signOutFirebase();
      if (this.token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }).catch(() => { });
      }
    } catch {
      // Ignore network errors on logout
    }

    this.currentUser = null;
    this.token = null;
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(LEGACY_API_TOKEN_KEY);
      localStorage.removeItem('kha_auth_role');
    } catch {
      // Fallback
    }
    this.notify();
  }
}

export const authService = new AuthService();
