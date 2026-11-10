'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  AlertCircle,
  X,
  Send,
  Check,
  Search,
  FileText,
  BadgeCheck,
  XCircle,
  Calendar,
  Filter,
  RotateCcw,
  TrendingUp,
  Receipt,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StayBookingItem } from '../../types';
import DashboardSkeleton from '../common/DashboardSkeleton';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toast } from '../ui/Toast';
import { fetchBookings } from '../../store/slices/bookingsSlice';
import { fetchVendors } from '../../store/slices/vendorsSlice';
import {
  fetchPayouts,
  fetchVendorWallet,
  requestVendorPayout,
  processAdminPayout,
  rejectAdminPayout,
  PayoutItem,
} from '../../store/slices/payoutsSlice';
import VendorSettlementsView from './VendorSettlementsView';

type PeriodFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'custom';
type LedgerTab = 'all' | 'realized' | 'escrow' | 'refunds';

export default function FinanceView() {
  const dispatch = useAppDispatch();
  const { user, activeViewMode } = useAuth();
  const { vendors, bookings } = useData();
  const bookingsLoading = useAppSelector((state) => state.bookings.loading);

  const { items: payouts, wallet: vendorWallet, loading: payoutsLoading, actionLoading } = useAppSelector(
    (state) => state.payouts
  );

  const isAdmin = activeViewMode === 'admin';
  const [adminSubSection, setAdminSubSection] = useState<'platform_ledger' | 'vendor_settlements'>('platform_ledger');

  // Filters & Tabs
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [ledgerTab, setLedgerTab] = useState<LedgerTab>('all');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');

  // Payouts sub-table filter
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'requested' | 'completed' | 'failed'>('all');
  const [payoutSearch, setPayoutSearch] = useState<string>('');

  // Modals
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutItem | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [transferMethod, setTransferMethod] = useState<'NEFT' | 'IMPS' | 'RTGS' | 'UPI'>('NEFT');
  const [processNotes, setProcessNotes] = useState('');

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState<number>(0);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    dispatch(fetchBookings());
    if (isAdmin) {
      dispatch(fetchVendors());
      dispatch(fetchPayouts({ role: 'admin' }));
    } else {
      dispatch(fetchPayouts({ role: 'vendor', vendorId: user?.vendorId }));
      dispatch(fetchVendorWallet());
    }
  }, [dispatch, isAdmin, user?.vendorId]);

  const refreshAll = () => {
    dispatch(fetchBookings());
    if (isAdmin) {
      dispatch(fetchVendors());
      dispatch(fetchPayouts({ role: 'admin' }));
    } else {
      dispatch(fetchPayouts({ role: 'vendor', vendorId: user?.vendorId }));
      dispatch(fetchVendorWallet());
    }
  };

  // Check if a date string falls inside the chosen period filter
  const isDateInPeriod = (dateStr?: string | Date): boolean => {
    if (periodFilter === 'all') return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (periodFilter === 'today') {
      return d >= startOfToday && d <= endOfToday;
    }
    if (periodFilter === 'yesterday') {
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      const endOfYesterday = new Date(startOfToday.getTime() - 1);
      return d >= startOfYesterday && d <= endOfYesterday;
    }
    if (periodFilter === 'week') {
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= startOfWeek && d <= now;
    }
    if (periodFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return d >= startOfMonth && d <= now;
    }
    if (periodFilter === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    }
    if (periodFilter === 'custom') {
      const from = customFrom ? new Date(customFrom) : null;
      const to = customTo ? new Date(new Date(customTo).getTime() + 24 * 60 * 60 * 1000 - 1) : null;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    }
    return true;
  };

  // Filter bookings for active view mode (Admin: all; Vendor: owned only)
  const scopedBookings = useMemo(() => {
    if (isAdmin) return bookings;
    return bookings.filter((b) => b.vendorId === user?.vendorId);
  }, [isAdmin, bookings, user?.vendorId]);

  // Apply time period filter
  const timeFilteredBookings = useMemo(() => {
    return scopedBookings.filter((b) =>
      isDateInPeriod(b.createdAt || (b as any).checkInDate || (b as any).startDate || (b as any).activityDate)
    );
  }, [scopedBookings, periodFilter, customFrom, customTo]);

  // Rigorous Financial Math:
  // Gross Customer Paid = Platform Commission + Net Vendor Share (NO auto TDS, NO secondary GST deduction)
  // Pending bookings are kept strictly separated from Confirmed Totals!
  const financialMetrics = useMemo(() => {
    let realizedGross = 0;
    let realizedCommission = 0;
    let realizedVendorShare = 0;
    let realizedBookingsCount = 0;

    let pendingGross = 0;
    let pendingCommission = 0;
    let pendingVendorShare = 0;
    let pendingBookingsCount = 0;

    let refundsAmount = 0;
    let refundsCount = 0;

    timeFilteredBookings.forEach((b) => {
      const raw = b as any;
      const grandTotal = b.grandTotalInr || raw.totalAmount || 0;
      const commRate = raw.commissionRatePercent || (b.type === 'package' ? 10 : b.type === 'experience' ? 15 : 12);
      const taxable = raw.taxableAmountInr || raw.pricing?.taxableAmount || Math.round(grandTotal / 1.18);
      const comm = raw.commissionAmountInr ?? Math.round(taxable * (commRate / 100));
      const vShare = grandTotal - comm;

      const isCancelled =
        b.bookingStatus === 'cancelled' ||
        (b.paymentStatus as string) === 'refunded' ||
        (b.paymentStatus as string) === 'partially_refunded';

      const isPaid = (b.paymentStatus as string) === 'paid' || (b.paymentStatus as string) === 'captured';
      const isStayDelivered = b.bookingStatus === 'checked_out' || b.bookingStatus === 'completed';

      if (isCancelled) {
        refundsCount += 1;
        refundsAmount += grandTotal;
      } else if (isPaid && isStayDelivered) {
        // CONFIRMED / REALIZED: Stay finished and payment received
        realizedBookingsCount += 1;
        realizedGross += grandTotal;
        realizedCommission += comm;
        realizedVendorShare += vShare;
      } else {
        // PENDING / IN ESCROW: Money pending checkout or check-in settlement
        pendingBookingsCount += 1;
        pendingGross += grandTotal;
        pendingCommission += comm;
        pendingVendorShare += vShare;
      }
    });

    return {
      realizedGross,
      realizedCommission,
      realizedVendorShare,
      realizedBookingsCount,
      pendingGross,
      pendingCommission,
      pendingVendorShare,
      pendingBookingsCount,
      refundsAmount,
      refundsCount,
    };
  }, [timeFilteredBookings]);

  // Payouts aggregate metrics (Bank Disbursements)
  const payoutMetrics = useMemo(() => {
    let completedTotal = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;

    payouts.forEach((p) => {
      if (isDateInPeriod(p.completedAt || p.createdAt)) {
        if (p.status === 'completed') {
          completedTotal += p.netPayableAmountInr || 0;
          completedCount += 1;
        } else if (p.status === 'requested' || p.status === 'audited_by_admin') {
          pendingCount += 1;
          pendingAmount += p.netPayableAmountInr || 0;
        }
      }
    });

    return {
      completedTotal,
      completedCount,
      pendingCount,
      pendingAmount,
    };
  }, [payouts, periodFilter, customFrom, customTo]);

  const currentVendor = vendors.find((v) => v.id === user?.vendorId) || vendors[0];
  const vendorAvailableInr = vendorWallet?.availablePayoutBalanceInr ?? currentVendor?.wallet?.availableInr ?? financialMetrics.realizedVendorShare;
  const vendorPendingInr = vendorWallet?.pendingClearanceBalanceInr ?? currentVendor?.wallet?.pendingInr ?? financialMetrics.pendingVendorShare;
  const vendorLifetimeEarnings = vendorWallet?.totalLifetimeEarningsInr ?? currentVendor?.wallet?.lifetimeEarningsInr ?? (financialMetrics.realizedVendorShare + payoutMetrics.completedTotal);
  const vendorBankDetails = vendorWallet?.banking || currentVendor?.banking || null;

  // Processed Transaction Log Rows with accurate classification
  const detailedTransactions = useMemo(() => {
    return timeFilteredBookings.map((b) => {
      const raw = b as any;
      const grandTotal = b.grandTotalInr || raw.totalAmount || 0;
      const commRate = raw.commissionRatePercent || (b.type === 'package' ? 10 : b.type === 'experience' ? 15 : 12);
      const taxable = raw.taxableAmountInr || raw.pricing?.taxableAmount || Math.round(grandTotal / 1.18);
      const comm = raw.commissionAmountInr ?? Math.round(taxable * (commRate / 100));
      const vShare = grandTotal - comm;

      const isCancelled =
        b.bookingStatus === 'cancelled' ||
        (b.paymentStatus as string) === 'refunded' ||
        (b.paymentStatus as string) === 'partially_refunded';

      const isPaid = (b.paymentStatus as string) === 'paid' || (b.paymentStatus as string) === 'captured';
      const isStayDelivered = b.bookingStatus === 'checked_out' || b.bookingStatus === 'completed';

      let settlementState: 'realized' | 'escrow' | 'refund' = 'escrow';
      if (isCancelled) {
        settlementState = 'refund';
      } else if (isPaid && isStayDelivered) {
        settlementState = 'realized';
      } else {
        settlementState = 'escrow';
      }

      const listingTitle =
        b.type === 'stay'
          ? (b as StayBookingItem).propertyName
          : b.type === 'package'
          ? (b as any).packageTitle || 'Tour Package'
          : (b as any).experienceTitle || 'Outdoor Experience';

      return {
        id: b.id,
        reference: b.bookingReference,
        date: b.createdAt || raw.checkInDate || raw.startDate || raw.activityDate,
        guestName: b.guestName,
        guestPhone: b.guestPhone,
        listingTitle,
        type: b.type || 'stay',
        grandTotal,
        commRate,
        comm,
        vShare,
        paymentStatus: b.paymentStatus || 'unpaid',
        bookingStatus: b.bookingStatus || 'pending',
        settlementState,
      };
    });
  }, [timeFilteredBookings]);

  // Filtered transactions for the ledger table
  const filteredLedger = useMemo(() => {
    return detailedTransactions.filter((tx) => {
      const matchesTab =
        ledgerTab === 'all'
          ? true
          : ledgerTab === 'realized'
          ? tx.settlementState === 'realized'
          : ledgerTab === 'escrow'
          ? tx.settlementState === 'escrow'
          : tx.settlementState === 'refund';

      const matchesSearch =
        !ledgerSearch ||
        tx.reference?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        tx.guestName?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        tx.listingTitle?.toLowerCase().includes(ledgerSearch.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [detailedTransactions, ledgerTab, ledgerSearch]);

  // Filtered Payouts
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      const matchesFilter =
        payoutFilter === 'all'
          ? true
          : payoutFilter === 'requested'
          ? p.status === 'requested' || p.status === 'audited_by_admin'
          : p.status === payoutFilter;

      const matchesSearch =
        !payoutSearch ||
        p.payoutReference?.toLowerCase().includes(payoutSearch.toLowerCase()) ||
        p.vendorName?.toLowerCase().includes(payoutSearch.toLowerCase()) ||
        p.bankTransferDetails?.utrNumber?.toLowerCase().includes(payoutSearch.toLowerCase()) ||
        p.bankTransferDetails?.bankName?.toLowerCase().includes(payoutSearch.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [payouts, payoutFilter, payoutSearch]);

  // Handlers
  const handleOpenProcessModal = (payout: PayoutItem) => {
    setSelectedPayout(payout);
    setUtrNumber('');
    setTransferMethod('NEFT');
    setProcessNotes('');
    setProcessModalOpen(true);
  };

  const handleConfirmProcessPayout = async () => {
    if (!selectedPayout) return;
    if (!utrNumber.trim()) {
      setStatusMessage({ type: 'error', text: 'Transaction Number / UTR is required to mark as paid.' });
      return;
    }

    try {
      await dispatch(
        processAdminPayout({
          id: selectedPayout.id,
          utrNumber: utrNumber.trim(),
          transferMethod,
          notes: processNotes.trim() || undefined,
        })
      ).unwrap();

      setStatusMessage({
        type: 'success',
        text: `Payout ${selectedPayout.payoutReference} marked as completed with UTR: ${utrNumber.trim()}`,
      });
      setProcessModalOpen(false);
      refreshAll();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err || 'Failed to complete payout' });
    }
  };

  const handleRejectPayout = async (payout: PayoutItem) => {
    const reason = prompt(`Enter rejection reason for payout #${payout.payoutReference}:`, 'Bank account details mismatch');
    if (!reason || !reason.trim()) return;

    try {
      await dispatch(rejectAdminPayout({ id: payout.id, reason: reason.trim() })).unwrap();
      setStatusMessage({
        type: 'success',
        text: `Payout ${payout.payoutReference} rejected and balance returned to vendor wallet.`,
      });
      refreshAll();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err || 'Failed to reject payout' });
    }
  };

  const handleOpenRequestModal = () => {
    setRequestAmount(vendorAvailableInr);
    setRequestModalOpen(true);
  };

  const handleSubmitPayoutRequest = async () => {
    if (requestAmount <= 0) {
      setStatusMessage({ type: 'error', text: 'Withdrawal amount must be greater than zero.' });
      return;
    }
    if (requestAmount > vendorAvailableInr) {
      setStatusMessage({
        type: 'error',
        text: `Requested amount exceeds available balance (₹${vendorAvailableInr.toLocaleString('en-IN')}).`,
      });
      return;
    }

    try {
      await dispatch(requestVendorPayout({ amountInr: requestAmount })).unwrap();
      setStatusMessage({
        type: 'success',
        text: `Payout request of ₹${requestAmount.toLocaleString('en-IN')} submitted successfully to Admin!`,
      });
      setRequestModalOpen(false);
      refreshAll();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err || 'Failed to submit payout request' });
    }
  };

  const handleExportCsv = () => {
    if (filteredLedger.length === 0) {
      toast.warning('No transaction records to export for this view.', 'Export Notice');
      return;
    }

    const headers = [
      'Folio Reference',
      'Date & Time',
      'Guest Name',
      'Guest Phone',
      'Listing Title',
      'Booking Type',
      'Customer Paid (INR)',
      'Platform Commission (INR)',
      'Commission Rate',
      'Net Vendor Share (INR)',
      'Payment Status',
      'Settlement State',
    ];

    const rows = filteredLedger.map((tx) => [
      `"${tx.reference || ''}"`,
      `"${tx.date ? new Date(tx.date).toLocaleString('en-IN') : ''}"`,
      `"${tx.guestName || ''}"`,
      `"${tx.guestPhone || ''}"`,
      `"${tx.listingTitle || ''}"`,
      `"${tx.type || ''}"`,
      tx.grandTotal,
      tx.comm,
      `"${tx.commRate}%"`,
      tx.vShare,
      `"${tx.paymentStatus}"`,
      `"${tx.settlementState}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_ledger_${periodFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Financial ledger CSV exported', 'Export Complete');
  };

  if (bookingsLoading && bookings.length === 0 && payouts.length === 0) {
    return <DashboardSkeleton type="table" />;
  }

  if (isAdmin && adminSubSection === 'vendor_settlements') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setAdminSubSection('platform_ledger')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Platform Financial Ledger</span>
          </button>
          <button
            onClick={() => setAdminSubSection('vendor_settlements')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs transition"
          >
            <Building className="w-4 h-4" />
            <span>Vendor Settlements & Payouts</span>
            {payoutMetrics.pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {payoutMetrics.pendingCount}
              </span>
            )}
          </button>
        </div>
        <VendorSettlementsView />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setAdminSubSection('platform_ledger')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Platform Financial Ledger</span>
          </button>
          <button
            onClick={() => setAdminSubSection('vendor_settlements')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <Building className="w-4 h-4" />
            <span>Vendor Settlements & Payouts</span>
            {payoutMetrics.pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {payoutMetrics.pendingCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Top Banner & Control Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-poppins">
              {isAdmin ? 'Platform Financial Settlement Ledger' : 'Vendor Wallet & Settlement Folio'}
            </h2>
            <span
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                isAdmin
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {isAdmin ? 'Admin Console' : 'Vendor Partner'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Realized Confirmed Totals are strictly computed from completed stays. In-escrow funds are tracked separately. Zero auto-TDS cuts: Gross Paid = Commission + Net Vendor Share.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={refreshAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${payoutsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Export CSV</span>
          </button>

          {/* Vendor Request Payout Button */}
          {!isAdmin && (
            <button
              onClick={handleOpenRequestModal}
              disabled={vendorAvailableInr <= 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition ${
                vendorAvailableInr > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Request Payout</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-rose-600" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            Filter Period:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today (Day)' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriodFilter(tab.id as PeriodFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  periodFilter === tab.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {periodFilter === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      {/* Alert / Notification banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards: Confirmed Realized vs Separate Pending vs Refunds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            {/* 1. Realized Confirmed Volume */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Realized Gross Volume</span>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <BadgeCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                ₹{financialMetrics.realizedGross.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1 font-medium">
                {financialMetrics.realizedBookingsCount} completed stays (Paid & Delivered)
              </div>
            </div>

            {/* 2. Realized Platform Commission */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Realized Commission</span>
                <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-rose-600 mt-2">
                ₹{financialMetrics.realizedCommission.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Net retained on completed stays
              </div>
            </div>

            {/* 3. Pending In-Escrow Bookings */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Pending / In-Escrow</span>
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-2">
                ₹{financialMetrics.pendingGross.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-amber-600 font-semibold mt-1">
                {financialMetrics.pendingBookingsCount} bookings awaiting check-out
              </div>
            </div>

            {/* 4. Refunds & Cancelled */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Refunds & Cancelled</span>
                <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <RotateCcw className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-2">
                ₹{financialMetrics.refundsAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {financialMetrics.refundsCount} refund/cancellation transactions
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Vendor 1: Realized Net Earnings */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Realized Net Earnings</span>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <BadgeCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-2">
                ₹{financialMetrics.realizedVendorShare.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {financialMetrics.realizedBookingsCount} completed stays (Gross − Commission)
              </div>
            </div>

            {/* Vendor 2: Available Payout Balance */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Available for Payout</span>
                <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                ₹{vendorAvailableInr.toLocaleString('en-IN')}
              </div>
              <button
                onClick={handleOpenRequestModal}
                disabled={vendorAvailableInr <= 0}
                className="mt-2 w-full py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition text-center disabled:opacity-50"
              >
                Withdraw to Bank
              </button>
            </div>

            {/* Vendor 3: Escrow / Upcoming Check-ins */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">In Escrow (Upcoming)</span>
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-2">
                ₹{financialMetrics.pendingVendorShare.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Unlocks upon guest departure
              </div>
            </div>

            {/* Vendor 4: Disbursed to Bank */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Disbursed to Bank</span>
                <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600">
                  <Building className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-2">
                ₹{payoutMetrics.completedTotal.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
                {payoutMetrics.completedCount} transfers settled via bank UTR
              </div>
            </div>
          </>
        )}
      </div>

      {/* Full Detailed Financial Transaction Ledger */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-poppins flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-600" />
              <span>Full Financial Transaction Ledger & Audit Log</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact bookkeeping breakdown: Customer Paid = Platform Commission + Net Vendor Share. Auto TDS & GST deductions removed.
            </p>
          </div>

          {/* Ledger Tabs & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setLedgerTab('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  ledgerTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All ({detailedTransactions.length})
              </button>
              <button
                onClick={() => setLedgerTab('realized')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  ledgerTab === 'realized'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Realized ({financialMetrics.realizedBookingsCount})
              </button>
              <button
                onClick={() => setLedgerTab('escrow')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  ledgerTab === 'escrow'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                In Escrow ({financialMetrics.pendingBookingsCount})
              </button>
              <button
                onClick={() => setLedgerTab('refunds')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  ledgerTab === 'refunds'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Refunds ({financialMetrics.refundsCount})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Folio, Guest, Stay..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2.5 font-medium">Folio & Timestamp</th>
                <th className="py-2.5 font-medium">Guest & Contact</th>
                <th className="py-2.5 font-medium">Listing & Type</th>
                <th className="py-2.5 font-medium">Customer Paid (Gross)</th>
                <th className="py-2.5 font-medium">Platform Commission</th>
                <th className="py-2.5 font-medium">Net Vendor Share</th>
                <th className="py-2.5 font-medium">Payment Status</th>
                <th className="py-2.5 font-medium text-right">Settlement State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions found in this period or category.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((tx) => {
                  const isRealized = tx.settlementState === 'realized';
                  const isRefund = tx.settlementState === 'refund';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {/* Folio & Date */}
                      <td className="py-3">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          #{tx.reference}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {tx.date ? new Date(tx.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </div>
                      </td>

                      {/* Guest */}
                      <td className="py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {tx.guestName || 'Guest'}
                        </div>
                        {tx.guestPhone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {tx.guestPhone}
                          </div>
                        )}
                      </td>

                      {/* Listing & Type */}
                      <td className="py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                          {tx.listingTitle}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {tx.type}
                        </span>
                      </td>

                      {/* Customer Paid */}
                      <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                        ₹{tx.grandTotal.toLocaleString('en-IN')}
                      </td>

                      {/* Commission */}
                      <td className="py-3 text-rose-600 font-medium">
                        -₹{tx.comm.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] text-slate-400">({tx.commRate}%)</span>
                      </td>

                      {/* Net Vendor Share */}
                      <td className="py-3 font-bold text-emerald-600">
                        ₹{tx.vShare.toLocaleString('en-IN')}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (tx.paymentStatus as string) === 'paid' || (tx.paymentStatus as string) === 'captured'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : (tx.paymentStatus as string) === 'refunded'
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {(tx.paymentStatus as string) === 'paid' || (tx.paymentStatus as string) === 'captured'
                            ? 'Paid Online'
                            : (tx.paymentStatus as string) === 'refunded'
                            ? 'Refunded'
                            : 'Pay at Property'}
                        </span>
                      </td>

                      {/* Settlement State */}
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isRealized
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isRefund
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {isRealized ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Realized / Completed</span>
                            </>
                          ) : isRefund ? (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>Refunded</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>In Escrow</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Requests & Bank Disbursements Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-poppins flex items-center gap-2">
              <Building className="w-4 h-4 text-rose-600" />
              <span>Vendor Bank Payout Requests & Transfers</span>
              {payoutMetrics.pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {payoutMetrics.pendingCount} Pending Transfer
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {isAdmin
                ? 'Review withdrawal requests, disburse via NEFT/IMPS/RTGS, and record bank transaction reference numbers.'
                : 'Track bank transfers and transaction UTR numbers for all your requested payouts.'}
            </p>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPayoutFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  payoutFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All ({payouts.length})
              </button>
              <button
                onClick={() => setPayoutFilter('requested')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  payoutFilter === 'requested'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Pending ({payoutMetrics.pendingCount})
              </button>
              <button
                onClick={() => setPayoutFilter('completed')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  payoutFilter === 'completed'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Completed ({payoutMetrics.completedCount})
              </button>
              <button
                onClick={() => setPayoutFilter('failed')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  payoutFilter === 'failed'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Rejected
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search UTR, Ref, Vendor..."
                value={payoutSearch}
                onChange={(e) => setPayoutSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2.5 font-medium">Payout Ref & Date</th>
                {isAdmin && <th className="py-2.5 font-medium">Vendor Partner</th>}
                <th className="py-2.5 font-medium">Destination Bank</th>
                <th className="py-2.5 font-medium">Gross & Commission</th>
                <th className="py-2.5 font-medium">Net Disbursed (INR)</th>
                <th className="py-2.5 font-medium">Status</th>
                <th className="py-2.5 font-medium">Transaction / UTR No.</th>
                <th className="py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-slate-400">
                    No payout records found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((p) => {
                  const isPending = p.status === 'requested' || p.status === 'audited_by_admin';
                  const isCompleted = p.status === 'completed';
                  const isFailed = p.status === 'failed';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {/* Ref & Date */}
                      <td className="py-3">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          #{p.payoutReference}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : ''}
                        </div>
                      </td>

                      {/* Vendor (Admin view) */}
                      {isAdmin && (
                        <td className="py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {p.vendorName || 'Vendor Partner'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ID: {p.vendorId ? `${p.vendorId.slice(0, 8)}...` : ''}
                          </div>
                        </td>
                      )}

                      {/* Destination Bank */}
                      <td className="py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {p.bankTransferDetails?.bankName || 'Bank Account'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.bankTransferDetails?.accountNumber || '•••• XXXX'} • {p.bankTransferDetails?.ifscCode || ''}
                        </div>
                      </td>

                      {/* Gross & Commission */}
                      <td className="py-3">
                        <div className="text-slate-700 dark:text-slate-300">
                          ₹{(p.grossBookingsAmountInr || p.netPayableAmountInr).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Comm: -₹{(p.platformCommissionDeductedInr || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Net Amount */}
                      <td className="py-3 font-bold text-emerald-600 text-sm">
                        ₹{p.netPayableAmountInr.toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Paid to Bank</span>
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Pending Transfer</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Rejected</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Transaction / UTR No. */}
                      <td className="py-3">
                        {p.bankTransferDetails?.utrNumber ? (
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {p.bankTransferDetails.utrNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              via {p.bankTransferDetails.transferMethod || 'NEFT'}
                              {p.completedAt ? ` • ${new Date(p.completedAt).toLocaleDateString('en-IN')}` : ''}
                            </span>
                          </div>
                        ) : isFailed ? (
                          <span className="text-[10px] text-rose-500 font-medium">
                            {p.failureReason || 'Failed / Returned'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending disbursement</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right">
                        {isAdmin && isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenProcessModal(p)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>Process & Pay</span>
                            </button>
                            <button
                              onClick={() => handleRejectPayout(p)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : isCompleted ? (
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Settled</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Process Vendor Bank Transfer (Admin) */}
      {processModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-poppins">
                  Process Vendor Bank Transfer
                </h4>
                <p className="text-xs text-slate-400">
                  Payout #{selectedPayout.payoutReference} • {selectedPayout.vendorName || 'Vendor Partner'}
                </p>
              </div>
              <button
                onClick={() => setProcessModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Details & Amount */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Net Amount to Transfer:</span>
                <span className="text-xl font-bold text-emerald-600">
                  ₹{selectedPayout.netPayableAmountInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                <div>
                  <span className="text-slate-400">Account Holder:</span>{' '}
                  <span className="font-semibold">{selectedPayout.bankTransferDetails?.accountHolderName || 'Vendor'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Bank & IFSC:</span>{' '}
                  <span className="font-semibold">{selectedPayout.bankTransferDetails?.bankName}</span> •{' '}
                  <span className="font-mono">{selectedPayout.bankTransferDetails?.ifscCode}</span>
                </div>
                <div>
                  <span className="text-slate-400">Account Number:</span>{' '}
                  <span className="font-mono font-semibold">{selectedPayout.bankTransferDetails?.accountNumber}</span>
                </div>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Transaction / UTR Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC00192837482 or UPI Ref"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transfer Method
                </label>
                <select
                  value={transferMethod}
                  onChange={(e) => setTransferMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  <option value="NEFT">NEFT (National Electronic Funds Transfer)</option>
                  <option value="IMPS">IMPS (Immediate Payment Service)</option>
                  <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                  <option value="UPI">UPI / Bank Direct</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Settlement Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Disbursed via Corporate Portal"
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProcessModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmProcessPayout}
                disabled={actionLoading || !utrNumber.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Transfer & Mark Paid</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Payout (Vendor) */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-poppins">
                  Request Payout to Bank Account
                </h4>
                <p className="text-xs text-slate-400">
                  Funds will be reviewed and transferred by platform admin to your registered bank account.
                </p>
              </div>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Available Balance Box */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Available for Withdrawal</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-200 mt-0.5">
                  ₹{vendorAvailableInr.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right text-[11px] text-emerald-700 dark:text-emerald-400">
                <div>Min payout: ₹500</div>
                <div>Zero Auto-Deductions</div>
              </div>
            </div>

            {/* Bank Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Destination Account: {vendorBankDetails?.bankName || 'Verified Bank'}
              </div>
              <div className="text-slate-400 font-mono">
                Account: •••• {vendorBankDetails?.accountNumberLast4 || 'XXXX'} • IFSC: {vendorBankDetails?.ifscCode || 'IFSC'}
              </div>
            </div>

            {/* Amount input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Withdrawal Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="500"
                  max={vendorAvailableInr}
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-base font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Quick Select Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRequestAmount(vendorAvailableInr)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  Full Balance (₹{vendorAvailableInr.toLocaleString('en-IN')})
                </button>
                {vendorAvailableInr >= 10000 && (
                  <button
                    type="button"
                    onClick={() => setRequestAmount(10000)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    ₹10,000
                  </button>
                )}
                {vendorAvailableInr >= 5000 && (
                  <button
                    type="button"
                    onClick={() => setRequestAmount(5000)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    ₹5,000
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitPayoutRequest}
                disabled={actionLoading || requestAmount <= 0 || requestAmount > vendorAvailableInr}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Payout Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
