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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface ApprovalsViewProps {
  onOpenRejectModal: (kind: 'property' | 'package' | 'experience', id: string, name: string) => void;
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
  } = useData();

  const [activeTab, setActiveTab] = useState<'all' | 'properties' | 'packages' | 'experiences' | 'ads' | 'kyc'>('all');

  const pendingProperties = properties.filter((p) => p.status === 'pending_approval');
  const pendingPackages = packages.filter((p) => p.status === 'pending_approval');
  const pendingExperiences = experiences.filter((e) => e.status === 'pending_approval');
  const pendingAds = ads.filter((a) => !a.approvedByAdmin);
  const pendingVendors = vendors.filter((v) => v.compliance.verificationStatus === 'pending');

  const totalPending =
    pendingProperties.length +
    pendingPackages.length +
    pendingExperiences.length +
    pendingAds.length +
    pendingVendors.length;

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
