/**
 * Seeds a runnable demo: platform config, one super-admin / admin / sub-admin, two approved vendors,
 * a demo customer (club member), and the spec's sample catalog + an ad campaign.
 * Idempotent — safe to run repeatedly. Refuses to run in production unless ALLOW_SEED_IN_PRODUCTION=true.
 */
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { createAd } from '../src/modules/ads/ad.service';
import { createExperience } from '../src/modules/experiences/experience.service';
import { createPackage } from '../src/modules/packages/package.service';
import { createProperty } from '../src/modules/properties/property.service';
import { generateRecoveryKeys } from '../src/modules/auth/auth.service';
import { createExperienceSchema } from '../src/modules/experiences/experience.schemas';
import { createPackageSchema } from '../src/modules/packages/package.schemas';
import { createPropertySchema } from '../src/modules/properties/property.schemas';
import { getPlatformConfig } from '../src/services/platformConfig.service';
import { generateActorCode } from '../src/utils/codes';
import { encrypt, hashPassword } from '../src/utils/crypto';
import { generateTotpSecret } from '../src/utils/totp';
import { buildPackages, experiencesData, hillViewProperty, strawberryVillaProperty } from './seed.data';

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? 'Demo@12345';
const SUPER_EMAIL = process.env.SEED_SUPERADMIN_EMAIL ?? 'superadmin@mahastays.local';
const SUPER_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD ?? 'ChangeMe@12345';
const MASTER_PIN = process.env.SEED_MASTER_PIN ?? '246810';

const log = (msg: string) => console.log(msg); // eslint-disable-line no-console

async function seedStaff(): Promise<{ adminId: string; credentials: string[] }> {
  const credentials: string[] = [];

  // Super Admin
  let superAdmin = await prisma.superAdmin.findUnique({ where: { email: SUPER_EMAIL } });
  if (!superAdmin) {
    const secret = process.env.SEED_SUPERADMIN_TOTP_SECRET ?? generateTotpSecret();
    const recovery = generateRecoveryKeys();
    superAdmin = await prisma.superAdmin.create({
      data: {
        username: 'root_superadmin',
        fullName: 'Platform Owner',
        email: SUPER_EMAIL,
        phone: '+919999900000',
        passwordHash: await hashPassword(SUPER_PASSWORD),
        masterPinHash: await hashPassword(MASTER_PIN),
        security: { isTwoFactorEnabled: true, twoFactorSecretEnc: encrypt(secret), allowedIpWhitelists: [] },
        isTwoFactorEnforced: true,
        recoveryKeyHashes: recovery.hashes,
      },
    });
    credentials.push(
      '── SUPER-ADMIN ───────────────────────────────────────────────',
      `  email:        ${SUPER_EMAIL}`,
      `  password:     ${SUPER_PASSWORD}`,
      `  master PIN:   ${MASTER_PIN}`,
    );
  } else {
    credentials.push(`── super-admin ${SUPER_EMAIL} ready`);
  }

  // Admin 1
  let admin1 = await prisma.admin.findUnique({ where: { email: 'ops.lead@mahastays.local' } });
  if (!admin1) {
    admin1 = await prisma.admin.create({
      data: {
        adminCode: await generateActorCode('ADM'),
        fullName: 'Operations Lead',
        email: 'ops.lead@mahastays.local',
        phone: '+919999900001',
        passwordHash: await hashPassword(DEMO_PASSWORD),
        roleTitle: 'Operations Lead — Western Maharashtra',
        permissions: {
          canApproveVendors: true, canApproveProperties: true, canApprovePackages: true, canApproveExperiences: true, canApproveAdCampaigns: true,
          canProcessOverridesAndDisputes: true, canManageSubAdmins: true, canExportFinancialReports: true, canBlockListings: true,
        },
        security: { isTwoFactorEnabled: false, allowedIpWhitelists: [] },
      },
    });
  }
  credentials.push(`  admin 1:      ops.lead@mahastays.local / ${DEMO_PASSWORD}`);

  // Admin 2
  let admin2 = await prisma.admin.findUnique({ where: { email: 'compliance.lead@mahastays.local' } });
  if (!admin2) {
    admin2 = await prisma.admin.create({
      data: {
        adminCode: await generateActorCode('ADM'),
        fullName: 'Compliance & Quality Lead',
        email: 'compliance.lead@mahastays.local',
        phone: '+919999900003',
        passwordHash: await hashPassword(DEMO_PASSWORD),
        roleTitle: 'Compliance & Quality Officer',
        permissions: {
          canApproveVendors: true, canApproveProperties: true, canApprovePackages: true, canApproveExperiences: true, canApproveAdCampaigns: true,
          canProcessOverridesAndDisputes: false, canManageSubAdmins: false, canExportFinancialReports: true, canBlockListings: true,
        },
        security: { isTwoFactorEnabled: false, allowedIpWhitelists: [] },
      },
    });
  }
  credentials.push(`  admin 2:      compliance.lead@mahastays.local / ${DEMO_PASSWORD}`);

  return { adminId: admin1.id, credentials };
}

async function seedVendor(input: { email: string; businessName: string; displayName: string; displayRole: string; experienceSummary: string; category: 'property_host' | 'activity_operator' | 'integrated_resort'; gstin: string; pan: string }, adminId: string) {
  const existing = await prisma.vendor.findUnique({ where: { email: input.email } });
  if (existing) return existing;
  const cfg = await getPlatformConfig();
  return prisma.vendor.create({
    data: {
      vendorCode: await generateActorCode('VND'),
      businessType: 'private_limited',
      category: input.category,
      businessName: input.businessName,
      displayName: input.displayName,
      displayRole: input.displayRole,
      experienceSummary: input.experienceSummary,
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      email: input.email,
      phone: '+919822000000',
      passwordHash: await hashPassword(DEMO_PASSWORD),
      contact: {
        primaryContactPerson: input.displayName,
        registeredOfficeAddress: { addressLine1: 'Plot 12, Venna Lake Road', city: 'Mahabaleshwar', district: 'Satara', state: 'Maharashtra', pincode: '412806', country: 'India' },
      },
      compliance: {
        panNumber: input.pan,
        gstin: input.gstin,
        tourismLicenseNumber: 'MTDC/2018/04512',
        identityProofUrl: 'https://example.com/kyc/identity.pdf',
        businessProofUrl: 'https://example.com/kyc/business.pdf',
        verificationStatus: 'approved',
        verifiedAt: new Date(),
        verifiedByAdminId: adminId,
      },
      banking: {
        accountHolderName: input.businessName,
        accountNumberEnc: encrypt('123456789012'),
        accountNumberLast4: '9012',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0001234',
        branchName: 'Mahabaleshwar',
        isAccountVerified: true,
      },
      commissionTerms: {
        commissionType: 'percentage',
        propertyCommissionRatePercent: cfg.defaultCommission.propertyCommissionRatePercent,
        packageCommissionRatePercent: cfg.defaultCommission.packageCommissionRatePercent,
        experienceCommissionRatePercent: cfg.defaultCommission.experienceCommissionRatePercent,
        payoutCycle: cfg.defaultCommission.payoutCycle,
      },
      status: 'active',
    },
  });
}

async function main(): Promise<void> {
  if (env.isProd && process.env.ALLOW_SEED_IN_PRODUCTION !== 'true') {
    throw new Error('Refusing to seed a production database (set ALLOW_SEED_IN_PRODUCTION=true to override).');
  }
  log('🌱 Seeding Mahastays (2 Users, 2 Admins, 2 Vendors, 2 Properties, 2 Packages, 2 Experiences, 2 Ads)…');
  await getPlatformConfig();

  // 1. Staff / Admins (2 Admins)
  const { adminId, credentials } = await seedStaff();

  // 2. Vendors (2 Vendors)
  const resortVendor = await seedVendor(
    { email: 'host@hillview.local', businessName: 'HillView Hospitality Pvt Ltd', displayName: 'Vikramaditya & Team', displayRole: 'Resort General Manager', experienceSummary: 'Host since 2018 · 128+ Verified Reviews', category: 'integrated_resort', gstin: '27ABCDE1234F1Z5', pan: 'ABCDE1234F' },
    adminId,
  );
  const adventureVendor = await seedVendor(
    { email: 'guide@sahyadri.local', businessName: 'Sahyadri Adventure Co.', displayName: 'Rajesh Gaikwad', displayRole: 'Lead Mountain Guide', experienceSummary: '12 years guiding in the Sahyadris', category: 'activity_operator', gstin: '27FGHIJ5678K1Z2', pan: 'FGHIJ5678K' },
    adminId,
  );

  // 3. Customers / Users (2 Users)
  let user1 = await prisma.user.findUnique({ where: { email: 'traveler@mahastays.local' } });
  if (!user1) {
    user1 = await prisma.user.create({
      data: {
        userCode: await generateActorCode('USR'),
        fullName: 'Rohan Joshi',
        email: 'traveler@mahastays.local',
        passwordHash: await hashPassword(DEMO_PASSWORD),
        phone: { countryCode: '+91', nationalNumber: '9876543210', isVerified: true },
        membership: { isClubMember: true, tier: 'gold', joinedAt: new Date() },
        preferences: { preferredLanguage: 'en', currency: 'INR', dietaryPreference: 'veg' },
        verification: { isEmailVerified: true, isPhoneVerified: true, isIdVerified: false },
      },
    });
  }

  let user2 = await prisma.user.findUnique({ where: { email: 'asha@mahastays.local' } });
  if (!user2) {
    user2 = await prisma.user.create({
      data: {
        userCode: await generateActorCode('USR'),
        fullName: 'Asha Patil',
        email: 'asha@mahastays.local',
        passwordHash: await hashPassword(DEMO_PASSWORD),
        phone: { countryCode: '+91', nationalNumber: '9876543211', isVerified: true },
        membership: { isClubMember: true, tier: 'platinum', joinedAt: new Date() },
        preferences: { preferredLanguage: 'en', currency: 'INR', dietaryPreference: 'all' },
        verification: { isEmailVerified: true, isPhoneVerified: true, isIdVerified: true },
      },
    });
  }

  const activate = { status: 'active' as const, approvedAt: new Date(), approvedByAdminId: adminId };

  // 4. Properties (2 Properties)
  let property1 = await prisma.property.findFirst({ where: { name: hillViewProperty.name } });
  if (!property1) {
    const created = await createProperty(resortVendor.id, createPropertySchema.parse(hillViewProperty));
    property1 = await prisma.property.update({
      where: { id: created.id },
      data: { ...activate, featured: true, rating: 4.8, reviewsCount: 128, ratingBreakdown: { cleanliness: 4.9, accuracy: 5.0, communication: 4.9, location: 4.8, checkIn: 5.0, value: 4.9 } },
    });
  }

  let property2 = await prisma.property.findFirst({ where: { name: strawberryVillaProperty.name } });
  if (!property2) {
    const created = await createProperty(resortVendor.id, createPropertySchema.parse(strawberryVillaProperty));
    property2 = await prisma.property.update({
      where: { id: created.id },
      data: { ...activate, featured: true, rating: 4.9, reviewsCount: 94, ratingBreakdown: { cleanliness: 5.0, accuracy: 4.9, communication: 5.0, location: 4.9, checkIn: 4.8, value: 4.8 } },
    });
  }

  // 5. Experiences (2 Experiences)
  const ensureExperience = async (key: keyof typeof experiencesData, rating: number, reviews: number) => {
    const data = experiencesData[key];
    const existing = await prisma.experience.findFirst({ where: { title: data.title } });
    if (existing) return existing;
    const created = await createExperience(adventureVendor.id, createExperienceSchema.parse(data));
    return prisma.experience.update({ where: { id: created.id }, data: { ...activate, rating, reviewsCount: reviews, featured: true } });
  };
  const trek = await ensureExperience('trek', 4.9, 210);
  const boating = await ensureExperience('boating', 4.7, 142);

  // 6. Packages (2 Packages)
  const packages = buildPackages({ propertyId: property1.id, gamesExperienceId: trek.id, boatingExperienceId: boating.id });
  for (const [i, p] of packages.entries()) {
    if (await prisma.package.findFirst({ where: { title: p.title } })) continue;
    const created = await createPackage(resortVendor.id, createPackageSchema.parse(p));
    await prisma.package.update({ where: { id: created.id }, data: { ...activate, featured: true, rating: i === 0 ? 4.9 : 4.6, reviewsCount: i === 0 ? 41 : 18 } });
  }

  // 7. Ads (2 Ads)
  const anniversaryPackage = await prisma.package.findFirstOrThrow({ where: { title: packages[0].title } });

  if (!(await prisma.adCampaign.findFirst({ where: { adName: 'Anniversary Special Homepage' } }))) {
    await createAd(
      { role: 'staff', staff: { role: 'admin', id: adminId, fullName: 'Operations Lead' } },
      {
        adName: 'Anniversary Special Homepage',
        adType: 'banner',
        placement: 'homepage',
        target: { targetType: 'package', targetId: anniversaryPackage.id },
        creative: {
          headline: 'Romantic Anniversary Special in Mahabaleshwar',
          subHeadline: 'Flower-bed welcome, candlelight dinner & lake boating',
          imageUrl: 'https://picsum.photos/seed/ad-anniversary/1600/600',
          badgeText: 'Couple Special',
          buttonText: 'Book Anniversary Package',
        },
        targeting: { locations: ['Mumbai', 'Pune', 'Mahabaleshwar'], userRoles: [], interests: ['honeymoon', 'luxury', 'lake-view'], occasions: ['anniversary', 'weekend'], device: [], showOnPages: ['/', '/packages'] },
        budget: { totalBudget: 50000, dailyBudget: 2500, costPerClick: 6, costPerImpression: 0.05 },
        priority: 10,
        isActive: true,
      },
    );
  }

  if (!(await prisma.adCampaign.findFirst({ where: { adName: 'Sahyadri Trek & Stay Promo' } }))) {
    await createAd(
      { role: 'staff', staff: { role: 'admin', id: adminId, fullName: 'Operations Lead' } },
      {
        adName: 'Sahyadri Trek & Stay Promo',
        adType: 'banner',
        placement: 'homepage',
        target: { targetType: 'property', targetId: property2.id },
        creative: {
          headline: 'Escape to Strawberry Hills: Luxury Villas & Sunrise Treks',
          subHeadline: 'Private strawberry orchards, colonial stone suites & guided sunrise hikes',
          imageUrl: 'https://picsum.photos/seed/ad-sahyadri/1600/600',
          badgeText: 'Monsoon Special',
          buttonText: 'Explore Strawberry Villa',
        },
        targeting: { locations: ['Mumbai', 'Pune', 'Satara'], userRoles: [], interests: ['villa', 'farmstay', 'nature'], occasions: ['weekend'], device: [], showOnPages: ['/', '/explore'] },
        budget: { totalBudget: 40000, dailyBudget: 2000, costPerClick: 5, costPerImpression: 0.04 },
        priority: 9,
        isActive: true,
      },
    );
  }

  log('\n✅ Seed complete successfully!\n');
  log(credentials.join('\n'));
  log(`
── Demo Accounts (Password for all: ${DEMO_PASSWORD}) ──────────────
  Customer 1: traveler@mahastays.local (Club Gold Member)
  Customer 2: asha@mahastays.local     (Club Platinum Member)
  Admin 1:    ops.lead@mahastays.local
  Admin 2:    compliance.lead@mahastays.local
  Vendor 1:   host@hillview.local      (HillView Hospitality Resort)
  Vendor 2:   guide@sahyadri.local     (Sahyadri Adventure Co.)
`);
}

main()
  .catch((err) => {
    console.error(err); // eslint-disable-line no-console
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
