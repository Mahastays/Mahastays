'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  UploadCloud,
  FileText,
  Loader2,
  Info,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { VendorItem } from '../../types';
import { uploadImageToCloudinary } from '../../lib/upload';

interface VendorDetailViewProps {
  id: string;
}

const isDummyVal = (val?: string | null) => {
  if (!val) return true;
  const s = val.trim().toLowerCase();
  return (
    s === 'abcde1234f' ||
    s === '27abcde1234f1z5' ||
    s === 'mtdc/2026/089' ||
    s === 'main market road' ||
    s.includes('photo-1507003211169-0a1dd7228f2d') ||
    s.includes('photo-1589829545856-d10d557cf95f') ||
    s.includes('photo-1450133064473-71024230f91b') ||
    s.includes('pravatar.cc') ||
    s === 'hdfc bank' ||
    s === 'hdfc0001234' ||
    s === 'mahabaleshwar main branch'
  );
};

export default function VendorDetailView({ id }: VendorDetailViewProps) {
  const router = useRouter();
  const { user, activeViewMode } = useAuth();
  const isAdmin = activeViewMode === 'admin' && user?.role === 'admin';
  const {
    vendors,
    properties,
    packages,
    experiences,
    bookings,
    verifyVendorKYC,
    verifyVendorBank,
    updateVendorProfile,
    refreshData,
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'banking' | 'listings' | 'bookings'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [apiVendor, setApiVendor] = useState<VendorItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  // Hidden file inputs for direct upload on compliance cards
  const fileInputRefs = {
    identityProofUrl: useRef<HTMLInputElement>(null),
    businessProofUrl: useRef<HTMLInputElement>(null),
    bankProofUrl: useRef<HTMLInputElement>(null),
    tourismProofUrl: useRef<HTMLInputElement>(null),
  };

  // Edit Vendor Profile & Password Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatedCredentials, setUpdatedCredentials] = useState<{ email: string; password?: string; vendorCode?: string } | null>(null);

  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    displayName: '',
    displayRole: '',
    businessType: 'proprietorship' as 'individual' | 'proprietorship' | 'private_limited' | 'partnership',
    phone: '',
    alternatePhone: '',
    category: 'property_host' as 'property_host' | 'activity_operator' | 'integrated_resort',
    experienceSummary: '',
    panNumber: '',
    gstin: '',
    tourismLicenseNumber: '',
    aadhaarNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    upiId: '',
    identityProofUrl: '',
    businessProofUrl: '',
    bankProofUrl: '',
    tourismProofUrl: '',
  });

  // Match vendor by ID or vendorCode
  const vendor = useMemo(() => {
    const fromContext = vendors.find(
      (v) => v.id === id || v.vendorCode === id || v.vendorCode?.toLowerCase() === id.toLowerCase()
    );
    return fromContext || apiVendor || (vendors.length > 0 ? vendors[0] : null);
  }, [vendors, id, apiVendor]);

  // Fetch from API if not found locally or for fresh data
  const fetchVendorDetail = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const endpoint = isAdmin ? `/admin/vendors/${id}` : `/vendor/me`;
      const res = await api.get(endpoint).catch(() => api.get(`/admin/vendors/${id}`));
      if (res.data?.data) {
        setApiVendor(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!vendor && id) {
      fetchVendorDetail();
    }
  }, [id, vendor]);

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([refreshData(), fetchVendorDetail()]);
      showToast('Vendor profile & KYC records refreshed with live database data.');
    } catch {
      // offline
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const showToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  const handleOpenEditModal = () => {
    if (!vendor) return;
    setEditForm({
      email: vendor.email || '',
      password: '',
      confirmPassword: '',
      businessName: vendor.businessName || '',
      displayName: vendor.displayName || vendor.contact?.primaryContactPerson || '',
      displayRole: vendor.displayRole || '',
      businessType: (vendor.businessType as any) || 'proprietorship',
      phone: vendor.phone || '',
      alternatePhone: vendor.contact?.alternatePhone || '',
      category: vendor.category || 'property_host',
      experienceSummary: isDummyVal(vendor.experienceSummary) ? '' : (vendor.experienceSummary || ''),
      panNumber: isDummyVal(vendor.compliance?.panNumber) ? '' : (vendor.compliance?.panNumber || ''),
      gstin: isDummyVal(vendor.compliance?.gstin) ? '' : (vendor.compliance?.gstin || ''),
      tourismLicenseNumber: isDummyVal(vendor.compliance?.tourismLicenseNumber) ? '' : (vendor.compliance?.tourismLicenseNumber || ''),
      aadhaarNumber: isDummyVal(vendor.compliance?.aadhaarNumber) ? '' : (vendor.compliance?.aadhaarNumber || ''),
      addressLine1: isDummyVal(vendor.contact?.registeredOfficeAddress?.addressLine1) ? '' : (vendor.contact?.registeredOfficeAddress?.addressLine1 || ''),
      addressLine2: vendor.contact?.registeredOfficeAddress?.addressLine2 || '',
      city: isDummyVal(vendor.contact?.registeredOfficeAddress?.city) ? '' : (vendor.contact?.registeredOfficeAddress?.city || ''),
      state: isDummyVal(vendor.contact?.registeredOfficeAddress?.state) ? '' : (vendor.contact?.registeredOfficeAddress?.state || ''),
      pincode: isDummyVal(vendor.contact?.registeredOfficeAddress?.pincode) ? '' : (vendor.contact?.registeredOfficeAddress?.pincode || ''),
      bankName: isDummyVal(vendor.banking?.bankName) ? '' : (vendor.banking?.bankName || ''),
      accountHolderName: isDummyVal(vendor.banking?.accountHolderName) ? '' : (vendor.banking?.accountHolderName || ''),
      accountNumber: isDummyVal(vendor.banking?.accountNumber) ? '' : (vendor.banking?.accountNumber || ''),
      ifscCode: isDummyVal(vendor.banking?.ifscCode) ? '' : (vendor.banking?.ifscCode || ''),
      branchName: isDummyVal(vendor.banking?.branchName) ? '' : (vendor.banking?.branchName || ''),
      upiId: vendor.banking?.upiId || '',
      identityProofUrl: isDummyVal(vendor.compliance?.identityProofUrl) ? '' : (vendor.compliance?.identityProofUrl || ''),
      businessProofUrl: isDummyVal(vendor.compliance?.businessProofUrl) ? '' : (vendor.compliance?.businessProofUrl || ''),
      bankProofUrl: isDummyVal(vendor.compliance?.bankProofUrl) ? '' : (vendor.compliance?.bankProofUrl || ''),
      tourismProofUrl: isDummyVal(vendor.compliance?.tourismProofUrl) ? '' : (vendor.compliance?.tourismProofUrl || ''),
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsEditModalOpen(true);
  };

  // Direct Document Upload Handler for KYC docs
  const handleDirectDocUpload = async (
    docKey: 'identityProofUrl' | 'businessProofUrl' | 'bankProofUrl' | 'tourismProofUrl',
    file: File
  ) => {
    if (!vendor) return;
    try {
      setUploadingDocKey(docKey);
      const uploadRes = await uploadImageToCloudinary(file, 'kyc_documents');
      const uploadedUrl = uploadRes.url;

      const res = await updateVendorProfile(vendor.id, {
        [docKey]: uploadedUrl,
      });
      if (res) {
        setApiVendor(res);
      }
      showToast('KYC document uploaded and verified successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to upload KYC document');
    } finally {
      setUploadingDocKey(null);
    }
  };

  // Trigger file input dialog
  const triggerFileInput = (docKey: 'identityProofUrl' | 'businessProofUrl' | 'bankProofUrl' | 'tourismProofUrl') => {
    fileInputRefs[docKey].current?.click();
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    if (editForm.password.trim()) {
      if (editForm.password.trim().length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }
      if (editForm.password.trim() !== editForm.confirmPassword.trim()) {
        alert('Passwords do not match. Please verify your new password.');
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload: any = {
        // Strict requirement: email is intentionally NOT part of the editable update payload
        businessName: editForm.businessName.trim(),
        displayName: editForm.displayName.trim(),
        displayRole: editForm.displayRole.trim(),
        businessType: editForm.businessType,
        phone: editForm.phone.trim(),
        alternatePhone: editForm.alternatePhone.trim(),
        category: editForm.category,
        experienceSummary: editForm.experienceSummary.trim(),
        panNumber: editForm.panNumber.trim().toUpperCase(),
        gstin: editForm.gstin.trim().toUpperCase(),
        tourismLicenseNumber: editForm.tourismLicenseNumber.trim(),
        aadhaarNumber: editForm.aadhaarNumber.trim(),
        addressLine1: editForm.addressLine1.trim(),
        addressLine2: editForm.addressLine2.trim(),
        city: editForm.city.trim(),
        state: editForm.state.trim(),
        pincode: editForm.pincode.trim(),
        bankName: editForm.bankName.trim(),
        accountHolderName: editForm.accountHolderName.trim(),
        accountNumber: editForm.accountNumber.trim(),
        ifscCode: editForm.ifscCode.trim().toUpperCase(),
        branchName: editForm.branchName.trim(),
        upiId: editForm.upiId.trim(),
        identityProofUrl: editForm.identityProofUrl.trim(),
        businessProofUrl: editForm.businessProofUrl.trim(),
        bankProofUrl: editForm.bankProofUrl.trim(),
        tourismProofUrl: editForm.tourismProofUrl.trim(),
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
          email: vendor.email,
          password: editForm.password.trim(),
          vendorCode: vendor.vendorCode,
        });
      }
      setIsEditModalOpen(false);
      showToast('Vendor profile & full KYC details updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update vendor partner details');
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
      <div className="p-8 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Vendor Partner Not Found</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The requested vendor account could not be found or has been archived.
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
      {/* Hidden File Inputs for Direct Document Uploads */}
      {(['identityProofUrl', 'businessProofUrl', 'bankProofUrl', 'tourismProofUrl'] as const).map((key) => (
        <input
          key={key}
          type="file"
          ref={fileInputRefs[key]}
          className="hidden"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleDirectDocUpload(key, file);
            e.target.value = '';
          }}
        />
      ))}

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
              <Link href="/dashboard/vendors" className="hover:underline">
                {isAdmin ? 'Vendors & KYC' : 'My Full KYC & Profile'}
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">{vendor.vendorCode}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-0.5">
              <span>{vendor.businessName}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {vendor.vendorCode}
              </span>
              {!isAdmin && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                  Verified Host Portal
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            title="Reload live data from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-600' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => handleCopy(
              `MahaStays Partner Login:\nEmail: ${vendor.email}\nVendor Code: ${vendor.vendorCode}\nPortal URL: ${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
              'credentials'
            )}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
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
            <span>{isAdmin ? 'Edit Vendor & Password' : 'Edit Profile, Password & KYC'}</span>
          </button>

          {/* Admin KYC Approval Action (Only visible for Admins) */}
          {isAdmin && (
            <button
              onClick={handleToggleKYC}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                isApproved
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isApproved ? 'Set KYC Under Review' : 'Approve KYC'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Newly Updated Credentials Banner */}
      {updatedCredentials && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-100">
                Password &amp; Credentials Updated for {vendor.businessName}
              </p>
              <p className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                Email (Unchanged): <strong className="font-mono">{updatedCredentials.email}</strong> &bull; New Password: <strong className="font-mono">{updatedCredentials.password}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(
                `MahaStays Partner Login:\nEmail: ${updatedCredentials.email}\nPassword: ${updatedCredentials.password}\nVendor Code: ${vendor.vendorCode}\nPortal URL: ${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
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
            {vendor.avatarUrl ? (
              <img
                src={vendor.avatarUrl}
                alt={vendor.displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover ring-4 ring-rose-50 dark:ring-rose-950/40 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold text-2xl flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-900/40">
                {(vendor.businessName || vendor.displayName || 'V')[0].toUpperCase()}
              </div>
            )}
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
                {vendor.businessType && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {vendor.businessType.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Primary Contact: <strong className="text-slate-800 dark:text-slate-200">{vendor.displayName}</strong> • {vendor.displayRole || 'Host & Partner'}
              </p>
              <p className="text-xs text-slate-400">
                {vendor.experienceSummary || 'Authorized partner listed on Mahastays tourism network'}
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
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium transition">
              <Mail className="w-3.5 h-3.5 text-rose-500" />
              <span>{vendor.email}</span>
              <span title="Permanent Login Email">
                <Lock className="w-3 h-3 text-slate-400" />
              </span>
            </div>
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
          <span>Profile &amp; Names</span>
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
          <span>Full KYC &amp; Documents</span>
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
                <span>Business Registration &amp; Contact Details</span>
              </h3>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 transition cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Names &amp; Details</span>
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
                <span className="text-slate-400">Business Legal Structure</span>
                <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">
                  {(vendor.businessType || 'proprietorship').replace('_', ' ')}
                </span>
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
                <span className="text-slate-400">Contact Designation / Role</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{vendor.displayRole || 'General Manager & Host'}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Registered Login Email</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{vendor.email}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                    <Lock className="w-2.5 h-2.5" /> Immutable ID
                  </span>
                </div>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Primary Phone</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{vendor.phone}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Alternate Phone</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">
                  {vendor.contact?.alternatePhone || 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Address & Location */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Registered Office &amp; Operations Address</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Address</div>
              {vendor.contact?.registeredOfficeAddress?.addressLine1 ? (
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {vendor.contact.registeredOfficeAddress.addressLine1}
                  {vendor.contact.registeredOfficeAddress.addressLine2 ? `, ${vendor.contact.registeredOfficeAddress.addressLine2}` : ''}
                  <br />
                  {vendor.contact.registeredOfficeAddress.city || ''},{' '}
                  {vendor.contact.registeredOfficeAddress.state || ''} —{' '}
                  {vendor.contact.registeredOfficeAddress.pincode || ''}
                </p>
              ) : (
                <p className="text-slate-400 italic">No registered office address provided yet.</p>
              )}
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span>Country: India</span>
                <span>&bull;</span>
                <span>Maharashtra Tourism Jurisdiction</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs space-y-2">
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Partner Commission Agreement</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Standard platform commission schedule applied across all bookings for this partner account:
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Stays</span>
                  <strong className="text-rose-600 font-bold">
                    {vendor.commissionTerms?.propertyCommissionRatePercent || 12}%
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Packages</span>
                  <strong className="text-rose-600 font-bold">
                    {vendor.commissionTerms?.packageCommissionRatePercent || 10}%
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Experiences</span>
                  <strong className="text-rose-600 font-bold">
                    {vendor.commissionTerms?.experienceCommissionRatePercent || 15}%
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Full KYC Details & Document Uploads ─── */}
      {activeTab === 'compliance' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-rose-500" />
                <span>Full KYC Compliance &amp; Verification Documents</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official regulatory tax numbers, identity proofs, and MTDC tourism compliance documentation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                  isApproved
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200'
                }`}
              >
                KYC Status: {vendor.compliance?.verificationStatus?.toUpperCase() || 'PENDING'}
              </span>
            </div>
          </div>

          {/* Legal Identifiers (PAN, GSTIN, MTDC, Aadhaar) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* PAN Card */}
            {(() => {
              const hasPan = !isDummyVal(vendor.compliance?.panNumber);
              return (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Permanent Account (PAN)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasPan ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200'}`}>
                      {hasPan ? 'VERIFIED' : 'NOT PROVIDED'}
                    </span>
                  </div>
                  <div className="text-base font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>{hasPan ? vendor.compliance?.panNumber : 'Not provided'}</span>
                    {hasPan && (
                      <button
                        onClick={() => handleCopy(vendor.compliance?.panNumber || '', 'pan')}
                        className="p-1 rounded text-slate-400 hover:text-slate-600"
                        title="Copy PAN"
                      >
                        {copiedField === 'pan' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {hasPan
                      ? 'Verified with Income Tax Department of India for business entity.'
                      : 'No Permanent Account Number (PAN) registered yet.'}
                  </p>
                </div>
              );
            })()}

            {/* GSTIN */}
            {(() => {
              const hasGst = !isDummyVal(vendor.compliance?.gstin);
              return (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      GSTIN Registration
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasGst ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200'}`}>
                      {hasGst ? 'ACTIVE' : 'OPTIONAL'}
                    </span>
                  </div>
                  <div className="text-base font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>{hasGst ? vendor.compliance?.gstin : 'Not provided'}</span>
                    {hasGst && (
                      <button
                        onClick={() => handleCopy(vendor.compliance?.gstin || '', 'gst')}
                        className="p-1 rounded text-slate-400 hover:text-slate-600"
                        title="Copy GSTIN"
                      >
                        {copiedField === 'gst' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {hasGst
                      ? 'State GSTIN. Tax invoices auto-generated under registered business tax ID.'
                      : 'No GSTIN registered. Optional for individual hosts below threshold.'}
                  </p>
                </div>
              );
            })()}

            {/* MTDC Tourism License */}
            {(() => {
              const hasMtdc = !isDummyVal(vendor.compliance?.tourismLicenseNumber);
              return (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      MTDC Tourism License
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasMtdc ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200/60'}`}>
                      {hasMtdc ? 'VALIDATED' : 'NOT ENTERED'}
                    </span>
                  </div>
                  <div className="text-base font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>{hasMtdc ? vendor.compliance?.tourismLicenseNumber : 'Not provided'}</span>
                    {hasMtdc && (
                      <button
                        onClick={() => handleCopy(vendor.compliance?.tourismLicenseNumber || '', 'mtdc')}
                        className="p-1 rounded text-slate-400 hover:text-slate-600"
                        title="Copy License"
                      >
                        {copiedField === 'mtdc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {hasMtdc
                      ? 'Maharashtra Tourism Development Corporation Registered Hospitality License.'
                      : 'No MTDC tourism license submitted yet.'}
                  </p>
                </div>
              );
            })()}

            {/* Aadhaar / UIDAI */}
            {(() => {
              const hasAadhaar = !isDummyVal(vendor.compliance?.aadhaarNumber);
              return (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Aadhaar / National ID
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasAadhaar ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200'}`}>
                      {hasAadhaar ? 'LINKED' : 'PENDING'}
                    </span>
                  </div>
                  <div className="text-base font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>
                      {hasAadhaar && vendor.compliance?.aadhaarNumber
                        ? `•••• •••• ${vendor.compliance.aadhaarNumber.slice(-4)}`
                        : 'Not provided'}
                    </span>
                    {hasAadhaar && (
                      <span className="text-[11px] text-slate-400 font-sans font-normal">Encrypted</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {hasAadhaar
                      ? 'Authorized signatory identity verified under Aadhaar e-KYC regulations.'
                      : 'No Aadhaar identification linked yet.'}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* 4 KYC DOCUMENT CARDS: Upload, View & Replace */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  KYC Verification Documents &amp; Upload Center
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Accepted formats: PDF, PNG, JPG (Max 10MB)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Document 1: Identity Proof */}
              {(() => {
                const hasDoc = !isDummyVal(vendor.compliance?.identityProofUrl);
                return (
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Primary Identity Proof (Signatory)
                          </h5>
                          <p className="text-[11px] text-slate-400">Aadhaar Card, Passport, or Voter ID Card</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          hasDoc
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {hasDoc ? 'DOCUMENT UPLOADED' : 'PENDING UPLOAD'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
                      {hasDoc ? (
                        <a
                          href={vendor.compliance?.identityProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Uploaded Document</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No file uploaded yet</span>
                      )}

                      <button
                        type="button"
                        onClick={() => triggerFileInput('identityProofUrl')}
                        disabled={uploadingDocKey === 'identityProofUrl'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      >
                        {uploadingDocKey === 'identityProofUrl' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{hasDoc ? 'Replace File' : 'Upload File'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Document 2: Business Proof */}
              {(() => {
                const hasDoc = !isDummyVal(vendor.compliance?.businessProofUrl);
                return (
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Business Registration Proof
                          </h5>
                          <p className="text-[11px] text-slate-400">GST Certificate, Shop &amp; Establishment, or MSME / Udyam</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          hasDoc
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {hasDoc ? 'DOCUMENT UPLOADED' : 'PENDING UPLOAD'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
                      {hasDoc ? (
                        <a
                          href={vendor.compliance?.businessProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Uploaded Document</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No file uploaded yet</span>
                      )}

                      <button
                        type="button"
                        onClick={() => triggerFileInput('businessProofUrl')}
                        disabled={uploadingDocKey === 'businessProofUrl'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      >
                        {uploadingDocKey === 'businessProofUrl' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{hasDoc ? 'Replace File' : 'Upload File'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Document 3: Bank Account Proof */}
              {(() => {
                const hasDoc = !isDummyVal(vendor.compliance?.bankProofUrl);
                return (
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Bank Account Verification Proof
                          </h5>
                          <p className="text-[11px] text-slate-400">Cancelled Cheque, Passbook Photo, or Recent Statement</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          hasDoc
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {hasDoc ? 'DOCUMENT UPLOADED' : 'PENDING UPLOAD'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
                      {hasDoc ? (
                        <a
                          href={vendor.compliance?.bankProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Uploaded Document</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No file uploaded yet</span>
                      )}

                      <button
                        type="button"
                        onClick={() => triggerFileInput('bankProofUrl')}
                        disabled={uploadingDocKey === 'bankProofUrl'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      >
                        {uploadingDocKey === 'bankProofUrl' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{hasDoc ? 'Replace File' : 'Upload File'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Document 4: Tourism / MTDC License */}
              {(() => {
                const hasDoc = !isDummyVal(vendor.compliance?.tourismProofUrl);
                return (
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            MTDC Hospitality Certificate
                          </h5>
                          <p className="text-[11px] text-slate-400">Government Maharashtra Tourism Board Registered Permit</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          hasDoc
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {hasDoc ? 'DOCUMENT UPLOADED' : 'PENDING UPLOAD'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
                      {hasDoc ? (
                        <a
                          href={vendor.compliance?.tourismProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Uploaded Document</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No file uploaded yet</span>
                      )}

                      <button
                        type="button"
                        onClick={() => triggerFileInput('tourismProofUrl')}
                        disabled={uploadingDocKey === 'tourismProofUrl'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      >
                        {uploadingDocKey === 'tourismProofUrl' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{hasDoc ? 'Replace File' : 'Upload File'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
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
                Official verified bank account used by Mahastays for weekly automatic vendor payouts.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleToggleBank}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isBankVerified
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{isBankVerified ? 'Account Verified (Click to Revoke)' : 'Mark Bank as Verified'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              const hasBank = !isDummyVal(vendor.banking?.bankName) && !isDummyVal(vendor.banking?.accountNumber);
              return (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Settlement Account
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {hasBank ? vendor.banking?.bankName : 'Not configured'}
                    </span>
                  </div>

                  <div className="space-y-3 divide-y divide-slate-200/60 dark:divide-slate-700 text-xs">
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">Account Holder Name</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {hasBank ? (vendor.banking?.accountHolderName || vendor.businessName) : 'Not configured'}
                      </span>
                    </div>
                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-slate-400">Account Number</span>
                      <div className="flex items-center gap-2 font-mono font-bold text-slate-900 dark:text-slate-100">
                        <span>
                          {hasBank && vendor.banking?.accountNumber
                            ? showFullAccount
                              ? vendor.banking.accountNumber
                              : `•••• •••• •••• ${vendor.banking.accountNumberLast4 || vendor.banking.accountNumber.slice(-4)}`
                            : 'Not configured'}
                        </span>
                        {hasBank && vendor.banking?.accountNumber && (
                          <button
                            type="button"
                            onClick={() => setShowFullAccount(!showFullAccount)}
                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title={showFullAccount ? 'Mask account number' : 'Show full account number'}
                          >
                            {showFullAccount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {hasBank ? vendor.banking?.ifscCode : 'Not configured'}
                      </span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">Branch Name</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {hasBank ? (vendor.banking?.branchName || 'Main Branch') : 'Not configured'}
                      </span>
                    </div>
                    {hasBank && vendor.banking?.upiId && (
                      <div className="pt-2 flex justify-between items-center">
                        <span className="text-slate-400">Direct UPI ID</span>
                        <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                          <span>{vendor.banking.upiId}</span>
                          <button
                            onClick={() => handleCopy(vendor.banking?.upiId || '', 'upi')}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Copy UPI ID"
                          >
                            {copiedField === 'upi' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!hasBank && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
                      No verified bank account added yet. Payouts remain on hold until partner bank details are submitted and verified.
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleOpenEditModal}
                      className="w-full py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{hasBank ? 'Update Bank Account or IFSC' : 'Add Bank Account & IFSC'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-4">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
                Payout &amp; Settlement Policy
              </span>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Weekly Payouts:</strong> Automated NEFT/RTGS transfers processed every Monday for completed guest check-outs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero Payout Fees:</strong> Mahastays covers all RTGS/IMPS bank clearance charges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Instant Reconciliation:</strong> Tax invoices and TDS certificates automatically generated and downloadable.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Strict Security:</strong> Bank changes require an active verified signatory session.</span>
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-rose-500" />
                <span>Stays &amp; Resort Properties ({vendorProperties.length})</span>
              </h3>
              <Link
                href={`/dashboard/hotels/new?vendorId=${vendor.id}`}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                + Add Property
              </Link>
            </div>

            {vendorProperties.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic">No properties registered under this partner.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendorProperties.map((prop) => (
                  <Link
                    key={prop.id}
                    href={`/dashboard/hotels/${prop.id}`}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900 transition block space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{prop.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        ₹{prop.numericPrice || 5000}/n
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{prop.location}</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Status: {prop.status}</span>
                      <span>&bull;</span>
                      <span>Rating: {prop.rating} ★</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Tour Packages */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-500" />
                <span>Tour Packages ({vendorPackages.length})</span>
              </h3>
              <Link
                href={`/dashboard/packages/new?vendorId=${vendor.id}`}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                + Add Package
              </Link>
            </div>
            {vendorPackages.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic">No tour packages listed under this partner.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendorPackages.map((pkg) => (
                  <Link
                    key={pkg.id}
                    href={`/dashboard/packages/${pkg.id}`}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-rose-300 transition block space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{pkg.title}</span>
                      <span className="text-[10px] font-bold text-rose-600">₹{pkg.numericPrice || 12000}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{pkg.durationDays}D / {pkg.durationNights}N</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Experiences & Treks */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-rose-500" />
                <span>Experiences &amp; Treks ({vendorExperiences.length})</span>
              </h3>
              <Link
                href={`/dashboard/experiences/new?vendorId=${vendor.id}`}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                + Add Experience
              </Link>
            </div>
            {vendorExperiences.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic">No experiences registered under this partner.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendorExperiences.map((exp) => (
                  <Link
                    key={exp.id}
                    href={`/dashboard/experiences/${exp.id}`}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-rose-300 transition block space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{exp.title}</span>
                      <span className="text-[10px] font-bold text-rose-600">₹{exp.numericPrice || 1500}/person</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{exp.location}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: Bookings ─── */}
      {activeTab === 'bookings' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-500" />
            <span>Associated Bookings ({vendorBookings.length})</span>
          </h3>

          {vendorBookings.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              No customer bookings found for this partner yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {vendorBookings.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{b.guestName}</span>
                    <span className="text-slate-400 text-[11px] block">
                      {(b as any).propertyName || (b as any).title || (b as any).packageName || 'Hospitality Stay'} &bull; {b.bookingReference}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₹{b.grandTotalInr?.toLocaleString('en-IN') || 0}
                    </span>
                    <span className="text-[10px] block capitalize text-emerald-600">
                      {b.bookingStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: Edit Vendor Profile, Names, Passwords & Full KYC ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isAdmin ? 'Edit Vendor Credentials, KYC & Profile' : 'Update My Profile, Password & KYC Details'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Partner Code: <strong className="font-mono text-rose-600">{vendor.vendorCode}</strong> &bull; All changes are securely saved
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveVendor} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section 1: Account Login & Password (Strictly No Email Change) */}
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Partner Portal Login &amp; Password
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300/60">
                    Authentication
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Registered Email (STRICTLY LOCKED) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-rose-500" />
                        <span>Registered Email</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        readOnly
                        value={editForm.email}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none font-mono"
                        placeholder="vendor@mahastays.com"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Email is your permanent login account identifier and cannot be modified.
                    </p>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>New Password</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        className="w-full px-3.5 py-2 pr-9 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Min. 6 characters"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">Leave blank to keep existing password.</p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Confirm Password</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={editForm.confirmPassword}
                        onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                        className="w-full px-3.5 py-2 pr-9 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Re-type new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Business & Contact Names */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-rose-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Business Entity &amp; Partner Names
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      placeholder="e.g. HillView Luxury Resort"
                    />
                  </div>

                  {/* Primary Contact Person Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Primary Contact Person Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.displayName}
                      onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="e.g. Abhishek Sharma"
                    />
                  </div>

                  {/* Contact Designation / Role */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Contact Designation / Role
                    </label>
                    <input
                      type="text"
                      value={editForm.displayRole}
                      onChange={(e) => setEditForm({ ...editForm, displayRole: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="e.g. General Manager & Host"
                    />
                  </div>

                  {/* Business Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Business Entity Legal Structure
                    </label>
                    <select
                      value={editForm.businessType}
                      onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="proprietorship">Sole Proprietorship</option>
                      <option value="private_limited">Private Limited Company (Pvt Ltd)</option>
                      <option value="partnership">Partnership Firm / LLP</option>
                      <option value="individual">Individual Host / Homestay</option>
                    </select>
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

                  {/* Registered Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Primary Phone Number *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="+91 98200 99887"
                    />
                  </div>

                  {/* Alternate Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Alternate Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editForm.alternatePhone}
                      onChange={(e) => setEditForm({ ...editForm, alternatePhone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="+91 98200 11223"
                    />
                  </div>

                  {/* Experience Summary */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Host Bio / Experience Summary
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

              {/* Section 3: Legal Compliance & Tax Numbers */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Tax Numbers &amp; Compliance Identifiers
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                      MTDC Tourism License
                    </label>
                    <input
                      type="text"
                      value={editForm.tourismLicenseNumber}
                      onChange={(e) => setEditForm({ ...editForm, tourismLicenseNumber: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="MTDC/2026/089"
                    />
                  </div>

                  {/* Aadhaar Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={editForm.aadhaarNumber}
                      onChange={(e) => setEditForm({ ...editForm, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="12 Digit Aadhaar"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Registered Office Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Registered Office Address
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Address Line 1 (Street / Building)
                    </label>
                    <input
                      type="text"
                      value={editForm.addressLine1}
                      onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Main Market Road"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Address Line 2 (Area / Landmark)
                    </label>
                    <input
                      type="text"
                      value={editForm.addressLine2}
                      onChange={(e) => setEditForm({ ...editForm, addressLine2: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Near Venna Lake Circle"
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
                      State
                    </label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Maharashtra"
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

              {/* Section 5: Settlement Bank Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Settlement Bank &amp; Payout Account
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={editForm.bankName}
                      onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="HDFC Bank"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={editForm.accountHolderName}
                      onChange={(e) => setEditForm({ ...editForm, accountHolderName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Account holder as per bank"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={editForm.accountNumber}
                      onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Bank account number"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={editForm.ifscCode}
                      onChange={(e) => setEditForm({ ...editForm, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="HDFC0001234"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={editForm.branchName}
                      onChange={(e) => setEditForm({ ...editForm, branchName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Mahabaleshwar Main Branch"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Direct UPI ID
                    </label>
                    <input
                      type="text"
                      value={editForm.upiId}
                      onChange={(e) => setEditForm({ ...editForm, upiId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="partner@okhdfcbank"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Document URLs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-rose-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Uploaded Document Links (Cloudinary / S3)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Identity Proof URL
                    </label>
                    <input
                      type="url"
                      value={editForm.identityProofUrl}
                      onChange={(e) => setEditForm({ ...editForm, identityProofUrl: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="https://res.cloudinary.com/.../identity.pdf"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Business Proof URL
                    </label>
                    <input
                      type="url"
                      value={editForm.businessProofUrl}
                      onChange={(e) => setEditForm({ ...editForm, businessProofUrl: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="https://res.cloudinary.com/.../gst_cert.pdf"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Bank Proof URL
                    </label>
                    <input
                      type="url"
                      value={editForm.bankProofUrl}
                      onChange={(e) => setEditForm({ ...editForm, bankProofUrl: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="https://res.cloudinary.com/.../cheque.jpg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tourism License URL
                    </label>
                    <input
                      type="url"
                      value={editForm.tourismProofUrl}
                      onChange={(e) => setEditForm({ ...editForm, tourismProofUrl: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="https://res.cloudinary.com/.../mtdc_license.pdf"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#134E4A] hover:bg-[#0f3d3a] text-white transition shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save All Changes</span>
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
