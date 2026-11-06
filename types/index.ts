// ─────────────────────────────────────────────────────────────────────────────
// Mahastays Admin & Vendor Portal — Core Domain Types
// Mirrors backend/prisma/schema.prisma definitions
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'sub_admin' | 'vendor' | 'user';

export type ListingStatus =
  | 'pending_approval'
  | 'active'
  | 'inactive'
  | 'rejected'
  | 'blocked'
  | 'archived';

export type PropertyType = 'resort' | 'villa' | 'hotel' | 'cottage' | 'apartment';

export type PackageType = 'couple' | 'bachelor_party' | 'corporate' | 'birthday';

export type PackageCategory = 'Honeymoon' | 'Luxury' | 'Adventure' | 'Heritage';

export type Difficulty = 'Easy' | 'Moderate' | 'Challenging';

export type AdType = 'banner' | 'card' | 'sidebar' | 'popup';

export type AdPlacement =
  | 'homepage'
  | 'search_results'
  | 'property_page'
  | 'all'
  | 'packages'
  | 'experiences'
  | 'stays'
  | 'home';

export type AdSectionTab = 'all' | 'home' | 'stays' | 'packages' | 'experiences';

export type AdTargetType = 'property' | 'package' | 'activity';

export type PaymentStatus = 'unpaid' | 'processing' | 'paid' | 'refunded' | 'partially_refunded';

export type StayBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type PackageBookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type ExperienceBookingStatus =
  | 'pending'
  | 'reserved'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface RoomItem {
  roomId: string;
  name: string;
  badge?: string;
  tagline?: string;
  roomSize?: number;
  bedType?: string;
  maxGuests: number;
  basePrice: number;
  originalPrice?: number;
  count: number;
  images: string[];
  amenities: string[];
}

export interface PropertyItem {
  id: string;
  code: string;
  slug: string;
  vendorId: string;
  vendorName: string;
  name: string;
  propertyType: PropertyType;
  tagline?: string;
  badge?: string;
  description: string;
  longDescription?: string;
  location: string;
  city: string;
  numericPrice: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  images: string[];
  gallery?: string[];
  videos?: string[];
  rooms: RoomItem[];
  amenities: string[];
  featured: boolean;
  acceptingBookings?: boolean;
  status: ListingStatus;
  rejectionReason?: string;
  approvedAt?: string;
  approvedByAdminId?: string;
  createdAt: string;

  // Rich schema fields
  host?: {
    name: string;
    role?: string;
    experience?: string;
    avatar?: string;
    verified?: boolean;
    staysCount?: string;
    confirmationBadge?: string;
  };
  keyAmenities?: Array<{
    name: string;
    desc: string;
    icon?: string;
  }>;
  facilityCategories?: Array<{
    category: string;
    items: string[];
    icon?: string;
  }>;
  highlights?: Array<{
    title: string;
    desc?: string;
    icon?: string;
  }>;
  policies?: {
    checkInTime?: string;
    checkOutTime?: string;
    earlyCheckInNote?: string;
    cancellationPolicy?: string;
    freeCancellationHours?: number;
    lateCancellationFeePercent?: number;
    petsAllowed?: boolean;
    smokingAllowed?: boolean;
    coupleFriendly?: boolean;
    suitabilityRules?: string[];
    guidelines?: string[];
    quietHours?: string;
    guidelinesNote?: string;
    fullAddress?: string;
  };
  address?: {
    fullAddress: string;
    lat?: number;
    lng?: number;
    mapLink?: string;
  };
  nearbyAttractions?: Array<{
    name: string;
    distance: string;
    desc?: string;
  }>;
  videoUrl?: string;
  idealFor?: string;
  pricingRules?: PricingBreakdownConfig;
}

export interface PricingBreakdownConfig {
  memberDiscountPercent?: number;
  customDiscountAmount?: number;
  discountType?: 'percentage' | 'flat' | 'none';
  cleaningFee?: number;
  includeCleaningFee?: boolean;
  gstPercent?: number;
  includeGst?: boolean;
  otherFeeName?: string;
  otherFeeAmount?: number;
}

export interface PackageTierItem {
  tierId: string;
  name: string;
  badge?: string;
  tagline?: string;
  hotelType?: string;
  pricePerPerson: number;
  originalPrice?: number;
  features: string[];
}

export interface PackageItem {
  id: string;
  code: string;
  slug: string;
  vendorId: string;
  vendorName: string;
  propertyId: string;
  propertyName: string;
  title: string;
  badge?: string;
  packageType: PackageType;
  category: PackageCategory;
  durationDays: number;
  durationNights: number;
  location: string;
  city: string;
  numericPrice: number;
  originalPrice?: number;
  shortDesc: string;
  description?: string;
  overview?: string;
  thumbnail: string;
  images: string[];
  highlights: string[];
  inclusions: Array<{ title: string; desc?: string; icon?: string }>;
  exclusions: string[];
  itinerary?: Array<{ day: number; title: string; desc?: string; activities?: string[]; meals?: string; stay?: string }>;
  tiers: PackageTierItem[];
  cancellationPolicy?: string;
  host?: {
    name: string;
    role?: string;
    experience?: string;
    avatar?: string;
    verified?: boolean;
    staysCount?: string;
    confirmationBadge?: string;
  };
  keyHighlights?: Array<{
    name: string;
    desc: string;
    icon?: string;
  }>;
  videoUrl?: string;
  idealFor?: string;
  destinations?: string;
  address?: {
    fullAddress: string;
    lat: number;
    lng: number;
    mapLink?: string;
  };
  nearbyAttractions?: Array<{
    name: string;
    distance: string;
    desc?: string;
  }>;
  policies?: {
    cancellationPolicy?: string;
    rules?: string[];
  };
  rating: number;
  reviewsCount: number;
  featured: boolean;
  acceptingBookings?: boolean;
  status: ListingStatus;
  rejectionReason?: string;
  approvedAt?: string;
  approvedByAdminId?: string;
  createdAt: string;
  pricingRules?: PricingBreakdownConfig;
}

export interface ExperienceSlotItem {
  slotId: string;
  time: string;
  label: string;
  capacity: number;
  price?: number;
}

export interface ExperienceTierItem {
  tierId: string;
  name: string;
  tagline?: string;
  pricePerPerson: number;
  originalPrice?: number;
  features: string[];
}

export interface ExperienceItem {
  id: string;
  code: string;
  slug: string;
  vendorId: string;
  vendorName: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  duration: string;
  city: string;
  location?: string;
  numericPrice: number;
  originalPrice?: number;
  image: string;
  gallery?: string[];
  description: string;
  overview?: string;
  highlights: string[];
  slots: ExperienceSlotItem[];
  tiers?: ExperienceTierItem[];
  timeline?: Array<{ time: string; title: string; desc?: string }>;
  inclusions?: Array<{ title: string; desc?: string; icon?: string }>;
  exclusions?: string[];
  whatToBring?: string[];
  meetingPoint?: string;
  maxGroupSize?: number;
  cancellationPolicy?: string;
  guide?: {
    name: string;
    role?: string;
    avatar?: string;
    experience?: string;
    staysCount?: string;
    verified?: boolean;
    confirmationBadge?: string;
  };
  host?: {
    name: string;
    role?: string;
    avatar?: string;
    experience?: string;
    staysCount?: string;
    verified?: boolean;
    confirmationBadge?: string;
  };
  keyHighlights?: Array<{
    name: string;
    desc: string;
    icon?: string;
  }>;
  videoUrl?: string;
  idealFor?: string;
  groupSizeText?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: {
    fullAddress: string;
    lat: number;
    lng: number;
    mapLink?: string;
  };
  nearbyAttractions?: Array<{
    name: string;
    distance: string;
    desc?: string;
  }>;
  rating: number;
  reviewsCount: number;
  featured: boolean;
  acceptingBookings?: boolean;
  status: ListingStatus;
  rejectionReason?: string;
  approvedAt?: string;
  approvedByAdminId?: string;
  createdAt: string;
  pricingRules?: PricingBreakdownConfig;
}

export interface BookingChargeItem {
  id: string;
  category: 'Restaurant' | 'Bar' | 'Spa' | 'Laundry' | 'Room';
  title: string;
  date: string;
  amount: number;
  selected?: boolean;
}

export interface BookingNoteItem {
  id: string;
  authorName: string;
  authorRole: 'Admin' | 'Vendor' | 'Staff';
  avatar: string;
  date: string;
  text: string;
}

export interface StayBookingItem {
  id: string;
  type: 'stay';
  bookingReference: string;
  userId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestAvatar?: string;
  vipStatus?: boolean;
  nationality?: string;
  dateOfBirth?: string;
  idCardNumber?: string;
  propertyId: string;
  propertyName: string;
  vendorId: string;
  vendorName: string;
  roomId: string;
  roomName: string;
  roomImage?: string;
  bedType?: string;
  features?: string[];
  checkInDate: string;
  checkInTime?: string;
  checkOutDate: string;
  checkOutTime?: string;
  nights: number;
  adults: number;
  children: number;
  roomPricePerNight: number;
  cleaningFee: number;
  memberDiscount: number;
  taxesGst: number;
  grandTotalInr: number;
  paymentStatus: PaymentStatus;
  bookingStatus: StayBookingStatus;
  specialRequests?: string;
  charges: BookingChargeItem[];
  notes: BookingNoteItem[];
  createdAt: string;
}

export interface GuestProfile {
  id: string;
  guestCode: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  vipStatus: boolean;
  vipTier?: 'Standard' | 'Gold' | 'Platinum';
  nationality: string;
  dateOfBirth?: string;
  idCardNumber?: string;
  idCardType?: 'Passport' | 'Aadhaar' | 'National ID' | 'Driving License';
  isVerified?: boolean;
  memberSince?: string;
  address?: string;
  city?: string;
  preferences?: {
    dietary?: string;
    bedType?: string;
    floorPreference?: string;
    allergies?: string;
    specialNotes?: string;
  };
  stats?: {
    totalBookings: number;
    totalSpent: number;
    completedStays: number;
    cancelledBookings: number;
    averageRating: number;
  };
  notes?: Array<{
    id: string;
    authorName: string;
    authorRole: string;
    date: string;
    text: string;
  }>;
}

export interface PackageBookingItem {
  id: string;
  type: 'package';
  bookingReference: string;
  userId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestAvatar?: string;
  packageId: string;
  packageTitle: string;
  vendorId: string;
  vendorName: string;
  tierName: string;
  startDate: string;
  endDate: string;
  travelers: number;
  grandTotalInr: number;
  paymentStatus: PaymentStatus;
  bookingStatus: PackageBookingStatus;
  specialRequests?: string;
  createdAt: string;
}

export interface ExperienceBookingItem {
  id: string;
  type: 'experience';
  bookingReference: string;
  userId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestAvatar?: string;
  experienceId: string;
  experienceTitle: string;
  vendorId: string;
  vendorName: string;
  slotTime: string;
  activityDate: string;
  participants: number;
  grandTotalInr: number;
  paymentStatus: PaymentStatus;
  bookingStatus: ExperienceBookingStatus;
  specialRequests?: string;
  createdAt: string;
}

export type AnyBooking = StayBookingItem | PackageBookingItem | ExperienceBookingItem;

export interface AdCampaignItem {
  id: string;
  adName: string;
  adType: AdType;
  placement: AdPlacement;
  target: {
    targetType: AdTargetType;
    targetId: string;
    targetTitle: string;
    ctaLink: string;
  };
  creative: {
    headline: string;
    subHeadline?: string;
    imageUrl: string;
    badgeText?: string;
    buttonText: string;
    price?: string;
    priceUnit?: string;
    features?: Array<{ icon?: string; label: string }> | string[];
  };
  budget: {
    totalBudget: number;
    dailyBudget?: number;
    costPerClick: number;
    costPerImpression: number;
    spentSoFar: number;
  };
  impressions: number;
  clicks: number;
  conversions: number;
  priority: number;
  isActive: boolean;
  approvedByAdmin: boolean;
  approvedByAdminId?: string;
  createdById: string;
  createdByRole: 'admin' | 'vendor';
  createdByName: string;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface VendorItem {
  id: string;
  vendorCode: string;
  businessName: string;
  displayName: string;
  displayRole: string;
  experienceSummary?: string;
  businessType?: 'individual' | 'proprietorship' | 'private_limited' | 'partnership';
  category: 'property_host' | 'activity_operator' | 'integrated_resort';
  avatarUrl: string;
  email: string;
  phone: string;
  status: 'active' | 'pending_approval' | 'on_hold' | 'blacklisted';
  compliance: {
    panNumber: string;
    gstin?: string;
    tourismLicenseNumber?: string;
    aadhaarNumber?: string;
    identityProofUrl?: string;
    businessProofUrl?: string;
    bankProofUrl?: string;
    tourismProofUrl?: string;
    verificationStatus: 'pending' | 'under_review' | 'approved' | 'rejected';
  };
  banking: {
    bankName: string;
    accountHolderName: string;
    accountNumberLast4: string;
    accountNumber?: string;
    ifscCode: string;
    branchName?: string;
    upiId?: string;
    isAccountVerified: boolean;
  };
  contact?: {
    primaryContactPerson?: string;
    alternatePhone?: string;
    registeredOfficeAddress?: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      pincode: string;
      country?: string;
    };
  };
  wallet: {
    availableInr: number;
    pendingInr: number;
    lifetimeEarningsInr: number;
    lifetimeCommissionInr: number;
  };
  commissionTerms?: {
    commissionType?: 'percentage' | 'fixed';
    propertyCommissionRatePercent?: number;
    packageCommissionRatePercent?: number;
    experienceCommissionRatePercent?: number;
    payoutCycle?: 'weekly' | 'biweekly' | 'monthly';
  };
}

export interface PlatformConfigData {
  platformBookingsEnabled?: boolean;
  platformBookingsMessage?: string;
  gstRates: {
    staysStandardGstPercent: number;
    packagesGstPercent: number;
    experiencesGstPercent: number;
  };
  platformFees: {
    defaultCleaningFeeRatePercent: number;
    defaultGearInsuranceFeeRatePercent: number;
    clubMemberDiscountPercent: number;
    packageChildPricePercent: number;
    experienceChildPricePercent: number;
  };
  cancellationWindowRules: {
    defaultFreeCancellationHours: number;
    lateCancellationFeePercent: number;
  };
  defaultCommission: {
    propertyCommissionRatePercent: number;
    packageCommissionRatePercent: number;
    experienceCommissionRatePercent: number;
    payoutCycle: 'weekly' | 'biweekly' | 'monthly';
  };
  payoutRules: {
    tdsRatePercent: number;
    minPayoutAmountInr: number;
    holdDaysAfterService: number;
  };
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
  businessName?: string;
  vendorId?: string;
  vendorCode?: string;
  adminCode?: string;
  permissions?: {
    canApproveVendors?: boolean;
    canApproveProperties?: boolean;
    canApprovePackages?: boolean;
    canApproveExperiences?: boolean;
    canApproveAdCampaigns?: boolean;
    canProcessOverridesAndDisputes?: boolean;
    canBlockListings?: boolean;
  };
}

export interface HeroSlide {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string;
  paragraph?: string;
  image: string;
  cloudinaryPublicId?: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
