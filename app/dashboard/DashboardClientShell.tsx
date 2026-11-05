'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar, { NavTab } from '@/components/sidebar/Sidebar';
import Header from '@/components/header/Header';

// Lazy-loaded Modals for blazing-fast initial rendering
const CreatePropertyModal = dynamic(() => import('@/components/modals/CreatePropertyModal'), { ssr: false });
const CreatePackageModal = dynamic(() => import('@/components/modals/CreatePackageModal'), { ssr: false });
const CreateExperienceModal = dynamic(() => import('@/components/modals/CreateExperienceModal'), { ssr: false });
const CreateAdModal = dynamic(() => import('@/components/modals/CreateAdModal'), { ssr: false });
const RejectReasonModal = dynamic(() => import('@/components/modals/RejectReasonModal'), { ssr: false });

export const TAB_ROUTES: Record<NavTab, string> = {
  overview: '/dashboard',
  bookings: '/dashboard/guests',
  properties: '/dashboard/hotels',
  packages: '/dashboard/packages',
  experiences: '/dashboard/experience',
  ads: '/dashboard/ads',
  hero: '/dashboard/hero',
  approvals: '/dashboard/approvals',
  vendors: '/dashboard/vendors',
  users: '/dashboard/users',
  finance: '/dashboard/finance',
  settings: '/dashboard/settings',
  support: '/dashboard/support',
};

interface DashboardContextType {
  currentTab: NavTab;
  navigateTab: (tab: NavTab) => void;
  openCreateModal: (type: 'property' | 'package' | 'experience' | 'ad') => void;
  openRejectModal: (kind: 'property' | 'package' | 'experience' | 'vendor', id: string, name: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within DashboardClientShell');
  }
  return ctx;
}

export default function DashboardClientShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Modals state
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [adModalOpen, setAdModalOpen] = useState(false);

  // Rejection modal state
  const [rejectModalState, setRejectModalState] = useState<{
    isOpen: boolean;
    targetKind: 'property' | 'package' | 'experience' | 'vendor' | null;
    targetId: string;
    targetName: string;
  }>({
    isOpen: false,
    targetKind: null,
    targetId: '',
    targetName: '',
  });

  const getTabFromPath = (path: string): NavTab => {
    if (path.includes('/dashboard/guests') || path.includes('/dashboard/bookings')) return 'bookings';
    if (path.includes('/dashboard/hotels') || path.includes('/dashboard/properties')) return 'properties';
    if (path.includes('/dashboard/packages')) return 'packages';
    if (path.includes('/dashboard/experience')) return 'experiences';
    if (path.includes('/dashboard/hero')) return 'hero';
    if (path.includes('/dashboard/ads')) return 'ads';
    if (path.includes('/dashboard/approvals')) return 'approvals';
    if (path.includes('/dashboard/vendors')) return 'vendors';
    if (path.includes('/dashboard/users')) return 'users';
    if (path.includes('/dashboard/finance')) return 'finance';
    if (path.includes('/dashboard/settings')) return 'settings';
    if (path.includes('/dashboard/support')) return 'support';
    return 'overview';
  };

  const currentTab = getTabFromPath(pathname || '');

  const handleNavigateTab = (tab: NavTab) => {
    const route = TAB_ROUTES[tab] || '/dashboard';
    router.push(route);
  };

  const handleOpenCreateModal = (type: 'property' | 'package' | 'experience' | 'ad') => {
    if (type === 'property') router.push('/dashboard/hotels/new');
    else if (type === 'package') router.push('/dashboard/packages/new');
    else if (type === 'experience') router.push('/dashboard/experiences/new');
    else if (type === 'ad') setAdModalOpen(true);
  };

  const handleOpenRejectModal = (
    kind: 'property' | 'package' | 'experience' | 'vendor',
    id: string,
    name: string
  ) => {
    setRejectModalState({
      isOpen: true,
      targetKind: kind,
      targetId: id,
      targetName: name,
    });
  };

  const handleCloseRejectModal = () => {
    setRejectModalState({
      isOpen: false,
      targetKind: null,
      targetId: '',
      targetName: '',
    });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Auth Guard: Only authenticated users can see dashboard
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`);
    }
  }, [isAuthenticated, router, pathname]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Checking authorization...</h3>
        <p className="text-xs text-slate-500 mt-1">Redirecting to login if unauthenticated.</p>
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </div>
    );
  }

  return (
    <DashboardContext.Provider
      value={{
        currentTab,
        navigateTab: handleNavigateTab,
        openCreateModal: handleOpenCreateModal,
        openRejectModal: handleOpenRejectModal,
        theme,
        toggleTheme,
      }}
    >
      <div
        className={`min-h-screen ${
          theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        } flex transition-colors`}
      >
        {/* Left Fixed Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleNavigateTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
          {/* Top Sticky Header */}
          <Header
            currentTab={currentTab}
            onOpenCreateModal={handleOpenCreateModal}
            onNavigateTab={handleNavigateTab}
          />

          {/* Child Page Content */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1720px] mx-auto">{children}</main>
        </div>

        {/* Action and Creation Modals (lazy-mounted on demand) */}
        {propertyModalOpen && (
          <CreatePropertyModal
            isOpen={propertyModalOpen}
            onClose={() => setPropertyModalOpen(false)}
          />
        )}

        {packageModalOpen && (
          <CreatePackageModal
            isOpen={packageModalOpen}
            onClose={() => setPackageModalOpen(false)}
          />
        )}

        {experienceModalOpen && (
          <CreateExperienceModal
            isOpen={experienceModalOpen}
            onClose={() => setExperienceModalOpen(false)}
          />
        )}

        {adModalOpen && (
          <CreateAdModal isOpen={adModalOpen} onClose={() => setAdModalOpen(false)} />
        )}

        {rejectModalState.isOpen && (
          <RejectReasonModal
            isOpen={rejectModalState.isOpen}
            onClose={handleCloseRejectModal}
            targetKind={rejectModalState.targetKind}
            targetId={rejectModalState.targetId}
            targetName={rejectModalState.targetName}
          />
        )}
      </div>
    </DashboardContext.Provider>
  );
}
