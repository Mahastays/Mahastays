'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Percent,
  Clock,
  Building2,
  Sliders,
  Search,
  Check,
  X,
  Edit3,
  RotateCcw,
  Sparkles,
  Building,
  Compass,
  Gift,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Power,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchVendors, updateVendorCommissionAsync } from '../../../store/slices/vendorsSlice';
import { VendorItem, PlatformConfigData } from '../../../types';
import api from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';

const DEFAULT_PLATFORM_CONFIG: PlatformConfigData = {
  gstRates: {
    staysStandardGstPercent: 12,
    packagesGstPercent: 5,
    experiencesGstPercent: 5,
  },
  platformFees: {
    defaultCleaningFeeRatePercent: 5,
    defaultGearInsuranceFeeRatePercent: 4,
    clubMemberDiscountPercent: 8,
    packageChildPricePercent: 60,
    experienceChildPricePercent: 70,
  },
  cancellationWindowRules: {
    defaultFreeCancellationHours: 48,
    lateCancellationFeePercent: 50,
  },
  defaultCommission: {
    propertyCommissionRatePercent: 12,
    packageCommissionRatePercent: 10,
    experienceCommissionRatePercent: 15,
    payoutCycle: 'monthly',
  },
  payoutRules: {
    tdsRatePercent: 1,
    minPayoutAmountInr: 1000,
    holdDaysAfterService: 2,
  },
};

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { activeViewMode, user } = useAuth();
  const isAdmin = activeViewMode === 'admin';

  const vendors = useAppSelector((state) => state.vendors.items);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfigData>(DEFAULT_PLATFORM_CONFIG);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Platform Config Edit Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState<PlatformConfigData>(DEFAULT_PLATFORM_CONFIG);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Vendor Commission Edit Modal State
  const [vendorToEdit, setVendorToEdit] = useState<VendorItem | null>(null);
  const [vendorCommissionForm, setVendorCommissionForm] = useState({
    propertyCommissionRatePercent: 12,
    packageCommissionRatePercent: 10,
    experienceCommissionRatePercent: 15,
    commissionType: 'percentage' as 'percentage' | 'fixed',
    payoutCycle: 'monthly' as 'weekly' | 'biweekly' | 'monthly',
  });
  const [isSavingVendorCommission, setIsSavingVendorCommission] = useState(false);

  // Vendor Table Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'property_host' | 'activity_operator' | 'integrated_resort'>('all');

  const showToast = (msg: string) => {
    toast.success(msg);
  };

  // 1. Fetch live platform configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoadingConfig(true);
        const res = await api.get('/admin/config');
        if (res.data?.data) {
          const cfg = res.data.data;
          const merged: PlatformConfigData = {
            gstRates: { ...DEFAULT_PLATFORM_CONFIG.gstRates, ...cfg.gstRates },
            platformFees: { ...DEFAULT_PLATFORM_CONFIG.platformFees, ...cfg.platformFees },
            cancellationWindowRules: { ...DEFAULT_PLATFORM_CONFIG.cancellationWindowRules, ...cfg.cancellationWindowRules },
            defaultCommission: { ...DEFAULT_PLATFORM_CONFIG.defaultCommission, ...cfg.defaultCommission },
            payoutRules: { ...DEFAULT_PLATFORM_CONFIG.payoutRules, ...cfg.payoutRules },
          };
          setPlatformConfig(merged);
          setConfigForm(merged);
        }
      } catch {
        // Fallback to defaults
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfig();
    dispatch(fetchVendors());
  }, [dispatch]);

  // 2. Open Vendor Commission Edit Modal
  const handleOpenVendorEdit = (v: VendorItem) => {
    setVendorToEdit(v);
    setVendorCommissionForm({
      propertyCommissionRatePercent:
        v.commissionTerms?.propertyCommissionRatePercent ?? platformConfig.defaultCommission.propertyCommissionRatePercent,
      packageCommissionRatePercent:
        v.commissionTerms?.packageCommissionRatePercent ?? platformConfig.defaultCommission.packageCommissionRatePercent,
      experienceCommissionRatePercent:
        v.commissionTerms?.experienceCommissionRatePercent ?? platformConfig.defaultCommission.experienceCommissionRatePercent,
      commissionType: v.commissionTerms?.commissionType || 'percentage',
      payoutCycle: v.commissionTerms?.payoutCycle || platformConfig.defaultCommission.payoutCycle,
    });
  };

  // 3. Save Vendor Commission Overrides
  const handleSaveVendorCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorToEdit) return;

    try {
      setIsSavingVendorCommission(true);
      await dispatch(
        updateVendorCommissionAsync({
          vendorId: vendorToEdit.id,
          terms: vendorCommissionForm,
        })
      ).unwrap();

      showToast(`Commission terms for "${vendorToEdit.businessName || vendorToEdit.displayName}" updated successfully.`);
      setVendorToEdit(null);
    } catch (err: any) {
      toast.error(err?.message || err || 'Failed to update vendor commission terms');
    } finally {
      setIsSavingVendorCommission(false);
    }
  };

  // 4. Reset Vendor Modal to Platform Defaults
  const handleResetVendorToDefaults = () => {
    setVendorCommissionForm({
      propertyCommissionRatePercent: platformConfig.defaultCommission.propertyCommissionRatePercent,
      packageCommissionRatePercent: platformConfig.defaultCommission.packageCommissionRatePercent,
      experienceCommissionRatePercent: platformConfig.defaultCommission.experienceCommissionRatePercent,
      commissionType: 'percentage',
      payoutCycle: platformConfig.defaultCommission.payoutCycle,
    });
  };

  // 5. Save Platform Rules & Config
  const handleSavePlatformConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingConfig(true);
      const res = await api.put('/admin/config', configForm);
      if (res.data?.data) {
        setPlatformConfig(configForm);
      }
      setIsConfigModalOpen(false);
      showToast('Platform Rules and Default Commissions updated successfully.');
    } catch (err: any) {
      toast.error(err?.message || err || 'Failed to update platform configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // 6. Master Killswitch: Stop or Resume Bookings Across the Entire Platform
  const handleTogglePlatformBookings = async (enabled: boolean, customMessage?: string) => {
    try {
      setIsSavingConfig(true);
      const msg = customMessage !== undefined ? customMessage : (platformConfig.platformBookingsMessage || '');
      const patch = {
        platformBookingsEnabled: enabled,
        platformBookingsMessage: msg,
      };
      await api.put('/admin/config', patch);
      const updated: PlatformConfigData = {
        ...platformConfig,
        platformBookingsEnabled: enabled,
        platformBookingsMessage: msg,
      };
      setPlatformConfig(updated);
      setConfigForm(updated);
      showToast(
        enabled
          ? 'Platform-wide bookings resumed! Guests can now place reservations.'
          : 'Platform bookings paused! All reservations and checkout flows are stopped.'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update platform bookings status');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Filtered vendors list
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const bName = (v.businessName || '').toLowerCase();
        const dName = (v.displayName || '').toLowerCase();
        const code = (v.vendorCode || '').toLowerCase();
        const email = (v.email || '').toLowerCase();
        return bName.includes(q) || dName.includes(q) || code.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [vendors, categoryFilter, searchQuery]);

  // Current vendor's personal commission terms if in vendor mode
  const currentVendor = useMemo(() => {
    if (isAdmin) return null;
    return vendors.find((v) => v.id === user?.vendorId || v.email === user?.email) || null;
  }, [vendors, isAdmin, user]);

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{isAdmin ? 'Platform Rules & Configuration' : 'Vendor Partner Account Preferences'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdmin
              ? 'Prisma platform configuration singleton values, commission rules & MTDC standards'
              : 'Notification channels, payout account details, and active commission terms'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setConfigForm(platformConfig);
              setIsConfigModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Platform Rules</span>
          </button>
        )}
      </div>

      {/* ── 0. Global Platform Booking Master Switch (Admin Only) ── */}
      {isAdmin && (
        <div className={`p-5 sm:p-6 rounded-3xl border transition-all shadow-sm ${
          platformConfig.platformBookingsEnabled === false
            ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700/60'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                platformConfig.platformBookingsEnabled === false
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
              }`}>
                <Power className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 font-poppins">
                    Global Platform Booking Status
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                    platformConfig.platformBookingsEnabled === false
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {platformConfig.platformBookingsEnabled === false ? 'Bookings Paused' : 'Live & Accepting Bookings'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {platformConfig.platformBookingsEnabled === false
                    ? 'All new reservation checkouts (Hotels, Villas, Packages, and Experiences) are currently paused across the entire platform. Customers cannot submit payments.'
                    : 'System is open. Travelers can freely book any active stays, holiday packages, and adventures.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
              {platformConfig.platformBookingsEnabled === false ? (
                <button
                  type="button"
                  disabled={isSavingConfig}
                  onClick={() => handleTogglePlatformBookings(true)}
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Resume All Bookings</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSavingConfig}
                  onClick={() => {
                    const reason = window.prompt(
                      'Enter reason / announcement for pausing platform bookings (or leave empty for default maintenance notice):',
                      platformConfig.platformBookingsMessage || 'Platform reservations are temporarily paused by administration. Please check back shortly.'
                    );
                    if (reason !== null) {
                      handleTogglePlatformBookings(false, reason);
                    }
                  }}
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PauseCircle className="w-4 h-4" />
                  <span>Stop All Bookings (Global Freeze)</span>
                </button>
              )}
            </div>
          </div>

          {platformConfig.platformBookingsEnabled === false && (
            <div className="mt-4 pt-3.5 border-t border-amber-200/80 dark:border-amber-800/60 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>Notice displayed to guests:</strong> &ldquo;{platformConfig.platformBookingsMessage || 'Platform reservations are temporarily paused by administration.'}&rdquo;
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── 1. Top Metrics Cards (Platform Defaults) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {/* GST Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 uppercase font-bold text-[10px]">
            <span className="flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-rose-600" />
              <span>Stays GST Rate</span>
            </span>
            <span className="text-slate-400 font-normal">Active</span>
          </div>
          <div className="text-xl font-bold text-rose-600 mt-2">
            {platformConfig.gstRates.staysStandardGstPercent}% Standard
          </div>
          <div className="text-slate-500 mt-1">
            Packages: {platformConfig.gstRates.packagesGstPercent}% &bull; Experiences: {platformConfig.gstRates.experiencesGstPercent}%
          </div>
        </div>

        {/* Default Commission Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 uppercase font-bold text-[10px]">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Default Commission</span>
            </span>
            <span className="text-emerald-600 font-bold">Standard</span>
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-2">
            {platformConfig.defaultCommission.propertyCommissionRatePercent}% Stays &bull; {platformConfig.defaultCommission.packageCommissionRatePercent}% Tours
          </div>
          <div className="text-slate-500 mt-1">
            Experiences: {platformConfig.defaultCommission.experienceCommissionRatePercent}% &bull; Cycle: {platformConfig.defaultCommission.payoutCycle.toUpperCase()}
          </div>
        </div>

        {/* Cancellation Window Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 uppercase font-bold text-[10px]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Free Cancellation Window</span>
            </span>
            <span className="text-sky-600 font-bold">Policy</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-2">
            {platformConfig.cancellationWindowRules.defaultFreeCancellationHours} Hours
          </div>
          <div className="text-slate-500 mt-1">
            {platformConfig.cancellationWindowRules.lateCancellationFeePercent}% penalty for cancellations within {platformConfig.cancellationWindowRules.defaultFreeCancellationHours}h of check-in
          </div>
        </div>
      </div>

      {/* ── 2. Vendor Partner Personal View (if logged in as vendor) ── */}
      {!isAdmin && currentVendor && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Your Negotiated Commission Terms & Rates
              </h3>
              <p className="text-xs text-slate-400">
                These rates are automatically deducted from customer payouts upon completion of service.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Verified Partner
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">Stays Commission</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {currentVendor.commissionTerms?.propertyCommissionRatePercent ?? platformConfig.defaultCommission.propertyCommissionRatePercent}%
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Applies to Villa & Hotel room bookings</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/60">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase">Packages Commission</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {currentVendor.commissionTerms?.packageCommissionRatePercent ?? platformConfig.defaultCommission.packageCommissionRatePercent}%
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Applies to Curated Tour Package reservations</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">Experiences Commission</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {currentVendor.commissionTerms?.experienceCommissionRatePercent ?? platformConfig.defaultCommission.experienceCommissionRatePercent}%
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Applies to Treks & Outdoor activities</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Vendor Commissions Management Table (ADMIN ONLY) ── */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Vendor-Specific Commission Terms</span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure tailored commission rates for specific vendors across Stays, Tour Packages, and Experiences
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { key: 'all', label: 'All Vendors' },
                { key: 'property_host', label: 'Property Hosts' },
                { key: 'activity_operator', label: 'Activity Operators' },
                { key: 'integrated_resort', label: 'Resorts' },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategoryFilter(c.key as any)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                    categoryFilter === c.key
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor by business name, code, contact or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {/* Vendors Commissions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 pl-6 pr-4 font-semibold text-slate-600 dark:text-slate-300">Vendor / Partner</th>
                    <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300">Category</th>
                    <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">
                      Stays Commission
                    </th>
                    <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">
                      Packages Commission
                    </th>
                    <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">
                      Experiences Commission
                    </th>
                    <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">
                      Payout Cycle
                    </th>
                    <th className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Terms Status</th>
                    <th className="py-4 pr-6 pl-4 font-semibold text-slate-600 dark:text-slate-300 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  {filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Building2 className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-sm">No vendors found</p>
                          <p className="text-xs text-slate-400">
                            {searchQuery ? 'Try adjusting your search criteria.' : 'No vendors registered on platform.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((v) => {
                      const staysRate =
                        v.commissionTerms?.propertyCommissionRatePercent ??
                        platformConfig.defaultCommission.propertyCommissionRatePercent;
                      const pkgRate =
                        v.commissionTerms?.packageCommissionRatePercent ??
                        platformConfig.defaultCommission.packageCommissionRatePercent;
                      const expRate =
                        v.commissionTerms?.experienceCommissionRatePercent ??
                        platformConfig.defaultCommission.experienceCommissionRatePercent;

                      const isCustom =
                        v.commissionTerms?.propertyCommissionRatePercent !== undefined &&
                        (v.commissionTerms.propertyCommissionRatePercent !== platformConfig.defaultCommission.propertyCommissionRatePercent ||
                          v.commissionTerms.packageCommissionRatePercent !== platformConfig.defaultCommission.packageCommissionRatePercent ||
                          v.commissionTerms.experienceCommissionRatePercent !== platformConfig.defaultCommission.experienceCommissionRatePercent);

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Vendor Info */}
                          <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white text-[13px] leading-tight">
                                {v.businessName || v.displayName}
                              </span>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                <span className="font-mono text-rose-500 font-semibold">{v.vendorCode}</span>
                                {v.email && <span className="ml-1.5 text-slate-400">&bull; {v.email}</span>}
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 capitalize">
                              {v.category.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Stays Commission */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${
                                v.commissionTerms?.propertyCommissionRatePercent !== undefined &&
                                v.commissionTerms.propertyCommissionRatePercent !== platformConfig.defaultCommission.propertyCommissionRatePercent
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {staysRate}%
                            </span>
                          </td>

                          {/* Packages Commission */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${
                                v.commissionTerms?.packageCommissionRatePercent !== undefined &&
                                v.commissionTerms.packageCommissionRatePercent !== platformConfig.defaultCommission.packageCommissionRatePercent
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {pkgRate}%
                            </span>
                          </td>

                          {/* Experiences Commission */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${
                                v.commissionTerms?.experienceCommissionRatePercent !== undefined &&
                                v.commissionTerms.experienceCommissionRatePercent !== platformConfig.defaultCommission.experienceCommissionRatePercent
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {expRate}%
                            </span>
                          </td>

                          {/* Payout Cycle */}
                          <td className="py-4 px-4 text-center whitespace-nowrap font-medium capitalize text-[11px] text-slate-500">
                            {v.commissionTerms?.payoutCycle || platformConfig.defaultCommission.payoutCycle}
                          </td>

                          {/* Terms Status */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            {isCustom ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                <Sparkles className="w-3 h-3" />
                                <span>Custom Rate</span>
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                                Default
                              </span>
                            )}
                          </td>

                          {/* Edit Action */}
                          <td className="py-4 pr-6 pl-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenVendorEdit(v)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit Commission</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Security & Compliance State (From Screenshot) ── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Security & Compliance State</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <div className="text-slate-400 font-medium">Session Authenticated As</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">
              {user?.name} ({user?.email})
            </div>
            <div className="text-[11px] text-slate-500">
              Role: <span className="capitalize font-semibold text-rose-600">{user?.role}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <div className="text-slate-400 font-medium">Compliance Verification</div>
            <div className="font-bold text-emerald-600 flex items-center gap-1.5">
              <span>MTDC Hospitality Certified</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                Active
              </span>
            </div>
            <div className="text-[11px] text-slate-500">Verified against Government of Maharashtra Tourism Portal</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: Edit Platform Rules & Configuration                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Platform Rules & Rates</h3>
                <p className="text-xs text-slate-500">Applies globally across MahaStays platform operations</p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlatformConfig} className="p-6 space-y-5 text-xs">
              {/* GST Section */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider block">
                  1. GST Tax Rates (%)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Stays GST (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={configForm.gstRates.staysStandardGstPercent}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          gstRates: { ...configForm.gstRates, staysStandardGstPercent: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Packages GST (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={configForm.gstRates.packagesGstPercent}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          gstRates: { ...configForm.gstRates, packagesGstPercent: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Experiences GST (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={configForm.gstRates.experiencesGstPercent}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          gstRates: { ...configForm.gstRates, experiencesGstPercent: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Default Commission Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider block">
                  2. Default Platform Commission Rates (%)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Stays Comm. (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={configForm.defaultCommission.propertyCommissionRatePercent}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          defaultCommission: {
                            ...configForm.defaultCommission,
                            propertyCommissionRatePercent: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Packages Comm. (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={configForm.defaultCommission.packageCommissionRatePercent}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          defaultCommission: {
                            ...configForm.defaultCommission,
                            packageCommissionRatePercent: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Experiences Comm. (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={configForm.defaultCommission.experienceCommissionRatePercent}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          defaultCommission: {
                            ...configForm.defaultCommission,
                            experienceCommissionRatePercent: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Cancellation Rules */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider block">
                  3. Cancellation & Payout Rules
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Free Cancellation Window (Hours)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="720"
                      value={configForm.cancellationWindowRules.defaultFreeCancellationHours}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          cancellationWindowRules: {
                            ...configForm.cancellationWindowRules,
                            defaultFreeCancellationHours: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Late Cancellation Penalty (%)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={configForm.cancellationWindowRules.lateCancellationFeePercent}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          cancellationWindowRules: {
                            ...configForm.cancellationWindowRules,
                            lateCancellationFeePercent: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-5 py-2 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50"
                >
                  {isSavingConfig ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: Edit Specific Vendor Commission Overrides             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {vendorToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Edit Commissions: {vendorToEdit.businessName || vendorToEdit.displayName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">Vendor Code: {vendorToEdit.vendorCode}</p>
              </div>
              <button
                onClick={() => setVendorToEdit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendorCommission} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">Platform Defaults</span>
                  <span className="text-[11px] text-slate-400">
                    Stays: {platformConfig.defaultCommission.propertyCommissionRatePercent}% &bull; Packages:{' '}
                    {platformConfig.defaultCommission.packageCommissionRatePercent}% &bull; Experiences:{' '}
                    {platformConfig.defaultCommission.experienceCommissionRatePercent}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetVendorToDefaults}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              {/* Commission Rates Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-rose-600 dark:text-rose-400">Stays Comm. (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={vendorCommissionForm.propertyCommissionRatePercent}
                    onChange={(e) =>
                      setVendorCommissionForm({
                        ...vendorCommissionForm,
                        propertyCommissionRatePercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 block">Villas & Hotel stays</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    Packages Comm. (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={vendorCommissionForm.packageCommissionRatePercent}
                    onChange={(e) =>
                      setVendorCommissionForm({
                        ...vendorCommissionForm,
                        packageCommissionRatePercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 block">Tour packages</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    Experiences Comm. (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={vendorCommissionForm.experienceCommissionRatePercent}
                    onChange={(e) =>
                      setVendorCommissionForm({
                        ...vendorCommissionForm,
                        experienceCommissionRatePercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 block">Treks & activities</span>
                </div>
              </div>

              {/* Payout Cycle & Commission Type */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Commission Type</label>
                  <select
                    value={vendorCommissionForm.commissionType}
                    onChange={(e) =>
                      setVendorCommissionForm({
                        ...vendorCommissionForm,
                        commissionType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed INR (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Payout Cycle</label>
                  <select
                    value={vendorCommissionForm.payoutCycle}
                    onChange={(e) =>
                      setVendorCommissionForm({
                        ...vendorCommissionForm,
                        payoutCycle: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="weekly">Weekly Settlement</option>
                    <option value="biweekly">Bi-Weekly Settlement</option>
                    <option value="monthly">Monthly Settlement</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setVendorToEdit(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVendorCommission}
                  className="px-5 py-2 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50"
                >
                  {isSavingVendorCommission ? 'Saving...' : 'Apply Custom Terms'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
