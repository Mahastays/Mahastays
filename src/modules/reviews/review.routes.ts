import { Router } from 'express';
import { optionalAuth, requireRole } from '../../middlewares/authenticate';
import { created, ok } from '../../utils/apiResponse';
import { paginationSchema } from '../../utils/pagination';
import { objectId, bodyOf } from '../../utils/zod';
import { createReviewSchema, listReviewsQuery } from './review.schemas';
import { createReview, listMyReviews, listReviews, markHelpful } from './review.service';

export const reviewRouter = Router();

/** Public: approved reviews of a property / package / experience, with a rating summary in `meta.summary`. */
reviewRouter.get('/', optionalAuth, async (req, res) => {
  const { items, meta } = await listReviews(listReviewsQuery.parse(req.query), req.auth?.role === 'user' ? req.auth.id : undefined);
  ok(res, items, meta);
});

reviewRouter.get('/mine', requireRole('user'), async (req, res) => {
  const { items, meta } = await listMyReviews(req.auth!.id, paginationSchema.parse(req.query));
  ok(res, items, meta);
});

reviewRouter.post('/', requireRole('user'), async (req, res) => {
  created(res, await createReview(req.auth!.id, createReviewSchema.parse(bodyOf(req))));
});

reviewRouter.post('/:id/helpful', requireRole('user'), async (req, res) => {
  ok(res, await markHelpful(objectId.parse(req.params.id), req.auth!.id));
});
