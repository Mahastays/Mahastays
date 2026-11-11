'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Megaphone,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  MousePointer,
  Eye,
  TrendingUp,
  DollarSign,
  Sparkles,
  ShieldCheck,
  Building,
  Home,
  Hotel,
  Gift,
  Compass,
  Layers,
  Star,
  ArrowRight,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AdCampaignItem, AdPlacement, AdSectionTab } from '../../types';
import CreateAdModal from '../modals/CreateAdModal';
import EditAdModal from '../modals/EditAdModal';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import DashboardSkeleton from '../common/DashboardSkeleton';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAds } from '../../store/slices/adsSlice';

interface AdsViewProps {
  onOpenCreateModal?: () => void;
}

export default function AdsView({ onOpenCreateModal }: AdsViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, activeViewMode } = useAuth();
  const { ads, approveAdCampaign, toggleAdCampaign, deleteAdCampaign } = useData();
  const { loading } = useAppSelector((state) => state.ads);

  useEffect(() => {
    dispatch(fetchAds());
  }, [dispatch]);

  // Active section tab: 'all' | 'home' | 'stays' | 'packages' | 'experiences'
  const [activeSection, setActiveSection] = useState<AdSectionTab>('all');
  // Secondary status filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'mine'>('all');

  // Internal modal control so each tab opens with the exact respective placement
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPlacement, setModalPlacement] = useState<AdPlacement>('homepage');
  const [adToEdit, setAdToEdit] = useState<AdCampaignItem | null>(null);
  const [adToDelete, setAdToDelete] = useState<AdCampaignItem | null>(null);

  const isAdmin = activeViewMode === 'admin';

  // Helper to determine which section an ad belongs to
  const getAdSection = (ad: AdCampaignItem): 'home' | 'stays' | 'packages' | 'experiences' => {
    const pl = (ad.placement || '').toLowerCase();
    const adType = (ad.adType || '').toLowerCase();
    const targetType = (ad.target?.targetType || '').toLowerCase();
    const cta = (ad.target?.ctaLink || '').toLowerCase();

    if (pl === 'homepage' || adType === 'card' || pl === 'home') {
      return 'home';
    }
    if (pl === 'packages' || pl === 'packages_hub' || targetType === 'package' || cta.includes('/packages')) {
      return 'packages';
    }
    if (pl === 'experiences' || pl === 'experience' || pl === 'experiences_hub' || targetType === 'activity' || cta.includes('/experiences')) {
      return 'experiences';
    }
    if (pl === 'stays' || pl === 'search_results' || pl === 'listing_detail' || targetType === 'property' || cta.includes('/explore')) {
      return 'stays';
    }
    return 'home';
  };

  // Counts for each tab
  const counts = {
    all: ads.length,
    home: ads.filter((a) => getAdSection(a) === 'home').length,
    stays: ads.filter((a) => getAdSection(a) === 'stays').length,
    packages: ads.filter((a) => getAdSection(a) === 'packages').length,
    experiences: ads.filter((a) => getAdSection(a) === 'experiences').length,
  };

  // Filter ads by section and status/role
  const filteredAds = ads.filter((ad) => {
    // Role filter
    if (!isAdmin && user?.id && ad.createdById !== user.id) return false;

    // Section tab filter
    if (activeSection !== 'all') {
      const section = getAdSection(ad);
      if (section !== activeSection) return false;
    }

    // Status filter
    if (statusFilter === 'active') return ad.isActive && ad.approvedByAdmin;
    if (statusFilter === 'pending') return !ad.approvedByAdmin;
    if (statusFilter === 'mine') return ad.createdById === user?.id;

    return true;
  });

  // Calculate platform ad metrics
  const totalImpressions = ads.reduce(
    (acc, a) => acc + (a.impressions || (a as any).budget?.impressions || 0),
    0
  );
  const totalClicks = ads.reduce(
    (acc, a) => acc + (a.clicks || (a as any).budget?.clicks || 0),
    0
  );
  const totalSpend = ads.reduce(
    (acc, a) => acc + (a.budget?.spentSoFar || (a as any).spentSoFar || 0),
    0
  );
  const averageCtr = totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  const handleOpenCreateForSection = (sec: AdSectionTab) => {
    router.push(`/dashboard/ads/new?section=${sec}`);
  };

  // Section details
  const sectionMeta: Record<
    AdSectionTab,
    { title: string; desc: string; url: string; addLabel: string; icon: any; color: string }
  > = {
    all: {
      title: 'All Active Ad Campaigns',
      desc: 'Full catalog of sponsored campaigns, top blend banners, and promotional cards across the entire platform.',
      url: '/',
      addLabel: 'Create Campaign',
      icon: Sparkles,
      color: 'text-rose-600',
    },
    home: {
      title: '🏠 Home Page Ad Section',
      desc: 'Campaigns shown on the customer homepage (hero carousel, spotlight cards, and promotional popups).',
      url: 'http://localhost:3000/',
      addLabel: 'Add Home Ad',
      icon: Home,
      color: 'text-amber-500',
    },
    stays: {
      title: '🏨 Stays & Explore Page Header Ad Section',
      desc: 'White-to-image blend banner and sponsored property cards displayed on the /explore stays catalog.',
      url: 'http://localhost:3000/explore',
      addLabel: 'Add Stays Ad',
      icon: Hotel,
      color: 'text-rose-500',
    },
    packages: {
      title: '🎁 Holiday Packages Page Header Ad Section',
      desc: 'White-to-image blend banner and limited-time couple/group deal packages on the /packages catalog.',
      url: 'http://localhost:3000/packages',
      addLabel: 'Add Package Ad',
      icon: Gift,
      color: 'text-purple-500',
    },
    experiences: {
      title: '🧗 Curated Experiences Page Header Ad Section',
      desc: 'White-to-image blend banner and adventure/trekking showcase promotions on the /experiences catalog.',
      url: 'http://localhost:3000/experiences',
      addLabel: 'Add Experience Ad',
      icon: Compass,
      color: 'text-emerald-500',
    },
  };

  const currentMeta = sectionMeta[activeSection];

  if (loading && ads.length === 0) {
    return <DashboardSkeleton type="cards" />;
  }

  return (
    <div className="space-y-6">
      {/* ─── Metric Stat Cards Row ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Impressions</span>
            <Eye className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {totalImpressions.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Live customer views
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Ad Clicks</span>
            <MousePointer className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {totalClicks.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Average CTR: {averageCtr}%</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Campaign Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            ₹{totalSpend.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">In-budget campaigns</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Running Ads</span>
            <Megaphone className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {ads.filter((a) => a.isActive && a.approvedByAdmin).length}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            {ads.filter((a) => !a.approvedByAdmin).length} Pending Review
          </div>
        </div>
      </div>

      {/* ─── PRIMARY SECTION TABS: Home, Stays, Packages, Experience ─── */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all' as AdSectionTab, label: 'All Ads', icon: Sparkles, count: counts.all },
            { id: 'home' as AdSectionTab, label: 'Home Page Ads', icon: Home, count: counts.home },
            { id: 'stays' as AdSectionTab, label: 'Stays Page Ads', icon: Hotel, count: counts.stays },
            { id: 'packages' as AdSectionTab, label: 'Packages Page Ads', icon: Gift, count: counts.packages },
            { id: 'experiences' as AdSectionTab, label: 'Experience Page Ads', icon: Compass, count: counts.experiences },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#ea110d] text-white shadow-md shadow-red-500/25 ring-2 ring-red-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── SECTION CONTEXT BANNER + ACTIONS ─────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-rose-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-poppins">
              {currentMeta.title}
            </h3>
            {activeSection !== 'all' && (
              <a
                href={currentMeta.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full transition"
              >
                <span>Live View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">{currentMeta.desc}</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          {/* Secondary Status Filter Pills */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Live' },
              { id: 'pending', label: 'Pending' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg capitalize transition cursor-pointer text-xs ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Primary Action Button (Add Ad for Respective Section) */}
          <button
            onClick={() => handleOpenCreateForSection(activeSection)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold bg-[#ea110d] hover:bg-[#d00f0c] text-white transition shadow-md shadow-red-500/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{currentMeta.addLabel}</span>
          </button>
        </div>
      </div>

      {/* ─── LIST / CARDS OF ADS FOR THIS SECTION ─────────────── */}
      {filteredAds.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <Megaphone className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No ads found for {activeSection === 'all' ? 'this filter' : sectionMeta[activeSection].title}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create an ad campaign for this section to feature it with the white-to-image blend banner on customer pages.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleOpenCreateForSection(activeSection)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#ea110d] text-white shadow-md shadow-red-500/25 hover:bg-[#d00f0c] transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{currentMeta.addLabel}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAds.map((ad) => {
            const isPending = !ad.approvedByAdmin;
            const isLive = ad.isActive && ad.approvedByAdmin;
            const adImpr = ad.impressions ?? (ad as any).budget?.impressions ?? 0;
            const adClicks = ad.clicks ?? (ad as any).budget?.clicks ?? 0;
            const ctr = adImpr ? ((adClicks / adImpr) * 100).toFixed(1) : '0.0';
            const section = getAdSection(ad);

            const sectionBadges: Record<string, { label: string; icon: any; color: string }> = {
              home: { label: '🏠 Home Page Ad', icon: Home, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              stays: { label: '🏨 Stays Page Ad', icon: Hotel, color: 'bg-rose-50 text-rose-700 border-rose-200' },
              packages: { label: '🎁 Packages Page Ad', icon: Gift, color: 'bg-purple-50 text-purple-700 border-purple-200' },
              experiences: { label: '🧗 Experience Page Ad', icon: Compass, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            };

            const secInfo = sectionBadges[section] || sectionBadges.home;

            // Features array
            const featureList: string[] = Array.isArray(ad.creative.features)
              ? ad.creative.features.map((f: any) => (typeof f === 'string' ? f : f.label))
              : typeof ad.creative.features === 'string'
              ? (ad.creative.features as string).split('•').map((s) => s.trim())
              : [];

            return (
              <div
                key={ad.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  {/* Top Bar: Section Badge + Creator + Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${secInfo.color}`}>
                        {secInfo.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ad.createdByRole === 'admin'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {ad.createdByRole === 'admin' ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-rose-600" />
                            Platform Ad
                          </>
                        ) : (
                          <>
                            <Building className="w-3 h-3 text-emerald-600" />
                            Vendor Ad
                          </>
                        )}
                      </span>
                    </div>

                    <div>
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white animate-pulse">
                          <Clock className="w-3 h-3" />
                          Awaiting Approval
                        </span>
                      ) : isLive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white">
                          <CheckCircle2 className="w-3 h-3" />
                          Live & Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Pause className="w-3 h-3" />
                          Paused
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Campaign Title & Target */}
                  <div className="pt-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {ad.adName}
                      </h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Priority: {ad.priority}/10
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>Promotes:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {ad.target.targetTitle}
                      </span>
                      <span className="text-[10px] text-rose-600 font-mono">({ad.target.ctaLink})</span>
                    </div>
                  </div>

                  {/* ─── Mini Ad Preview: Card Preview for Home Ads, Blend Banner for Page Headers ───────── */}
                  {ad.adType === 'card' || getAdSection(ad) === 'home' ? (
                    <div className="mt-4 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center">
                      <div className="w-full max-w-[330px] h-[120px] bg-white rounded-2xl p-2.5 border border-slate-100 shadow-xs flex items-center gap-3 relative select-none">
                        <div className="relative w-28 h-full rounded-xl overflow-hidden shrink-0 bg-slate-100">
                          <img
                            src={ad.creative.imageUrl}
                            alt={ad.creative.headline}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xs ${
                              (ad.creative.badgeText || '').toLowerCase().includes('seller')
                                ? 'bg-[#16a34a]'
                                : (ad.creative.badgeText || '').toLowerCase().includes('new')
                                ? 'bg-[#2563eb]'
                                : (ad.creative.badgeText || '').toLowerCase().includes('limit')
                                ? 'bg-[#ea580c]'
                                : 'bg-[#ea110d]'
                            }`}
                          >
                            {ad.creative.badgeText || 'Hot Deal'}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-900 truncate font-poppins">
                              {ad.creative.headline}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {ad.creative.subHeadline?.split(' · ')[0] || '3D / 2N'} · {ad.creative.subHeadline?.split(' · ')[1] || 'Scenic View'}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900 font-poppins">
                              {ad.creative.subHeadline?.split(' · ')[2] || '₹12,499'}
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 hover:text-[#ea110d] flex items-center gap-1 mt-0.5">
                              <span>View Details</span>
                              <span>→</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs bg-white select-none">
                      <img
                        src={ad.creative.imageUrl}
                        alt={ad.creative.headline}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                      {/* White Horizontal Blend */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(to right, #ffffff 0%, #ffffff 42%, rgba(255, 255, 255, 0.94) 54%, rgba(255, 255, 255, 0.45) 68%, rgba(255, 255, 255, 0) 80%)',
                        }}
                      />
                      {/* Left Typography Content */}
                      <div className="absolute inset-y-0 left-0 p-3 sm:p-3.5 flex flex-col justify-between max-w-[65%] z-10">
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[#ea110d] text-[9px] font-bold">
                            <Star className="w-2.5 h-2.5 fill-[#ea110d]" />
                            {ad.creative.badgeText || 'Sponsored'}
                          </span>
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate mt-1">
                            {ad.creative.headline}
                          </h4>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {ad.creative.subHeadline}
                          </p>
                        </div>

                        <div>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ea110d] text-white text-[9px] font-bold shadow-xs">
                            {ad.creative.buttonText || 'Explore'} →
                          </span>
                        </div>
                      </div>

                      {/* Floating Price Pill */}
                      {(ad.creative.price || (ad as any).price) && (
                        <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-xs rounded-xl p-1.5 px-2.5 shadow-sm border border-slate-100 flex items-center gap-1.5 z-10">
                          <div className="text-right">
                            <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none">From</span>
                            <span className="text-xs font-black text-[#ea110d]">
                              ₹{ad.creative.price || (ad as any).price}
                            </span>
                            <span className="text-[9px] text-slate-500 font-semibold ml-0.5">
                              {ad.creative.priceUnit || '/ night'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Highlights Row (if specified) */}
                  {featureList.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                      {featureList.slice(0, 3).map((feat, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          • {feat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Budget & Live Analytics */}
                  <div className="grid grid-cols-4 gap-2 pt-3 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="text-[10px] text-slate-400">Budget</div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        ₹{(ad.budget?.totalBudget || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="text-[10px] text-slate-400">Spent</div>
                      <div className="text-xs font-bold text-emerald-600">
                        ₹{((ad.budget?.spentSoFar ?? (ad as any).spentSoFar) || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="text-[10px] text-slate-400">Views</div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {(ad.impressions ?? (ad as any).budget?.impressions ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="text-[10px] text-slate-400">Clicks (CTR)</div>
                      <div className="text-xs font-bold text-[#ea110d]">
                        {ad.clicks ?? (ad as any).budget?.clicks ?? 0} ({ctr}%)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Created by <span className="font-semibold text-slate-600 dark:text-slate-300">{ad.createdByName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Admin Approval */}
                    {isAdmin && isPending && (
                      <button
                        onClick={() => approveAdCampaign(ad.id, user?.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}

                    {/* Edit Ad Content & Pricing */}
                    {(isAdmin || ad.createdById === user?.id) && (
                      <button
                        onClick={() => setAdToEdit(ad)}
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                        title="Edit Campaign Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Pause / Resume */}
                    <button
                      onClick={() => toggleAdCampaign(ad.id, !ad.isActive)}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title={ad.isActive ? 'Pause Campaign' : 'Resume Campaign'}
                    >
                      {ad.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    {/* Delete */}
                    {(isAdmin || ad.createdById === user?.id) && (
                      <button
                        type="button"
                        onClick={() => setAdToDelete(ad)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Integrated Create Ad Modal for Selected Section ─── */}
      <CreateAdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultPlacement={modalPlacement}
      />

      {/* ─── Integrated Edit Ad Modal ─── */}
      <EditAdModal
        isOpen={Boolean(adToEdit)}
        onClose={() => setAdToEdit(null)}
        ad={adToEdit}
      />

      {/* ─── Confirm Delete Ad Modal ─── */}
      <ConfirmDeleteModal
        isOpen={Boolean(adToDelete)}
        onClose={() => setAdToDelete(null)}
        onConfirm={() => {
          if (adToDelete) {
            deleteAdCampaign(adToDelete.id);
            setAdToDelete(null);
          }
        }}
        title="Delete Ad Campaign?"
        itemName={adToDelete?.adName || adToDelete?.creative?.headline}
        itemType="ad campaign"
        message={
          <p>
            Are you sure you want to permanently delete campaign{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {adToDelete?.adName || adToDelete?.creative?.headline}
            </strong>? This ad will be removed from all customer banner displays immediately.
          </p>
        }
      />
    </div>
  );
}
