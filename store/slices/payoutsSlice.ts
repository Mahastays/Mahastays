import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export interface PayoutItem {
  id: string;
  payoutReference: string;
  vendorId: string;
  vendorName?: string;
  grossBookingsAmountInr: number;
  platformCommissionDeductedInr: number;
  tdsRatePercent: number;
  tdsDeductedInr: number;
  netPayableAmountInr: number;
  bankTransferDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    utrNumber?: string;
    transferMethod?: string;
  };
  status: 'requested' | 'audited_by_admin' | 'released_by_superadmin' | 'completed' | 'failed';
  notes?: string;
  failureReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VendorWalletData {
  pendingClearanceBalanceInr: number;
  availablePayoutBalanceInr: number;
  totalLifetimeEarningsInr: number;
  totalLifetimeCommissionPaidInr: number;
  banking?: {
    accountHolderName?: string;
    accountNumberLast4?: string;
    bankName?: string;
    ifscCode?: string;
    isAccountVerified?: boolean;
  } | null;
}

export interface VendorSettlementItem {
  vendorId: string;
  vendorCode: string;
  businessName: string;
  displayName: string;
  category: string;
  email: string;
  phone: string;
  commissionRatePercent: number;
  banking: {
    accountHolderName: string;
    bankName: string;
    accountNumberMasked: string;
    ifscCode: string;
    branchName?: string | null;
    upiId?: string | null;
    isAccountVerified: boolean;
  } | null;
  totalBookingsCount: number;
  grossRevenueInr: number;
  platformCommissionInr: number;
  netRevenueInr: number;
  amountSettledInr: number;
  pendingSettlementInr: number;
  walletAvailableInr: number;
  walletPendingInr: number;
  pendingPayoutRequestsCount: number;
  pendingPayoutRequestsAmountInr: number;
  recentPayouts: Array<{
    id: string;
    payoutReference: string;
    netPayableAmountInr: number;
    status: string;
    transferMethod?: string;
    utrNumber?: string;
    createdAt: string;
    completedAt?: string | null;
  }>;
}

export interface VendorSettlementLedgerResponse {
  summary: {
    totalVendorsCount: number;
    totalGrossVolumeInr: number;
    totalPlatformCommissionInr: number;
    totalNetVendorShareInr: number;
    totalSettledAmountInr: number;
    totalPendingSettlementInr: number;
    pendingRequestsCount: number;
    pendingRequestsAmountInr: number;
  };
  vendors: VendorSettlementItem[];
  payoutRequests: PayoutItem[];
}

interface PayoutsState {
  items: PayoutItem[];
  wallet: VendorWalletData | null;
  vendorLedger: VendorSettlementLedgerResponse | null;
  loading: boolean;
  ledgerLoading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: PayoutsState = {
  items: [],
  wallet: null,
  vendorLedger: null,
  loading: false,
  ledgerLoading: false,
  actionLoading: false,
  error: null,
};

export const fetchPayouts = createAsyncThunk(
  'payouts/fetchPayouts',
  async (params: { role?: 'admin' | 'vendor'; vendorId?: string } | undefined, { rejectWithValue }) => {
    try {
      const isVendor = params?.role === 'vendor';
      const endpoint = isVendor ? '/vendor/payouts' : '/admin/finance/settlements';
      const response = await api.get(endpoint, {
        params: params?.vendorId ? { vendorId: params.vendorId } : undefined,
      });
      const data = response.data?.data || response.data?.items || response.data || [];
      return Array.isArray(data) ? data : data.items || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || err.message || 'Failed to fetch payouts');
    }
  }
);

export const fetchVendorWallet = createAsyncThunk(
  'payouts/fetchVendorWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/vendor/wallet');
      const data = response.data?.data || response.data;
      return {
        ...data.wallet,
        banking: data.banking || null,
      } as VendorWalletData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || err.message || 'Failed to fetch vendor wallet');
    }
  }
);

export const requestVendorPayout = createAsyncThunk(
  'payouts/requestVendorPayout',
  async (payload: { amountInr?: number; upTo?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/vendor/payouts/request', payload);
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || err.message || 'Failed to request payout');
    }
  }
);

export const processAdminPayout = createAsyncThunk(
  'payouts/processAdminPayout',
  async (
    payload: { id: string; utrNumber: string; transferMethod?: string; notes?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`/admin/finance/settlements/${payload.id}/complete`, {
        utrNumber: payload.utrNumber,
        transferMethod: payload.transferMethod || 'NEFT',
        notes: payload.notes,
      });
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || err.message || 'Failed to complete payout');
    }
  }
);

export const rejectAdminPayout = createAsyncThunk(
  'payouts/rejectAdminPayout',
  async (payload: { id: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/finance/settlements/${payload.id}/reject`, {
        reason: payload.reason,
      });
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || err.message || 'Failed to reject payout');
    }
  }
);

export const fetchVendorSettlementLedger = createAsyncThunk(
  'payouts/fetchVendorSettlementLedger',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/finance/vendor-settlement-ledger');
      return (response.data?.data || response.data) as VendorSettlementLedgerResponse;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error?.message || err.message || 'Failed to fetch vendor settlement ledger'
      );
    }
  }
);

export const processDirectSettlement = createAsyncThunk(
  'payouts/processDirectSettlement',
  async (
    payload: {
      vendorId: string;
      amountInr: number;
      transferMethod?: string;
      utrNumber: string;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/admin/finance/direct-settlement', payload);
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error?.message || err.message || 'Failed to disburse direct settlement'
      );
    }
  }
);

const payoutsSlice = createSlice({
  name: 'payouts',
  initialState,
  reducers: {
    clearPayoutError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPayouts
      .addCase(fetchPayouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayouts.fulfilled, (state, action: PayloadAction<PayoutItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPayouts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load payouts';
      })
      // fetchVendorWallet
      .addCase(fetchVendorWallet.fulfilled, (state, action: PayloadAction<VendorWalletData>) => {
        state.wallet = action.payload;
      })
      // requestVendorPayout
      .addCase(requestVendorPayout.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(requestVendorPayout.fulfilled, (state, action: PayloadAction<PayoutItem>) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
        if (state.wallet) {
          state.wallet.availablePayoutBalanceInr = Math.max(
            0,
            state.wallet.availablePayoutBalanceInr - action.payload.netPayableAmountInr
          );
        }
      })
      .addCase(requestVendorPayout.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = (action.payload as string) || 'Failed to submit payout request';
      })
      // processAdminPayout
      .addCase(processAdminPayout.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(processAdminPayout.fulfilled, (state, action: PayloadAction<PayoutItem>) => {
        state.actionLoading = false;
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(processAdminPayout.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = (action.payload as string) || 'Failed to complete payout';
      })
      // rejectAdminPayout
      .addCase(rejectAdminPayout.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(rejectAdminPayout.fulfilled, (state, action: PayloadAction<PayoutItem>) => {
        state.actionLoading = false;
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(rejectAdminPayout.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = (action.payload as string) || 'Failed to reject payout';
      })
      // fetchVendorSettlementLedger
      .addCase(fetchVendorSettlementLedger.pending, (state) => {
        state.ledgerLoading = true;
        state.error = null;
      })
      .addCase(fetchVendorSettlementLedger.fulfilled, (state, action: PayloadAction<VendorSettlementLedgerResponse>) => {
        state.ledgerLoading = false;
        state.vendorLedger = action.payload;
        if (action.payload.payoutRequests) {
          state.items = action.payload.payoutRequests;
        }
      })
      .addCase(fetchVendorSettlementLedger.rejected, (state, action) => {
        state.ledgerLoading = false;
        state.error = (action.payload as string) || 'Failed to load vendor settlement ledger';
      })
      // processDirectSettlement
      .addCase(processDirectSettlement.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(processDirectSettlement.fulfilled, (state, action: PayloadAction<PayoutItem>) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(processDirectSettlement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = (action.payload as string) || 'Failed to disburse direct settlement';
      });
  },
});

export const { clearPayoutError } = payoutsSlice.actions;
export default payoutsSlice.reducer;

