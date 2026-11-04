'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '../../../components/common/DashboardSkeleton';
import { useAuth } from '../../../context/AuthContext';

const VendorsView = dynamic(() => import('../../../components/views/VendorsView'), {
  loading: () => <DashboardSkeleton type="table" />,
  ssr: false,
});

const VendorDetailView = dynamic(() => import('../../../components/details/VendorDetailView'), {
  loading: () => <DashboardSkeleton type="table" />,
  ssr: false,
});

export default function VendorsPage() {
  const { activeViewMode, user } = useAuth();

  // If logged in as a vendor, show their own full KYC & Business profile view
  if (activeViewMode !== 'admin') {
    const targetVendorId = user?.vendorId || user?.vendorCode || user?.id || '6adeef17f4597150f0c199a4';
    return <VendorDetailView id={targetVendorId} />;
  }

  // Admin view: All registered vendors catalog & verification desk
  return <VendorsView />;
}
