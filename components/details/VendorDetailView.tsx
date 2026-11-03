'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
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
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  BedDouble,
  Compass,
  Eye,
  EyeOff,
  AlertCircle,
  Percent,
  CheckCheck,
  RefreshCw,
  Share2,
  Edit3,
  Lock,
  KeyRound,
  Save,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { VendorItem } from '../../types';

interface VendorDetailViewProps {
  id: string;
}

export default function VendorDetailView({ id }: VendorDetailViewProps) {
  const router = useRouter();
  const { user, activeViewMode } = useAuth();
  const {
    vendors,
    properties,
    packages,
    experiences,
    bookings,
    verifyVendorKYC,
    verifyVendorBank,
    updateVendorProfile,
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'banking' | 'listings' | 'bookings'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [apiVendor, setApiVendor] = useState<VendorItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Edit Vendor Profile & Password Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [updatedCredentials, setUpdatedCredentials] = useState<{ email: string; password?: string; vendorCode?: string } | null>(null);
  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
    businessName: '',
    displayName: '',
    displayRole: '',
    phone: '',
    category: 'property_host' as 'property_host' | 'activity_operator' | 'integrated_resort',
    experienceSummary: '',
    panNumber: '',
    gstin: '',
    tourismLicenseNumber: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Match vendor by ID or vendorCode
  const vendor = useMemo(() => {
    const fromContext = vendors.find(
      (v) => v.id === id || v.vendorCode === id || v.vendorCode?.toLowerCase() === id.toLowerCase()
    );
    return fromContext || apiVendor || vendors[0] || null;
  }, [vendors, id, apiVendor]);

  // Fetch from API if not found locally
  useEffect(() => {
    if (!vendor && id) {
      setIsLoading(true);
      api
        .get(`/admin/vendors/${id}`)
        .then((res) => {
          if (res.data?.data) {
            setApiVendor(res.data.data);
          }
        })
        .catch(() => {
          // ignore error
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, vendor]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const showToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  const handleOpenEditModal = () => {
    if (!vendor) return;
    setEditForm({
      email: vendor.email || '',
      password: '',
      businessName: vendor.businessName || '',
      displayName: vendor.displayName || '',
      displayRole: vendor.displayRole || '',
      phone: vendor.phone || '',
      category: vendor.category || 'property_host',
      experienceSummary: vendor.experienceSummary || '',
      panNumber: vendor.compliance?.panNumber || '',
      gstin: vendor.compliance?.gstin || '',
      tourismLicenseNumber: vendor.compliance?.tourismLicenseNumber || '',
      addressLine1: (vendor as any).contact?.registeredOfficeAddress?.addressLine1 || 'Main Market Road',
      city: (vendor as any).contact?.registeredOfficeAddress?.city || 'Mahabaleshwar',
      state: (vendor as any).contact?.registeredOfficeAddress?.state || 'Maharashtra',
      pincode: (vendor as any).contact?.registeredOfficeAddress?.pincode || '412806',
    });
    setShowPassword(false);
    setIsEditModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    try {
      setIsSaving(true);
      const payload: any = {
        email: editForm.email.trim(),
        businessName: editForm.businessName.trim(),
        displayName: editForm.displayName.trim(),
        displayRole: editForm.displayRole.trim(),
        phone: editForm.phone.trim(),
        category: editForm.category,
        experienceSummary: editForm.experienceSummary.trim(),
        panNumber: editForm.panNumber.trim().toUpperCase(),
        gstin: editForm.gstin.trim().toUpperCase(),
        tourismLicenseNumber: editForm.tourismLicenseNumber.trim(),
        addressLine1: editForm.addressLine1.trim(),
        city: editForm.city.trim(),
        state: editForm.state.trim(),
        pincode: editForm.pincode.trim(),
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await updateVendorProfile(vendor.id, payload);
      if (res) {
        setApiVendor(res);
      }
      if (editForm.password.trim()) {
        setUpdatedCredentials({
          email: editForm.email.trim(),
          password: editForm.password.trim(),
          vendorCode: vendor.vendorCode,
        });
      }
      setIsEditModalOpen(false);
      showToast('Vendor profile & credentials updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update vendor partner');
    } finally {
      setIsSaving(false);
    }
  };

  // Associated listings for this vendor
  const vendorProperties = useMemo(() => {
    if (!vendor) return [];
    return properties.filter(
      (p) =>
        p.vendorId === vendor.id ||
        p.vendorName?.toLowerCase() === vendor.businessName?.toLowerCase() ||
        p.vendorId === vendor.vendorCode
    );
  }, [properties, vendor]);

  const vendorPackages = useMemo(() => {
    if (!vendor) return [];
    return packages.filter(
      (pkg) =>
        pkg.vendorId === vendor.id ||
        pkg.vendorName?.toLowerCase() === vendor.businessName?.toLowerCase() ||
        pkg.vendorId === vendor.vendorCode
    );
  }, [packages, vendor]);

  const vendorExperiences = useMemo(() => {
    if (!vendor) return [];
    return experiences.filter(
      (exp) =>
        exp.vendorId === vendor.id ||
        exp.vendorName?.toLowerCase() === vendor.businessName?.toLowerCase() ||
        exp.vendorId === vendor.vendorCode
    );
  }, [experiences, vendor]);

  // Associated bookings for this vendor
  const vendorBookings = useMemo(() => {
    if (!vendor) return [];
    return bookings.filter(
      (b) =>
        b.vendorId === vendor.id ||
        b.vendorName?.toLowerCase() === vendor.businessName?.toLowerCase() ||
        b.vendorId === vendor.vendorCode
    );
  }, [bookings, vendor]);

  if (!vendor && isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading vendor partner profile...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Vendor Partner Not Found</h2>
        <p className="text-xs text-slate-500">
          The vendor ID or code <strong className="font-mono text-slate-800 dark:text-slate-200">{id}</strong> does not match any registered partner in the database.
        </p>
        <Link
          href="/dashboard/vendors"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Vendors List
        </Link>
      </div>
    );
  }

  const isApproved = vendor.compliance?.verificationStatus === 'approved';
  const isPending = vendor.compliance?.verificationStatus === 'pending' || vendor.compliance?.verificationStatus === 'under_review';
  const isBankVerified = vendor.banking?.isAccountVerified ?? true;

  const handleToggleKYC = () => {
    verifyVendorKYC(vendor.id, !isApproved);
    showToast(isApproved ? 'Vendor KYC status updated to Under Review' : 'Vendor KYC Approved & Activated Successfully!');
  };

  const handleToggleBank = () => {
    verifyVendorBank(vendor.id, !isBankVerified);
    showToast(!isBankVerified ? 'Bank Account Marked as Verified!' : 'Bank Account marked as Unverified');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{actionSuccessToast}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/vendors"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Back to Vendors List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <Link href="/dashboard/vendors" className="hover:underline">Vendors</Link>
              <span>/</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">{vendor.vendorCode}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-0.5">
              <span>{vendor.businessName}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {vendor.vendorCode}
              </span>
            </h1>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleCopy(
              `MahaStays Partner Login:\nEmail: ${vendor.email}\nVendor Code: ${vendor.vendorCode}\nPortal URL: http://localhost:3001/login`,
              'credentials'
            )}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
          >
            {copiedField === 'credentials' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedField === 'credentials' ? 'Copied Details' : 'Copy Login Info'}</span>
          </button>

          {/* Edit Vendor Credentials & Info Button */}
          <button
            type="button"
            onClick={handleOpenEditModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#134E4A] hover:bg-[#0f3d3a] text-white transition shadow-xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Credentials &amp; Info</span>
          </button>

          <button
            onClick={handleToggleKYC}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
              isApproved
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isApproved ? 'Set KYC Under Review' : 'Approve KYC'}</span>
          </button>
        </div>
      </div>

      {/* Newly Updated Credentials Banner */}
      {updatedCredentials && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-100">
                Credentials Updated for {vendor.businessName}
              </p>
              <p className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                Email: <strong className="font-mono">{updatedCredentials.email}</strong> &bull; New Password: <strong className="font-mono">{updatedCredentials.password}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(
                `MahaStays Partner Login:\nEmail: ${updatedCredentials.email}\nPassword: ${updatedCredentials.password}\nVendor Code: ${vendor.vendorCode}\nPortal URL: http://localhost:3001/login`,
                'new-credentials'
              )}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              {copiedField === 'new-credentials' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedField === 'new-credentials' ? 'Copied' : 'Copy New Login'}</span>
            </button>
            <button
              onClick={() => setUpdatedCredentials(null)}
              className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Vendor Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vendor.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
              alt={vendor.displayName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover ring-4 ring-rose-50 dark:ring-rose-950/40 shrink-0"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {vendor.businessName}
                </h2>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold capitalize flex items-center gap-1 ${
                    isApproved
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {vendor.compliance?.verificationStatus || 'Pending'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60">
                  {vendor.category === 'activity_operator'
                    ? 'Activity Host'
                    : vendor.category === 'integrated_resort'
                    ? 'Integrated Resort'
                    : 'Property Host'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Contact: <strong className="text-slate-800 dark:text-slate-200">{vendor.displayName}</strong> • {vendor.displayRole || 'Host & Partner'}
              </p>
              <p className="text-xs text-slate-400">
                {vendor.experienceSummary || 'Authorized partner listed on Mahastays t network'}
              </p>
            </div>
          </div>

          {/* Quick Communication Chips */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <a
              href={`tel:${vendor.phone}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-xs text-slate-700 dark:text-slate-200 font-medium transition"
            >
              <Phone className="w-3.5 h-3.5 text-rose-500" />
              <span>{vendor.phone || 'Phone not set'}</span>
            </a>
            <a
              href={`mailto:${vendor.email}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-xs text-slate-700 dark:text-slate-200 font-medium transition"
            >
              <Mail className="w-3.5 h-3.5 text-rose-500" />
              <span>{vendor.email}</span>
            </a>
          </div>
        </div>

        {/* 4 Summary Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Wallet Available
            </span>
            <div className="text-lg sm:text-xl font-bold text-rose-600 mt-1">
              ₹{(vendor.wallet?.availableInr || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Lifetime: ₹{(vendor.wallet?.lifetimeEarningsInr || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Active Listings
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {vendorProperties.length + vendorPackages.length + vendorExperiences.length}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {vendorProperties.length} Stays • {vendorPackages.length} Packages • {vendorExperiences.length} Experiences
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {vendorBookings.length}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Reservations processed
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              KYC &amp; Bank Status
            </span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isApproved && isBankVerified ? 'Fully Verified' : 'Action Needed'}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Bank Account: {isBankVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Profile &amp; Details</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'compliance'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Compliance &amp; KYC Docs</span>
        </button>

        <button
          onClick={() => setActiveTab('banking')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'banking'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Banking &amp; Settlement</span>
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'listings'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Properties &amp; Listings ({vendorProperties.length + vendorPackages.length + vendorExperiences.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'bookings'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Vendor Bookings ({vendorBookings.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: Profile & Business Overview ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Business Information */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-500" />
                <span>Business Registration Profile</span>
              </h3>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 transition cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Info</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Trade / Brand Name</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{vendor.businessName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Unique Vendor Code</span>
                <span className="font-mono font-bold text-rose-600">{vendor.vendorCode}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Primary Partner Category</span>
                <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">
                  {vendor.category.replace('_', ' ')}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Primary Contact Person</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{vendor.displayName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Contact Designation</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{vendor.displayRole || 'General Manager'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Registered Email</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{vendor.email}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Registered Phone</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{vendor.phone}</span>
              </div>
            </div>
          </div>

          {/* Card: Address & Location */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Registered Office &amp; Operations Location</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Address</div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Main Market Road, Near Venna Lake Circle, Mahabaleshwar, Maharashtra — 412806, India
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs space-y-2">
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Partner Commission Agreement</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Standard platform commission rate applied across all bookings for this vendor:
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Stays</span>
                  <strong className="text-rose-600 font-bold">15%</strong>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Packages</span>
                  <strong className="text-rose-600 font-bold">15%</strong>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Experiences</span>
                  <strong className="text-rose-600 font-bold">15%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Compliance Documents ─── */}
      {activeTab === 'compliance' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-rose-500" />
                <span>Compliance &amp; Legal Verification Documents</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official regulatory documents filed for government tourism compliance and GST taxation.
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200'
              }`}
            >
              KYC Status: {vendor.compliance?.verificationStatus || 'Pending'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PAN Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Permanent Account Number (PAN)
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  VERIFIED
                </span>
              </div>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>{vendor.compliance?.panNumber || 'ABCDE1234F'}</span>
                <button
                  onClick={() => handleCopy(vendor.compliance?.panNumber || 'ABCDE1234F', 'pan')}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                  title="Copy PAN"
                >
                  {copiedField === 'pan' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Verified with Income Tax Department of India for business entity.
              </p>
            </div>

            {/* GSTIN */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  GSTIN Registration (GST)
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  ACTIVE 27
                </span>
              </div>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>{vendor.compliance?.gstin || '27ABCDE1234F1Z5'}</span>
                <button
                  onClick={() => handleCopy(vendor.compliance?.gstin || '27ABCDE1234F1Z5', 'gst')}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                  title="Copy GSTIN"
                >
                  {copiedField === 'gst' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                State: Maharashtra (Code 27). Tax invoices auto-generated under this GSTIN.
              </p>
            </div>

            {/* MTDC Tourism License */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  MTDC Tourism License
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  VALIDATED
                </span>
              </div>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>{vendor.compliance?.tourismLicenseNumber || 'MTDC/2018/04512'}</span>
                <button
                  onClick={() => handleCopy(vendor.compliance?.tourismLicenseNumber || 'MTDC/2018/04512', 'mtdc')}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                  title="Copy License"
                >
                  {copiedField === 'mtdc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Maharashtra Tourism Development Corporation Registered Hospitality License.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Banking & Settlement ─── */}
      {activeTab === 'banking' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-500" />
                <span>Bank Account &amp; Direct Deposit Settings</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official bank account used by Mahastays for weekly automatic vendor payouts.
              </p>
            </div>
            <button
              onClick={handleToggleBank}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                isBankVerified
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{isBankVerified ? 'Account Verified (Click to Revoke)' : 'Mark Bank as Verified'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Settlement Account
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {vendor.banking?.bankName || 'HDFC Bank'}
                </span>
              </div>

              <div className="space-y-3 divide-y divide-slate-200/60 dark:divide-slate-700 text-xs">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Account Holder Name</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {vendor.banking?.accountHolderName || vendor.businessName}
                  </span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-400">Account Number</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-slate-900 dark:text-slate-100">
                    <span>
                      {showFullAccount
                        ? `5010049281${vendor.banking?.accountNumberLast4 || '4821'}`
                        : `•••• •••• •••• ${vendor.banking?.accountNumberLast4 || '4821'}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFullAccount(!showFullAccount)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      {showFullAccount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">IFSC Code</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {vendor.banking?.ifscCode || 'HDFC0001234'}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Branch Name</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Mahabaleshwar Main Branch</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-4">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
                Payout &amp; Settlement Policy
              </span>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Weekly Payouts:</strong> Automated NEFT/RTGS transfers processed every Monday for completed check-outs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero Payout Fees:</strong> Mahastays covers all RTGS/IMPS bank clearance charges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Instant Reconciliation:</strong> Tax invoices and TDS certificates automatically reconciled.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Properties & Listings ─── */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          {/* Stays & Hotels */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-rose-500" />
                <span>Stays &amp; Hotels Owned ({vendorProperties.length})</span>
              </h3>
              <Link
                href="/dashboard/hotels"
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <span>View Stays Catalog</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {vendorProperties.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No stays currently assigned to this vendor.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendorProperties.map((prop) => (
                  <Link
                    key={prop.id}
                    href={`/dashboard/hotels/${prop.id}`}
                    className="group block p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 transition-all hover:shadow-sm"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prop.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'}
                        alt={prop.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                        {prop.city}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-rose-600 transition">
                      {prop.name}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>₹{prop.numericPrice.toLocaleString('en-IN')}/night</span>
                      <span className="capitalize text-emerald-600 font-semibold">{prop.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Tour Packages */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-500" />
                <span>Tour Packages Hosted ({vendorPackages.length})</span>
              </h3>
              <Link
                href="/dashboard/packages"
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <span>View Packages Catalog</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {vendorPackages.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No tour packages currently assigned to this vendor.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendorPackages.map((pkg) => (
                  <Link
                    key={pkg.id}
                    href={`/dashboard/packages/${pkg.id}`}
                    className="group block p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 transition-all hover:shadow-sm"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pkg.images?.[0] || pkg.thumbnail || 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=600'}
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                        {pkg.durationDays}D / {pkg.durationNights}N
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-rose-600 transition">
                      {pkg.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>₹{pkg.numericPrice.toLocaleString('en-IN')}/person</span>
                      <span className="capitalize text-emerald-600 font-semibold">{pkg.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Experiences */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-rose-500" />
                <span>Activities &amp; Experiences Hosted ({vendorExperiences.length})</span>
              </h3>
              <Link
                href="/dashboard/experiences"
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <span>View Experiences Catalog</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {vendorExperiences.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No experiences currently assigned to this vendor.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendorExperiences.map((exp) => (
                  <Link
                    key={exp.id}
                    href={`/dashboard/experiences/${exp.id}`}
                    className="group block p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 transition-all hover:shadow-sm"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={exp.image || exp.gallery?.[0] || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600'}
                        alt={exp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                        {exp.location}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-rose-600 transition">
                      {exp.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>₹{exp.numericPrice.toLocaleString('en-IN')}/person</span>
                      <span className="capitalize text-emerald-600 font-semibold">{exp.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: Vendor Bookings ─── */}
      {activeTab === 'bookings' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                <span>Customer Bookings for {vendor.businessName}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total {vendorBookings.length} booking records found for this partner.
              </p>
            </div>
            <Link
              href="/dashboard/bookings"
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
            >
              <span>All Bookings Desk</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {vendorBookings.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No customer bookings recorded yet for this vendor partner.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {vendorBookings.map((b) => (
                <div key={b.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-rose-600">{b.bookingReference}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {b.type}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {b.guestName} • <span className="text-slate-400 font-normal">{b.guestPhone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        ₹{b.grandTotalInr.toLocaleString('en-IN')}
                      </div>
                      <span className={`text-[10px] font-semibold capitalize ${
                        b.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {b.paymentStatus} • {b.bookingStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Edit Vendor Credentials & Information Modal ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    Edit Vendor Partner Profile &amp; Login
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vendor Code: <span className="font-mono font-semibold text-rose-600">{vendor.vendorCode}</span> &bull; {vendor.businessName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveVendor} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6">
                {/* 1. Login Credentials & Password Section */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Partner Portal Login Credentials
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Registered Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-rose-500" />
                        <span>Registered Login Email *</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="vendor@mahastays.com"
                      />
                    </div>

                    {/* Change / Reset Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Reset Password</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={editForm.password}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          className="w-full px-3.5 py-2 pr-9 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="Enter new password (min. 6 chars)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    💡 <em>Leave password empty to keep existing password unchanged. If you enter a new password, it will be securely hashed and updated immediately.</em>
                  </p>
                </div>

                {/* 2. Business & Contact Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-rose-500" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Business &amp; Contact Details
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Trade / Brand Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Trade / Brand Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.businessName}
                        onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="e.g. Rohan Luxury Valley Retreat"
                      />
                    </div>

                    {/* Partner Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Partner Category
                      </label>
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value as any })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="property_host">Property Host (Hotels, Villas, Resorts)</option>
                        <option value="activity_operator">Activity Operator (Trekking, Tours, Adventures)</option>
                        <option value="integrated_resort">Integrated Luxury Resort</option>
                      </select>
                    </div>

                    {/* Primary Contact Person */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Primary Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.displayName}
                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="e.g. Rohan Kulkarni"
                      />
                    </div>

                    {/* Contact Designation */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Contact Designation / Role
                      </label>
                      <input
                        type="text"
                        value={editForm.displayRole}
                        onChange={(e) => setEditForm({ ...editForm, displayRole: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="e.g. Property Host & Owner"
                      />
                    </div>

                    {/* Registered Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Registered Phone Number</span>
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="+91 98200 99887"
                      />
                    </div>

                    {/* Experience Summary */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Experience / Partner Bio Summary
                      </label>
                      <input
                        type="text"
                        value={editForm.experienceSummary}
                        onChange={(e) => setEditForm({ ...editForm, experienceSummary: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="e.g. Verified Mahastays Partner since 2026 • 64+ Verified Group Stays"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Compliance & Legal Registration Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-500" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Tax Compliance &amp; Registered Address
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* PAN Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        value={editForm.panNumber}
                        onChange={(e) => setEditForm({ ...editForm, panNumber: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="ABCDE1234F"
                      />
                    </div>

                    {/* GSTIN */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        GSTIN
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        value={editForm.gstin}
                        onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="27ABCDE1234F1Z5"
                      />
                    </div>

                    {/* Tourism License */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Tourism License / MTDC
                      </label>
                      <input
                        type="text"
                        value={editForm.tourismLicenseNumber}
                        onChange={(e) => setEditForm({ ...editForm, tourismLicenseNumber: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="MTDC/2026/089"
                      />
                    </div>
                  </div>

                  {/* Registered Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Registered Street Address
                      </label>
                      <input
                        type="text"
                        value={editForm.addressLine1}
                        onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Main Market Road, Near Venna Lake"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        City
                      </label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Mahabaleshwar"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={editForm.pincode}
                        onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="412806"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#134E4A] hover:bg-[#0f3d3a] text-white transition shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Vendor Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
