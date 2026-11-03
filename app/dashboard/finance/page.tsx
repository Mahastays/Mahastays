'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '../../../components/common/DashboardSkeleton';

const FinanceView = dynamic(() => import('../../../components/views/FinanceView'), {
  loading: () => <DashboardSkeleton type="table" />,
  ssr: false,
});

export default function FinancePage() {
  return <FinanceView />;
}
