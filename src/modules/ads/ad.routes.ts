import { Router } from 'express';
import { optionalAuth, requireRole } from '../../middlewares/authenticate';
import { clickLimiter, trackingLimiter } from '../../middlewares/rateLimiter';
import { requireStaff, getStaff } from '../../middlewares/staff';
import { requireApprovedVendor, requireVendor } from '../../middlewares/vendor';
import { created, ok } from '../../utils/apiResponse';
import { bodyOf, objectId } from '../../utils/zod';
import { activeAdsQuery, adListQuery, adToggleSchema, approvalSchema, createAdSchema, trackSchema, updateAdSchema } from './ad.schemas';
import { activeAds, createAd, deleteAd, listAds, setAdActive, setAdApproval, trackEvent, updateAd } from './ad.service';
import { audit } from '../../services/audit.service';

/** Public — GET /api/v1/ads/active, POST /api/v1/ads/track/* */
export const publicAdRouter = Router();

publicAdRouter.get('/active', optionalAuth, async (req, res) => {
  ok(res, await activeAds(activeAdsQuery.parse(req.query), req.auth));
});

publicAdRouter.post('/track/impression', trackingLimiter, async (req, res) => {
  ok(res, await trackEvent(trackSchema.parse(bodyOf(req)).adId, 'impression'));
});

publicAdRouter.post('/track/click', clickLimiter, async (req, res) => {
  ok(res, await trackEvent(trackSchema.parse(bodyOf(req)).adId, 'click'));
});

publicAdRouter.post('/track/conversion', requireRole('user'), clickLimiter, async (req, res) => {
  ok(res, await trackEvent(trackSchema.parse(bodyOf(req)).adId, 'conversion'));
});

/** Admin — /api/v1/admin/ads (requires canApproveAdCampaigns) */
export const adminAdRouter = Router();
const adminOnly = requireStaff({ admin: 'canApproveAdCampaigns' });

adminAdRouter.get('/', adminOnly, async (req, res) => {
  const { items, meta } = await listAds({}, adListQuery.parse(req.query));
  ok(res, items, meta);
});

adminAdRouter.post('/', adminOnly, async (req, res) => {
  const staff = getStaff(req);
  const ad = await createAd({ role: 'staff', staff }, createAdSchema.parse(bodyOf(req)));
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'CREATE_AD', targetEntity: 'AdCampaign', targetId: ad.id, req });
  created(res, ad);
});

adminAdRouter.put('/:id', adminOnly, async (req, res) => {
  ok(res, await updateAd({ role: 'staff', staff: getStaff(req) }, objectId.parse(req.params.id), updateAdSchema.parse(bodyOf(req))));
});

adminAdRouter.patch('/:id/approval', adminOnly, async (req, res) => {
  const staff = getStaff(req);
  const { approved } = approvalSchema.parse(bodyOf(req));
  const id = objectId.parse(req.params.id);
  const ad = await setAdApproval(staff, id, approved);
  await audit({ actor: { id: staff.id, role: staff.role }, action: approved ? 'APPROVE_AD' : 'REJECT_AD', targetEntity: 'AdCampaign', targetId: id, req });
  ok(res, ad);
});

adminAdRouter.patch('/:id/active', adminOnly, async (req, res) => {
  ok(res, await setAdActive({ role: 'staff', staff: getStaff(req) }, objectId.parse(req.params.id), adToggleSchema.parse(bodyOf(req)).isActive));
});

adminAdRouter.delete('/:id', adminOnly, async (req, res) => {
  ok(res, await deleteAd({ role: 'staff', staff: getStaff(req) }, objectId.parse(req.params.id)));
});

/** Vendor — /api/v1/vendor/ads (campaigns for their own listings; go live after admin approval) */
export const vendorAdRouter = Router();

vendorAdRouter.get('/', requireVendor(), async (req, res) => {
  const { items, meta } = await listAds({ vendorId: req.vendor!.id }, adListQuery.parse(req.query));
  ok(res, items, meta);
});

vendorAdRouter.post('/', requireApprovedVendor(), async (req, res) => {
  created(res, await createAd({ role: 'vendor', id: req.vendor!.id }, createAdSchema.parse(bodyOf(req))));
});

vendorAdRouter.put('/:id', requireApprovedVendor(), async (req, res) => {
  ok(res, await updateAd({ role: 'vendor', id: req.vendor!.id }, objectId.parse(req.params.id), updateAdSchema.parse(bodyOf(req))));
});

vendorAdRouter.patch('/:id/active', requireVendor(), async (req, res) => {
  ok(res, await setAdActive({ role: 'vendor', id: req.vendor!.id }, objectId.parse(req.params.id), adToggleSchema.parse(bodyOf(req)).isActive));
});

vendorAdRouter.delete('/:id', requireVendor(), async (req, res) => {
  ok(res, await deleteAd({ role: 'vendor', id: req.vendor!.id }, objectId.parse(req.params.id)));
});
