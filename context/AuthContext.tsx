'use client';

import React, { createContext, useContext } from 'react';
import { CurrentUser, UserRole } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loginUser as loginUserThunk,
  logoutUser,
  ADMIN_DEMO_CREDENTIALS,
  VENDOR_DEMO_CREDENTIALS,
} from '../store/slices/authSlice';

export { ADMIN_DEMO_CREDENTIALS, VENDOR_DEMO_CREDENTIALS };

export const DEMO_CREDENTIALS = {
  admin: ADMIN_DEMO_CREDENTIALS,
  vendor: VENDOR_DEMO_CREDENTIALS,
};

interface AuthContextType {
  user: CurrentUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  activeViewMode: 'admin' | 'vendor';
  loading: boolean;
  error: string | null;
  login: (
    email: string,
    password?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, role, isAuthenticated, loading, error, initialized } = useAppSelector(
    (state) => state.auth
  );

  const activeViewMode: 'admin' | 'vendor' = role === 'vendor' ? 'vendor' : 'admin';

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await dispatch(loginUserThunk({ email, password })).unwrap();
      return { success: !!result };
    } catch (err: any) {
      return { success: false, error: err || 'Authentication failed' };
    }
  };

  const logout = () => {
    dispatch(logoutUser());
  };

  if (!initialized) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: role ?? null,
        isAuthenticated,
        activeViewMode,
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
