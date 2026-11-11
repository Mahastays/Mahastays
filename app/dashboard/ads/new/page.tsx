'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '../../../../components/common/DashboardSkeleton';

const CreateAdPageView = dynamic(() => import('../../../../components/details/CreateAdPageView'), {
  loading: () => <DashboardSkeleton type="cards" />,
  ssr: false,
});

export default function NewAdCampaignPage() {
  return <CreateAdPageView />;
}

