import { PackageData } from "../components/PackageCard";

export interface RawPackagePricing {
  basePrice: number;
  pricePerPerson: number | null;
  weekendSurcharge: number;
  childPrice?: number | null;
  minGuests: number;
  maxGuests: number;
}

export interface RawPackageDuration {
  nights: number;
  days: number;
  validFrom: string;
  validTill: string;
}

export interface RawPackageInclusions {
  couple?: {
    roomDecoration: boolean;
    cakeIncluded: boolean;
    flowerBed: boolean;
    candleLightDinner: boolean;
    amenitiesIncluded: string[];
    photoshoot: boolean;
    breakfastInBed: boolean;
  };
  bachelor?: {
    boozePackage: boolean;
    poolDance: boolean;
    privatePoolAccess: boolean;
    djOrMusic: boolean;
    barbecue: boolean;
    gamingSetup: boolean;
    maxGroupSize: number;
  };
  corporate?: {
    conferenceHall: boolean;
    projector: boolean;
    catering: boolean;
    teamBuildingActivities: string[];
    capacity: number;
    wifiSpeedMbps: number;
    dayPassAvailable: boolean;
  };
  birthday?: {
    decorationTheme: string[];
    cakeIncluded: boolean;
    partyHall: boolean;
    musicSystem: boolean;
    gamesIncluded: string[];
    maxGuests: number;
  };
  freeActivitiesIncluded: string[];
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
  meals: string;
  stay: string;
  image?: string;
}

export interface PackageTier {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  hotelType: string;
  pricePerPerson: number;
  originalPrice: number;
  features: string[];
  priceType?: string;
  personLimit?: number;
}

export interface PackageReview {
  id: string;
  author: string;
  location: string;
  date: string;
  rating: number;
  comment: string;
  tierTravelled: string;
  helpfulCount: number;
}

export interface PackageHostProperty {
  propertyId: string;
  propertyName: string;
  propertyType: string;
  location: string;
}

export interface PackageFreeActivity {
  id: string;
  name: string;
  time: string;
  image: string;
  category?: string;
}

export interface PackageDetail {
  _id: string;
  id: string;
  hostId: string;
  propertyId: string;
  packageType: "couple" | "bachelor_party" | "corporate" | "birthday";
  category: string;
  title: string;
  name: string;
  badge: string;
  rating: string;
  ratingScore: number;
  reviewsCount: number;
  duration: string;
  durationDays: number;
  durationNights: number;
  location: string;
  locationId: string;
  city: string;
  country: string;
  price: string;
  numericPrice: number;
  originalPrice: number;
  shortDesc: string;
  description: string;
  overview: string;
  fullDesc: string;
  thumbnail: string;
  images: string[];
  gallery?: string[];
  hostProperty: PackageHostProperty;
  freeActivities: PackageFreeActivity[];
  highlights: string[];
  inclusions: { title: string; desc: string; icon: string }[];
  rawInclusions?: RawPackageInclusions;
  exclusions: string[];
  itinerary: ItineraryDay[];
  tiers: PackageTier[];
  pricing: RawPackagePricing;
  durationDetails?: RawPackageDuration;
  reviews: PackageReview[];
  cancellationPolicy: string;
  status: "active" | "inactive";
  totalBookings: number;
  featured?: boolean;
  acceptingBookings?: boolean;
}

export type RawPackageSample = PackageDetail;

// Empty production fallback lists (populated live from backend Redux store)
export const PACKAGES_CATALOG_DATA: PackageData[] = [];
export const PACKAGES_DETAILS_MAP: Record<string, PackageDetail> = {};

export function getPackageDetail(id: string): PackageDetail | null {
  return PACKAGES_DETAILS_MAP[id] || null;
}
