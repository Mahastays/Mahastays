import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { getApiErrorMessage } from '../../lib/api';

export interface PropertyImage {
  url: string;
  alt?: string;
  isCover?: boolean;
}

export interface PropertyRoom {
  roomId: string;
  name: string;
  badge?: string;
  tagline?: string;
  size?: string;
  roomSize?: number;
  bed?: string;
  bedType?: string;
  maxGuests: number;
  adults?: number;
  children?: number;
  pricePerNight: number;
  originalPrice?: number;
  weekendPrice?: number;
  holidayPrice?: number;
  count: number;
  image?: string;
  images: string[];
  amenities: string[];
}

export interface PropertyHighlight {
  title: string;
  desc: string;
  icon: string;
}

export interface PropertyAmenity {
  name: string;
  icon: string;
}

export interface PropertyPolicies {
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  coupleFriendly: boolean;
  maxGuestsPerRoom: number;
}

export interface PropertyAttraction {
  name: string;
  distance: string;
  time?: string;
}

export interface PropertyItem {
  id: string;
  _id: string;
  vendorId?: string;
  name: string;
  propertyType: string;
  type: string;
  price: string;
  numericPrice: number;
  inrPrice: number;
  originalPrice?: number;
  tagline?: string;
  badge?: string;
  tags: string[];
  description: string;
  location: string;
  locationId?: string;
  serviceableLocation?: string;
  city: string;
  country: string;
  mapCoordinates?: { lat: number; lng: number };
  images: PropertyImage[];
  gallery: string[];
  rating: number;
  reviewsCount: number;
  petsAllowed?: boolean;
  coupleFriendly?: boolean;
  bgColor?: string | null;
  gradientOverlay?: string | null;
  featured?: boolean;
  status?: string;
  // Detail fields
  longDescription?: string;
  state?: string;
  address?: {
    fullAddress: string;
    lat: number;
    lng: number;
    mapLink?: string;
  };
  videos?: string[];
  host?: {
    name: string;
    role?: string;
    experience?: string;
    avatar?: string;
  };
  highlights?: PropertyHighlight[];
  amenities?: PropertyAmenity[];
  policies?: PropertyPolicies;
  rooms?: PropertyRoom[];
  attractions?: PropertyAttraction[];
  ratingBreakdown?: Array<{ label: string; score: string }>;
  reviews?: any[];
}

interface PropertyFilters {
  destination?: string;
  serviceableLocation?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  petsAllowed?: 'true' | 'false';
  coupleFriendly?: 'true' | 'false';
  featured?: 'true' | 'false';
  sort?: string;
  search?: string;
}

interface PropertyState {
  items: PropertyItem[];
  selectedProperty: PropertyItem | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  filters: PropertyFilters;
  total: number;
}

const initialState: PropertyState = {
  items: [],
  selectedProperty: null,
  loading: false,
  detailLoading: false,
  error: null,
  filters: {},
  total: 0,
};

// Async Thunks calling Backend API via Axios
export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (params: PropertyFilters | undefined, { rejectWithValue }) => {
    try {
      const res = await api.get('/properties', { params });
      return {
        items: (res.data?.data || []) as PropertyItem[],
        total: res.data?.meta?.total ?? res.data?.data?.length ?? 0,
      };
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err));
    }
  }
);

export const fetchPropertyByCode = createAsyncThunk(
  'properties/fetchPropertyByCode',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/properties/${id}`);
      return res.data?.data as PropertyItem;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err));
    }
  }
);

export const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setSelectedProperty: (state, action: PayloadAction<PropertyItem | null>) => {
      state.selectedProperty = action.payload;
    },
    setPropertyFilters: (state, action: PayloadAction<PropertyFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearPropertyFilters: (state) => {
      state.filters = {};
    },
    clearPropertyError: (state) => {
      state.error = null;
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
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load properties';
      })
      // fetchPropertyByCode
      .addCase(fetchPropertyByCode.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchPropertyByCode.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedProperty = action.payload;
      })
      .addCase(fetchPropertyByCode.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = (action.payload as string) || 'Failed to load property details';
      });
  },
});

export const {
  setSelectedProperty,
  setPropertyFilters,
  clearPropertyFilters,
  clearPropertyError,
} = propertySlice.actions;

export default propertySlice.reducer;
