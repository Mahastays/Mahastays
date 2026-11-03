/**
 * Generates API documentation FROM THE CODE, so it cannot drift:
 *   docs/ENDPOINTS.md                          every route + who may call it (permission flags included)
 *   postman/Mahastays.postman_collection.json  importable collection with sample bodies
 * No database or .env needed.    Run:  npm run docs:generate
 */
import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import express from 'express';

// ── 1) harmless env + stub Prisma so importing the routes never touches a database ──
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'mongodb://localhost:27017/docs?replicaSet=rs0';
process.env.JWT_ACCESS_SECRET ??= 'docs-docs-docs-docs-docs-docs-docs-docs';
process.env.ENCRYPTION_KEY ??= 'docs-docs-docs-docs-docs-docs-docs-docs';
const loader = Module as unknown as {
  _load: (request: string, parent: unknown, ...rest: unknown[]) => unknown;
  _resolveFilename: (request: string, parent: unknown) => string;
};
const originalLoad = loader._load;
loader._load = function (request: string, parent: unknown, ...rest: unknown[]) {
  try {
    // match on the RESOLVED path: modules import it as '../lib/prisma' and as './prisma'
    if (/[\\/]lib[\\/]prisma\.(ts|js)$/.test(loader._resolveFilename(request, parent))) return { prisma: {} };
  } catch {
    /* not resolvable here — fall through to the normal loader */
  }
  return originalLoad.call(this, request, parent, ...rest);
};

// ── 2) record every route registration by wrapping express.Router ──
interface Rec {
  routes: { method: string; path: string; handlers: unknown[] }[];
  children: { path: string; router: unknown }[];
}
const registry = new WeakMap<object, Rec>();
const OriginalRouter = express.Router;
(express as unknown as { Router: unknown }).Router = (...args: Parameters<typeof OriginalRouter>) => {
  const router = OriginalRouter(...args) as unknown as Record<string, (...a: unknown[]) => unknown>;
  const rec: Rec = { routes: [], children: [] };
  registry.set(router, rec);
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    const original = router[method].bind(router);
    router[method] = (p: unknown, ...handlers: unknown[]) => {
      if (typeof p === 'string') rec.routes.push({ method: method.toUpperCase(), path: p, handlers });
      return original(p, ...handlers);
    };
  }
  const originalUse = router.use.bind(router);
  router.use = (...a: unknown[]) => {
    const [first, ...rest] = a;
    const mountPath = typeof first === 'string' ? first : '';
    for (const child of typeof first === 'string' ? rest : a) if (registry.has(child as object)) rec.children.push({ path: mountPath, router: child });
    return originalUse(...a);
  };
  return router as unknown as ReturnType<typeof OriginalRouter>;
};

/* eslint-disable @typescript-eslint/no-require-imports */
const { readAccess } = require('../src/middlewares/access') as typeof import('../src/middlewares/access');
const { apiRouter } = require('../src/routes') as typeof import('../src/routes');
const seed = require('../prisma/seed.data') as typeof import('../prisma/seed.data');
/* eslint-enable @typescript-eslint/no-require-imports */

interface Endpoint {
  method: string;
  path: string;
  access: string;
}

/** Endpoints whose protection is not a role guard. */
const NOTES: Record<string, string> = {
  'POST /api/v1/payments/verify-webhook': 'public — authenticated by the gateway\'s HMAC signature (raw body)',
  'POST /api/v1/payments/mock/capture': 'user — DEV ONLY (PAYMENT_GATEWAY=mock, disabled in production)',
  'GET /api/v1/health': 'public — liveness probe',
  'GET /api/v1/health/ready': 'public — readiness probe (checks MongoDB / Redis)',
};

const join = (a: string, b: string) => (b === '/' ? a : `${a}${b}`).replace(/\/+$/, '') || '/';

function walk(router: unknown, prefix: string, out: Endpoint[]): void {
  const rec = registry.get(router as object);
  if (!rec) return;
  for (const r of rec.routes) {
    const labels = r.handlers.map(readAccess).filter(Boolean) as string[];
    const fullPath = join(prefix, r.path);
    out.push({ method: r.method, path: fullPath, access: NOTES[`${r.method} ${fullPath}`] ?? (labels.length ? labels.join('  ·  ') : 'public') });
  }
  for (const c of rec.children) walk(c.router, join(prefix, c.path), out);
}

const endpoints: Endpoint[] = [];
walk(apiRouter, '/api/v1', endpoints);

// ── 3) docs/ENDPOINTS.md ──
const groupOf = (p: string) => p.split('/')[3] ?? 'root';
const groups = new Map<string, Endpoint[]>();
for (const e of endpoints) groups.set(groupOf(e.path), [...(groups.get(groupOf(e.path)) ?? []), e]);

const TITLES: Record<string, string> = {
  health: 'Health', config: 'Public pricing config', auth: 'Authentication', users: 'Customer profile', vendor: 'Vendor portal', properties: 'Stays (public)', packages: 'Packages (public)',
  experiences: 'Experiences (public)', bookings: 'Bookings & checkout', payments: 'Payments & invoices', reviews: 'Reviews', wishlist: 'Wishlist',
  ads: 'Ads (public serving + tracking)', uploads: 'Uploads', admin: 'Admin / Sub-admin operations', superadmin: 'Super-admin',
};

let md = `# Mahastays API — endpoint reference

> **Generated from the source code** by \`npm run docs:generate\` — do not edit by hand.
> ${endpoints.length} endpoints · base URL \`/api/v1\` · every response is \`{ "success": true, "data": ..., "meta"?: ... }\` or \`{ "success": false, "error": { code, message, details?, requestId } }\`.

**Access column** — who may call the endpoint:
- \`public\` — no token. \`public (personalised when signed in)\` — optional \`Authorization: Bearer <token>\`.
- \`user\`, \`vendor\`, \`vendor (KYC-approved)\` — role guards.
- \`super_admin | admin[flag] | sub_admin[flag]\` — staff routes: the super-admin always passes; admins / sub-admins need that **permission flag** to be true on their record (\`admin\` / \`sub_admin\` without brackets = any active member).
- \`+ master PIN (x-master-pin)\` — additionally requires the super-admin's secondary PIN.

`;
for (const [key, list] of groups) {
  md += `## ${TITLES[key] ?? key}\n\n| Method | Path | Access |\n| :-- | :-- | :-- |\n`;
  for (const e of list) md += `| \`${e.method}\` | \`${e.path}\` | ${e.access.replace(/\|/g, '\\|')} |\n`;
  md += '\n';
}
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/ENDPOINTS.md', md);

// ── 4) Postman collection ──
const OID = '{{id}}';
const stay = { propertyId: '{{propertyId}}', roomId: 'r501', checkInDate: '2026-12-18', checkOutDate: '2026-12-21', guests: { adults: 2, children: 1 }, quantity: 1, specialRequests: 'Late check-in please', billingState: 'Maharashtra' };
const pack = { packageId: '{{packageId}}', tierId: 'couple-standard', startDate: '2026-12-18', travelers: { adults: 2, children: 0 }, billingState: 'Maharashtra' };
const exp = { experienceId: '{{experienceId}}', tierId: 'adult-trek', slotId: 'slot-sunrise', activityDate: '2026-12-19', participants: { adults: 2, children: 0 } };
const phone = { countryCode: '+91', nationalNumber: '9876543210' };
const packages = seed.buildPackages({ propertyId: '{{propertyId}}', gamesExperienceId: '{{experienceId}}', boatingExperienceId: '{{experienceId}}' });

const BODIES: Record<string, unknown> = {
  'POST /api/v1/auth/user/signup': { fullName: 'Asha Patil', email: 'asha@example.com', password: 'Secret123', phone },
  'POST /api/v1/auth/user/login': { email: 'traveler@mahastays.local', password: 'Demo@12345' },
  'POST /api/v1/auth/user/otp/request': { phone },
  'POST /api/v1/auth/user/otp/verify': { phone, code: '123456', fullName: 'Asha Patil', email: 'asha@example.com' },
  'POST /api/v1/auth/user/google': { idToken: '<google-id-token>' },
  'POST /api/v1/auth/vendor/register': {
    businessType: 'private_limited', category: 'property_host', businessName: 'HillView Hospitality Pvt Ltd', displayName: 'Vikramaditya & Team', displayRole: 'Resort General Manager',
    email: 'newhost@example.com', phone: '+919822000000', password: 'Strong#123',
    contact: { primaryContactPerson: 'Vikramaditya', registeredOfficeAddress: { addressLine1: 'Plot 12, Venna Lake Road', city: 'Mahabaleshwar', district: 'Satara', state: 'Maharashtra', pincode: '412806' } },
    compliance: { panNumber: 'ABCDE1234F', gstin: '27ABCDE1234F1Z5' },
  },
  'POST /api/v1/auth/vendor/login': { email: 'host@hillview.local', password: 'Demo@12345' },
  'POST /api/v1/auth/admin/login': { email: 'ops.lead@mahastays.local', password: 'Demo@12345' },
  'POST /api/v1/auth/admin/login/2fa': { challengeToken: '<from /auth/admin/login>', code: '123456' },
  'POST /api/v1/auth/password/forgot': { role: 'user', email: 'traveler@mahastays.local' },
  'POST /api/v1/auth/password/reset': { token: '<token from the e-mail link>', newPassword: 'NewSecret123' },
  'POST /api/v1/auth/change-password': { currentPassword: 'Demo@12345', newPassword: 'NewSecret123' },
  'POST /api/v1/bookings/stays/quote': stay,
  'POST /api/v1/bookings/stays/reserve': stay,
  'POST /api/v1/bookings/packages/quote': pack,
  'POST /api/v1/bookings/packages/reserve': pack,
  'POST /api/v1/bookings/experiences/quote': exp,
  'POST /api/v1/bookings/experiences/reserve': exp,
  'POST /api/v1/bookings/:type/:id/cancel': { reason: 'Change of plans' },
  'POST /api/v1/payments/mock/capture': { orderId: '{{orderId}}' },
  'POST /api/v1/payments/verify': { razorpay_order_id: '{{orderId}}', razorpay_payment_id: 'pay_xxx', razorpay_signature: '<signature>' },
  'POST /api/v1/reviews': { bookingType: 'stay', bookingId: '{{bookingId}}', rating: 5, comment: 'Lovely lake views and very helpful staff.', subScores: { cleanliness: 5, accuracy: 5, communication: 5, location: 5, checkIn: 5, value: 4 } },
  'POST /api/v1/wishlist/toggle': { targetType: 'property', targetId: '{{propertyId}}' },
  'POST /api/v1/uploads/sign': { purpose: 'listing_media', contentType: 'image/jpeg' },
  'PUT /api/v1/users/me': { fullName: 'Asha Patil', preferences: { preferredLanguage: 'en' } },
  'PUT /api/v1/vendor/me/kyc': { panNumber: 'ABCDE1234F', gstin: '27ABCDE1234F1Z5', identityProofUrl: 's3://bucket/kyc/identity.pdf', businessProofUrl: 's3://bucket/kyc/business.pdf' },
  'PUT /api/v1/vendor/me/banking': { accountHolderName: 'HillView Hospitality Pvt Ltd', accountNumber: '123456789012', bankName: 'HDFC Bank', ifscCode: 'HDFC0001234', branchName: 'Mahabaleshwar' },
  'POST /api/v1/vendor/properties': seed.hillViewProperty,
  'POST /api/v1/vendor/packages': packages[0],
  'POST /api/v1/vendor/experiences': seed.experiencesData.trek,
  'PATCH /api/v1/vendor/properties/:id/status': { status: 'inactive' },
  'POST /api/v1/vendor/properties/:id/blocks': { roomId: 'r501', fromDate: '2026-12-24', toDate: '2026-12-26', units: 3, reason: 'Maintenance' },
  'POST /api/v1/vendor/experiences/:id/blocks': { slotId: 'slot-sunrise', fromDate: '2026-12-20', toDate: '2026-12-20', reason: 'Heavy rain forecast' },
  'PATCH /api/v1/vendor/bookings/stays/:id/status': { action: 'check_in' },
  'POST /api/v1/vendor/vouchers/redeem': { voucherCode: 'VOUCH-ACT-ABC123' },
  'POST /api/v1/vendor/payouts/request': {},
  'POST /api/v1/vendor/reviews/:id/reply': { reply: 'Thank you for staying with us!' },
  'POST /api/v1/ads/track/click': { adId: '{{adId}}' },
  'POST /api/v1/admin/vendors/:id/verify': { decision: 'approve', verifyBank: true },
  'PATCH /api/v1/admin/properties/:id/status': { status: 'active' },
  'PATCH /api/v1/admin/reviews/:id/moderate': { decision: 'approve' },
  'POST /api/v1/admin/bookings/:type/:id/cancel': { reason: 'Duplicate booking', overrideRefundInr: 5000 },
  'PATCH /api/v1/admin/users/:id/membership': { isClubMember: true, tier: 'gold' },
  'POST /api/v1/admin/finance/settlements/:id/audit': { notes: 'Lines verified against bookings' },
  'POST /api/v1/admin/subadmins': { fullName: 'Support Exec', email: 'new.support@mahastays.local', phone: '+919999900010', password: 'Support#123', department: 'customer_support' },
  'PUT /api/v1/superadmin/config': { gstRates: { staysStandardGstPercent: 18 }, dynamicPricing: { enabled: true, holidayDates: ['2026-12-25'] } },
  'POST /api/v1/superadmin/finance/payouts/release': { payoutId: '{{payoutId}}', transferMethod: 'NEFT', utrNumber: 'UTR1234567890' },
};
const QUERIES: Record<string, string> = {
  'GET /api/v1/properties': 'destination=Mahabaleshwar&type=resort,villa&amenities=pool&checkIn=2026-12-18&checkOut=2026-12-21&guests=2&sort=price_asc&page=1&limit=10',
  'GET /api/v1/properties/nearby': 'lat=17.9258&lng=73.665&radiusKm=25',
  'GET /api/v1/packages': 'category=Honeymoon&sort=price_asc',
  'GET /api/v1/experiences': 'category=Trekking&date=2026-12-19&participants=2',
  'GET /api/v1/experiences/:idOrSlug/slots': 'date=2026-12-19',
  'GET /api/v1/reviews': 'targetType=property&targetId={{propertyId}}&sort=helpful',
  'GET /api/v1/ads/active': 'placement=homepage&page=/&device=desktop&city=Pune',
  'GET /api/v1/vendor/properties/:id/calendar': 'from=2026-12-01&to=2026-12-31',
};
const SAVE_TOKEN = [
  'const body = pm.response.json();',
  'if (body && body.data && body.data.accessToken) { pm.collectionVariables.set("accessToken", body.data.accessToken); }',
  'if (body && body.data && body.data.checkout) { pm.collectionVariables.set("orderId", body.data.checkout.orderId); }',
];
const savesToken = (p: string) => /\/auth\/(user\/(signup|login|otp\/verify|google)|vendor\/(register|login)|admin\/login(\/2fa)?|refresh|change-password)$/.test(p) || /\/bookings\/\w+\/reserve$/.test(p);

const items = [...groups.entries()].map(([key, list]) => ({
  name: TITLES[key] ?? key,
  item: list.map((e) => {
    const k = `${e.method} ${e.path}`;
    const q = QUERIES[k];
    const body = BODIES[k];
    const segs = e.path.replace(/^\//, '').split('/');
    const pathVars = segs.filter((s) => s.startsWith(':')).map((s) => ({ key: s.slice(1), value: s === ':type' ? 'stay' : OID }));
    const headers: { key: string; value: string }[] = [];
    if (body !== undefined || ['POST', 'PUT', 'PATCH'].includes(e.method)) headers.push({ key: 'Content-Type', value: 'application/json' });
    if (e.access.includes('master PIN')) headers.push({ key: 'x-master-pin', value: '{{masterPin}}' });
    return {
      name: `${e.method} ${e.path.replace('/api/v1', '')}`,
      request: {
        method: e.method,
        header: headers,
        ...(e.access.startsWith('public') && !e.access.includes('personalised') ? { auth: { type: 'noauth' } } : {}),
        url: { raw: `{{baseUrl}}${e.path}${q ? `?${q}` : ''}`, host: ['{{baseUrl}}'], path: segs, ...(q ? { query: q.split('&').map((kv) => ({ key: kv.split('=')[0], value: kv.split('=').slice(1).join('=') })) } : {}), ...(pathVars.length ? { variable: pathVars } : {}) },
        ...(body !== undefined ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
        description: `**Access:** ${e.access}`,
      },
      ...(savesToken(e.path) ? { event: [{ listen: 'test', script: { type: 'text/javascript', exec: SAVE_TOKEN } }] } : {}),
    };
  }),
}));

const collection = {
  info: { name: 'Mahastays API', description: `Generated from the source by \`npm run docs:generate\` (${endpoints.length} endpoints). Log in first — the access token is saved automatically.`, schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] },
  variable: ['baseUrl|http://localhost:4000', 'accessToken|', 'masterPin|246810', 'propertyId|', 'packageId|', 'experienceId|', 'bookingId|', 'orderId|', 'adId|', 'payoutId|', 'id|'].map((kv) => ({ key: kv.split('|')[0], value: kv.split('|')[1] })),
  item: items,
};
fs.mkdirSync('postman', { recursive: true });
fs.writeFileSync(path.join('postman', 'Mahastays.postman_collection.json'), JSON.stringify(collection, null, 2));

console.log(`✓ ${endpoints.length} endpoints → docs/ENDPOINTS.md and postman/Mahastays.postman_collection.json`); // eslint-disable-line no-console
process.exit(0);
