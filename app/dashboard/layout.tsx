import React, { Suspense } from 'react';
import DashboardClientShell from './DashboardClientShell';
import DashboardSkeleton from '../../components/common/DashboardSkeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardClientShell>
      <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
    </DashboardClientShell>
  );
}
