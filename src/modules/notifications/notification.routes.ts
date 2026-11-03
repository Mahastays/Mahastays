import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middlewares/authenticate';
import { ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, paginationSchema, skipTake } from '../../utils/pagination';
import { objectId } from '../../utils/zod';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

/**
 * GET /notifications — paginated notification inbox for current actor
 */
notificationRouter.get('/', async (req, res) => {
  const q = paginationSchema
    .extend({
      unread: z.enum(['true', 'false']).optional(),
    })
    .parse(req.query);

  const actor = req.auth!;
  const who = { recipientId: actor.id, recipientRole: actor.role };
  const where = {
    ...who,
    ...(q.unread === 'true' ? { readAt: null } : {}),
  };

  const [rows, total, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...who, readAt: null } }),
  ]);

  ok(res, rows, { ...pageMeta(q, total), unread });
});

/**
 * GET /notifications/unread-count — number of unread notifications
 */
notificationRouter.get('/unread-count', async (req, res) => {
  const actor = req.auth!;
  const count = await prisma.notification.count({
    where: { recipientId: actor.id, recipientRole: actor.role, readAt: null },
  });
  ok(res, { unread: count });
});

/**
 * PATCH /notifications/:id/read — mark notification as read
 */
notificationRouter.patch('/:id/read', async (req, res) => {
  const id = objectId.parse(req.params.id);
  const actor = req.auth!;
  const r = await prisma.notification.updateMany({
    where: { id, recipientId: actor.id, recipientRole: actor.role },
    data: { readAt: new Date() },
  });
  if (!r.count) throw ApiError.notFound('Notification');
  ok(res, { read: true });
});

/**
 * POST /notifications/read-all — mark all notifications as read
 */
notificationRouter.post('/read-all', async (req, res) => {
  const actor = req.auth!;
  const r = await prisma.notification.updateMany({
    where: { recipientId: actor.id, recipientRole: actor.role, readAt: null },
    data: { readAt: new Date() },
  });
  ok(res, { marked: r.count });
});
