'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import DashboardSkeleton from '../../../components/common/DashboardSkeleton';
import { useAuth } from '../../../context/AuthContext';
import { useDashboard } from '../DashboardClientShell';

const ApprovalsView = dynamic(() => import('../../../components/views/ApprovalsView'), {
  loading: () => <DashboardSkeleton type="cards" />,
  ssr: false,
});

export default function ApprovalsPage() {
  const { activeViewMode } = useAuth();
  const { openRejectModal } = useDashboard();

  if (activeViewMode !== 'admin') {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Admin Operations Restricted
        </h2>
        <p className="text-xs text-slate-500">
          The Approvals Queue is only accessible to MahaStays Platform Administrators. Vendor listings are submitted here for review.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <ApprovalsView onOpenRejectModal={openRejectModal} />;
}
