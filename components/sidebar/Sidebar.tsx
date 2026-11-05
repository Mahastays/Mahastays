'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  Users,
  BedDouble,
  Compass,
  Sparkles,
  Megaphone,
  ShieldCheck,
  Building2,
  Wallet,
  Settings,
  Headphones,
  Sun,
  Moon,
  Search,
  ChevronDown,
  LogOut,
  UserCheck,
  Layers,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useAppSelector } from '../../store/hooks';

export type NavTab =
  | 'overview'
  | 'bookings'
  | 'properties'
  | 'packages'
  | 'experiences'
  | 'ads'
  | 'hero'
  | 'approvals'
  | 'vendors'
  | 'users'
  | 'finance'
  | 'settlements'
  | 'settings'
  | 'support';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const router = useRouter();
  const { user, role, activeViewMode, logout } = useAuth();
  const { properties, packages, experiences, ads, bookings } = useData();
  const payouts = useAppSelector((state) => state.payouts.items);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Pending counts for admin
  const pendingProps = properties.filter((p) => p.status === 'pending_approval').length;
  const pendingPkgs = packages.filter((p) => p.status === 'pending_approval').length;
  const pendingExps = experiences.filter((p) => p.status === 'pending_approval').length;
  const pendingAds = ads.filter((a) => !a.approvedByAdmin).length;
  const totalPending = pendingProps + pendingPkgs + pendingExps + pendingAds;

  const pendingPayoutRequests = payouts.filter(
    (p) => p.status === 'requested' || p.status === 'audited_by_admin'
  ).length;

  const isAdmin = activeViewMode === 'admin';

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* User Profile Header Dropdown — Exactly like reference image */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-100 dark:ring-rose-950"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${isAdmin ? 'bg-rose-600' : 'bg-[#134E4A]'}`}>
                    {(user?.name || (isAdmin ? 'Admin' : 'Vendor'))[0].toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                    isAdmin ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
              <div className="truncate">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || 'Administrator'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isAdmin ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                  {isAdmin ? 'Admin • Ops Lead' : 'Vendor Host'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition shrink-0 ml-1" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute top-20 left-4 right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Active Session
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize flex items-center justify-between">
                  <span>{activeViewMode} Portal</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isAdmin
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {isAdmin ? 'Admin Operations' : 'Vendor Partner'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-1">
                  {user?.email}
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    router.push('/dashboard/vendors');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl font-medium transition cursor-pointer mb-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAdmin ? 'Vendor Verification Desk' : 'My Full KYC & Profile'}</span>
                </button>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-medium transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search input with hotkey - Matching reference image */}
        <div className="px-4 py-3">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-11 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />
            <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="px-3 py-2 space-y-6">
          {/* MAIN Section */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Main
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => onSelectTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'overview'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => onSelectTab('bookings')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'bookings'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Guests & Bookings</span>
                </div>
                {bookings.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {bookings.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectTab('properties')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'properties'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BedDouble className="w-4 h-4 shrink-0" />
                  <span>Hotels & Stays</span>
                </div>
                {pendingProps > 0 && isAdmin && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    {pendingProps}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectTab('packages')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'packages'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>Tour Packages</span>
                </div>
                {pendingPkgs > 0 && isAdmin && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    {pendingPkgs}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectTab('experiences')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'experiences'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Experiences</span>
                </div>
                {pendingExps > 0 && isAdmin && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    {pendingExps}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectTab('ads')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'ads'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-4 h-4 shrink-0" />
                  <span>Ad Campaigns</span>
                </div>
                {pendingAds > 0 && isAdmin && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    {pendingAds}
                  </span>
                )}
              </button>

              {/* Hero Carousel & Banners */}
              {isAdmin && (
                <button
                  onClick={() => onSelectTab('hero')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    currentTab === 'hero'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>Hero Carousel</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                    WebP
                  </span>
                </button>
              )}

              {/* Admin Approvals Center Queue */}
              {isAdmin && (
                <button
                  onClick={() => onSelectTab('approvals')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    currentTab === 'approvals'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Approvals Queue</span>
                  </div>
                  {totalPending > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                      {totalPending}
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* OTHERS Section */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Others
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => onSelectTab('vendors')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'vendors'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>{isAdmin ? 'Vendors & KYC' : 'My KYC & Documents'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => onSelectTab('users')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    currentTab === 'users'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Registered Users</span>
                </button>
              )}

              <button
                onClick={() => onSelectTab('finance')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'finance'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span>{isAdmin ? 'Financial Ledger' : 'My Payouts & Wallet'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => onSelectTab('settlements')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    currentTab === 'settlements'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="w-4 h-4 shrink-0" />
                    <span>Vendor Settlements</span>
                  </div>
                  {pendingPayoutRequests > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {pendingPayoutRequests}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => onSelectTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'settings'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => onSelectTab('support')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'support'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Headphones className="w-4 h-4 shrink-0" />
                <span>Support</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom bar with Light/Dark toggle pill — exactly like reference image */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => theme === 'dark' && onToggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                theme === 'light'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Light
            </button>
            <button
              onClick={() => theme === 'light' && onToggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                theme === 'dark'
                  ? 'bg-slate-700 text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-rose-400" />
              Dark
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
