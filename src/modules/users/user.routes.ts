import { Router } from 'express';
import { requireRole } from '../../middlewares/authenticate';
import { clearRefreshCookie } from '../../services/token.service';
import { ok } from '../../utils/apiResponse';
import { bodyOf } from '../../utils/zod';
import { deleteMe, getMe, updateMe } from './user.service';
import { updateProfileSchema } from './user.schemas';

export const userRouter = Router();

userRouter.get('/me', requireRole('user'), async (req, res) => {
  ok(res, await getMe(req.auth!.id));
});

userRouter.put('/me', requireRole('user'), async (req, res) => {
  ok(res, await updateMe(req.auth!.id, updateProfileSchema.parse(bodyOf(req))));
});

userRouter.delete('/me', requireRole('user'), async (req, res) => {
  const result = await deleteMe(req.auth!.id);
  clearRefreshCookie(res);
  ok(res, result);
});
