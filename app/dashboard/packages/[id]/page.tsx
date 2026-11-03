'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import PackageDetailEditView from '../../../../components/details/PackageDetailEditView';

export default function PackageDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  return <PackageDetailEditView id={id} />;
}
