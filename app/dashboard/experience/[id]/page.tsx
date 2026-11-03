'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ExperienceDetailEditView from '../../../../components/details/ExperienceDetailEditView';

export default function ExperienceSingleDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  return <ExperienceDetailEditView id={id} />;
}
