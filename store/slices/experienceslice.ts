import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { getApiErrorMessage } from '../../lib/api';

export interface ExperienceSlot {
  id: string;
  time: string;
  label: string;
  availableSpots: number;
  price?: number;
}

export interface ExperienceTier {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  pricePerPerson: number;
  childPricePerPerson?: number;
  originalPrice: number;
  features: string[];
}

export interface ExperienceTimelineItem {
  time: string;
  title: string;
  desc: string;
}

export interface ExperienceInclusion {
  title: string;
  desc: string;
  icon: string;
}

export interface ExperienceGuide {
  name: string;
  role?: string;
  experience?: string;
  avatar?: string;
}

export interface ExperienceItem {
  id: string;
  _id: string;
  vendorId?: string;
  title: string;
  name: string;
  country: string;
  flag?: string;
  city: string;
  location?: string;
  locationId?: string;
  serviceableLocation?: string;
  duration: string;
  category: string;
  rating: string;
  ratingScore: number;
  reviewsCount: number;
  price: string;
  numericPrice: number;
  originalPrice?: number;
  priceType?: 'per_person' | 'per_activity' | 'full_setup' | 'per_night' | string;
  personLimit?: number;
  hasChildPrice?: boolean;
  childPrice?: number;
  childAgeLimit?: string;
  pricingRules?: any;
  difficulty?: string;
  ageLimit?: string;
  groupSize?: string;
  language?: string;
  image?: string;
  description: string;
  featured?: boolean;
  status?: string;
  // Detail fields
  gallery?: string[];
  overview?: string;
  highlights?: string[];
  timeline?: ExperienceTimelineItem[];
  inclusions?: ExperienceInclusion[];
  exclusions?: string[];
  whatToBring?: string[];
  meetingPoint?: string;
  locationType?: 'fixed_location' | 'customer_location' | 'both' | string;
  serviceArea?: string;
  coordinates?: { lat: number; lng: number };
  slots?: ExperienceSlot[];
  tiers?: ExperienceTier[];
  guide?: ExperienceGuide;
  cancellationPolicy?: string;
  reviews?: any[];
}

interface ExperienceFilters {
  category?: string;
  serviceableLocation?: string;
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

interface ExperienceState {
  items: ExperienceItem[];
  selectedExperience: ExperienceItem | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  filters: ExperienceFilters;
  total: number;
}

const initialState: ExperienceState = {
  items: [],
  selectedExperience: null,
  loading: true,
  detailLoading: false,
  error: null,
  filters: {},
  total: 0,
};

// Async Thunks calling Backend API via Axios
export const fetchExperiences = createAsyncThunk(
  'experiences/fetchExperiences',
  async (params: ExperienceFilters | undefined, { rejectWithValue }) => {
    try {
      const res = await api.get('/experiences', { params });
      return {
        items: (res.data?.data || []) as ExperienceItem[],
        total: res.data?.meta?.total ?? res.data?.data?.length ?? 0,
      };
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err));
    }
  }
);

export const fetchExperienceByCode = createAsyncThunk(
  'experiences/fetchExperienceByCode',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/experiences/${id}`);
      return res.data?.data as ExperienceItem;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err));
    }
  }
);

export const experienceSlice = createSlice({
  name: 'experiences',
  initialState,
  reducers: {
    setSelectedExperience: (state, action: PayloadAction<ExperienceItem | null>) => {
      state.selectedExperience = action.payload;
    },
    setExperienceFilters: (state, action: PayloadAction<ExperienceFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearExperienceFilters: (state) => {
      state.filters = {};
    },
    clearExperienceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchExperiences
      .addCase(fetchExperiences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExperiences.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchExperiences.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load experiences';
      })
      // fetchExperienceByCode
      .addCase(fetchExperienceByCode.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchExperienceByCode.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedExperience = action.payload;
      })
      .addCase(fetchExperienceByCode.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = (action.payload as string) || 'Failed to load experience details';
      });
  },
});

export const {
  setSelectedExperience,
  setExperienceFilters,
  clearExperienceFilters,
  clearExperienceError,
} = experienceSlice.actions;

export default experienceSlice.reducer;
