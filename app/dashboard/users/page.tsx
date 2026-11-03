'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '../../../components/common/DashboardSkeleton';

const UsersView = dynamic(() => import('../../../components/views/UsersView'), {
  loading: () => <DashboardSkeleton type="table" />,
  ssr: false,
});

export default function UsersPage() {
  return <UsersView />;
}

