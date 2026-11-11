import { prisma } from '../../lib/prisma';
import { lockService } from '../../services/lock.service';
import { getPlatformConfig, toPricingConfig } from '../../services/platformConfig.service';
import { ApiError } from '../../utils/ApiError';
import { generateBookingReference } from '../../utils/codes';
import { diffDays, todayIST } from '../../utils/dates';
import { MAX_ADVANCE_BOOKING_DAYS } from '../../config/constants';
import { experienceSlotAvailability } from '../inventory/inventory.service';
import {
  assertUserCanBook,
  cancellationBySystem,
  createCheckoutOrder,
  isActiveClubMember,
  loadBookableVendor,
  newHoldExpiry,
  reuseCheckout,
} from './booking.common';
import { presentExperienceBooking } from './booking.presenter';
import type { ExperienceBookingInput } from './booking.schemas';
import { calculateExperiencePricing, calculateSettlement } from './pricing.engine';

async function prepareExperience(input: ExperienceBookingInput, viewerId?: string) {
  const config = await getPlatformConfig();
  if ((config as any).platformBookingsEnabled === false) {
    throw ApiError.conflict(
      (config as any).platformBookingsMessage || 'Bookings across the platform are temporarily paused by administration.',
      'PLATFORM_BOOKINGS_PAUSED'
    );
  }
  const exp = await prisma.experience.findFirst({ where: { id: input.experienceId, status: 'active' } });
  if (!exp) throw ApiError.notFound('Experience');
  if ((exp as any).acceptingBookings === false) {
    throw ApiError.conflict('This experience is currently not accepting bookings.', 'EXPERIENCE_BOOKINGS_PAUSED');
  }
  const vendor = await loadBookableVendor(exp.vendorId);
  const tier = exp.tiers.find((t) => t.tierId === input.tierId);
  if (!tier) throw ApiError.notFound('Ticket tier');
  const slot = exp.slots.find((s) => s.slotId === input.slotId);
  if (!slot) throw ApiError.notFound('Time slot');

  const bad = (message: string, code: string, details?: unknown) => ApiError.unprocessable(message, details, code);
  const today = todayIST();
  if (input.activityDate < today) throw bad('Activity date cannot be in the past', 'DATE_IN_PAST');
  if (diffDays(today, input.activityDate) > MAX_ADVANCE_BOOKING_DAYS) throw bad('Bookings open up to 18 months in advance', 'TOO_FAR_AHEAD');
  const participants = input.participants.adults + input.participants.children;
  const effectiveMaxParticipants = exp.personLimit || slot.capacity;
  if (participants > effectiveMaxParticipants) {
    throw bad(
      `This experience accommodates up to ${effectiveMaxParticipants} participants. You selected ${participants}. Please choose another session or reduce participant count.`,
      'PARTICIPANT_COUNT',
      { maxParticipants: effectiveMaxParticipants }
    );
  }

  const isMember = await isActiveClubMember(viewerId);
  const hasChildPrice = (exp as any).hasChildPrice ?? (exp.pricingRules as any)?.hasChildPrice ?? false;
  const childPrice = (tier as any).childPricePerPerson ?? (exp as any).childPrice ?? (exp.pricingRules as any)?.childPrice ?? null;

  const ledger = calculateExperiencePricing(
    {
      pricePerPerson: tier.pricePerPerson,
      priceType: (exp.priceType as any) ?? 'per_person',
      hasChildPrice,
      childPrice,
      adults: input.participants.adults,
      children: input.participants.children,
      isClubMember: isMember,
    },
    toPricingConfig(config),
  );
  return { exp, vendor, tier, slot, participants, isMember, ledger };
}

async function assertSlotCapacity(exp: Parameters<typeof experienceSlotAvailability>[0], slotId: string, date: string, participants: number) {
  const slots = await experienceSlotAvailability(exp, date);
  const s = slots.find((x) => x.slotId === slotId);
  if (!s || s.blocked) throw ApiError.conflict('This activity is not running at that time on the selected date.', 'NOT_AVAILABLE', { availableSpots: 0 });
  if (s.availableSpots < participants) {
    throw ApiError.conflict(s.availableSpots === 0 ? 'This slot is fully booked.' : `Only ${s.availableSpots} spot(s) left in this slot.`, 'NOT_AVAILABLE', { availableSpots: s.availableSpots });
  }
  return s;
}

/** POST /bookings/experiences/quote */
export async function quoteExperience(input: ExperienceBookingInput, viewerId?: string) {
  const { exp, tier, slot, participants, isMember, ledger } = await prepareExperience(input, viewerId);
  const config = await getPlatformConfig();
  const slots = await experienceSlotAvailability(exp, input.activityDate);
  const s = slots.find((x) => x.slotId === slot.slotId);
  return {
    experience: { id: exp.id, title: exp.title, slug: exp.slug, city: exp.city, image: exp.image },
    selectedTier: { tierId: tier.tierId, name: tier.name, pricePerPerson: tier.pricePerPerson },
    selectedSlot: { slotId: slot.slotId, time: slot.time, label: slot.label },
    activityDate: input.activityDate,
    participants: { adults: input.participants.adults, children: input.participants.children, totalParticipants: participants },
    pricing: ledger,
    memberDiscountApplied: isMember,
    availability: { availableSpots: s?.availableSpots ?? 0, isAvailable: !!s && !s.blocked && s.availableSpots >= participants },
    cancellationPolicy: {
      freeCancellationHours: config.cancellationWindowRules.defaultFreeCancellationHours,
      lateCancellationFeePercent: config.cancellationWindowRules.lateCancellationFeePercent,
      summary:
        exp.cancellationPolicy ??
        `Free cancellation up to ${config.cancellationWindowRules.defaultFreeCancellationHours} hours before the activity. ${config.cancellationWindowRules.lateCancellationFeePercent}% charge after that.`,
    },
    currency: 'INR' as const,
  };
}

/** POST /bookings/experiences/reserve — locks the slot, creates the hold and payment order. */
export async function reserveExperience(userId: string, input: ExperienceBookingInput) {
  const user = await assertUserCanBook(userId);
  const customer = { fullName: user.fullName, email: user.email, phone: user.phone };

  const existing = await prisma.experienceBooking.findFirst({
    where: {
      userId,
      experienceId: input.experienceId,
      tierId: input.tierId,
      slotId: input.slotId,
      activityDate: input.activityDate,
      adults: input.participants.adults,
      children: input.participants.children,
      bookingStatus: 'pending',
      holdExpiresAt: { gt: new Date() },
    },
  });
  if (existing) {
    const checkout = await reuseCheckout('experience', existing.id, existing.bookingReference, existing.holdExpiresAt, customer);
    if (checkout) return { booking: presentExperienceBooking(existing), checkout, reused: true };
  }

  const { exp, vendor, tier, slot, participants, ledger } = await prepareExperience(input, userId);
  const settlement = calculateSettlement(vendor.commissionTerms, 'experience', ledger.taxableAmount, ledger.grandTotalInr);

  const booking = await lockService.withLock(`exp:${exp.id}:${slot.slotId}:${input.activityDate}`, async () => {
    await assertSlotCapacity(exp, slot.slotId, input.activityDate, participants);
    return prisma.experienceBooking.create({
      data: {
        bookingReference: await generateBookingReference('EXP'),
        userId,
        experienceId: exp.id,
        vendorId: exp.vendorId,
        tierId: tier.tierId,
        tierName: tier.name,
        slotId: slot.slotId,
        slotTime: slot.time,
        activityDate: input.activityDate,
        adults: input.participants.adults,
        children: input.participants.children,
        totalParticipants: participants,
        pricing: {
          pricePerPerson: ledger.pricePerPerson,
          adultsCost: ledger.adultsCost,
          childrenCost: ledger.childrenCost,
          baseCost: ledger.baseCost,
          memberDiscount: ledger.memberDiscount,
          gearInsuranceFee: ledger.gearInsuranceFee,
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
        customerLocation: input.customerLocation || null,
        specialRequests: input.specialRequests,
        billingState: input.billingState,
      },
    });
  });

  try {
    const checkout = await createCheckoutOrder({
      bookingType: 'experience',
      bookingId: booking.id,
      reference: booking.bookingReference,
      userId,
      vendorId: booking.vendorId,
      amountInr: booking.grandTotalInr,
      holdExpiresAt: booking.holdExpiresAt as Date,
      customer,
    });
    return { booking: presentExperienceBooking(booking, { experience: exp }), checkout, reused: false };
  } catch (err) {
    await prisma.experienceBooking.update({
      where: { id: booking.id },
      data: { bookingStatus: 'cancelled', holdExpiresAt: null, cancellation: cancellationBySystem('Payment order could not be created') },
    });
    throw err;
  }
}
