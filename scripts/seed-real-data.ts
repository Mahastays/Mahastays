import { prisma } from '../src/lib/prisma';
import { encrypt, hashPassword } from '../src/utils/crypto';
import { generateActorCode } from '../src/utils/codes';

async function main() {
  console.log('⚡ Starting real accounts & bookings synchronization into MongoDB...');

  // 1. Ensure Admin Account: admin@mahastays.com
  let admin = await prisma.admin.findUnique({ where: { email: 'admin@mahastays.com' } });
  const adminPassHash = await hashPassword('admin123');

  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        adminCode: await generateActorCode('ADM'),
        fullName: 'Ariana Davis',
        email: 'admin@mahastays.com',
        phone: '+919999901001',
        passwordHash: adminPassHash,
        roleTitle: 'Senior Operations Lead — Western Maharashtra',
        permissions: {
          canApproveVendors: true,
          canApproveProperties: true,
          canApprovePackages: true,
          canApproveExperiences: true,
          canApproveAdCampaigns: true,
          canProcessOverridesAndDisputes: true,
          canManageSubAdmins: true,
          canExportFinancialReports: true,
          canBlockListings: true,
        },
        security: { isTwoFactorEnabled: false, allowedIpWhitelists: [] },
        status: 'active',
      },
    });
    console.log('✅ Created real Admin: admin@mahastays.com (pass: admin123)');
  } else {
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash: adminPassHash, status: 'active' },
    });
    console.log('✅ Verified real Admin: admin@mahastays.com');
  }

  // 2. Ensure Vendor Account: vendor@mahastays.com
  const vendorPassHash = await hashPassword('vendor123');
  let vendor = await prisma.vendor.findUnique({ where: { email: 'vendor@mahastays.com' } });

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        vendorCode: await generateActorCode('VND'),
        businessType: 'private_limited',
        category: 'integrated_resort',
        businessName: 'HillView Hospitality Pvt Ltd',
        displayName: 'Vikramaditya Rao',
        displayRole: 'Resort General Manager · HillView Hospitality',
        experienceSummary: 'Operating luxury hill resorts & heritage villas in Mahabaleshwar since 2018',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        email: 'vendor@mahastays.com',
        phone: '+919822003001',
        passwordHash: vendorPassHash,
        contact: {
          primaryContactPerson: 'Vikramaditya Rao',
          registeredOfficeAddress: {
            addressLine1: 'Plot 12, Venna Lake Road',
            city: 'Mahabaleshwar',
            district: 'Satara',
            state: 'Maharashtra',
            pincode: '412806',
            country: 'India',
          },
        },
        compliance: {
          panNumber: 'ABCDE1234F',
          gstin: '27ABCDE1234F1Z5',
          tourismLicenseNumber: 'MTDC/2018/04512',
          identityProofUrl: 'https://example.com/kyc/identity.pdf',
          businessProofUrl: 'https://example.com/kyc/business.pdf',
          verificationStatus: 'approved',
          verifiedAt: new Date(),
          verifiedByAdminId: admin.id,
        },
        banking: {
          accountHolderName: 'HillView Hospitality Pvt Ltd',
          accountNumberEnc: encrypt('123456789012'),
          accountNumberLast4: '9012',
          bankName: 'HDFC Bank',
          ifscCode: 'HDFC0001234',
          branchName: 'Mahabaleshwar Branch',
          isAccountVerified: true,
        },
        commissionTerms: {
          commissionType: 'percentage',
          propertyCommissionRatePercent: 12,
          packageCommissionRatePercent: 10,
          experienceCommissionRatePercent: 15,
          payoutCycle: 'monthly',
        },
        status: 'active',
      },
    });
    console.log('✅ Created real Vendor: vendor@mahastays.com (pass: vendor123)');
  } else {
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { passwordHash: vendorPassHash, status: 'active' },
    });
    console.log('✅ Verified real Vendor: vendor@mahastays.com');
  }

  // Also update existing vendor host@hillview.local password to Demo@12345
  const hostVendor = await prisma.vendor.findUnique({ where: { email: 'host@hillview.local' } });
  if (hostVendor) {
    await prisma.vendor.update({
      where: { id: hostVendor.id },
      data: { passwordHash: await hashPassword('Demo@12345') },
    });
  }

  // Link properties to this vendor as well
  await prisma.property.updateMany({
    where: { name: { contains: 'HillView' } },
    data: { vendorId: vendor.id },
  });
  await prisma.property.updateMany({
    where: { name: { contains: 'Strawberry' } },
    data: { vendorId: vendor.id },
  });

  // Link packages to this vendor
  await prisma.package.updateMany({
    where: { title: { contains: 'Anniversary' } },
    data: { vendorId: vendor.id },
  });
  await prisma.package.updateMany({
    where: { title: { contains: 'Bachelor' } },
    data: { vendorId: vendor.id },
  });

  // 3. Ensure a Customer User exists for booking relations
  let customer = await prisma.user.findFirst({ where: { email: 'cahyadi.purnomo@gmail.com' } });
  if (!customer) {
    customer = await prisma.user.create({
      data: {
        userCode: await generateActorCode('USR'),
        fullName: 'Cahyadi Purnomo',
        email: 'cahyadi.purnomo@gmail.com',
        phone: { countryCode: '+62', nationalNumber: '81234567890', isVerified: true },
        passwordHash: await hashPassword('Demo@12345'),
        membership: { isClubMember: true, tier: 'gold', joinedAt: new Date() },
        preferences: { preferredLanguage: 'en', currency: 'INR', dietaryPreference: 'veg' },
        verification: { isEmailVerified: true, isPhoneVerified: true, isIdVerified: true },
      },
    });
    console.log('✅ Created customer Cahyadi Purnomo');
  }

  // 4. Ensure Real Properties in DB
  const hillView = await prisma.property.findFirst({ where: { name: { contains: 'HillView' } } });
  const anniversaryPkg = await prisma.package.findFirst();
  const trekExp = await prisma.experience.findFirst();

  if (hillView) {
    // 5. Seed Real Stay Bookings in MongoDB
    const existingBk1 = await prisma.stayBooking.findUnique({ where: { bookingReference: 'EMP-00025' } });
    if (!existingBk1) {
      await prisma.stayBooking.create({
        data: {
          bookingReference: 'EMP-00025',
          userId: customer.id,
          propertyId: hillView.id,
          vendorId: vendor.id,
          roomId: hillView.rooms?.[0]?.roomId || 'rm_deluxe_02',
          roomName: hillView.rooms?.[0]?.name || 'Deluxe A - 02',
          roomQuantity: 1,
          checkInDate: '2026-11-02',
          checkOutDate: '2026-11-04',
          nights: 2,
          adults: 2,
          children: 0,
          totalGuests: 2,
          pricing: {
            roomPricePerNight: 8500,
            baseTotal: 17000,
            cleaningFee: 0,
            memberDiscount: 1000,
            taxableSubtotal: 16000,
            taxesGst: 1530,
            grandTotalInr: 17530,
            gstRatePercent: 18,
          },
          grandTotalInr: 17530,
          taxableAmountInr: 16000,
          commissionRatePercent: 12,
          commissionAmountInr: 1920,
          vendorShareInr: 14080,
          paymentStatus: 'paid',
          bookingStatus: 'confirmed',
          specialRequests: 'Flight arriving late at Pune Airport. Late check-in requested at 9:46 PM. Non-smoking corner room.',
          guestName: 'Cahyadi Purnomo',
          guestPhone: '+62 812-3456-7890',
          confirmedAt: new Date(),
        },
      });
      console.log('✅ Created StayBooking EMP-00025');
    }

    const existingBk2 = await prisma.stayBooking.findUnique({ where: { bookingReference: 'EMP-00026' } });
    if (!existingBk2) {
      await prisma.stayBooking.create({
        data: {
          bookingReference: 'EMP-00026',
          userId: customer.id,
          propertyId: hillView.id,
          vendorId: vendor.id,
          roomId: hillView.rooms?.[0]?.roomId || 'rm_deluxe_02',
          roomName: 'Deluxe A - 02',
          roomQuantity: 1,
          checkInDate: '2026-11-02',
          checkOutDate: '2026-11-04',
          nights: 2,
          adults: 1,
          children: 0,
          totalGuests: 1,
          pricing: {
            roomPricePerNight: 8500,
            baseTotal: 17000,
            cleaningFee: 0,
            memberDiscount: 500,
            taxableSubtotal: 16500,
            taxesGst: 1440,
            grandTotalInr: 17940,
            gstRatePercent: 18,
          },
          grandTotalInr: 17940,
          taxableAmountInr: 16500,
          paymentStatus: 'refunded',
          bookingStatus: 'cancelled',
          specialRequests: 'Allergic to feathers; synthetic hypo-allergenic bedding required.',
          guestName: 'Angela Smith',
          guestPhone: '+44 7700 900123',
        },
      });
      console.log('✅ Created StayBooking EMP-00026');
    }

    const existingBk3 = await prisma.stayBooking.findUnique({ where: { bookingReference: 'EMP-00027' } });
    if (!existingBk3) {
      await prisma.stayBooking.create({
        data: {
          bookingReference: 'EMP-00027',
          userId: customer.id,
          propertyId: hillView.id,
          vendorId: vendor.id,
          roomId: hillView.rooms?.[0]?.roomId || 'rm_deluxe_02',
          roomName: 'Deluxe A - 02',
          roomQuantity: 1,
          checkInDate: '2026-11-02',
          checkOutDate: '2026-11-04',
          nights: 2,
          adults: 2,
          children: 1,
          totalGuests: 3,
          pricing: {
            roomPricePerNight: 8500,
            baseTotal: 17000,
            cleaningFee: 0,
            memberDiscount: 0,
            taxableSubtotal: 17000,
            taxesGst: 1530,
            grandTotalInr: 18530,
            gstRatePercent: 18,
          },
          grandTotalInr: 18530,
          taxableAmountInr: 17000,
          paymentStatus: 'refunded',
          bookingStatus: 'cancelled',
          specialRequests: 'Child cot requested. High floor valley view.',
          guestName: 'Hendric Suratman',
          guestPhone: '+62 821-9876-5432',
        },
      });
      console.log('✅ Created StayBooking EMP-00027');
    }

    const existingBk4 = await prisma.stayBooking.findUnique({ where: { bookingReference: '0006789' } });
    if (!existingBk4) {
      await prisma.stayBooking.create({
        data: {
          bookingReference: '0006789',
          userId: customer.id,
          propertyId: hillView.id,
          vendorId: vendor.id,
          roomId: hillView.rooms?.[0]?.roomId || 'rm_505',
          roomName: 'St. Double Room',
          roomQuantity: 1,
          checkInDate: '2026-09-01',
          checkOutDate: '2026-09-07',
          nights: 6,
          adults: 2,
          children: 0,
          totalGuests: 2,
          pricing: {
            roomPricePerNight: 1600,
            baseTotal: 9600,
            cleaningFee: 0,
            memberDiscount: 0,
            taxableSubtotal: 9600,
            taxesGst: 1200,
            grandTotalInr: 10800,
            gstRatePercent: 18,
          },
          grandTotalInr: 10800,
          taxableAmountInr: 9600,
          paymentStatus: 'paid',
          bookingStatus: 'confirmed',
          specialRequests: 'Allergic to dairy products. Quiet valley facing room requested.',
          guestName: 'Tomy Blotz',
          guestPhone: '+41-79-261-5278',
        },
      });
      console.log('✅ Created StayBooking 0006789');
    }
  }

  // 6. Seed Package Booking in MongoDB
  if (anniversaryPkg && hillView) {
    const existingPkgBk = await prisma.packageBooking.findUnique({ where: { bookingReference: 'PKG-8821' } });
    if (!existingPkgBk) {
      await prisma.packageBooking.create({
        data: {
          bookingReference: 'PKG-8821',
          userId: customer.id,
          packageId: anniversaryPkg.id,
          vendorId: vendor.id,
          hostPropertyId: hillView.id,
          tierId: anniversaryPkg.tiers?.[0]?.tierId || 'tier_honeymoon',
          tierName: anniversaryPkg.tiers?.[0]?.name || 'Romantic Honeymoon Tier',
          startDate: '2026-10-18',
          endDate: '2026-10-21',
          adults: 2,
          children: 0,
          totalTravelers: 2,
          pricing: {
            pricePerPerson: 11500,
            adultsCost: 23000,
            childrenCost: 0,
            weekendSurcharge: 0,
            baseCost: 23000,
            memberDiscount: 1500,
            taxableAmount: 21500,
            taxesGst: 2070,
            grandTotalInr: 23570,
            gstRatePercent: 18,
          },
          grandTotalInr: 23570,
          taxableAmountInr: 21500,
          paymentStatus: 'paid',
          bookingStatus: 'confirmed',
          specialRequests: 'Surprise anniversary cake and candlelight dinner by the lake.',
          guestName: 'Priya Sharma',
          guestPhone: '+91 98201 23456',
        },
      });
      console.log('✅ Created PackageBooking PKG-8821');
    }
  }

  // 7. Seed Experience Booking in MongoDB
  if (trekExp) {
    const existingExpBk = await prisma.experienceBooking.findUnique({ where: { bookingReference: 'EXP-9901' } });
    if (!existingExpBk) {
      await prisma.experienceBooking.create({
        data: {
          bookingReference: 'EXP-9901',
          userId: customer.id,
          experienceId: trekExp.id,
          vendorId: trekExp.vendorId,
          slotId: trekExp.slots?.[0]?.slotId || 'slot_morning',
          slotTime: trekExp.slots?.[0]?.time || '6:00 AM – 8:00 AM',
          tierId: (trekExp as any).tiers?.[0]?.id || 'tier-standard',
          tierName: (trekExp as any).tiers?.[0]?.name || 'Standard Guided Trek',
          activityDate: '2026-11-05',
          adults: 2,
          children: 0,
          totalParticipants: 2,
          pricing: {
            pricePerPerson: 250,
            adultsCost: 500,
            childrenCost: 0,
            baseCost: 500,
            memberDiscount: 0,
            gearInsuranceFee: 0,
            taxableAmount: 500,
            taxesGst: 45,
            grandTotalInr: 545,
            gstRatePercent: 18,
          },
          grandTotalInr: 545,
          taxableAmountInr: 500,
          paymentStatus: 'paid',
          bookingStatus: 'reserved',
          specialRequests: 'First time trekkers, hiking poles requested.',
          guestName: 'Neil Fernandes',
          guestPhone: '+91 98190 87654',
        },
      });
      console.log('✅ Created ExperienceBooking EXP-9901');
    }
  }

  console.log('\n🎉 ALL REAL DATA SYNCHRONIZED SUCCESSFULLY INTO MONGODB DATABASE!\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
