'use client';

import React, { useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  BedDouble,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  Calendar,
  Wallet,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { NavTab } from '../sidebar/Sidebar';
import { StayBookingItem } from '../../types';
import DashboardSkeleton from '../common/DashboardSkeleton';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProperties } from '../../store/slices/propertiesSlice';
import { fetchBookings } from '../../store/slices/bookingsSlice';

interface OverviewViewProps {
  onNavigateTab: (tab: NavTab) => void;
  onOpenCreateModal: (type: 'property' | 'package' | 'experience' | 'ad') => void;
}

export default function OverviewView({ onNavigateTab, onOpenCreateModal }: OverviewViewProps) {
  const dispatch = useAppDispatch();
  const { user, activeViewMode } = useAuth();
  const { properties, packages, experiences, bookings, ads, setSelectedBooking } = useData();
  const propertiesLoading = useAppSelector((state) => state.properties.loading);
  const bookingsLoading = useAppSelector((state) => state.bookings.loading);

  useEffect(() => {
    if (properties.length === 0) dispatch(fetchProperties());
    if (bookings.length === 0) dispatch(fetchBookings());
  }, [dispatch, properties.length, bookings.length]);

  const isAdmin = activeViewMode === 'admin';

  if ((propertiesLoading || bookingsLoading) && properties.length === 0 && bookings.length === 0) {
    return <DashboardSkeleton type="table" />;
  }

  // Counts
  const pendingProps = properties.filter((p) => p.status === 'pending_approval').length;
  const pendingPkgs = packages.filter((p) => p.status === 'pending_approval').length;
  const pendingExps = experiences.filter((p) => p.status === 'pending_approval').length;
  const pendingAds = ads.filter((a) => !a.approvedByAdmin).length;
  const totalPending = pendingProps + pendingPkgs + pendingExps + pendingAds;

  // Dynamic GMV & Vendor Earnings from real backend bookings
  const platformGMV = bookings.reduce((sum, b) => sum + (b.grandTotalInr || (b as any).totalAmount || 0), 0);
  const vendorBookings = bookings.filter((b) => b.vendorId === user?.vendorId);
  const vendorGMV = vendorBookings.reduce((sum, b) => sum + (b.grandTotalInr || (b as any).totalAmount || 0), 0);
  const vendorNetEarnings = Math.round(vendorGMV * 0.87);

  // Vendor specific counts
  const vendorProps = properties.filter((p) => p.vendorId === user?.vendorId);
  const vendorLive = vendorProps.filter((p) => p.status === 'active').length;
  const vendorPending = vendorProps.filter((p) => p.status === 'pending_approval').length;

  return (
    <div className="space-y-6">
      {/* Welcome & Role Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-100 dark:ring-rose-950"
              />
            ) : (
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white ${isAdmin ? 'bg-rose-600' : 'bg-[#134E4A]'}`}>
                {(user?.name || (isAdmin ? 'Admin' : 'Vendor'))[0].toUpperCase()}
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                isAdmin ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Welcome, {user?.name}
              </h2>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {isAdmin ? 'Platform Ops Lead' : 'Verified Host Partner'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isAdmin
                ? 'Mahastays Central Operations • Real-time database sync active'
                : `${user?.businessName} • Western Maharashtra Resort Host`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {isAdmin ? (
            <>
              <button
                onClick={() => onNavigateTab('approvals')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 transition"
              >
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>Approvals ({totalPending})</span>
              </button>
              <button
                onClick={() => onOpenCreateModal('ad')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
              >
                <Megaphone className="w-4 h-4" />
                <span>Launch Ad</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onOpenCreateModal('property')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
              >
                <BedDouble className="w-4 h-4" />
                <span>+ Add Property</span>
              </button>
              <button
                onClick={() => onOpenCreateModal('ad')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition"
              >
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span>Promote Listing</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pending Approvals Notice Banner */}
      {isAdmin && totalPending > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">{totalPending} Submissions Awaiting Approval:</span>{' '}
              {pendingProps} Stays, {pendingPkgs} Tour Packages, {pendingExps} Experiences, {pendingAds} Vendor Ads.
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('approvals')}
            className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1"
          >
            Review Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Gross Platform GMV</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                ₹{platformGMV.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Live from database
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Live Stays & Hotels</span>
                <BedDouble className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {properties.filter((p) => p.status === 'active').length} Active
              </div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">
                {pendingProps} pending verification
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
                <Users className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {bookings.length} Active
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Stays, Packages & Treks</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Running Ad Campaigns</span>
                <Megaphone className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {ads.filter((a) => a.isActive).length} Live
              </div>
              <div className="text-[11px] text-rose-600 font-medium mt-1">
                {pendingAds} vendor ads to review
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Available in Wallet</span>
                <Wallet className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                ₹{vendorNetEarnings.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Ready for bank transfer</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Lifetime Net Earnings</span>
                <DollarSign className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                ₹{vendorNetEarnings.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">12% commission deducted</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">My Listings</span>
                <BedDouble className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {vendorLive} Live
              </div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">
                {vendorPending} pending admin review
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Guest Reservations</span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {bookings.filter((b) => b.vendorId === user?.vendorId).length} Stays
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Includes VIP guest bookings</div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid: Recent Bookings & Ad Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Bookings Table (Col 8) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Guest Reservations
              </h3>
              <p className="text-xs text-slate-400">Live booking folios and arrival updates</p>
            </div>
            <button
              onClick={() => onNavigateTab('bookings')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              View All Folios <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 font-medium">Guest & Folio</th>
                  <th className="py-2.5 font-medium">Listing</th>
                  <th className="py-2.5 font-medium">Dates</th>
                  <th className="py-2.5 font-medium">Amount</th>
                  <th className="py-2.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => {
                      if (b.type === 'stay') {
                        setSelectedBooking(b as StayBookingItem);
                        onNavigateTab('bookings');
                      }
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{b.guestName}</span>
                        {b.type === 'stay' && (b as StayBookingItem).vipStatus && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-bold">
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">#{b.bookingReference}</div>
                    </td>

                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {b.type === 'stay'
                        ? (b as StayBookingItem).propertyName
                        : b.type === 'package'
                        ? (b as any).packageTitle
                        : (b as any).experienceTitle}
                    </td>

                    <td className="py-3 text-slate-500">
                      {b.type === 'stay'
                        ? `${(b as StayBookingItem).checkInDate} to ${(b as StayBookingItem).checkOutDate}`
                        : (b as any).startDate || (b as any).activityDate}
                    </td>

                    <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                      ₹{(b.grandTotalInr ?? 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked_in'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : b.bookingStatus === 'cancelled'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {b.bookingStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ad Performance Mini-Feed (Col 4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Live Ad Campaigns
              </h3>
              <button
                onClick={() => onNavigateTab('ads')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {ads.slice(0, 3).map((ad) => (
                <div
                  key={ad.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-600 uppercase">
                      {ad.placement}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        ad.approvedByAdmin
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {ad.approvedByAdmin ? 'Live' : 'Pending Approval'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {ad.adName}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                    <span>{((ad.impressions ?? (ad as any).budget?.impressions) || 0).toLocaleString('en-IN')} views</span>
                    <span className="font-semibold text-rose-600">{(ad.clicks ?? (ad as any).budget?.clicks) || 0} clicks</span>
                    <span>₹{((ad.budget?.spentSoFar ?? (ad as any).spentSoFar) || 0).toLocaleString('en-IN')} spent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onOpenCreateModal('ad')}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>{isAdmin ? '+ Launch New Platform Ad' : '+ Promote My Property'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
