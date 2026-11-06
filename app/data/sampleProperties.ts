import { Stay } from "../components/StayCard";

export interface RawPropertyRoom {
  roomId: string;
  id: string;
  roomType: string;
  name: string;
  badge?: string;
  tagline: string;
  size: string;
  roomSize: number;
  bed: string;
  bedType: string;
  maxGuests: number;
  capacity: { adults: number; children: number };
  pricePerNight: number;
  basePrice: number;
  originalPrice: number;
  weekendPrice: number;
  holidayPrice: number;
  count: number;
  image: string;
  roomImages: string[];
  amenities: string[];
  roomAmenities: string[];
}

export type RoomType = RawPropertyRoom;

export interface RawPropertyAddress {
  fullAddress: string;
  lat: number;
  lng: number;
  mapLink: string;
}

export type StayAddress = RawPropertyAddress;

export interface RawPropertyImage {
  url: string;
  alt: string;
  isCover: boolean;
}

export interface RawPropertyPolicies {
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  earlyCheckInNote?: string;
  suitabilityRules?: string[];
  acceptingBookings?: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  coupleFriendly: boolean;
  maxGuestsPerRoom: number;
}

export type StayPolicies = RawPropertyPolicies;

export interface AttractionDistance {
  name: string;
  distance: string;
  time: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  location: string;
  avatar?: string;
  date: string;
  rating: number;
  comment: string;
  roomStayed: string;
  helpfulCount: number;
}

export interface RatingCategoryBreakdown {
  label: string;
  score: string;
}

export interface PropertyCuratedPackage {
  id: string;
  title: string;
  badge: string;
  category: string;
  duration: string;
  shortDesc: string;
  price: string;
  numericPrice: number;
}

export interface PropertyHighlight {
  title: string;
  desc: string;
  icon: string;
}

export interface PropertyAmenity {
  name: string;
  icon: string;
}

export interface PropertyHost {
  name: string;
  role: string;
  experience: string;
  avatar?: string;
}

export interface StayDetail {
  _id: string;
  id: string;
  hostId: string;
  propertyType: "resort" | "villa" | "hotel" | "cottage" | "apartment";
  type: "Resort" | "Villa" | "Hotel" | "Cottage" | "Apartment";
  name: string;
  price: string;
  numericPrice: number;
  inrPrice: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  description: string;
  longDescription: string;
  location: string;
  locationId: string;
  city: string;
  country: string;
  tagline: string;
  badge: string;
  tags: string[];
  address: RawPropertyAddress;
  images: RawPropertyImage[];
  gallery: string[];
  videos: string[];
  host: PropertyHost;
  hostName: string;
  hostRole: string;
  hostExperience: string;
  hostAvatar?: string;
  highlights: PropertyHighlight[];
  keyAmenities?: Array<{ name: string; desc?: string; icon?: string }>;
  facilityCategories?: Array<{ category: string; items: string[]; icon?: string }>;
  amenities: PropertyAmenity[];
  policies: RawPropertyPolicies;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  earlyCheckInNote?: string;
  suitabilityRules?: string[];
  acceptingBookings?: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  coupleFriendly: boolean;
  maxGuestsPerRoom: number;
  rooms: RawPropertyRoom[];
  mapCoordinates: { lat: number; lng: number };
  attractions: AttractionDistance[];
  ratingBreakdown: RatingCategoryBreakdown[];
  reviews: ReviewItem[];
  curatedPackages: PropertyCuratedPackage[];
  status: "active" | "inactive";
  bgColor?: string;
  gradientOverlay?: string;
  featured?: boolean;
}

export type RawPropertySample = StayDetail;

// Empty production fallback lists (populated live from backend Redux store)
export const EXPLORE_STAYS: Stay[] = [];
export const POPULAR_STAYS: Stay[] = [];
export const STAYS_DETAILS_MAP: Record<string, StayDetail> = {};

export function getStayDetail(id: string): StayDetail | null {
  return STAYS_DETAILS_MAP[id] || null;
}
