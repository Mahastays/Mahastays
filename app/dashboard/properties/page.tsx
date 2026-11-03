'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '../../../components/common/DashboardSkeleton';
import { useDashboard } from '../DashboardClientShell';

const PropertiesView = dynamic(() => import('../../../components/views/PropertiesView'), {
  loading: () => <DashboardSkeleton type="cards" />,
  ssr: false,
});

export default function PropertiesAliasPage() {
  const { openCreateModal, openRejectModal } = useDashboard();

  return (
    <PropertiesView
      onOpenCreateModal={() => openCreateModal('property')}
      onOpenRejectModal={openRejectModal}
    />
  );
}
