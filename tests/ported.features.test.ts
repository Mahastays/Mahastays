import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma } = vi.hoisted(() => {
  const model = () => ({
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  });
  return {
    prisma: {
      user: model(),
      vendor: model(),
      admin: model(),
      subAdmin: model(),
      superAdmin: model(),
      refreshToken: model(),
      auditLog: model(),
      oneTimeCode: model(),
      payment: model(),
      platformConfig: model(),
      property: model(),
      package: model(),
      experience: model(),
      review: model(),
      adCampaign: model(),
      serviceableArea: model(),
      coupon: model(),
      couponRedemption: model(),
      supportTicket: model(),
      notification: model(),
      stayBooking: model(),
      packageBooking: model(),
      experienceBooking: model(),
      refund: model(),
      vendorPayout: model(),
      $runCommandRaw: vi.fn(),
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    },
  };
});
vi.mock('../src/lib/prisma', () => ({ prisma }));

import { createApp } from '../src/app';
import { signAccessToken } from '../src/services/token.service';

const app = createApp();
const USER_ID = '507f1f77bcf86cd799439011';
const userToken = () => signAccessToken(USER_ID, 'user');

const baseUser = {
  id: USER_ID,
  userCode: 'USR-10001',
  fullName: 'Pooja Sharma',
  email: 'pooja@example.com',
  phone: null,
  passwordHash: '',
  authProvider: 'local',
  authProviderId: null,
  avatarUrl: null,
  dateOfBirth: null,
  gender: null,
  membership: { isClubMember: false, tier: 'standard', joinedAt: null, expiresAt: null },
  preferences: { preferredLanguage: 'en', currency: 'INR', dietaryPreference: null },
  verification: { isEmailVerified: true, isPhoneVerified: false, governmentIdType: null, governmentIdNumberMasked: null, isIdVerified: false },
  totalBookingsCount: 0,
  completedStaysCount: 0,
  totalSpentInr: 0,
  reviewsWrittenCount: 0,
  totalDiscountSavedInr: 0,
  status: 'active',
  failedLoginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  lastLoginIp: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  prisma.user.findUnique.mockResolvedValue(baseUser);
  prisma.user.findFirst.mockResolvedValue(baseUser);
  prisma.auditLog.create.mockResolvedValue({});
});

describe('Ported features from backend2 to backend', () => {
  it('GET /api/v1/locations returns the 14 serviceable locations', async () => {
    prisma.serviceableArea.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/v1/locations');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(14);
    expect(res.body.data[0]).toHaveProperty('code');
    expect(res.body.data[0]).toHaveProperty('name');
    expect(res.body.data[0]).toHaveProperty('slug');
  });

  it('GET /api/v1/locations/:slug returns location detail', async () => {
    prisma.serviceableArea.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/v1/locations/loc-panchgani');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('loc-panchgani');
    expect(res.body.data.city).toBe('Panchgani');
  });

  it('GET /api/v1/coupons/offers returns active offers', async () => {
    prisma.coupon.findMany.mockResolvedValue([
      {
        id: '507f1f77bcf86cd799439099',
        code: 'MAHASTAYS10',
        title: 'Flat 10% Off',
        description: 'First booking discount',
        discountType: 'percentage',
        value: 10,
        maxDiscount: 1500,
        minAmount: 2000,
        appliesTo: ['stay', 'package', 'experience'],
        isActive: true,
        validTill: null,
      },
    ]);
    const res = await request(app).get('/api/v1/coupons/offers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].code).toBe('MAHASTAYS10');
  });

  it('POST /api/v1/coupons/validate calculates correct discount', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439099',
      code: 'MAHA10',
      title: 'Flat 10% Off',
      discountType: 'percentage',
      value: 10,
      maxDiscount: 1000,
      minAmount: 2000,
      appliesTo: ['stay'],
      isActive: true,
      validFrom: null,
      validTill: null,
      usageLimit: null,
      usedCount: 0,
      perUserLimit: 1,
    });
    prisma.couponRedemption.count.mockResolvedValue(0);

    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ code: 'MAHA10', bookingType: 'stay', amount: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.discountAmount).toBe(500); // 10% of 5000
    expect(res.body.data.finalAmount).toBe(4500);
  });

  it('GET /api/v1/properties/suggest returns auto-complete matches', async () => {
    prisma.property.findMany.mockResolvedValue([
      { name: 'Hill View Villa', city: 'Mahabaleshwar', slug: 'hill-view-villa', locationId: 'kshetra-mahabaleshwar' },
    ]);
    const res = await request(app).get('/api/v1/properties/suggest?q=hill');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/notifications returns user notification inbox', async () => {
    prisma.notification.count.mockResolvedValue(1);
    prisma.notification.findMany.mockResolvedValue([
      {
        id: '507f1f77bcf86cd799439088',
        recipientId: USER_ID,
        recipientRole: 'user',
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        body: 'Your stay at Hill View Villa is confirmed.',
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      },
    ]);

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Booking Confirmed!');
  });
});
