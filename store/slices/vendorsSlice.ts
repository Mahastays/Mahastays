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

const isDummyString = (str?: string | null) => {
  if (!str) return true;
  const s = str.trim().toLowerCase();
  return (
    s === 'abcde1234f' ||
    s === '27abcde1234f1z5' ||
    s === 'mtdc/2026/089' ||
    s === 'main market road' ||
    s.includes('photo-1507003211169-0a1dd7228f2d') ||
    s.includes('photo-1589829545856-d10d557cf95f') ||
    s.includes('photo-1450133064473-71024230f91b') ||
    s.includes('pravatar.cc') ||
    s === 'hdfc bank' ||
    s === 'hdfc0001234' ||
    s === 'mahabaleshwar main branch'
  );
};

export const normalizeVendor = (raw: any): VendorItem => {
  const pan = raw.compliance?.panNumber || raw.panNumber || '';
  const gstin = raw.compliance?.gstin || raw.gstin || '';
  const mtdc = raw.compliance?.tourismLicenseNumber || raw.tourismLicenseNumber || '';
  const aadhaar = raw.compliance?.aadhaarNumber || raw.aadhaarNumber || '';
  const avatar = raw.avatarUrl || '';
  const identityProof = raw.compliance?.identityProofUrl || raw.identityProofUrl || '';
  const businessProof = raw.compliance?.businessProofUrl || raw.businessProofUrl || '';
  const bankProof = raw.compliance?.bankProofUrl || raw.bankProofUrl || '';
  const tourismProof = raw.compliance?.tourismProofUrl || raw.tourismProofUrl || '';
  const addr1 = raw.contact?.registeredOfficeAddress?.addressLine1 || '';
  const bankName = raw.banking?.bankName || '';
  const ifsc = raw.banking?.ifscCode || '';
  const branch = raw.banking?.branchName || '';

  const cleanPan = isDummyString(pan) ? '' : pan;
  const cleanGstin = isDummyString(gstin) ? '' : gstin;
  const cleanMtdc = isDummyString(mtdc) ? '' : mtdc;
  const cleanAvatar = isDummyString(avatar) ? '' : avatar;
  const cleanIdentityProof = isDummyString(identityProof) ? '' : identityProof;
  const cleanBusinessProof = isDummyString(businessProof) ? '' : businessProof;
  const cleanAddr1 = isDummyString(addr1) ? '' : addr1;
  const cleanBankName = isDummyString(bankName) ? '' : bankName;
  const cleanIfsc = isDummyString(ifsc) ? '' : ifsc;
  const cleanBranch = isDummyString(branch) ? '' : branch;

  return {
    id: raw.id || raw._id,
    vendorCode: raw.vendorCode || 'VND',
    businessName: raw.businessName || '',
    displayName: raw.displayName || raw.businessName || '',
    displayRole: raw.displayRole || '',
    experienceSummary: (raw.experienceSummary?.includes('Verified Mahastays Partner since') ? '' : raw.experienceSummary) || '',
    category: raw.category || 'property_host',
    businessType: raw.businessType || 'proprietorship',
    avatarUrl: cleanAvatar,
    email: raw.email || '',
    phone: raw.phone || '',
    status: raw.status || 'active',
    compliance: {
      panNumber: cleanPan,
      gstin: cleanGstin,
      tourismLicenseNumber: cleanMtdc,
      aadhaarNumber: aadhaar,
      identityProofUrl: cleanIdentityProof,
      businessProofUrl: cleanBusinessProof,
      bankProofUrl: bankProof,
      tourismProofUrl: tourismProof,
      verificationStatus: !cleanPan && !cleanIdentityProof ? 'pending' : (raw.compliance?.verificationStatus || 'pending'),
    },
    banking: {
      bankName: cleanBankName,
      accountHolderName: raw.banking?.accountHolderName || '',
      accountNumber: raw.banking?.accountNumber || '',
      accountNumberLast4: raw.banking?.accountNumberLast4 || (raw.banking?.accountNumber ? raw.banking.accountNumber.slice(-4) : ''),
      ifscCode: cleanIfsc,
      branchName: cleanBranch,
      upiId: raw.banking?.upiId || '',
      isAccountVerified: !cleanBankName && !raw.banking?.accountNumber ? false : (raw.banking?.isAccountVerified ?? false),
    },
    contact: {
      primaryContactPerson: raw.contact?.primaryContactPerson || raw.displayName || '',
      alternatePhone: raw.contact?.alternatePhone || '',
      registeredOfficeAddress: {
        addressLine1: cleanAddr1,
        addressLine2: cleanAddr1 ? (raw.contact?.registeredOfficeAddress?.addressLine2 || '') : '',
        city: cleanAddr1 ? (raw.contact?.registeredOfficeAddress?.city || '') : '',
        state: cleanAddr1 ? (raw.contact?.registeredOfficeAddress?.state || '') : '',
        pincode: cleanAddr1 ? (raw.contact?.registeredOfficeAddress?.pincode || '') : '',
        country: cleanAddr1 ? (raw.contact?.registeredOfficeAddress?.country || 'India') : '',
      },
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
  };
};

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
        aadhaarNumber?: string;
        identityProofUrl?: string;
        businessProofUrl?: string;
        bankProofUrl?: string;
        tourismProofUrl?: string;
        primaryContactPerson?: string;
        alternatePhone?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        bankName?: string;
        accountHolderName?: string;
        accountNumber?: string;
        ifscCode?: string;
        branchName?: string;
        upiId?: string;
      };
    },
    { getState }
  ) => {
    let updatedVendor: VendorItem | null = null;
    const isVendor = typeof window !== 'undefined' && localStorage.getItem('mahastays_auth_view_mode') === 'vendor';

    try {
      if (isVendor) {
        const res = await api.put('/vendor/me', data).catch(() => api.patch(`/admin/vendors/${vendorId}`, data));
        if (res.data?.data) {
          updatedVendor = normalizeVendor(res.data.data);
        }
        if (data.identityProofUrl || data.businessProofUrl || data.panNumber) {
          await api.put('/vendor/me/kyc', {
            panNumber: data.panNumber || '',
            gstin: data.gstin,
            tourismLicenseNumber: data.tourismLicenseNumber,
            identityProofUrl: data.identityProofUrl || '',
            businessProofUrl: data.businessProofUrl || '',
          }).catch(() => null);
        }
        if (data.accountNumber && data.ifscCode) {
          await api.put('/vendor/me/banking', {
            accountHolderName: data.accountHolderName || data.businessName || '',
            accountNumber: data.accountNumber,
            bankName: data.bankName || '',
            ifscCode: data.ifscCode,
            branchName: data.branchName,
            upiId: data.upiId,
          }).catch(() => null);
        }
      } else {
        const res = await api.patch(`/admin/vendors/${vendorId}`, data).catch(() => api.put(`/vendor/me`, data));
        if (res.data?.data) {
          updatedVendor = normalizeVendor(res.data.data);
        }
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
          businessName: data.businessName || v.businessName,
          displayName: data.displayName || v.displayName,
          displayRole: data.displayRole || v.displayRole,
          phone: data.phone || v.phone,
          category: data.category || v.category,
          businessType: data.businessType || v.businessType,
          avatarUrl: data.avatarUrl || v.avatarUrl,
          experienceSummary: data.experienceSummary !== undefined ? data.experienceSummary : v.experienceSummary,
          compliance: {
            ...v.compliance,
            panNumber: data.panNumber || v.compliance.panNumber,
            gstin: data.gstin !== undefined ? data.gstin : v.compliance.gstin,
            tourismLicenseNumber: data.tourismLicenseNumber !== undefined ? data.tourismLicenseNumber : v.compliance.tourismLicenseNumber,
            aadhaarNumber: data.aadhaarNumber !== undefined ? data.aadhaarNumber : (v.compliance as any).aadhaarNumber,
            identityProofUrl: data.identityProofUrl !== undefined ? data.identityProofUrl : (v.compliance as any).identityProofUrl,
            businessProofUrl: data.businessProofUrl !== undefined ? data.businessProofUrl : (v.compliance as any).businessProofUrl,
            bankProofUrl: data.bankProofUrl !== undefined ? data.bankProofUrl : (v.compliance as any).bankProofUrl,
            tourismProofUrl: data.tourismProofUrl !== undefined ? data.tourismProofUrl : (v.compliance as any).tourismProofUrl,
            verificationStatus: 'under_review' as const,
          },
          banking: {
            ...v.banking,
            bankName: data.bankName || v.banking.bankName,
            accountHolderName: data.accountHolderName || v.banking.accountHolderName,
            accountNumber: data.accountNumber || (v.banking as any).accountNumber,
            accountNumberLast4: data.accountNumber ? data.accountNumber.slice(-4) : v.banking.accountNumberLast4,
            ifscCode: data.ifscCode || v.banking.ifscCode,
            branchName: data.branchName || (v.banking as any).branchName,
            upiId: data.upiId || (v.banking as any).upiId,
          },
          contact: {
            primaryContactPerson: data.primaryContactPerson || v.contact?.primaryContactPerson || data.displayName || v.displayName,
            alternatePhone: data.alternatePhone || v.contact?.alternatePhone,
            registeredOfficeAddress: {
              addressLine1: data.addressLine1 || v.contact?.registeredOfficeAddress?.addressLine1 || '',
              addressLine2: data.addressLine2 || v.contact?.registeredOfficeAddress?.addressLine2 || '',
              city: data.city || v.contact?.registeredOfficeAddress?.city || '',
              state: data.state || v.contact?.registeredOfficeAddress?.state || '',
              pincode: data.pincode || v.contact?.registeredOfficeAddress?.pincode || '',
              country: 'India',
            },
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
