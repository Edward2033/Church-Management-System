import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, post } from '@/lib/api';
import type { User } from '@/lib/api';

interface AuthState {
  user: User | null;
  member: User | null;        // alias for user — used by dashboards
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
  setMember: (u: User) => void; // alias for setUser
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('cms_token');
    if (!token) { setUserState(null); setLoading(false); return; }
    try {
      const res = await api<{ user: User }>('/auth/me');
      setUserState(res.user);
    } catch (err: any) {
      // api() already attempted token refresh and called forceLogout if it failed.
      // Just clear local state here.
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, password: string): Promise<User> => {
    // Step 1: authenticate and get tokens
    const res = await post<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/login', { email, password }
    );
    localStorage.setItem('cms_token', res.accessToken);
    localStorage.setItem('cms_refresh', res.refreshToken);

    // Step 2: fetch full profile from /auth/me so every field is populated
    // (login response only returns a subset of fields)
    try {
      const meRes = await api<{ user: User }>('/auth/me');
      setUserState(meRes.user);
      return meRes.user;
    } catch {
      // /auth/me failed for some reason — fall back to login payload
      setUserState(res.user);
      return res.user;
    }
  };

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_refresh');
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      member: user,           // alias
      loading,
      login,
      logout,
      refresh,
      setUser: setUserState,
      setMember: setUserState, // alias
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
