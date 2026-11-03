'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';

const HeroSlidesView = dynamic(() => import('@/components/views/HeroSlidesView'), {
  loading: () => <DashboardSkeleton type="table" />,
  ssr: false,
});

export default function DashboardHeroPage() {
  return <HeroSlidesView />;
}

