import { prisma } from '../../lib/prisma';
import { getPlatformConfig, toPricingConfig } from '../../services/platformConfig.service';
import { ApiError } from '../../utils/ApiError';
import { generateBookingReference } from '../../utils/codes';
import { addDays, diffDays, todayIST } from '../../utils/dates';
import { MAX_ADVANCE_BOOKING_DAYS } from '../../config/constants';
import {
  assertUserCanBook,
  cancellationBySystem,
  createCheckoutOrder,
  isActiveClubMember,
  loadBookableVendor,
  newHoldExpiry,
  reuseCheckout,
} from './booking.common';
import { presentPackageBooking } from './booking.presenter';
import type { PackageBookingInput } from './booking.schemas';
import { calculatePackagePricing, calculateSettlement } from './pricing.engine';

async function preparePackage(input: PackageBookingInput, viewerId?: string) {
  const config = await getPlatformConfig();
  if ((config as any).platformBookingsEnabled === false) {
    throw ApiError.conflict(
      (config as any).platformBookingsMessage || 'Bookings across the platform are temporarily paused by administration.',
      'PLATFORM_BOOKINGS_PAUSED'
    );
  }
  const pkg = await prisma.package.findFirst({ where: { id: input.packageId, status: 'active' } });
  if (!pkg) throw ApiError.notFound('Package');
  if ((pkg as any).acceptingBookings === false) {
    throw ApiError.conflict('This package is currently not accepting bookings.', 'PACKAGE_BOOKINGS_PAUSED');
  }
  const vendor = await loadBookableVendor(pkg.vendorId);
  const tier = pkg.tiers.find((t) => t.tierId === input.tierId);
  if (!tier) throw ApiError.notFound('Package tier');

  const bad = (message: string, code: string, details?: unknown) => ApiError.unprocessable(message, details, code);
  const today = todayIST();
  if (input.startDate < today) throw bad('Start date cannot be in the past', 'DATE_IN_PAST');
  if (diffDays(today, input.startDate) > MAX_ADVANCE_BOOKING_DAYS) throw bad('Bookings open up to 18 months in advance', 'TOO_FAR_AHEAD');
  const endDate = addDays(input.startDate, pkg.durationDays - 1);
  if ((pkg.validFrom && input.startDate < pkg.validFrom) || (pkg.validTill && endDate > pkg.validTill)) {
    throw bad('This package is not available for the selected dates', 'OUTSIDE_VALIDITY', { validFrom: pkg.validFrom, validTill: pkg.validTill });
  }
  const total = input.travelers.adults + input.travelers.children;
  if (total < pkg.pricing.minGuests || total > pkg.pricing.maxGuests) {
    throw bad(`This package is for ${pkg.pricing.minGuests}–${pkg.pricing.maxGuests} travellers`, 'TRAVELLER_COUNT', { minGuests: pkg.pricing.minGuests, maxGuests: pkg.pricing.maxGuests });
  }

  const isMember = await isActiveClubMember(viewerId);
  const ledger = calculatePackagePricing(
    {
      pricePerPerson: tier.pricePerPerson,
      childPrice: pkg.pricing.childPrice,
      adults: input.travelers.adults,
      children: input.travelers.children,
      startDate: input.startDate,
      weekendSurcharge: pkg.pricing.weekendSurcharge,
      isClubMember: isMember,
    },
    toPricingConfig(config),
  );
  return { pkg, vendor, tier, endDate, isMember, ledger, total };
}

/** POST /bookings/packages/quote */
export async function quotePackage(input: PackageBookingInput, viewerId?: string) {
  const { pkg, tier, endDate, isMember, ledger, total } = await preparePackage(input, viewerId);
  const config = await getPlatformConfig();
  return {
    package: { id: pkg.id, title: pkg.title, slug: pkg.slug, city: pkg.city, thumbnail: pkg.thumbnail },
    tier: { tierId: tier.tierId, tierName: tier.name, pricePerPerson: tier.pricePerPerson },
    startDate: input.startDate,
    endDate,
    travelers: { adults: input.travelers.adults, children: input.travelers.children, totalTravelers: total },
    pricing: ledger,
    memberDiscountApplied: isMember,
    freeActivities: pkg.freeActivities.map((a) => ({ id: a.experienceId, name: a.name, time: a.time })),
    cancellationPolicy: {
      freeCancellationHours: config.cancellationWindowRules.defaultFreeCancellationHours,
      lateCancellationFeePercent: config.cancellationWindowRules.lateCancellationFeePercent,
      summary:
        pkg.cancellationPolicy ??
        `Free cancellation up to ${config.cancellationWindowRules.defaultFreeCancellationHours} hours before start. ${config.cancellationWindowRules.lateCancellationFeePercent}% charge after that.`,
    },
    currency: 'INR' as const,
  };
}

/** POST /bookings/packages/reserve */
export async function reservePackage(userId: string, input: PackageBookingInput) {
  const user = await assertUserCanBook(userId);
  const customer = { fullName: user.fullName, email: user.email, phone: user.phone };

  const existing = await prisma.packageBooking.findFirst({
    where: {
      userId,
      packageId: input.packageId,
      tierId: input.tierId,
      startDate: input.startDate,
      adults: input.travelers.adults,
      children: input.travelers.children,
      bookingStatus: 'pending',
      holdExpiresAt: { gt: new Date() },
    },
  });
  if (existing) {
    const checkout = await reuseCheckout('package', existing.id, existing.bookingReference, existing.holdExpiresAt, customer);
    if (checkout) return { booking: presentPackageBooking(existing), checkout, reused: true };
  }

  const { pkg, vendor, tier, endDate, ledger, total } = await preparePackage(input, userId);
  const settlement = calculateSettlement(vendor.commissionTerms, 'package', ledger.taxableAmount, ledger.grandTotalInr);

  const booking = await prisma.packageBooking.create({
    data: {
      bookingReference: await generateBookingReference('PKG'),
      userId,
      packageId: pkg.id,
      vendorId: pkg.vendorId,
      hostPropertyId: pkg.propertyId,
      tierId: tier.tierId,
      tierName: tier.name,
      startDate: input.startDate,
      endDate,
      adults: input.travelers.adults,
      children: input.travelers.children,
      totalTravelers: total,
      pricing: {
        pricePerPerson: ledger.pricePerPerson,
        adultsCost: ledger.adultsCost,
        childrenCost: ledger.childrenCost,
        weekendSurcharge: ledger.weekendSurcharge,
        baseCost: ledger.baseCost,
        memberDiscount: ledger.memberDiscount,
        taxableAmount: ledger.taxableAmount,
        taxesGst: ledger.taxesGst,
        grandTotalInr: ledger.grandTotalInr,
        gstRatePercent: ledger.gstRatePercent,
      },
      grandTotalInr: ledger.grandTotalInr,
      taxableAmountInr: ledger.taxableAmount,
      commissionRatePercent: settlement.commissionRatePercent,
      commissionAmountInr: settlement.commissionAmountInr,
      vendorShareInr: settlement.vendorShareInr,
      paymentStatus: 'unpaid',
      bookingStatus: 'pending',
      holdExpiresAt: newHoldExpiry(),
      specialRequests: input.specialRequests,
      billingState: input.billingState,
    },
  });

  try {
    const checkout = await createCheckoutOrder({
      bookingType: 'package',
      bookingId: booking.id,
      reference: booking.bookingReference,
      userId,
      vendorId: booking.vendorId,
      amountInr: booking.grandTotalInr,
      holdExpiresAt: booking.holdExpiresAt as Date,
      customer,
    });
    return { booking: presentPackageBooking(booking, { package: pkg }), checkout, reused: false };
  } catch (err) {
    await prisma.packageBooking.update({
      where: { id: booking.id },
      data: { bookingStatus: 'cancelled', holdExpiresAt: null, cancellation: cancellationBySystem('Payment order could not be created') },
    });
    throw err;
  }
}
