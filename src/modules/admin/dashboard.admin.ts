import { prisma } from '../../lib/prisma';
import { todayIST } from '../../utils/dates';

/** Platform-wide counters for the operations dashboard. */
export async function platformDashboard() {
  const today = todayIST();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const startOfToday = new Date(`${today}T00:00:00+05:30`);
  const paid = { confirmedAt: { gte: since }, paymentStatus: { in: ['paid' as const, 'partially_refunded' as const] } };
  const sums = { grandTotalInr: true, commissionAmountInr: true, vendorShareInr: true } as const;

  const [users, vendorsPending, vendorsUnderReview, vendorsActive, propsPending, pkgsPending, expsPending, reviewsPending, adsPending, payoutsOpen, stays, packages, experiences, newToday, newUsersToday] =
    await Promise.all([
      prisma.user.count({ where: { status: 'active' } }),
      prisma.vendor.count({ where: { compliance: { is: { verificationStatus: 'pending' } } } }),
      prisma.vendor.count({ where: { compliance: { is: { verificationStatus: 'under_review' } } } }),
      prisma.vendor.count({ where: { status: 'active' } }),
      prisma.property.count({ where: { status: 'pending_approval' } }),
      prisma.package.count({ where: { status: 'pending_approval' } }),
      prisma.experience.count({ where: { status: 'pending_approval' } }),
      prisma.review.count({ where: { status: 'pending_moderation' } }),
      prisma.adCampaign.count({ where: { approvedByAdmin: false } }),
      prisma.vendorPayout.count({ where: { status: { in: ['requested', 'audited_by_admin', 'released_by_superadmin'] } } }),
      prisma.stayBooking.aggregate({ where: paid, _sum: sums, _count: { _all: true } }),
      prisma.packageBooking.aggregate({ where: paid, _sum: sums, _count: { _all: true } }),
      prisma.experienceBooking.aggregate({ where: paid, _sum: sums, _count: { _all: true } }),
      prisma.stayBooking.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    ]);

  const total = (f: 'grandTotalInr' | 'commissionAmountInr' | 'vendorShareInr') => (stays._sum[f] ?? 0) + (packages._sum[f] ?? 0) + (experiences._sum[f] ?? 0);
  return {
    date: today,
    users: { active: users, newToday: newUsersToday },
    vendors: { active: vendorsActive, awaitingKyc: vendorsPending, underReview: vendorsUnderReview },
    queues: { propertiesPending: propsPending, packagesPending: pkgsPending, experiencesPending: expsPending, reviewsPending, adsPending, payoutsOpen },
    bookingsCreatedToday: { stays: newToday },
    last30Days: {
      confirmedBookings: stays._count._all + packages._count._all + experiences._count._all,
      gmvInr: total('grandTotalInr'),
      platformCommissionInr: total('commissionAmountInr'),
      vendorShareInr: total('vendorShareInr'),
      byType: {
        stays: { bookings: stays._count._all, gmvInr: stays._sum.grandTotalInr ?? 0 },
        packages: { bookings: packages._count._all, gmvInr: packages._sum.grandTotalInr ?? 0 },
        experiences: { bookings: experiences._count._all, gmvInr: experiences._sum.grandTotalInr ?? 0 },
      },
    },
  };
}
