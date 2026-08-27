'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole, PermissionCode } from '@/types';
import { apiClient } from '@/lib/api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (...permissions: (PermissionCode | string)[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await apiClient.get('/auth/me');
        const userData = data.data || data;
        setUser(userData);
        setCookie('auth_token', token);
        setCookie('user_role', userData.role);
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        deleteCookie('auth_token');
        deleteCookie('user_role');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = (token: string, refreshToken: string, userData: User) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    setCookie('auth_token', token);
    setCookie('user_role', userData.role);
    setUser(userData);

    // Redirect to respective role portal
    switch (userData.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
      case 'PRINCIPAL':
        router.push('/admin');
        break;
      case 'TEACHER':
        router.push('/teacher');
        break;
      case 'STUDENT':
        router.push('/student');
        break;
      case 'PARENT':
        router.push('/parent');
        break;
      case 'ACCOUNTANT':
        router.push('/accountant');
        break;
      default:
        router.push('/');
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network failures on logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      deleteCookie('auth_token');
      deleteCookie('user_role');
      setUser(null);
      router.push('/login');
    }
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return roles.includes(user.role);
  };

  const hasPermission = (...permissions: (PermissionCode | string)[]) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    const userPerms = user.permissions || [];
    return permissions.every((p) => userPerms.includes(p));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
