import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { getApiErrorMessage } from '../../lib/api';

export interface PackageFreeActivity {
  id: string;
  name: string;
  time: string;
  image: string;
  category: string;
}

export interface PackageTier {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  hotelType: string;
  pricePerPerson: number;
  originalPrice: number;
  features: string[];
}

export interface PackageItineraryDay {
  day: number;
  title: string;
  activities: string[];
  meals: string;
  stay: string;
  image?: string;
}

export interface PackageInclusionItem {
  title: string;
  desc: string;
  icon: string;
}

export interface PackageItem {
  id: string;
  _id: string;
  hostId?: string;
  propertyId?: string;
  packageType?: string;
  category: string;
  title: string;
  name: string;
  badge: string;
  rating: string;
  ratingScore: number;
  reviewsCount: number;
  duration: string;
  durationDays: number;
  durationNights: number;
  location: string;
  locationId?: string;
  serviceableLocation?: string;
  city: string;
  country: string;
  price: string;
  numericPrice: number;
  originalPrice?: number;
  shortDesc: string;
  thumbnail?: string;
  images: string[];
  freeActivities?: PackageFreeActivity[];
  featured?: boolean;
  status?: string;
  totalBookings?: number;
  // Detail fields
  description?: string;
  overview?: string;
  fullDesc?: string;
  highlights?: string[];
  inclusions?: PackageInclusionItem[];
  exclusions?: string[];
  itinerary?: PackageItineraryDay[];
  tiers?: PackageTier[];
  pricing?: {
    basePrice: number;
    pricePerPerson: number | null;
    weekendSurcharge: number;
    childPrice?: number | null;
    minGuests: number;
    maxGuests: number;
  };
  cancellationPolicy?: string;
  reviews?: any[];
  hostProperty?: any;
}

interface PackageFilters {
  category?: string;
  serviceableLocation?: string;
  destination?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

interface PackageState {
  items: PackageItem[];
  selectedPackage: PackageItem | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  filters: PackageFilters;
  total: number;
}

const initialState: PackageState = {
  items: [],
  selectedPackage: null,
  loading: true,
  detailLoading: false,
  error: null,
  filters: {},
  total: 0,
};

// Async Thunks calling Backend API via Axios
export const fetchPackages = createAsyncThunk(
  'packages/fetchPackages',
  async (params: PackageFilters | undefined, { rejectWithValue }) => {
    try {
      const res = await api.get('/packages', { params });
      return {
        items: (res.data?.data || []) as PackageItem[],
        total: res.data?.meta?.total ?? res.data?.data?.length ?? 0,
      };
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err));
    }
  }
);

export const fetchPackageByCode = createAsyncThunk(
  'packages/fetchPackageByCode',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/packages/${id}`);
      return res.data?.data as PackageItem;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err));
    }
  }
);

export const packageSlice = createSlice({
  name: 'packages',
  initialState,
  reducers: {
    setSelectedPackage: (state, action: PayloadAction<PackageItem | null>) => {
      state.selectedPackage = action.payload;
    },
    setPackageFilters: (state, action: PayloadAction<PackageFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearPackageFilters: (state) => {
      state.filters = {};
    },
    clearPackageError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPackages
      .addCase(fetchPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load packages';
      })
      // fetchPackageByCode
      .addCase(fetchPackageByCode.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchPackageByCode.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedPackage = action.payload;
      })
      .addCase(fetchPackageByCode.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = (action.payload as string) || 'Failed to load package details';
      });
  },
});

export const {
  setSelectedPackage,
  setPackageFilters,
  clearPackageFilters,
  clearPackageError,
} = packageSlice.actions;

export default packageSlice.reducer;
