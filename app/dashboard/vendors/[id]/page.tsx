'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import VendorDetailView from '../../../../components/details/VendorDetailView';

export default function VendorDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  return <VendorDetailView id={id} />;
}
