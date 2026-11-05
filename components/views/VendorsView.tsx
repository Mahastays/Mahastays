import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  FileCheck,
  Phone,
  Mail,
  Wallet,
  Plus,
  X,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  UserCheck,
  ShieldAlert,
  Search,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import DashboardSkeleton from '../common/DashboardSkeleton';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchVendors } from '../../store/slices/vendorsSlice';

export default function VendorsView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { vendors, verifyVendorKYC, verifyVendorBank, createVendor } = useData();
  const { loading } = useAppSelector((state) => state.vendors);

  // Fetch only when Vendors view mounts
  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'property_host' | 'activity_operator' | 'integrated_resort'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

  // Create Vendor Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<'property_host' | 'activity_operator' | 'integrated_resort'>('property_host');
  const [businessType, setBusinessType] = useState<'individual' | 'proprietorship' | 'private_limited' | 'partnership'>('proprietorship');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Notification State
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    pass: string;
    businessName: string;
    vendorCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please provide a valid vendor email address');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!businessName.trim()) {
      setError('Please specify the vendor business name');
      return;
    }

    setSubmitting(true);
    try {
      const newVendor = await createVendor({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        businessName: businessName.trim(),
        displayName: displayName.trim() || businessName.trim(),
        phone: phone.trim() || '',
        category,
        businessType,
      });

      setCreatedCredentials({
        email: email.trim().toLowerCase(),
        pass: password.trim(),
        businessName: businessName.trim(),
        vendorCode: newVendor.vendorCode || 'VND-' + Math.floor(1000 + Math.random() * 9000),
      });

      // Reset form & close modal
      setEmail('');
      setPassword('');
      setBusinessName('');
      setDisplayName('');
      setPhone('');
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create vendor account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `MahaStays Partner Login Credentials:\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.pass}\nVendor Code: ${createdCredentials.vendorCode}\nPortal: http://localhost:3001/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Filtered vendors list
  const filteredVendors = vendors.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      v.businessName.toLowerCase().includes(q) ||
      v.displayName?.toLowerCase().includes(q) ||
      v.vendorCode?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.phone?.includes(q);

    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter;

    const isApproved = v.compliance?.verificationStatus === 'approved';
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && isApproved) ||
      (statusFilter === 'pending' && !isApproved);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading && vendors.length === 0) {
    return <DashboardSkeleton type="table" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card with Actions */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Registered Vendor Partners
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
              {vendors.length} Partners
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any vendor partner to view comprehensive KYC documents, banking details, and listings in a dedicated view.
          </p>
        </div>

        <button
          id="open-create-vendor-modal-btn"
          onClick={() => {
            setError(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Vendor Partner</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vendor by business name, code (VND-...), email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-rose-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Chips */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
            {(['all', 'property_host', 'activity_operator'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat === 'property_host' ? 'Stays' : 'Activities'}
              </button>
            ))}
          </div>

          {/* Status Filter Chips */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
            {(['all', 'approved', 'pending'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {st === 'all' ? 'All' : st === 'approved' ? 'Approved' : 'Pending KYC'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Notification Banner for Newly Created Vendor */}
      {createdCredentials && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold">
                  Vendor Partner Created Successfully: {createdCredentials.businessName}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  This vendor is pre-approved and can immediately sign into the portal using the credentials below:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200/80 dark:border-emerald-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Login ID / Email:</span>
                    <strong className="text-slate-800 dark:text-slate-100">{createdCredentials.email}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200/80 dark:border-emerald-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Password:</span>
                    <strong className="text-slate-800 dark:text-slate-100">{createdCredentials.pass}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200/80 dark:border-emerald-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Vendor Code:</span>
                    <strong className="text-slate-800 dark:text-slate-100">{createdCredentials.vendorCode}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyCredentials}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Clean Vendor List Cards */}
      {filteredVendors.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No vendors found matching your filter</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or reset the category/status filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVendors.map((v) => {
            const isApproved = v.compliance?.verificationStatus === 'approved';

            return (
              <div
                key={v.id}
                onClick={() => router.push(`/dashboard/vendors/${v.id}`)}
                className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 hover:shadow-md transition-all cursor-pointer space-y-4"
              >
                {/* Header with avatar & category */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {v.avatarUrl && !v.avatarUrl.includes('photo-1507003211169-0a1dd7228f2d') && !v.avatarUrl.includes('pravatar.cc') ? (
                      <img
                        src={v.avatarUrl}
                        alt={v.displayName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-base flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-900/40">
                        {(v.businessName || v.displayName || 'V')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 group-hover:text-rose-600 transition">
                        <span>{v.businessName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {v.vendorCode}
                        </span>
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {v.displayName} • {v.displayRole || 'Host & Partner'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold capitalize shrink-0 ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60'
                    }`}
                  >
                    {v.compliance?.verificationStatus || 'Pending'}
                  </span>
                </div>

                {/* Contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{v.phone || 'Phone not set'}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{v.email}</span>
                  </div>
                </div>

                {/* Card Footer with Quick Badges and View Details CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium capitalize">
                      {v.category === 'activity_operator' ? 'Activity Operator' : 'Property Host'}
                    </span>
                    <span>•</span>
                    <span>Bank: {v.banking?.isAccountVerified ? 'Verified' : 'Pending'}</span>
                  </div>

                  <Link
                    href={`/dashboard/vendors/${v.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 transition-all shadow-2xs cursor-pointer"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE VENDOR MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Onboard New Vendor Partner
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create credentials so the partner can log into the vendor portal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Row 1: Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Vendor Email (Login ID) *
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      id="create-vendor-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="partner@domain.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-rose-600 hover:underline font-medium"
                    >
                      Generate
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      id="create-vendor-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Business Name & Display Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Business / Resort Name *
                  </label>
                  <input
                    id="create-vendor-business"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Sahyadri Hills Retreat"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Host / Contact Person Name
                  </label>
                  <input
                    id="create-vendor-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Row 3: Phone & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98200 12345"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Partner Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="property_host">🏨 Property Host (Hotels & Villas)</option>
                    <option value="activity_operator">✨ Activity Operator (Experiences & Treks)</option>
                    <option value="integrated_resort">🎁 Integrated Resort & Packages</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Business Type */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Business Entity Type
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="individual">Individual Host / Homestay</option>
                  <option value="proprietorship">Sole Proprietorship</option>
                  <option value="private_limited">Private Limited (Pvt Ltd)</option>
                  <option value="partnership">Partnership Firm / LLP</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  id="create-vendor-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'Creating Partner...' : 'Confirm & Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
