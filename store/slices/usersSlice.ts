import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../lib/api';

export interface AdminUserItem {
  id: string;
  _id?: string;
  userCode: string;
  fullName: string;
  email: string;
  phone?: {
    countryCode?: string;
    nationalNumber?: string;
    isVerified?: boolean;
  } | null;
  phoneNumber?: string;
  phoneCountryCode?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  membership?: {
    isClubMember?: boolean;
    tier?: string;
    joinedAt?: string;
    expiresAt?: string;
    totalDiscountSavedInr?: number;
  };
  verification?: {
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    governmentIdType?: string;
    governmentIdNumberMasked?: string;
    isIdVerified?: boolean;
  };
  metrics?: {
    totalBookingsCount?: number;
    completedStaysCount?: number;
    totalSpentInr?: number;
    reviewsWrittenCount?: number;
  };
  totalBookingsCount?: number;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt?: string;
}

interface UsersState {
  items: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  items: [],
  total: 0,
  page: 1,
  limit: 15,
  totalPages: 1,
  loading: false,
  error: null,
};

export const fetchAdminUsers = createAsyncThunk(
  'users/fetchAdminUsers',
  async (
    params: { page?: number; limit?: number; q?: string; status?: string } | undefined,
    { rejectWithValue }
  ) => {
    const page = params?.page || 1;
    const limit = params?.limit || 15;
    try {
      const res = await api.get('/admin/users', {
        params: {
          page,
          limit,
          q: params?.q || undefined,
          status: params?.status || undefined,
        },
      });
      const data = res.data?.data || res.data?.items || res.data || [];
      const meta = res.data?.meta || {};
      return {
        items: Array.isArray(data) ? data : [],
        total: meta.total ?? (Array.isArray(data) ? data.length : 0),
        page: meta.page ?? page,
        limit: meta.limit ?? limit,
        totalPages: meta.totalPages ?? Math.ceil((meta.total || data.length || 1) / limit),
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch users');
    }
  }
);

export const deleteAdminUserAsync = createAsyncThunk(
  'users/deleteAdminUser',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/users/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete user');
    }
  }
);

export const updateUserStatusAsync = createAsyncThunk(
  'users/updateUserStatus',
  async (
    { id, status, reason }: { id: string; status: 'active' | 'suspended'; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { status, reason: reason || 'Administrative action' });
      return { id, status };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update user status');
    }
  }
);

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteAdminUserAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((u) => u.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        state.totalPages = Math.max(1, Math.ceil(state.total / state.limit));
      })
      .addCase(updateUserStatusAsync.fulfilled, (state, action) => {
        state.items = state.items.map((u) =>
          u.id === action.payload.id ? { ...u, status: action.payload.status } : u
        );
      });
  },
});

export const { setPage } = usersSlice.actions;
export default usersSlice.reducer;

