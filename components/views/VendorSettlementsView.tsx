'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Receipt,
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
  Eye,
  CreditCard,
  Building,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchVendorSettlementLedger,
  processAdminPayout,
  rejectAdminPayout,
  processDirectSettlement,
  VendorSettlementItem,
  PayoutItem,
} from '../../store/slices/payoutsSlice';
import DashboardSkeleton from '../common/DashboardSkeleton';

export default function VendorSettlementsView() {
  const dispatch = useAppDispatch();
  const { vendorLedger, ledgerLoading, actionLoading, items: payouts } = useAppSelector(
    (state) => state.payouts
  );

  // Active view tab: 'ledger' (vendor-by-vendor) or 'requests' (payout requests queue)
  const [activeTab, setActiveTab] = useState<'ledger' | 'requests'>('ledger');

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'requested' | 'completed' | 'failed'>('all');

  // Modal 1: Process Payout Request
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutItem | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [transferMethod, setTransferMethod] = useState<'NEFT' | 'IMPS' | 'RTGS' | 'UPI'>('NEFT');
  const [processNotes, setProcessNotes] = useState('');

  // Modal 2: Direct Vendor Settlement
  const [directModalOpen, setDirectModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorSettlementItem | null>(null);
  const [directAmount, setDirectAmount] = useState<number>(0);
  const [directUtr, setDirectUtr] = useState('');
  const [directMethod, setDirectMethod] = useState<'NEFT' | 'IMPS' | 'RTGS' | 'UPI'>('NEFT');
  const [directNotes, setDirectNotes] = useState('');

  // Modal 3: View Vendor Payout History
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyVendor, setHistoryVendor] = useState<VendorSettlementItem | null>(null);

  // Notifications
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    dispatch(fetchVendorSettlementLedger());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchVendorSettlementLedger());
  };

  const summary = vendorLedger?.summary || {
    totalVendorsCount: 0,
    totalGrossVolumeInr: 0,
    totalPlatformCommissionInr: 0,
    totalNetVendorShareInr: 0,
    totalSettledAmountInr: 0,
    totalPendingSettlementInr: 0,
    pendingRequestsCount: 0,
    pendingRequestsAmountInr: 0,
  };

  const allVendors = vendorLedger?.vendors || [];
  const allPayoutRequests = vendorLedger?.payoutRequests || payouts || [];

  // Filtered Vendors for the Ledger Table
  const filteredVendors = useMemo(() => {
    return allVendors.filter((v) => {
      const matchesCategory =
        categoryFilter === 'all'
          ? true
          : v.category?.toLowerCase() === categoryFilter.toLowerCase();

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        v.businessName?.toLowerCase().includes(q) ||
        v.displayName?.toLowerCase().includes(q) ||
        v.vendorCode?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.phone?.includes(q) ||
        v.banking?.bankName?.toLowerCase().includes(q) ||
        v.banking?.accountNumberMasked?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [allVendors, categoryFilter, searchQuery]);

  // Filtered Payout Requests
  const filteredPayoutRequests = useMemo(() => {
    return allPayoutRequests.filter((p) => {
      const matchesStatus =
        requestStatusFilter === 'all'
          ? true
          : requestStatusFilter === 'requested'
          ? p.status === 'requested' || p.status === 'audited_by_admin' || p.status === 'released_by_superadmin'
          : p.status === requestStatusFilter;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        p.payoutReference?.toLowerCase().includes(q) ||
        p.vendorName?.toLowerCase().includes(q) ||
        p.bankTransferDetails?.bankName?.toLowerCase().includes(q) ||
        p.bankTransferDetails?.utrNumber?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [allPayoutRequests, requestStatusFilter, searchQuery]);

  // Handler: Open modal to settle a pending payout request
  const handleOpenProcessModal = (payout: PayoutItem) => {
    setSelectedPayout(payout);
    setUtrNumber('');
    setTransferMethod('NEFT');
    setProcessNotes('');
    setProcessModalOpen(true);
  };

  // Handler: Confirm settling a payout request
  const handleConfirmProcessPayout = async () => {
    if (!selectedPayout) return;
    if (!utrNumber.trim()) {
      setStatusMessage({ type: 'error', text: 'Transaction Reference / UTR Number is required.' });
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
        text: `Payout #${selectedPayout.payoutReference} settled with UTR: ${utrNumber.trim()}`,
      });
      setProcessModalOpen(false);
      dispatch(fetchVendorSettlementLedger());
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err || 'Failed to settle payout request.' });
    }
  };

  // Handler: Reject payout request
  const handleRejectPayout = async (payout: PayoutItem) => {
    const reason = prompt(
      `Enter reason for rejecting payout #${payout.payoutReference}:`,
      'Bank IFSC or Account details mismatch'
    );
    if (!reason || !reason.trim()) return;

    try {
      await dispatch(rejectAdminPayout({ id: payout.id, reason: reason.trim() })).unwrap();
      setStatusMessage({
        type: 'success',
        text: `Payout #${payout.payoutReference} rejected and balance restored to vendor.`,
      });
      dispatch(fetchVendorSettlementLedger());
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err || 'Failed to reject payout.' });
    }
  };

  // Handler: Open modal for Direct Settlement to a vendor
  const handleOpenDirectModal = (vendor: VendorSettlementItem) => {
    setSelectedVendor(vendor);
    setDirectAmount(vendor.pendingSettlementInr > 0 ? vendor.pendingSettlementInr : vendor.walletAvailableInr);
    setDirectUtr('');
    setDirectMethod('NEFT');
    setDirectNotes('');
    setDirectModalOpen(true);
  };

  // Handler: Submit Direct Settlement to a vendor
  const handleSubmitDirectSettlement = async () => {
    if (!selectedVendor) return;
    if (directAmount <= 0) {
      setStatusMessage({ type: 'error', text: 'Settlement amount must be greater than zero.' });
      return;
    }
    if (!directUtr.trim()) {
      setStatusMessage({ type: 'error', text: 'Bank Transaction / UTR Number is required.' });
      return;
    }

    try {
      await dispatch(
        processDirectSettlement({
          vendorId: selectedVendor.vendorId,
          amountInr: directAmount,
          transferMethod: directMethod,
          utrNumber: directUtr.trim(),
          notes: directNotes.trim() || undefined,
        })
      ).unwrap();

      setStatusMessage({
        type: 'success',
        text: `Direct settlement of ₹${directAmount.toLocaleString('en-IN')} disbursed to ${
          selectedVendor.businessName
        } with UTR: ${directUtr.trim()}`,
      });
      setDirectModalOpen(false);
      dispatch(fetchVendorSettlementLedger());
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err || 'Failed to process direct settlement.' });
    }
  };

  // Handler: Open History Modal
  const handleOpenHistoryModal = (vendor: VendorSettlementItem) => {
    setHistoryVendor(vendor);
    setHistoryModalOpen(true);
  };

  // Handler: Export CSV
  const handleExportCsv = () => {
    if (filteredVendors.length === 0) {
      alert('No vendor settlement records to export.');
      return;
    }

    const headers = [
      'Vendor Code',
      'Business Name',
      'Contact Person',
      'Email',
      'Phone',
      'Category',
      'Bank Name',
      'Account Number',
      'IFSC Code',
      'UPI ID',
      'Bank Verified',
      'Total Paid Bookings',
      'Gross Booking Revenue (INR)',
      'Platform Commission Rate (%)',
      'Platform Commission Retained (INR)',
      'Net Vendor Earnings (INR)',
      'Total Settled by Admin (INR)',
      'Pending Amount to Settle (INR)',
      'Wallet Available (INR)',
      'Wallet In-Escrow (INR)',
    ];

    const rows = filteredVendors.map((v) => [
      `"${v.vendorCode}"`,
      `"${v.businessName.replace(/"/g, '""')}"`,
      `"${v.displayName.replace(/"/g, '""')}"`,
      `"${v.email}"`,
      `"${v.phone}"`,
      `"${v.category}"`,
      `"${v.banking?.bankName || 'Not Set'}"`,
      `"${v.banking?.accountNumberMasked || 'Not Set'}"`,
      `"${v.banking?.ifscCode || 'Not Set'}"`,
      `"${v.banking?.upiId || '—'}"`,
      v.banking?.isAccountVerified ? 'Yes' : 'No',
      v.totalBookingsCount,
      v.grossRevenueInr,
      v.commissionRatePercent,
      v.platformCommissionInr,
      v.netRevenueInr,
      v.amountSettledInr,
      v.pendingSettlementInr,
      v.walletAvailableInr,
      v.walletPendingInr,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendor_settlement_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (ledgerLoading && allVendors.length === 0) {
    return <DashboardSkeleton type="table" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-poppins flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-600" />
              <span>Vendor Earnings, Settlements & Payouts</span>
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              Admin Disbursal Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Customer booking payments are collected directly to the Admin Razorpay account. Track each vendor partner&apos;s
            gross revenue, platform commission retained, net vendor earnings, settled bank transfers with UTR numbers, and process
            withdrawal requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ledgerLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Export Report</span>
          </button>
        </div>
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

      {/* Platform Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Gross Volume */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Gross Bookings</span>
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            ₹{summary.totalGrossVolumeInr.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Paid to Admin Razorpay across {summary.totalVendorsCount} vendor partners
          </div>
        </div>

        {/* 2. Platform Commission Retained */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Platform Commission</span>
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            ₹{summary.totalPlatformCommissionInr.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Retained by platform (10% - 15% booking commission)
          </div>
        </div>

        {/* 3. Settled to Bank */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Settled to Bank (Disbursed)</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <BadgeCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            ₹{summary.totalSettledAmountInr.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            Disbursed via NEFT/IMPS with confirmed UTR reference
          </div>
        </div>

        {/* 4. Pending Settlements & Requests */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Pending to be Settled</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            ₹{summary.totalPendingSettlementInr.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-semibold flex items-center justify-between">
            <span>{summary.pendingRequestsCount} withdrawal requests</span>
            <span>(₹{summary.pendingRequestsAmountInr.toLocaleString('en-IN')})</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Left Sub-Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'ledger'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Vendor Partner Ledgers ({allVendors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition relative ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Withdrawal Requests ({allPayoutRequests.length})</span>
            {summary.pendingRequestsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {summary.pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'ledger' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'stay', label: 'Hotels & Villas' },
                { id: 'package', label: 'Packages' },
                { id: 'experience', label: 'Experiences' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                    categoryFilter === c.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
              {[
                { id: 'all', label: 'All' },
                { id: 'requested', label: 'Pending Transfer' },
                { id: 'completed', label: 'Settled' },
                { id: 'failed', label: 'Rejected' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setRequestStatusFilter(s.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                    requestStatusFilter === s.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'ledger' ? 'Search vendor, phone, bank...' : 'Search UTR, ref, vendor...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500 w-56"
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: VENDOR EARNINGS & SETTLEMENT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-poppins flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-600" />
                <span>Vendor Partner Financial Balances & Bank Ledgers</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Full breakdown per vendor: Gross Revenue = Platform Commission + Net Vendor Earnings. Pending Amount = Net
                Earnings − Settled to Bank.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 font-medium">Vendor Partner</th>
                  <th className="py-2.5 font-medium">Verified Bank Snapshot</th>
                  <th className="py-2.5 font-medium">Gross Bookings</th>
                  <th className="py-2.5 font-medium">Platform Commission</th>
                  <th className="py-2.5 font-medium">Net Vendor Share</th>
                  <th className="py-2.5 font-medium">Settled to Bank</th>
                  <th className="py-2.5 font-medium">Pending to Settle</th>
                  <th className="py-2.5 font-medium text-right">Settlement Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No vendor partners found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => {
                    const hasPendingRequests = v.pendingPayoutRequestsCount > 0;

                    return (
                      <tr key={v.vendorId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {/* Vendor Partner */}
                        <td className="py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {v.businessName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span>{v.displayName}</span>
                            <span>•</span>
                            <span className="font-mono">{v.vendorCode}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {v.phone} • {v.email}
                          </div>
                        </td>

                        {/* Verified Bank Snapshot */}
                        <td className="py-3">
                          {v.banking ? (
                            <div>
                              <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                <span>{v.banking.bankName}</span>
                                {v.banking.isAccountVerified && (
                                  <span title="Bank account verified">
                                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                A/C: {v.banking.accountNumberMasked}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                IFSC: {v.banking.ifscCode}
                                {v.banking.upiId && ` • UPI: ${v.banking.upiId}`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600 italic">No bank configured</span>
                          )}
                        </td>

                        {/* Gross Revenue */}
                        <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                          ₹{v.grossRevenueInr.toLocaleString('en-IN')}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {v.totalBookingsCount} paid bookings
                          </div>
                        </td>

                        {/* Commission Retained */}
                        <td className="py-3 text-rose-600 font-medium">
                          -₹{v.platformCommissionInr.toLocaleString('en-IN')}
                          <div className="text-[10px] text-slate-400">
                            Rate: {v.commissionRatePercent}%
                          </div>
                        </td>

                        {/* Net Vendor Share */}
                        <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                          ₹{v.netRevenueInr.toLocaleString('en-IN')}
                          <div className="text-[10px] text-slate-400 font-normal">
                            (Gross − Commission)
                          </div>
                        </td>

                        {/* Settled by Admin */}
                        <td className="py-3 font-bold text-emerald-600">
                          ₹{v.amountSettledInr.toLocaleString('en-IN')}
                          <div className="text-[10px] text-emerald-600/80 font-normal">
                            {v.recentPayouts.filter((p) => p.status === 'completed').length} completed UTRs
                          </div>
                        </td>

                        {/* Pending to Settle */}
                        <td className="py-3">
                          <div
                            className={`font-bold ${
                              v.pendingSettlementInr > 0 ? 'text-amber-600' : 'text-slate-400'
                            }`}
                          >
                            ₹{v.pendingSettlementInr.toLocaleString('en-IN')}
                          </div>
                          {hasPendingRequests && (
                            <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              {v.pendingPayoutRequestsCount} request awaiting transfer
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Settle to Bank Button */}
                            <button
                              onClick={() => handleOpenDirectModal(v)}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Disburse and record bank transfer"
                            >
                              <Send className="w-3 h-3" />
                              <span>Settle to Bank</span>
                            </button>

                            {/* View History Button */}
                            <button
                              onClick={() => handleOpenHistoryModal(v)}
                              className="px-2 py-1.5 rounded-xl text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="View settlement history and UTRs"
                            >
                              <FileText className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: VENDOR WITHDRAWAL REQUESTS QUEUE */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-poppins flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                <span>Vendor Payout Requests Queue (Withdrawals to Bank)</span>
                {summary.pendingRequestsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {summary.pendingRequestsCount} Awaiting Transfer
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review withdrawal requests initiated by vendors, disburse via your bank portal, and record the Transaction
                UTR Number to mark as settled.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 font-medium">Payout Ref & Date</th>
                  <th className="py-2.5 font-medium">Vendor Partner</th>
                  <th className="py-2.5 font-medium">Destination Bank Details</th>
                  <th className="py-2.5 font-medium">Net Amount (INR)</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 font-medium">Bank Transaction / UTR No.</th>
                  <th className="py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayoutRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No payout requests found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayoutRequests.map((p) => {
                    const isPending =
                      p.status === 'requested' ||
                      p.status === 'audited_by_admin' ||
                      p.status === 'released_by_superadmin';
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

                        {/* Vendor */}
                        <td className="py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {p.vendorName || 'Vendor Partner'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {(p as any).vendorPhone || (p as any).vendorEmail || p.vendorId?.slice(0, 8)}
                          </div>
                        </td>

                        {/* Destination Bank */}
                        <td className="py-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {p.bankTransferDetails?.bankName || 'Bank Account'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {p.bankTransferDetails?.accountNumber || '•••• XXXX'} • {p.bankTransferDetails?.ifscCode || ''}
                          </div>
                          {p.bankTransferDetails?.accountHolderName && (
                            <div className="text-[10px] text-slate-400">
                              Holder: {p.bankTransferDetails.accountHolderName}
                            </div>
                          )}
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
                            <span className="text-slate-400 italic text-[11px]">Awaiting bank transfer</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenProcessModal(p)}
                                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Disburse & Settle</span>
                              </button>
                              <button
                                onClick={() => handleRejectPayout(p)}
                                className="px-2 py-1 rounded-xl text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
      )}

      {/* MODAL 1: Settle Payout Request (Admin) */}
      {processModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-poppins">
                  Disburse & Complete Payout Request
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
                <span className="text-xs text-slate-500">Amount to Transfer:</span>
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
                  <span className="text-slate-400">Account No:</span>{' '}
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedPayout.bankTransferDetails?.accountNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* UTR Input Form */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Transaction / UTR Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTIB2026110500123984 or HDFC0001928374"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Copy the transfer reference / transition number from your corporate banking portal.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transfer Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['NEFT', 'IMPS', 'RTGS', 'UPI'] as const).map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setTransferMethod(method)}
                      className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
                        transferMethod === method
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-300 dark:border-rose-700'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared via Corporate Banking NetBanking"
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setProcessModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmProcessPayout}
                disabled={actionLoading || !utrNumber.trim()}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Processing...' : 'Confirm Bank Transfer & Settle'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Direct Vendor Settlement (Admin Disburse to Vendor) */}
      {directModalOpen && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-poppins">
                  Direct Bank Settlement to Vendor
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedVendor.businessName} • {selectedVendor.vendorCode}
                </p>
              </div>
              <button
                onClick={() => setDirectModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Bank Snapshot */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Unsettled Net Balance:</span>
                <span className="font-bold text-amber-600">
                  ₹{selectedVendor.pendingSettlementInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                <div>
                  <span className="text-slate-400">Bank Name:</span>{' '}
                  <span className="font-semibold">{selectedVendor.banking?.bankName || 'Not configured'}</span>
                </div>
                <div>
                  <span className="text-slate-400">A/C Number:</span>{' '}
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedVendor.banking?.accountNumberMasked || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">IFSC & UPI:</span>{' '}
                  <span className="font-mono">{selectedVendor.banking?.ifscCode || '—'}</span>
                  {selectedVendor.banking?.upiId && ` • ${selectedVendor.banking.upiId}`}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Settlement Amount (INR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={directAmount || ''}
                  onChange={(e) => setDirectAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Transaction / UTR Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTIB20261105009823 or CMS202611050012"
                  value={directUtr}
                  onChange={(e) => setDirectUtr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transfer Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['NEFT', 'IMPS', 'RTGS', 'UPI'] as const).map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setDirectMethod(method)}
                      className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
                        directMethod === method
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-300 dark:border-rose-700'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly booking revenue payout"
                  value={directNotes}
                  onChange={(e) => setDirectNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDirectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDirectSettlement}
                disabled={actionLoading || directAmount <= 0 || !directUtr.trim()}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Recording...' : 'Record Bank Settlement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: View Vendor Settlement History */}
      {historyModalOpen && historyVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-poppins">
                  Settlement History & Recorded UTRs
                </h4>
                <p className="text-xs text-slate-400">
                  {historyVendor.businessName} • Code: {historyVendor.vendorCode}
                </p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Net Earnings:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ₹{historyVendor.netRevenueInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Settled:</span>
                <span className="font-bold text-emerald-600">
                  ₹{historyVendor.amountSettledInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Pending Balance:</span>
                <span className="font-bold text-amber-600">
                  ₹{historyVendor.pendingSettlementInr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Recent Payouts Table */}
            <div className="max-h-72 overflow-y-auto">
              {historyVendor.recentPayouts.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No previous settlement transfers recorded for this vendor.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2 font-medium">Payout Ref</th>
                      <th className="py-2 font-medium">Disbursed Amount</th>
                      <th className="py-2 font-medium">Method</th>
                      <th className="py-2 font-medium">Transaction / UTR Number</th>
                      <th className="py-2 font-medium">Status</th>
                      <th className="py-2 font-medium text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {historyVendor.recentPayouts.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                          #{p.payoutReference}
                        </td>
                        <td className="py-2.5 font-bold text-emerald-600">
                          ₹{p.netPayableAmountInr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400">
                          {p.transferMethod || 'NEFT'}
                        </td>
                        <td className="py-2.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {p.utrNumber || '—'}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-slate-400 text-[11px]">
                          {p.completedAt
                            ? new Date(p.completedAt).toLocaleDateString('en-IN')
                            : new Date(p.createdAt).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
