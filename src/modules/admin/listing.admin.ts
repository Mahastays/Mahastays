import { Router } from 'express';
import { z } from 'zod';
import { getStaff, requireStaff } from '../../middlewares/staff';
import { prisma } from '../../lib/prisma';
import { audit } from '../../services/audit.service';
import { ok, created } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, paginationSchema, skipTake } from '../../utils/pagination';
import { bodyOf, objectId, optionalTrimmed } from '../../utils/zod';
import { staffSetFeatured, staffSetListingStatus, type ListingKind } from '../catalog/listing.service';
import { getExperienceForStaff } from '../experiences/experience.service';
import { getPackageForStaff } from '../packages/package.service';
import { getPropertyForStaff } from '../properties/property.service';

const listQuery = paginationSchema.extend({
  status: z.enum(['pending_approval', 'active', 'inactive', 'rejected', 'blocked', 'archived']).optional(),
  vendorId: objectId.optional(),
  q: z.string().trim().max(100).optional(),
});

const statusSchema = z.object({ status: z.enum(['active', 'rejected', 'blocked', 'inactive']), reason: optionalTrimmed(300) });

const APPROVE_KEY = { property: 'canApproveProperties', package: 'canApprovePackages', experience: 'canApproveExperiences' } as const;

import { presentProperty } from '../properties/property.presenter';
import { presentPackage } from '../packages/package.presenter';
import { presentExperience } from '../experiences/experience.presenter';

async function listRows(kind: ListingKind, q: z.infer<typeof listQuery>): Promise<{ total: number; rows: any[] }> {
  const contains = q.q ? { contains: q.q, mode: 'insensitive' as const } : undefined;
  const base = { ...(q.status ? { status: q.status } : {}), ...(q.vendorId ? { vendorId: q.vendorId } : {}) };
  const orderBy = [{ createdAt: 'desc' as const }];
  if (kind === 'property') {
    const where = { ...base, ...(contains ? { name: contains } : {}) };
    const [total, rows] = await Promise.all([prisma.property.count({ where }), prisma.property.findMany({ where, orderBy, ...skipTake(q) })]);
    return { total, rows: rows.map((r) => ({ ...presentProperty(r), title: r.name })) };
  }
  if (kind === 'package') {
    const where = { ...base, ...(contains ? { title: contains } : {}) };
    const [total, rows] = await Promise.all([prisma.package.count({ where }), prisma.package.findMany({ where, orderBy, ...skipTake(q) })]);
    return { total, rows: rows.map((r) => ({ ...presentPackage(r), title: r.title })) };
  }
  const where = { ...base, ...(contains ? { title: contains } : {}) };
  const [total, rows] = await Promise.all([prisma.experience.count({ where }), prisma.experience.findMany({ where, orderBy, ...skipTake(q) })]);
  return { total, rows: rows.map((r) => ({ ...presentExperience(r), title: r.title })) };
}

/** Content fields support staff may correct without involving the vendor (typos, policy wording). */
const CONTENT_FIELDS = {
  property: z.object({ description: z.string().trim().min(10).max(1000), longDescription: z.string().trim().max(8000), tagline: z.string().trim().max(250), badge: z.string().trim().max(60) }).partial(),
  package: z.object({ shortDesc: z.string().trim().min(10).max(300), description: z.string().trim().max(3000), overview: z.string().trim().max(8000), badge: z.string().trim().max(60) }).partial(),
  experience: z.object({ description: z.string().trim().min(10).max(1500), overview: z.string().trim().max(8000) }).partial(),
} as const;

/** One router per listing kind: /admin/properties, /admin/packages, /admin/experiences */
export function adminListingRouter(kind: ListingKind): Router {
  const r = Router();
  const read = requireStaff({ admin: true, sub_admin: true });

  r.get('/', read, async (req, res) => {
    const q = listQuery.parse(req.query);
    const { total, rows } = await listRows(kind, q);
    ok(res, rows, pageMeta(q, total));
  });

  r.post('/', read, async (req, res) => {
    const body: any = bodyOf(req);
    let vendorId = body.vendorId;
    if (!vendorId || vendorId.startsWith('vnd_')) {
      const v = await prisma.vendor.findFirst({ where: { status: 'active' } }) || await prisma.vendor.findFirst();
      if (v) vendorId = v.id;
    }

    if (kind === 'property') {
      const rawRooms = Array.isArray(body.rooms) && body.rooms.length > 0 ? body.rooms : [{
        name: 'Executive Valley Suite',
        maxGuests: 2,
        capacity: { adults: 2, children: 1 },
        basePrice: body.numericPrice || 7500,
        count: 5,
        images: Array.isArray(body.images) ? (typeof body.images[0] === 'string' ? body.images : [body.images[0]?.url]) : [],
        amenities: ['Breakfast included', 'Valley View', 'WiFi', 'AC'],
      }];
      const rooms = rawRooms.map((r: any, idx: number) => ({
        roomId: r.roomId || `rm_${Date.now()}_${idx}`,
        name: r.name || 'Suite Room',
        badge: r.badge || null,
        tagline: r.tagline || null,
        maxGuests: r.maxGuests || 2,
        capacity: r.capacity || { adults: 2, children: 1 },
        basePrice: r.basePrice || body.numericPrice || 7500,
        originalPrice: r.originalPrice || Math.round((r.basePrice || 7500) * 1.25),
        count: r.count || 1,
        images: Array.isArray(r.images) ? r.images : [],
        amenities: Array.isArray(r.amenities) ? r.amenities : ['Breakfast included'],
      }));
      const numericPrice = Math.min(...rooms.map((r: any) => r.basePrice));
      const originalPrice = Math.min(...rooms.map((r: any) => r.originalPrice || r.basePrice));

      const images = Array.isArray(body.images) && body.images.length > 0
        ? body.images.map((img: any, i: number) => typeof img === 'string' ? { url: img, alt: body.name || 'Property', isCover: i === 0 } : { url: img.url, alt: img.alt || body.name || 'Property', isCover: !!img.isCover || i === 0 })
        : [{ url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', alt: 'Cover', isCover: true }];

      const property = await prisma.property.create({
        data: {
          vendorId: vendorId || '6adeef17f4597150f0c199a4',
          name: body.name || 'New Property',
          slug: ((body.name || 'new-property') + '-' + Date.now().toString(36)).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          propertyType: body.propertyType || 'resort',
          tagline: body.tagline || null,
          badge: body.badge || 'Partner Listing',
          description: body.description || 'Spacious property with state-of-the-art amenities.',
          longDescription: body.longDescription || body.description || null,
          location: body.location || 'Venna Lake Road, Mahabaleshwar',
          city: body.city || 'Mahabaleshwar',
          country: body.country || 'India',
          address: body.address || { fullAddress: body.location || 'Venna Lake Road, Mahabaleshwar', lat: 17.9237, lng: 73.6586 },
          images,
          highlights: Array.isArray(body.highlights) ? body.highlights : [
            { title: 'Stunning valley & waterfall view', desc: 'Panoramic Western Ghats vistas' },
            { title: 'Private infinity pool with heating', desc: 'Heated luxury pool deck' },
          ],
          amenities: Array.isArray(body.amenities)
            ? body.amenities.map((a: any) => typeof a === 'string' ? { name: a } : a)
            : [{ name: 'Free WiFi' }, { name: 'Breakfast Included' }, { name: 'Swimming Pool' }],
          policies: body.policies || { checkInTime: '14:00', checkOutTime: '11:00' },
          rooms,
          numericPrice,
          originalPrice,
          pricingRules: body.pricingRules || null,
          status: 'pending_approval',
        } as any,
      });
      created(res, presentProperty(property));
      return;
    }

    if (kind === 'package') {
      const pkg = await prisma.package.create({
        data: {
          vendorId: vendorId || '6adeef17f4597150f0c199a4',
          title: body.title || 'New Tour Package',
          slug: ((body.title || 'new-package') + '-' + Date.now().toString(36)).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          shortDesc: body.shortDesc || body.description?.slice(0, 200) || 'Exciting tour package',
          description: body.description || 'Curated itinerary package.',
          overview: body.overview || body.description || 'All-inclusive trip.',
          city: body.city || 'Mahabaleshwar',
          durationDays: body.durationDays || 3,
          durationNights: body.durationNights || 2,
          numericPrice: body.numericPrice || 12000,
          originalPrice: body.originalPrice || 15000,
          thumbnail: body.thumbnail || body.images?.[0] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
          images: Array.isArray(body.images) ? body.images : [],
          pricingRules: body.pricingRules || null,
          status: 'pending_approval',
        } as any,
      });
      created(res, presentPackage(pkg));
      return;
    }

    const exp = await prisma.experience.create({
      data: {
        vendorId: vendorId || '6adeef17f4597150f0c199a4',
        title: body.title || 'New Mountain Experience',
        slug: ((body.title || 'new-experience') + '-' + Date.now().toString(36)).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: body.description || 'Scenic mountain adventure.',
        overview: body.overview || body.description || 'Guided trek and activities.',
        city: body.city || 'Mahabaleshwar',
        durationHours: body.durationHours || 3,
        numericPrice: body.numericPrice || 999,
        originalPrice: body.originalPrice || 1499,
        image: body.image || body.images?.[0] || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
        images: Array.isArray(body.images) ? body.images : [],
        pricingRules: body.pricingRules || null,
        status: 'pending_approval',
      } as any,
    });
    created(res, presentExperience(exp));
  });

  r.get('/:id', read, async (req, res) => {
    const id = objectId.parse(req.params.id);
    ok(res, await (kind === 'property' ? getPropertyForStaff(id) : kind === 'package' ? getPackageForStaff(id) : getExperienceForStaff(id)));
  });

  /** Approve / reject / block / hide. Fine-grained permissions are enforced in the service. */
  r.patch('/:id/status', requireStaff({ admin: true, sub_admin: 'canFlagFraudulentListings' }), async (req, res) => {
    ok(res, await staffSetListingStatus(kind, getStaff(req), objectId.parse(req.params.id), statusSchema.parse(bodyOf(req)), req));
  });

  r.patch('/:id/featured', requireStaff({ admin: APPROVE_KEY[kind] }), async (req, res) => {
    const { featured } = z.object({ featured: z.boolean() }).parse(bodyOf(req));
    ok(res, await staffSetFeatured(kind, getStaff(req), objectId.parse(req.params.id), featured, req));
  });

  r.patch('/:id/accepting-bookings', requireStaff({ admin: true, sub_admin: true }), async (req, res) => {
    const staff = getStaff(req);
    const id = objectId.parse(req.params.id);
    const { acceptingBookings } = z.object({ acceptingBookings: z.boolean() }).parse(bodyOf(req));
    let updatedItem: any;
    if (kind === 'property') {
      updatedItem = await prisma.property.update({ where: { id }, data: { acceptingBookings } as any });
    } else if (kind === 'package') {
      updatedItem = await prisma.package.update({ where: { id }, data: { acceptingBookings } as any });
    } else {
      updatedItem = await prisma.experience.update({ where: { id }, data: { acceptingBookings } as any });
    }
    await audit({
      actor: { id: staff.id, role: staff.role },
      action: 'UPDATE_BOOKING_STATUS',
      targetEntity: kind[0].toUpperCase() + kind.slice(1),
      targetId: id,
      newState: { acceptingBookings },
      req,
    });
    ok(res, { id, acceptingBookings: updatedItem.acceptingBookings });
  });

  r.patch('/:id/content', requireStaff({ admin: true, sub_admin: 'canEditListingDescriptions' }), async (req, res) => {
    const staff = getStaff(req);
    const id = objectId.parse(req.params.id);
    const data = CONTENT_FIELDS[kind].parse(bodyOf(req));
    if (Object.keys(data).length === 0) throw ApiError.badRequest('Provide at least one field to update');
    if (kind === 'property') await prisma.property.update({ where: { id }, data });
    else if (kind === 'package') await prisma.package.update({ where: { id }, data });
    else await prisma.experience.update({ where: { id }, data });
    await audit({ actor: { id: staff.id, role: staff.role }, action: 'EDIT_LISTING_CONTENT', targetEntity: kind[0].toUpperCase() + kind.slice(1), targetId: id, newState: { fields: Object.keys(data) }, req });
    ok(res, { id, updated: Object.keys(data) });
  });

  r.put('/:id', requireStaff({ admin: true }), async (req, res) => {
    const staff = getStaff(req);
    const id = objectId.parse(req.params.id);
    const body: any = bodyOf(req);

    if (kind === 'property') {
      const data: any = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.propertyType !== undefined) data.propertyType = body.propertyType;
      if (body.tagline !== undefined) data.tagline = body.tagline;
      if (body.badge !== undefined) data.badge = body.badge;
      if (body.tags !== undefined) data.tags = body.tags;
      if (body.description !== undefined) data.description = body.description;
      if (body.longDescription !== undefined) data.longDescription = body.longDescription;
      if (body.location !== undefined) data.location = body.location;
      if (body.city !== undefined) data.city = body.city;
      if (body.country !== undefined) data.country = body.country;
      if (body.address !== undefined) data.address = body.address;
      if (body.images !== undefined) {
        data.images = (body.images || []).map((img: any, i: number) =>
          typeof img === 'string' ? { url: img, alt: '', isCover: i === 0 } : img
        );
      }
      if (body.gallery !== undefined) data.gallery = body.gallery;
      if (body.videos !== undefined) data.videos = body.videos;
      if (body.host !== undefined) data.host = body.host;
      if (body.highlights !== undefined) data.highlights = body.highlights;
      if (body.attractions !== undefined) data.attractions = body.attractions;
      if (body.policies !== undefined) data.policies = body.policies;
      if (body.bgColor !== undefined) data.bgColor = body.bgColor;
      if (body.gradientOverlay !== undefined) data.gradientOverlay = body.gradientOverlay;
      if (body.amenities !== undefined) {
        data.amenities = (body.amenities || []).map((a: any) => typeof a === 'string' ? { name: a, icon: '' } : a);
        data.amenityKeys = (body.amenities || []).map((a: any) => (typeof a === 'string' ? a : a.name).toLowerCase().replace(/[^a-z0-9]+/g, '_'));
      }
      if (body.rooms !== undefined) {
        const rooms = (body.rooms || []).map((r: any, idx: number) => ({
          roomId: r.roomId || `rm_${idx + 1}`,
          name: r.name,
          badge: r.badge || null,
          tagline: r.tagline || null,
          roomSize: r.roomSize ? Number(r.roomSize) : null,
          bedType: r.bedType || 'King Bed',
          maxGuests: Number(r.maxGuests) || 2,
          capacity: { adults: Number(r.maxGuests) || 2, children: 1 },
          basePrice: Number(r.basePrice) || 6000,
          originalPrice: r.originalPrice ? Number(r.originalPrice) : null,
          count: Number(r.count) || 1,
          images: r.images || [],
          amenities: r.amenities || [],
        }));
        data.rooms = rooms;
        const prices = rooms.map((r: any) => r.basePrice).filter(Boolean);
        if (prices.length > 0) {
          data.numericPrice = Math.min(...prices);
        }
        const origPrices = rooms.map((r: any) => r.originalPrice).filter(Boolean);
        if (origPrices.length > 0) {
          data.originalPrice = Math.min(...origPrices);
        }
      }
      if (body.numericPrice !== undefined) data.numericPrice = Number(body.numericPrice);
      if (body.originalPrice !== undefined) data.originalPrice = Number(body.originalPrice);
      if (body.pricingRules !== undefined) data.pricingRules = body.pricingRules;

      const updated = await prisma.property.update({ where: { id }, data });
      await audit({ actor: { id: staff.id, role: staff.role }, action: 'ADMIN_UPDATE_PROPERTY', targetEntity: 'Property', targetId: id, newState: { name: updated.name }, req });
      return ok(res, presentProperty(updated));
    } else if (kind === 'package') {
      const data: any = {};
      if (body.title !== undefined) data.title = body.title;
      if (body.badge !== undefined) data.badge = body.badge;
      if (body.packageType !== undefined) data.packageType = body.packageType;
      if (body.category !== undefined) data.category = body.category;
      if (body.durationDays !== undefined) data.durationDays = Number(body.durationDays);
      if (body.durationNights !== undefined) data.durationNights = Number(body.durationNights);
      if (body.location !== undefined) data.location = body.location;
      if (body.city !== undefined) data.city = body.city;
      if (body.shortDesc !== undefined) data.shortDesc = body.shortDesc;
      if (body.description !== undefined) data.description = body.description;
      if (body.overview !== undefined) data.overview = body.overview;
      if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail;
      if (body.images !== undefined) data.images = body.images;
      if (body.highlights !== undefined) data.highlights = body.highlights;
      if (body.inclusions !== undefined) {
        data.inclusions = (body.inclusions || []).map((inc: any) => typeof inc === 'string' ? { title: inc, desc: '' } : inc);
      }
      if (body.exclusions !== undefined) data.exclusions = body.exclusions;
      if (body.itinerary !== undefined) data.itinerary = body.itinerary;
      if (body.cancellationPolicy !== undefined) data.cancellationPolicy = body.cancellationPolicy;
      if (body.tiers !== undefined) {
        data.tiers = body.tiers;
        const prices = (body.tiers || []).map((t: any) => Number(t.pricePerPerson)).filter(Boolean);
        if (prices.length > 0) data.numericPrice = Math.min(...prices);
      }
      if (body.numericPrice !== undefined) data.numericPrice = Number(body.numericPrice);
      if (body.originalPrice !== undefined) data.originalPrice = Number(body.originalPrice);
      if (body.pricingRules !== undefined) data.pricingRules = body.pricingRules;

      const updated = await prisma.package.update({ where: { id }, data });
      await audit({ actor: { id: staff.id, role: staff.role }, action: 'ADMIN_UPDATE_PACKAGE', targetEntity: 'Package', targetId: id, newState: { title: updated.title }, req });
      return ok(res, updated);
    } else {
      const data: any = {};
      if (body.title !== undefined) data.title = body.title;
      if (body.category !== undefined) data.category = body.category;
      if (body.difficulty !== undefined) data.difficulty = body.difficulty;
      if (body.duration !== undefined) data.duration = body.duration;
      if (body.city !== undefined) data.city = body.city;
      if (body.description !== undefined) data.description = body.description;
      if (body.overview !== undefined) data.overview = body.overview;
      if (body.image !== undefined) data.image = body.image;
      if (body.gallery !== undefined) data.gallery = body.gallery;
      if (body.highlights !== undefined) data.highlights = body.highlights;
      if (body.timeline !== undefined) data.timeline = body.timeline;
      if (body.inclusions !== undefined) {
        data.inclusions = (body.inclusions || []).map((inc: any) => typeof inc === 'string' ? { title: inc, desc: '' } : inc);
      }
      if (body.exclusions !== undefined) data.exclusions = body.exclusions;
      if (body.whatToBring !== undefined) data.whatToBring = body.whatToBring;
      if (body.meetingPoint !== undefined) data.meetingPoint = body.meetingPoint;
      if (body.guide !== undefined) data.guide = body.guide;
      if (body.cancellationPolicy !== undefined) data.cancellationPolicy = body.cancellationPolicy;
      if (body.slots !== undefined) data.slots = body.slots;
      if (body.tiers !== undefined) {
        data.tiers = body.tiers;
        const prices = (body.tiers || []).map((t: any) => Number(t.pricePerPerson)).filter(Boolean);
        if (prices.length > 0) data.numericPrice = Math.min(...prices);
      }
      if (body.numericPrice !== undefined) data.numericPrice = Number(body.numericPrice);
      if (body.originalPrice !== undefined) data.originalPrice = Number(body.originalPrice);
      if (body.pricingRules !== undefined) data.pricingRules = body.pricingRules;

      const updated = await prisma.experience.update({ where: { id }, data });
      await audit({ actor: { id: staff.id, role: staff.role }, action: 'ADMIN_UPDATE_EXPERIENCE', targetEntity: 'Experience', targetId: id, newState: { title: updated.title }, req });
      return ok(res, updated);
    }
  });

  r.delete('/:id', requireStaff({ admin: true }), async (req, res) => {
    const staff = getStaff(req);
    const id = objectId.parse(req.params.id);
    if (kind === 'property') {
      await prisma.property.delete({ where: { id } });
    } else if (kind === 'package') {
      await prisma.package.delete({ where: { id } });
    } else {
      await prisma.experience.delete({ where: { id } });
    }

    await audit({
      actor: { id: staff.id, role: staff.role },
      action: `DELETE_${kind.toUpperCase()}`,
      targetEntity: kind[0].toUpperCase() + kind.slice(1),
      targetId: id,
      req,
    });

    ok(res, { id, deleted: true });
  });

  return r;
}
