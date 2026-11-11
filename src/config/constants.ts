export const API_PREFIX = '/api/v1';

export const ROLES = ['user', 'vendor', 'sub_admin', 'admin', 'super_admin'] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES = ['sub_admin', 'admin', 'super_admin'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/** Keys of AdminPermissions (see prisma/schema.prisma) */
export const ADMIN_PERMISSION_KEYS = [
  'canApproveVendors',
  'canApproveProperties',
  'canApprovePackages',
  'canApproveExperiences',
  'canApproveAdCampaigns',
  'canProcessOverridesAndDisputes',
  'canManageSubAdmins',
  'canExportFinancialReports',
  'canBlockListings',
] as const;
export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number];

/** Keys of SubAdminPermissions (boolean flags only; maxRefundCeilingInr is numeric) */
export const SUBADMIN_PERMISSION_KEYS = [
  'canViewBookings',
  'canInitiateCustomerRefunds',
  'canApproveReviews',
  'canFlagFraudulentListings',
  'canManageInquiryTickets',
  'canViewVendorBankDetails',
  'canEditListingDescriptions',
  'canTriggerCustomerNotifications',
] as const;
export type SubAdminPermissionKey = (typeof SUBADMIN_PERMISSION_KEYS)[number];

/** SAC codes printed on invoices. Confirm with your CA before go-live. */
export const SAC_CODES = {
  stay: '996311', // accommodation services (hotels, resorts, villas)
  package: '998555', // tour operator services
  experience: '998555',
} as const;

export const EXPERIENCE_CATEGORIES = [
  'Fun Activity & Resort Games',
  'Night Karaoke & Entertainment',
  'Bonfire & Music',
  'Treasure Hunt',
  'Group Games & Team Building',
  'Tower Building',
  'Musical Chair',
  'Couple Balloon Games',
  'Antakshari & Musical Games',
  'Tambola & Housie',
  'Trekking & Hiking',
  'Watersports & Boating',
  'Stargazing & Camping',
  'Cycling & Mountain Biking',
  'Cultural & Heritage Walk',
  'Strawberry Farm Tour',
  'Adventure & Wildlife Safari',
  'Nature & Sightseeing',
  'Trekking',
  'Culture & Food',
  'Cruises',
  'Safari & Desert',
  'Adventure',
] as const;

export const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export const REFRESH_COOKIE_NAME = 'mh_rt';
export const REFRESH_COOKIE_PATH = `${API_PREFIX}/auth`;

export const MAX_STAY_NIGHTS = 30;
export const MAX_ROOMS_PER_BOOKING = 10;
export const MAX_PARTICIPANTS_PER_BOOKING = 50;
export const MAX_ADVANCE_BOOKING_DAYS = 540;

/** Fallback used by seed + PlatformConfig bootstrap — mirrors the numbers in the spec. */
export const DEFAULT_PLATFORM_CONFIG = {
  platformBookingsEnabled: true,
  platformBookingsMessage: '',
  gstRates: { staysStandardGstPercent: 18, packagesGstPercent: 5, experiencesGstPercent: 5 },
  platformFees: {
    defaultCleaningFeeRatePercent: 5,
    defaultGearInsuranceFeeRatePercent: 4,
    clubMemberDiscountPercent: 8,
    packageChildPricePercent: 60,
    experienceChildPricePercent: 70,
  },
  cancellationWindowRules: { defaultFreeCancellationHours: 48, lateCancellationFeePercent: 50 },
  defaultCommission: {
    propertyCommissionRatePercent: 12,
    packageCommissionRatePercent: 10,
    experienceCommissionRatePercent: 15,
    payoutCycle: 'monthly' as const,
  },
  payoutRules: { tdsRatePercent: 1, minPayoutAmountInr: 1000, holdDaysAfterService: 2 },
  dynamicPricing: { enabled: false, holidayDates: [] as string[] },
};
