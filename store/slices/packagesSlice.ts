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
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200');
  }

  const rawTiers = Array.isArray(raw.tiers) ? raw.tiers : [];
  const tiers = rawTiers.map((t: any, idx: number) => ({
    tierId: t.tierId || t.id || `tier_${idx + 1}`,
    name: t.name || t.title || 'Standard Package',
    pricePerPerson: t.pricePerPerson || t.price || raw.numericPrice || 11500,
    originalPrice: t.originalPrice || raw.originalPrice,
    features: Array.isArray(t.features) ? t.features : ['Resort Accommodation', 'Guided Tour', 'Breakfast & Dinner'],
  }));

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
    vendorId: raw.vendorId || '6adeef17f4597150f0c199a4',
    vendorName: raw.vendorName || 'HillView Hospitality Pvt Ltd',
    propertyId: raw.propertyId || raw.hostPropertyId || '',
    propertyName: raw.propertyName || 'HillView Luxury Resort & Spa',
    title: raw.title || raw.name || 'Curated Holiday Package',
    packageType: raw.packageType || 'couple',
    category: raw.category || 'Luxury',
    durationDays: raw.durationDays || 3,
    durationNights: raw.durationNights || 2,
    location: raw.location || 'Plot 12, Venna Lake Road, Mahabaleshwar',
    city: raw.city || 'Mahabaleshwar',
    numericPrice: raw.numericPrice || 11500,
    originalPrice: raw.originalPrice,
    shortDesc: raw.shortDesc || raw.description || '',
    thumbnail: images[0],
    images,
    highlights: Array.isArray(raw.highlights) && raw.highlights.length > 0 ? raw.highlights : [
      'Resort stay with lake view',
      'Daily breakfast & candlelight dinner',
      'Complimentary sightseeing passes',
    ],
    inclusions: inclusions.length > 0 ? inclusions : [
      { title: 'Deluxe Room Stay', desc: 'Lake view deluxe suite' },
      { title: 'Complimentary Meals', desc: 'Breakfast & candlelight dinner' },
      { title: 'Local Sightseeing', desc: 'Guided berry garden & viewpoint tour' },
    ],
    exclusions: Array.isArray(raw.exclusions) ? raw.exclusions : ['Personal expenses', 'Airfare/Flight tickets'],
    itinerary: Array.isArray(raw.itinerary) && raw.itinerary.length > 0 ? raw.itinerary : [
      { day: 1, title: 'Arrival & Welcome Dinner', desc: 'Check-in to resort, welcome drink, evening candlelight dinner by the pool.' },
      { day: 2, title: 'Scenic Viewpoints & Strawberry Farm', desc: 'Guided visit to Arthur Seat, Kate\'s Point, and fresh berry harvesting.' },
      { day: 3, title: 'Morning Spa & Departure', desc: 'Breakfast buffet, complimentary 30-min spa session, relaxed noon check-out.' },
    ],
    tiers: tiers.length > 0 ? tiers : [
      {
        tierId: 'tier_honeymoon',
        name: 'Romantic Couple All-Inclusive',
        pricePerPerson: raw.numericPrice || 11500,
        originalPrice: raw.originalPrice || 15500,
        features: ['Resort Room', 'All Meals Included', 'Private Sunset Boating', 'Spa Credit Voucher'],
      },
    ],
    rating: raw.ratingScore || 4.9,
    reviewsCount: raw.reviewsCount || 41,
    featured: !!raw.featured,
    status: raw.status || 'active',
    rejectionReason: raw.rejectionReason,
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
    const res = isVendor
      ? await api.get('/vendor/packages').catch(() => api.get('/packages'))
      : await api.get('/admin/packages').catch(() => api.get('/packages'));

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
      const res = await api
        .get(`/admin/packages/${id}`)
        .catch(() => api.get(`/vendor/packages/${id}`))
        .catch(() => api.get(`/packages/${id}`));

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
      propertyName: pkgData.propertyName || 'HillView Heritage Resort & Spa',
      title: pkgData.title || 'New Tour Package',
      packageType: pkgData.packageType || 'couple',
      category: pkgData.category || 'Luxury',
      durationDays: pkgData.durationDays || 3,
      durationNights: pkgData.durationNights || 2,
      location: pkgData.location || 'Mahabaleshwar',
      city: pkgData.city || 'Mahabaleshwar',
      numericPrice: pkgData.numericPrice || 18000,
      originalPrice: pkgData.originalPrice || 22000,
      shortDesc: pkgData.shortDesc || 'Curated holiday package with luxury accommodation and excursions.',
      thumbnail:
        pkgData.thumbnail ||
        'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop&q=80',
      images: pkgData.images?.length
        ? pkgData.images
        : ['https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop&q=80'],
      highlights: pkgData.highlights || ['Luxury Stay Included', 'Sightseeing Transfers', 'All Meals'],
      inclusions: pkgData.inclusions || [
        { title: 'Accommodation', desc: 'Luxury resort room with breakfast' },
        { title: 'Guided Excursions', desc: 'Viewpoint & berry garden passes' },
      ],
      exclusions: pkgData.exclusions || ['Airfare', 'Personal expenses'],
      tiers: pkgData.tiers || [
        {
          tierId: 'tier_standard',
          name: 'Standard Package',
          pricePerPerson: pkgData.numericPrice || 18000,
          features: ['Resort Room', 'Breakfast & Dinner', 'Free Activity Voucher'],
        },
      ],
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
