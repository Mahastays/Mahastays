import type { ListingStatus } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { audit } from '../../services/audit.service';
import { sendEmail } from '../../services/notification.service';
import { templates } from '../../services/notification.templates';
import { ApiError } from '../../utils/ApiError';
import { todayIST } from '../../utils/dates';
import type { StaffContext } from '../../types/auth';

export type ListingKind = 'property' | 'package' | 'experience';

const LABEL: Record<ListingKind, string> = { property: 'Property', package: 'Package', experience: 'Experience' };
const ENTITY: Record<ListingKind, string> = { property: 'Property', package: 'Package', experience: 'Experience' };

export interface ListingRow {
  id: string;
  vendorId: string;
  status: ListingStatus;
  approvedAt: Date | null;
  title: string;
}

export async function loadListing(kind: ListingKind, id: string): Promise<ListingRow> {
  let row: ListingRow | null = null;
  switch (kind) {
    case 'property': {
      const r = await prisma.property.findUnique({ where: { id }, select: { id: true, vendorId: true, status: true, approvedAt: true, name: true } });
      row = r && { id: r.id, vendorId: r.vendorId, status: r.status, approvedAt: r.approvedAt, title: r.name };
      break;
    }
    case 'package': {
      const r = await prisma.package.findUnique({ where: { id }, select: { id: true, vendorId: true, status: true, approvedAt: true, title: true } });
      row = r && { id: r.id, vendorId: r.vendorId, status: r.status, approvedAt: r.approvedAt, title: r.title };
      break;
    }
    case 'experience': {
      const r = await prisma.experience.findUnique({ where: { id }, select: { id: true, vendorId: true, status: true, approvedAt: true, title: true } });
      row = r && { id: r.id, vendorId: r.vendorId, status: r.status, approvedAt: r.approvedAt, title: r.title };
      break;
    }
  }
  if (!row) throw ApiError.notFound(LABEL[kind]);
  return row;
}

/** Loads a listing and verifies the vendor owns it (404 instead of 403 so ids can't be probed). */
export async function loadOwnedListing(kind: ListingKind, vendorId: string, id: string): Promise<ListingRow> {
  const row = await loadListing(kind, id);
  if (row.vendorId !== vendorId) throw ApiError.notFound(LABEL[kind]);
  return row;
}

interface StatusPatch {
  status?: ListingStatus;
  rejectionReason?: string | null;
  approvedAt?: Date | null;
  approvedByAdminId?: string | null;
  featured?: boolean;
}

async function updateListing(kind: ListingKind, id: string, data: StatusPatch): Promise<void> {
  switch (kind) {
    case 'property':
      await prisma.property.update({ where: { id }, data });
      break;
    case 'package':
      await prisma.package.update({ where: { id }, data });
      break;
    case 'experience':
      await prisma.experience.update({ where: { id }, data });
      break;
  }
}

/** Status a vendor edit leads to: rejected listings go back into the review queue; blocked/archived are locked. */
export function statusAfterVendorEdit(status: ListingStatus): ListingStatus {
  if (status === 'blocked' || status === 'archived') throw ApiError.forbidden('This listing is locked and cannot be edited', 'LISTING_LOCKED');
  return status === 'rejected' ? 'pending_approval' : status;
}

export async function hasUpcomingBookings(kind: ListingKind, id: string): Promise<boolean> {
  const today = todayIST();
  switch (kind) {
    case 'property':
      return (
        (await prisma.stayBooking.count({
          where: { propertyId: id, bookingStatus: { in: ['pending', 'confirmed', 'checked_in'] }, checkOutDate: { gte: today } },
        })) > 0
      );
    case 'package':
      return (
        (await prisma.packageBooking.count({
          where: { packageId: id, bookingStatus: { in: ['pending', 'confirmed'] }, endDate: { gte: today } },
        })) > 0
      );
    case 'experience':
      return (
        (await prisma.experienceBooking.count({
          where: { experienceId: id, bookingStatus: { in: ['pending', 'reserved', 'checked_in'] }, activityDate: { gte: today } },
        })) > 0
      );
  }
}

/** Vendor shows / hides an already-approved listing. */
export async function vendorSetVisibility(kind: ListingKind, vendorId: string, id: string, to: 'active' | 'inactive') {
  const row = await loadOwnedListing(kind, vendorId, id);
  if (!row.approvedAt || (row.status !== 'active' && row.status !== 'inactive')) {
    throw ApiError.conflict('Only approved listings can be shown or hidden', 'LISTING_NOT_APPROVED');
  }
  await updateListing(kind, id, { status: to });
  return { id, status: to };
}

export async function vendorSetAcceptingBookings(kind: ListingKind, vendorId: string, id: string, acceptingBookings: boolean) {
  await loadOwnedListing(kind, vendorId, id);
  await updateListing(kind, id, { acceptingBookings } as any);
  return { id, acceptingBookings };
}

/** Soft-delete. Refused while future / in-progress bookings exist. */
export async function vendorArchive(kind: ListingKind, vendorId: string, id: string) {
  const row = await loadOwnedListing(kind, vendorId, id);
  if (row.status === 'blocked') throw ApiError.forbidden('This listing is locked', 'LISTING_LOCKED');
  if (await hasUpcomingBookings(kind, id)) {
    throw ApiError.conflict('This listing has upcoming bookings. Cancel or complete them first.', 'HAS_UPCOMING_BOOKINGS');
  }
  await updateListing(kind, id, { status: 'archived' });
  return { id, status: 'archived' as const };
}

/* ───────────────────────────── staff moderation ───────────────────────────── */

export type StaffListingStatus = 'active' | 'rejected' | 'blocked' | 'inactive';

function assertMayTransition(kind: ListingKind, staff: StaffContext, to: StaffListingStatus): void {
  if (staff.role === 'super_admin') return;
  if (staff.role === 'sub_admin') {
    if (to !== 'blocked') throw ApiError.forbidden('Support staff can only flag (block) a listing for review', 'PERMISSION_DENIED');
    return;
  }
  const p = staff.adminPermissions;
  const approveKey = kind === 'property' ? 'canApproveProperties' : kind === 'package' ? 'canApprovePackages' : 'canApproveExperiences';
  const allowed = to === 'active' || to === 'rejected' ? p?.[approveKey] : p?.canBlockListings;
  if (!allowed) throw ApiError.forbidden('You do not have permission for this action', 'PERMISSION_DENIED');
}

export async function staffSetListingStatus(
  kind: ListingKind,
  staff: StaffContext,
  id: string,
  input: { status: StaffListingStatus; reason?: string },
  req: Request,
) {
  assertMayTransition(kind, staff, input.status);
  if ((input.status === 'rejected' || input.status === 'blocked') && !input.reason) {
    throw ApiError.unprocessable('A reason is required when rejecting or blocking a listing', undefined, 'REASON_REQUIRED');
  }
  const row = await loadListing(kind, id);

  const patch: StatusPatch =
    input.status === 'active'
      ? { status: 'active', approvedAt: row.approvedAt ?? new Date(), approvedByAdminId: staff.id, rejectionReason: null }
      : { status: input.status, rejectionReason: input.reason ?? null };
  await updateListing(kind, id, patch);

  await audit({
    actor: { id: staff.id, role: staff.role },
    action: `${input.status === 'active' ? 'APPROVE' : input.status === 'rejected' ? 'REJECT' : input.status === 'blocked' ? 'BLOCK' : 'DEACTIVATE'}_${kind.toUpperCase()}`,
    targetEntity: ENTITY[kind],
    targetId: id,
    previousState: { status: row.status },
    newState: { status: input.status, reason: input.reason },
    req,
  });

  if (input.status === 'active' || input.status === 'rejected') {
    const vendor = await prisma.vendor.findUnique({ where: { id: row.vendorId }, select: { email: true, displayName: true } });
    if (vendor) {
      const mail = templates.listingDecision({ name: vendor.displayName, listing: row.title, approved: input.status === 'active', reason: input.reason });
      void sendEmail({ to: vendor.email, subject: mail.subject, html: mail.html });
    }
  }
  return { id, status: input.status };
}

export async function staffSetFeatured(kind: ListingKind, staff: StaffContext, id: string, featured: boolean, req: Request) {
  await loadListing(kind, id);
  await updateListing(kind, id, { featured });
  await audit({ actor: { id: staff.id, role: staff.role }, action: featured ? 'FEATURE_LISTING' : 'UNFEATURE_LISTING', targetEntity: ENTITY[kind], targetId: id, req });
  return { id, featured };
}
