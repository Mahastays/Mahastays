import { Router } from 'express';
import { z } from 'zod';
import { requireRole } from '../../middlewares/authenticate';
import { ok } from '../../utils/apiResponse';
import { objectId, bodyOf } from '../../utils/zod';
import { getWishlist, toggleWishlist } from './wishlist.service';

export const wishlistRouter = Router();

const toggleSchema = z.object({ targetType: z.enum(['property', 'package', 'experience']), targetId: objectId });

wishlistRouter.get('/', requireRole('user'), async (req, res) => {
  ok(res, await getWishlist(req.auth!.id));
});

wishlistRouter.post('/toggle', requireRole('user'), async (req, res) => {
  const { targetType, targetId } = toggleSchema.parse(bodyOf(req));
  ok(res, await toggleWishlist(req.auth!.id, targetType, targetId));
});
