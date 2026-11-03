import {
  PropertyItem,
  PackageItem,
  ExperienceItem,
  StayBookingItem,
  PackageBookingItem,
  ExperienceBookingItem,
  AdCampaignItem,
  VendorItem,
  CurrentUser,
  GuestProfile,
} from '../types';

// All dummy / mock data removed — strictly live backend data is loaded and displayed.
export const INITIAL_STAFF: CurrentUser[] = [];
export const INITIAL_VENDORS: VendorItem[] = [];
export const INITIAL_PROPERTIES: PropertyItem[] = [];
export const INITIAL_PACKAGES: PackageItem[] = [];
export const INITIAL_EXPERIENCES: ExperienceItem[] = [];
export const INITIAL_BOOKINGS: (StayBookingItem | PackageBookingItem | ExperienceBookingItem)[] = [];
export const INITIAL_GUESTS: GuestProfile[] = [];
export const INITIAL_ADS: AdCampaignItem[] = [];
