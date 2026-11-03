'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '../../../components/common/DashboardSkeleton';
import { useDashboard } from '../DashboardClientShell';

const AdsView = dynamic(() => import('../../../components/views/AdsView'), {
  loading: () => <DashboardSkeleton type="cards" />,
  ssr: false,
});

export default function AdsPage() {
  const { openCreateModal } = useDashboard();

  return <AdsView onOpenCreateModal={() => openCreateModal('ad')} />;
}
