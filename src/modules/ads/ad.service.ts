import type { AdCampaign, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { ageFromDob } from '../../utils/dates';
import { pageMeta, skipTake, type PaginationInput } from '../../utils/pagination';
import { omit } from '../../utils/object';
import type { StaffContext } from '../../types/auth';
import type { ActiveAdsQuery, CreateAdInput, UpdateAdInput } from './ad.schemas';

type AdActor = { role: 'vendor'; id: string } | { role: 'staff'; staff: StaffContext };

const CTA: Record<'package' | 'property' | 'activity', (id: string) => string> = {
  package: (id) => `/packages/${id}`,
  property: (id) => `/explore/${id}`,
  activity: (id) => `/experiences/${id}`,
};

const emptyTargeting = { locations: [], userRoles: [], interests: [], occasions: [], device: [], showOnPages: [] };

/** Public shape (what the carousels / popups need). Budget and targeting rules stay private. */
export function presentAd(ad: AdCampaign) {
  return {
    id: ad.id,
    _id: ad.id,
    adName: ad.adName,
    adType: ad.adType,
    placement: ad.placement,
    target: ad.target,
    creative: ad.creative,
    priority: ad.priority,
    expiresAt: ad.expiresAt,
  };
}

/** Full shape for the owner / staff dashboards, including performance. */
export function presentAdForOwner(ad: AdCampaign) {
  return {
    ...omit(ad, 'spentSoFar', 'impressions', 'clicks', 'conversions'),
    _id: ad.id,
    budget: { ...ad.budget, spentSoFar: ad.spentSoFar, impressions: ad.impressions, clicks: ad.clicks, conversions: ad.conversions },
    ctrPercent: ad.impressions ? Math.round((ad.clicks / ad.impressions) * 10_000) / 100 : 0,
  };
}

async function validateTarget(actor: AdActor, target: CreateAdInput['target']) {
  const select = { id: true, vendorId: true, status: true } as const;
  const row =
    target.targetType === 'package'
      ? await prisma.package.findUnique({ where: { id: target.targetId }, select })
      : target.targetType === 'property'
        ? await prisma.property.findUnique({ where: { id: target.targetId }, select })
        : await prisma.experience.findUnique({ where: { id: target.targetId }, select });
  if (!row) throw ApiError.unprocessable('The promoted listing does not exist', { targetId: target.targetId }, 'TARGET_INVALID');
  if (actor.role === 'vendor' && row.vendorId !== actor.id) throw ApiError.forbidden('You can only promote your own listings', 'TARGET_NOT_OWNED');
}

export async function createAd(actor: AdActor, input: CreateAdInput) {
  await validateTarget(actor, input.target);
  const isStaff = actor.role === 'staff';
  const ad = await prisma.adCampaign.create({
    data: {
      adName: input.adName,
      adType: input.adType,
      placement: input.placement,
      target: { ...input.target, ctaLink: input.target.ctaLink ?? CTA[input.target.targetType](input.target.targetId) },
      creative: input.creative,
      targeting: { ...emptyTargeting, ...input.targeting },
      budget: input.budget,
      priority: input.priority,
      isActive: input.isActive,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      createdById: isStaff ? actor.staff.id : actor.id,
      createdByRole: isStaff ? actor.staff.role : 'vendor',
      approvedByAdmin: isStaff, // vendor campaigns wait for an admin
      approvedByAdminId: isStaff ? actor.staff.id : undefined,
    },
  });
  return presentAdForOwner(ad);
}

async function loadEditable(actor: AdActor, id: string): Promise<AdCampaign> {
  const ad = await prisma.adCampaign.findUnique({ where: { id } });
  if (!ad || (actor.role === 'vendor' && ad.createdById !== actor.id)) throw ApiError.notFound('Ad campaign');
  return ad;
}

export async function updateAd(actor: AdActor, id: string, input: UpdateAdInput) {
  const ad = await loadEditable(actor, id);
  if (input.target) await validateTarget(actor, input.target);
  const data: Prisma.AdCampaignUncheckedUpdateInput = {};
  if (input.adName !== undefined) data.adName = input.adName;
  if (input.adType !== undefined) data.adType = input.adType;
  if (input.placement !== undefined) data.placement = input.placement;
  if (input.target !== undefined) data.target = { ...input.target, ctaLink: input.target.ctaLink ?? CTA[input.target.targetType](input.target.targetId) };
  if (input.creative !== undefined) data.creative = input.creative;
  if (input.targeting !== undefined) data.targeting = { ...emptyTargeting, ...input.targeting };
  if (input.budget !== undefined) data.budget = input.budget;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.startsAt !== undefined) data.startsAt = input.startsAt;
  if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt;
  // a vendor changing creative / targeting / budget sends the campaign back to review
  if (actor.role === 'vendor' && ad.approvedByAdmin && (input.creative || input.target || input.targeting || input.budget)) {
    data.approvedByAdmin = false;
    data.approvedByAdminId = null;
  }
  return presentAdForOwner(await prisma.adCampaign.update({ where: { id }, data }));
}

export async function setAdActive(actor: AdActor, id: string, isActive: boolean) {
  await loadEditable(actor, id);
  return presentAdForOwner(await prisma.adCampaign.update({ where: { id }, data: { isActive } }));
}

export async function setAdApproval(staff: StaffContext, id: string, approved: boolean) {
  const ad = await prisma.adCampaign.findUnique({ where: { id } });
  if (!ad) throw ApiError.notFound('Ad campaign');
  return presentAdForOwner(await prisma.adCampaign.update({ where: { id }, data: { approvedByAdmin: approved, approvedByAdminId: approved ? staff.id : null } }));
}

export async function deleteAd(actor: AdActor, id: string) {
  await loadEditable(actor, id);
  await prisma.adCampaign.delete({ where: { id } });
  return { deleted: true };
}

export async function listAds(scope: { vendorId?: string }, q: PaginationInput & { approved?: boolean; active?: boolean; q?: string }) {
  const where: Prisma.AdCampaignWhereInput = {
    ...(scope.vendorId ? { createdById: scope.vendorId, createdByRole: 'vendor' } : {}),
    ...(q.approved !== undefined ? { approvedByAdmin: q.approved } : {}),
    ...(q.active !== undefined ? { isActive: q.active } : {}),
    ...(q.q ? { adName: { contains: q.q, mode: 'insensitive' } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.adCampaign.count({ where }),
    prisma.adCampaign.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) }),
  ]);
  return { items: rows.map(presentAdForOwner), meta: pageMeta(q, total) };
}

/* ───────────────────────────── serving ───────────────────────────── */

const lower = (xs: string[]) => xs.map((x) => x.toLowerCase());
/** An empty rule list or 'all' means "no restriction"; otherwise the request context must match if specified. */
const matches = (rule: string[], context?: string | string[]) => {
  if (!rule || rule.length === 0) return true;
  if (rule.some((r) => r.toLowerCase() === 'all')) return true;
  if (context === undefined || context === null || context === '' || (Array.isArray(context) && context.length === 0)) return true;
  const have = lower(Array.isArray(context) ? context : [context]);
  return lower(rule).some((r) => have.includes(r) || r === 'all');
};

/** Helper matching the exact page-wise categorization used in the Admin AdsView */
export function getAdSection(ad: AdCampaign): 'home' | 'stays' | 'packages' | 'experiences' {
  const pl = String(ad.placement || '').toLowerCase();
  const adType = String(ad.adType || '').toLowerCase();
  const targetType = String(ad.target?.targetType || '').toLowerCase();
  const cta = String(ad.target?.ctaLink || '').toLowerCase();

  if (pl === 'homepage' || adType === 'card' || pl === 'home') {
    return 'home';
  }
  if (pl === 'packages' || pl === 'packages_hub' || targetType === 'package' || cta.includes('/packages')) {
    return 'packages';
  }
  if (pl === 'experiences' || pl === 'experience' || pl === 'experiences_hub' || targetType === 'activity' || cta.includes('/experiences')) {
    return 'experiences';
  }
  if (pl === 'stays' || pl === 'search_results' || pl === 'listing_detail' || pl === 'property_page' || targetType === 'property' || cta.includes('/explore') || cta.includes('/properties')) {
    return 'stays';
  }
  return 'home';
}

export async function activeAds(q: ActiveAdsQuery, viewer?: { id: string; role: string }) {
  const now = new Date();
  const candidates = await prisma.adCampaign.findMany({
    where: {
      isActive: true,
      approvedByAdmin: true,
      ...(q.adType ? { adType: q.adType } : {}),
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  });

  let age: number | null = null;
  if (viewer?.role === 'user') {
    const u = await prisma.user.findUnique({ where: { id: viewer.id }, select: { dateOfBirth: true } });
    age = ageFromDob(u?.dateOfBirth);
  }

  const effectiveRole = viewer?.role ?? 'guest';
  const rolesToCheck = effectiveRole === 'guest' ? ['guest', 'user', 'all'] : [effectiveRole, 'all'];

  return candidates
    .filter((ad) => {
      if (!q.placement || q.placement === 'all') return true;
      const section = getAdSection(ad);

      if (q.placement === 'stays' || q.placement === 'search_results' || q.placement === 'property_page') {
        return section === 'stays';
      }
      if (q.placement === 'packages') {
        return section === 'packages';
      }
      if (q.placement === 'experiences') {
        return section === 'experiences';
      }
      if (q.placement === 'homepage' || q.placement === 'home') {
        return section === 'home';
      }
      return false;
    })
    .filter((ad) => {
      if (ad.startsAt && new Date(ad.startsAt).getTime() > now.getTime()) return false;
      if (ad.expiresAt && new Date(ad.expiresAt).getTime() <= now.getTime()) return false;
      return true;
    })
    .filter((ad) => ad.spentSoFar < ad.budget.totalBudget) // budget exhausted → stop serving
    .filter((ad) => {
      const t = ad.targeting;
      if (!t) return true;
      if (t.showOnPages && t.showOnPages.length && q.page && !t.showOnPages.includes(q.page) && !t.showOnPages.includes('all')) return false;
      if (t.device && !matches(t.device, q.device)) return false;
      if (t.locations && !matches(t.locations, q.city)) return false;
      if (t.occasions && !matches(t.occasions, q.occasion)) return false;
      if (t.interests && !matches(t.interests, q.interests)) return false;
      if (t.userRoles && t.userRoles.length > 0 && !t.userRoles.some((r) => rolesToCheck.includes(r.toLowerCase()))) return false;
      if (t.userAgeRange && age !== null && (age < t.userAgeRange.min || age > t.userAgeRange.max)) return false;
      return true;
    })
    .slice(0, q.limit)
    .map(presentAd);
}

/**
 * Counters use atomic increments. Spend is capped: once the campaign budget is used up it is switched off
 * and further events are ignored (so a click flood cannot overspend the advertiser).
 */
export async function trackEvent(adId: string, kind: 'impression' | 'click' | 'conversion'): Promise<{ tracked: boolean }> {
  const ad = await prisma.adCampaign.findFirst({ where: { id: adId, isActive: true, approvedByAdmin: true }, select: { budget: true, spentSoFar: true } });
  if (!ad) return { tracked: false };
  const cost = kind === 'impression' ? ad.budget.costPerImpression : kind === 'click' ? ad.budget.costPerClick : 0;
  if (ad.spentSoFar + cost > ad.budget.totalBudget) {
    await prisma.adCampaign.updateMany({ where: { id: adId }, data: { isActive: false } });
    return { tracked: false };
  }
  const counter = kind === 'impression' ? { impressions: { increment: 1 } } : kind === 'click' ? { clicks: { increment: 1 } } : { conversions: { increment: 1 } };
  await prisma.adCampaign.update({ where: { id: adId }, data: { ...counter, ...(cost > 0 ? { spentSoFar: { increment: cost } } : {}) } });
  return { tracked: true };
}
