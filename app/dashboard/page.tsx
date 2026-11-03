'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '../../components/common/DashboardSkeleton';
import { useDashboard } from './DashboardClientShell';

const OverviewView = dynamic(() => import('../../components/views/OverviewView'), {
  loading: () => <DashboardSkeleton type="table" />,
  ssr: false,
});

export default function DashboardOverviewPage() {
  const { navigateTab, openCreateModal } = useDashboard();

  return (
    <OverviewView
      onNavigateTab={navigateTab}
      onOpenCreateModal={openCreateModal}
    />
  );
}
