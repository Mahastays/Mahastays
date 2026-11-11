import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { ExperienceItem } from '../../types';

interface ExperiencesState {
  items: ExperienceItem[];
  selectedExperience: ExperienceItem | null;
  loading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
}

const getStoredExperiences = (): ExperienceItem[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mahastays_db_experiences');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && !parsed.some((e: any) => e.id === 'exp_01' || e.id === 'exp_02')) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return [];
};

const saveExperiences = (items: ExperienceItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mahastays_db_experiences', JSON.stringify(items));
    } catch {
      // ignore
    }
  }
};

export const normalizeExperience = (raw: any): ExperienceItem => {
  const image = raw.image || raw.thumbnail || 'https://picsum.photos/seed/arthur-seat/1600/900';
  const gallery: string[] = [];
  if (Array.isArray(raw.gallery)) {
    raw.gallery.forEach((url: any) => {
      const u = typeof url === 'string' ? url : url?.url;
      if (u && !gallery.includes(u)) gallery.push(u);
    });
  }
  if (!gallery.includes(image)) gallery.unshift(image);

  const rawSlots = Array.isArray(raw.slots) ? raw.slots : [];
  const slots = rawSlots.map((s: any, idx: number) => ({
    slotId: s.slotId || s.id || `slot_${idx + 1}`,
    time: s.time || '06:00 AM – 08:00 AM',
    label: s.label || 'Morning Slot',
    capacity: s.capacity || 20,
    price: s.price || raw.numericPrice || 250,
  }));

  const rawTiers = Array.isArray(raw.tiers) ? raw.tiers : [];
  const tiers = rawTiers.map((t: any, idx: number) => ({
    tierId: t.tierId || t.id || `tier_${idx + 1}`,
    id: t.id || t.tierId || `tier_${idx + 1}`,
    name: t.name || 'Standard Pass',
    badge: t.badge || 'Popular',
    tagline: t.tagline || '',
    priceType: t.priceType || raw.priceType || 'per_person',
    personLimit: t.personLimit != null ? Number(t.personLimit) : (raw.personLimit != null ? Number(raw.personLimit) : null),
    pricePerPerson: Number(t.pricePerPerson) || raw.numericPrice || 250,
    childPricePerPerson: t.childPricePerPerson != null ? Number(t.childPricePerPerson) : null,
    originalPrice: t.originalPrice ? Number(t.originalPrice) : raw.originalPrice,
    description: t.description || 'General entry & guided trail pass',
    features: Array.isArray(t.features) ? t.features : ['Expert Guide Included', 'Safety Gear', 'Valley Viewpoint Access'],
  }));

  const allPrices = [
    ...slots.map((s: any) => Number(s.price)),
    ...tiers.map((t: any) => Number(t.pricePerPerson)),
  ].filter((p: number) => !isNaN(p) && p > 0);
  const startingPrice = allPrices.length > 0 ? Math.min(...allPrices) : (raw.numericPrice || 0);

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
    code: raw.code || raw.slug || `EXP-${(raw.id || '').slice(-4)}`,
    slug: raw.slug || `exp-${raw.id}`,
    vendorId: raw.vendorId || '',
    vendorName: raw.vendorName || '',
    title: raw.title || raw.name || 'Experience',
    category: raw.category || 'Activity',
    difficulty: (raw.difficulty || 'Easy') as any,
    duration: raw.duration || '',
    city: raw.city || 'Mahabaleshwar',
    location: raw.location || raw.city || 'Mahabaleshwar',
    priceType: raw.priceType || 'per_person',
    personLimit: raw.personLimit,
    hasChildPrice: raw.hasChildPrice ?? false,
    childPrice: raw.childPrice,
    childAgeLimit: raw.childAgeLimit,
    locationType: raw.locationType || 'fixed_location',
    serviceArea: raw.serviceArea,
    numericPrice: startingPrice,
    originalPrice: raw.originalPrice,
    image,
    gallery,
    description: raw.description || '',
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    slots,
    tiers,
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
    inclusions,
    meetingPoint: raw.meetingPoint || '',
    maxGroupSize: raw.maxGroupSize || 10,
    guide: {
      name: raw.guide?.name || raw.vendorName || 'Sameer Patil',
      role: raw.guide?.role || 'Lead Trek Leader & Naturalist',
      avatar: raw.guide?.avatar || '',
      experience: raw.guide?.experience || '8+ Years Expedition Experience',
      staysCount: raw.guide?.staysCount || '350+ Treks Guided',
      verified: raw.guide?.verified ?? true,
      confirmationBadge: raw.guide?.confirmationBadge || 'Instant Booking Confirmed',
    },
    host: raw.host || {
      name: raw.guide?.name || raw.vendorName || 'Sameer Patil',
      role: raw.guide?.role || 'Lead Trek Leader & Naturalist',
      avatar: raw.guide?.avatar || '',
      experience: raw.guide?.experience || '8+ Years Expedition Experience',
      staysCount: raw.guide?.staysCount || '350+ Treks Guided',
      verified: raw.guide?.verified ?? true,
      confirmationBadge: raw.guide?.confirmationBadge || 'Instant Booking Confirmed',
    },
    keyHighlights: Array.isArray(raw.keyHighlights) && raw.keyHighlights.length > 0
      ? raw.keyHighlights
      : [
          { name: 'Sunrise Summit', desc: 'Panoramic Western Ghats viewpoint' },
          { name: 'Forest Trail', desc: 'Dense rainforest trail navigation' },
          { name: 'Certified Guide', desc: 'Wilderness safety trained' },
          { name: 'Hot Tea & Snacks', desc: 'Fresh local breakfast at peak' },
        ],
    videoUrl: raw.videoUrl || raw.video || '',
    idealFor: raw.idealFor || 'Couples & Nature Enthusiasts',
    exclusions: Array.isArray(raw.exclusions) ? raw.exclusions : ['Personal trekking gear', 'Transportation to base point'],
    whatToBring: Array.isArray(raw.whatToBring) ? raw.whatToBring : ['Trekking shoes with grip', 'Rain jacket', 'Water bottle (min 1L)'],
    rating: raw.ratingScore || raw.rating || 0,
    reviewsCount: raw.reviewsCount || 0,
    featured: !!raw.featured,
    acceptingBookings: raw.acceptingBookings !== false,
    status: raw.status || 'active',
    rejectionReason: raw.rejectionReason,
    pricingRules: raw.pricingRules || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
};

const initialExperiences = getStoredExperiences();

const initialState: ExperiencesState = {
  items: initialExperiences,
  selectedExperience: initialExperiences[0] || null,
  loading: false,
  detailLoading: false,
  saving: false,
  error: null,
};

export const fetchExperiences = createAsyncThunk('experiences/fetchExperiences', async () => {
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
      ? await api.get('/vendor/experiences', requestConfig).catch(() => api.get('/admin/experiences', requestConfig)).catch(() => api.get('/experiences', requestConfig))
      : await api.get('/admin/experiences', requestConfig).catch(() => api.get('/vendor/experiences', requestConfig)).catch(() => api.get('/experiences', requestConfig));

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
      const normalized = rawList.map(normalizeExperience);
      saveExperiences(normalized);
      return normalized;
    }
  } catch {
    // Offline fallback
  }
  return getStoredExperiences();
});

export const fetchExperienceById = createAsyncThunk(
  'experiences/fetchExperienceById',
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
        .get(`/admin/experiences/${id}`, config)
        .catch(() => api.get(`/vendor/experiences/${id}`, config))
        .catch(() => api.get(`/experiences/${id}`, config));

      if (res.data?.data) {
        return normalizeExperience(res.data.data);
      }
    } catch {
      // Offline fallback
    }

    const state = getState() as { experiences: ExperiencesState };
    const found = state.experiences.items.find((exp) => exp.id === id || exp.code === id || exp.slug === id);

    if (found) return found;
    return rejectWithValue('Experience not found');
  }
);

export const updateExperienceAsync = createAsyncThunk(
  'experiences/updateExperience',
  async (updatedExp: ExperienceItem, { getState }) => {
    try {
      const isVendor = typeof window !== 'undefined' && localStorage.getItem('mahastays_auth_view_mode') === 'vendor';
      if (isVendor) {
        await api
          .put(`/vendor/experiences/${updatedExp.id}`, updatedExp)
          .catch(() => api.put(`/admin/experiences/${updatedExp.id}`, updatedExp));
      } else {
        await api
          .put(`/admin/experiences/${updatedExp.id}`, updatedExp)
          .catch(() => api.put(`/vendor/experiences/${updatedExp.id}`, updatedExp))
          .catch(() =>
            api.patch(`/admin/experiences/${updatedExp.id}/content`, {
              description: updatedExp.description,
            })
          );
      }
    } catch {
      // Offline fallback
    }

    const state = getState() as { experiences: ExperiencesState };
    const next = state.experiences.items.map((exp) =>
      exp.id === updatedExp.id ? updatedExp : exp
    );
    saveExperiences(next);
    return updatedExp;
  }
);

export const toggleExperienceBookingAsync = createAsyncThunk(
  'experiences/toggleBooking',
  async ({ id, acceptingBookings }: { id: string; acceptingBookings: boolean }, { rejectWithValue }) => {
    try {
      await api.patch(`/admin/experiences/${id}/accepting-bookings`, { acceptingBookings });
      return { id, acceptingBookings };
    } catch (err: any) {
      try {
        await api.patch(`/vendor/experiences/${id}/accepting-bookings`, { acceptingBookings });
        return { id, acceptingBookings };
      } catch {
        return { id, acceptingBookings };
      }
    }
  }
);

export const approveExperienceAsync = createAsyncThunk(
  'experiences/approveExperience',
  async ({ id, adminId }: { id: string; adminId?: string }, { getState }) => {
    try {
      await api
        .patch(`/admin/experiences/${id}/status`, { status: 'active' })
        .catch(() => api.patch(`/admin/experiences/${id}/approve`, { approvedByAdminId: adminId || 'adm_ops_01' }));
    } catch {
      // Offline fallback
    }
    const state = getState() as { experiences: ExperiencesState };
    const next = state.experiences.items.map((exp) =>
      exp.id === id
        ? {
            ...exp,
            status: 'active' as const,
            approvedAt: new Date().toISOString(),
            approvedByAdminId: adminId || 'adm_ops_01',
            rejectionReason: undefined,
          }
        : exp
    );
    saveExperiences(next);
    return next;
  }
);

export const rejectExperienceAsync = createAsyncThunk(
  'experiences/rejectExperience',
  async ({ id, reason }: { id: string; reason: string }, { getState }) => {
    try {
      await api
        .patch(`/admin/experiences/${id}/status`, { status: 'rejected', reason })
        .catch(() => api.patch(`/admin/experiences/${id}/reject`, { reason }));
    } catch {
      // Offline fallback
    }
    const state = getState() as { experiences: ExperiencesState };
    const next = state.experiences.items.map((exp) =>
      exp.id === id
        ? {
            ...exp,
            status: 'rejected' as const,
            rejectionReason: reason,
          }
        : exp
    );
    saveExperiences(next);
    return next;
  }
);

export const createExperienceAsync = createAsyncThunk(
  'experiences/createExperience',
  async (expData: Partial<ExperienceItem>, { getState }) => {
    const newExp: ExperienceItem = {
      id: expData.id || `exp_${Date.now()}`,
      code: expData.code || `EXP-${Math.floor(100 + Math.random() * 900)}`,
      slug: (expData.title || 'new-experience').toLowerCase().replace(/\s+/g, '-'),
      vendorId: expData.vendorId || '6ac968c0cd1b993fedb2dbef',
      vendorName: expData.vendorName || '',
      title: expData.title || '',
      category: expData.category || 'Trekking',
      difficulty: expData.difficulty || 'Easy',
      duration: expData.duration || '3 Hours',
      city: expData.city || 'Mahabaleshwar',
      numericPrice: expData.numericPrice || 0,
      originalPrice: expData.originalPrice || 0,
      image: expData.image || '',
      description: expData.description || '',
      highlights: expData.highlights || [],
      slots: expData.slots || [],
      pricingRules: expData.pricingRules || undefined,
      guide: expData.guide || {
        name: '',
        role: '',
        avatar: '',
      },
      rating: 0,
      reviewsCount: 0,
      featured: false,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    };

    const isVendor = typeof window !== 'undefined' && localStorage.getItem('mahastays_auth_view_mode') === 'vendor';
    let apiData: any = null;
    try {
      if (isVendor) {
        const res = await api
          .post('/vendor/experiences', newExp)
          .catch(() => api.post('/admin/experiences', newExp));
        apiData = res.data?.data;
      } else {
        const res = await api
          .post('/admin/experiences', newExp)
          .catch(() => api.post('/vendor/experiences', newExp));
        apiData = res.data?.data;
      }
    } catch (err: any) {
      console.warn('Backend experience creation notice:', err);
    }

    const state = getState() as { experiences: ExperiencesState };
    const savedExp = apiData ? { ...newExp, ...apiData } : newExp;
    const next = [savedExp, ...state.experiences.items];
    saveExperiences(next);
    return savedExp;
  }
);

export const deleteExperienceAsync = createAsyncThunk(
  'experiences/deleteExperience',
  async (id: string, { getState }) => {
    try {
      await api.delete(`/admin/experiences/${id}`).catch(() => api.delete(`/experiences/${id}`));
    } catch {
      // Offline fallback
    }
    const state = getState() as { experiences: ExperiencesState };
    const next = state.experiences.items.filter((exp) => exp.id !== id);
    saveExperiences(next);
    return id;
  }
);

export const experiencesSlice = createSlice({
  name: 'experiences',
  initialState,
  reducers: {
    setSelectedExperience: (state, action: PayloadAction<ExperienceItem | null>) => {
      state.selectedExperience = action.payload;
    },
    setExperiencesList: (state, action: PayloadAction<ExperienceItem[]>) => {
      state.items = action.payload;
      saveExperiences(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchExperiences
      .addCase(fetchExperiences.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExperiences.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchExperiences.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch experiences';
      })
      // fetchExperienceById
      .addCase(fetchExperienceById.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchExperienceById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedExperience = action.payload;
      })
      .addCase(fetchExperienceById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch experience details';
      })
      // updateExperienceAsync
      .addCase(updateExperienceAsync.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateExperienceAsync.fulfilled, (state, action) => {
        state.saving = false;
        state.selectedExperience = action.payload;
        state.items = state.items.map((exp) => (exp.id === action.payload.id ? action.payload : exp));
      })
      .addCase(updateExperienceAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || 'Failed to update experience';
      })
      // approvals
      .addCase(approveExperienceAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        if (state.selectedExperience) {
          const updated = action.payload.find((p) => p.id === state.selectedExperience?.id);
          if (updated) state.selectedExperience = updated;
        }
      })
      .addCase(rejectExperienceAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        if (state.selectedExperience) {
          const updated = action.payload.find((p) => p.id === state.selectedExperience?.id);
          if (updated) state.selectedExperience = updated;
        }
      })
      .addCase(toggleExperienceBookingAsync.fulfilled, (state, action) => {
        const item = state.items.find((p) => p.id === action.payload.id);
        if (item) item.acceptingBookings = action.payload.acceptingBookings;
        if (state.selectedExperience && state.selectedExperience.id === action.payload.id) {
          state.selectedExperience.acceptingBookings = action.payload.acceptingBookings;
        }
        saveExperiences(state.items);
      })
      .addCase(createExperienceAsync.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
      })
      .addCase(deleteExperienceAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((exp) => exp.id !== action.payload);
      });
  },
});

export const { setSelectedExperience, setExperiencesList } = experiencesSlice.actions;
export default experiencesSlice.reducer;
