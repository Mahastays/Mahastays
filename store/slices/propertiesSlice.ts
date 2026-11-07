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
      count: r.count || 1,
      images: roomImgs,
      amenities: r.amenities || [],
    };
  });

  const roomPrices = rooms.map((r: any) => Number(r.basePrice)).filter((p: number) => !isNaN(p) && p > 0);
  const startingPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : (raw.numericPrice || raw.inrPrice || 0);
  const origPrices = rooms.map((r: any) => Number(r.originalPrice)).filter((p: number) => !isNaN(p) && p > 0);
  const startingOrigPrice = origPrices.length > 0 ? Math.min(...origPrices) : raw.originalPrice;

  return {
    id: raw.id || raw._id,
    code: raw.code || raw.slug || `PROP-${(raw.id || '').slice(-4)}`,
    slug: raw.slug || `prop-${raw.id}`,
    vendorId: raw.vendorId || '',
    vendorName: raw.vendorName || raw.host?.name || '',
    name: raw.name || raw.title || 'Resort Stay',
    propertyType: (raw.propertyType || raw.type?.toLowerCase() || 'hotel') as any,
    tagline: raw.tagline || '',
    badge: raw.badge || '',
    description: raw.description || '',
    longDescription: raw.longDescription || raw.description || '',
    location: raw.location || '',
    city: raw.city || 'Mahabaleshwar',
    numericPrice: startingPrice,
    originalPrice: startingOrigPrice,
    rating: raw.ratingScore || raw.rating || 0,
    reviewsCount: raw.reviewsCount || 0,
    images,
    gallery: raw.gallery && raw.gallery.length > 0 ? raw.gallery : images,
    videos: raw.videos || [],
    videoUrl: raw.videoUrl || (raw.videos && raw.videos[0]) || '',
    idealFor: raw.idealFor || '',
    host: {
      name: raw.host?.name || raw.hostName || raw.vendorName || 'Property Host',
      role: raw.host?.role || raw.hostRole || 'Property Owner & Manager',
      experience: raw.host?.experience || raw.hostExperience || 'Host since 2021',
      staysCount: raw.host?.staysCount || '50+ Verified Stays',
      verified: raw.host?.verified ?? true,
      avatar: raw.host?.avatar || raw.hostAvatar || '',
      confirmationBadge: raw.host?.confirmationBadge || 'Instant Booking Confirmed',
    },
    keyAmenities: Array.isArray(raw.keyAmenities) ? raw.keyAmenities : [],
    facilityCategories: Array.isArray(raw.facilityCategories) ? raw.facilityCategories : [],
    highlights:
      raw.highlights && raw.highlights.length > 0
        ? raw.highlights.map((h: any) =>
            typeof h === 'string' ? { title: h, desc: '' } : { title: h.title, desc: h.desc || '' }
          )
        : [],
    policies: {
      checkInTime: raw.policies?.checkInTime || raw.checkInTime || '14:00',
      checkOutTime: raw.policies?.checkOutTime || raw.checkOutTime || '11:00',
      earlyCheckInNote: raw.policies?.earlyCheckInNote || raw.earlyCheckInNote || '',
      cancellationPolicy: raw.policies?.cancellationPolicy || raw.cancellationPolicy || '',
      suitabilityRules: Array.isArray(raw.policies?.suitabilityRules)
        ? raw.policies.suitabilityRules
        : (Array.isArray(raw.suitabilityRules) ? raw.suitabilityRules : (Array.isArray(raw.rules) ? raw.rules : [])),
      guidelines: raw.policies?.guidelines || [],
      fullAddress: raw.address?.fullAddress || raw.policies?.fullAddress || raw.location || '',
      petsAllowed: raw.policies?.petsAllowed ?? raw.petsAllowed ?? false,
      smokingAllowed: raw.policies?.smokingAllowed ?? raw.smokingAllowed ?? false,
      coupleFriendly: raw.policies?.coupleFriendly ?? raw.coupleFriendly ?? true,
    },
    address: {
      fullAddress: raw.address?.fullAddress || raw.location || '',
      lat: typeof raw.address?.lat === 'number' ? raw.address.lat : typeof raw.mapCoordinates?.lat === 'number' ? raw.mapCoordinates.lat : 17.9237,
      lng: typeof raw.address?.lng === 'number' ? raw.address.lng : typeof raw.mapCoordinates?.lng === 'number' ? raw.mapCoordinates.lng : 73.6586,
      mapLink: raw.address?.mapLink || (raw.address?.lat && raw.address?.lng ? `https://www.google.com/maps?q=${raw.address.lat},${raw.address.lng}` : ''),
    },
    nearbyAttractions: Array.isArray(raw.nearbyAttractions) ? raw.nearbyAttractions : undefined,
    rooms,
    amenities:
      raw.amenities && raw.amenities.length > 0
        ? raw.amenities.map((a: any) => (typeof a === 'string' ? a : a.name || ''))
        : [],
    featured: !!raw.featured,
    status: raw.status || 'active',
    rejectionReason: raw.rejectionReason,
    pricingRules: raw.pricingRules || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
};

// Async Thunks
export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (_, { rejectWithValue }) => {
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
        ? await api.get('/vendor/properties', requestConfig).catch(() => api.get('/admin/properties', requestConfig)).catch(() => api.get('/properties', requestConfig))
        : await api.get('/admin/properties', requestConfig).catch(() => api.get('/vendor/properties', requestConfig)).catch(() => api.get('/properties', requestConfig));

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
      const config = {
        params: { _t: Date.now() },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      };
      const res = await api
        .get(`/admin/properties/${id}`, config)
        .catch(() => api.get(`/vendor/properties/${id}`, config))
        .catch(() => api.get(`/properties/${id}`, config));

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
    const roomPrices = (updatedProp.rooms || []).map((r: any) => Number(r.basePrice)).filter((p: number) => !isNaN(p) && p > 0);
    const minRoomPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : (updatedProp.numericPrice || 0);
    const origPrices = (updatedProp.rooms || []).map((r: any) => Number(r.originalPrice)).filter((p: number) => !isNaN(p) && p > 0);
    const minOrigPrice = origPrices.length > 0 ? Math.min(...origPrices) : updatedProp.originalPrice;

    const propToSave: PropertyItem = {
      ...updatedProp,
      numericPrice: minRoomPrice,
      originalPrice: minOrigPrice,
    };

    let serverData: any = null;
    try {
      const isVendor = typeof window !== 'undefined' && localStorage.getItem('mahastays_auth_view_mode') === 'vendor';
      if (isVendor) {
        const res = await api
          .put(`/vendor/properties/${propToSave.id}`, propToSave)
          .catch(() => api.put(`/admin/properties/${propToSave.id}`, propToSave));
        serverData = res?.data?.data || res?.data;
      } else {
        const res = await api
          .put(`/admin/properties/${propToSave.id}`, propToSave)
          .catch(() => api.put(`/vendor/properties/${propToSave.id}`, propToSave))
          .catch(() =>
            api.patch(`/admin/properties/${propToSave.id}/content`, {
              name: propToSave.name,
              tagline: propToSave.tagline,
              description: propToSave.description,
              badge: propToSave.badge,
            })
          );
        serverData = res?.data?.data || res?.data;
      }
    } catch {
      // Offline fallback
    }

    const finalProp = serverData ? normalizeProperty(serverData) : propToSave;
    const state = getState() as { properties: PropertiesState };
    const next = state.properties.items.map((p) =>
      p.id === finalProp.id ? finalProp : p
    );
    saveProperties(next);
    return finalProp;
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
      vendorName: propData.vendorName || '',
      name: propData.name || '',
      propertyType: propData.propertyType || 'resort',
      tagline: propData.tagline || '',
      badge: propData.badge || '',
      description: propData.description || '',
      location: propData.location || '',
      city: propData.city || 'Mahabaleshwar',
      numericPrice: propData.numericPrice || 0,
      originalPrice: propData.originalPrice || 0,
      rating: 0,
      reviewsCount: 0,
      images: propData.images?.length ? propData.images : [],
      rooms: propData.rooms || [],
      amenities: propData.amenities || [],
      host: propData.host,
      keyAmenities: propData.keyAmenities || [],
      facilityCategories: propData.facilityCategories || [],
      highlights: propData.highlights || [],
      policies: propData.policies,
      pricingRules: propData.pricingRules || undefined,
      featured: false,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    };

    try {
      const payload = {
        name: newProp.name,
        propertyType: newProp.propertyType,
        tagline: newProp.tagline,
        badge: newProp.badge,
        description: newProp.description,
        location: newProp.location,
        city: newProp.city,
        numericPrice: newProp.numericPrice,
        vendorId: newProp.vendorId,
        address: {
          fullAddress: newProp.location || 'Venna Lake Road, Mahabaleshwar',
          lat: 17.9237,
          lng: 73.6586,
        },
        images: newProp.images.map((url, i) => ({ url, isCover: i === 0 })),
        rooms: newProp.rooms.map((r, idx) => ({
          roomId: r.roomId || `rm_${Date.now()}_${idx}`,
          name: r.name,
          basePrice: r.basePrice,
          count: r.count || 1,
          maxGuests: r.maxGuests || 2,
          capacity: { adults: r.maxGuests || 2, children: 1 },
          images: r.images?.length ? r.images : newProp.images,
          amenities: r.amenities?.length ? r.amenities : ['Breakfast included'],
        })),
        amenities: newProp.amenities?.map((name) => ({ name })) || [],
        highlights: newProp.highlights || [],
        host: newProp.host,
        keyAmenities: newProp.keyAmenities,
        facilityCategories: newProp.facilityCategories,
        policies: {
          checkInTime: newProp.policies?.checkInTime || '14:00',
          checkOutTime: newProp.policies?.checkOutTime || '11:00',
          earlyCheckInNote: newProp.policies?.earlyCheckInNote || '',
          cancellationPolicy: newProp.policies?.cancellationPolicy || '',
          suitabilityRules: newProp.policies?.suitabilityRules || [],
          petsAllowed: newProp.policies?.petsAllowed || false,
          smokingAllowed: newProp.policies?.smokingAllowed || false,
          coupleFriendly: newProp.policies?.coupleFriendly !== false,
        },
        pricingRules: newProp.pricingRules,
        status: 'pending_approval',
      };

      const res = await api.post('/admin/properties', payload)
        .catch(() => api.post('/vendor/properties', payload));

      if (res?.data?.data) {
        const normalized = normalizeProperty(res.data.data);
        const state = getState() as { properties: PropertiesState };
        const next = [normalized, ...state.properties.items.filter((p) => p.id !== normalized.id)];
        saveProperties(next);
        return normalized;
      }
    } catch (err) {
      console.warn('Backend property create error, falling back locally:', err);
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
