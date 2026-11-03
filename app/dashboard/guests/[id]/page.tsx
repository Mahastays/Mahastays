'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import UserDetailHistoryView from '../../../../components/details/UserDetailHistoryView';

export default function GuestDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  return <UserDetailHistoryView id={id} />;
}
