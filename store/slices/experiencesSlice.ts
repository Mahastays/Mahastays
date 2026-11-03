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
    id: t.id || t.tierId || `tier_${idx + 1}`,
    name: t.name || 'Standard Pass',
    badge: t.badge || 'Popular',
    pricePerPerson: t.pricePerPerson || raw.numericPrice || 250,
    originalPrice: t.originalPrice || raw.originalPrice,
    description: t.description || 'General entry & guided trail pass',
    features: Array.isArray(t.features) ? t.features : ['Expert Guide Included', 'Safety Gear', 'Valley Viewpoint Access'],
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
    code: raw.code || raw.slug || `EXP-${(raw.id || '').slice(-4)}`,
    slug: raw.slug || `exp-${raw.id}`,
    vendorId: raw.vendorId || '6ac968c0cd1b993fedb2dbef',
    vendorName: raw.vendorName || 'Sahyadri Adventure & Treks',
    title: raw.title || raw.name || 'Guided Mountain Experience',
    category: raw.category || 'Trekking',
    difficulty: (raw.difficulty || 'Moderate') as any,
    duration: raw.duration || '2 Hours (6:00 AM – 8:00 AM)',
    city: raw.city || 'Old Mahabaleshwar',
    numericPrice: raw.numericPrice || 250,
    originalPrice: raw.originalPrice || 350,
    image,
    gallery,
    description: raw.description || 'A guided sunrise trek to Arthur Seat with sweeping views over the Savitri valley.',
    highlights: Array.isArray(raw.highlights) && raw.highlights.length > 0 ? raw.highlights : [
      'Certified Wilderness First-Aid Guide',
      'Panoramic 360° Valley Views',
      'Complimentary Herbal Tea at the Summit',
    ],
    slots: slots.length > 0 ? slots : [
      { slotId: 'slot-sunrise', time: '06:00 AM – 08:00 AM', label: 'Sunrise Batch', capacity: 20, price: raw.numericPrice || 250 },
      { slotId: 'slot-sunset', time: '04:30 PM – 06:30 PM', label: 'Golden Hour Batch', capacity: 20, price: raw.numericPrice || 250 },
    ],
    tiers: tiers.length > 0 ? tiers : [
      {
        id: 'tier-standard',
        name: 'Standard Ticket',
        badge: 'Best Seller',
        pricePerPerson: raw.numericPrice || 250,
        originalPrice: raw.originalPrice || 350,
        description: 'Complete trail guidance with safety briefing',
        features: ['Lead Guide', 'Trekking Poles on Request', 'First-Aid Standby'],
      },
    ],
    timeline: Array.isArray(raw.timeline) && raw.timeline.length > 0 ? raw.timeline : [
      { time: '05:45 AM', title: 'Assembly & Gear Check', desc: 'Meet at Old Mahabaleshwar Base Point for safety briefing.' },
      { time: '06:15 AM', title: 'Ridge Trail Ascent', desc: 'Paced walking through dense evergreen canopy.' },
      { time: '07:00 AM', title: 'Arthur Seat Sunrise Peak', desc: 'Watch golden sunrise lighting up the Konkan cliffs.' },
      { time: '08:00 AM', title: 'Descent & Hot Tea', desc: 'Reach base camp, enjoy warm local tea and conclude.' },
    ],
    inclusions: inclusions.length > 0 ? inclusions : [
      { title: 'Certified Guide', desc: 'Experienced mountaineering leader' },
      { title: 'Entry Fees', desc: 'Forest department permits included' },
      { title: 'Refreshments', desc: 'Hot beverage & energy snack at summit' },
    ],
    meetingPoint: raw.meetingPoint || 'Arthur Seat Point Base Parking, Old Mahabaleshwar',
    maxGroupSize: raw.maxGroupSize || 20,
    guide: raw.guide || {
      name: 'Sahyadri Mountaineering Club',
      role: 'Certified Trek Leader',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
    rating: raw.ratingScore || 4.9,
    reviewsCount: raw.reviewsCount || 210,
    featured: !!raw.featured,
    status: raw.status || 'active',
    rejectionReason: raw.rejectionReason,
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
    const res = isVendor
      ? await api.get('/vendor/experiences').catch(() => api.get('/experiences'))
      : await api.get('/admin/experiences').catch(() => api.get('/experiences'));

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
      const res = await api
        .get(`/admin/experiences/${id}`)
        .catch(() => api.get(`/vendor/experiences/${id}`))
        .catch(() => api.get(`/experiences/${id}`));

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
      vendorName: expData.vendorName || 'Sahyadri Adventure & Treks',
      title: expData.title || 'New Mountain Experience',
      category: expData.category || 'Trekking',
      difficulty: expData.difficulty || 'Easy',
      duration: expData.duration || '3 Hours',
      city: expData.city || 'Mahabaleshwar',
      numericPrice: expData.numericPrice || 1500,
      originalPrice: expData.originalPrice || 1900,
      image:
        expData.image ||
        'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=80',
      description: expData.description || 'Guided outdoor experience through scenic trails and vistas.',
      highlights: expData.highlights || ['Expert Guide Included', 'Safety Gear', 'Light Refreshments'],
      slots: expData.slots || [
        { slotId: 'slot_1', time: '07:00 AM - 10:00 AM', label: 'Morning Slot', capacity: 12, price: expData.numericPrice || 1500 },
        { slotId: 'slot_2', time: '04:00 PM - 07:00 PM', label: 'Sunset Slot', capacity: 12, price: expData.numericPrice || 1500 },
      ],
      guide: expData.guide || {
        name: 'Sahyadri Expert Guide',
        role: 'Certified Guide',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
      rating: 0,
      reviewsCount: 0,
      featured: false,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    };

    try {
      await api.post('/experiences', newExp).catch(() => api.post('/vendor/experiences', newExp));
    } catch {
      // Offline fallback
    }

    const state = getState() as { experiences: ExperiencesState };
    const next = [newExp, ...state.experiences.items];
    saveExperiences(next);
    return newExp;
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
