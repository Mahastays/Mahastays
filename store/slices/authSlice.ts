import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { getApiErrorMessage } from '../../lib/api';
import { CurrentUser, UserRole } from '../../types';

export const ADMIN_DEMO_CREDENTIALS = {
  email: 'bookingmahastays@gmail.com',
  password: 'Mahastays@2026',
  name: 'MahaStays Admin',
  title: 'Platform Owner & Executive Administrator',
  code: 'ADM-100',
  portalName: 'Admin Operations Portal',
};

export const VENDOR_DEMO_CREDENTIALS = {
  email: 'vendor@mahastays.com',
  password: 'vendor123',
  name: 'Vikramaditya Rao',
  title: 'Resort General Manager · HillView Hospitality',
  code: 'VND-3001',
  businessName: 'HillView Hospitality Pvt Ltd',
  portalName: 'Vendor Partner Portal',
};

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
      return rejectWithValue('Please enter your email address');
    }
    if (!password) {
      return rejectWithValue('Please enter your password');
    }

    // Determine target role from email or roleHint
    const isVendorHint =
      credentials.roleHint === 'vendor' ||
      trimmedEmail === 'vendor@mahastays.com' ||
      trimmedEmail === 'host@hillview.local' ||
      trimmedEmail === 'guide@sahyadri.local' ||
      (trimmedEmail.includes('vendor') && !trimmedEmail.includes('admin'));

    const isAdminHint =
      credentials.roleHint === 'admin' ||
      trimmedEmail === 'admin@mahastays.com' ||
      trimmedEmail === 'ops.lead@mahastays.local' ||
      trimmedEmail === 'compliance.lead@mahastays.local' ||
      trimmedEmail === 'superadmin@mahastays.local' ||
      trimmedEmail.includes('admin');

    // 1. Try Backend API
    try {
      if (isVendorHint) {
        // Try vendor endpoint
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
            avatar: rawUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
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
      } else {
        // Try admin endpoint
        const res = await api.post('/auth/admin/login', { email: trimmedEmail, password });
        const resData = res.data?.data || res.data;

        // Check if 2-step verification (email OTP) is required
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
            name: rawUser.fullName || rawUser.name || 'Operations Lead',
            email: rawUser.email || trimmedEmail,
            role: 'admin',
            avatar: rawUser.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
            title: rawUser.roleTitle || 'Operations Lead — Western Maharashtra',
            adminCode: rawUser.adminCode || 'ADM-100',
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('mahastays_auth_user', JSON.stringify(adminUser));
            localStorage.setItem('mahastays_auth_view_mode', 'admin');
          }
          return { user: adminUser, role: 'admin' as const, token, requiresOtp: false };
        }
      }
    } catch (apiErr: any) {
      // If error is not a network failure, try alternate role if ambiguous
      if (!isVendorHint && !isAdminHint) {
        try {
          const res = await api.post('/auth/vendor/login', { email: trimmedEmail, password });
          const token = res.data?.data?.accessToken || res.data?.accessToken;
          const rawUser = res.data?.data?.user || res.data?.user || res.data?.data?.profile;
          if (rawUser) {
            const vendorUser: CurrentUser = {
              id: rawUser.id || rawUser._id,
              name: rawUser.displayName || rawUser.businessName || rawUser.fullName || 'Vendor Partner',
              email: rawUser.email || trimmedEmail,
              role: 'vendor',
              avatar: rawUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
              title: `${rawUser.displayRole || 'Host'} · ${rawUser.businessName || 'Mahastays Partner'}`,
              businessName: rawUser.businessName || 'Hospitality Partner',
              vendorId: rawUser.id || rawUser._id,
              vendorCode: rawUser.vendorCode || 'VND-3001',
            };
            if (typeof window !== 'undefined') {
              localStorage.setItem('mahastays_auth_user', JSON.stringify(vendorUser));
              localStorage.setItem('mahastays_auth_view_mode', 'vendor');
              if (token) {
                localStorage.setItem('mahastays_admin_token', token);
                localStorage.setItem('mahastays_token', token);
              }
            }
            return { user: vendorUser, role: 'vendor' as const, token };
          }
        } catch {
          // Both failed, proceed to fallback
        }
      }

      const status = apiErr?.response?.status;
      if (status === 401 || status === 403) {
        return rejectWithValue(getApiErrorMessage(apiErr));
      }
    }

    // 2. Demo / Offline Fallback Mode
    const validPasswords = ['admin123', 'vendor123', 'demo@12345', 'admin', 'vendor'];
    if (!validPasswords.includes(password.toLowerCase())) {
      return rejectWithValue('Invalid credentials. Standard test passwords are: admin123 (Admin) or vendor123 (Vendor)');
    }

    const demoToken = 'mock_jwt_' + Date.now();

    // Check Vendor accounts
    if (isVendorHint || trimmedEmail === 'vendor@mahastays.com' || trimmedEmail === 'host@hillview.local') {
      const vendorUser: CurrentUser = {
        id: 'vnd_resort_01',
        name: 'Vikramaditya Rao',
        email: trimmedEmail,
        role: 'vendor',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        title: 'Resort General Manager · HillView Hospitality',
        businessName: 'HillView Hospitality Pvt Ltd',
        vendorId: 'vnd_resort_01',
        vendorCode: 'VND-3001',
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mahastays_auth_user', JSON.stringify(vendorUser));
        localStorage.setItem('mahastays_auth_view_mode', 'vendor');
        localStorage.setItem('mahastays_admin_token', demoToken);
      }
      return { user: vendorUser, role: 'vendor' as const, token: demoToken };
    }

    if (trimmedEmail === 'guide@sahyadri.local') {
      const vendorUser: CurrentUser = {
        id: 'vnd_adv_02',
        name: 'Rajesh Gaikwad',
        email: 'guide@sahyadri.local',
        role: 'vendor',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
        title: 'Chief Mountaineer & Pilot · Sahyadri Adventure Co.',
        businessName: 'Sahyadri Adventure Co.',
        vendorId: 'vnd_adv_02',
        vendorCode: 'VND-3002',
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mahastays_auth_user', JSON.stringify(vendorUser));
        localStorage.setItem('mahastays_auth_view_mode', 'vendor');
        localStorage.setItem('mahastays_admin_token', demoToken);
      }
      return { user: vendorUser, role: 'vendor' as const, token: demoToken };
    }

    // Default to Operations Lead Admin
    const adminUser: CurrentUser = {
      id: 'adm_ops_01',
      name: trimmedEmail === 'admin@mahastays.com' ? 'Ariana Davis' : trimmedEmail.split('@')[0],
      email: trimmedEmail,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
      title: 'Operations Lead — Western Maharashtra',
      adminCode: 'ADM-1001',
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('mahastays_auth_user', JSON.stringify(adminUser));
      localStorage.setItem('mahastays_auth_view_mode', 'admin');
      localStorage.setItem('mahastays_admin_token', demoToken);
    }
    return { user: adminUser, role: 'admin' as const, token: demoToken };
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
          email: rawUser.email || payload.email || 'bookingmahastays@gmail.com',
          role: 'admin',
          avatar: rawUser.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
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
          localStorage.getItem('mahastays_token');

        if (storedUser) {
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
