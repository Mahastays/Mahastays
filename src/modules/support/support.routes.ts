import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { requireRole } from '../../middlewares/authenticate';
import { requireStaff, getStaff } from '../../middlewares/staff';
import { audit } from '../../services/audit.service';
import { notify } from '../../services/notification.service';
import { created, ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, paginationSchema, skipTake } from '../../utils/pagination';
import { bodyOf, objectId } from '../../utils/zod';

export const supportRouter = Router();
export const adminSupportRouter = Router();

const messageObj = (role: string, id: string, name: string, body: string) => ({
  senderRole: role,
  senderId: id,
  senderName: name,
  body,
  at: new Date().toISOString(),
});

/* ── Customer tickets ── */
supportRouter.use(requireRole('user'));

supportRouter.post('/tickets', async (req, res) => {
  const body = z
    .object({
      subject: z.string().trim().min(5).max(150),
      message: z.string().trim().min(10).max(3000),
      category: z.enum(['general', 'booking', 'payment', 'refund', 'listing', 'other']).default('general'),
      bookingRef: z.string().max(40).optional(),
    })
    .parse(bodyOf(req));

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.id } });
  const ticketCode = `TCK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketCode,
      userId: user.id,
      subject: body.subject,
      category: body.category,
      bookingRef: body.bookingRef,
      priority: body.category === 'payment' || body.category === 'refund' ? 'high' : 'normal',
      messages: [messageObj('user', user.id, user.fullName, body.message)] as any,
    },
  });

  created(res, ticket);
});

supportRouter.get('/tickets', async (req, res) => {
  const q = paginationSchema.parse(req.query);
  const where = { userId: req.auth!.id };
  const [rows, total] = await Promise.all([
    prisma.supportTicket.findMany({ where, orderBy: { updatedAt: 'desc' }, ...skipTake(q) }),
    prisma.supportTicket.count({ where }),
  ]);
  ok(res, rows, pageMeta(q, total));
});

supportRouter.get('/tickets/:id', async (req, res) => {
  const id = objectId.parse(req.params.id);
  const ticket = await prisma.supportTicket.findFirst({ where: { id, userId: req.auth!.id } });
  if (!ticket) throw ApiError.notFound('Ticket');
  ok(res, ticket);
});

supportRouter.post('/tickets/:id/messages', async (req, res) => {
  const id = objectId.parse(req.params.id);
  const { message } = z.object({ message: z.string().trim().min(1).max(3000) }).parse(bodyOf(req));
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.id } });

  const ticket = await prisma.supportTicket.findFirst({ where: { id, userId: user.id } });
  if (!ticket) throw ApiError.notFound('Ticket');
  if (ticket.status === 'closed') throw ApiError.conflict('This ticket is closed. Please open a new one.');

  const msgs = [...((ticket.messages as any[]) ?? []), messageObj('user', user.id, user.fullName, message)];
  const updated = await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      messages: msgs as any,
      status: ticket.status === 'resolved' ? 'open' : ticket.status,
    },
  });
  ok(res, updated);
});

/* ── Staff management ── */
adminSupportRouter.use(requireStaff({ admin: true, sub_admin: 'canManageInquiryTickets' }));

adminSupportRouter.get('/tickets', async (req, res) => {
  const q = paginationSchema
    .extend({
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      category: z.string().optional(),
      mine: z.enum(['true', 'false']).optional(),
    })
    .parse(req.query);

  const where: any = {
    ...(q.status ? { status: q.status } : {}),
    ...(q.category ? { category: q.category } : {}),
    ...(q.mine === 'true' ? { assignedToId: req.staff!.id } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
      ...skipTake(q),
      include: { user: { select: { fullName: true, userCode: true, email: true } } },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  ok(res, rows, pageMeta(q, total));
});

adminSupportRouter.get('/tickets/:id', async (req, res) => {
  const id = objectId.parse(req.params.id);
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { user: { select: { fullName: true, userCode: true, email: true } } },
  });
  if (!ticket) throw ApiError.notFound('Ticket');
  ok(res, ticket);
});

adminSupportRouter.post('/tickets/:id/reply', async (req, res) => {
  const id = objectId.parse(req.params.id);
  const staff = getStaff(req);
  const { message } = z.object({ message: z.string().trim().min(1).max(3000) }).parse(bodyOf(req));

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw ApiError.notFound('Ticket');

  const staffName = staff.role === 'super_admin' ? 'Super Admin' : staff.role === 'admin' ? 'Admin' : 'Support Specialist';
  const msgs = [...((ticket.messages as any[]) ?? []), messageObj(staff.role, staff.id, staffName, message)];

  const updated = await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      messages: msgs as any,
      status: 'in_progress',
      assignedToId: ticket.assignedToId ?? staff.id,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: ticket.userId } });
  await notify({
    recipientId: ticket.userId,
    role: 'user',
    type: 'SUPPORT_REPLY',
    title: `Update on ${ticket.ticketCode}`,
    body: message.slice(0, 200),
    email: user?.email,
  });

  ok(res, updated);
});

adminSupportRouter.patch('/tickets/:id', async (req, res) => {
  const id = objectId.parse(req.params.id);
  const staff = getStaff(req);
  const body = z
    .object({
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
      assignToMe: z.boolean().optional(),
    })
    .parse(bodyOf(req));

  const { assignToMe, ...rest } = body;
  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...rest,
      ...(assignToMe ? { assignedToId: staff.id } : {}),
    },
  }).catch(() => null);

  if (!ticket) throw ApiError.notFound('Ticket');
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'UPDATE_TICKET', targetEntity: 'SupportTicket', targetId: ticket.id, newState: body, req });
  ok(res, ticket);
});
