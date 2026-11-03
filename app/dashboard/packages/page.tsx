'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '../../../components/common/DashboardSkeleton';
import { useDashboard } from '../DashboardClientShell';

const PackagesView = dynamic(() => import('../../../components/views/PackagesView'), {
  loading: () => <DashboardSkeleton type="cards" />,
  ssr: false,
});

export default function PackagesPage() {
  const { openCreateModal, openRejectModal } = useDashboard();

  return (
    <PackagesView
      onOpenCreateModal={() => openCreateModal('package')}
      onOpenRejectModal={openRejectModal}
    />
  );
}
