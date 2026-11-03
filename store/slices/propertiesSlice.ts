import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { getApiErrorMessage } from '../../lib/api';
import { PropertyItem } from '../../types';

interface PropertiesState {
  items: PropertyItem[];
  selectedProperty: PropertyItem | null;
  loading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
}

const getStoredProperties = (): PropertyItem[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mahastays_db_properties');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && !parsed.some((p: any) => p.id === 'prop_01' || p.id === 'prop_02')) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return [];
};

const saveProperties = (items: PropertyItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mahastays_db_properties', JSON.stringify(items));
    } catch {
      // ignore
    }
  }
};

const initialItems = getStoredProperties();

const initialState: PropertiesState = {
  items: initialItems,
  selectedProperty: initialItems[0] || null,
  loading: false,
  detailLoading: false,
  saving: false,
  error: null,
};

export const normalizeProperty = (raw: any): PropertyItem => {
  const images: string[] = [];
  if (Array.isArray(raw.images)) {
    raw.images.forEach((img: any) => {
      const url = typeof img === 'string' ? img : img?.url;
      if (url && !images.includes(url)) images.push(url);
    });
  }
  if (raw.image && !images.includes(raw.image)) images.push(raw.image);
  if (raw.gallery && Array.isArray(raw.gallery)) {
    raw.gallery.forEach((url: string) => {
      if (url && !images.includes(url)) images.push(url);
    });
  }
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200');
  }

  const rooms = (raw.rooms || []).map((r: any, idx: number) => {
    const roomImgs = (r.images || []).map((img: any) => (typeof img === 'string' ? img : img?.url || ''));
    return {
      roomId: r.roomId || r.id || `rm_${idx + 1}`,
      name: r.name || 'Standard Room',
      badge: r.badge || '',
      tagline: r.tagline || '',
      roomSize: r.roomSize || r.sizeSqFt || 350,
      bedType: r.bedType || 'King Bed',
      maxGuests: r.maxGuests || r.capacity || 2,
      basePrice: r.basePrice || r.pricePerNight || raw.numericPrice || 6500,
      originalPrice: r.originalPrice,
      count: r.count || 2,
      images: roomImgs.length > 0 ? roomImgs : [images[0]],
      amenities: r.amenities || ['Free WiFi', 'Air Conditioning', 'Valley View'],
    };
  });

  return {
    id: raw.id || raw._id,
    code: raw.code || raw.slug || `PROP-${(raw.id || '').slice(-4)}`,
    slug: raw.slug || `prop-${raw.id}`,
    vendorId: raw.vendorId || '6adeef17f4597150f0c199a4',
    vendorName: raw.vendorName || raw.host?.name || 'HillView Hospitality Pvt Ltd',
    name: raw.name || raw.title || 'Resort Stay',
    propertyType: (raw.propertyType || raw.type?.toLowerCase() || 'hotel') as any,
    tagline: raw.tagline || '',
    badge: raw.badge || '',
    description: raw.description || '',
    longDescription:
      raw.longDescription ||
      raw.description ||
      'Commanding breathtaking clifftop vistas over the vast Panchgani valley, Sunset Ridge Private Villa is an exclusive standalone sanctuary tailored for celebrations, reunion weekends, and unforgettable group stays.',
    location: raw.location || 'Mahabaleshwar',
    city: raw.city || 'Mahabaleshwar',
    numericPrice: raw.numericPrice || raw.inrPrice || 6500,
    originalPrice: raw.originalPrice || (raw.numericPrice ? Math.round(raw.numericPrice * 1.25) : 8000),
    rating: raw.ratingScore || raw.rating || 4.8,
    reviewsCount: raw.reviewsCount || 40,
    images,
    gallery: raw.gallery && raw.gallery.length > 0 ? raw.gallery : images,
    videos: raw.videos || [],
    videoUrl: raw.videoUrl || (raw.videos && raw.videos[0]) || '',
    idealFor: raw.idealFor || 'Family, Group, Couples',
    host: raw.host || {
      name: 'Kunal & Caretaker Ramesh',
      role: 'Property Owner & Manager',
      experience: 'Host since 2019',
      staysCount: '64+ Verified Group Stays',
      verified: true,
      avatar: '',
    },
    keyAmenities: raw.keyAmenities || [
      { name: 'Infinity Pool Deck', desc: 'Heated pool with valley view' },
      { name: 'Private Chef', desc: 'On-demand dining' },
      { name: 'Butler Service', desc: 'Personalised assistance' },
      { name: 'High-Speed Wi-Fi', desc: 'Stay connected' },
    ],
    highlights:
      raw.highlights && raw.highlights.length > 0
        ? raw.highlights.map((h: any) =>
            typeof h === 'string' ? { title: h, desc: '' } : { title: h.title, desc: h.desc || '' }
          )
        : [
            { title: 'Stunning valley & waterfall view' },
            { title: 'Private infinity pool with heating' },
            { title: 'Dedicated chef and butler service' },
            { title: 'Perfect for family stays & celebrations' },
          ],
    policies: {
      checkInTime: raw.policies?.checkInTime || '1:00 PM',
      checkOutTime: raw.policies?.checkOutTime || '10:00 AM',
      earlyCheckInNote: raw.policies?.earlyCheckInNote || 'Early check-in subject to availability.',
      cancellationPolicy:
        raw.policies?.cancellationPolicy ||
        'Full refund up to 48 hours before check-in. 50% refund thereafter.',
      suitabilityRules:
        raw.policies?.suitabilityRules || [
          'Pets allowed (on request)',
          'Smoking in outdoor areas',
          'Group & bachelor friendly',
          'Max 12 guests per estate',
        ],
      guidelines:
        raw.policies?.guidelines || [
          'Quiet hours: 10:00 PM - 7:00 AM',
          'Government ID required',
        ],
      fullAddress:
        raw.address?.fullAddress ||
        raw.policies?.fullAddress ||
        raw.location ||
        'Plot 12, Venna Lake Road, Mahabaleshwar, Maharashtra',
      petsAllowed: raw.policies?.petsAllowed ?? true,
      smokingAllowed: raw.policies?.smokingAllowed ?? false,
      coupleFriendly: raw.policies?.coupleFriendly ?? true,
    },
    address: raw.address || {
      fullAddress: raw.location || 'Plot 12, Venna Lake Road, Mahabaleshwar, Maharashtra',
    },
    rooms:
      rooms.length > 0
        ? rooms
        : [
            {
              roomId: 'rm_deluxe_01',
              name: 'Entire 4BHK Villa (Private Infinity Pool)',
              badge: 'Exclusive Takeover',
              tagline: 'Private Deck Overlooking Cascading Waterfall',
              bedType: '4 King Beds',
              roomSize: 2200,
              maxGuests: 12,
              basePrice: raw.numericPrice || 22000,
              originalPrice: 28000,
              count: 1,
              images: [images[0]],
              amenities: ['Private Infinity Pool', 'Billiards Room', 'Projector Room', 'BBQ Grill'],
            },
          ],
    amenities:
      raw.amenities && raw.amenities.length > 0
        ? raw.amenities.map((a: any) => (typeof a === 'string' ? a : a.name || ''))
        : [
            'Heated Infinity Pool',
            'Private Chef & Butler',
            'High-Speed Wi-Fi',
            'Landscaped Lawn & BBQ',
            'Valley View Gazebo',
            'Private Balcony',
            'Smart TV',
            'Bathtub with View',
            'In-House Parking',
            'Daily Housekeeping',
          ],
    featured: !!raw.featured,
    status: raw.status || 'active',
    rejectionReason: raw.rejectionReason,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
};

// Async Thunks
export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (_, { rejectWithValue }) => {
    try {
      const isVendor = typeof window !== 'undefined' && localStorage.getItem('mahastays_auth_view_mode') === 'vendor';
      const res = isVendor
        ? await api.get('/vendor/properties').catch(() => api.get('/properties'))
        : await api.get('/admin/properties').catch(() => api.get('/properties'));

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
        const normalized = rawList.map(normalizeProperty);
        saveProperties(normalized);
        return normalized;
      }
    } catch {
      // Backend unavailable, fallback to local/localStorage
    }
    return getStoredProperties();
  }
);

export const fetchPropertyById = createAsyncThunk(
  'properties/fetchPropertyById',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api
        .get(`/admin/properties/${id}`)
        .catch(() => api.get(`/vendor/properties/${id}`))
        .catch(() => api.get(`/properties/${id}`));

      if (res.data?.data) {
        return normalizeProperty(res.data.data);
      }
    } catch {
      // Offline fallback
    }

    const state = getState() as { properties: PropertiesState };
    const found = state.properties.items.find(
      (p) => p.id === id || p.code === id || p.slug === id
    );

    if (found) return found;
    return rejectWithValue('Property not found');
  }
);

export const updatePropertyAsync = createAsyncThunk(
  'properties/updateProperty',
  async (updatedProp: PropertyItem, { getState, rejectWithValue }) => {
    try {
      const isVendor = typeof window !== 'undefined' && localStorage.getItem('mahastays_auth_view_mode') === 'vendor';
      if (isVendor) {
        await api
          .put(`/vendor/properties/${updatedProp.id}`, updatedProp)
          .catch(() => api.put(`/admin/properties/${updatedProp.id}`, updatedProp));
      } else {
        await api
          .put(`/admin/properties/${updatedProp.id}`, updatedProp)
          .catch(() => api.put(`/vendor/properties/${updatedProp.id}`, updatedProp))
          .catch(() =>
            api.patch(`/admin/properties/${updatedProp.id}/content`, {
              name: updatedProp.name,
              tagline: updatedProp.tagline,
              description: updatedProp.description,
              badge: updatedProp.badge,
            })
          );
      }
    } catch {
      // Offline fallback
    }

    const state = getState() as { properties: PropertiesState };
    const next = state.properties.items.map((p) =>
      p.id === updatedProp.id ? updatedProp : p
    );
    saveProperties(next);
    return updatedProp;
  }
);

export const togglePropertyBookingAsync = createAsyncThunk(
  'properties/toggleBooking',
  async ({ id, acceptingBookings }: { id: string; acceptingBookings: boolean }, { rejectWithValue }) => {
    try {
      await api.patch(`/admin/properties/${id}/accepting-bookings`, { acceptingBookings });
      return { id, acceptingBookings };
    } catch (err: any) {
      try {
        await api.patch(`/vendor/properties/${id}/accepting-bookings`, { acceptingBookings });
        return { id, acceptingBookings };
      } catch {
        return { id, acceptingBookings };
      }
    }
  }
);

export const approvePropertyAsync = createAsyncThunk(
  'properties/approveProperty',
  async ({ id, adminId }: { id: string; adminId?: string }, { getState, rejectWithValue }) => {
    try {
      await api
        .patch(`/admin/properties/${id}/status`, { status: 'active' })
        .catch(() => api.patch(`/admin/properties/${id}/approve`, { approvedByAdminId: adminId || 'adm_ops_01' }));
    } catch {
      // Offline fallback
    }
    const state = getState() as { properties: PropertiesState };
    const next = state.properties.items.map((p) =>
      p.id === id
        ? {
            ...p,
            status: 'active' as const,
            approvedAt: new Date().toISOString(),
            approvedByAdminId: adminId || 'adm_ops_01',
            rejectionReason: undefined,
          }
        : p
    );
    saveProperties(next);
    return next;
  }
);

export const rejectPropertyAsync = createAsyncThunk(
  'properties/rejectProperty',
  async ({ id, reason }: { id: string; reason: string }, { getState, rejectWithValue }) => {
    try {
      await api
        .patch(`/admin/properties/${id}/status`, { status: 'rejected', reason })
        .catch(() => api.patch(`/admin/properties/${id}/reject`, { reason }));
    } catch {
      // Offline fallback
    }
    const state = getState() as { properties: PropertiesState };
    const next = state.properties.items.map((p) =>
      p.id === id
        ? {
            ...p,
            status: 'rejected' as const,
            rejectionReason: reason,
          }
        : p
    );
    saveProperties(next);
    return next;
  }
);

export const createPropertyAsync = createAsyncThunk(
  'properties/createProperty',
  async (propData: Partial<PropertyItem>, { getState, rejectWithValue }) => {
    const newProp: PropertyItem = {
      id: propData.id || `prop_${Date.now()}`,
      code: propData.code || `PRP-${Math.floor(100 + Math.random() * 900)}`,
      slug: (propData.name || 'new-property').toLowerCase().replace(/\s+/g, '-'),
      vendorId: propData.vendorId || 'vnd_resort_01',
      vendorName: propData.vendorName || 'HillView Hospitality Pvt Ltd',
      name: propData.name || 'New Property',
      propertyType: propData.propertyType || 'resort',
      tagline: propData.tagline || 'Experience luxury stay in Mahabaleshwar',
      badge: propData.badge || 'Partner Listing',
      description: propData.description || 'Spacious property with state-of-the-art amenities.',
      location: propData.location || 'Venna Lake Road, Mahabaleshwar',
      city: propData.city || 'Mahabaleshwar',
      numericPrice: propData.numericPrice || 7500,
      originalPrice: propData.originalPrice || 9000,
      rating: 0,
      reviewsCount: 0,
      images: propData.images?.length
        ? propData.images
        : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'],
      rooms: propData.rooms || [
        {
          roomId: `rm_${Date.now()}`,
          name: 'Deluxe Valley Suite',
          maxGuests: 2,
          basePrice: propData.numericPrice || 7500,
          count: 5,
          images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80'],
          amenities: ['Breakfast included', 'Valley View', 'WiFi', 'AC'],
        },
      ],
      amenities: propData.amenities || ['Free WiFi', 'Breakfast Included', 'Swimming Pool', 'Parking'],
      featured: false,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    };

    try {
      await api.post('/properties', newProp).catch(() => api.post('/vendor/properties', newProp));
    } catch {
      // Offline fallback
    }

    const state = getState() as { properties: PropertiesState };
    const next = [newProp, ...state.properties.items];
    saveProperties(next);
    return newProp;
  }
);

export const deletePropertyAsync = createAsyncThunk(
  'properties/deleteProperty',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      await api.delete(`/admin/properties/${id}`).catch(() => api.delete(`/properties/${id}`));
    } catch {
      // Offline fallback
    }
    const state = getState() as { properties: PropertiesState };
    const next = state.properties.items.filter((p) => p.id !== id);
    saveProperties(next);
    return id;
  }
);

export const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setSelectedProperty: (state, action: PayloadAction<PropertyItem | null>) => {
      state.selectedProperty = action.payload;
    },
    setPropertiesList: (state, action: PayloadAction<PropertyItem[]>) => {
      state.items = action.payload;
      saveProperties(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProperties
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch properties';
      })
      // fetchPropertyById
      .addCase(fetchPropertyById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedProperty = action.payload;
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch property details';
      })
      // updatePropertyAsync
      .addCase(updatePropertyAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updatePropertyAsync.fulfilled, (state, action) => {
        state.saving = false;
        state.selectedProperty = action.payload;
        state.items = state.items.map((p) => (p.id === action.payload.id ? action.payload : p));
      })
      .addCase(updatePropertyAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || 'Failed to update property';
      })
      // approvals
      .addCase(approvePropertyAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        if (state.selectedProperty) {
          const updated = action.payload.find((p) => p.id === state.selectedProperty?.id);
          if (updated) state.selectedProperty = updated;
        }
      })
      .addCase(rejectPropertyAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        if (state.selectedProperty) {
          const updated = action.payload.find((p) => p.id === state.selectedProperty?.id);
          if (updated) state.selectedProperty = updated;
        }
      })
      .addCase(togglePropertyBookingAsync.fulfilled, (state, action) => {
        const item = state.items.find((p) => p.id === action.payload.id);
        if (item) item.acceptingBookings = action.payload.acceptingBookings;
        if (state.selectedProperty && state.selectedProperty.id === action.payload.id) {
          state.selectedProperty.acceptingBookings = action.payload.acceptingBookings;
        }
      })
      .addCase(createPropertyAsync.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
      })
      .addCase(deletePropertyAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export const { setSelectedProperty, setPropertiesList } = propertiesSlice.actions;
export default propertiesSlice.reducer;
