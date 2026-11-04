import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { getApiErrorMessage } from '../../lib/api';
import { CurrentUser, UserRole } from '../../types';



interface AuthState {
  user: CurrentUser | null;
  token: string | null;
  role: 'admin' | 'vendor' | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  initialized: false,
};

// Unified Login Thunk for both Admin and Vendor
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (
    credentials: { email: string; password?: string; roleHint?: 'admin' | 'vendor' },
    { rejectWithValue }
  ) => {
    const trimmedEmail = credentials.email.trim().toLowerCase();
    const password = credentials.password?.trim() || '';

    if (!trimmedEmail) {
      return rejectWithValue('Please enter your registered email address');
    }
    if (!password) {
      return rejectWithValue('Please enter your password');
    }

    const isExplicitVendor = credentials.roleHint === 'vendor';
    const isExplicitAdmin = credentials.roleHint === 'admin';

    // 1. Explicit Vendor Login
    if (isExplicitVendor) {
      try {
        const res = await api.post('/auth/vendor/login', { email: trimmedEmail, password });
        const token = res.data?.data?.accessToken || res.data?.accessToken;
        const rawUser = res.data?.data?.user || res.data?.user || res.data?.data?.profile;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('mahastays_admin_token', token);
          localStorage.setItem('mahastays_token', token);
        }
        if (rawUser) {
          const vendorUser: CurrentUser = {
            id: rawUser.id || rawUser._id,
            name: rawUser.displayName || rawUser.businessName || rawUser.fullName || 'Vendor Partner',
            email: rawUser.email || trimmedEmail,
            role: 'vendor',
            avatar: rawUser.avatarUrl || '',
            title: `${rawUser.displayRole || 'Host'} · ${rawUser.businessName || 'Mahastays Partner'}`,
            businessName: rawUser.businessName || 'Hospitality Partner',
            vendorId: rawUser.id || rawUser._id,
            vendorCode: rawUser.vendorCode || 'VND-3001',
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('mahastays_auth_user', JSON.stringify(vendorUser));
            localStorage.setItem('mahastays_auth_view_mode', 'vendor');
          }
          return { user: vendorUser, role: 'vendor' as const, token };
        }
        return rejectWithValue('Invalid vendor credentials');
      } catch (err: any) {
        return rejectWithValue(getApiErrorMessage(err) || 'Invalid vendor email or password');
      }
    }

    // 2. Explicit Admin Login
    if (isExplicitAdmin) {
      try {
        const res = await api.post('/auth/admin/login', { email: trimmedEmail, password });
        const resData = res.data?.data || res.data;

        if (resData?.twoFactorRequired || resData?.requiresOtp) {
          return {
            requiresOtp: true,
            challengeToken: resData.challengeToken,
            email: resData.email || trimmedEmail,
            message: resData.message || `A 6-digit verification code was sent to ${resData.email || trimmedEmail}`,
          };
        }

        const token = resData?.accessToken || res.data?.accessToken;
        const rawUser = resData?.user || resData?.profile || res.data?.user;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('mahastays_admin_token', token);
          localStorage.setItem('mahastays_token', token);
        }
        if (rawUser) {
          const adminUser: CurrentUser = {
            id: rawUser.id || rawUser._id,
            name: rawUser.fullName || rawUser.name || 'Platform Administrator',
            email: rawUser.email || trimmedEmail,
            role: 'admin',
            avatar: rawUser.avatarUrl || '',
            title: rawUser.roleTitle || 'Executive Administrator',
            adminCode: rawUser.adminCode || 'ADM-100',
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('mahastays_auth_user', JSON.stringify(adminUser));
            localStorage.setItem('mahastays_auth_view_mode', 'admin');
          }
          return { user: adminUser, role: 'admin' as const, token, requiresOtp: false };
        }
        return rejectWithValue('Invalid administrator credentials');
      } catch (err: any) {
        return rejectWithValue(getApiErrorMessage(err) || 'Invalid administrator email or password');
      }
    }

    // 3. Unified Auto-Detect (tries admin first, then vendor)
    try {
      const res = await api.post('/auth/admin/login', { email: trimmedEmail, password });
      const resData = res.data?.data || res.data;

      if (resData?.twoFactorRequired || resData?.requiresOtp) {
        return {
          requiresOtp: true,
          challengeToken: resData.challengeToken,
          email: resData.email || trimmedEmail,
          message: resData.message || `A 6-digit verification code was sent to ${resData.email || trimmedEmail}`,
        };
      }

      const token = resData?.accessToken || res.data?.accessToken;
      const rawUser = resData?.user || resData?.profile || res.data?.user;
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('mahastays_admin_token', token);
        localStorage.setItem('mahastays_token', token);
      }
      if (rawUser) {
        const adminUser: CurrentUser = {
          id: rawUser.id || rawUser._id,
          name: rawUser.fullName || rawUser.name || 'Platform Administrator',
          email: rawUser.email || trimmedEmail,
          role: 'admin',
          avatar: rawUser.avatarUrl || '',
          title: rawUser.roleTitle || 'Executive Administrator',
          adminCode: rawUser.adminCode || 'ADM-100',
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('mahastays_auth_user', JSON.stringify(adminUser));
          localStorage.setItem('mahastays_auth_view_mode', 'admin');
        }
        return { user: adminUser, role: 'admin' as const, token, requiresOtp: false };
      }
    } catch (adminErr: any) {
      try {
        const res = await api.post('/auth/vendor/login', { email: trimmedEmail, password });
        const token = res.data?.data?.accessToken || res.data?.accessToken;
        const rawUser = res.data?.data?.user || res.data?.user || res.data?.data?.profile;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('mahastays_admin_token', token);
          localStorage.setItem('mahastays_token', token);
        }
        if (rawUser) {
          const vendorUser: CurrentUser = {
            id: rawUser.id || rawUser._id,
            name: rawUser.displayName || rawUser.businessName || rawUser.fullName || 'Vendor Partner',
            email: rawUser.email || trimmedEmail,
            role: 'vendor',
            avatar: rawUser.avatarUrl || '',
            title: `${rawUser.displayRole || 'Host'} · ${rawUser.businessName || 'Mahastays Partner'}`,
            businessName: rawUser.businessName || 'Hospitality Partner',
            vendorId: rawUser.id || rawUser._id,
            vendorCode: rawUser.vendorCode || 'VND-3001',
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('mahastays_auth_user', JSON.stringify(vendorUser));
            localStorage.setItem('mahastays_auth_view_mode', 'vendor');
          }
          return { user: vendorUser, role: 'vendor' as const, token };
        }
      } catch {
        return rejectWithValue(getApiErrorMessage(adminErr) || 'Invalid email or password. Please verify your credentials.');
      }
    }

    return rejectWithValue('Authentication failed. Please verify your credentials.');
  }
);

// Backward-compatible thunks that invoke loginUser
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials: { email: string; password?: string }, { dispatch }) => {
    return (await dispatch(loginUser({ ...credentials, roleHint: 'admin' }))).payload as any;
  }
);

export const loginVendor = createAsyncThunk(
  'auth/loginVendor',
  async (credentials: { email: string; password?: string }, { dispatch }) => {
    return (await dispatch(loginUser({ ...credentials, roleHint: 'vendor' }))).payload as any;
  }
);

// Verify Admin Email OTP Thunk
export const verifyAdminOtp = createAsyncThunk(
  'auth/verifyAdminOtp',
  async (
    payload: { challengeToken: string; code: string; email?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post('/auth/admin/login/verify-otp', {
        challengeToken: payload.challengeToken,
        code: payload.code.trim(),
      });
      const data = res.data?.data || res.data;
      const token = data?.accessToken || res.data?.accessToken;
      const rawUser = data?.user || data?.profile || res.data?.user;

      if (token && typeof window !== 'undefined') {
        localStorage.setItem('mahastays_admin_token', token);
        localStorage.setItem('mahastays_token', token);
      }
      if (rawUser) {
        const adminUser: CurrentUser = {
          id: rawUser.id || rawUser._id,
          name: rawUser.fullName || rawUser.name || 'MahaStays Admin',
          email: rawUser.email || payload.email || '[EMAIL_ADDRESS]',
          role: 'admin',
          avatar: rawUser.avatarUrl || '',
          title: rawUser.roleTitle || 'Platform Owner & Executive Administrator',
          adminCode: rawUser.adminCode || 'ADM-100',
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('mahastays_auth_user', JSON.stringify(adminUser));
          localStorage.setItem('mahastays_auth_view_mode', 'admin');
        }
        return { user: adminUser, role: 'admin' as const, token };
      }
      return rejectWithValue('Invalid response from authentication server');
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err) || 'Invalid verification code');
    }
  }
);

// Resend Admin OTP Thunk
export const resendAdminOtp = createAsyncThunk(
  'auth/resendAdminOtp',
  async (payload: { challengeToken: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/admin/login/resend-otp', {
        challengeToken: payload.challengeToken,
      });
      const data = res.data?.data || res.data;
      return data;
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err) || 'Failed to resend verification code');
    }
  }
);

export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// Async Thunk: Logout
export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mahastays_auth_user');
    localStorage.removeItem('mahastays_auth_view_mode');
    localStorage.removeItem('mahastays_admin_token');
    localStorage.removeItem('mahastays_auth_token');
    localStorage.removeItem('mahastays_token');
  }
  return true;
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loadSavedAuth: (state) => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('mahastays_auth_user');
        const token =
          localStorage.getItem('mahastays_admin_token') ||
          localStorage.getItem('mahastays_auth_token') ||
          localStorage.getItem('mahastays_token');

        // Check if existing token has expired
        if (token && isTokenExpired(token)) {
          localStorage.removeItem('mahastays_auth_user');
          localStorage.removeItem('mahastays_auth_view_mode');
          localStorage.removeItem('mahastays_admin_token');
          localStorage.removeItem('mahastays_auth_token');
          localStorage.removeItem('mahastays_token');

          state.user = null;
          state.role = null;
          state.isAuthenticated = false;
          state.token = null;
          state.initialized = true;

          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login')) {
            const redirectParam = encodeURIComponent(currentPath + (window.location.search || ''));
            window.location.href = `/login?session_expired=true&redirect=${redirectParam}`;
          }
          return;
        }

        if (storedUser && token) {
          try {
            const parsed = JSON.parse(storedUser);
            state.user = parsed;
            state.role = parsed.role === 'vendor' ? 'vendor' : 'admin';
            state.isAuthenticated = true;
            state.token = token;
          } catch {
            state.user = null;
            state.role = null;
            state.isAuthenticated = false;
            state.token = null;
          }
        } else {
          state.user = null;
          state.role = null;
          state.isAuthenticated = false;
          state.token = null;
        }
      }
      state.initialized = true;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Unified login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.requiresOtp) {
          state.isAuthenticated = false;
          state.error = null;
          return;
        }
        if (action.payload?.user) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.role = action.payload.role ?? null;
          state.token = action.payload.token ?? null;
          state.error = null;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Authentication failed. Please check credentials.';
      })
      // Verify Admin OTP
      .addCase(verifyAdminOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyAdminOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(verifyAdminOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Invalid verification code';
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { loadSavedAuth, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
