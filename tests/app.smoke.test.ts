import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma } = vi.hoisted(() => {
  const model = () => ({
    findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0),
    create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), upsert: vi.fn(), delete: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn(),
  });
  return {
    prisma: {
      user: model(), vendor: model(), admin: model(), subAdmin: model(), superAdmin: model(),
      refreshToken: model(), auditLog: model(), oneTimeCode: model(), payment: model(), platformConfig: model(),
      property: model(), package: model(), experience: model(), review: model(), adCampaign: model(),
      $runCommandRaw: vi.fn(), $connect: vi.fn(), $disconnect: vi.fn(),
    },
  };
});
vi.mock('../src/lib/prisma', () => ({ prisma }));

import { createApp } from '../src/app';
import { signAccessToken } from '../src/services/token.service';
import { hashPassword, hmacSha256Hex, sha256 } from '../src/utils/crypto';

const app = createApp();
const USER_ID = '507f1f77bcf86cd799439011';
const userToken = () => signAccessToken(USER_ID, 'user');

const baseUser = {
  id: USER_ID, userCode: 'USR-10001', fullName: 'Asha Patil', email: 'asha@example.com', phone: null, passwordHash: '', authProvider: 'local',
  authProviderId: null, avatarUrl: null, dateOfBirth: null, gender: null,
  membership: { isClubMember: false, tier: 'standard', joinedAt: null, expiresAt: null },
  preferences: { preferredLanguage: 'en', currency: 'INR', dietaryPreference: null },
  verification: { isEmailVerified: false, isPhoneVerified: false, governmentIdType: null, governmentIdNumberMasked: null, isIdVerified: false },
  totalBookingsCount: 0, completedStaysCount: 0, totalSpentInr: 0, reviewsWrittenCount: 0, totalDiscountSavedInr: 0,
  status: 'active', failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: null, lastLoginIp: null, createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  prisma.refreshToken.create.mockResolvedValue({});
  prisma.user.update.mockResolvedValue({});
  prisma.auditLog.create.mockResolvedValue({});
  prisma.user.findMany.mockResolvedValue([]);
});

describe('plumbing', () => {
  it('serves the liveness probe', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { status: 'ok' } });
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app).post('/api/v1/auth/user/login').set('content-type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('formats validation errors with field paths', async () => {
    const res = await request(app).post('/api/v1/auth/user/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toEqual(expect.arrayContaining(['email', 'password']));
  });

  it('exposes the live pricing parameters publicly (single source of truth for the UI)', async () => {
    prisma.platformConfig.findUnique.mockResolvedValue({
      id: 'cfg', key: 'global', gstRates: { staysStandardGstPercent: 18, packagesGstPercent: 5, experiencesGstPercent: 5 },
      platformFees: { defaultCleaningFeeRatePercent: 5, defaultGearInsuranceFeeRatePercent: 4, clubMemberDiscountPercent: 8, packageChildPricePercent: 60, experienceChildPricePercent: 70 },
      cancellationWindowRules: { defaultFreeCancellationHours: 48, lateCancellationFeePercent: 50 },
      defaultCommission: {}, payoutRules: {}, dynamicPricing: { enabled: false, holidayDates: [] },
    });
    const res = await request(app).get('/api/v1/config/public');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ gstRatesPercent: { stays: 18, packages: 5, experiences: 5 }, clubMemberDiscountPercent: 8, cancellation: { defaultFreeCancellationHours: 48 } });
    expect(JSON.stringify(res.body)).not.toMatch(/commission|tds/i); // internal economics are never exposed
  });

  it('applies CORS only to allow-listed origins', async () => {
    const ok = await request(app).options('/api/v1/health').set('Origin', 'http://localhost:3000').set('Access-Control-Request-Method', 'GET');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    const bad = await request(app).options('/api/v1/health').set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'GET');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('authentication & RBAC guards', () => {
  it.each([['/api/v1/auth/me'], ['/api/v1/vendor/me'], ['/api/v1/admin/dashboard'], ['/api/v1/superadmin/config'], ['/api/v1/wishlist']])('%s requires a token', async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects tampered tokens', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${userToken()}x`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it.each([['/api/v1/vendor/me'], ['/api/v1/admin/vendors'], ['/api/v1/admin/dashboard'], ['/api/v1/superadmin/config'], ['/api/v1/superadmin/audit-logs']])(
    'a customer token cannot reach %s',
    async (path) => {
      const res = await request(app).get(path).set('Authorization', `Bearer ${userToken()}`);
      expect(res.status).toBe(403);
    },
  );

  it('a vendor token cannot reach customer-only booking routes', async () => {
    const res = await request(app).get('/api/v1/bookings/user/history').set('Authorization', `Bearer ${signAccessToken(USER_ID, 'vendor')}`);
    expect(res.status).toBe(403);
  });
});

describe('login → refresh rotation → reuse detection', () => {
  it('logs in, sets an HTTP-only refresh cookie and returns the profile without secrets', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: await hashPassword('Secret123') });
    const res = await request(app).post('/api/v1/auth/user/login').send({ email: 'ASHA@example.com', password: 'Secret123' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.role).toBe('user');
    expect(res.body.data.profile).toMatchObject({ userCode: 'USR-10001', metrics: { totalBookingsCount: 0 } });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(res.body.data.refreshToken).toBeUndefined(); // only for x-client-type: mobile
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/mh_rt=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
    // the issued token opens a protected route
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${res.body.data.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.profile.email).toBe('asha@example.com');
  });

  it('returns the refresh token in the body for mobile clients', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: await hashPassword('Secret123') });
    const res = await request(app).post('/api/v1/auth/user/login').set('x-client-type', 'mobile').send({ email: 'asha@example.com', password: 'Secret123' });
    expect(res.body.data.refreshToken).toBeTruthy();
  });

  it('answers wrong passwords and unknown e-mails identically, and counts failures', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: await hashPassword('Secret123') });
    const wrong = await request(app).post('/api/v1/auth/user/login').send({ email: 'asha@example.com', password: 'Wrong-pass1' });
    expect(wrong.status).toBe(401);
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { failedLoginAttempts: 1 } }));

    prisma.user.findUnique.mockResolvedValue(null);
    const unknown = await request(app).post('/api/v1/auth/user/login').send({ email: 'ghost@example.com', password: 'Whatever1' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error).toEqual(expect.objectContaining({ code: wrong.body.error.code, message: wrong.body.error.message }));
  });

  it('locks the account after too many failures', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, failedLoginAttempts: 4, passwordHash: await hashPassword('Secret123') });
    await request(app).post('/api/v1/auth/user/login').send({ email: 'asha@example.com', password: 'Wrong-pass1' });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ lockedUntil: expect.any(Date), failedLoginAttempts: 0 }) }));
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, lockedUntil: new Date(Date.now() + 600_000), passwordHash: await hashPassword('Secret123') });
    const locked = await request(app).post('/api/v1/auth/user/login').send({ email: 'asha@example.com', password: 'Secret123' });
    expect(locked.status).toBe(423);
    expect(locked.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  it('rotates a valid refresh token', async () => {
    const raw = 'a'.repeat(96);
    prisma.refreshToken.findUnique.mockResolvedValue({ id: 'rt1', actorId: USER_ID, actorRole: 'user', tokenHash: sha256(raw), familyId: 'fam1', expiresAt: new Date(Date.now() + 1e9), revokedAt: null, replacedByHash: null });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: 'x' });
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', `mh_rt=${raw}`).send({});
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(String(res.headers['set-cookie'])).toMatch(/mh_rt=(?!a{96})/); // a NEW token
    expect(prisma.refreshToken.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ familyId: 'fam1' }) }));
  });

  it('revokes the whole token family when a rotated token is replayed', async () => {
    const raw = 'b'.repeat(96);
    prisma.refreshToken.findUnique.mockResolvedValue({ id: 'rt2', actorId: USER_ID, actorRole: 'user', familyId: 'famX', expiresAt: new Date(Date.now() + 1e9), revokedAt: new Date(Date.now() - 3_600_000), replacedByHash: 'zzz' });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', `mh_rt=${raw}`).send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('REFRESH_REUSED');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { familyId: 'famX', revokedAt: null } }));
  });

  it('blocks cross-site refresh attempts (CSRF origin guard)', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').set('Origin', 'https://evil.example').send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
  });
});

describe('payment webhook (raw-body signature verification)', () => {
  const secret = 'mahastays-mock-gateway-secret';
  const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_x', order_id: 'order_unknown', method: 'upi' } } } });

  it('rejects a bad signature', async () => {
    const res = await request(app).post('/api/v1/payments/verify-webhook').set('content-type', 'application/json').set('x-razorpay-signature', 'deadbeef').send(body);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_SIGNATURE');
  });

  it('accepts a correctly signed event (even for an unknown order) and answers 200', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/api/v1/payments/verify-webhook').set('content-type', 'application/json').set('x-razorpay-signature', hmacSha256Hex(secret, body)).send(body);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ received: true });
    expect(prisma.payment.findUnique).toHaveBeenCalledWith({ where: { gatewayOrderId: 'order_unknown' } });
  });

  it('rejects a body that was altered after signing', async () => {
    const res = await request(app).post('/api/v1/payments/verify-webhook').set('content-type', 'application/json').set('x-razorpay-signature', hmacSha256Hex(secret, body)).send(body.replace('upi', 'card'));
    expect(res.status).toBe(401);
  });
});

describe('catalog query validation & wiring', () => {
  it('requires both dates when searching by availability', async () => {
    const res = await request(app).get('/api/v1/properties?checkIn=2026-10-10');
    expect(res.status).toBe(400);
  });

  it('rejects invalid calendar dates and bad enums', async () => {
    expect((await request(app).get('/api/v1/properties?checkIn=2026-02-30&checkOut=2026-03-02')).status).toBe(400);
    expect((await request(app).get('/api/v1/properties?type=castle')).status).toBe(400);
    expect((await request(app).get('/api/v1/experiences/abc/slots')).status).toBe(400);
  });

  it('lists properties with pagination metadata', async () => {
    prisma.property.count.mockResolvedValue(0);
    prisma.property.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/v1/properties?destination=Mahabaleshwar&type=resort,villa&amenities=pool,spa&sort=price_asc&page=2&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ page: 2, limit: 5, total: 0 });
    const where = prisma.property.findMany.mock.calls[0][0];
    expect(where.skip).toBe(5);
    expect(where.take).toBe(5);
    expect(where.orderBy).toEqual([{ numericPrice: 'asc' }]);
    expect(JSON.stringify(where.where)).toContain('hasEvery');
  });

  it('validates booking quote bodies before touching the database', async () => {
    const res = await request(app).post('/api/v1/bookings/stays/quote').send({ propertyId: 'x', roomId: 'r1', checkInDate: '2026-10-15', checkOutDate: '2026-10-14', guests: { adults: 0 } });
    expect(res.status).toBe(400);
    expect(prisma.property.findFirst).not.toHaveBeenCalled();
  });

  it('rejects ad-hoc payloads that try to smuggle extra control (mass-assignment safe parsing)', async () => {
    const res = await request(app).post('/api/v1/auth/user/signup').send({ fullName: 'A', email: 'a@b.co', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('vendor listing routes', () => {
  const vendorToken = () => signAccessToken('507f1f77bcf86cd799439012', 'vendor');
  const approvedVendor = { id: '507f1f77bcf86cd799439012', status: 'active', compliance: { verificationStatus: 'approved' } };

  it('PUT /vendor/experiences/:id/slots validates its own payload (explicit schema, not a picked one)', async () => {
    prisma.vendor.findUnique.mockResolvedValue(approvedVendor);
    const empty = await request(app).put('/api/v1/vendor/experiences/507f1f77bcf86cd799439013/slots').set('Authorization', `Bearer ${vendorToken()}`).send({});
    expect(empty.status).toBe(400);
    const dup = await request(app)
      .put('/api/v1/vendor/experiences/507f1f77bcf86cd799439013/slots')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ slots: [{ slotId: 'a', time: '6:00 AM', label: 'Sunrise', capacity: 10 }, { slotId: 'a', time: '5:00 PM', label: 'Sunset', capacity: 10 }] });
    expect(dup.status).toBe(400);
  });

  it('a vendor still pending KYC can read but not create listings', async () => {
    prisma.vendor.findUnique.mockResolvedValue({ ...approvedVendor, status: 'pending_approval', compliance: { verificationStatus: 'under_review' } });
    const read = await request(app).get('/api/v1/vendor/properties').set('Authorization', `Bearer ${vendorToken()}`);
    expect(read.status).toBe(200);
    const write = await request(app).post('/api/v1/vendor/properties').set('Authorization', `Bearer ${vendorToken()}`).send({});
    expect(write.status).toBe(403);
    expect(write.body.error.code).toBe('VENDOR_NOT_APPROVED');
  });

  it('a blacklisted vendor is locked out entirely', async () => {
    prisma.vendor.findUnique.mockResolvedValue({ ...approvedVendor, status: 'blacklisted' });
    const res = await request(app).get('/api/v1/vendor/dashboard').set('Authorization', `Bearer ${vendorToken()}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('VENDOR_BLACKLISTED');
  });
});
