import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { AdCampaignItem } from '../../types';

interface AdsState {
  items: AdCampaignItem[];
  loading: boolean;
  error: string | null;
}

export const normalizeAd = (raw: any): AdCampaignItem => ({
  id: raw.id || raw._id || `ad_${Date.now()}`,
  adName: raw.adName || 'Promotional Campaign',
  adType: raw.adType || 'card',
  placement: raw.placement || 'homepage',
  target: raw.target || {
    targetType: 'property',
    targetId: '',
    targetTitle: 'Promotional Feature',
    ctaLink: '/explore',
  },
  creative: raw.creative || {
    headline: 'Exclusive Luxury Mountain Escape',
    subHeadline: 'Book early & receive 20% off plus breakfast buffet',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    badgeText: 'Featured',
    buttonText: 'Book Now',
  },
  budget: {
    totalBudget: raw.budget?.totalBudget ?? 25000,
    dailyBudget: raw.budget?.dailyBudget ?? 1500,
    costPerClick: raw.budget?.costPerClick ?? 10,
    costPerImpression: raw.budget?.costPerImpression ?? 0.15,
    spentSoFar: raw.budget?.spentSoFar ?? raw.spentSoFar ?? 0,
  },
  impressions: raw.impressions ?? raw.budget?.impressions ?? 0,
  clicks: raw.clicks ?? raw.budget?.clicks ?? 0,
  conversions: raw.conversions ?? raw.budget?.conversions ?? 0,
  priority: raw.priority ?? 5,
  isActive: raw.isActive ?? raw.approvedByAdmin ?? true,
  approvedByAdmin: raw.approvedByAdmin ?? true,
  approvedByAdminId: raw.approvedByAdminId,
  createdById: raw.createdById || 'usr_admin',
  createdByRole: raw.createdByRole || 'admin',
  createdByName: raw.createdByName || 'Platform Admin',
  startsAt: raw.startsAt,
  expiresAt: raw.expiresAt,
  createdAt: raw.createdAt || new Date().toISOString(),
});

const getStoredAds = (): AdCampaignItem[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mahastays_db_ads');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && !parsed.some((a: any) => a.id === 'ad_01' || a.id === 'ad_02')) {
          return parsed.map(normalizeAd);
        }
      }
    } catch {
      // ignore
    }
  }
  return [];
};

const saveAds = (items: AdCampaignItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mahastays_db_ads', JSON.stringify(items));
    } catch {
      // ignore
    }
  }
};

const initialState: AdsState = {
  items: getStoredAds(),
  loading: false,
  error: null,
};

export const fetchAds = createAsyncThunk('ads/fetchAds', async () => {
  try {
    const res = await api.get('/admin/ads').catch(() => api.get('/ads'));
    const rawList = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data?.data?.items)
      ? res.data.data.items
      : Array.isArray(res.data)
      ? res.data
      : null;
    if (Array.isArray(rawList)) {
      const normalized = rawList.map(normalizeAd);
      saveAds(normalized);
      return normalized;
    }
  } catch {
    // Offline fallback
  }
  return getStoredAds().map(normalizeAd);
});

export const createAdCampaignAsync = createAsyncThunk(
  'ads/createAd',
  async (
    payload: {
      ad: Partial<AdCampaignItem>;
      role: 'admin' | 'vendor';
      userId: string;
      userName: string;
    },
    { getState }
  ) => {
    const { ad, role, userId, userName } = payload;
    const isAdmin = role === 'admin';

    const newAd: AdCampaignItem = {
      id: ad.id || `ad_${Date.now()}`,
      adName: ad.adName || 'Promotional Campaign',
      adType: ad.adType || 'card',
      placement: ad.placement || 'homepage',
      target: ad.target || {
        targetType: 'property',
        targetId: '',
        targetTitle: 'Promotional Feature',
        ctaLink: '/explore',
      },
      creative: ad.creative || {
        headline: 'Exclusive Luxury Mountain Escape',
        subHeadline: 'Book early & receive 20% off plus breakfast buffet',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
        badgeText: 'Featured',
        buttonText: 'Book Now',
      },
      budget: ad.budget || {
        totalBudget: 25000,
        dailyBudget: 1500,
        costPerClick: 10,
        costPerImpression: 0.15,
        spentSoFar: 0,
      },
      impressions: 0,
      clicks: 0,
      conversions: 0,
      priority: ad.priority || 5,
      isActive: isAdmin,
      approvedByAdmin: isAdmin,
      approvedByAdminId: isAdmin ? userId : undefined,
      createdById: userId,
      createdByRole: role,
      createdByName: userName,
      createdAt: new Date().toISOString(),
    };

    try {
      await api.post('/ads', newAd).catch(() => api.post('/admin/ads', newAd));
    } catch {
      // Offline fallback
    }

    const state = getState() as { ads: AdsState };
    const next = [newAd, ...state.ads.items];
    saveAds(next);
    return newAd;
  }
);

export const updateAdCampaignAsync = createAsyncThunk(
  'ads/updateAd',
  async (
    { id, updates }: { id: string; updates: Partial<AdCampaignItem> },
    { getState }
  ) => {
    try {
      // Send backend-safe payload (excluding internal fields if needed)
      const payload: any = {};
      if (updates.adName !== undefined) payload.adName = updates.adName;
      if (updates.adType !== undefined) payload.adType = updates.adType;
      if (updates.placement !== undefined) payload.placement = updates.placement;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.isActive !== undefined) payload.isActive = updates.isActive;
      if (updates.creative !== undefined) payload.creative = updates.creative;
      if (updates.target?.targetId && updates.target.targetId.length === 24) {
        payload.target = updates.target;
      }

      await api.put(`/admin/ads/${id}`, payload).catch(() => api.put(`/ads/${id}`, payload));
    } catch (err) {
      console.warn('Backend ad update warning:', err);
    }

    const state = getState() as { ads: AdsState };
    const next = state.ads.items.map((ad) =>
      ad.id === id
        ? {
            ...ad,
            ...updates,
            creative: { ...ad.creative, ...(updates.creative || {}) },
          }
        : ad
    );
    saveAds(next);
    return { id, updates };
  }
);

export const approveAdCampaignAsync = createAsyncThunk(
  'ads/approveAd',
  async ({ id, adminId }: { id: string; adminId?: string }, { getState }) => {
    try {
      await api.patch(`/admin/ads/${id}/approve`, { approvedByAdminId: adminId || 'adm_ops_01' });
    } catch {
      // Offline fallback
    }
    const state = getState() as { ads: AdsState };
    const next = state.ads.items.map((ad) =>
      ad.id === id
        ? {
            ...ad,
            approvedByAdmin: true,
            isActive: true,
            approvedByAdminId: adminId || 'adm_ops_01',
          }
        : ad
    );
    saveAds(next);
    return next;
  }
);

export const toggleAdCampaignAsync = createAsyncThunk(
  'ads/toggleAd',
  async ({ id, active }: { id: string; active: boolean }, { getState }) => {
    try {
      await api.patch(`/admin/ads/${id}/toggle`, { isActive: active });
    } catch {
      // Offline fallback
    }
    const state = getState() as { ads: AdsState };
    const next = state.ads.items.map((ad) => (ad.id === id ? { ...ad, isActive: active } : ad));
    saveAds(next);
    return next;
  }
);

export const deleteAdCampaignAsync = createAsyncThunk(
  'ads/deleteAd',
  async (id: string, { getState }) => {
    try {
      await api.delete(`/admin/ads/${id}`).catch(() => api.delete(`/ads/${id}`));
    } catch {
      // Offline fallback
    }
    const state = getState() as { ads: AdsState };
    const next = state.ads.items.filter((ad) => ad.id !== id);
    saveAds(next);
    return id;
  }
);

export const adsSlice = createSlice({
  name: 'ads',
  initialState,
  reducers: {
    setAdsList: (state, action: PayloadAction<AdCampaignItem[]>) => {
      state.items = action.payload;
      saveAds(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAds.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAds.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(createAdCampaignAsync.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
      })
      .addCase(updateAdCampaignAsync.fulfilled, (state, action) => {
        const { id, updates } = action.payload;
        state.items = state.items.map((ad) =>
          ad.id === id
            ? { ...ad, ...updates, creative: { ...ad.creative, ...(updates.creative || {}) } }
            : ad
        );
      })
      .addCase(approveAdCampaignAsync.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(toggleAdCampaignAsync.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(deleteAdCampaignAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((ad) => ad.id !== action.payload);
      });
  },
});

export const { setAdsList } = adsSlice.actions;
export default adsSlice.reducer;
