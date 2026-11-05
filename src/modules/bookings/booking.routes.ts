import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { optionalAuth, requireRole } from '../../middlewares/authenticate';
import { created, ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { generateActorCode, generateBookingReference, generateInvoiceNumber } from '../../utils/codes';
import { bodyOf, objectId } from '../../utils/zod';
import { streamInvoicePdf, streamBookingRefInvoicePdf } from '../payments/invoice.service';
import { cancelBooking, previewCancellation } from './booking.cancel.service';
import {
  presentExperienceBooking,
  presentPackageBooking,
  presentStayBooking,
} from './booking.presenter';
import {
  bookingKindParam,
  cancelSchema,
  experienceBookingSchema,
  historyQuery,
  packageBookingSchema,
  stayBookingSchema,
} from './booking.schemas';
import { getUserBooking, listUserBookings, lookupUserBooking } from './booking.query.service';
import { quoteExperience, reserveExperience } from './experience.booking.service';
import { quotePackage, reservePackage } from './package.booking.service';
import { quoteStay, reserveStay } from './stay.booking.service';
import { getPaymentGateway } from '../../services/payment/gateway';
import { sendEmail } from '../../services/notification.service';
import { templates } from '../../services/notification.templates';
import { logger } from '../../config/logger';

export const bookingRouter = Router();

async function dispatchBookingConfirmationEmail(
  booking: any,
  bookingType: string,
  user: { fullName: string; email: string },
  totalInr: number,
  invoiceNumber?: string,
) {
  try {
    let title = 'Mahastays Stay Reservation';
    let when = 'Upcoming dates';
    if (bookingType === 'stay') {
      const prop = await prisma.property.findUnique({ where: { id: booking.propertyId }, select: { name: true } });
      title = prop?.name || 'Luxury Standalone Villa';
      when = `${booking.checkInDate} to ${booking.checkOutDate}`;
    } else if (bookingType === 'package') {
      const pkg = await prisma.package.findUnique({ where: { id: booking.packageId }, select: { title: true } });
      title = pkg?.title || 'Curated Getaway Package';
      when = `Starts ${booking.startDate} (3 Days)`;
    } else if (bookingType === 'experience') {
      const exp = await prisma.experience.findUnique({ where: { id: booking.experienceId }, select: { title: true } });
      title = exp?.title || 'Guided Experience';
      when = `${booking.activityDate} (${booking.slotTime || 'Scheduled Slot'})`;
    }

    const mail = templates.bookingConfirmed({
      name: user.fullName || 'Valued Guest',
      reference: booking.bookingReference,
      title,
      when,
      totalInr,
      invoiceNumber,
      guests: booking.adults ? `${booking.adults} Adults${booking.children ? `, ${booking.children} Child` : ''}` : undefined,
    });

    await sendEmail({
      to: user.email,
      subject: mail.subject,
      html: mail.html,
    });
    logger.info({ email: user.email, ref: booking.bookingReference }, 'Booking confirmation email dispatched');
  } catch (err) {
    logger.error({ err, ref: booking?.bookingReference }, 'Failed to dispatch booking confirmation email');
  }
}

/* Quotes are public (members get their discount when a valid token is sent); reservations need a customer account. */
bookingRouter.post('/stays/quote', optionalAuth, async (req, res) => {
  ok(res, await quoteStay(stayBookingSchema.parse(bodyOf(req)), req.auth?.role === 'user' ? req.auth.id : undefined));
});
bookingRouter.post('/packages/quote', optionalAuth, async (req, res) => {
  ok(res, await quotePackage(packageBookingSchema.parse(bodyOf(req)), req.auth?.role === 'user' ? req.auth.id : undefined));
});
bookingRouter.post('/experiences/quote', optionalAuth, async (req, res) => {
  ok(res, await quoteExperience(experienceBookingSchema.parse(bodyOf(req)), req.auth?.role === 'user' ? req.auth.id : undefined));
});

bookingRouter.post('/stays/reserve', requireRole('user'), async (req, res) => {
  created(res, await reserveStay(req.auth!.id, stayBookingSchema.parse(bodyOf(req))));
});
bookingRouter.post('/packages/reserve', requireRole('user'), async (req, res) => {
  created(res, await reservePackage(req.auth!.id, packageBookingSchema.parse(bodyOf(req))));
});
bookingRouter.post('/experiences/reserve', requireRole('user'), async (req, res) => {
  created(res, await reserveExperience(req.auth!.id, experienceBookingSchema.parse(bodyOf(req))));
});

bookingRouter.post('/checkout', optionalAuth, async (req, res) => {
  const checkoutSchema = z.object({
    bookingType: z.enum(['stay', 'package', 'experience']),
    itemId: z.string().min(1),
    tierOrRoomId: z.string().min(1),
    tierOrRoomName: z.string().optional(),
    startDate: z.string().min(1),
    endDate: z.string().optional(),
    adults: z.number().int().min(1),
    children: z.number().int().min(0).default(0),
    slotId: z.string().optional(),
    slotTime: z.string().optional(),
    guestName: z.string().trim().min(2),
    guestEmail: z.string().trim().email(),
    guestPhone: z.string().trim().min(7),
    billingState: z.string().trim().default('Maharashtra'),
    specialRequests: z.string().max(500).optional(),
    paymentMethod: z.enum(['upi', 'card', 'netbanking', 'pay_at_property', 'online']).default('upi'),
    upiId: z.string().optional(),
    pricing: z
      .object({
        basePrice: z.number().optional(),
        memberDiscount: z.number().optional(),
        cleaningFee: z.number().optional(),
        taxes: z.number().optional(),
        grandTotal: z.number().optional(),
      })
      .optional(),
  });

  const b = checkoutSchema.parse(bodyOf(req));
  const cleanPhone = b.guestPhone.replace(/^\+91/, '').trim();

  // Resolve user
  let user = req.auth?.role === 'user' ? await prisma.user.findUnique({ where: { id: req.auth.id } }) : null;
  if (!user) {
    user = await prisma.user.findFirst({ where: { email: b.guestEmail.toLowerCase() } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          userCode: await generateActorCode('USR'),
          fullName: b.guestName,
          email: b.guestEmail.toLowerCase(),
          authProvider: 'local',
          phone: { countryCode: '+91', nationalNumber: cleanPhone, isVerified: false },
          membership: { isClubMember: false, tier: 'standard', joinedAt: null, expiresAt: null },
          preferences: { preferredLanguage: 'en', currency: 'INR', dietaryPreference: null },
          verification: { isEmailVerified: false, isPhoneVerified: false, governmentIdType: null, governmentIdNumberMasked: null, isIdVerified: false },
          status: 'active',
        },
      });
    }
  }

  const startDt = new Date(b.startDate);
  const endDt = b.endDate ? new Date(b.endDate) : new Date(startDt.getTime() + 86400000 * 3);
  const nights = Math.max(1, Math.round((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24)));
  const totalTravelers = b.adults + b.children;
  const startStr = b.startDate.slice(0, 10);
  const endStr = (b.endDate ? new Date(b.endDate) : endDt).toISOString().slice(0, 10);

  let createdBooking: any = null;
  let vendorId: string = '';
  let grandTotal = b.pricing?.grandTotal || 0;
  // Invoice is NOT generated upfront — only generated after payment is captured and verified
  const invNumber: string | null = null;

  if (b.bookingType === 'stay') {
    let property = await prisma.property.findFirst({
      where: { OR: [{ id: /^[a-f0-9]{24}$/i.test(b.itemId) ? b.itemId : undefined }, { slug: b.itemId }, { code: b.itemId }] },
    });
    if (!property) property = await prisma.property.findFirst({ where: { status: 'active' } });
    if (!property) throw ApiError.notFound('Property');
    vendorId = property.vendorId;

    const room = property.rooms.find((r) => r.roomId === b.tierOrRoomId) || property.rooms[0];
    const roomPrice = room?.basePrice ?? 8900;
    const baseCost = roomPrice * nights;
    const discount = b.pricing?.memberDiscount ?? Math.round(baseCost * 0.08);
    const cleaningFee = b.pricing?.cleaningFee ?? 445;
    const taxes = b.pricing?.taxes ?? Math.round((baseCost - discount + cleaningFee) * 0.18);
    grandTotal = grandTotal || (baseCost - discount + cleaningFee + taxes);

    const ref = await generateBookingReference('MHA');
    createdBooking = await prisma.stayBooking.create({
      data: {
        bookingReference: ref,
        userId: user.id,
        propertyId: property.id,
        vendorId: property.vendorId,
        roomId: room?.roomId || b.tierOrRoomId,
        roomName: b.tierOrRoomName || room?.name || 'Standard Room',
        roomQuantity: 1,
        checkInDate: startStr,
        checkOutDate: endStr,
        nights,
        adults: b.adults,
        children: b.children,
        totalGuests: totalTravelers,
        pricing: {
          roomPricePerNight: roomPrice,
          baseTotal: baseCost,
          cleaningFee,
          memberDiscount: discount,
          taxableSubtotal: baseCost - discount + cleaningFee,
          taxesGst: taxes,
          grandTotalInr: grandTotal,
          gstRatePercent: 18,
        },
        grandTotalInr: grandTotal,
        taxableAmountInr: baseCost - discount + cleaningFee,
        commissionRatePercent: 12,
        commissionAmountInr: Math.round((baseCost - discount + cleaningFee) * 0.12),
        vendorShareInr: grandTotal - Math.round((baseCost - discount + cleaningFee) * 0.12),
        paymentStatus: b.paymentMethod === 'pay_at_property' ? 'unpaid' : 'processing',
        bookingStatus: b.paymentMethod === 'pay_at_property' ? 'confirmed' : 'pending',
        guestName: b.guestName,
        guestPhone: cleanPhone,
        billingState: b.billingState,
        specialRequests: b.specialRequests,
        invoiceNumber: invNumber,
        confirmedAt: b.paymentMethod === 'pay_at_property' ? new Date() : null,
      },
      include: { property: true },
    });
  } else if (b.bookingType === 'package') {
    let pkg = await prisma.package.findFirst({
      where: { OR: [{ id: /^[a-f0-9]{24}$/i.test(b.itemId) ? b.itemId : undefined }, { slug: b.itemId }, { code: b.itemId }] },
    });
    if (!pkg) pkg = await prisma.package.findFirst({ where: { status: 'active' } });
    if (!pkg) throw ApiError.notFound('Package');
    vendorId = pkg.vendorId;

    const tiers = (Array.isArray(pkg.tiers) ? pkg.tiers : []) as any[];
    const tier = tiers.find((t) => t.id === b.tierOrRoomId) || tiers[0];
    const pricePerPerson = tier?.pricePerPerson || pkg.numericPrice || 7499;
    const baseCost = pricePerPerson * b.adults + Math.round(pricePerPerson * 0.6 * b.children);
    const discount = b.pricing?.memberDiscount ?? Math.round(baseCost * 0.08);
    const taxes = b.pricing?.taxes ?? Math.round((baseCost - discount) * 0.05);
    grandTotal = grandTotal || (baseCost - discount + taxes);

    const ref = await generateBookingReference('PKG');
    createdBooking = await prisma.packageBooking.create({
      data: {
        bookingReference: ref,
        userId: user.id,
        packageId: pkg.id,
        vendorId: pkg.vendorId,
        hostPropertyId: pkg.propertyId,
        tierId: tier?.id || b.tierOrRoomId,
        tierName: b.tierOrRoomName || tier?.name || 'Deluxe Tier',
        startDate: startStr,
        endDate: endStr,
        adults: b.adults,
        children: b.children,
        totalTravelers,
        pricing: {
          pricePerPerson,
          adultsCost: pricePerPerson * b.adults,
          childrenCost: Math.round(pricePerPerson * 0.6 * b.children),
          weekendSurcharge: 0,
          baseCost,
          memberDiscount: discount,
          taxableAmount: baseCost - discount,
          taxesGst: taxes,
          grandTotalInr: grandTotal,
          gstRatePercent: 5,
        },
        grandTotalInr: grandTotal,
        taxableAmountInr: baseCost - discount,
        commissionRatePercent: 10,
        commissionAmountInr: Math.round((baseCost - discount) * 0.10),
        vendorShareInr: grandTotal - Math.round((baseCost - discount) * 0.10),
        paymentStatus: b.paymentMethod === 'pay_at_property' ? 'unpaid' : 'processing',
        bookingStatus: b.paymentMethod === 'pay_at_property' ? 'confirmed' : 'pending',
        guestName: b.guestName,
        guestPhone: cleanPhone,
        billingState: b.billingState,
        specialRequests: b.specialRequests,
        invoiceNumber: invNumber,
        confirmedAt: b.paymentMethod === 'pay_at_property' ? new Date() : null,
      },
      include: { package: true },
    });
  } else {
    let exp = await prisma.experience.findFirst({
      where: { OR: [{ id: /^[a-f0-9]{24}$/i.test(b.itemId) ? b.itemId : undefined }, { slug: b.itemId }, { code: b.itemId }] },
    });
    if (!exp) exp = await prisma.experience.findFirst({ where: { status: 'active' } });
    if (!exp) throw ApiError.notFound('Experience');
    vendorId = exp.vendorId;

    const tiers = (Array.isArray(exp.tiers) ? exp.tiers : []) as any[];
    const tier = tiers.find((t) => t.id === b.tierOrRoomId) || tiers[0];
    const pricePerPerson = tier?.pricePerPerson || exp.numericPrice || 799;
    const baseCost = pricePerPerson * b.adults + Math.round(pricePerPerson * 0.7 * b.children);
    const discount = b.pricing?.memberDiscount ?? Math.round(baseCost * 0.08);
    const gearFee = b.pricing?.cleaningFee ?? 199;
    const taxes = b.pricing?.taxes ?? Math.round((baseCost - discount + gearFee) * 0.05);
    grandTotal = grandTotal || (baseCost - discount + gearFee + taxes);

    const ref = await generateBookingReference('EXP');
    createdBooking = await prisma.experienceBooking.create({
      data: {
        bookingReference: ref,
        userId: user.id,
        experienceId: exp.id,
        vendorId: exp.vendorId,
        tierId: tier?.id || b.tierOrRoomId,
        tierName: b.tierOrRoomName || tier?.name || 'Standard Slot',
        slotId: b.slotId || 'slot-1',
        slotTime: b.slotTime || '06:00 AM - 08:00 AM',
        activityDate: startStr,
        adults: b.adults,
        children: b.children,
        totalParticipants: totalTravelers,
        pricing: {
          pricePerPerson,
          adultsCost: pricePerPerson * b.adults,
          childrenCost: Math.round(pricePerPerson * 0.7 * b.children),
          baseCost,
          memberDiscount: discount,
          gearInsuranceFee: gearFee,
          taxableAmount: baseCost - discount + gearFee,
          taxesGst: taxes,
          grandTotalInr: grandTotal,
          gstRatePercent: 5,
        },
        grandTotalInr: grandTotal,
        taxableAmountInr: baseCost - discount + gearFee,
        commissionRatePercent: 15,
        commissionAmountInr: Math.round((baseCost - discount + gearFee) * 0.15),
        vendorShareInr: grandTotal - Math.round((baseCost - discount + gearFee) * 0.15),
        paymentStatus: b.paymentMethod === 'pay_at_property' ? 'unpaid' : 'processing',
        bookingStatus: b.paymentMethod === 'pay_at_property' ? 'reserved' : 'pending',
        guestName: b.guestName,
        guestPhone: cleanPhone,
        billingState: b.billingState,
        specialRequests: b.specialRequests,
        invoiceNumber: invNumber,
        confirmedAt: b.paymentMethod === 'pay_at_property' ? new Date() : null,
      },
      include: { experience: true },
    });
  }

  const gateway = getPaymentGateway();
  let gatewayOrderId = `order_${createdBooking.bookingReference}_${Date.now()}`;
  let razorpayOrderData: any = null;

  if (b.paymentMethod !== 'pay_at_property') {
    try {
      const order = await gateway.createOrder({
        amountInr: grandTotal,
        receipt: createdBooking.bookingReference,
        notes: {
          bookingType: b.bookingType,
          bookingId: createdBooking.id,
          reference: createdBooking.bookingReference,
        },
      });
      gatewayOrderId = order.orderId;
      razorpayOrderData = {
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        amountInr: grandTotal,
        currency: order.currency,
        keyId: gateway.publicKey,
      };
    } catch (err) {
      console.error('Failed to create Razorpay order:', err);
      // Fallback order info so frontend can still launch Razorpay checkout
      razorpayOrderData = {
        orderId: `order_${createdBooking.bookingReference}_${Date.now()}`,
        amountPaise: Math.round(grandTotal * 100),
        amountInr: grandTotal,
        currency: 'INR',
        keyId: gateway.publicKey || 'rzp_test_TsvM6ELYin3phv',
      };
    }
  }

  const payment = await prisma.payment.create({
    data: {
      bookingType: b.bookingType,
      bookingId: createdBooking.id,
      userId: user.id,
      vendorId,
      gateway: gateway.name,
      gatewayOrderId,
      amountInr: grandTotal,
      status: b.paymentMethod === 'pay_at_property' ? 'initiated' : 'initiated',
      method: b.paymentMethod,
      invoiceNumber: invNumber,
      capturedAt: null,
    },
  });

  if (b.paymentMethod === 'pay_at_property') {
    void dispatchBookingConfirmationEmail(createdBooking, b.bookingType, user, grandTotal, undefined);
  }

  created(res, {
    success: true,
    bookingReference: createdBooking.bookingReference,
    invoiceNumber: null,
    booking: {
      id: createdBooking.id,
      bookingReference: createdBooking.bookingReference,
      guestName: b.guestName,
      grandTotalInr: grandTotal,
      paymentStatus: createdBooking.paymentStatus,
      bookingStatus: createdBooking.bookingStatus,
    },
    payment: {
      id: payment.id,
      method: payment.method,
      status: payment.status,
      amountInr: payment.amountInr,
      invoiceNumber: null,
    },
    gatewayOrder: razorpayOrderData,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    },
  });
});

bookingRouter.post('/verify-payment', optionalAuth, async (req, res) => {
  const verifySchema = z.object({
    orderId: z.string().min(5),
    paymentId: z.string().min(5),
    signature: z.string().min(10),
    bookingReference: z.string().optional(),
  });
  const b = verifySchema.parse(bodyOf(req));
  const gateway = getPaymentGateway();
  const isValid = gateway.verifyPaymentSignature({
    orderId: b.orderId,
    paymentId: b.paymentId,
    signature: b.signature,
  });

  if (!isValid) {
    throw ApiError.badRequest('Invalid payment signature', undefined, 'INVALID_SIGNATURE');
  }

  const payment = await prisma.payment.findUnique({ where: { gatewayOrderId: b.orderId } });
  if (!payment) {
    throw ApiError.notFound('Payment record');
  }

  // Payment is successfully captured! Generate the official GST Tax Invoice Number
  const invoiceNumber = await generateInvoiceNumber();

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'captured',
      gatewayPaymentId: b.paymentId,
      capturedAt: new Date(),
      invoiceNumber,
    },
  });

  let updatedBooking: any = null;
  if (payment.bookingType === 'stay') {
    updatedBooking = await prisma.stayBooking.update({
      where: { id: payment.bookingId },
      data: { paymentStatus: 'paid', bookingStatus: 'confirmed', confirmedAt: new Date(), invoiceNumber },
    });
  } else if (payment.bookingType === 'package') {
    updatedBooking = await prisma.packageBooking.update({
      where: { id: payment.bookingId },
      data: { paymentStatus: 'paid', bookingStatus: 'confirmed', confirmedAt: new Date(), invoiceNumber },
    });
  } else if (payment.bookingType === 'experience') {
    updatedBooking = await prisma.experienceBooking.update({
      where: { id: payment.bookingId },
      data: { paymentStatus: 'paid', bookingStatus: 'reserved', confirmedAt: new Date(), invoiceNumber },
    });
  }

  const bookingUser = await prisma.user.findUnique({ where: { id: payment.userId }, select: { fullName: true, email: true } });
  if (bookingUser && updatedBooking) {
    void dispatchBookingConfirmationEmail(
      updatedBooking,
      payment.bookingType,
      bookingUser,
      payment.amountInr,
      updatedBooking?.invoiceNumber || payment.invoiceNumber,
    );
  }

  ok(res, {
    success: true,
    message: 'Payment verified and booking confirmed successfully',
    paymentId: b.paymentId,
    orderId: b.orderId,
    bookingReference: updatedBooking?.bookingReference,
    invoiceNumber: updatedBooking?.invoiceNumber || payment.invoiceNumber,
    booking: updatedBooking,
  });
});

/* Public lookup by bookingReference for checkout confirmation page */
bookingRouter.get('/reference/:ref', optionalAuth, async (req, res) => {
  const rawRef = req.params.ref;
  const ref = Array.isArray(rawRef) ? rawRef[0] : String(rawRef);
  const isHexId = /^[a-f0-9]{24}$/i.test(ref);

  const stay = await prisma.stayBooking.findFirst({
    where: isHexId ? { id: ref } : { bookingReference: ref },
    include: { property: true },
  });
  if (stay) {
    const payment = await prisma.payment.findFirst({ where: { bookingType: 'stay', bookingId: stay.id }, orderBy: { createdAt: 'desc' } });
    return ok(res, {
      bookingType: 'stay',
      booking: presentStayBooking(stay, { property: stay.property }),
      payment: payment ? { status: payment.status, method: payment.method, invoiceNumber: payment.invoiceNumber, amountInr: payment.amountInr, capturedAt: payment.capturedAt } : null,
    });
  }

  const pkg = await prisma.packageBooking.findFirst({
    where: isHexId ? { id: ref } : { bookingReference: ref },
    include: { package: true },
  });
  if (pkg) {
    const payment = await prisma.payment.findFirst({ where: { bookingType: 'package', bookingId: pkg.id }, orderBy: { createdAt: 'desc' } });
    return ok(res, {
      bookingType: 'package',
      booking: presentPackageBooking(pkg, { package: pkg.package }),
      payment: payment ? { status: payment.status, method: payment.method, invoiceNumber: payment.invoiceNumber, amountInr: payment.amountInr, capturedAt: payment.capturedAt } : null,
    });
  }

  const exp = await prisma.experienceBooking.findFirst({
    where: isHexId ? { id: ref } : { bookingReference: ref },
    include: { experience: true },
  });
  if (exp) {
    const payment = await prisma.payment.findFirst({ where: { bookingType: 'experience', bookingId: exp.id }, orderBy: { createdAt: 'desc' } });
    return ok(res, {
      bookingType: 'experience',
      booking: presentExperienceBooking(exp, { experience: exp.experience }),
      payment: payment ? { status: payment.status, method: payment.method, invoiceNumber: payment.invoiceNumber, amountInr: payment.amountInr, capturedAt: payment.capturedAt } : null,
    });
  }

  throw ApiError.notFound('Booking');
});

/* Download Invoice PDF by booking reference */
bookingRouter.get('/invoice/ref/:ref', optionalAuth, async (req, res) => {
  await streamBookingRefInvoicePdf(res, String(req.params.ref));
});

/* Customer's own bookings (declared before the generic /:type/:id routes) */
bookingRouter.get('/user/history', requireRole('user'), async (req, res) => {
  const { items, meta } = await listUserBookings(req.auth!.id, historyQuery.parse(req.query));
  ok(res, items, meta);
});

bookingRouter.get('/lookup/:reference', requireRole('user'), async (req, res) => {
  ok(res, await lookupUserBooking(String(req.params.reference), req.auth!.id));
});

bookingRouter.get('/:type/:id', requireRole('user'), async (req, res) => {
  ok(res, await getUserBooking(bookingKindParam.parse(req.params.type), objectId.parse(req.params.id), req.auth!.id));
});

bookingRouter.get('/:type/:id/cancellation-preview', requireRole('user'), async (req, res) => {
  ok(res, await previewCancellation(bookingKindParam.parse(req.params.type), objectId.parse(req.params.id), { role: 'user', id: req.auth!.id }));
});

bookingRouter.get('/:type/:id/cancel-quote', requireRole('user'), async (req, res) => {
  ok(res, await previewCancellation(bookingKindParam.parse(req.params.type), objectId.parse(req.params.id), { role: 'user', id: req.auth!.id }));
});

bookingRouter.post('/:type/:id/cancel', requireRole('user'), async (req, res) => {
  const { reason } = cancelSchema.parse(bodyOf(req));
  ok(res, await cancelBooking(bookingKindParam.parse(req.params.type), objectId.parse(req.params.id), { role: 'user', id: req.auth!.id }, { reason }, req));
});

bookingRouter.get('/:type/:id/invoice', optionalAuth, async (req, res) => {
  const type = bookingKindParam.parse(req.params.type);
  const id = objectId.parse(req.params.id);
  const payment = await prisma.payment.findFirst({ where: { bookingType: type, bookingId: id } });
  if (payment) {
    await streamInvoicePdf(res, payment);
  } else {
    await streamBookingRefInvoicePdf(res, id);
  }
});


