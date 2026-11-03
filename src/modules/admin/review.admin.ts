import { Router } from 'express';
import { getStaff, requireStaff } from '../../middlewares/staff';
import { ok } from '../../utils/apiResponse';
import { bodyOf, objectId } from '../../utils/zod';
import { moderateSchema, staffReviewQuery } from '../reviews/review.schemas';
import { deleteReview, listForStaff, moderateReview } from '../reviews/review.service';

export const adminReviewRouter = Router();

const moderate = requireStaff({ admin: true, sub_admin: 'canApproveReviews' });

adminReviewRouter.get('/', moderate, async (req, res) => {
  const { items, meta } = await listForStaff(staffReviewQuery.parse(req.query));
  ok(res, items, meta);
});

adminReviewRouter.patch('/:id/moderate', moderate, async (req, res) => {
  ok(res, await moderateReview(objectId.parse(req.params.id), getStaff(req), moderateSchema.parse(bodyOf(req)), req));
});

/** Hard delete is admin-only (support staff can only approve / reject). */
adminReviewRouter.delete('/:id', requireStaff({ admin: true }), async (req, res) => {
  ok(res, await deleteReview(objectId.parse(req.params.id), getStaff(req), req));
});
