import { prisma } from '../src/lib/prisma';

async function main() {
  const s = await prisma.stayBooking.count();
  const p = await prisma.packageBooking.count();
  const e = await prisma.experienceBooking.count();
  const sampleStays = await prisma.stayBooking.findMany({ take: 3, select: { id: true, bookingReference: true, vendorId: true, propertyId: true, bookingStatus: true } });
  console.log({ stays: s, packages: p, experiences: e, sampleStays });
}

main().catch(console.error).finally(() => prisma.$disconnect());
