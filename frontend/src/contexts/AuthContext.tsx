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
      // Token expired — try to refresh it
      if (err.message?.includes('401') || err.message?.includes('expired') || err.message?.includes('Invalid')) {
        const refreshToken = localStorage.getItem('cms_refresh');
        if (refreshToken) {
          try {
            const refreshRes = await post<{ accessToken: string; refreshToken: string }>(
              '/auth/refresh', { refreshToken }
            );
            localStorage.setItem('cms_token', refreshRes.accessToken);
            localStorage.setItem('cms_refresh', refreshRes.refreshToken);
            const meRes = await api<{ user: User }>('/auth/me');
            setUserState(meRes.user);
            setLoading(false);
            return;
          } catch {
            // refresh also failed — clear everything
          }
        }
      }
      localStorage.removeItem('cms_token');
      localStorage.removeItem('cms_refresh');
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await post<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/login', { email, password }
    );
    localStorage.setItem('cms_token', res.accessToken);
    localStorage.setItem('cms_refresh', res.refreshToken);
    setUserState(res.user);
    return res.user;
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
