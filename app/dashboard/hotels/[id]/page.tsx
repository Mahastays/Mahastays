'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import HotelDetailEditView from '../../../../components/details/HotelDetailEditView';

export default function HotelDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  return <HotelDetailEditView id={id} />;
}
