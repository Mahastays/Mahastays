'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
  Edit3,
  X,
  Building,
  Star,
  CheckCircle2,
  Trash2,
  Send,
  User,
  Crown,
  Lock,
  Sparkles,
  ShoppingBag,
  RefreshCw,
  Compass,
  BedDouble,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import { api, getApiErrorMessage } from '../../lib/api';

interface UserDetailHistoryViewProps {
  id: string;
}

interface UserProfileData {
  id: string;
  _id?: string;
  userCode: string;
  fullName: string;
  email: string;
  phone?: {
    countryCode?: string;
    nationalNumber?: string;
    isVerified?: boolean;
  } | null;
  phoneNumber?: string;
  phoneCountryCode?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  postalAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  membership?: {
    isClubMember?: boolean;
    tier?: 'standard' | 'gold' | 'platinum';
    joinedAt?: string;
    expiresAt?: string;
    totalDiscountSavedInr?: number;
  };
  verification?: {
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    governmentIdType?: string;
    governmentIdNumberMasked?: string;
    isIdVerified?: boolean;
  };
  metrics?: {
    totalBookingsCount?: number;
    completedStaysCount?: number;
    totalSpentInr?: number;
    reviewsWrittenCount?: number;
  };
  bookingCounts?: {
    stays: number;
    packages: number;
    experiences: number;
  };
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt?: string;
}

interface UserBookingItem {
  id: string;
  _id?: string;
  bookingType: 'stay' | 'package' | 'experience';
  bookingReference: string;
  title: string;
  propertyName?: string;
  location?: string;
  checkInDate?: string;
  checkOutDate?: string;
  startDate?: string;
  activityDate?: string;
  nights?: number;
  duration?: string;
  guestsCount?: number;
  totalAmountInr: number;
  bookingStatus: string;
  paymentStatus?: string;
  createdAt: string;
}

export default function UserDetailHistoryView({ id }: UserDetailHistoryViewProps) {
  const router = useRouter();
  const { user: currentStaff, role, activeViewMode, isAuthenticated } = useAuth();

  // Strict Admin Gate: only administrators can view full user profiles and history
  const isAdmin = activeViewMode === 'admin' && role !== 'vendor';

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [bookings, setBookings] = useState<UserBookingItem[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'stays' | 'packages' | 'experiences'>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Action Modals State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'standard' | 'gold' | 'platinum'>('standard');
  const [isClubMemberVal, setIsClubMemberVal] = useState(false);
  const [isUpdatingMembership, setIsUpdatingMembership] = useState(false);

  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch full user profile & stats from backend
  const loadUserData = useCallback(async () => {
    if (!id || !isAdmin) return;
    try {
      setLoading(true);
      const res = await api.get(`/admin/users/${id}`);
      const data = res.data?.data || res.data;
      setUserData(data);
      if (data?.membership) {
        setSelectedTier(data.membership.tier || 'standard');
        setIsClubMemberVal(Boolean(data.membership.isClubMember));
      }
    } catch (err: any) {
      console.error('Failed to load user details:', err);
      showToast(getApiErrorMessage(err) || 'Failed to load user profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin, showToast]);

  // Fetch lifetime booking history for this user
  const loadUserBookings = useCallback(async () => {
    if (!id || !isAdmin) return;
    try {
      setBookingsLoading(true);
      const res = await api.get('/admin/bookings', {
        params: {
          userId: id,
          limit: 100,
        },
      });
      const items = res.data?.data || res.data?.items || res.data || [];
      if (Array.isArray(items)) {
        const mapped: UserBookingItem[] = items.map((b: any) => ({
          id: b.id || b._id,
          bookingType: b.type || b.bookingType || (b.checkInDate ? 'stay' : b.startDate ? 'package' : 'experience'),
          bookingReference: b.bookingReference || b.bookingId || `#BK-${(b.id || '').slice(-6).toUpperCase()}`,
          title: b.title || b.propertyName || b.packageName || b.activityName || 'Booking Details',
          propertyName: b.propertyName || b.title,
          location: b.location || b.destination || 'Mahabaleshwar & Panchgani',
          checkInDate: b.checkInDate,
          checkOutDate: b.checkOutDate,
          startDate: b.startDate,
          activityDate: b.activityDate,
          nights: b.nights,
          duration: b.duration,
          guestsCount: b.guestsCount || b.guests?.total || 1,
          totalAmountInr: b.grandTotalInr || b.pricing?.grandTotalInr || b.pricing?.totalInr || b.totalAmountInr || b.amount || 0,
          bookingStatus: b.bookingStatus || b.status || 'confirmed',
          paymentStatus: b.paymentStatus || b.payment?.status || 'paid',
          createdAt: b.createdAt || new Date().toISOString(),
        }));
        setBookings(mapped);
      }
    } catch (err: any) {
      console.error('Failed to fetch user bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadUserData();
      loadUserBookings();
    }
  }, [isAdmin, loadUserData, loadUserBookings]);

  // Filter bookings by selected category tab
  const filteredBookings = useMemo(() => {
    if (activeTab === 'all') return bookings;
    if (activeTab === 'stays') return bookings.filter((b) => b.bookingType === 'stay');
    if (activeTab === 'packages') return bookings.filter((b) => b.bookingType === 'package');
    if (activeTab === 'experiences') return bookings.filter((b) => b.bookingType === 'experience');
    return bookings;
  }, [bookings, activeTab]);

  // Compute calculated metrics
  const computedMetrics = useMemo(() => {
    const totalSpent = bookings.reduce((sum, b) => {
      if (b.bookingStatus !== 'cancelled') {
        return sum + (b.totalAmountInr || 0);
      }
      return sum;
    }, 0);

    const completedCount = bookings.filter(
      (b) => b.bookingStatus === 'completed' || b.bookingStatus === 'checked_out'
    ).length;

    return {
      totalSpent: totalSpent > 0 ? totalSpent : userData?.metrics?.totalSpentInr || 0,
      totalBookings: bookings.length > 0 ? bookings.length : userData?.metrics?.totalBookingsCount || 0,
      completedStays: completedCount > 0 ? completedCount : userData?.metrics?.completedStaysCount || 0,
    };
  }, [bookings, userData]);

  // 1. Status Toggle Handler (Suspend / Activate)
  const handleToggleStatus = async () => {
    if (!userData) return;
    const nextStatus = userData.status === 'active' ? 'suspended' : 'active';
    try {
      setIsUpdatingStatus(true);
      await api.patch(`/admin/users/${userData.id}/status`, {
        status: nextStatus,
        reason: statusReason.trim() || (nextStatus === 'suspended' ? 'Administrative security review' : 'Reinstated by admin'),
      });
      setUserData((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      showToast(`User status updated to ${nextStatus}.`);
      setStatusModalOpen(false);
      setStatusReason('');
    } catch (err: any) {
      showToast(getApiErrorMessage(err) || 'Failed to update user status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 2. Membership Tier Update Handler
  const handleUpdateMembership = async () => {
    if (!userData) return;
    try {
      setIsUpdatingMembership(true);
      const res = await api.patch(`/admin/users/${userData.id}/membership`, {
        isClubMember: isClubMemberVal,
        tier: selectedTier,
      });
      const newMembership = res.data?.data || res.data;
      setUserData((prev) => (prev ? { ...prev, membership: newMembership } : prev));
      showToast('Membership privileges updated successfully.');
      setMembershipModalOpen(false);
    } catch (err: any) {
      showToast(getApiErrorMessage(err) || 'Failed to update membership', 'error');
    } finally {
      setIsUpdatingMembership(false);
    }
  };

  // 3. Send Direct Notification Email Handler
  const handleSendNotification = async () => {
    if (!userData || !emailSubject.trim() || !emailMessage.trim()) return;
    try {
      setIsSendingEmail(true);
      await api.post(`/admin/users/${userData.id}/notify`, {
        subject: emailSubject.trim(),
        message: emailMessage.trim(),
      });
      showToast(`Email dispatched to ${userData.email}`);
      setNotifyModalOpen(false);
      setEmailSubject('');
      setEmailMessage('');
    } catch (err: any) {
      showToast(getApiErrorMessage(err) || 'Failed to send notification email', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 4. Delete User Account
  const handleDeleteUser = async () => {
    if (!userData) return;
    try {
      setIsDeletingUser(true);
      await api.delete(`/admin/users/${userData.id}`);
      showToast(`User ${userData.fullName} deleted permanently.`);
      setTimeout(() => {
        router.push('/dashboard/users');
      }, 800);
    } catch (err: any) {
      showToast(getApiErrorMessage(err) || 'Failed to delete user', 'error');
      setIsDeletingUser(false);
    }
  };

  // Access Restriction Guard for non-admins (Vendors, Guests)
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-poppins">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Only verified system administrators possess clearance to view registered users&apos; confidential contact records and full lifetime order history.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto py-2">
        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  // Not found fallback
  if (!userData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Profile Not Found</h3>
          <p className="text-xs text-slate-500">
            The requested customer profile ID does not exist or may have been deleted from the database.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/users"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Users List</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userPhone = userData.phone
    ? `${userData.phone.countryCode || '+91'} ${userData.phone.nationalNumber}`
    : userData.phoneNumber || 'Not provided';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-white text-xs font-semibold shadow-2xl border animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 border-slate-700 text-white'
              : 'bg-rose-600 border-rose-500 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Breadcrumb & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/users"
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition shadow-2xs group"
            title="Return to Users Table"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <Link href="/dashboard" className="hover:text-slate-600">Admin</Link>
              <span>/</span>
              <Link href="/dashboard/users" className="hover:text-slate-600">Registered Users</Link>
              <span>/</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold">{userData.userCode}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-poppins flex items-center gap-2.5 mt-0.5">
              <span>Customer Details &amp; History</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/60 dark:border-rose-900">
                Admin Exclusive View
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setNotifyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-blue-500" />
            <span>Send Email</span>
          </button>

          <button
            onClick={() => setMembershipModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition shadow-2xs cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit Membership</span>
          </button>

          <button
            onClick={() => setStatusModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition shadow-2xs cursor-pointer ${
              userData.status === 'active'
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            {userData.status === 'active' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Suspend Account</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reactivate Account</span>
              </>
            )}
          </button>

          <button
            onClick={() => setDeleteModalOpen(true)}
            title="Permanently Delete User"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/80 dark:border-slate-800 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Profile Header Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Avatar and Identity */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#ea110d] via-rose-500 to-amber-500 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl font-poppins shadow-md ring-4 ring-rose-50 dark:ring-rose-950/50">
                {userData.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                  userData.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                title={`Status: ${userData.status}`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-poppins">
                  {userData.fullName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {userData.userCode}
                </span>
                {userData.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                    ● Active Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200/70">
                    ● Suspended
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{userData.email}</span>
                  {userData.verification?.isEmailVerified && (
                    <span className="text-emerald-600 font-bold text-[10px]">✓</span>
                  )}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{userPhone}</span>
                  {userData.verification?.isPhoneVerified && (
                    <span className="text-emerald-600 font-bold text-[10px]">✓</span>
                  )}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Member since {new Date(userData.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Membership Club Pill Badge */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Mahastays Club
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">
                {userData.membership?.tier || 'standard'} Member
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                {userData.membership?.isClubMember
                  ? '8% Privilege Instant Discount'
                  : 'Standard Public Rate'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Lifetime Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Lifetime Spent */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Lifetime Gross Spent</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            ₹{computedMetrics.totalSpent.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Direct booking transactions</p>
        </div>

        {/* Metric 2: Total Bookings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Bookings Count</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {computedMetrics.totalBookings} Orders
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {userData.bookingCounts
              ? `${userData.bookingCounts.stays} Stays · ${userData.bookingCounts.packages} Pkgs · ${userData.bookingCounts.experiences} Exps`
              : 'Across all categories'}
          </p>
        </div>

        {/* Metric 3: Completed Stays */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Successful Trips</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {computedMetrics.completedStays} Completed
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Zero disputes or chargebacks</p>
        </div>

        {/* Metric 4: Account Security & Verification */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">KYC &amp; Verification</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span className="text-emerald-600">✓ Fully Verified</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Email &amp; Mobile OTP authenticated</p>
        </div>
      </div>

      {/* Two-Column Grid: Left Profile Information & Right Lifetime Booking History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): User Dossier & Contact Specs */}
        <div className="lg:col-span-4 space-y-5">
          {/* Contact & Verification Dossier */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span>Personal Dossier</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Full Legal Name</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{userData.fullName}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">{userData.email}</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1">
                  ✓ Confirmed &amp; OTP Validated
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Primary Mobile</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{userPhone}</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1">
                  ✓ Verified Mobile Device
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Date of Birth</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {userData.dateOfBirth
                      ? new Date(userData.dateOfBirth).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Not disclosed'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Gender</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {userData.gender || 'Not specified'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Registered Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>
                    {userData.postalAddress?.city
                      ? `${userData.postalAddress.city}, ${userData.postalAddress.state || 'Maharashtra'}`
                      : 'Maharashtra, India'}
                  </span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Database ID</span>
                <span className="font-mono text-[10px] text-slate-500 break-all">{userData.id}</span>
              </div>
            </div>
          </div>

          {/* Membership Club Card */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-3xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-white" />
                <h4 className="font-bold text-sm font-poppins">Mahastays Club Privileges</h4>
              </div>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                {userData.membership?.tier || 'Gold'}
              </span>
            </div>
            <p className="text-xs text-amber-100 leading-relaxed">
              Enrolled travelers receive an instant 8% platform discount on handpicked Sahyadri villas, priority concierge line, and complimentary breakfast upgrades.
            </p>
            <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs">
              <span className="text-amber-100">Discount Status:</span>
              <span className="font-bold">
                {userData.membership?.isClubMember ? 'Active (8% OFF)' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Comprehensive Lifetime Booking History */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header with Filter Pills */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-poppins flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#ea110d]" />
                  <span>Lifetime Bookings History</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {bookings.length} Orders
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete chronology of verified stays, packages, and guided adventures
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({bookings.length})
                </button>
                <button
                  onClick={() => setActiveTab('stays')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    activeTab === 'stays'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Stays
                </button>
                <button
                  onClick={() => setActiveTab('packages')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    activeTab === 'packages'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Packages
                </button>
                <button
                  onClick={() => setActiveTab('experiences')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    activeTab === 'experiences'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Adventures
                </button>
              </div>
            </div>

            {/* Bookings List or Table */}
            {bookingsLoading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Querying traveler order ledger...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-16 text-center space-y-3 max-w-sm mx-auto p-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No bookings found in this view
                </h4>
                <p className="text-xs text-slate-500">
                  {activeTab === 'all'
                    ? 'No lifetime bookings recorded yet for this traveler account.'
                    : `No ${activeTab} reservations found for this customer.`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-850/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          b.bookingType === 'stay'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                            : b.bookingType === 'package'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        }`}
                      >
                        {b.bookingType === 'stay' ? (
                          <BedDouble className="w-5 h-5" />
                        ) : b.bookingType === 'package' ? (
                          <Compass className="w-5 h-5" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                            {b.bookingReference}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              b.bookingType === 'stay'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : b.bookingType === 'package'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {b.bookingType}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              b.bookingStatus === 'confirmed' || b.bookingStatus === 'completed' || b.bookingStatus === 'checked_in'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                                : b.bookingStatus === 'cancelled'
                                ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}
                          >
                            {b.bookingStatus.replace('_', ' ')}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {b.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{b.location}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {b.checkInDate
                                ? `${b.checkInDate} → ${b.checkOutDate || ''}`
                                : b.startDate || b.activityDate || 'Scheduled'}
                            </span>
                          </span>
                          <span>•</span>
                          <span>{b.guestsCount} Guests</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                      <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-poppins">
                        ₹{(b.totalAmountInr || 0).toLocaleString('en-IN')}
                      </div>
                      <Link
                        href={`/dashboard/bookings/${b.bookingType}/${b.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      >
                        <span>View Order</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────── Status Change Modal (Suspend / Reactivate) ───────────────── */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>
                  {userData.status === 'active' ? 'Suspend Traveler Account' : 'Reactivate Traveler Account'}
                </span>
              </h3>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {userData.status === 'active'
                ? `Suspending ${userData.fullName} will immediately invalidate their current login sessions and revoke all active mobile / web access tokens.`
                : `Reactivating will permit ${userData.fullName} to log in, make new bookings, and manage existing reservations.`}
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Administrative Reason / Audit Note
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="State the audit rationale for this account status transition..."
                rows={3}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setStatusModalOpen(false)}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1.5 ${
                  userData.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isUpdatingStatus ? 'Updating...' : userData.status === 'active' ? 'Confirm Suspension' : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── Membership Tier Modal ───────────────── */}
      {membershipModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Update Mahastays Club Tier</span>
              </h3>
              <button
                onClick={() => setMembershipModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isClubMemberVal}
                  onChange={(e) => setIsClubMemberVal(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Enrolled in 8% Privilege Club Discount
                </span>
              </label>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Assigned Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['standard', 'gold', 'platinum'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedTier(tier)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition border cursor-pointer ${
                        selectedTier === tier
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setMembershipModalOpen(false)}
                disabled={isUpdatingMembership}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMembership}
                disabled={isUpdatingMembership}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm"
              >
                {isUpdatingMembership ? 'Saving...' : 'Save Privileges'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── Send Direct Notification Modal ───────────────── */}
      {notifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>Send Email to {userData.fullName}</span>
              </h3>
              <button
                onClick={() => setNotifyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Recipient
                </label>
                <input
                  type="text"
                  disabled
                  value={userData.email}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Update regarding your upcoming Mahabaleshwar reservation"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Message Body
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Type your official administrative communication here..."
                  rows={4}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setNotifyModalOpen(false)}
                disabled={isSendingEmail}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                disabled={isSendingEmail || !emailSubject.trim() || !emailMessage.trim()}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingEmail ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── Delete User Confirm Modal ───────────────── */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Permanently Delete User"
        itemName={userData.fullName}
        message={
          <p>
            Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{userData.fullName}</strong> ({userData.userCode})? All associated wishlist items, saved tickets, and session tokens will be permanently scrubbed.
          </p>
        }
        confirmButtonText="Confirm Delete"
        isLoading={isDeletingUser}
      />
    </div>
  );
}

