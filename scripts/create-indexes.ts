/**
 * Creates the MongoDB indexes Prisma's schema language cannot express:
 *   • PARTIAL unique indexes for optional-but-unique fields (Prisma's @unique on optional fields is NOT sparse,
 *     so only one document could ever be missing the value)
 *   • TTL indexes that make MongoDB delete expired refresh tokens / OTPs by itself
 *   • lat/lng indexes on nested documents used by the "near me" searches
 * Idempotent. Run after `prisma db push`:   npm run db:indexes
 */
import { prisma } from '../src/lib/prisma';

type IndexSpec = { collection: string; name: string; key: Record<string, 1 | -1>; unique?: boolean; partial?: Record<string, unknown>; ttlSeconds?: number };

const string = { $type: 'string' };

const INDEXES: IndexSpec[] = [
  // optional + unique
  { collection: 'users', name: 'phone_unique_partial', key: { 'phone.countryCode': 1, 'phone.nationalNumber': 1 }, unique: true, partial: { 'phone.nationalNumber': string } },
  { collection: 'users', name: 'auth_provider_unique_partial', key: { authProvider: 1, authProviderId: 1 }, unique: true, partial: { authProviderId: string } },
  { collection: 'payments', name: 'invoice_number_unique_partial', key: { invoiceNumber: 1 }, unique: true, partial: { invoiceNumber: string } },
  { collection: 'payments', name: 'gateway_payment_unique_partial', key: { gatewayPaymentId: 1 }, unique: true, partial: { gatewayPaymentId: string } },

  // self-cleaning collections
  { collection: 'refresh_tokens', name: 'expires_ttl', key: { expiresAt: 1 }, ttlSeconds: 0 }, // gone the moment they expire
  { collection: 'one_time_codes', name: 'expires_ttl', key: { expiresAt: 1 }, ttlSeconds: 86_400 }, // kept 1 day for diagnostics

  // geo-style lookups on embedded coordinates
  { collection: 'properties', name: 'address_lat_lng', key: { 'address.lat': 1, 'address.lng': 1 } },
  { collection: 'experiences', name: 'coordinates_lat_lng', key: { 'coordinates.lat': 1, 'coordinates.lng': 1 } },
];

async function main(): Promise<void> {
  for (const spec of INDEXES) {
    const index: Record<string, unknown> = { key: spec.key, name: spec.name };
    if (spec.unique) index.unique = true;
    if (spec.partial) index.partialFilterExpression = spec.partial;
    if (spec.ttlSeconds !== undefined) index.expireAfterSeconds = spec.ttlSeconds;
    try {
      await prisma.$runCommandRaw({ createIndexes: spec.collection, indexes: [index] } as never);
      console.log(`✓ ${spec.collection}.${spec.name}`); // eslint-disable-line no-console
    } catch (err) {
      // e.g. an index with the same name but different options already exists, or duplicate data blocks a unique index
      console.error(`✗ ${spec.collection}.${spec.name}: ${(err as Error).message}`); // eslint-disable-line no-console
      process.exitCode = 1;
    }
  }
}

main().finally(() => prisma.$disconnect());
