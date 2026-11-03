import { prisma } from '../src/lib/prisma';
import { generateRecoveryKeys } from '../src/modules/auth/auth.service';
import { encrypt, hashPassword } from '../src/utils/crypto';
import { generateTotpSecret } from '../src/utils/totp';

async function main() {
  const email = process.env.SEED_SUPERADMIN_EMAIL || 'root@mahastays.com';
  const plainPassword = process.env.SEED_SUPERADMIN_PASSWORD || 'ChangeMe@12345';
  const plainPin = process.env.SEED_SUPERADMIN_PIN || process.env.SEED_MASTER_PIN || '123456';
  const username = process.env.SEED_SUPERADMIN_USERNAME || 'superadmin';

  const passwordHash = await hashPassword(plainPassword);
  const masterPinHash = await hashPassword(plainPin);
  const totpSecret = generateTotpSecret();
  const recovery = generateRecoveryKeys();

  const sa = await prisma.superAdmin.upsert({
    where: { email },
    update: {
      passwordHash,
      masterPinHash,
      status: 'active',
    },
    create: {
      username,
      fullName: 'Mahastays SuperAdmin',
      email,
      phone: '+919000000001',
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

  console.log(`✅ SuperAdmin account created/verified: ${sa.email}`);
  console.log(`   Email: ${sa.email}`);
  console.log(`   Password: ${plainPassword}`);
  console.log(`   Master PIN: ${plainPin}`);
}

main()
  .catch((e) => {
    console.error('❌ Failed to create superadmin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
