import type { ExperienceBooking, PackageBooking, StayBooking, User } from '@prisma/client';
import { presentCustomerContact } from '../users/user.presenter';

export type BookingView = 'customer' | 'vendor' | 'staff';
export type ContactMode = 'full' | 'masked' | 'name_only';

interface Extras {
  view?: BookingView;
  customer?: Pick<User, 'id' | 'fullName' | 'email' | 'phone'> | null;
  contactMode?: ContactMode;
}

/** Commission / vendor-share numbers are internal: customers never see them. */
const settlement = (b: { commissionRatePercent: number; commissionAmountInr: number; vendorShareInr: number; payoutId: string | null }, view: BookingView) =>
  view === 'customer'
    ? {}
    : { settlement: { commissionRatePercent: b.commissionRatePercent, commissionAmountInr: b.commissionAmountInr, vendorShareInr: b.vendorShareInr, payoutId: b.payoutId } };

const customerOf = (e: Extras) =>
  e.customer && e.view && e.view !== 'customer' ? { customer: presentCustomerContact(e.customer, e.contactMode ?? 'masked') } : {};

export function presentStayBooking(
  b: StayBooking,
  extra: Extras & { property?: { id: string; name: string; slug: string; city: string; images: { url: string }[] } | null } = {},
) {
  const view = extra.view ?? 'customer';
  const grandTotalInr = b.grandTotalInr ?? b.pricing?.grandTotalInr ?? 0;
  return {
    id: b.id,
    _id: b.id,
    type: 'stay' as const,
    bookingReference: b.bookingReference,
    userId: b.userId,
    propertyId: b.propertyId,
    vendorId: b.vendorId,
    title: extra.property?.name ?? b.roomName,
    image: extra.property?.images[0]?.url ?? null,
    property: extra.property ? { id: extra.property.id, name: extra.property.name, slug: extra.property.slug, city: extra.property.city } : undefined,
    room: { roomId: b.roomId, roomName: b.roomName, quantity: b.roomQuantity, pricePerNight: b.pricing.roomPricePerNight },
    roomName: b.roomName,
    roomQuantity: b.roomQuantity,
    checkInDate: b.checkInDate,
    checkOutDate: b.checkOutDate,
    nights: b.nights,
    adults: b.adults,
    children: b.children,
    totalGuests: b.totalGuests,
    schedule: { checkInDate: b.checkInDate, checkOutDate: b.checkOutDate, nights: b.nights },
    guests: { adults: b.adults, children: b.children, totalGuests: b.totalGuests },
    pricing: b.pricing,
    grandTotalInr,
    amountInr: grandTotalInr,
    totalAmountInr: grandTotalInr,
    amount: grandTotalInr,
    paymentStatus: b.paymentStatus,
    bookingStatus: b.bookingStatus,
    specialRequests: b.specialRequests,
    cancellation: b.cancellation,
    holdExpiresAt: b.holdExpiresAt,
    invoiceNumber: b.invoiceNumber,
    confirmedAt: b.confirmedAt,
    checkedInAt: b.checkedInAt,
    checkedOutAt: b.checkedOutAt,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    ...settlement(b, view),
    ...customerOf(extra),
  };
}

export function presentPackageBooking(
  b: PackageBooking,
  extra: Extras & { package?: { id: string; title: string; slug: string; city: string; thumbnail: string | null } | null } = {},
) {
  const view = extra.view ?? 'customer';
  const grandTotalInr = b.grandTotalInr ?? b.pricing?.grandTotalInr ?? 0;
  return {
    id: b.id,
    _id: b.id,
    type: 'package' as const,
    bookingReference: b.bookingReference,
    userId: b.userId,
    packageId: b.packageId,
    vendorId: b.vendorId,
    hostPropertyId: b.hostPropertyId,
    title: extra.package?.title ?? b.tierName,
    image: extra.package?.thumbnail ?? null,
    package: extra.package ? { id: extra.package.id, title: extra.package.title, slug: extra.package.slug, city: extra.package.city } : undefined,
    tier: { tierId: b.tierId, tierName: b.tierName, pricePerPerson: b.pricing.pricePerPerson },
    tierName: b.tierName,
    startDate: b.startDate,
    endDate: b.endDate,
    adults: b.adults,
    children: b.children,
    totalTravelers: b.totalTravelers,
    travelers: { adults: b.adults, children: b.children, totalTravelers: b.totalTravelers },
    pricing: b.pricing,
    grandTotalInr,
    amountInr: grandTotalInr,
    totalAmountInr: grandTotalInr,
    amount: grandTotalInr,
    freeActivityPasses: b.freeActivityPasses,
    paymentStatus: b.paymentStatus,
    bookingStatus: b.bookingStatus,
    specialRequests: b.specialRequests,
    cancellation: b.cancellation,
    holdExpiresAt: b.holdExpiresAt,
    invoiceNumber: b.invoiceNumber,
    confirmedAt: b.confirmedAt,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    ...settlement(b, view),
    ...customerOf(extra),
  };
}

export function presentExperienceBooking(
  b: ExperienceBooking,
  extra: Extras & { experience?: { id: string; title: string; slug: string; city: string; image: string | null } | null } = {},
) {
  const view = extra.view ?? 'customer';
  const grandTotalInr = b.grandTotalInr ?? b.pricing?.grandTotalInr ?? 0;
  return {
    id: b.id,
    _id: b.id,
    type: 'experience' as const,
    bookingReference: b.bookingReference,
    userId: b.userId,
    experienceId: b.experienceId,
    vendorId: b.vendorId,
    title: extra.experience?.title ?? b.tierName,
    image: extra.experience?.image ?? null,
    experience: extra.experience ? { id: extra.experience.id, title: extra.experience.title, slug: extra.experience.slug, city: extra.experience.city } : undefined,
    selectedTier: { tierId: b.tierId, name: b.tierName, pricePerPerson: b.pricing.pricePerPerson },
    tierName: b.tierName,
    selectedSlot: { slotId: b.slotId, time: b.slotTime },
    slotTime: b.slotTime,
    activityDate: b.activityDate,
    adults: b.adults,
    children: b.children,
    totalParticipants: b.totalParticipants,
    participants: { adults: b.adults, children: b.children, totalParticipants: b.totalParticipants },
    pricing: b.pricing,
    grandTotalInr,
    amountInr: grandTotalInr,
    totalAmountInr: grandTotalInr,
    amount: grandTotalInr,
    paymentStatus: b.paymentStatus,
    bookingStatus: b.bookingStatus,
    specialRequests: b.specialRequests,
    cancellation: b.cancellation,
    holdExpiresAt: b.holdExpiresAt,
    invoiceNumber: b.invoiceNumber,
    confirmedAt: b.confirmedAt,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    ...settlement(b, view),
    ...customerOf(extra),
  };
}
