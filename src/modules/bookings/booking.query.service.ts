import type { Payment } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { pageMeta } from '../../utils/pagination';
import type { StaffContext } from '../../types/auth';
import {
  presentExperienceBooking,
  presentPackageBooking,
  presentStayBooking,
  type BookingView,
  type ContactMode,
} from './booking.presenter';
import { BOOKING_KINDS, type BookingKind } from './booking.schemas';

const STATUSES: Record<BookingKind, readonly string[]> = {
  stay: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'],
  package: ['pending', 'confirmed', 'completed', 'cancelled'],
  experience: ['pending', 'reserved', 'checked_in', 'completed', 'cancelled', 'no_show'],
};

const DATE_FIELD: Record<BookingKind, string> = { stay: 'checkInDate', package: 'startDate', experience: 'activityDate' };

/** Paid-and-confirmed states in which a vendor may see the guest's contact details. */
const CONTACT_VISIBLE = new Set(['confirmed', 'checked_in', 'checked_out', 'completed', 'reserved', 'no_show']);

const USER_SELECT = { select: { id: true, fullName: true, email: true, phone: true } } as const;

export interface BookingFilters {
  type?: BookingKind;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  userId?: string;
  vendorId?: string;
}

/** Base `where` for a kind, or null when the status filter can't apply to that kind (e.g. "checked_out" for packages). */
function buildWhere(kind: BookingKind, f: BookingFilters): Record<string, unknown> | null {
  const where: Record<string, unknown> = {};
  if (f.userId) where.userId = f.userId;
  if (f.vendorId) where.vendorId = f.vendorId;
  if (f.status) {
    if (!STATUSES[kind].includes(f.status)) return null;
    where.bookingStatus = f.status;
  }
  if (f.q) where.bookingReference = { contains: f.q.toUpperCase() };
  if (f.from || f.to) where[DATE_FIELD[kind]] = { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) };
  return where;
}

type Presented = ReturnType<typeof presentStayBooking> | ReturnType<typeof presentPackageBooking> | ReturnType<typeof presentExperienceBooking>;

async function fetchKind(
  kind: BookingKind,
  where: Record<string, unknown>,
  page: { skip: number; take: number },
  view: BookingView,
  contactFor: (status: string) => ContactMode,
): Promise<{ total: number; items: Presented[] }> {
  const orderBy = { createdAt: 'desc' } as const;
  switch (kind) {
    case 'stay': {
      const [total, rows] = await Promise.all([
        prisma.stayBooking.count({ where: where as never }),
        prisma.stayBooking.findMany({
          where: where as never,
          orderBy,
          ...page,
          include: { property: { select: { id: true, name: true, slug: true, city: true, images: true } }, user: USER_SELECT },
        }),
      ]);
      return { total, items: rows.map((b) => presentStayBooking(b, { view, property: b.property, customer: b.user, contactMode: contactFor(b.bookingStatus) })) };
    }
    case 'package': {
      const [total, rows] = await Promise.all([
        prisma.packageBooking.count({ where: where as never }),
        prisma.packageBooking.findMany({
          where: where as never,
          orderBy,
          ...page,
          include: { package: { select: { id: true, title: true, slug: true, city: true, thumbnail: true } }, user: USER_SELECT },
        }),
      ]);
      return { total, items: rows.map((b) => presentPackageBooking(b, { view, package: b.package, customer: b.user, contactMode: contactFor(b.bookingStatus) })) };
    }
    case 'experience': {
      const [total, rows] = await Promise.all([
        prisma.experienceBooking.count({ where: where as never }),
        prisma.experienceBooking.findMany({
          where: where as never,
          orderBy,
          ...page,
          include: { experience: { select: { id: true, title: true, slug: true, city: true, image: true } }, user: USER_SELECT },
        }),
      ]);
      return { total, items: rows.map((b) => presentExperienceBooking(b, { view, experience: b.experience, customer: b.user, contactMode: contactFor(b.bookingStatus) })) };
    }
  }
}

/** Lists bookings across one or all kinds, newest first, with correct pagination. */
async function listBookings(
  filters: BookingFilters,
  pagination: { page: number; limit: number },
  view: BookingView,
  contactFor: (status: string) => ContactMode,
) {
  const kinds = filters.type ? [filters.type] : [...BOOKING_KINDS];
  const { page, limit } = pagination;
  const single = kinds.length === 1;
  // multi-kind: each source returns its newest `page × limit` rows, then we merge and slice.
  const window = single ? { skip: (page - 1) * limit, take: limit } : { skip: 0, take: page * limit };

  const results = await Promise.all(
    kinds.map(async (kind) => {
      const where = buildWhere(kind, filters);
      return where ? fetchKind(kind, where, window, view, contactFor) : { total: 0, items: [] as Presented[] };
    }),
  );
  const total = results.reduce((s, r) => s + r.total, 0);
  const merged = results.flatMap((r) => r.items).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const items = single ? merged : merged.slice((page - 1) * limit, page * limit);
  return { items, meta: pageMeta(pagination, total) };
}

/* ───────────────────────────── customers ───────────────────────────── */

export const listUserBookings = (userId: string, q: BookingFilters & { page: number; limit: number }) =>
  listBookings({ ...q, userId }, q, 'customer', () => 'full');

export const paymentSummary = (p: Payment | null, forStaff = false) =>
  p
    ? {
        id: p.id,
        status: p.status,
        gateway: p.gateway,
        method: p.method,
        amountInr: p.amountInr,
        refundedAmountInr: p.refundedAmountInr,
        invoiceNumber: p.status === 'captured' ? p.invoiceNumber : null,
        invoiceUrl: (p.status === 'captured' && p.invoiceNumber) ? `${env.API_PUBLIC_URL}/api/v1/payments/${p.id}/invoice` : null,
        capturedAt: p.capturedAt,
        refunds: p.refunds,
        ...(forStaff ? { gatewayOrderId: p.gatewayOrderId, gatewayPaymentId: p.gatewayPaymentId, failureReason: p.failureReason } : {}),
      }
    : null;

async function detail(kind: BookingKind, id: string, view: BookingView, contact: ContactMode, owner: { userId?: string; vendorId?: string }) {
  const where = { id, ...(owner.userId ? { userId: owner.userId } : {}), ...(owner.vendorId ? { vendorId: owner.vendorId } : {}) } as never;
  const notFound = () => ApiError.notFound('Booking');
  let booking: Presented | null = null;
  switch (kind) {
    case 'stay': {
      const b = await prisma.stayBooking.findFirst({ where, include: { property: { select: { id: true, name: true, slug: true, city: true, images: true } }, user: USER_SELECT } });
      booking = b && presentStayBooking(b, { view, property: b.property, customer: b.user, contactMode: contact });
      break;
    }
    case 'package': {
      const b = await prisma.packageBooking.findFirst({ where, include: { package: { select: { id: true, title: true, slug: true, city: true, thumbnail: true } }, user: USER_SELECT } });
      booking = b && presentPackageBooking(b, { view, package: b.package, customer: b.user, contactMode: contact });
      break;
    }
    case 'experience': {
      const b = await prisma.experienceBooking.findFirst({ where, include: { experience: { select: { id: true, title: true, slug: true, city: true, image: true } }, user: USER_SELECT } });
      booking = b && presentExperienceBooking(b, { view, experience: b.experience, customer: b.user, contactMode: contact });
      break;
    }
  }
  if (!booking) throw notFound();
  const payment = await prisma.payment.findFirst({ where: { bookingType: kind, bookingId: id }, orderBy: { createdAt: 'desc' } });
  return { ...booking, payment: paymentSummary(payment, view === 'staff') };
}

export const getUserBooking = (kind: BookingKind, id: string, userId: string) => detail(kind, id, 'customer', 'full', { userId });

/** "MHA-2026-0001" → stay, "PKG-…" → package, "EXP-…" → experience. */
export async function lookupUserBooking(reference: string, userId: string) {
  const ref = reference.trim().toUpperCase();
  const kind: BookingKind | null = ref.startsWith('MHA-') ? 'stay' : ref.startsWith('PKG-') ? 'package' : ref.startsWith('EXP-') ? 'experience' : null;
  if (!kind) throw ApiError.notFound('Booking');
  const where = { bookingReference: ref, userId } as never;
  const row =
    kind === 'stay'
      ? await prisma.stayBooking.findFirst({ where, select: { id: true } })
      : kind === 'package'
        ? await prisma.packageBooking.findFirst({ where, select: { id: true } })
        : await prisma.experienceBooking.findFirst({ where, select: { id: true } });
  if (!row) throw ApiError.notFound('Booking');
  return detail(kind, row.id, 'customer', 'full', { userId });
}

/* ───────────────────────────── vendors ───────────────────────────── */

const vendorContact = (status: string): ContactMode => (CONTACT_VISIBLE.has(status) ? 'full' : 'name_only');

export const listVendorBookings = (vendorId: string, q: BookingFilters & { page: number; limit: number }) =>
  listBookings({ ...q, vendorId }, q, 'vendor', vendorContact);

export const getVendorBooking = async (vendorId: string, kind: BookingKind, id: string) => {
  const status = await bookingStatusOf(kind, id);
  return detail(kind, id, 'vendor', vendorContact(status ?? ''), { vendorId });
};

/* ───────────────────────────── staff ───────────────────────────── */

const staffContactMode = (staff: StaffContext): ContactMode => (staff.role === 'sub_admin' ? 'masked' : 'full');

export const listStaffBookings = (staff: StaffContext, q: BookingFilters & { page: number; limit: number }) =>
  listBookings(q, q, 'staff', () => staffContactMode(staff));

export const getStaffBooking = (staff: StaffContext, kind: BookingKind, id: string) => detail(kind, id, 'staff', staffContactMode(staff), {});

async function bookingStatusOf(kind: BookingKind, id: string): Promise<string | null> {
  switch (kind) {
    case 'stay':
      return (await prisma.stayBooking.findUnique({ where: { id }, select: { bookingStatus: true } }))?.bookingStatus ?? null;
    case 'package':
      return (await prisma.packageBooking.findUnique({ where: { id }, select: { bookingStatus: true } }))?.bookingStatus ?? null;
    case 'experience':
      return (await prisma.experienceBooking.findUnique({ where: { id }, select: { bookingStatus: true } }))?.bookingStatus ?? null;
  }
}
