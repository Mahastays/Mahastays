import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { PackageItem } from '../../types';

interface PackagesState {
  items: PackageItem[];
  selectedPackage: PackageItem | null;
  loading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
}

const getStoredPackages = (): PackageItem[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mahastays_db_packages');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && !parsed.some((p: any) => p.id === 'pkg_01' || p.id === 'pkg_02')) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return [];
};

const savePackages = (items: PackageItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mahastays_db_packages', JSON.stringify(items));
    } catch {
      // ignore
    }
  }
};

export const normalizePackage = (raw: any): PackageItem => {
  const images: string[] = [];
  if (Array.isArray(raw.images)) {
    raw.images.forEach((img: any) => {
      const url = typeof img === 'string' ? img : img?.url;
      if (url && !images.includes(url)) images.push(url);
    });
  }
  if (raw.thumbnail && !images.includes(raw.thumbnail)) images.unshift(raw.thumbnail);
  const rawTiers = Array.isArray(raw.tiers) ? raw.tiers : [];
  const tiers = rawTiers.map((t: any, idx: number) => ({
    tierId: t.tierId || t.id || `tier_${idx + 1}`,
    name: t.name || t.title || 'Standard Package',
    badge: t.badge,
    tagline: t.tagline,
    hotelType: t.hotelType || '4-Star Valley View Resort Stay Included',
    pricePerPerson: t.pricePerPerson || t.price || raw.numericPrice || 0,
    originalPrice: t.originalPrice || raw.originalPrice,
    features: Array.isArray(t.features) && t.features.length > 0 ? t.features : ['Resort Room Included', 'All Meals Included', 'Private Sunset Boating', 'Spa Credit Voucher'],
  }));

  const tierPrices = tiers.map((t: any) => Number(t.pricePerPerson)).filter((p: number) => !isNaN(p) && p > 0);
  const startingPrice = tierPrices.length > 0 ? Math.min(...tierPrices) : (raw.numericPrice || 0);
  const origPrices = tiers.map((t: any) => Number(t.originalPrice)).filter((p: number) => !isNaN(p) && p > 0);
  const startingOrigPrice = origPrices.length > 0 ? Math.min(...origPrices) : raw.originalPrice;

  const rawInclusions = Array.isArray(raw.inclusions) ? raw.inclusions : [];
  const inclusions = rawInclusions.map((inc: any) => {
    if (typeof inc === 'string') return { title: inc };
    return {
      title: inc.title || inc.name || 'Inclusion',
      desc: inc.desc || inc.description,
      icon: inc.icon,
    };
  });

  return {
    id: raw.id || raw._id,
    code: raw.code || raw.slug || `PKG-${(raw.id || '').slice(-4)}`,
    slug: raw.slug || `pkg-${raw.id}`,
    vendorId: raw.vendorId || '',
    vendorName: raw.vendorName || '',
    propertyId: raw.propertyId || raw.hostPropertyId || '',
    propertyName: raw.propertyName || '',
    title: raw.title || raw.name || 'Package',
    packageType: raw.packageType || 'couple',
    category: raw.category || 'Standard',
    durationDays: raw.durationDays || 1,
    durationNights: raw.durationNights || 0,
    location: raw.location || '',
    city: raw.city || 'Mahabaleshwar',
    numericPrice: startingPrice,
    originalPrice: startingOrigPrice,
    shortDesc: raw.shortDesc || raw.description || '',
    thumbnail: images[0] || '',
    images,
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    inclusions,
    exclusions: Array.isArray(raw.exclusions) ? raw.exclusions : [],
    itinerary: Array.isArray(raw.itinerary) ? raw.itinerary : [],
    tiers,
    host: raw.host || {
      name: raw.vendorName || 'Vikramaditya & Concierge Team',
      role: 'Holiday Specialist & Concierge',
      experience: '5 Years hosting',
      staysCount: '1,200+ Verified Guests',
      verified: true,
      avatar: '',
      confirmationBadge: 'Instant Booking Confirmed',
    },
    keyHighlights: Array.isArray(raw.keyHighlights) && raw.keyHighlights.length > 0
      ? raw.keyHighlights
      : [
          { name: '4-Star Resort Stay', desc: 'Hilltop valley view rooms' },
          { name: 'All Meals & Decor', desc: 'Candlelight dinner setup' },
          { name: 'Dedicated Chauffeur', desc: 'AC sedan sightseeing' },
          { name: 'Venna Lake Boating', desc: 'Free activity pass' },
        ],
    videoUrl: raw.videoUrl || raw.video || '',
    idealFor: raw.idealFor || 'Families & Couples',
    destinations: raw.destinations || raw.location || '',
    policies: raw.policies || {
      cancellationPolicy: raw.cancellationPolicy || 'Free cancellation up to 48 hours before start date.',
      rules: ['Valid government photo ID required', 'Report 15 minutes prior to departure'],
    },
    rating: raw.ratingScore || raw.rating || 0,
    reviewsCount: raw.reviewsCount || 0,
    featured: !!raw.featured,
    status: raw.status || 'active',
    rejectionReason: raw.rejectionReason,
    pricingRules: raw.pricingRules || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
};

const initialPackages = getStoredPackages();

const initialState: PackagesState = {
  items: initialPackages,
  selectedPackage: initialPackages[0] || null,
  loading: false,
  detailLoading: false,
  saving: false,
  error: null,
};

export const fetchPackages = createAsyncThunk('packages/fetchPackages', async () => {
  try {
    const isVendor = typeof window !== 'undefined' && localStorage.getItem('mahastays_auth_view_mode') === 'vendor';
    const requestConfig = {
      params: { limit: 100, _t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    };
    const res = isVendor
      ? await api.get('/vendor/packages', requestConfig).catch(() => api.get('/admin/packages', requestConfig)).catch(() => api.get('/packages', requestConfig))
      : await api.get('/admin/packages', requestConfig).catch(() => api.get('/vendor/packages', requestConfig)).catch(() => api.get('/packages', requestConfig));

    const rawList = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data?.data?.items)
      ? res.data.data.items
      : Array.isArray(res.data?.items)
      ? res.data.items
      : Array.isArray(res.data)
      ? res.data
      : null;

    if (Array.isArray(rawList)) {
      const normalized = rawList.map(normalizePackage);
      savePackages(normalized);
      return normalized;
    }
  } catch {
    // Offline fallback
  }
  return getStoredPackages();
});

export const fetchPackageById = createAsyncThunk(
  'packages/fetchPackageById',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const config = {
        params: { _t: Date.now() },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      };
      const res = await api
        .get(`/admin/packages/${id}`, config)
        .catch(() => api.get(`/vendor/packages/${id}`, config))
        .catch(() => api.get(`/packages/${id}`, config));

      if (res.data?.data) {
        return normalizePackage(res.data.data);
      }
    } catch {
      // Offline fallback
    }

    const state = getState() as { packages: PackagesState };
    const found = state.packages.items.find((p) => p.id === id || p.code === id || p.slug === id);

    if (found) return found;
    return rejectWithValue('Package not found');
  }
);

export const updatePackageAsync = createAsyncThunk(
  'packages/updatePackage',
  async (updatedPkg: PackageItem, { getState }) => {
    try {
      const isVendor = typeof window !== 'undefined' && localStorage.getItem('mahastays_auth_view_mode') === 'vendor';
      if (isVendor) {
        await api
          .put(`/vendor/packages/${updatedPkg.id}`, updatedPkg)
          .catch(() => api.put(`/admin/packages/${updatedPkg.id}`, updatedPkg));
      } else {
        await api
          .put(`/admin/packages/${updatedPkg.id}`, updatedPkg)
          .catch(() => api.put(`/vendor/packages/${updatedPkg.id}`, updatedPkg))
          .catch(() =>
            api.patch(`/admin/packages/${updatedPkg.id}/content`, {
              title: updatedPkg.title,
              shortDesc: updatedPkg.shortDesc,
              badge: (updatedPkg as any).badge,
            })
          );
      }
    } catch {
      // Offline fallback
    }

    const state = getState() as { packages: PackagesState };
    const next = state.packages.items.map((pkg) =>
      pkg.id === updatedPkg.id ? updatedPkg : pkg
    );
    savePackages(next);
    return updatedPkg;
  }
);

export const togglePackageBookingAsync = createAsyncThunk(
  'packages/toggleBooking',
  async ({ id, acceptingBookings }: { id: string; acceptingBookings: boolean }, { rejectWithValue }) => {
    try {
      await api.patch(`/admin/packages/${id}/accepting-bookings`, { acceptingBookings });
      return { id, acceptingBookings };
    } catch (err: any) {
      try {
        await api.patch(`/vendor/packages/${id}/accepting-bookings`, { acceptingBookings });
        return { id, acceptingBookings };
      } catch {
        return { id, acceptingBookings };
      }
    }
  }
);

export const approvePackageAsync = createAsyncThunk(
  'packages/approvePackage',
  async ({ id, adminId }: { id: string; adminId?: string }, { getState }) => {
    try {
      await api
        .patch(`/admin/packages/${id}/status`, { status: 'active' })
        .catch(() => api.patch(`/admin/packages/${id}/approve`, { approvedByAdminId: adminId || 'adm_ops_01' }));
    } catch {
      // Offline fallback
    }
    const state = getState() as { packages: PackagesState };
    const next = state.packages.items.map((pkg) =>
      pkg.id === id
        ? {
            ...pkg,
            status: 'active' as const,
            approvedAt: new Date().toISOString(),
            approvedByAdminId: adminId || 'adm_ops_01',
            rejectionReason: undefined,
          }
        : pkg
    );
    savePackages(next);
    return next;
  }
);

export const rejectPackageAsync = createAsyncThunk(
  'packages/rejectPackage',
  async ({ id, reason }: { id: string; reason: string }, { getState }) => {
    try {
      await api
        .patch(`/admin/packages/${id}/status`, { status: 'rejected', reason })
        .catch(() => api.patch(`/admin/packages/${id}/reject`, { reason }));
    } catch {
      // Offline fallback
    }
    const state = getState() as { packages: PackagesState };
    const next = state.packages.items.map((pkg) =>
      pkg.id === id
        ? {
            ...pkg,
            status: 'rejected' as const,
            rejectionReason: reason,
          }
        : pkg
    );
    savePackages(next);
    return next;
  }
);

export const createPackageAsync = createAsyncThunk(
  'packages/createPackage',
  async (pkgData: Partial<PackageItem>, { getState }) => {
    const newPkg: PackageItem = {
      id: pkgData.id || `pkg_${Date.now()}`,
      code: pkgData.code || `PKG-${Math.floor(100 + Math.random() * 900)}`,
      slug: (pkgData.title || 'new-package').toLowerCase().replace(/\s+/g, '-'),
      vendorId: pkgData.vendorId || '6adeef17f4597150f0c199a4',
      vendorName: pkgData.vendorName || 'HillView Hospitality Pvt Ltd',
      propertyId: pkgData.propertyId || '',
      propertyName: pkgData.propertyName || '',
      title: pkgData.title || '',
      packageType: pkgData.packageType || 'couple',
      category: pkgData.category || 'Luxury',
      durationDays: pkgData.durationDays || 1,
      durationNights: pkgData.durationNights || 1,
      location: pkgData.location || '',
      city: pkgData.city || 'Mahabaleshwar',
      numericPrice: pkgData.numericPrice || 0,
      originalPrice: pkgData.originalPrice || 0,
      shortDesc: pkgData.shortDesc || '',
      thumbnail: pkgData.thumbnail || '',
      images: pkgData.images?.length ? pkgData.images : [],
      highlights: pkgData.highlights || [],
      inclusions: pkgData.inclusions || [],
      exclusions: pkgData.exclusions || [],
      tiers: pkgData.tiers || [],
      pricingRules: pkgData.pricingRules || undefined,
      rating: 0,
      reviewsCount: 0,
      featured: false,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    };

    try {
      await api.post('/packages', newPkg).catch(() => api.post('/vendor/packages', newPkg));
    } catch {
      // Offline fallback
    }

    const state = getState() as { packages: PackagesState };
    const next = [newPkg, ...state.packages.items];
    savePackages(next);
    return newPkg;
  }
);

export const deletePackageAsync = createAsyncThunk(
  'packages/deletePackage',
  async (id: string, { getState }) => {
    try {
      await api.delete(`/admin/packages/${id}`).catch(() => api.delete(`/packages/${id}`));
    } catch {
      // Offline fallback
    }
    const state = getState() as { packages: PackagesState };
    const next = state.packages.items.filter((pkg) => pkg.id !== id);
    savePackages(next);
    return id;
  }
);

export const packagesSlice = createSlice({
  name: 'packages',
  initialState,
  reducers: {
    setSelectedPackage: (state, action: PayloadAction<PackageItem | null>) => {
      state.selectedPackage = action.payload;
    },
    setPackagesList: (state, action: PayloadAction<PackageItem[]>) => {
      state.items = action.payload;
      savePackages(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPackages
      .addCase(fetchPackages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch packages';
      })
      // fetchPackageById
      .addCase(fetchPackageById.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchPackageById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedPackage = action.payload;
      })
      .addCase(fetchPackageById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch package details';
      })
      // updatePackageAsync
      .addCase(updatePackageAsync.pending, (state) => {
        state.saving = true;
      })
      .addCase(updatePackageAsync.fulfilled, (state, action) => {
        state.saving = false;
        state.selectedPackage = action.payload;
        state.items = state.items.map((pkg) => (pkg.id === action.payload.id ? action.payload : pkg));
      })
      .addCase(updatePackageAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || 'Failed to update package';
      })
      // approvals
      .addCase(approvePackageAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        if (state.selectedPackage) {
          const updated = action.payload.find((p) => p.id === state.selectedPackage?.id);
          if (updated) state.selectedPackage = updated;
        }
      })
      .addCase(rejectPackageAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        if (state.selectedPackage) {
          const updated = action.payload.find((p) => p.id === state.selectedPackage?.id);
          if (updated) state.selectedPackage = updated;
        }
      })
      .addCase(togglePackageBookingAsync.fulfilled, (state, action) => {
        const item = state.items.find((p) => p.id === action.payload.id);
        if (item) item.acceptingBookings = action.payload.acceptingBookings;
        if (state.selectedPackage && state.selectedPackage.id === action.payload.id) {
          state.selectedPackage.acceptingBookings = action.payload.acceptingBookings;
        }
      })
      .addCase(createPackageAsync.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
      })
      .addCase(deletePackageAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((pkg) => pkg.id !== action.payload);
      });
  },
});

export const { setSelectedPackage, setPackagesList } = packagesSlice.actions;
export default packagesSlice.reducer;
