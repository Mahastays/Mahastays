'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '../../../components/common/DashboardSkeleton';

const VendorSettlementsView = dynamic(
  () => import('../../../components/views/VendorSettlementsView'),
  {
    loading: () => <DashboardSkeleton type="table" />,
    ssr: false,
  }
);

export default function VendorSettlementsPage() {
  return <VendorSettlementsView />;
}

