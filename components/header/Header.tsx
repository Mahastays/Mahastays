'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Building,
  Plus,
  Bell,
  Sparkles,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { NavTab } from '../sidebar/Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onOpenCreateModal: (type: 'property' | 'package' | 'experience' | 'ad') => void;
  onNavigateTab: (tab: NavTab) => void;
}

export default function Header({ currentTab, onOpenCreateModal, onNavigateTab }: HeaderProps) {
  const router = useRouter();
  const { user, activeViewMode } = useAuth();
  const { properties, packages, experiences, ads, refreshData } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshData();
      router.refresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const isAdmin = activeViewMode === 'admin';

  const pendingCount =
    properties.filter((p) => p.status === 'pending_approval').length +
    packages.filter((p) => p.status === 'pending_approval').length +
    experiences.filter((p) => p.status === 'pending_approval').length +
    ads.filter((a) => !a.approvedByAdmin).length;

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: {
      title: isAdmin ? 'Platform Overview' : 'Partner Host Dashboard',
      subtitle: isAdmin
        ? 'Live monitoring of listings, guest bookings, approvals, and ad campaigns'
        : 'Manage your listings, track guest reservations, and promote offers',
    },
    bookings: {
      title: 'Guest Profiles & Bookings',
      subtitle: 'Complete folio management, billing breakdown, check-in, and guest notes',
    },
    properties: {
      title: isAdmin ? 'Hotels & Properties Catalog' : 'My Properties & Rooms',
      subtitle: isAdmin
        ? 'Review and approve vendor properties before public publishing'
        : 'List resorts, villas, and cottages. All new additions require admin approval.',
    },
    packages: {
      title: isAdmin ? 'Tour Packages Catalog' : 'My Tour Packages',
      subtitle: isAdmin
        ? 'Curated multi-day itineraries and honeymoon packages'
        : 'Design all-inclusive stay packages with meals and activities',
    },
    experiences: {
      title: isAdmin ? 'Activities & Experiences' : 'My Mountain Experiences',
      subtitle: isAdmin
        ? 'Adventure tours, treks, and boating activities awaiting review'
        : 'Create time slots and guided treks across the Sahyadri mountains',
    },
    ads: {
      title: 'Ad Campaigns & Sponsorships',
      subtitle: isAdmin
        ? 'Create platform-wide promotions or review vendor sponsored ads'
        : 'Boost your property visibility on the homepage and search results',
    },
    hero: {
      title: 'Hero Section Carousel & Banners',
      subtitle: 'Upload high-resolution images to Cloudinary (WebP optimized), customize headlines, and manage auto-carousel order',
    },
    approvals: {
      title: 'Admin Approvals Queue',
      subtitle: 'Enforce platform compliance: Approve or reject listings and ads',
    },
    vendors: {
      title: 'Vendor Partners & KYC Compliance',
      subtitle: 'Review PAN, GSTIN, MTDC licenses, and bank account verifications',
    },
    users: {
      title: 'Registered Users & Accounts',
      subtitle: 'Complete directory of customer accounts, club memberships, bookings history, and permissions',
    },
    finance: {
      title: isAdmin ? 'Platform Financials & Ledgers' : 'Earnings & Payout Wallet',
      subtitle: isAdmin
        ? 'Platform gross booking volume, commission splits, and tax logs'
        : 'Track your net share, pending escrow, and payout disbursement cycles',
    },
    settings: {
      title: 'Platform Configurations',
      subtitle: 'GST rates, dynamic commission slabs, and system rules',
    },
    support: {
      title: 'Support & Inquiries',
      subtitle: 'Guest tickets, dispute handling, and staff communication',
    },
  };

  const { title, subtitle } = tabTitles[currentTab] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-8 py-4 sticky top-0 z-20 flex items-center justify-between transition-colors">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h1>

          {/* Role Status Tag */}
          {isAdmin ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              Admin Mode
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900">
              <Building className="w-3 h-3 text-emerald-600" />
              Vendor: {user?.businessName?.split(' ')[0] || 'Partner'}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Refresh Live Data Button (Available across every page of Admin and Vendor) */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh live data from server"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer disabled:opacity-60 shadow-2xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>

        {/* Approvals notification pill for Admin */}
        {isAdmin && pendingCount > 0 && (
          <button
            onClick={() => onNavigateTab('approvals')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/70 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
          >
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>{pendingCount} Awaiting Approval</span>
          </button>
        )}



        {/* Action Button: Create Ad or Add Listing */}
        {isAdmin ? (
          <button
            onClick={() => onOpenCreateModal('ad')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Ad Campaign</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCreateModal('property')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Hotel / Stay</span>
            </button>
            <button
              onClick={() => onOpenCreateModal('ad')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>Promote Listing</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
