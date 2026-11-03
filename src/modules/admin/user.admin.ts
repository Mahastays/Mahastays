import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getStaff, requireStaff, canSeeFullContact } from '../../middlewares/staff';
import { audit } from '../../services/audit.service';
import { sendEmail } from '../../services/notification.service';
import { revokeAllRefreshTokens } from '../../services/token.service';
import { prisma } from '../../lib/prisma';
import { ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { maskEmail, maskPhone } from '../../utils/masking';
import { pageMeta, paginationSchema, skipTake } from '../../utils/pagination';
import { bodyOf, objectId, optionalTrimmed, trimmed } from '../../utils/zod';
import { presentUser } from '../users/user.presenter';

export const adminUserRouter = Router();

const read = requireStaff({ admin: true, sub_admin: 'canViewBookings' });
const manage = requireStaff({ admin: 'canProcessOverridesAndDisputes' });
const notify = requireStaff({ admin: true, sub_admin: 'canTriggerCustomerNotifications' });

/** Support staff see masked contact details (RBAC matrix). */
function forStaff(u: Parameters<typeof presentUser>[0], full: boolean) {
  const p = presentUser(u);
  if (full) return p;
  return { ...p, email: maskEmail(p.email) ?? '', phone: p.phone ? { ...p.phone, nationalNumber: maskPhone(p.phone.nationalNumber) ?? '' } : p.phone };
}

adminUserRouter.get('/', read, async (req, res) => {
  const q = paginationSchema.extend({ q: z.string().trim().max(100).optional(), status: z.enum(['active', 'suspended', 'deleted']).optional() }).parse(req.query);
  const contains = q.q ? { contains: q.q, mode: 'insensitive' as const } : undefined;
  const where: Prisma.UserWhereInput = {
    ...(q.status ? { status: q.status } : {}),
    ...(contains ? { OR: [{ fullName: contains }, { email: contains }, { userCode: contains }] } : {}),
  };
  const [total, rows] = await Promise.all([prisma.user.count({ where }), prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) })]);
  const full = canSeeFullContact(getStaff(req));
  ok(res, rows.map((u) => forStaff(u, full)), pageMeta(q, total));
});

adminUserRouter.get('/:id', read, async (req, res) => {
  const id = objectId.parse(req.params.id);
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) throw ApiError.notFound('User');
  const [stays, packages, experiences] = await Promise.all([
    prisma.stayBooking.count({ where: { userId: id } }),
    prisma.packageBooking.count({ where: { userId: id } }),
    prisma.experienceBooking.count({ where: { userId: id } }),
  ]);
  ok(res, { ...forStaff(u, canSeeFullContact(getStaff(req))), bookingCounts: { stays, packages, experiences } });
});

adminUserRouter.patch('/:id/status', manage, async (req, res) => {
  const staff = getStaff(req);
  const id = objectId.parse(req.params.id);
  const { status, reason } = z.object({ status: z.enum(['active', 'suspended']), reason: optionalTrimmed(300) }).refine((b) => b.status === 'active' || !!b.reason, { message: 'A reason is required to suspend', path: ['reason'] }).parse(bodyOf(req));
  const u = await prisma.user.findUnique({ where: { id }, select: { status: true } });
  if (!u || u.status === 'deleted') throw ApiError.notFound('User');
  await prisma.user.update({ where: { id }, data: { status } });
  if (status === 'suspended') await revokeAllRefreshTokens(id, 'user');
  await audit({ actor: { id: staff.id, role: staff.role }, action: status === 'suspended' ? 'SUSPEND_USER' : 'REINSTATE_USER', targetEntity: 'User', targetId: id, previousState: { status: u.status }, newState: { status, reason }, req });
  ok(res, { id, status });
});

/** Grants / revokes Mahastays Club membership (the 8% member discount). */
adminUserRouter.patch('/:id/membership', manage, async (req, res) => {
  const staff = getStaff(req);
  const id = objectId.parse(req.params.id);
  const input = z
    .object({ isClubMember: z.boolean(), tier: z.enum(['standard', 'gold', 'platinum']).default('standard'), expiresAt: z.coerce.date().optional() })
    .refine((b) => !b.expiresAt || b.expiresAt > new Date(), { message: 'expiresAt must be in the future', path: ['expiresAt'] })
    .parse(bodyOf(req));
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u || u.status === 'deleted') throw ApiError.notFound('User');
  const updated = await prisma.user.update({
    where: { id },
    data: {
      membership: {
        set: {
          isClubMember: input.isClubMember,
          tier: input.isClubMember ? input.tier : 'standard',
          joinedAt: input.isClubMember ? (u.membership.joinedAt ?? new Date()) : u.membership.joinedAt,
          expiresAt: input.isClubMember ? (input.expiresAt ?? null) : null,
        },
      },
    },
  });
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'SET_MEMBERSHIP', targetEntity: 'User', targetId: id, previousState: u.membership, newState: updated.membership, req });
  ok(res, presentUser(updated).membership);
});

adminUserRouter.post('/:id/notify', notify, async (req, res) => {
  const staff = getStaff(req);
  const id = objectId.parse(req.params.id);
  const { subject, message } = z.object({ subject: trimmed(3, 150), message: trimmed(3, 3000) }).parse(bodyOf(req));
  const u = await prisma.user.findUnique({ where: { id }, select: { email: true, fullName: true, status: true } });
  if (!u || u.status !== 'active') throw ApiError.notFound('User');
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
  await sendEmail({ to: u.email, subject, html: `<p>Hi ${esc(u.fullName)},</p><p>${esc(message).replace(/\n/g, '<br/>')}</p><p>— Mahastays Support</p>` });
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'NOTIFY_CUSTOMER', targetEntity: 'User', targetId: id, newState: { subject }, req });
  ok(res, { sent: true });
});

/** Admin full control: delete user account, wishlists, and tickets */
adminUserRouter.delete('/:id', manage, async (req, res) => {
  const staff = getStaff(req);
  const id = objectId.parse(req.params.id);
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) throw ApiError.notFound('User');

  await prisma.$transaction([
    prisma.wishlist.deleteMany({ where: { userId: id } }),
    prisma.supportTicket.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  await revokeAllRefreshTokens(id, 'user');
  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'DELETE_USER',
    targetEntity: 'User',
    targetId: id,
    previousState: { email: u.email, fullName: u.fullName },
    req,
  });

  ok(res, { id, deleted: true });
});
