'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '../../../components/common/DashboardSkeleton';

const BookingsView = dynamic(() => import('../../../components/views/BookingsView'), {
  loading: () => <DashboardSkeleton type="table" />,
  ssr: false,
});

export default function BookingsAliasPage() {
  return <BookingsView />;
}
