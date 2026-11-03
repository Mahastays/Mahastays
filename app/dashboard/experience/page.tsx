'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '../../../components/common/DashboardSkeleton';
import { useDashboard } from '../DashboardClientShell';

const ExperiencesView = dynamic(() => import('../../../components/views/ExperiencesView'), {
  loading: () => <DashboardSkeleton type="cards" />,
  ssr: false,
});

export default function ExperiencePage() {
  const { openCreateModal, openRejectModal } = useDashboard();

  return (
    <ExperiencesView
      onOpenCreateModal={() => openCreateModal('experience')}
      onOpenRejectModal={openRejectModal}
    />
  );
}
