'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import PlaceDetailEditView from '@/components/details/PlaceDetailEditView';

export default function PlaceDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  return <PlaceDetailEditView id={id} />;
}

