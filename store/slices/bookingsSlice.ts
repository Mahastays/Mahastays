import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../lib/api';
import {
  StayBookingItem,
  PackageBookingItem,
  ExperienceBookingItem,
  BookingChargeItem,
  BookingNoteItem,
  GuestProfile,
  AnyBooking,
} from '../../types';

interface BookingsState {
  items: AnyBooking[];
  guests: GuestProfile[];
  selectedBooking: StayBookingItem | null;
  loading: boolean;
  error: string | null;
}

const getStoredBookings = (): AnyBooking[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mahastays_db_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && !parsed.some((b: any) => b.id?.startsWith('bk_stay') || b.bookingReference === '0006789')) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return [];
};

const getStoredGuests = (): GuestProfile[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mahastays_db_guests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && !parsed.some((g: any) => g.id?.startsWith('gst_tomy'))) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return [];
};

const saveBookings = (items: AnyBooking[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mahastays_db_bookings', JSON.stringify(items));
    } catch {
      // ignore
    }
  }
};

const saveGuests = (guests: GuestProfile[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mahastays_db_guests', JSON.stringify(guests));
    } catch {
      // ignore
    }
  }
};

export const normalizeBooking = (raw: any): AnyBooking => {
  const type = raw.type || (raw.packageId ? 'package' : raw.experienceId ? 'experience' : 'stay');
  const bookingRef = raw.bookingReference || raw.code || raw.id?.slice(-7).toUpperCase() || 'REF-BOOKING';
  const customerName = raw.customer?.fullName || raw.guestName || 'Guest User';
  const customerEmail = raw.customer?.email || raw.guestEmail || '';
  const customerPhone = raw.customer?.phone || raw.guestPhone || '';
  const customerAvatar = raw.customer?.avatar || raw.guestAvatar || '';

  if (type === 'package') {
    const pkgBooking: PackageBookingItem = {
      id: raw.id || raw._id,
      type: 'package',
      bookingReference: bookingRef,
      userId: raw.userId || raw.customer?.id || '',
      guestName: customerName,
      guestEmail: customerEmail,
      guestPhone: customerPhone,
      guestAvatar: customerAvatar,
      packageId: raw.packageId || raw.package?.id || '',
      packageTitle: raw.package?.title || raw.packageTitle || raw.title || 'Tour Package',
      vendorId: raw.vendorId || '',
      vendorName: raw.vendorName || '',
      tierName: raw.tier?.tierName || raw.tierName || raw.selectedTier?.name || '',
      startDate: raw.startDate || '',
      endDate: raw.endDate || '',
      travelers: raw.travelers?.totalTravelers || raw.travelers || 1,
      grandTotalInr: raw.pricing?.grandTotalInr || raw.amount || 0,
      paymentStatus: raw.paymentStatus || 'pending',
      bookingStatus: raw.bookingStatus || 'pending',
      specialRequests: raw.specialRequests || '',
      createdAt: raw.createdAt || new Date().toISOString(),
    };
    return pkgBooking;
  }

  if (type === 'experience') {
    const expBooking: ExperienceBookingItem = {
      id: raw.id || raw._id,
      type: 'experience',
      bookingReference: bookingRef,
      userId: raw.userId || raw.customer?.id || '',
      guestName: customerName,
      guestEmail: customerEmail,
      guestPhone: customerPhone,
      guestAvatar: customerAvatar,
      experienceId: raw.experienceId || raw.experience?.id || '',
      experienceTitle: raw.experience?.title || raw.experienceTitle || raw.title || 'Experience Tour',
      vendorId: raw.vendorId || '',
      vendorName: raw.vendorName || '',
      slotTime: raw.selectedSlot?.time || raw.slotTime || '',
      activityDate: raw.activityDate || '',
      participants: raw.participants?.totalParticipants || raw.participants || 1,
      grandTotalInr: raw.pricing?.grandTotalInr || raw.amount || 0,
      paymentStatus: raw.paymentStatus || 'pending',
      bookingStatus: raw.bookingStatus || 'pending',
      specialRequests: raw.specialRequests || '',
      createdAt: raw.createdAt || new Date().toISOString(),
    };
    return expBooking;
  }

  // Stay Booking
  const stayBooking: StayBookingItem = {
    id: raw.id || raw._id,
    type: 'stay',
    bookingReference: bookingRef,
    userId: raw.userId || raw.customer?.id || '',
    guestName: customerName,
    guestEmail: customerEmail,
    guestPhone: customerPhone,
    guestAvatar: customerAvatar,
    vipStatus: !!raw.vipStatus,
    propertyId: raw.propertyId || raw.property?.id || '',
    propertyName: raw.property?.name || raw.propertyName || raw.title || 'Stay Accommodation',
    vendorId: raw.vendorId || '',
    vendorName: raw.vendorName || '',
    roomId: raw.room?.roomId || raw.roomId || '',
    roomName: raw.room?.roomName || raw.roomName || 'Selected Room',
    roomImage: raw.image || raw.property?.images?.[0]?.url || raw.property?.images?.[0] || '',
    bedType: raw.bedType || '',
    features: raw.features || [],
    checkInDate: raw.schedule?.checkInDate || raw.checkInDate || '',
    checkOutDate: raw.schedule?.checkOutDate || raw.checkOutDate || '',
    nights: raw.schedule?.nights || raw.nights || 1,
    adults: raw.guests?.adults || raw.adults || 1,
    children: raw.guests?.children || raw.children || 0,
    roomPricePerNight: raw.pricing?.roomPricePerNight || 0,
    cleaningFee: raw.pricing?.cleaningFee || 0,
    memberDiscount: raw.pricing?.memberDiscount || 0,
    taxesGst: raw.pricing?.taxesGst || 0,
    grandTotalInr: raw.pricing?.grandTotalInr || raw.amount || 0,
    paymentStatus: raw.paymentStatus || 'pending',
    bookingStatus: raw.bookingStatus || 'pending',
    specialRequests: raw.specialRequests || '',
    charges: Array.isArray(raw.charges) ? raw.charges : [],
    notes: Array.isArray(raw.notes) ? raw.notes : [],
    createdAt: raw.createdAt || new Date().toISOString(),
  };
  return stayBooking;
};

export const extractGuestsFromBookings = (bookings: AnyBooking[]): GuestProfile[] => {
  const map = new Map<string, GuestProfile>();

  bookings.forEach((b) => {
    const key = (b.guestEmail || b.userId || 'guest').toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        id: b.userId || `gst_${Math.random().toString(36).substring(7)}`,
        guestCode: `GST-${(b.userId || '1001').slice(-4).toUpperCase()}`,
        name: b.guestName || 'Valued Guest',
        email: b.guestEmail || '',
        phone: b.guestPhone || '',
        avatar: b.guestAvatar || '',
        vipStatus: (b as any).vipStatus || false,
        vipTier: (b as any).vipStatus ? 'Gold' : 'Standard',
        nationality: (b as any).nationality || 'Indian',
        dateOfBirth: (b as any).dateOfBirth || '',
        idCardNumber: (b as any).idCardNumber || '',
        idCardType: (b as any).idCardType || 'ID',
        isVerified: true,
        memberSince: (b as any).memberSince || 'Recent',
        address: (b as any).address || '',
        city: (b as any).city || '',
        stats: {
          totalBookings: 1,
          totalSpent: b.grandTotalInr,
          completedStays: b.bookingStatus === 'checked_out' || b.bookingStatus === 'completed' ? 1 : 0,
          cancelledBookings: b.bookingStatus === 'cancelled' ? 1 : 0,
          averageRating: 5.0,
        },
        notes: (b as any).notes || [],
      });
    } else {
      const existing = map.get(key)!;
      if (existing.stats) {
        existing.stats.totalBookings += 1;
        existing.stats.totalSpent += b.grandTotalInr;
        if (b.bookingStatus === 'checked_out' || b.bookingStatus === 'completed') {
          existing.stats.completedStays += 1;
        }
      }
    }
  });

  return Array.from(map.values());
};

const initialBookings = getStoredBookings();
const initialGuests = getStoredGuests();
const initialSelected = (initialBookings.find((b) => b.type === 'stay') || null) as StayBookingItem | null;

const initialState: BookingsState = {
  items: initialBookings,
  guests: initialGuests,
  selectedBooking: initialSelected,
  loading: false,
  error: null,
};

export const fetchBookings = createAsyncThunk('bookings/fetchBookings', async () => {
  try {
    const isVendor = typeof window !== 'undefined' && localStorage.getItem('mahastays_auth_view_mode') === 'vendor';
    const requestConfig = {
      params: { _t: Date.now(), limit: 100 },
    };
    const res = isVendor
      ? await api.get('/vendor/bookings', requestConfig).catch(() => api.get('/admin/bookings', requestConfig))
      : await api.get('/admin/bookings', requestConfig).catch(() => api.get('/vendor/bookings', requestConfig));

    const rawList = Array.isArray(res?.data?.data)
      ? res.data.data
      : Array.isArray(res?.data?.data?.items)
      ? res.data.data.items
      : Array.isArray(res?.data?.items)
      ? res.data.items
      : Array.isArray(res?.data)
      ? res.data
      : null;

    if (Array.isArray(rawList)) {
      const normalized = rawList.map(normalizeBooking);
      saveBookings(normalized);

      const realGuests = extractGuestsFromBookings(normalized);
      if (realGuests.length > 0) {
        saveGuests(realGuests);
      }

      return { bookings: normalized, guests: realGuests, isLive: true };
    }
  } catch {
    // Graceful offline fallback to localStorage when backend API is unreachable
  }
  return { bookings: getStoredBookings(), guests: getStoredGuests(), isLive: false };
});

export const updateBookingStatusAsync = createAsyncThunk(
  'bookings/updateStatus',
  async ({ id, status }: { id: string; status: any }, { getState }) => {
    try {
      await api.patch(`/admin/bookings/${id}/status`, { status }).catch(() =>
        api.patch(`/vendor/bookings/stays/${id}/status`, { action: status }).catch(() =>
          api.patch(`/bookings/${id}/status`, { status })
        )
      );
    } catch {
      // Offline fallback
    }
    const state = getState() as { bookings: BookingsState };
    const next = state.bookings.items.map((b) => (b.id === id ? { ...b, bookingStatus: status } : b));
    saveBookings(next);
    return { id, status, next };
  }
);

export const updatePaymentStatusAsync = createAsyncThunk(
  'bookings/updatePaymentStatus',
  async ({ id, status }: { id: string; status: any }, { getState }) => {
    try {
      await api.patch(`/admin/bookings/${id}/payment-status`, { status }).catch(() =>
        api.patch(`/bookings/${id}/payment-status`, { status })
      );
    } catch {
      // Offline fallback
    }
    const state = getState() as { bookings: BookingsState };
    const next = state.bookings.items.map((b) => (b.id === id ? { ...b, paymentStatus: status } : b));
    saveBookings(next);
    return { id, status, next };
  }
);

export const deleteBookingAsync = createAsyncThunk(
  'bookings/deleteBooking',
  async (id: string, { getState }) => {
    try {
      await api.delete(`/admin/bookings/${id}`).catch(() => api.delete(`/bookings/${id}`));
    } catch {
      // Offline fallback
    }
    const state = getState() as { bookings: BookingsState };
    const next = state.bookings.items.filter((b) => b.id !== id);
    saveBookings(next);
    return id;
  }
);

export const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setSelectedBooking: (state, action: PayloadAction<StayBookingItem | null>) => {
      state.selectedBooking = action.payload;
    },
    toggleChargeSelected: (
      state,
      action: PayloadAction<{ bookingId: string; chargeId: string }>
    ) => {
      const { bookingId, chargeId } = action.payload;
      state.items = state.items.map((b) => {
        if (b.id === bookingId && b.type === 'stay') {
          const stay = b as StayBookingItem;
          const updatedCharges = stay.charges.map((c) =>
            c.id === chargeId ? { ...c, selected: !c.selected } : c
          );
          const updatedStay = { ...stay, charges: updatedCharges };
          if (state.selectedBooking?.id === bookingId) {
            state.selectedBooking = updatedStay;
          }
          return updatedStay;
        }
        return b;
      });
      saveBookings(state.items);
    },
    addBookingCharge: (
      state,
      action: PayloadAction<{
        bookingId: string;
        charge: Omit<BookingChargeItem, 'id' | 'date'>;
      }>
    ) => {
      const { bookingId, charge } = action.payload;
      const newCharge: BookingChargeItem = {
        id: `ch_${Date.now()}`,
        category: charge.category,
        title: charge.title,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: charge.amount,
        selected: true,
      };

      state.items = state.items.map((b) => {
        if (b.id === bookingId && b.type === 'stay') {
          const stay = b as StayBookingItem;
          const updatedCharges = [...stay.charges, newCharge];
          const updatedStay = { ...stay, charges: updatedCharges };
          if (state.selectedBooking?.id === bookingId) {
            state.selectedBooking = updatedStay;
          }
          return updatedStay;
        }
        return b;
      });
      saveBookings(state.items);
    },
    addBookingNote: (
      state,
      action: PayloadAction<{
        bookingId: string;
        text: string;
        authorName: string;
        authorRole: 'Admin' | 'Vendor' | 'Staff';
        avatar: string;
      }>
    ) => {
      const { bookingId, text, authorName, authorRole, avatar } = action.payload;
      const newNote: BookingNoteItem = {
        id: `note_${Date.now()}`,
        authorName,
        authorRole,
        avatar,
        text,
        date: 'Just now',
      };

      state.items = state.items.map((b) => {
        if (b.id === bookingId && b.type === 'stay') {
          const stay = b as StayBookingItem;
          const updatedNotes = [...stay.notes, newNote];
          const updatedStay = { ...stay, notes: updatedNotes };
          if (state.selectedBooking?.id === bookingId) {
            state.selectedBooking = updatedStay;
          }
          return updatedStay;
        }
        return b;
      });
      saveBookings(state.items);
    },
    addGuestNote: (
      state,
      action: PayloadAction<{
        guestId: string;
        text: string;
        authorName: string;
        authorRole: string;
      }>
    ) => {
      const { guestId, text, authorName, authorRole } = action.payload;
      const newNote = {
        id: `gn_${Date.now()}`,
        authorName,
        authorRole,
        date: 'Just now',
        text,
      };
      state.guests = state.guests.map((g) => {
        if (g.id === guestId) {
          return {
            ...g,
            notes: [newNote, ...(g.notes || [])],
          };
        }
        return g;
      });
      saveGuests(state.guests);
    },
    updateGuestProfile: (
      state,
      action: PayloadAction<{
        guestId: string;
        updates: Partial<GuestProfile>;
      }>
    ) => {
      const { guestId, updates } = action.payload;
      state.guests = state.guests.map((g) => (g.id === guestId ? { ...g, ...updates } : g));
      saveGuests(state.guests);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.bookings;
        if (action.payload.guests && action.payload.guests.length > 0) {
          state.guests = action.payload.guests;
        }
        // Ensure selectedBooking points to valid stay booking
        if (!state.selectedBooking || !state.items.find((b) => b.id === state.selectedBooking?.id)) {
          const firstStay = state.items.find((b) => b.type === 'stay') as StayBookingItem | undefined;
          if (firstStay) {
            state.selectedBooking = firstStay;
          }
        }
      })
      .addCase(updateBookingStatusAsync.fulfilled, (state, action) => {
        state.items = action.payload.next;
        if (state.selectedBooking && state.selectedBooking.id === action.payload.id) {
          state.selectedBooking = {
            ...state.selectedBooking,
            bookingStatus: action.payload.status,
          };
        }
      })
      .addCase(updatePaymentStatusAsync.fulfilled, (state, action) => {
        state.items = action.payload.next;
        if (state.selectedBooking && state.selectedBooking.id === action.payload.id) {
          state.selectedBooking = {
            ...state.selectedBooking,
            paymentStatus: action.payload.status,
          };
        }
      })
      .addCase(deleteBookingAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload);
        if (state.selectedBooking?.id === action.payload) {
          const nextStay = state.items.find((b) => b.type === 'stay') as StayBookingItem | undefined;
          state.selectedBooking = nextStay || null;
        }
      });
  },
});

export const {
  setSelectedBooking,
  toggleChargeSelected,
  addBookingCharge,
  addBookingNote,
  addGuestNote,
  updateGuestProfile,
} = bookingsSlice.actions;

export default bookingsSlice.reducer;
