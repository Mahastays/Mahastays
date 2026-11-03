'use client';

import React, { createContext, useContext } from 'react';
import { CurrentUser, UserRole } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loginUser as loginUserThunk,
  verifyAdminOtp as verifyAdminOtpThunk,
  resendAdminOtp as resendAdminOtpThunk,
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
    password?: string,
    roleHint?: 'admin' | 'vendor'
  ) => Promise<{ success: boolean; requiresOtp?: boolean; challengeToken?: string; email?: string; error?: string }>;
  verifyOtp: (
    challengeToken: string,
    code: string,
    email?: string
  ) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (challengeToken: string) => Promise<{ success: boolean; challengeToken?: string; error?: string }>;
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
    password?: string,
    roleHint?: 'admin' | 'vendor'
  ): Promise<{ success: boolean; requiresOtp?: boolean; challengeToken?: string; email?: string; error?: string }> => {
    try {
      const result: any = await dispatch(loginUserThunk({ email, password, roleHint })).unwrap();
      if (result?.requiresOtp) {
        return {
          success: false,
          requiresOtp: true,
          challengeToken: result.challengeToken,
          email: result.email,
        };
      }
      return { success: !!result };
    } catch (err: any) {
      return { success: false, error: err || 'Authentication failed' };
    }
  };

  const verifyOtp = async (
    challengeToken: string,
    code: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await dispatch(verifyAdminOtpThunk({ challengeToken, code, email })).unwrap();
      return { success: !!result };
    } catch (err: any) {
      return { success: false, error: err || 'Verification failed' };
    }
  };

  const resendOtp = async (
    challengeToken: string
  ): Promise<{ success: boolean; challengeToken?: string; error?: string }> => {
    try {
      const result: any = await dispatch(resendAdminOtpThunk({ challengeToken })).unwrap();
      return { success: true, challengeToken: result?.challengeToken };
    } catch (err: any) {
      return { success: false, error: err || 'Failed to resend code' };
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
        verifyOtp,
        resendOtp,
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
