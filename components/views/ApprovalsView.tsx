'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  Compass,
  Sparkles,
  Megaphone,
  AlertCircle,
  Eye,
  FileText,
  BadgeCheck,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import DashboardSkeleton from '../common/DashboardSkeleton';
import { useAppSelector } from '../../store/hooks';

interface ApprovalsViewProps {
  onOpenRejectModal: (kind: 'property' | 'package' | 'experience' | 'vendor', id: string, name: string) => void;
}

export default function ApprovalsView({ onOpenRejectModal }: ApprovalsViewProps) {
  const { user } = useAuth();
  const {
    properties,
    packages,
    experiences,
    ads,
    vendors,
    approveProperty,
    approvePackage,
    approveExperience,
    approveAdCampaign,
    verifyVendorKYC,
    refreshData,
  } = useData();

  const [activeTab, setActiveTab] = useState<'all' | 'properties' | 'packages' | 'experiences' | 'ads' | 'kyc'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshApprovals = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  React.useEffect(() => {
    refreshData();
  }, []);

  const anyLoading = useAppSelector(
    (state) =>
      state.properties.loading ||
      state.packages.loading ||
      state.experiences.loading ||
      state.vendors.loading
  );

  const pendingProperties = properties.filter((p) => p.status === 'pending_approval');
  const pendingPackages = packages.filter((p) => p.status === 'pending_approval');
  const pendingExperiences = experiences.filter((e) => e.status === 'pending_approval');
  const pendingAds = ads.filter((a) => !a.approvedByAdmin);
  const pendingVendors = vendors.filter(
    (v) =>
      v.compliance?.verificationStatus === 'pending' ||
      v.compliance?.verificationStatus === 'under_review' ||
      v.status === 'pending_approval'
  );

  const totalPending =
    pendingProperties.length +
    pendingPackages.length +
    pendingExperiences.length +
    pendingAds.length +
    pendingVendors.length;

  if (anyLoading && properties.length === 0 && packages.length === 0 && experiences.length === 0) {
    return <DashboardSkeleton type="table" />;
  }

  return (
    <div className="space-y-6">
      {/* Alert Header */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-rose-500/10 via-amber-500/10 to-transparent border border-rose-200/60 dark:border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Admin Compliance & Approval Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Only approved hotel stays, packages, and activities are published to customers on Mahastays.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshApprovals}
            disabled={isRefreshing}
            title="Refetch all pending items from database"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 text-rose-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Queue'}</span>
          </button>

          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-600 text-white shadow-xs">
            {totalPending} Items Pending Review
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/80 dark:border-slate-800">
        {[
          { id: 'all', label: 'All Pending', count: totalPending },
          { id: 'properties', label: 'Hotels & Stays', count: pendingProperties.length },
          { id: 'packages', label: 'Tour Packages', count: pendingPackages.length },
          { id: 'experiences', label: 'Experiences', count: pendingExperiences.length },
          { id: 'ads', label: 'Vendor Ads', count: pendingAds.length },
          { id: 'kyc', label: 'Vendor KYC', count: pendingVendors.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-medium shrink-0 flex items-center gap-2 transition ${
              activeTab === tab.id
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200/80 dark:border-rose-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. Pending Properties Section */}
      {(activeTab === 'all' || activeTab === 'properties') && pendingProperties.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-rose-500" />
            <span>Hotels & Properties Awaiting Verification ({pendingProperties.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingProperties.map((prop) => (
              <div
                key={prop.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prop.images[0]}
                    alt={prop.name}
                    className="w-24 h-24 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                      {prop.propertyType} • {prop.city}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {prop.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{prop.description}</p>
                    <div className="text-xs font-semibold text-rose-600 mt-2">
                      ₹{prop.numericPrice.toLocaleString()} / night • Host: {prop.vendorName}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onOpenRejectModal('property', prop.id, prop.name)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                  >
                    Reject with Feedback
                  </button>
                  <button
                    onClick={() => approveProperty(prop.id, user?.id)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve & Make Live
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Pending Packages Section */}
      {(activeTab === 'all' || activeTab === 'packages') && pendingPackages.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-rose-500" />
            <span>Tour Packages Awaiting Approval ({pendingPackages.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pkg.thumbnail}
                    alt={pkg.title}
                    className="w-24 h-24 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                      {pkg.durationDays}D/{pkg.durationNights}N • {pkg.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {pkg.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{pkg.shortDesc}</p>
                    <div className="text-xs font-semibold text-rose-600 mt-2">
                      ₹{pkg.numericPrice.toLocaleString()} / person • Host: {pkg.vendorName}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onOpenRejectModal('package', pkg.id, pkg.title)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => approvePackage(pkg.id, user?.id)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Package
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Pending Experiences Section */}
      {(activeTab === 'all' || activeTab === 'experiences') && pendingExperiences.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>Outdoor Activities & Treks ({pendingExperiences.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingExperiences.map((exp) => (
              <div
                key={exp.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="w-24 h-24 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                      {exp.category} • {exp.duration}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {exp.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{exp.description}</p>
                    <div className="text-xs font-semibold text-rose-600 mt-2">
                      ₹{exp.numericPrice.toLocaleString()} / person • Guide: {exp.guide?.name}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onOpenRejectModal('experience', exp.id, exp.title)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => approveExperience(exp.id, user?.id)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Activity
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Pending Ads Section */}
      {(activeTab === 'all' || activeTab === 'ads') && pendingAds.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-rose-500" />
            <span>Vendor Ad Campaigns Requiring Approval ({pendingAds.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingAds.map((ad) => (
              <div
                key={ad.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ad.creative.imageUrl}
                    alt={ad.creative.headline}
                    className="w-24 h-20 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      {ad.adType} • {ad.placement}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {ad.adName}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{ad.creative.headline}</p>
                    <div className="text-xs text-slate-400 mt-2">
                      Budget: ₹{ad.budget.totalBudget.toLocaleString()} • Vendor: {ad.createdByName}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => approveAdCampaign(ad.id, user?.id)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Ad Campaign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Pending Vendor KYC Section */}
      {(activeTab === 'all' || activeTab === 'kyc') && pendingVendors.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-rose-500" />
            <span>Vendor Partner KYC & Host Applications ({pendingVendors.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex gap-4 items-start">
                  {vendor.avatarUrl && !vendor.avatarUrl.includes('photo-1507003211169-0a1dd7228f2d') && !vendor.avatarUrl.includes('pravatar.cc') ? (
                    <img
                      src={vendor.avatarUrl}
                      alt={vendor.displayName || vendor.businessName}
                      className="w-14 h-14 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-lg flex items-center justify-center shrink-0 border border-rose-200/60">
                      {(vendor.businessName || vendor.displayName || 'V')[0].toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                        {vendor.category === 'activity_operator' ? 'Activity Operator' : 'Property Host'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {vendor.vendorCode}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {vendor.businessName || vendor.displayName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Contact: {vendor.displayName} • {vendor.email} {vendor.phone ? `• ${vendor.phone}` : ''}
                    </p>

                    {/* KYC Document Indicators */}
                    <div className="flex items-center gap-2 flex-wrap mt-2.5">
                      {vendor.compliance.panNumber ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-semibold border border-emerald-200/60">
                          PAN: {vendor.compliance.panNumber}
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                          No PAN provided
                        </span>
                      )}

                      {vendor.compliance.gstin && (
                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-semibold border border-blue-200/60">
                          GST: {vendor.compliance.gstin}
                        </span>
                      )}

                      {vendor.compliance.identityProofUrl && (
                        <a
                          href={vendor.compliance.identityProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-medium hover:underline flex items-center gap-1 border border-rose-200/60"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View ID Proof</span>
                        </a>
                      )}

                      {vendor.compliance.businessProofUrl && (
                        <a
                          href={vendor.compliance.businessProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium hover:underline flex items-center gap-1 border border-purple-200/60"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Business Proof</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <a
                    href={`/dashboard/vendors/${vendor.id}`}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium"
                  >
                    <span>Inspect Details</span>
                    <Eye className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenRejectModal('vendor', vendor.id, vendor.businessName || vendor.displayName)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                    >
                      Reject KYC
                    </button>
                    <button
                      type="button"
                      onClick={() => verifyVendorKYC(vendor.id, true)}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve KYC
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Empty State */}
      {activeTab !== 'all' && (
        (activeTab === 'properties' && pendingProperties.length === 0) ||
        (activeTab === 'packages' && pendingPackages.length === 0) ||
        (activeTab === 'experiences' && pendingExperiences.length === 0) ||
        (activeTab === 'ads' && pendingAds.length === 0) ||
        (activeTab === 'kyc' && pendingVendors.length === 0)
      ) && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
          <BadgeCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2.5" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No Pending Items in This Queue
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            All submissions in this category have been processed and resolved.
          </p>
        </div>
      )}

      {/* Empty State */}
      {totalPending === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
          <BadgeCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            All Queues Up To Date!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Every submitted hotel, tour package, outdoor experience, and vendor ad has been reviewed.
          </p>
        </div>
      )}
    </div>
  );
}
