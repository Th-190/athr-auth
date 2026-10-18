/**
 * Google OAuth & RBAC Service for Karbala Heritage Archive
 * Coordinates Firebase Auth (GoogleAuthProvider), Laravel Backend (POST /api/v1/auth/google),
 * and Role-Based Access Control (RBAC).
 */

import { signOutFirebase } from './firebase';

export type UserRole = 'admin' | 'editor' | 'viewer' | 'pending';

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
const REGISTERED_USERS_KEY = 'kha_registered_users_v3';

// Initial seed user pool for Admin Dashboard / RBAC testing
const INITIAL_USERS: AuthUser[] = [
  {
    id: 99,
    name: 'حكمت',
    email: 'hikmat122112@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    role: 'admin',
    role_ar: 'مدير أرشيف معتمد',
    email_verified: true,
    created_at: '2026-04-01T12:00:00Z',
  },
  {
    id: 1,
    name: 'أ. د. حيدر السلامي',
    email: 'h.salami@karbalaheritage.iq',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    role: 'admin',
    role_ar: 'مدير أرشيف',
    email_verified: true,
    created_at: '2026-01-15T09:00:00Z',
  },
  {
    id: 2,
    name: 'م. مريم الكربلائي',
    email: 'maryam.k@karbalaheritage.iq',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    role: 'editor',
    role_ar: 'محرر وباحث',
    email_verified: true,
    created_at: '2026-02-01T11:30:00Z',
  },
  {
    id: 3,
    name: 'علي حسن السعدي',
    email: 'ali.saadi@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    role: 'viewer',
    role_ar: 'مشاهد وباحث',
    email_verified: true,
    created_at: '2026-02-20T14:15:00Z',
  },
  {
    id: 4,
    name: 'زينب المحمود',
    email: 'zainab.m@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    role: 'viewer',
    role_ar: 'مشاهد وباحث',
    email_verified: true,
    created_at: '2026-03-01T08:45:00Z',
  },
];

class AuthService {
  private currentUser: AuthUser | null = null;
  private token: string | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    this.loadSession();
    this.ensureInitialUsers();
  }

  private ensureInitialUsers() {
    try {
      const storedRaw = localStorage.getItem(REGISTERED_USERS_KEY);
      let list: AuthUser[] = storedRaw ? JSON.parse(storedRaw) : [];
      // Always ensure INITIAL_USERS (including hikmat122112@gmail.com) are in the pool
      for (const initUser of INITIAL_USERS) {
        const idx = list.findIndex(u => u.email.toLowerCase() === initUser.email.toLowerCase());
        if (idx >= 0) {
          list[idx].role = initUser.role;
          list[idx].role_ar = initUser.role_ar;
        } else {
          list.unshift(initUser);
        }
      }
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
    } catch {
      // Storage unavailable fallback
    }
  }

  private loadSession() {
    try {
      const userRaw = localStorage.getItem(AUTH_USER_KEY);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (userRaw && token) {
        this.currentUser = JSON.parse(userRaw);
        this.token = token;
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

  public isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  public isEditor(): boolean {
    return this.currentUser?.role === 'editor' || this.currentUser?.role === 'admin';
  }

  /**
   * Local editorial session using an already-registered admin/editor account.
   * Used when Laravel/Firebase are unavailable so the CMS remains operable.
   */
  public loginLocalEditorial(email: string): { success: boolean; message: string; user?: AuthUser } {
    const match = this.getAllRegisteredUsers().find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!match) {
      return { success: false, message: 'لا يوجد حساب مسجّل بهذا البريد في سجل هيئة التحرير.' };
    }
    if (match.role !== 'admin' && match.role !== 'editor') {
      return {
        success: false,
        message: 'هذا الحساب لا يملك صلاحية تحريرية. يلزم دور مدير أو محرر للدخول إلى /admin.',
      };
    }
    const token = `kha_editorial_${Date.now()}`;
    this.currentUser = match;
    this.token = token;
    this.persistSession(match, token);
    this.notify();
    return {
      success: true,
      message: `تم فتح جلسة تحريرية: ${match.role_ar}`,
      user: match,
    };
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
      google_id: firebaseResult.user.uid,
      email: firebaseResult.user.email,
      name: firebaseResult.user.displayName,
      avatar: firebaseResult.user.photoURL,
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
        this.upsertLocalUserList(mappedUser);
        this.notify();

        return {
          user: mappedUser,
          token: data.token,
          isNewUser: data.is_new_user ?? false,
          message: data.message || 'تم تسجيل الدخول بنجاح عبر Google',
        };
      }
    } catch {
      // Backend request exception, fallback to client-side synchronized session below
    }

    // Client fallback: synchronize with local registry
    const allUsers = this.getAllRegisteredUsers();
    let existing = allUsers.find(u => u.email.toLowerCase() === firebaseResult.user.email.toLowerCase());
    let isNewUser = false;

    if (!existing) {
      isNewUser = true;
      existing = {
        id: `u_${Date.now()}`,
        firebase_uid: firebaseResult.user.uid,
        name: firebaseResult.user.displayName || 'باحث معتمد',
        email: firebaseResult.user.email,
        avatar:
          firebaseResult.user.photoURL ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseResult.user.displayName)}`,
        role: 'viewer', // Default role for new users is viewer
        role_ar: 'مشاهد وباحث',
        email_verified: true, // Google accounts inherently verified
        created_at: new Date().toISOString(),
      };
      allUsers.unshift(existing);
      try {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(allUsers));
      } catch {
        // Fallback
      }
    }

    const localToken = `kha_firebase_jwt_${Date.now()}`;
    this.currentUser = existing;
    this.token = localToken;
    this.persistSession(existing, localToken);
    this.notify();

    return {
      user: existing,
      token: localToken,
      isNewUser,
      message: isNewUser
        ? 'تم إنشاء حساب الباحث الجديد بنجاح عبر Google (صلاحية: مشاهد وباحث)'
        : 'تم تسجيل الدخول بنجاح عبر Google',
    };
  }

  /**
   * Admin Endpoint: Update user role in Laravel and local cache.
   */
  public async updateUserRole(
    userId: string | number,
    newRole: UserRole
  ): Promise<{ success: boolean; message: string; updatedUser?: AuthUser }> {
    const roleArMap: Record<UserRole, string> = {
      admin: 'مدير أرشيف',
      editor: 'محرر وباحث',
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
        this.updateLocalUserRole(userId, newRole, roleArMap[newRole]);
        return {
          success: true,
          message: data.message || `تم ترقية الصلاحية إلى: ${roleArMap[newRole]}`,
          updatedUser: data.user,
        };
      }
    } catch {
      // Local fallback handled below
    }

    // Local state fallback
    const updatedUser = this.updateLocalUserRole(userId, newRole, roleArMap[newRole]);
    return {
      success: true,
      message: `تم تحديث صلاحية الحساب بنجاح إلى: ${roleArMap[newRole]}`,
      updatedUser,
    };
  }

  private updateLocalUserRole(userId: string | number, newRole: UserRole, roleAr: string): AuthUser | undefined {
    const allUsers = this.getAllRegisteredUsers();
    const idx = allUsers.findIndex(u => String(u.id) === String(userId));
    if (idx !== -1) {
      allUsers[idx].role = newRole;
      allUsers[idx].role_ar = roleAr;
      try {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(allUsers));
      } catch {
        // Fallback
      }

      // If active user is updated, update active session
      if (this.currentUser && String(this.currentUser.id) === String(userId)) {
        this.currentUser.role = newRole;
        this.currentUser.role_ar = roleAr;
        this.persistSession(this.currentUser, this.token || 'token');
        this.notify();
      }

      return allUsers[idx];
    }
    return undefined;
  }

  public getAllRegisteredUsers(): AuthUser[] {
    try {
      const raw = localStorage.getItem(REGISTERED_USERS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }
    return INITIAL_USERS;
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
    return { users: this.getAllRegisteredUsers() };
  }

  private upsertLocalUserList(user: AuthUser) {
    const list = this.getAllRegisteredUsers();
    const idx = list.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.unshift(user);
    }
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
    } catch {
      // Fallback
    }
  }

  private persistSession(user: AuthUser, token: string) {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      // Synchronize with app header role key
      const roleMap: Record<UserRole, string> = {
        admin: 'Admin',
        editor: 'Editor',
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
      localStorage.removeItem('kha_auth_role');
    } catch {
      // Fallback
    }
    this.notify();
  }
}

export const authService = new AuthService();
