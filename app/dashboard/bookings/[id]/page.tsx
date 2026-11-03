'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import BookingDetailView from '../../../../components/details/BookingDetailView';

export default function BookingDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  return <BookingDetailView id={id} />;
}
