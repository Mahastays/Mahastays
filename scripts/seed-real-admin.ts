import { prisma } from '../src/lib/prisma';
import { hashPassword, encrypt } from '../src/utils/crypto';
import { generateTotpSecret } from '../src/utils/totp';
import { generateRecoveryKeys } from '../src/modules/auth/auth.service';

async function seedRealAdmin() {
  const email = 'bookingmahastays@gmail.com';
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Mahastays@2026';
  const phone = '+917741002157';
  const fullName = 'MahaStays Admin';

  const passwordHash = await hashPassword(initialPassword);
  const masterPinHash = await hashPassword('246810');
  const totpSecret = generateTotpSecret();
  const recovery = generateRecoveryKeys();

  console.log(`⏳ Seeding/upserting admin account for ${email}...`);

  // 1. Upsert SuperAdmin
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email },
    update: {
      passwordHash,
      masterPinHash,
      status: 'active',
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      username: 'bookingmahastays',
      fullName,
      email,
      phone,
      passwordHash,
      masterPinHash,
      security: {
        isTwoFactorEnabled: false,
        twoFactorSecretEnc: encrypt(totpSecret),
        allowedIpWhitelists: [],
      },
      isTwoFactorEnforced: false,
      recoveryKeyHashes: recovery.hashes,
      status: 'active',
    },
  });

  console.log(`✅ SuperAdmin account synced: ${superAdmin.email} (ID: ${superAdmin.id})`);

  // 2. Upsert Admin
  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      fullName,
      phone,
      passwordHash,
      roleTitle: 'Platform Owner & Executive Administrator',
      permissions: {
        canApproveVendors: true,
        canApproveProperties: true,
        canApprovePackages: true,
        canApproveExperiences: true,
        canApproveAdCampaigns: true,
        canProcessOverridesAndDisputes: true,
        canManageSubAdmins: true,
        canExportFinancialReports: true,
        canBlockListings: true,
      },
      status: 'active',
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      adminCode: 'ADM-100',
      fullName,
      email,
      phone,
      passwordHash,
      roleTitle: 'Platform Owner & Executive Administrator',
      permissions: {
        canApproveVendors: true,
        canApproveProperties: true,
        canApprovePackages: true,
        canApproveExperiences: true,
        canApproveAdCampaigns: true,
        canProcessOverridesAndDisputes: true,
        canManageSubAdmins: true,
        canExportFinancialReports: true,
        canBlockListings: true,
      },
      security: {
        isTwoFactorEnabled: false,
        allowedIpWhitelists: [],
      },
      status: 'active',
    },
  });

  console.log(`✅ Admin account synced: ${admin.email} (Code: ${admin.adminCode}, ID: ${admin.id})`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Admin Email:     ${email}`);
  console.log(`  Initial Password: ${initialPassword}`);
  console.log('═══════════════════════════════════════════════════════════');
}

seedRealAdmin()
  .catch((e) => {
    console.error('❌ Failed to seed real admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

