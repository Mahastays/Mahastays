import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Pushing dummy profile data to MongoDB...');

  // 1. Get a property
  let property = await prisma.property.findFirst();
  if (!property) {
    console.log('No property found in database!');
    return;
  }

  // 2. Target user: meaviishek@gmail.com, or traveler@mahastays.local, or create one
  let users = await prisma.user.findMany({
    where: {
      email: { in: ['meaviishek@gmail.com', 'traveler@mahastays.local'] },
    },
  });

  if (users.length === 0) {
    const anyUser = await prisma.user.findFirst();
    if (anyUser) users = [anyUser];
  }

  for (const user of users) {
    console.log(`Updating profile and booking for ${user.email} (${user.id})...`);

    // Update user profile in schema
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: user.fullName || 'Abhishek Kumar',
        phone: {
          set: {
            countryCode: '+91',
            nationalNumber: '9876543210',
            isVerified: true,
          },
        },
        membership: {
          set: {
            isClubMember: true,
            tier: 'gold',
            joinedAt: new Date('2026-01-15T00:00:00.000Z'),
          },
        },
        preferences: {
          set: {
            preferredLanguage: 'en',
            currency: 'INR',
            dietaryPreference: 'veg',
          },
        },
        verification: {
          set: {
            isEmailVerified: true,
            isPhoneVerified: true,
            governmentIdType: 'aadhaar',
            governmentIdNumberMasked: 'XXXX-XXXX-4921',
            isIdVerified: true,
          },
        },
        totalBookingsCount: 1,
        completedStaysCount: 1,
        totalSpentInr: 18500,
        totalDiscountSavedInr: 1480,
      },
    });

    // Check if user already has a booking
    const existingBooking = await prisma.stayBooking.findFirst({
      where: { userId: user.id },
    });

    if (!existingBooking) {
      const room = property.rooms?.[0];
      const roomId = room?.roomId || 'room-101';
      const roomName = room?.name || 'Deluxe Valley View Suite';

      await prisma.stayBooking.create({
        data: {
          bookingReference: `MS-ST-${Math.floor(10000 + Math.random() * 90000)}`,
          userId: user.id,
          propertyId: property.id,
          vendorId: property.vendorId,
          roomId,
          roomName,
          roomQuantity: 1,
          checkInDate: '2026-11-15',
          checkOutDate: '2026-11-18',
          nights: 3,
          adults: 2,
          children: 0,
          totalGuests: 2,
          pricing: {
            roomPricePerNight: 5500,
            baseTotal: 16500,
            cleaningFee: 500,
            memberDiscount: 1360,
            taxableSubtotal: 15640,
            taxesGst: 2860,
            grandTotalInr: 18500,
            gstRatePercent: 18,
          },
          grandTotalInr: 18500,
          taxableAmountInr: 15640,
          commissionRatePercent: 10,
          commissionAmountInr: 1564,
          vendorShareInr: 16936,
          paymentStatus: 'paid',
          bookingStatus: 'confirmed',
          specialRequests: 'High floor, valley view, late check-in requested.',
        },
      });
      console.log(`Created dummy confirmed stay booking for ${user.email}`);
    } else {
      console.log(`Booking already exists for ${user.email}: ${existingBooking.bookingReference}`);
    }
  }

  console.log('✅ Dummy data successfully pushed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error pushing dummy data:', err);
  process.exit(1);
});
