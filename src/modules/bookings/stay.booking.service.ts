import { prisma } from '../../lib/prisma';
import { lockService } from '../../services/lock.service';
import { getPaymentGateway } from '../../services/payment/gateway';
import { getPlatformConfig, toPricingConfig } from '../../services/platformConfig.service';
import { ApiError } from '../../utils/ApiError';
import { generateBookingReference } from '../../utils/codes';
import { diffDays, eachNight, todayIST } from '../../utils/dates';
import { MAX_ADVANCE_BOOKING_DAYS, MAX_STAY_NIGHTS } from '../../config/constants';
import { getRoomAvailability } from '../inventory/inventory.service';
import {
  assertUserCanBook,
  cancellationBySystem,
  createCheckoutOrder,
  isActiveClubMember,
  loadBookableVendor,
  newHoldExpiry,
  reuseCheckout,
} from './booking.common';
import { presentStayBooking } from './booking.presenter';
import type { StayBookingInput } from './booking.schemas';
import { calculateSettlement, calculateStayPricing, type StayLedger } from './pricing.engine';

function validateStayRequest(input: StayBookingInput, room: { maxGuests: number; capacity: { adults: number; children: number }; count: number }) {
  const today = todayIST();
  const nights = diffDays(input.checkInDate, input.checkOutDate);
  const bad = (message: string, code: string, details?: unknown) => ApiError.unprocessable(message, details, code);

  if (input.checkInDate < today) throw bad('Check-in date cannot be in the past', 'DATE_IN_PAST');
  if (nights < 1) throw bad('Minimum stay is 1 night', 'INVALID_DATES');
  if (nights > MAX_STAY_NIGHTS) throw bad(`Maximum stay is ${MAX_STAY_NIGHTS} nights`, 'STAY_TOO_LONG');
  if (diffDays(today, input.checkInDate) > MAX_ADVANCE_BOOKING_DAYS) throw bad('Bookings open up to 18 months in advance', 'TOO_FAR_AHEAD');

  const { adults, children } = input.guests;
  if (input.quantity > room.count) throw bad(`Only ${room.count} of this room type exist`, 'QUANTITY_EXCEEDS_ROOMS');
  if (adults + children > room.maxGuests * input.quantity) throw bad(`This room fits at most ${room.maxGuests * input.quantity} guests`, 'TOO_MANY_GUESTS');
  if (adults > room.capacity.adults * input.quantity) throw bad(`This room fits at most ${room.capacity.adults * input.quantity} adults`, 'TOO_MANY_ADULTS');
}

async function prepareStay(input: StayBookingInput, viewerId?: string) {
  const config = await getPlatformConfig();
  if ((config as any).platformBookingsEnabled === false) {
    throw ApiError.conflict(
      (config as any).platformBookingsMessage || 'Bookings across the platform are temporarily paused by administration.',
      'PLATFORM_BOOKINGS_PAUSED'
    );
  }
  const property = await prisma.property.findFirst({ where: { id: input.propertyId, status: 'active' } });
  if (!property) throw ApiError.notFound('Property');
  if ((property as any).acceptingBookings === false) {
    throw ApiError.conflict('This stay is currently not accepting bookings.', 'STAY_BOOKINGS_PAUSED');
  }
  const vendor = await loadBookableVendor(property.vendorId);
  const room = property.rooms.find((r) => r.roomId === input.roomId);
  if (!room) throw ApiError.notFound('Room');
  validateStayRequest(input, room);

  const isMember = await isActiveClubMember(viewerId);
  const ledger = calculateStayPricing(
    { room, nights: eachNight(input.checkInDate, input.checkOutDate), quantity: input.quantity, isClubMember: isMember },
    toPricingConfig(config),
  );
  return { config, property, vendor, room, isMember, ledger };
}

const toPricingDoc = (l: StayLedger) => ({
  roomPricePerNight: l.roomPricePerNight,
  baseTotal: l.baseTotal,
  cleaningFee: l.cleaningFee,
  memberDiscount: l.memberDiscount,
  taxableSubtotal: l.taxableSubtotal,
  taxesGst: l.taxesGst,
  grandTotalInr: l.grandTotalInr,
  gstRatePercent: l.gstRatePercent,
});

/** POST /bookings/stays/quote — price ledger + live availability, nothing is charged or held. */
export async function quoteStay(input: StayBookingInput, viewerId?: string) {
  const { config, property, room, isMember, ledger } = await prepareStay(input, viewerId);
  const availability = await getRoomAvailability(property, room.roomId, input.checkInDate, input.checkOutDate);
  const policy = {
    freeCancellationHours: property.policies.freeCancellationHours ?? config.cancellationWindowRules.defaultFreeCancellationHours,
    lateCancellationFeePercent: property.policies.lateCancellationFeePercent ?? config.cancellationWindowRules.lateCancellationFeePercent,
  };
  return {
    property: { id: property.id, name: property.name, slug: property.slug, city: property.city, image: property.images[0]?.url ?? null },
    room: { roomId: room.roomId, name: room.name, pricePerNight: room.basePrice, unitsInProperty: room.count },
    schedule: { checkInDate: input.checkInDate, checkOutDate: input.checkOutDate, nights: ledger.nights },
    guests: { adults: input.guests.adults, children: input.guests.children, totalGuests: input.guests.adults + input.guests.children },
    quantity: input.quantity,
    pricing: ledger,
    memberDiscountApplied: isMember,
    availability: { availableUnits: availability.availableUnits, isAvailable: availability.availableUnits >= input.quantity },
    cancellationPolicy: {
      ...policy,
      summary: property.policies.cancellationPolicy ?? `Free cancellation up to ${policy.freeCancellationHours} hours before check-in. ${policy.lateCancellationFeePercent}% charge after that.`,
    },
    currency: 'INR' as const,
  };
}

/** POST /bookings/stays/reserve — holds the room (inventory lock) and creates the payment order. */
export async function reserveStay(userId: string, input: StayBookingInput) {
  const user = await assertUserCanBook(userId);
  const customer = { fullName: user.fullName, email: user.email, phone: user.phone };

  // Safe client retry: identical, still-valid reservation → hand back the same checkout.
  const existing = await prisma.stayBooking.findFirst({
    where: {
      userId,
      propertyId: input.propertyId,
      roomId: input.roomId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      roomQuantity: input.quantity,
      adults: input.guests.adults,
      children: input.guests.children,
      bookingStatus: 'pending',
      holdExpiresAt: { gt: new Date() },
    },
  });
  if (existing) {
    const checkout = await reuseCheckout('stay', existing.id, existing.bookingReference, existing.holdExpiresAt, customer);
    if (checkout) return { booking: presentStayBooking(existing), checkout, reused: true };
  }

  const { config, property, vendor, room, ledger } = await prepareStay(input, userId);
  const settlement = calculateSettlement(vendor.commissionTerms, 'stay', ledger.taxableSubtotal, ledger.grandTotalInr);
  void config;

  // ── critical section: availability check + hold creation must be atomic per room type ──
  const booking = await lockService.withLock(`stay:${property.id}:${room.roomId}`, async () => {
    const availability = await getRoomAvailability(property, room.roomId, input.checkInDate, input.checkOutDate);
    if (availability.availableUnits < input.quantity) {
      throw ApiError.conflict(
        availability.availableUnits === 0 ? 'Sorry, this room is no longer available for these dates.' : `Only ${availability.availableUnits} unit(s) left for these dates.`,
        'NOT_AVAILABLE',
        { availableUnits: availability.availableUnits },
      );
    }
    return prisma.stayBooking.create({
      data: {
        bookingReference: await generateBookingReference('MHA'),
        userId,
        propertyId: property.id,
        vendorId: property.vendorId,
        roomId: room.roomId,
        roomName: room.name,
        roomQuantity: input.quantity,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        nights: ledger.nights,
        adults: input.guests.adults,
        children: input.guests.children,
        totalGuests: input.guests.adults + input.guests.children,
        pricing: toPricingDoc(ledger),
        grandTotalInr: ledger.grandTotalInr,
        taxableAmountInr: ledger.taxableSubtotal,
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
  });

  try {
    const checkout = await createCheckoutOrder({
      bookingType: 'stay',
      bookingId: booking.id,
      reference: booking.bookingReference,
      userId,
      vendorId: booking.vendorId,
      amountInr: booking.grandTotalInr,
      holdExpiresAt: booking.holdExpiresAt as Date,
      customer,
    });
    return { booking: presentStayBooking(booking, { property }), checkout, reused: false, gateway: getPaymentGateway().name };
  } catch (err) {
    // Never leave an orphan hold behind when the payment gateway is down.
    await prisma.stayBooking.update({
      where: { id: booking.id },
      data: { bookingStatus: 'cancelled', holdExpiresAt: null, cancellation: cancellationBySystem('Payment order could not be created') },
    });
    throw err;
  }
}
