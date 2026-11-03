import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { VendorItem } from '../../types';

interface VendorsState {
  items: VendorItem[];
  loading: boolean;
  error: string | null;
}

const getStoredVendors = (): VendorItem[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mahastays_db_vendors');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && !parsed.some((v: any) => v.id === 'vnd_resort_01' && !v.businessType)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return [];
};

const saveVendors = (items: VendorItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mahastays_db_vendors', JSON.stringify(items));
    } catch {
      // ignore
    }
  }
};

const initialState: VendorsState = {
  items: getStoredVendors(),
  loading: false,
  error: null,
};

export const normalizeVendor = (raw: any): VendorItem => ({
  id: raw.id || raw._id,
  vendorCode: raw.vendorCode || 'VND-3001',
  businessName: raw.businessName || 'Hospitality Partner',
  displayName: raw.displayName || raw.businessName || 'Vendor Partner',
  displayRole: raw.displayRole || 'Host & Partner',
  experienceSummary: raw.experienceSummary || 'Verified Partner',
  category: raw.category || 'property_host',
  avatarUrl: raw.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  email: raw.email || '',
  phone: raw.phone || '',
  status: raw.status || 'active',
  compliance: {
    panNumber: raw.compliance?.panNumber || 'ABCDE1234F',
    gstin: raw.compliance?.gstin || '27ABCDE1234F1Z5',
    tourismLicenseNumber: raw.compliance?.tourismLicenseNumber || 'MTDC/2026/089',
    verificationStatus: raw.compliance?.verificationStatus || 'approved',
  },
  banking: {
    bankName: raw.banking?.bankName || 'HDFC Bank',
    accountHolderName: raw.banking?.accountHolderName || raw.businessName || 'Hospitality Partner',
    accountNumberLast4: raw.banking?.accountNumberLast4 || (raw.banking?.accountNumberMasked ? raw.banking.accountNumberMasked.slice(-4) : '4821'),
    ifscCode: raw.banking?.ifscCode || 'HDFC0001234',
    isAccountVerified: raw.banking?.isAccountVerified ?? true,
  },
  wallet: {
    availableInr: raw.wallet?.availableInr ?? raw.wallet?.availablePayoutBalanceInr ?? 0,
    pendingInr: raw.wallet?.pendingInr ?? raw.wallet?.pendingClearanceBalanceInr ?? 0,
    lifetimeEarningsInr: raw.wallet?.lifetimeEarningsInr ?? raw.wallet?.totalLifetimeEarningsInr ?? 0,
    lifetimeCommissionInr: raw.wallet?.lifetimeCommissionInr ?? raw.wallet?.totalLifetimeCommissionPaidInr ?? 0,
  },
  commissionTerms: raw.commissionTerms
    ? {
        commissionType: raw.commissionTerms.commissionType || 'percentage',
        propertyCommissionRatePercent: raw.commissionTerms.propertyCommissionRatePercent ?? 12,
        packageCommissionRatePercent: raw.commissionTerms.packageCommissionRatePercent ?? 10,
        experienceCommissionRatePercent: raw.commissionTerms.experienceCommissionRatePercent ?? 15,
        payoutCycle: raw.commissionTerms.payoutCycle || 'monthly',
      }
    : {
        commissionType: 'percentage',
        propertyCommissionRatePercent: 12,
        packageCommissionRatePercent: 10,
        experienceCommissionRatePercent: 15,
        payoutCycle: 'monthly',
      },
});

export const fetchVendors = createAsyncThunk('vendors/fetchVendors', async () => {
  try {
    const res = await api.get('/admin/vendors');
    const rawList = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data?.data?.items)
      ? res.data.data.items
      : Array.isArray(res.data)
      ? res.data
      : null;
    if (Array.isArray(rawList)) {
      const normalized = rawList.map(normalizeVendor);
      saveVendors(normalized);
      return normalized;
    }
  } catch {
    // Offline fallback
  }
  return getStoredVendors().map(normalizeVendor);
});

export const createVendorAsync = createAsyncThunk(
  'vendors/createVendor',
  async (
    vendorData: {
      email: string;
      password: string;
      businessName?: string;
      displayName?: string;
      phone?: string;
      category?: 'property_host' | 'activity_operator' | 'integrated_resort';
      businessType?: 'individual' | 'proprietorship' | 'private_limited' | 'partnership';
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post('/admin/vendors', vendorData);
      const createdRaw = res.data?.data || res.data;
      if (createdRaw) {
        return normalizeVendor(createdRaw);
      }
      return rejectWithValue('Invalid response from server');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create vendor');
    }
  }
);

export const verifyVendorKYCAsync = createAsyncThunk(
  'vendors/verifyKYC',
  async ({ vendorId, approve }: { vendorId: string; approve: boolean }, { getState }) => {
    try {
      await api.patch(`/admin/vendors/${vendorId}/kyc`, { approve });
    } catch {
      // Offline fallback
    }
    const state = getState() as { vendors: VendorsState };
    const next = state.vendors.items.map((v) =>
      v.id === vendorId
        ? {
            ...v,
            compliance: {
              ...v.compliance,
              verificationStatus: (approve ? 'approved' : 'rejected') as any,
            },
            status: (approve ? 'active' : 'on_hold') as any,
          }
        : v
    );
    saveVendors(next);
    return next;
  }
);

export const verifyVendorBankAsync = createAsyncThunk(
  'vendors/verifyBank',
  async ({ vendorId, verified }: { vendorId: string; verified: boolean }, { getState }) => {
    try {
      await api.patch(`/admin/vendors/${vendorId}/bank`, { verified });
    } catch {
      // Offline fallback
    }
    const state = getState() as { vendors: VendorsState };
    const next = state.vendors.items.map((v) =>
      v.id === vendorId
        ? {
            ...v,
            banking: {
              ...v.banking,
              isAccountVerified: verified,
            },
          }
        : v
    );
    saveVendors(next);
    return next;
  }
);

export const updateVendorCommissionAsync = createAsyncThunk(
  'vendors/updateCommission',
  async (
    {
      vendorId,
      terms,
    }: {
      vendorId: string;
      terms: {
        commissionType?: 'percentage' | 'fixed';
        propertyCommissionRatePercent?: number;
        packageCommissionRatePercent?: number;
        experienceCommissionRatePercent?: number;
        payoutCycle?: 'weekly' | 'biweekly' | 'monthly';
      };
    },
    { getState }
  ) => {
    let updatedVendor: VendorItem | null = null;
    try {
      const res = await api.put(`/admin/vendors/${vendorId}/commission`, terms);
      if (res.data?.data) {
        updatedVendor = normalizeVendor(res.data.data);
      }
    } catch {
      // offline fallback
    }

    const state = getState() as { vendors: VendorsState };
    const next = state.vendors.items.map((v) => {
      if (v.id === vendorId) {
        return updatedVendor || {
          ...v,
          commissionTerms: {
            ...v.commissionTerms,
            ...terms,
          },
        };
      }
      return v;
    });

    saveVendors(next);
    return next;
  }
);

export const updateVendorProfileAsync = createAsyncThunk(
  'vendors/updateVendorProfile',
  async (
    {
      vendorId,
      data,
    }: {
      vendorId: string;
      data: {
        email?: string;
        password?: string;
        businessName?: string;
        displayName?: string;
        displayRole?: string;
        phone?: string;
        category?: 'property_host' | 'activity_operator' | 'integrated_resort';
        businessType?: 'individual' | 'proprietorship' | 'private_limited' | 'partnership';
        experienceSummary?: string;
        avatarUrl?: string;
        panNumber?: string;
        gstin?: string;
        tourismLicenseNumber?: string;
        primaryContactPerson?: string;
        addressLine1?: string;
        city?: string;
        state?: string;
        pincode?: string;
      };
    },
    { getState }
  ) => {
    let updatedVendor: VendorItem | null = null;
    try {
      const res = await api.patch(`/admin/vendors/${vendorId}`, data);
      if (res.data?.data) {
        updatedVendor = normalizeVendor(res.data.data);
      }
    } catch {
      // Offline fallback
    }

    const state = getState() as { vendors: VendorsState };
    const next = state.vendors.items.map((v) => {
      if (v.id === vendorId || v.vendorCode === vendorId) {
        if (updatedVendor) return updatedVendor;
        return {
          ...v,
          email: data.email || v.email,
          businessName: data.businessName || v.businessName,
          displayName: data.displayName || v.displayName,
          displayRole: data.displayRole || v.displayRole,
          phone: data.phone || v.phone,
          category: data.category || v.category,
          avatarUrl: data.avatarUrl || v.avatarUrl,
          experienceSummary: data.experienceSummary !== undefined ? data.experienceSummary : v.experienceSummary,
          compliance: {
            ...v.compliance,
            panNumber: data.panNumber || v.compliance.panNumber,
            gstin: data.gstin !== undefined ? data.gstin : v.compliance.gstin,
            tourismLicenseNumber: data.tourismLicenseNumber !== undefined ? data.tourismLicenseNumber : v.compliance.tourismLicenseNumber,
          },
        };
      }
      return v;
    });

    saveVendors(next);
    return {
      updatedItem: updatedVendor || next.find((v) => v.id === vendorId || v.vendorCode === vendorId),
      items: next,
    };
  }
);

export const vendorsSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {
    setVendorsList: (state, action: PayloadAction<VendorItem[]>) => {
      state.items = action.payload;
      saveVendors(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(createVendorAsync.fulfilled, (state, action) => {
        if (action.payload) {
          // Remove existing with same id if any, and unshift
          state.items = [action.payload, ...state.items.filter((v) => v.id !== action.payload.id)];
          saveVendors(state.items);
        }
      })
      .addCase(verifyVendorKYCAsync.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(verifyVendorBankAsync.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(updateVendorCommissionAsync.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(updateVendorProfileAsync.fulfilled, (state, action) => {
        state.items = action.payload.items as VendorItem[];
      });
  },
});

export const { setVendorsList } = vendorsSlice.actions;
export default vendorsSlice.reducer;
