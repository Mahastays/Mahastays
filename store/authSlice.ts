import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../lib/api';

export interface UserPreferences {
  preferredLanguage?: string;
  currency?: string;
  dietaryPreference?: string;
}

export interface UserVerification {
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  governmentIdType?: string;
  governmentIdNumberMasked?: string;
  isIdVerified?: boolean;
}

export interface UserPostalAddress {
  addressLine1?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface UserProfile {
  id: string;
  _id?: string;
  userCode: string;
  fullName: string;
  email: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  phone?: {
    countryCode?: string;
    nationalNumber?: string;
    isVerified?: boolean;
  };
  bio?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: UserPostalAddress;
  preferences?: UserPreferences;
  verification?: UserVerification;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isClubMember?: boolean;
  membershipTier?: string;
  membership?: {
    isClubMember?: boolean;
    tier?: string;
    totalDiscountSavedInr?: number;
  };
  metrics?: {
    totalBookingsCount?: number;
    completedStaysCount?: number;
    totalSpentInr?: number;
    reviewsWrittenCount?: number;
  };
  totalBookingsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSessionResponse {
  user: UserProfile;
  profile?: UserProfile;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  role?: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  otpPhone: { countryCode: string; nationalNumber: string } | null;
  successMessage: string | null;
  requiresNameForOtp: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  otpSent: false,
  otpPhone: null,
  successMessage: null,
  requiresNameForOtp: false,
};

// Helper to save session to localStorage
function saveSession(data: { user?: any; profile?: any; accessToken?: string; token?: string }) {
  if (typeof window !== 'undefined') {
    const token = data.accessToken || data.token;
    const user = data.user || data.profile;
    if (token) {
      localStorage.setItem('mahastays_token', token);
    }
    if (user) {
      localStorage.setItem('mahastays_user', JSON.stringify(user));
    }
  }
}

// Helper to clear session from localStorage
function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mahastays_token');
    localStorage.removeItem('mahastays_user');
  }
}

// Helper to normalize backend auth responses
function normalizeAuthSession(raw: any): AuthSessionResponse {
  const user: UserProfile = raw?.user || raw?.profile || raw;
  const accessToken: string = raw?.accessToken || raw?.token || '';
  return {
    user,
    profile: user,
    accessToken,
    refreshToken: raw?.refreshToken,
    expiresAt: raw?.expiresAt,
    role: raw?.role || 'user',
  };
}

// ─────────────────────────────────────────────────────────────
// Async Thunks (Calling API from Store Slice via Axios)
// ─────────────────────────────────────────────────────────────

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export const signupUser = createAsyncThunk<
  AuthSessionResponse,
  SignupPayload,
  { rejectValue: string }
>('auth/signupUser', async (payload, { rejectWithValue }) => {
  try {
    const body: any = {
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    };
    if (payload.phone) {
      const digits = payload.phone.replace(/\D/g, '');
      const national = digits.length > 10 ? digits.slice(-10) : digits;
      body.phone = { countryCode: '+91', nationalNumber: national };
    }
    const res = await api.post('/auth/user/signup', body);
    const session = normalizeAuthSession(res.data?.data || res.data);
    saveSession(session);
    return session;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Registration failed');
  }
});

export interface EmailLoginPayload {
  email: string;
  password: string;
}

export const loginWithEmail = createAsyncThunk<
  AuthSessionResponse,
  EmailLoginPayload,
  { rejectValue: string }
>('auth/loginWithEmail', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/user/login', {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    });
    const session = normalizeAuthSession(res.data?.data || res.data);
    saveSession(session);
    return session;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Login failed. Check your email and password.');
  }
});

export interface PhoneOtpRequestPayload {
  phone: string;
  countryCode?: string;
}

export const requestPhoneOtp = createAsyncThunk<
  { countryCode: string; nationalNumber: string },
  PhoneOtpRequestPayload,
  { rejectValue: string }
>('auth/requestPhoneOtp', async (payload, { rejectWithValue }) => {
  try {
    const digits = payload.phone.replace(/\D/g, '');
    const nationalNumber = digits.length > 10 ? digits.slice(-10) : digits;
    const countryCode = payload.countryCode || '+91';

    await api.post('/auth/user/phone/request-otp', {
      phone: { countryCode, nationalNumber },
    });

    return { countryCode, nationalNumber };
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to send OTP to this phone number');
  }
});

export interface PhoneOtpVerifyPayload {
  phone: string;
  code: string;
  fullName?: string;
  countryCode?: string;
}

export const verifyPhoneOtp = createAsyncThunk<
  AuthSessionResponse,
  PhoneOtpVerifyPayload,
  { rejectValue: string }
>('auth/verifyPhoneOtp', async (payload, { rejectWithValue }) => {
  try {
    const digits = payload.phone.replace(/\D/g, '');
    const nationalNumber = digits.length > 10 ? digits.slice(-10) : digits;
    const countryCode = payload.countryCode || '+91';

    const res = await api.post('/auth/user/phone/verify-otp', {
      phone: { countryCode, nationalNumber },
      code: payload.code.trim(),
      fullName: payload.fullName?.trim() || undefined,
    });

    const session = normalizeAuthSession(res.data?.data || res.data);
    saveSession(session);
    return session;
  } catch (err: any) {
    return rejectWithValue(err.message || 'OTP verification failed');
  }
});

export interface GoogleLoginPayload {
  credential: string;
}

export const loginWithGoogle = createAsyncThunk<
  AuthSessionResponse,
  GoogleLoginPayload,
  { rejectValue: string }
>('auth/loginWithGoogle', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/user/google', {
      idToken: payload.credential,
    });
    const session = normalizeAuthSession(res.data?.data || res.data);
    saveSession(session);
    return session;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Google sign-in failed');
  }
});

export const fetchCurrentUser = createAsyncThunk<
  UserProfile,
  void,
  { rejectValue: string }
>('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    const raw = res.data?.data || res.data;
    const user: UserProfile = raw?.profile || raw?.user || raw;
    if (user && typeof window !== 'undefined') {
      localStorage.setItem('mahastays_user', JSON.stringify(user));
    }
    return user;
  } catch (err: any) {
    clearSession();
    return rejectWithValue(err.message || 'Session expired');
  }
});

export const updateUserProfile = createAsyncThunk<
  UserProfile,
  Partial<{
    fullName: string;
    avatarUrl: string | null;
    phone: { countryCode: string; nationalNumber: string };
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    preferences: {
      preferredLanguage?: 'en' | 'hi' | 'mr';
      currency?: 'INR';
      dietaryPreference?: 'veg' | 'non-veg' | 'jain' | 'vegan';
    };
  }>,
  { rejectValue: string }
>('auth/updateUserProfile', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.put('/users/me', payload);
    const user: UserProfile = res.data?.data || res.data;
    if (user && typeof window !== 'undefined') {
      localStorage.setItem('mahastays_user', JSON.stringify(user));
    }
    return user;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update profile');
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore
  } finally {
    clearSession();
  }
});

// ─────────────────────────────────────────────────────────────
// Auth Slice Definition
// ─────────────────────────────────────────────────────────────

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.otpPhone = null;
      state.requiresNameForOtp = false;
    },
    loadSavedAuth: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('mahastays_token');
        const userStr = localStorage.getItem('mahastays_user');
        if (token) {
          state.token = token;
          if (userStr && userStr !== 'undefined' && userStr !== 'null') {
            try {
              state.user = JSON.parse(userStr);
              state.isAuthenticated = true;
            } catch {
              state.user = null;
              state.isAuthenticated = true;
            }
          } else {
            state.isAuthenticated = true;
          }
        }
      }
    },
    updateUserLocal: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== 'undefined') {
          localStorage.setItem('mahastays_user', JSON.stringify(state.user));
        }
      }
    },
  },
  extraReducers: (builder) => {
    // ─── Signup ───
    builder
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.successMessage = 'Account created successfully! Welcome to Mahastays.';
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Signup failed';
      });

    // ─── Email Login ───
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.successMessage = 'Logged in successfully! Welcome back.';
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      });

    // ─── Phone OTP Request ───
    builder
      .addCase(requestPhoneOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(requestPhoneOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.otpPhone = action.payload;
        state.successMessage = `6-digit verification code sent to ${action.payload.countryCode} ${action.payload.nationalNumber}.`;
      })
      .addCase(requestPhoneOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to request OTP';
      });

    // ─── Phone OTP Verify ───
    builder
      .addCase(verifyPhoneOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(verifyPhoneOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.otpSent = false;
        state.otpPhone = null;
        state.requiresNameForOtp = false;
        state.successMessage = 'Phone verified! Logged in successfully.';
      })
      .addCase(verifyPhoneOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'OTP verification failed';
        if (action.payload?.includes('fullName') || action.payload?.includes('New number')) {
          state.requiresNameForOtp = true;
        }
      });

    // ─── Google Login ───
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.successMessage = 'Google login successful! Welcome to Mahastays.';
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Google sign-in failed';
      });

    // ─── Fetch Current User ───
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });

    // ─── Update Profile ───
    builder
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update profile';
      });

    // ─── Logout ───
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.otpSent = false;
      state.otpPhone = null;
      state.successMessage = null;
      state.error = null;
    });
  },
});

export const { clearAuthError, clearSuccessMessage, resetOtpState, loadSavedAuth, updateUserLocal } =
  authSlice.actions;

export default authSlice.reducer;
