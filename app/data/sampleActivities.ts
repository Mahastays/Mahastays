export interface RawActivitySlot {
  slotName?: string;
  startTime?: string;
  endTime?: string;
  maxCapacity?: number;
  id: string;
  time: string;
  label: string;
  availableSpots: number;
  price?: number;
}

export type ExperienceSlot = RawActivitySlot;

export interface RawActivitySchedule {
  mode: "fixed_slot" | "flexible";
  slots: RawActivitySlot[];
  daysAvailable: string[];
}

export interface RawActivityPricing {
  adultPrice: number;
  childPrice: number | null;
  groupDiscountPercent: number;
}

export interface RawActivityRequirements {
  minAge: number;
  maxAge: number | null;
  fitnessLevel?: "basic" | "moderate" | "advanced";
  thingsToCarry: string[];
  safetyBriefing: boolean;
}

export interface ExperienceTier {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  pricePerPerson: number;
  originalPrice: number;
  features: string[];
}

export interface ExperienceReview {
  id: string;
  author: string;
  location: string;
  date: string;
  rating: number;
  comment: string;
  slotBooked: string;
  helpfulCount: number;
}

export interface ActivityGuide {
  name: string;
  role: string;
  avatar?: string;
}

export interface ExperienceDetail {
  _id: string;
  id: string;
  vendorId?: string;
  title: string;
  name: string;
  country: string;
  flag: string;
  city: string;
  location?: string;
  locationId?: string;
  duration: string;
  category: string;
  rating: string;
  ratingScore: number;
  reviewsCount: number;
  price: string;
  numericPrice: number;
  originalPrice: number;
  difficulty: "Easy" | "Moderate" | "Challenging";
  ageLimit: string;
  groupSize: string;
  language: string;
  image: string;
  gallery: string[];
  description: string;
  overview: string;
  highlights: string[];
  timeline: { time: string; title: string; desc: string }[];
  inclusions: { title: string; desc: string; icon: string }[];
  exclusions: string[];
  whatToBring: string[];
  meetingPoint: string;
  coordinates: { lat: number; lng: number };
  schedule?: RawActivitySchedule;
  slots: RawActivitySlot[];
  tiers: ExperienceTier[];
  guide: ActivityGuide;
  guideName: string;
  guideRole: string;
  guideAvatar?: string;
  reviews: ExperienceReview[];
  cancellationPolicy: string;
  status: "active" | "inactive";
  featured?: boolean;
  acceptingBookings?: boolean;
}

export type RawActivitySample = ExperienceDetail;

export interface ActivityItem {
  id: string;
  country: string;
  location?: string;
  flag: string;
  title: string;
  duration: string;
  rating: string;
  price: string;
  image: string;
  description: string;
  category: string;
  city?: string;
}

export type ExperienceData = ActivityItem;

// Empty production fallback lists (populated live from backend Redux store)
export const EXPERIENCES_CATALOG_DATA: ActivityItem[] = [];
export const EXPERIENCES_DETAILS_MAP: Record<string, ExperienceDetail> = {};

export function getExperienceDetail(id: string): ExperienceDetail | null {
  return EXPERIENCES_DETAILS_MAP[id] || null;
}
