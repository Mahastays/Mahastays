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

      const rawAmenities = Array.isArray(body.amenities) && body.amenities.length > 0
        ? body.amenities.map((a: any) => ({ name: typeof a === 'string' ? a : (a.name || ''), icon: typeof a === 'string' ? null : (a.icon || null) }))
        : [{ name: 'Free WiFi', icon: null }, { name: 'Breakfast Included', icon: null }, { name: 'Swimming Pool', icon: null }];

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
          address: body.address ? {
            fullAddress: body.address.fullAddress || body.location || 'Venna Lake Road, Mahabaleshwar',
            lat: typeof body.address.lat === 'number' ? body.address.lat : (Number(body.address.lat) || 17.9237),
            lng: typeof body.address.lng === 'number' ? body.address.lng : (Number(body.address.lng) || 73.6586),
            mapLink: body.address.mapLink || null,
          } : { fullAddress: body.location || 'Venna Lake Road, Mahabaleshwar', lat: 17.9237, lng: 73.6586 },
          host: body.host ? {
            name: body.host.name || 'Host',
            role: body.host.role || 'Superhost & Estate Manager',
            experience: body.host.experience || 'Hosted 100+ groups',
            avatar: body.host.avatar || null,
            staysCount: body.host.staysCount || null,
            confirmationBadge: body.host.confirmationBadge || 'Identity Verified',
            verified: body.host.verified !== undefined ? Boolean(body.host.verified) : true,
          } : (body.hostName ? {
            name: body.hostName,
            role: body.hostRole || 'Superhost & Estate Manager',
            experience: body.hostExperience || 'Hosted 100+ groups',
            avatar: body.hostAvatar || null,
            staysCount: body.staysCount || null,
            confirmationBadge: body.confirmationBadge || 'Identity Verified',
            verified: true,
          } : undefined),
          images,
          highlights: (Array.isArray(body.highlights) ? body.highlights : []).map((h: any) => ({
            title: typeof h === 'string' ? h : (h.title || ''),
            desc: typeof h === 'string' ? '' : (h.desc || h.description || ''),
            icon: typeof h === 'string' ? null : (h.icon || null),
          })),
          keyAmenities: Array.isArray(body.keyAmenities) ? body.keyAmenities.map((k: any) => ({
            name: typeof k === 'string' ? k : (k.name || k.title || ''),
            desc: typeof k === 'string' ? null : (k.desc || k.description || null),
            icon: typeof k === 'string' ? null : (k.icon || null),
          })) : [],
          facilityCategories: Array.isArray(body.facilityCategories) ? body.facilityCategories.map((fc: any) => ({
            category: fc.category || fc.title || '',
            items: Array.isArray(fc.items) ? fc.items : (Array.isArray(fc.points) ? fc.points : []),
            icon: fc.icon || null,
          })) : [],
          amenities: rawAmenities,
          amenityKeys: rawAmenities.map((a: any) => a.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')),
          policies: {
            checkInTime: body.policies?.checkInTime || '14:00',
            checkOutTime: body.policies?.checkOutTime || '11:00',
            cancellationPolicy: body.policies?.cancellationPolicy || null,
            earlyCheckInNote: body.policies?.earlyCheckInNote || null,
            suitabilityRules: Array.isArray(body.policies?.suitabilityRules)
              ? body.policies.suitabilityRules
              : (Array.isArray(body.rules) ? body.rules : []),
            freeCancellationHours: body.policies?.freeCancellationHours != null ? Number(body.policies.freeCancellationHours) : null,
            lateCancellationFeePercent: body.policies?.lateCancellationFeePercent != null ? Number(body.policies.lateCancellationFeePercent) : null,
            petsAllowed: Boolean(body.policies?.petsAllowed),
            smokingAllowed: Boolean(body.policies?.smokingAllowed),
            coupleFriendly: body.policies?.coupleFriendly !== undefined ? Boolean(body.policies?.coupleFriendly) : true,
            maxGuestsPerRoom: body.policies?.maxGuestsPerRoom != null ? Number(body.policies.maxGuestsPerRoom) : null,
          },
          rooms,
          numericPrice,
          originalPrice,
          ratingBreakdown: { cleanliness: 0, accuracy: 0, communication: 0, location: 0, checkIn: 0, value: 0 },
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

    const rawSlots = Array.isArray(body.slots) && body.slots.length > 0
      ? body.slots.map((s: any, idx: number) => ({
          slotId: s.slotId || `slot-${Date.now()}-${idx}`,
          time: s.time || '07:00 AM',
          label: s.label || 'Morning Batch',
          capacity: Number(s.capacity) || 20,
          price: s.price ? Number(s.price) : undefined,
        }))
      : [{ slotId: `slot-${Date.now()}-0`, time: '07:00 AM', label: 'Morning Batch', capacity: 20 }];

    const rawTiers = Array.isArray(body.tiers) && body.tiers.length > 0
      ? body.tiers
      : [{
          tierId: 'tier-standard',
          name: 'Standard Experience Pass',
          tagline: 'Standard Admission',
          pricePerPerson: Number(body.numericPrice) || 499,
          originalPrice: body.originalPrice ? Number(body.originalPrice) : Math.round((Number(body.numericPrice) || 499) * 1.3),
          features: ['Full Activity Access', 'Guide Assistance'],
        }];

    const exp = await prisma.experience.create({
      data: {
        vendorId: vendorId || '6adeef17f4597150f0c199a4',
        code: body.code || ('EXP-' + Math.floor(100 + Math.random() * 900)),
        title: body.title || 'New Mountain Experience',
        slug: ((body.title || 'new-experience') + '-' + Date.now().toString(36)).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        country: body.country || 'India',
        city: body.city || 'Mahabaleshwar',
        duration: body.duration || '4 Hours',
        category: body.category || 'Trekking & Hiking',
        priceType: body.priceType || 'per_person',
        personLimit: body.personLimit != null ? Number(body.personLimit) : 15,
        difficulty: (['Easy', 'Moderate', 'Challenging'].includes(body.difficulty) ? body.difficulty : 'Moderate') as any,
        numericPrice: Number(body.numericPrice) || 499,
        originalPrice: body.originalPrice ? Number(body.originalPrice) : Math.round((Number(body.numericPrice) || 499) * 1.3),
        image: body.image || body.images?.[0] || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
        gallery: Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []),
        description: body.description || 'Scenic mountain adventure with experienced local guides.',
        overview: body.overview || body.description || 'Guided trek and activities in Maharashtra nature trails.',
        highlights: Array.isArray(body.highlights) ? body.highlights : [],
        timeline: Array.isArray(body.timeline) ? body.timeline : [],
        inclusions: Array.isArray(body.inclusions) ? body.inclusions : [],
        exclusions: Array.isArray(body.exclusions) ? body.exclusions : [],
        whatToBring: Array.isArray(body.whatToBring) ? body.whatToBring : [],
        locationType: body.locationType || 'fixed_location',
        serviceArea: body.serviceArea || null,
        meetingPoint: body.meetingPoint || body.location || (body.locationType === 'customer_location' ? 'Delivered at your stay / villa' : 'Mahabaleshwar Base Point'),
        schedule: body.schedule || { mode: 'fixed_slot', daysAvailable: ['all'] },
        slots: rawSlots,
        tiers: rawTiers,
        guide: body.guide ? {
          name: body.guide.name || 'Local Guide',
          role: body.guide.role || 'Certified Instructor',
          avatar: body.guide.avatar || null,
        } : null,
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

  r.put('/:id', requireStaff({ admin: true, sub_admin: true }), async (req, res) => {
    const staff = getStaff(req);
    const id = objectId.parse(req.params.id);
    const body: any = bodyOf(req);

    if (kind === 'property') {
      const data: any = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.propertyType !== undefined) data.propertyType = body.propertyType;
      if (body.tagline !== undefined) data.tagline = body.tagline;
      if (body.badge !== undefined) data.badge = body.badge;
      if (body.tags !== undefined) data.tags = { set: Array.isArray(body.tags) ? body.tags : [] };
      if (body.description !== undefined) data.description = body.description;
      if (body.longDescription !== undefined) data.longDescription = body.longDescription;
      if (body.location !== undefined) data.location = body.location;
      if (body.locationId !== undefined) data.locationId = body.locationId;
      if (body.city !== undefined) data.city = body.city;
      if (body.country !== undefined) data.country = body.country;
      if (body.address !== undefined) {
        data.address = {
          set: {
            fullAddress: body.address?.fullAddress || body.location || '',
            lat: typeof body.address?.lat === 'number' ? body.address.lat : (Number(body.address?.lat) || 17.9237),
            lng: typeof body.address?.lng === 'number' ? body.address.lng : (Number(body.address?.lng) || 73.6586),
            mapLink: body.address?.mapLink || null,
          },
        };
      }
      if (body.images !== undefined) {
        data.images = {
          set: (body.images || []).map((img: any, i: number) => ({
            url: typeof img === 'string' ? img : (img.url || ''),
            alt: typeof img === 'string' ? '' : (img.alt || null),
            isCover: typeof img === 'string' ? i === 0 : Boolean(img.isCover),
          })),
        };
      }
      if (body.gallery !== undefined) data.gallery = { set: Array.isArray(body.gallery) ? body.gallery : [] };
      if (body.videos !== undefined) data.videos = { set: Array.isArray(body.videos) ? body.videos : [] };
      if (body.host !== undefined) {
        if (body.host === null) {
          data.host = { unset: true };
        } else {
          data.host = {
            set: {
              name: body.host.name || 'Host',
              role: body.host.role || null,
              experience: body.host.experience || null,
              avatar: body.host.avatar || null,
              staysCount: body.host.staysCount || null,
              confirmationBadge: body.host.confirmationBadge || null,
              verified: body.host.verified !== undefined ? Boolean(body.host.verified) : true,
            },
          };
        }
      } else if (body.hostName !== undefined) {
        data.host = {
          set: {
            name: body.hostName || 'Host',
            role: body.hostRole || 'Superhost & Estate Manager',
            experience: body.hostExperience || 'Hosted 100+ groups',
            avatar: body.hostAvatar || null,
            staysCount: body.staysCount || null,
            confirmationBadge: body.confirmationBadge || 'Identity Verified',
            verified: true,
          },
        };
      }
      if (body.keyAmenities !== undefined) {
        data.keyAmenities = {
          set: (body.keyAmenities || []).map((k: any) => ({
            name: typeof k === 'string' ? k : (k.name || k.title || ''),
            desc: typeof k === 'string' ? null : (k.desc || k.description || null),
            icon: typeof k === 'string' ? null : (k.icon || null),
          })),
        };
      }
      if (body.facilityCategories !== undefined) {
        data.facilityCategories = {
          set: (body.facilityCategories || []).map((fc: any) => ({
            category: fc.category || fc.title || '',
            items: Array.isArray(fc.items) ? fc.items : (Array.isArray(fc.points) ? fc.points : []),
            icon: fc.icon || null,
          })),
        };
      }
      if (body.highlights !== undefined) {
        data.highlights = {
          set: (body.highlights || []).map((h: any) => ({
            title: typeof h === 'string' ? h : (h.title || ''),
            desc: typeof h === 'string' ? '' : (h.desc || h.description || ''),
            icon: typeof h === 'string' ? null : (h.icon || null),
          })),
        };
      }
      if (body.attractions !== undefined) {
        data.attractions = {
          set: (body.attractions || []).map((a: any) => ({
            name: a.name || '',
            distance: a.distance || null,
            time: a.time || null,
          })),
        };
      }
      if (body.policies !== undefined || body.rules !== undefined) {
        const pol = body.policies || {};
        data.policies = {
          set: {
            checkInTime: pol.checkInTime || '14:00',
            checkOutTime: pol.checkOutTime || '11:00',
            cancellationPolicy: pol.cancellationPolicy || null,
            earlyCheckInNote: pol.earlyCheckInNote || null,
            suitabilityRules: Array.isArray(pol.suitabilityRules)
              ? pol.suitabilityRules
              : (Array.isArray(body.rules) ? body.rules : []),
            freeCancellationHours: pol.freeCancellationHours != null ? Number(pol.freeCancellationHours) : null,
            lateCancellationFeePercent: pol.lateCancellationFeePercent != null ? Number(pol.lateCancellationFeePercent) : null,
            petsAllowed: Boolean(pol.petsAllowed),
            smokingAllowed: Boolean(pol.smokingAllowed),
            coupleFriendly: pol.coupleFriendly !== undefined ? Boolean(pol.coupleFriendly) : true,
            maxGuestsPerRoom: pol.maxGuestsPerRoom != null ? Number(pol.maxGuestsPerRoom) : null,
          },
        };
      }
      if (body.bgColor !== undefined) data.bgColor = body.bgColor;
      if (body.gradientOverlay !== undefined) data.gradientOverlay = body.gradientOverlay;
      if (body.amenities !== undefined) {
        const amList = (body.amenities || []).map((a: any) => ({
          name: typeof a === 'string' ? a : (a.name || ''),
          icon: typeof a === 'string' ? null : (a.icon || null),
        }));
        data.amenities = { set: amList };
        data.amenityKeys = {
          set: amList.map((a: any) => a.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')),
        };
      }
      if (body.rooms !== undefined) {
        const rooms = (body.rooms || []).map((r: any, idx: number) => ({
          roomId: r.roomId || `rm_${idx + 1}`,
          name: r.name || 'Room',
          badge: r.badge || null,
          tagline: r.tagline || null,
          roomSize: r.roomSize ? Number(r.roomSize) : null,
          bedType: r.bedType || 'King Bed',
          maxGuests: Number(r.maxGuests) || 2,
          capacity: {
            adults: Number(r.capacity?.adults ?? r.maxGuests) || 2,
            children: Number(r.capacity?.children ?? 1) || 0,
          },
          basePrice: Number(r.basePrice) || 6000,
          originalPrice: r.originalPrice ? Number(r.originalPrice) : null,
          weekendPrice: r.weekendPrice ? Number(r.weekendPrice) : null,
          holidayPrice: r.holidayPrice ? Number(r.holidayPrice) : null,
          count: Number(r.count) || 1,
          images: Array.isArray(r.images) ? r.images : [],
          amenities: Array.isArray(r.amenities) ? r.amenities : [],
        }));
        data.rooms = { set: rooms };
        const prices = rooms.map((r: any) => Number(r.basePrice)).filter((p: number) => !isNaN(p) && p > 0);
        if (prices.length > 0) {
          data.numericPrice = Math.min(...prices);
        }
        const origPrices = rooms.map((r: any) => Number(r.originalPrice)).filter((p: number) => !isNaN(p) && p > 0);
        if (origPrices.length > 0) {
          data.originalPrice = Math.min(...origPrices);
        }
      }
      if (body.numericPrice !== undefined && data.numericPrice === undefined) {
        data.numericPrice = Number(body.numericPrice);
      }
      if (body.originalPrice !== undefined && data.originalPrice === undefined) {
        data.originalPrice = Number(body.originalPrice);
      }
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
      if (body.locationId !== undefined) data.locationId = body.locationId;
      if (body.city !== undefined) data.city = body.city;
      if (body.shortDesc !== undefined) data.shortDesc = body.shortDesc;
      if (body.description !== undefined) data.description = body.description;
      if (body.overview !== undefined) data.overview = body.overview;
      if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail;
      if (body.images !== undefined) data.images = { set: Array.isArray(body.images) ? body.images : [] };
      if (body.highlights !== undefined) data.highlights = { set: Array.isArray(body.highlights) ? body.highlights : [] };
      if (body.inclusions !== undefined) {
        data.inclusions = {
          set: (body.inclusions || []).map((inc: any) => ({
            title: typeof inc === 'string' ? inc : (inc.title || ''),
            desc: typeof inc === 'string' ? null : (inc.desc || null),
            icon: typeof inc === 'string' ? null : (inc.icon || null),
          })),
        };
      }
      if (body.exclusions !== undefined) data.exclusions = { set: Array.isArray(body.exclusions) ? body.exclusions : [] };
      if (body.itinerary !== undefined) {
        data.itinerary = {
          set: (body.itinerary || []).map((day: any, i: number) => ({
            day: Number(day.day) || (i + 1),
            title: day.title || `Day ${i + 1}`,
            activities: Array.isArray(day.activities) ? day.activities : [],
            meals: day.meals || null,
            stay: day.stay || null,
            image: day.image || null,
          })),
        };
      }
      if (body.cancellationPolicy !== undefined) data.cancellationPolicy = body.cancellationPolicy;
      if (body.priceType !== undefined) data.priceType = body.priceType;
      if (body.personLimit !== undefined) data.personLimit = body.personLimit != null ? Number(body.personLimit) : null;
      if (body.tiers !== undefined) {
        const tiers = (body.tiers || []).map((t: any, i: number) => ({
          tierId: t.tierId || t.id || `tier_${i + 1}`,
          name: t.name || 'Standard Tier',
          badge: t.badge || null,
          tagline: t.tagline || null,
          hotelType: t.hotelType || null,
          priceType: t.priceType || body.priceType || 'per_person',
          personLimit: t.personLimit != null ? Number(t.personLimit) : (body.personLimit != null ? Number(body.personLimit) : null),
          pricePerPerson: Number(t.pricePerPerson) || 0,
          originalPrice: t.originalPrice ? Number(t.originalPrice) : null,
          features: Array.isArray(t.features) ? t.features : [],
        }));
        data.tiers = { set: tiers };
        const prices = tiers.map((t: any) => Number(t.pricePerPerson)).filter((p: number) => !isNaN(p) && p > 0);
        if (prices.length > 0) data.numericPrice = Math.min(...prices);
        const origPrices = tiers.map((t: any) => Number(t.originalPrice)).filter((p: number) => !isNaN(p) && p > 0);
        if (origPrices.length > 0) data.originalPrice = Math.min(...origPrices);
      }
      if (body.numericPrice !== undefined && data.numericPrice === undefined) {
        data.numericPrice = Number(body.numericPrice);
      }
      if (body.originalPrice !== undefined && data.originalPrice === undefined) {
        data.originalPrice = Number(body.originalPrice);
      }
      if (body.pricingRules !== undefined) data.pricingRules = body.pricingRules;

      const updated = await prisma.package.update({ where: { id }, data });
      await audit({ actor: { id: staff.id, role: staff.role }, action: 'ADMIN_UPDATE_PACKAGE', targetEntity: 'Package', targetId: id, newState: { title: updated.title }, req });
      return ok(res, presentPackage(updated));
    } else {
      const data: any = {};
      if (body.title !== undefined) data.title = body.title;
      if (body.category !== undefined) data.category = body.category;
      if (body.difficulty !== undefined) data.difficulty = body.difficulty;
      if (body.duration !== undefined) data.duration = body.duration;
      if (body.city !== undefined) data.city = body.city;
      if (body.priceType !== undefined) data.priceType = body.priceType;
      if (body.personLimit !== undefined) data.personLimit = body.personLimit != null ? Number(body.personLimit) : null;
      if (body.hasChildPrice !== undefined) data.hasChildPrice = Boolean(body.hasChildPrice);
      if (body.childPrice !== undefined) data.childPrice = body.childPrice != null ? Number(body.childPrice) : null;
      if (body.childAgeLimit !== undefined) data.childAgeLimit = body.childAgeLimit;
      if (body.pricingRules !== undefined) data.pricingRules = body.pricingRules;
      if (body.acceptingBookings !== undefined) data.acceptingBookings = Boolean(body.acceptingBookings);
      if (body.description !== undefined) data.description = body.description;
      if (body.overview !== undefined) data.overview = body.overview;
      if (body.image !== undefined) data.image = body.image;
      if (body.gallery !== undefined) data.gallery = { set: Array.isArray(body.gallery) ? body.gallery : [] };
      if (body.highlights !== undefined) data.highlights = { set: Array.isArray(body.highlights) ? body.highlights : [] };
      if (body.timeline !== undefined) {
        data.timeline = {
          set: (body.timeline || []).map((item: any) => ({
            time: item.time || '',
            title: item.title || '',
            desc: item.desc || null,
          })),
        };
      }
      if (body.inclusions !== undefined) {
        data.inclusions = {
          set: (body.inclusions || []).map((inc: any) => ({
            title: typeof inc === 'string' ? inc : (inc.title || ''),
            desc: typeof inc === 'string' ? null : (inc.desc || null),
            icon: typeof inc === 'string' ? null : (inc.icon || null),
          })),
        };
      }
      if (body.exclusions !== undefined) data.exclusions = { set: Array.isArray(body.exclusions) ? body.exclusions : [] };
      if (body.whatToBring !== undefined) data.whatToBring = { set: Array.isArray(body.whatToBring) ? body.whatToBring : [] };
      if (body.locationType !== undefined) data.locationType = body.locationType;
      if (body.serviceArea !== undefined) data.serviceArea = body.serviceArea;
      if (body.meetingPoint !== undefined) data.meetingPoint = body.meetingPoint;
      if (body.guide !== undefined) {
        if (body.guide === null) {
          data.guide = { unset: true };
        } else {
          data.guide = {
            set: {
              name: body.guide.name || 'Guide',
              role: body.guide.role || null,
              avatar: body.guide.avatar || null,
            },
          };
        }
      }
      if (body.cancellationPolicy !== undefined) data.cancellationPolicy = body.cancellationPolicy;
      if (body.slots !== undefined) {
        data.slots = {
          set: (body.slots || []).map((s: any, i: number) => ({
            slotId: s.slotId || `slot_${i + 1}`,
            time: s.time || '',
            label: s.label || '',
            capacity: Number(s.capacity) || 10,
            price: s.price ? Number(s.price) : null,
          })),
        };
      }
      if (body.tiers !== undefined) {
        const tiers = (body.tiers || []).map((t: any, i: number) => ({
          tierId: t.tierId || t.id || `tier_${i + 1}`,
          name: t.name || 'Standard Tier',
          badge: t.badge || null,
          tagline: t.tagline || null,
          description: t.description || null,
          priceType: t.priceType || body.priceType || data.priceType || 'per_person',
          personLimit: t.personLimit != null ? Number(t.personLimit) : (body.personLimit != null ? Number(body.personLimit) : null),
          pricePerPerson: Number(t.pricePerPerson) || 0,
          originalPrice: t.originalPrice ? Number(t.originalPrice) : null,
          childPricePerPerson: t.childPricePerPerson != null ? Number(t.childPricePerPerson) : null,
          features: Array.isArray(t.features) ? t.features : [],
        }));
        data.tiers = { set: tiers };
        const prices = tiers.map((t: any) => Number(t.pricePerPerson)).filter((p: number) => !isNaN(p) && p > 0);
        if (prices.length > 0) data.numericPrice = Math.min(...prices);
        const origPrices = tiers.map((t: any) => Number(t.originalPrice)).filter((p: number) => !isNaN(p) && p > 0);
        if (origPrices.length > 0) data.originalPrice = Math.min(...origPrices);
        if (!data.priceType && tiers.length > 0 && tiers[0].priceType) {
          data.priceType = tiers[0].priceType;
        }
      }
      if (body.numericPrice !== undefined && data.numericPrice === undefined) {
        data.numericPrice = Number(body.numericPrice);
      }
      if (body.originalPrice !== undefined && data.originalPrice === undefined) {
        data.originalPrice = Number(body.originalPrice);
      }
      if (body.pricingRules !== undefined) data.pricingRules = body.pricingRules;

      const updated = await prisma.experience.update({ where: { id }, data });
      await audit({ actor: { id: staff.id, role: staff.role }, action: 'ADMIN_UPDATE_EXPERIENCE', targetEntity: 'Experience', targetId: id, newState: { title: updated.title }, req });
      return ok(res, presentExperience(updated));
    }
  });

  r.delete('/:id', requireStaff({ admin: true }), async (req, res) => {
    const staff = getStaff(req);
    const id = objectId.parse(req.params.id);
    if (kind === 'property') {
      // Clean up linked packages and bookings first to satisfy any referential integrity checks
      await prisma.package.deleteMany({ where: { propertyId: id } });
      await prisma.stayBooking.deleteMany({ where: { propertyId: id } });
      await prisma.property.delete({ where: { id } });
    } else if (kind === 'package') {
      await prisma.packageBooking.deleteMany({ where: { packageId: id } });
      await prisma.package.delete({ where: { id } });
    } else {
      await prisma.experienceBooking.deleteMany({ where: { experienceId: id } });
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
