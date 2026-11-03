import { prisma } from '../src/lib/prisma';

async function main() {
  const admins = await prisma.admin.findMany({ select: { id: true, email: true, fullName: true, roleTitle: true } });
  const vendors = await prisma.vendor.findMany({ select: { id: true, email: true, businessName: true, displayName: true, vendorCode: true } });
  const properties = await prisma.property.findMany({ select: { id: true, name: true, vendorId: true, propertyType: true, city: true } });
  const packages = await prisma.package.findMany({ select: { id: true, title: true, vendorId: true } });
  const experiences = await prisma.experience.findMany({ select: { id: true, title: true, vendorId: true } });

  console.log('--- ADMINS ---', JSON.stringify(admins, null, 2));
  console.log('--- VENDORS ---', JSON.stringify(vendors, null, 2));
  console.log('--- PROPERTIES ---', JSON.stringify(properties, null, 2));
  console.log('--- PACKAGES ---', JSON.stringify(packages, null, 2));
  console.log('--- EXPERIENCES ---', JSON.stringify(experiences, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
