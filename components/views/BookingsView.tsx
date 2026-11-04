'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronDown,
  Search,
  Filter,
  FileText,
  Eye,
  MoreVertical,
  User,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MessageSquare,
  X,
  Send,
  Building,
  Bed,
  CreditCard,
  Download,
  Check,
  Building2,
  Compass,
  Gift,
  Users,
  Trash2,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BookingInvoiceModal from '../modals/BookingInvoiceModal';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  updateBookingStatusAsync,
  updatePaymentStatusAsync,
  deleteBookingAsync,
  addBookingNote,
  fetchBookings,
} from '../../store/slices/bookingsSlice';
import {
  StayBookingItem,
  PackageBookingItem,
  ExperienceBookingItem,
  AnyBooking,
} from '../../types';

type TabStatus = 'all' | 'pending' | 'booked' | 'canceled' | 'refund';
type BookingCategory = 'all' | 'stay' | 'package' | 'experience';
type SortOption = 'newest' | 'oldest' | 'checkin_soon' | 'amount_high';

export default function BookingsView() {
  const router = useRouter();
  const { user, activeViewMode } = useAuth();
  const dispatch = useAppDispatch();
  const bookings = useAppSelector((state) => state.bookings.items);
  const guests = useAppSelector((state) => state.bookings.guests);
  const vendors = useAppSelector((state) => state.vendors.items);

  const isAdmin = activeViewMode === 'admin';
  const currentVendorId = user?.vendorId || (user?.role === 'vendor' ? user?.id : undefined);

  // Filter & Navigation States
  const [categoryTab, setCategoryTab] = useState<BookingCategory>('all');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('10/26/2026');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [actionMenuBooking, setActionMenuBooking] = useState<AnyBooking | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<AnyBooking | null>(null);

  // Live Sync & Manual Refresh States
  const loading = useAppSelector((state) => state.bookings.loading);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleManualRefresh = async () => {
    try {
      setIsManualRefreshing(true);
      const resultAction = await dispatch(fetchBookings());
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setLastSyncedTime(timeStr);
      const fetchedList = (resultAction.payload as any)?.bookings;
      const count = Array.isArray(fetchedList) ? fetchedList.length : bookings.length;
      setSyncToast({
        message: `Bookings up to date! Loaded ${count} records directly from database.`,
        type: 'success',
      });
      setTimeout(() => setSyncToast(null), 3500);
    } catch {
      setSyncToast({
        message: 'Could not fetch live bookings from server. Showing cached data.',
        type: 'error',
      });
      setTimeout(() => setSyncToast(null), 3500);
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 500);
    }
  };

  // Auto-sync on component mount + background interval every 30 seconds
  useEffect(() => {
    handleManualRefresh();
    const interval = setInterval(() => {
      dispatch(fetchBookings());
      const now = new Date();
      setLastSyncedTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleToggleActionMenu = (booking: AnyBooking, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (actionMenuBooking?.id === booking.id) {
      setActionMenuBooking(null);
      setMenuCoords(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const ESTIMATED_HEIGHT = 290;
    const shouldOpenUp = spaceBelow < ESTIMATED_HEIGHT && rect.top > ESTIMATED_HEIGHT;
    const right = Math.max(16, window.innerWidth - rect.right);

    if (shouldOpenUp) {
      setMenuCoords({
        bottom: Math.max(16, window.innerHeight - rect.top + 6),
        right,
      });
    } else {
      setMenuCoords({
        top: Math.max(16, rect.bottom + 6),
        right,
      });
    }
    setActionMenuBooking(booking);
  };

  useEffect(() => {
    if (!actionMenuBooking) return;
    const closeMenu = () => {
      setActionMenuBooking(null);
      setMenuCoords(null);
    };
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [actionMenuBooking]);

  // Special Request & Notes Modal State
  const [notesModalBooking, setNotesModalBooking] = useState<AnyBooking | null>(null);
  const [newNoteInput, setNewNoteInput] = useState('');

  // Admin delete booking full control state
  const [bookingToDelete, setBookingToDelete] = useState<AnyBooking | null>(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    try {
      setIsDeletingBooking(true);
      await dispatch(deleteBookingAsync(bookingToDelete.id));
      setBookingToDelete(null);
    } finally {
      setIsDeletingBooking(false);
    }
  };

  // Helper to determine status category for filtering and badges
  const getBookingDisplayStatus = (b: AnyBooking): 'Refund' | 'Pending' | 'Booked' | 'Canceled' => {
    if (b.paymentStatus === 'refunded') return 'Refund';
    if (b.bookingStatus === 'pending' || b.paymentStatus === 'processing') return 'Pending';
    if (
      b.bookingStatus === 'confirmed' ||
      b.bookingStatus === 'checked_in' ||
      (b.bookingStatus as string) === 'checked_out' ||
      (b.bookingStatus as string) === 'completed'
    ) {
      return 'Booked';
    }
    if (b.bookingStatus === 'cancelled') return 'Canceled';
    return 'Booked';
  };

  // 1. Scoped bookings: strictly isolated for vendor; or filtered by vendor dropdown for Admin
  const scopedBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (!isAdmin) {
        if (currentVendorId && b.vendorId !== currentVendorId) {
          return false;
        }
      } else {
        if (selectedVendorFilter !== 'all' && b.vendorId !== selectedVendorFilter) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, isAdmin, currentVendorId, selectedVendorFilter]);

  // 2. Category tab counts within active scope
  const categoryCounts = useMemo(() => {
    let stay = 0;
    let pkg = 0;
    let exp = 0;
    scopedBookings.forEach((b) => {
      if (b.type === 'stay') stay++;
      else if (b.type === 'package') pkg++;
      else if (b.type === 'experience') exp++;
    });
    return {
      all: scopedBookings.length,
      stay,
      package: pkg,
      experience: exp,
    };
  }, [scopedBookings]);

  // 3. Status tab counts within active category and scope
  const tabCounts = useMemo(() => {
    let pending = 0;
    let booked = 0;
    let canceled = 0;
    let refund = 0;
    let total = 0;

    scopedBookings.forEach((b) => {
      if (categoryTab !== 'all' && b.type !== categoryTab) return;
      total++;
      const status = getBookingDisplayStatus(b);
      if (status === 'Pending') pending++;
      else if (status === 'Booked') booked++;
      else if (status === 'Canceled') canceled++;
      else if (status === 'Refund') refund++;
    });

    return {
      all: total,
      pending,
      booked,
      canceled,
      refund,
    };
  }, [scopedBookings, categoryTab]);

  // 4. Filter bookings according to active status tab and search query
  const filteredBookings = useMemo(() => {
    return scopedBookings.filter((b) => {
      // Category filter
      if (categoryTab !== 'all' && b.type !== categoryTab) return false;

      // Status tab filter
      const displayStatus = getBookingDisplayStatus(b);
      if (activeTab === 'pending' && displayStatus !== 'Pending') return false;
      if (activeTab === 'booked' && displayStatus !== 'Booked') return false;
      if (activeTab === 'canceled' && displayStatus !== 'Canceled') return false;
      if (activeTab === 'refund' && displayStatus !== 'Refund') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const guestName = (b.guestName || '').toLowerCase();
        const ref = (b.bookingReference || '').toLowerCase();
        const vendorName = (b.vendorName || '').toLowerCase();

        let itemDetail = '';
        if (b.type === 'stay') {
          const stay = b as StayBookingItem;
          itemDetail = `${stay.propertyName || ''} ${stay.roomName || ''}`.toLowerCase();
        } else if (b.type === 'package') {
          const p = b as PackageBookingItem;
          itemDetail = `${p.packageTitle || ''} ${p.tierName || ''}`.toLowerCase();
        } else if (b.type === 'experience') {
          const e = b as ExperienceBookingItem;
          itemDetail = `${e.experienceTitle || ''} ${e.slotTime || ''}`.toLowerCase();
        }

        return (
          guestName.includes(query) ||
          ref.includes(query) ||
          vendorName.includes(query) ||
          itemDetail.includes(query)
        );
      }

      return true;
    });
  }, [scopedBookings, categoryTab, activeTab, searchQuery]);

  // 5. Sorted list
  const sortedBookings = useMemo(() => {
    const list = [...filteredBookings];
    list.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortOption === 'amount_high') {
        const amtA = a.grandTotalInr || 0;
        const amtB = b.grandTotalInr || 0;
        return amtB - amtA;
      }
      if (sortOption === 'checkin_soon') {
        const dateA =
          a.type === 'stay'
            ? (a as StayBookingItem).checkInDate
            : (a as any).startDate || (a as any).activityDate || '';
        const dateB =
          b.type === 'stay'
            ? (b as StayBookingItem).checkInDate
            : (b as any).startDate || (b as any).activityDate || '';
        return dateA.localeCompare(dateB);
      }
      return 0;
    });
    return list;
  }, [filteredBookings, sortOption]);

  // Date formatting helpers
  const formatOrderDate = (isoStr?: string) => {
    if (!isoStr) return 'Oct 30th 2026 09:21 AM';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const time = d.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${month} ${day}th ${year} ${time}`;
    } catch {
      return isoStr;
    }
  };

  const formatStayDate = (dateStr?: string, defaultDay = '2th') => {
    if (!dateStr) return `Nov ${defaultDay}, 2026`;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      return `${month} ${day}th, ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Add note inside Special Request modal
  const handleAddModalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim() || !notesModalBooking) return;
    dispatch(
      addBookingNote({
        bookingId: notesModalBooking.id,
        text: newNoteInput.trim(),
        authorName: user?.name || (isAdmin ? 'Admin Operations' : 'Vendor Host'),
        authorRole: isAdmin ? 'Admin' : 'Vendor',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      })
    );
    setNewNoteInput('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── TOP CATEGORY PILLS BAR (Stays, Experiences, Packages Separately) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategoryTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              categoryTab === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>All Bookings</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                categoryTab === 'all'
                  ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {categoryCounts.all}
            </span>
          </button>

          <button
            onClick={() => setCategoryTab('stay')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              categoryTab === 'stay'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Stays & Hotels</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                categoryTab === 'stay'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {categoryCounts.stay}
            </span>
          </button>

          <button
            onClick={() => setCategoryTab('package')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              categoryTab === 'package'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Tour Packages</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                categoryTab === 'package'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {categoryCounts.package}
            </span>
          </button>

          <button
            onClick={() => setCategoryTab('experience')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              categoryTab === 'experience'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Experiences & Treks</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                categoryTab === 'experience'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {categoryCounts.experience}
            </span>
          </button>
        </div>

        {/* Admin Vendor Filter Dropdown & Live Sync Status */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Partner:</span>
              <select
                value={selectedVendorFilter}
                onChange={(e) => setSelectedVendorFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="all">All Vendors ({vendors.length} Partners)</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.businessName} ({v.displayName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Vendor Partner Active Badge */}
          {!isAdmin && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span>Showing Bookings for: <strong className="text-slate-900 dark:text-white">{user?.businessName || user?.name}</strong></span>
            </div>
          )}

          {/* Live Sync Status indicator */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isManualRefreshing || loading}
              title="Force sync latest bookings from database"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <RotateCw className={`w-3 h-3 text-[#ea110d] ${isManualRefreshing || loading ? 'animate-spin' : ''}`} />
              <span>{isManualRefreshing || loading ? 'Syncing...' : 'Sync'}</span>
            </button>
            {lastSyncedTime && (
              <span className="text-[11px] text-slate-400 font-mono">
                {lastSyncedTime}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Tabs & Search Controls Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Status Navigation Tabs */}
        <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
          {(
            [
              { key: 'all', label: 'All Bookings', count: tabCounts.all },
              { key: 'pending', label: 'Pending', count: tabCounts.pending },
              { key: 'booked', label: 'Booked', count: tabCounts.booked },
              { key: 'canceled', label: 'Canceled', count: tabCounts.canceled },
              { key: 'refund', label: 'Refund', count: tabCounts.refund },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative py-3 text-sm sm:text-base font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-[#134E4A]/10 text-[#134E4A] dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-[3px] bg-[#134E4A] dark:bg-emerald-500 rounded-t-full shadow-xs" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Controls: Search, Date Picker, Sort */}
        <div className="flex items-center gap-3 self-end lg:self-auto flex-wrap">
          {/* Search Input */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest, code, hotel..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#134E4A] shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="inline-flex items-center gap-2 bg-[#134E4A] hover:bg-[#0f3d3a] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <span>{selectedDate}</span>
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 z-30 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Select Date</span>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Today (10/26/2026)', val: '10/26/2026' },
                    { label: 'Tomorrow (10/27/2026)', val: '10/27/2026' },
                    { label: 'Next Weekend (10/30/2026)', val: '10/30/2026' },
                    { label: 'All Upcoming Dates', val: 'All Dates' },
                  ].map((d) => (
                    <button
                      key={d.val}
                      onClick={() => {
                        setSelectedDate(d.val);
                        setShowDatePicker(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedDate === d.val
                          ? 'bg-[#134E4A] text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-full text-xs font-semibold shadow-2xs transition-all active:scale-95"
            >
              <span className="capitalize">
                {sortOption === 'newest'
                  ? 'Newest'
                  : sortOption === 'oldest'
                  ? 'Oldest'
                  : sortOption === 'checkin_soon'
                  ? 'Check-In Soon'
                  : 'Highest Total'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 mt-2 z-30 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 animate-in fade-in zoom-in-95">
                {[
                  { key: 'newest', label: 'Newest First' },
                  { key: 'oldest', label: 'Oldest First' },
                  { key: 'checkin_soon', label: 'Check-In Soon' },
                  { key: 'amount_high', label: 'Amount High to Low' },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSortOption(s.key as SortOption);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      sortOption === s.key
                        ? 'bg-slate-100 dark:bg-slate-800 text-[#134E4A] dark:text-emerald-400 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Manual Refresh Button */}
          <button
            type="button"
            id="bookings-manual-refresh-btn"
            onClick={handleManualRefresh}
            disabled={isManualRefreshing || loading}
            title="Force fetch latest bookings from database"
            className="inline-flex items-center gap-2 bg-[#ea110d] hover:bg-[#d00f0c] active:bg-[#b00d0a] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isManualRefreshing || loading ? 'animate-spin' : ''}`} />
            <span>{isManualRefreshing || loading ? 'Fetching...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── Real-Time Sync Feedback Toast ── */}
      {syncToast && (
        <div
          className={`p-3 px-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 shadow-xs border transition-all animate-in fade-in slide-in-from-top-1 ${
            syncToast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncToast.message}</span>
            {lastSyncedTime && (
              <span className="text-[11px] opacity-75 font-mono">
                ({lastSyncedTime})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSyncToast(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Main Data Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-4 pl-6 pr-4 font-semibold text-slate-600 dark:text-slate-300">Guest</th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300">Type / Partner</th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300">Date Order</th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300">Schedule / Dates</th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">
                  Special Request
                </th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300">Service / Details</th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Status</th>
                <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Total</th>
                <th className="py-4 pr-6 pl-2 text-right font-semibold text-slate-600 dark:text-slate-300">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300">
              {loading && sortedBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RotateCw className="w-8 h-8 text-[#ea110d] animate-spin" />
                      <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">Syncing live bookings...</p>
                      <p className="text-xs text-slate-400">Retrieving confirmed and pending folios directly from database.</p>
                    </div>
                  </td>
                </tr>
              ) : sortedBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">No bookings found</p>
                      <p className="text-xs text-slate-400">
                        {searchQuery
                          ? 'Try adjusting your search criteria.'
                          : 'There are no bookings matching the selected category and status tab.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedBookings.map((b) => {
                  const isStay = b.type === 'stay';
                  const isPackage = b.type === 'package';
                  const isExp = b.type === 'experience';

                  const stay = isStay ? (b as StayBookingItem) : null;
                  const pkg = isPackage ? (b as PackageBookingItem) : null;
                  const exp = isExp ? (b as ExperienceBookingItem) : null;

                  const displayStatus = getBookingDisplayStatus(b);
                  const orderDateFormatted = formatOrderDate(b.createdAt);

                  // Extract dates & schedule details according to booking type
                  let scheduleTitle = '';
                  let scheduleSub = '';
                  let serviceTitle = '';
                  let serviceSub = '';

                  if (isStay && stay) {
                    scheduleTitle = `In: ${formatStayDate(stay.checkInDate, '2th')}`;
                    scheduleSub = `Out: ${formatStayDate(stay.checkOutDate, '4th')} (${stay.nights || 1}N)`;
                    serviceTitle = stay.roomName || 'Deluxe Room';
                    serviceSub = stay.propertyName || 'Hospitality Resort';
                  } else if (isPackage && pkg) {
                    scheduleTitle = `Start: ${formatStayDate(pkg.startDate, '5th')}`;
                    scheduleSub = `End: ${formatStayDate(pkg.endDate, '7th')}`;
                    serviceTitle = pkg.packageTitle || 'Tour Package';
                    serviceSub = `Tier: ${pkg.tierName || 'Standard'} • ${pkg.travelers || 2} Travelers`;
                  } else if (isExp && exp) {
                    scheduleTitle = `Date: ${formatStayDate(exp.activityDate, '10th')}`;
                    scheduleSub = `Slot: ${exp.slotTime || 'Morning Slot'}`;
                    serviceTitle = exp.experienceTitle || 'Trek & Adventure';
                    serviceSub = `${exp.participants || 2} Participants`;
                  }

                  const guestCode =
                    b.bookingReference?.startsWith('#')
                      ? b.bookingReference
                      : `#${b.bookingReference || 'MHA-1001'}`;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Guest Info */}
                      <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="font-bold text-slate-900 dark:text-white text-[13px] leading-tight">
                            {b.guestName}
                          </div>
                          <Link
                            href={`/dashboard/guests/${b.userId || 'usr_cahyadi_01'}`}
                            className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 hover:underline mt-0.5 inline-block"
                            title="View Guest Profile"
                          >
                            <span>{guestCode}</span>
                          </Link>
                        </div>
                      </td>

                      {/* Category Badge & Partner Name */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {isStay && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900 w-fit">
                              Stay / Hotel
                            </span>
                          )}
                          {isPackage && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900 w-fit">
                              Tour Package
                            </span>
                          )}
                          {isExp && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900 w-fit">
                              Experience
                            </span>
                          )}

                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                            {b.vendorName || 'Hospitality Partner'}
                          </span>
                        </div>
                      </td>

                      {/* Date Order */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
                          {orderDateFormatted}
                        </div>
                      </td>

                      {/* Schedule / Dates */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-[12px]">
                          {scheduleTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          {scheduleSub}
                        </div>
                      </td>

                      {/* Special Request / View Notes */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setNotesModalBooking(b)}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                          <span>Notes</span>
                        </button>
                      </td>

                      {/* Service / Details */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-[12px] truncate max-w-[200px]">
                          {serviceTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal truncate max-w-[200px]">
                          {serviceSub}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {displayStatus === 'Refund' && (
                          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#FCE8E8] text-[#F05353] border border-[#FAD0D0]">
                            Refund
                          </span>
                        )}
                        {displayStatus === 'Pending' && (
                          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#FEF2E6] text-[#F39C12] border border-[#FCE1C3]">
                            Pending
                          </span>
                        )}
                        {displayStatus === 'Booked' && (
                          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#E8F8F0] text-[#2ECC71] border border-[#CFF3DE]">
                            Booked
                          </span>
                        )}
                        {displayStatus === 'Canceled' && (
                          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                            Canceled
                          </span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 text-right whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                        ₹{(b.grandTotalInr || 0).toLocaleString()}
                      </td>

                      {/* Action Menu */}
                      <td className="py-4 pr-6 pl-2 text-right relative">
                        <button
                          type="button"
                          onClick={(e) => handleToggleActionMenu(b, e)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            actionMenuBooking?.id === b.id
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300">1</span> to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{sortedBookings.length}</span> of{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{sortedBookings.length}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-800 opacity-50 cursor-not-allowed"
            >
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-[#134E4A] text-white font-semibold shadow-2xs">
              1
            </button>
            <button
              disabled
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-800 opacity-50 cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── Fixed Floating Action Dropdown Menu (Prevents container overflow clipping) ── */}
      {actionMenuBooking && menuCoords && (
        <>
          {/* Transparent click-outside backdrop */}
          <div
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => {
              setActionMenuBooking(null);
              setMenuCoords(null);
            }}
          />

          <div
            style={{
              top: menuCoords.top !== undefined ? `${menuCoords.top}px` : undefined,
              bottom: menuCoords.bottom !== undefined ? `${menuCoords.bottom}px` : undefined,
              right: `${menuCoords.right}px`,
            }}
            className="fixed z-50 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 text-left animate-in fade-in zoom-in-95 duration-150 select-none max-h-[calc(100vh-32px)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={`/dashboard/bookings/${actionMenuBooking.id}`}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => {
                setActionMenuBooking(null);
                setMenuCoords(null);
              }}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>View Booking Folio</span>
            </Link>

            <Link
              href={`/dashboard/guests/${actionMenuBooking.userId || 'usr_cahyadi_01'}`}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => {
                setActionMenuBooking(null);
                setMenuCoords(null);
              }}
            >
              <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>View Guest & History</span>
            </Link>

            {actionMenuBooking.paymentStatus === 'paid' && actionMenuBooking.bookingStatus !== 'cancelled' ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedInvoiceBooking(actionMenuBooking);
                  setActionMenuBooking(null);
                  setMenuCoords(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer text-left"
              >
                <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>View / Download Invoice</span>
              </button>
            ) : (
              <div className="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Invoice: {actionMenuBooking.bookingStatus === 'cancelled' ? 'Cancelled' : 'Pending Payment'}</span>
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

            <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400">
              Change Status
            </div>

            <button
              type="button"
              onClick={() => {
                dispatch(
                  updateBookingStatusAsync({
                    id: actionMenuBooking.id,
                    status: 'confirmed',
                  })
                );
                dispatch(
                  updatePaymentStatusAsync({
                    id: actionMenuBooking.id,
                    status: 'paid',
                  })
                );
                setActionMenuBooking(null);
                setMenuCoords(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Mark as Booked</span>
            </button>

            <button
              type="button"
              onClick={() => {
                dispatch(
                  updateBookingStatusAsync({
                    id: actionMenuBooking.id,
                    status: 'pending',
                  })
                );
                setActionMenuBooking(null);
                setMenuCoords(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Mark as Pending</span>
            </button>

            <button
              type="button"
              onClick={() => {
                dispatch(
                  updateBookingStatusAsync({
                    id: actionMenuBooking.id,
                    status: 'cancelled',
                  })
                );
                dispatch(
                  updatePaymentStatusAsync({
                    id: actionMenuBooking.id,
                    status: 'refunded',
                  })
                );
                setActionMenuBooking(null);
                setMenuCoords(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Mark as Refund</span>
            </button>

            {isAdmin && (
              <>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setBookingToDelete(actionMenuBooking);
                    setActionMenuBooking(null);
                    setMenuCoords(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Delete Order / Booking</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Interactive Special Request & Notes Modal ── */}
      {notesModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  {(notesModalBooking.guestName || 'G').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {notesModalBooking.guestName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ref: #{notesModalBooking.bookingReference} &bull; Type: {notesModalBooking.type.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotesModalBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Guest Special Request */}
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Guest Special Request</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                  {notesModalBooking.specialRequests ||
                    'Guest requested extra pillows and early check-in assistance upon arrival.'}
                </p>
              </div>

              {/* Service & Partner Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Partner Host</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{notesModalBooking.vendorName || 'Hospitality Partner'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Booking Total</span>
                  <span className="font-bold text-rose-600">₹{(notesModalBooking.grandTotalInr || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Existing Staff / Vendor Notes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Internal Staff & Host Notes</span>
                </div>

                <div className="space-y-2.5">
                  {(notesModalBooking as any).notes?.length > 0 ? (
                    (notesModalBooking as any).notes.map((note: any) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {note.authorName} ({note.authorRole})
                          </span>
                          <span>{note.date}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{note.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No notes logged yet.</p>
                  )}
                </div>
              </div>

              {/* Add New Note Form */}
              <form onSubmit={handleAddModalNote} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Add Host / Operations Note
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    placeholder="Enter front-desk note or guest update..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#134E4A]"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-[#134E4A] hover:bg-[#0f3d3a] text-white shrink-0 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Booking Confirmation Modal */}
      {bookingToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xl mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Delete Order / Reservation?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete booking reference{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {bookingToDelete.bookingReference}
                </strong>{' '}
                for <span className="text-slate-700 dark:text-slate-300 font-medium">{bookingToDelete.guestName}</span>?
                This action is irreversible and removes the reservation from platform records.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setBookingToDelete(null)}
                disabled={isDeletingBooking}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBooking}
                disabled={isDeletingBooking}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {isDeletingBooking ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Order</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official GST Tax Invoice Modal (Admin & Vendor View + Download) */}
      <BookingInvoiceModal
        isOpen={Boolean(selectedInvoiceBooking)}
        onClose={() => setSelectedInvoiceBooking(null)}
        booking={selectedInvoiceBooking as any}
      />
    </div>
  );
}
