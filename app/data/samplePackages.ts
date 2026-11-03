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

// ─── (1) PACKAGE pkg1001: Romantic Anniversary Getaway ──────────
export const pkg1001Detail: PackageDetail = {
  _id: "pkg1001",
  id: "pkg1001",
  hostId: "u2001",
  propertyId: "p5001",
  packageType: "couple",
  category: "Honeymoon",
  title: "Romantic Anniversary Getaway 💑",
  name: "Romantic Anniversary Getaway 💑",
  badge: "Honeymoon Special",
  rating: "4.7/10 ★",
  ratingScore: 4.7,
  reviewsCount: 41,
  duration: "3 Days / 2 Nights",
  durationDays: 3,
  durationNights: 2,
  location: "Plot 12, Venna Lake Road, Mahabaleshwar (HillView Resort)",
  locationId: "loc-venna-lake",
  city: "Mahabaleshwar",
  country: "India",
  price: "From ₹11,500 / couple",
  numericPrice: 11500,
  originalPrice: 15500,
  shortDesc:
    "Lake-view room at HillView Resort, candle-light dinner, flower decoration, private photoshoot, cake & spa. Free games & karaoke included.",
  description:
    "Celebrate your special day with lake-view room, candle-light dinner, flower decoration, and a private photoshoot. All essentials included.",
  overview:
    "Celebrate your love overlooking the shimmering waters of Venna Lake. This 3-Day Romantic Anniversary Getaway at HillView Luxury Resort (p5001) features a Deluxe Lake View Room, bespoke candlelight lakeside dinner with wine, flower bed styling, celebratory anniversary cake, couples spa rejuvenation, and a private 30-min photoshoot. Plus, enjoy complimentary access to the Evening Fun Games Arena (act1002) and Karaoke Night Under The Stars (act1003)!",
  fullDesc:
    "Celebrate your special day with lake-view room, candle-light dinner with wine, flower decoration, private photoshoot, couples spa session and late checkout at HillView Resort (p5001). Includes free fun games (act1002) & karaoke (act1003)!",
  thumbnail: "https://images.unsplash.com/photo-1519741497674-611481863552",
  images: [
    "https://images.unsplash.com/photo-1519741497674-611481863552",
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486",
    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945",
  ],
  hostProperty: {
    propertyId: "p5001",
    propertyName: "HillView Luxury Resort & Spa",
    propertyType: "Luxury Resort",
    location: "Venna Lake Road, Mahabaleshwar",
  },
  freeActivities: [
    {
      id: "act1002",
      name: "Evening Fun Games Arena",
      time: "3:00 PM – 6:00 PM",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      category: "Culture & Fun",
    },
    {
      id: "act1003",
      name: "Karaoke Night Under The Stars",
      time: "8:00 PM – 11:00 PM",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
      category: "Nightlife & Music",
    },
  ],
  highlights: [
    "2 Nights in Deluxe Lake View Room at HillView Luxury Resort & Spa (p5001)",
    "Curated lakeside candlelight dinner with wine bottle and celebratory anniversary cake",
    "Romantic fresh flower bed decor & couple aroma spa session",
    "Private 30-minute couple photoshoot with edited high-res digital album",
    "FREE activities: Evening Fun Games Arena (act1002) + Karaoke Night Under The Stars (act1003)",
    "Complimentary breakfast in bed and guaranteed 2:00 PM late checkout",
  ],
  inclusions: [
    { title: "2 Nights Deluxe Lake View", desc: "Private balcony room overlooking Venna Lake at HillView Resort", icon: "home" },
    { title: "Candlelight Dinner & Wine", desc: "4-course lakeside dining with complimentary bottle of wine", icon: "wine" },
    { title: "Flower Bed & Anniversary Cake", desc: "Fresh rose petals decoration and personalized gourmet cake", icon: "gift" },
    { title: "Private Couple Photoshoot", desc: "30-min photoshoot across resort grounds with digital delivery", icon: "camera" },
    { title: "Couples Spa & Breakfast in Bed", desc: "60-min relaxing aroma massage and morning breakfast in bed", icon: "coffee" },
    { title: "FREE Included Activities", desc: "Passes for Evening Fun Games (act1002) & Night Karaoke (act1003)", icon: "star" },
  ],
  rawInclusions: {
    couple: {
      roomDecoration: true,
      cakeIncluded: true,
      flowerBed: true,
      candleLightDinner: true,
      amenitiesIncluded: ["spaSession", "fruitPlatter", "wineBottle", "breakfastInBed", "lateCheckout"],
      photoshoot: true,
      breakfastInBed: true,
    },
    freeActivitiesIncluded: ["act1002", "act1003"],
  },
  exclusions: ["Transport to Mahabaleshwar", "Personal mini-bar items outside welcome pack"],
  itinerary: [
    {
      day: 1,
      title: "Arrival, Flower Bed Welcome & Candlelight Dinner",
      activities: [
        "Check-in at HillView Luxury Resort (p5001) with welcome strawberry drinks",
        "Walk into your decorated Deluxe room with fresh flower bed styling and anniversary cake",
        "Evening leisure by the resort infinity pool",
        "Romantic lakeside 4-course candlelight dinner with chilled wine under fairy lights",
      ],
      meals: "Dinner & Wine Included",
      stay: "HillView Luxury Resort (Lake View Room)",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552",
    },
    {
      day: 2,
      title: "Breakfast in Bed, Photoshoot, Fun Games & Starry Karaoke",
      activities: [
        "Morning breakfast served directly in bed with lake views",
        "Private 30-minute couple photoshoot across resort lawns and Venna lake overlook",
        "Afternoon 60-min rejuvenating couple aroma spa treatment",
        "3:00 PM: Complimentary Evening Fun Games Arena (act1002) on the resort lawn",
        "8:00 PM: Complimentary Karaoke Night Under The Stars (act1003) with duet mic & bonfire",
      ],
      meals: "Breakfast & Dinner Included",
      stay: "HillView Luxury Resort (Lake View Room)",
      image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486",
    },
    {
      day: 3,
      title: "Leisure Morning & Guaranteed Late Checkout",
      activities: [
        "Relaxed morning buffet breakfast at the lakeside restaurant",
        "Stroll along the Venna Lake promenade",
        "Guaranteed 2:00 PM late checkout and departure with sweet strawberry souvenir pack",
      ],
      meals: "Breakfast Included",
      stay: "Departure",
      image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3",
    },
  ],
  tiers: [
    {
      id: "couple-standard",
      name: "Romantic Couple All-Inclusive",
      badge: "Most Popular",
      tagline: "3D/2N complete celebration for 2 adults (Weekend surcharge ₹2,500)",
      hotelType: "HillView Luxury Resort (Deluxe Lake View Room)",
      pricePerPerson: 11500,
      originalPrice: 15500,
      features: [
        "Deluxe Lake View Room",
        "Candlelight Dinner & Wine",
        "Flower Bed & Cake",
        "Couples Spa & Photoshoot",
        "FREE Fun Games (act1002)",
        "FREE Karaoke Night (act1003)",
      ],
    },
  ],
  pricing: {
    basePrice: 11500,
    pricePerPerson: null,
    weekendSurcharge: 2500,
    childPrice: null,
    minGuests: 2,
    maxGuests: 2,
  },
  durationDetails: { nights: 2, days: 3, validFrom: "2026-01-01", validTill: "2026-12-31" },
  reviews: [
    {
      id: "rev-pkg-1",
      author: "Aakash & Sneha Rathi",
      location: "Pune, India",
      date: "October 2026",
      rating: 5,
      comment:
        "Celebrating our 3rd anniversary here was perfection. The candlelight dinner was dreamy, and singing our favorite Bollywood duets at the karaoke night was the highlight!",
      tierTravelled: "Romantic Couple All-Inclusive",
      helpfulCount: 34,
    },
  ],
  cancellationPolicy: "Free cancellation up to 48 hours before check-in. 50% charge after that.",
  status: "active",
  totalBookings: 87,
  featured: true,
};

// ─── (2) PACKAGE pkg1002: Ultimate Bachelor Bash ────────────────
export const pkg1002Detail: PackageDetail = {
  _id: "pkg1002",
  id: "pkg1002",
  hostId: "u2001",
  propertyId: "p5002",
  packageType: "bachelor_party",
  category: "Luxury",
  title: "Ultimate Bachelor Bash 🎉",
  name: "Ultimate Bachelor Bash 🎉",
  badge: "Party & Group Special",
  rating: "4.5/10 ★",
  ratingScore: 4.5,
  reviewsCount: 22,
  duration: "3 Days / 2 Nights",
  durationDays: 3,
  durationNights: 2,
  location: "Survey No. 45, Table Land Road, Panchgani (Sunset Ridge Villa)",
  locationId: "loc-panchgani",
  city: "Panchgani",
  country: "India",
  price: "From ₹45,000 / group",
  numericPrice: 45000,
  originalPrice: 58000,
  shortDesc:
    "Entire 4BHK private villa in Panchgani, infinity pool party with DJ, BBQ, booze package and games. Loud music allowed. Free boating included.",
  description:
    "Private villa, pool party with DJ, BBQ, booze package and games. What happens in Panchgani, stays in Panchgani.",
  overview:
    "Take over Sunset Ridge Private Villa (p5002) for the ultimate bachelor celebration in Panchgani! A standalone 4BHK luxury estate with cliffside infinity pool, outdoor bonfire pit, barbecue setup, high-power sound system, and booze package. Loud music is allowed with no disturbance! Includes complimentary Boating passes at Venna Lake (act1005)!",
  fullDesc:
    "Take over Sunset Ridge Private Villa (p5002) in Panchgani. Clifftop infinity pool, DJ sound system, outdoor BBQ & booze package, projector gaming and loud music allowed till late. Free Venna lake boating (act1005) included!",
  thumbnail: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3",
  images: [
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    "https://images.unsplash.com/photo-1527529482837-4698179dc6ce",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
  ],
  hostProperty: {
    propertyId: "p5002",
    propertyName: "Sunset Ridge Private Villa",
    propertyType: "Standalone 4BHK Villa",
    location: "Table Land Road, Panchgani",
  },
  freeActivities: [
    {
      id: "act1005",
      name: "Boating at Venna Lake",
      time: "Full Day Flexible Pass",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
      category: "Water Cruise",
    },
  ],
  highlights: [
    "Entire 2200 sq ft 4BHK Sunset Ridge Private Villa (p5002) for 6 to 12 guests",
    "Private infinity pool with sunset valley views & DJ sound system",
    "Outdoor Barbecue setup with grill master and skewers",
    "Loud music allowed with indoor gaming projector & sound bar",
    "FREE activity: Boating at Venna Lake (act1005) included",
    "Dedicated private villa caretaker throughout your stay",
  ],
  inclusions: [
    { title: "Standalone 4BHK Villa", desc: "Complete privacy for up to 12 friends with 4 en-suite bedrooms", icon: "home" },
    { title: "Pool Party & DJ Setup", desc: "Infinity pool with Bluetooth party speakers & party lights", icon: "music" },
    { title: "Barbecue & Booze Setup", desc: "Outdoor charcoal BBQ with skewers and bar counter accessories", icon: "fire" },
    { title: "Gaming & Projector", desc: "Indoor projector with console connection and card/board games", icon: "tv" },
    { title: "Dedicated Caretaker", desc: "24/7 on-site caretaker assisting with setups and housekeeping", icon: "user" },
    { title: "FREE Venna Boating", desc: "Group boating pass for Venna Lake (act1005)", icon: "anchor" },
  ],
  rawInclusions: {
    bachelor: {
      boozePackage: true,
      poolDance: true,
      privatePoolAccess: true,
      djOrMusic: true,
      barbecue: true,
      gamingSetup: true,
      maxGroupSize: 12,
    },
    freeActivitiesIncluded: ["act1005"],
  },
  exclusions: ["Liquor bottles (BYOB allowed, bar setup and mixers provided)"],
  itinerary: [
    {
      day: 1,
      title: "Villa Takeover, Sunset Infinity Pool & BBQ Night",
      activities: [
        "Check-in at Sunset Ridge Private Villa (p5002) on Table Land Road",
        "Settle into the 4BHK villa and kick off the afternoon infinity pool party",
        "Sunset cocktails overlooking Krishna valley with DJ playlist cranking",
        "Night barbecue around the outdoor bonfire pit with skewers and games",
      ],
      meals: "BBQ Dinner Included",
      stay: "Sunset Ridge Private Villa (Entire 4BHK)",
      image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3",
    },
    {
      day: 2,
      title: "Venna Lake Boating & All-Night Villa Bash",
      activities: [
        "Morning brunch prepared by villa chef",
        "Afternoon road trip to Venna Lake for complimentary Boating (act1005)",
        "Return to villa for competitive console gaming and tournament on projector",
        "Epic bachelor party night with full pool dance, loud music allowed and late night snacks",
      ],
      meals: "Brunch & Midnight Snacks Included",
      stay: "Sunset Ridge Private Villa (Entire 4BHK)",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    },
    {
      day: 3,
      title: "Recovery Brunch & Check-out",
      activities: [
        "Late morning recovery breakfast with fresh juices and hot coffee",
        "Chill out by the infinity pool taking group memories",
        "Check-out at 10:00 AM with epic stories for the wedding speeches",
      ],
      meals: "Breakfast Included",
      stay: "Departure",
      image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce",
    },
  ],
  tiers: [
    {
      id: "bachelor-villa",
      name: "Entire Villa Bachelor Package",
      badge: "Group of 6-12",
      tagline: "4BHK Villa + Pool + BBQ + Boating (Extra ₹4,200/person, Wknd ₹8,000)",
      hotelType: "Sunset Ridge Standalone 4BHK Villa",
      pricePerPerson: 45000,
      originalPrice: 58000,
      features: [
        "Entire 4BHK Private Estate",
        "Clifftop Infinity Pool",
        "DJ Sound System",
        "Outdoor BBQ Setup",
        "FREE Boating (act1005)",
        "Dedicated Villa Caretaker",
      ],
    },
  ],
  pricing: {
    basePrice: 45000,
    pricePerPerson: 4200,
    weekendSurcharge: 8000,
    minGuests: 6,
    maxGuests: 12,
  },
  durationDetails: { nights: 2, days: 3, validFrom: "2026-01-01", validTill: "2026-12-31" },
  reviews: [
    {
      id: "rev-pkg-2",
      author: "Varun Malhotra",
      location: "Mumbai, India",
      date: "September 2026",
      rating: 5,
      comment:
        "The best bachelor party imaginable! The villa was totally private, the pool with sunset view was unreal, and being able to play loud music without complaints was awesome.",
      tierTravelled: "Entire Villa Bachelor Package",
      helpfulCount: 29,
    },
  ],
  cancellationPolicy: "Non-refundable within 7 days of check-in.",
  status: "active",
  totalBookings: 34,
  featured: true,
};

// ─── (3) PACKAGE pkg1003: Corporate Offsite & Team Building ────
export const pkg1003Detail: PackageDetail = {
  _id: "pkg1003",
  id: "pkg1003",
  hostId: "u2001",
  propertyId: "p5001",
  packageType: "corporate",
  category: "Adventure",
  title: "Corporate Offsite & Team Building 🏢",
  name: "Corporate Offsite & Team Building 🏢",
  badge: "Corporate Special",
  rating: "4.4/10 ★",
  ratingScore: 4.4,
  reviewsCount: 12,
  duration: "2 Days / 1 Night",
  durationDays: 2,
  durationNights: 1,
  location: "Plot 12, Venna Lake Road, Mahabaleshwar (HillView Resort)",
  locationId: "loc-venna-lake",
  city: "Mahabaleshwar",
  country: "India",
  price: "From ₹60,000 / group",
  numericPrice: 60000,
  originalPrice: 75000,
  shortDesc:
    "Conference hall with projector, 200Mbps WiFi, full-day catering, and team activities. Free fun games & horse riding included.",
  description:
    "Conference hall with projector, high-speed WiFi, full-day catering, and team activities like trekking and fun games. Day-pass available.",
  overview:
    "Re-energize your team at HillView Luxury Resort & Spa (p5001). Featuring a 60-seat air-conditioned conference hall, high-definition projection, 200 Mbps enterprise WiFi, full-day gourmet buffet catering, and lawn breakout spaces. Includes free access to the Evening Fun Games Arena (act1002) and Horse Riding Circuit (act1004) for team building!",
  fullDesc:
    "HillView Resort (p5001) conference hall seating up to 60, high-speed WiFi, executive buffet catering and lawn team challenges. Includes free fun games (act1002) and horse riding (act1004)!",
  thumbnail: "https://images.unsplash.com/photo-1511578314322-379afb476865",
  images: [
    "https://images.unsplash.com/photo-1511578314322-379afb476865",
    "https://images.unsplash.com/photo-1431540015161-0bf868a2d407",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945",
  ],
  hostProperty: {
    propertyId: "p5001",
    propertyName: "HillView Luxury Resort & Spa",
    propertyType: "Luxury Resort & Conference Center",
    location: "Venna Lake Road, Mahabaleshwar",
  },
  freeActivities: [
    {
      id: "act1002",
      name: "Evening Fun Games Arena",
      time: "3:00 PM – 6:00 PM",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      category: "Team Building",
    },
    {
      id: "act1004",
      name: "Horse Riding — Venna Lake Circuit",
      time: "Morning / Afternoon",
      image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a",
      category: "Outdoor Activity",
    },
  ],
  highlights: [
    "60-capacity Conference Hall with AV projector, collar mics & 200 Mbps WiFi",
    "Full-day corporate catering: welcome snacks, buffet lunch, high-tea & dinner",
    "Curated outdoor team-building challenges on 5-acre resort lawns",
    "FREE activities: Evening Fun Games Arena (act1002) + Horse Riding Circuit (act1004)",
    "Flexible day-pass or overnight room accommodations available",
  ],
  inclusions: [
    { title: "Conference Hall Access", desc: "Full-day hall rental with projector, whiteboards & stationery", icon: "computer" },
    { title: "Gourmet Catering", desc: "Buffet lunch, networking evening tea/coffee and gala dinner", icon: "coffee" },
    { title: "Enterprise High-Speed WiFi", desc: "200 Mbps dedicated fiber internet throughout venue", icon: "wifi" },
    { title: "FREE Fun Games & Horse Riding", desc: "Team building games (act1002) and horse riding passes (act1004)", icon: "star" },
  ],
  rawInclusions: {
    corporate: {
      conferenceHall: true,
      projector: true,
      catering: true,
      teamBuildingActivities: ["trekking", "funGames", "karaokeNight"],
      capacity: 60,
      wifiSpeedMbps: 200,
      dayPassAvailable: true,
    },
    freeActivitiesIncluded: ["act1002", "act1004"],
  },
  exclusions: ["Alcoholic drinks at gala dinner (can be billed on consumption)"],
  itinerary: [
    {
      day: 1,
      title: "Strategy Session, Team Fun Games & Gala Dinner",
      activities: [
        "09:00 AM: Arrival & welcome tea with continental snacks",
        "10:00 AM: Keynote and quarterly strategy sessions in the conference hall",
        "01:00 PM: Multi-cuisine executive lunch buffet",
        "03:00 PM: Complimentary Evening Fun Games Arena (act1002) — Tug of War & challenges",
        "07:30 PM: Leadership awards, cocktail reception and outdoor gala dinner",
      ],
      meals: "Lunch & Dinner Included",
      stay: "HillView Luxury Resort",
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865",
    },
    {
      day: 2,
      title: "Morning Horse Riding Circuit & Wrap-up",
      activities: [
        "07:30 AM: Morning yoga or complimentary Horse Riding at Venna Lake (act1004)",
        "09:00 AM: Executive breakfast buffet",
        "10:30 AM: Action plan wrap-up and team photo session",
        "12:00 PM: Check-out and departure",
      ],
      meals: "Breakfast Included",
      stay: "Departure",
      image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407",
    },
  ],
  tiers: [
    {
      id: "corporate-tier",
      name: "Corporate Offsite Full Package",
      badge: "15 to 60 Guests",
      tagline: "Conference Hall + Catering + Activities (Base ₹60,000 / Extra ₹1,800/person)",
      hotelType: "HillView Luxury Resort & Conference Center",
      pricePerPerson: 60000,
      originalPrice: 75000,
      features: [
        "60-Cap Conference Hall",
        "Full-Day Buffet Catering",
        "200 Mbps Fiber WiFi",
        "FREE Fun Games (act1002)",
        "FREE Horse Riding (act1004)",
      ],
    },
  ],
  pricing: {
    basePrice: 60000,
    pricePerPerson: 1800,
    weekendSurcharge: 0,
    minGuests: 15,
    maxGuests: 60,
  },
  durationDetails: { nights: 1, days: 2, validFrom: "2026-01-01", validTill: "2026-12-31" },
  reviews: [
    {
      id: "rev-pkg-3",
      author: "Rajiv Menon (HR Director)",
      location: "Mumbai, India",
      date: "September 2026",
      rating: 5,
      comment:
        "Flawless corporate offsite! The conference facilities were top notch, WiFi was lightning fast, and our team loved the outdoor tug-of-war games.",
      tierTravelled: "Corporate Offsite Full Package",
      helpfulCount: 19,
    },
  ],
  cancellationPolicy: "Free cancellation up to 14 days before offsite start.",
  status: "active",
  totalBookings: 19,
  featured: true,
};

// ─── (4) PACKAGE pkg1004: Birthday Blast Celebration ───────────
export const pkg1004Detail: PackageDetail = {
  _id: "pkg1004",
  id: "pkg1004",
  hostId: "u2001",
  propertyId: "p5001",
  packageType: "birthday",
  category: "Heritage",
  title: "Birthday Blast Celebration 🎂",
  name: "Birthday Blast Celebration 🎂",
  badge: "Birthday Special",
  rating: "4.6/10 ★",
  ratingScore: 4.6,
  reviewsCount: 30,
  duration: "2 Days / 1 Night",
  durationDays: 2,
  durationNights: 1,
  location: "Plot 12, Venna Lake Road, Mahabaleshwar (HillView Resort)",
  locationId: "loc-venna-lake",
  city: "Mahabaleshwar",
  country: "India",
  price: "From ₹15,000 / party",
  numericPrice: 15000,
  originalPrice: 20000,
  shortDesc:
    "Themed balloon & LED decoration, custom cake, party hall, music system, and fun games. Free horse riding included.",
  description:
    "Themed decoration, custom cake, party hall, music system, and fun games. Bring your gang, we handle the rest.",
  overview:
    "Celebrate a memorable birthday at HillView Luxury Resort (p5001)! We take care of every single detail: custom balloon arches, glowing LED lights, a designer birthday cake, private party hall access, high-power club sound system, and organized party games (musical chairs, treasure hunt, karaoke battle). Plus, enjoy complimentary Horse Riding at Venna Lake (act1004)!",
  fullDesc:
    "Private party hall at HillView Resort (p5001) with custom themed decor, 1.5kg cake, party sound system, party games facilitation and free horse riding (act1004) for the squad!",
  thumbnail: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d",
  images: [
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d",
    "https://images.unsplash.com/photo-1513151233558-d860c5398176",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945",
  ],
  hostProperty: {
    propertyId: "p5001",
    propertyName: "HillView Luxury Resort & Spa",
    propertyType: "Luxury Resort Party Hall",
    location: "Venna Lake Road, Mahabaleshwar",
  },
  freeActivities: [
    {
      id: "act1004",
      name: "Horse Riding — Venna Lake Circuit",
      time: "Morning / Afternoon",
      image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a",
      category: "Outdoor Activity",
    },
  ],
  highlights: [
    "Decorated private party hall with balloon arches, fairy LED lights & photo booth",
    "1.5 kg designer birthday cake customized with birthday name and sparklers",
    "Club-grade music system with wireless microphones for karaoke battle",
    "Organized party games: Musical chairs, treasure hunt & dance challenges",
    "FREE activity: Horse Riding passes at Venna Lake Circuit (act1004) included",
    "Base package covers 4 to 20 guests (Extra ₹900/person, weekend surcharge ₹3,000)",
  ],
  inclusions: [
    { title: "Themed Decor & Photo Booth", desc: "Balloon garlands, LED celebration sign & photo props", icon: "gift" },
    { title: "Custom Birthday Cake", desc: "1.5 kg fresh artisan cake with sparkling candles", icon: "coffee" },
    { title: "Party Hall & Music", desc: "Exclusive party hall with party sound system & dynamic lighting", icon: "music" },
    { title: "Organized Party Games", desc: "Musical chairs, scavenger hunt & prize souvenirs", icon: "star" },
    { title: "FREE Horse Riding", desc: "Venna Lake Circuit horse riding passes (act1004)", icon: "star" },
  ],
  rawInclusions: {
    birthday: {
      decorationTheme: ["balloon", "ledLights", "photoBooth"],
      cakeIncluded: true,
      partyHall: true,
      musicSystem: true,
      gamesIncluded: ["musicalChairs", "treasureHunt", "karaokeBattle"],
      maxGuests: 20,
    },
    freeActivitiesIncluded: ["act1004"],
  },
  exclusions: ["Dinner buffet (can be bundled with customized group menu)"],
  itinerary: [
    {
      day: 1,
      title: "Check-in, Decorated Party Hall & Birthday Bash",
      activities: [
        "02:00 PM: Check-in at HillView Luxury Resort (p5001)",
        "04:00 PM: Free afternoon at resort pool and gardens",
        "06:30 PM: Grand entrance into the decorated party hall with balloon arch and photo booth",
        "07:30 PM: Cake cutting with sparkler candles and birthday celebration music",
        "08:30 PM: Party games (musical chairs, treasure hunt & dance-off) and dinner celebration",
      ],
      meals: "Cake & Welcome Snacks Included",
      stay: "HillView Luxury Resort",
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d",
    },
    {
      day: 2,
      title: "Venna Lake Horse Riding & Check-out",
      activities: [
        "08:30 AM: Morning breakfast with strawberry pancakes and fresh fruits",
        "10:00 AM: Complimentary Horse Riding at Venna Lake Circuit (act1004)",
        "12:00 PM: Check-out with celebration photo memories",
      ],
      meals: "Breakfast Included",
      stay: "Departure",
      image: "https://images.unsplash.com/photo-1513151233558-d860c5398176",
    },
  ],
  tiers: [
    {
      id: "birthday-tier",
      name: "Birthday Blast Party Package",
      badge: "Group of 4-20",
      tagline: "Hall + Decor + Cake + Music + Games (Base ₹15,000 / Extra ₹900/person)",
      hotelType: "HillView Luxury Resort Party Hall",
      pricePerPerson: 15000,
      originalPrice: 20000,
      features: [
        "Themed Balloon & LED Decor",
        "1.5 kg Designer Cake",
        "Party Hall with Club Sound",
        "Party Games Facilitation",
        "FREE Horse Riding (act1004)",
      ],
    },
  ],
  pricing: {
    basePrice: 15000,
    pricePerPerson: 900,
    weekendSurcharge: 3000,
    minGuests: 4,
    maxGuests: 20,
  },
  durationDetails: { nights: 1, days: 2, validFrom: "2026-01-01", validTill: "2026-12-31" },
  reviews: [
    {
      id: "rev-pkg-4",
      author: "Simran Kaur",
      location: "Mumbai, India",
      date: "October 2026",
      rating: 5,
      comment:
        "Celebrated my 25th birthday here with 15 friends. The decoration was Instagram gold, the sound system rocked, and the free horse riding next morning was so much fun!",
      tierTravelled: "Birthday Blast Party Package",
      helpfulCount: 30,
    },
  ],
  cancellationPolicy: "Free cancellation up to 72 hours before celebration date.",
  status: "active",
  totalBookings: 52,
  featured: true,
};

// ─── Database Array of Packages ─────────────────────────────────
export const SAMPLE_PACKAGES: PackageDetail[] = [
  pkg1001Detail,
  pkg1002Detail,
  pkg1003Detail,
  pkg1004Detail,
];

// ─── Packages Catalog for Cards and Listing ─────────────────────
export const PACKAGES_CATALOG_DATA: PackageData[] = [
  {
    id: "pkg1001",
    title: "Romantic Anniversary Getaway 💑",
    badge: "Couple Special",
    rating: "4.7/10 ★",
    price: "From ₹11,500 / couple",
    numericPrice: 11500,
    shortDesc:
      "Lake-view room at HillView Resort, candle-light dinner, flower decoration, private photoshoot, cake & spa. Free games & karaoke included.",
    fullDesc:
      "Celebrate your special day with lake-view room, candle-light dinner with wine, flower decoration, private photoshoot, couples spa session and late checkout at HillView Resort (p5001). Includes free fun games (act1002) & karaoke (act1003)!",
    images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486",
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3",
    ],
    location: "Plot 12, Venna Lake Road, Mahabaleshwar (HillView Resort)",
    city: "Mahabaleshwar",
    country: "India",
    category: "Honeymoon",
    durationDays: 3,
    featured: true,
  },
  {
    id: "pkg1002",
    title: "Ultimate Bachelor Bash 🎉",
    badge: "Party & Group Special",
    rating: "4.5/10 ★",
    price: "From ₹45,000 / group",
    numericPrice: 45000,
    shortDesc:
      "Entire 4BHK private villa in Panchgani, infinity pool party with DJ, BBQ, booze package and games. Loud music allowed. Free boating included.",
    fullDesc:
      "Take over Sunset Ridge Private Villa (p5002) in Panchgani. Clifftop infinity pool, DJ sound system, outdoor BBQ & booze package, projector gaming and loud music allowed till late. Free Venna lake boating (act1005) included!",
    images: [
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce",
    ],
    location: "Survey No. 45, Table Land Road, Panchgani (Sunset Ridge Villa)",
    city: "Panchgani",
    country: "India",
    category: "Luxury",
    durationDays: 3,
    featured: true,
  },
  {
    id: "pkg1003",
    title: "Corporate Offsite & Team Building 🏢",
    badge: "Corporate Special",
    rating: "4.4/10 ★",
    price: "From ₹60,000 / group",
    numericPrice: 60000,
    shortDesc:
      "Conference hall with projector, 200Mbps WiFi, full-day catering, and team activities. Free fun games & horse riding included.",
    fullDesc:
      "HillView Resort (p5001) conference hall seating up to 60, high-speed WiFi, executive buffet catering and lawn team challenges. Includes free fun games (act1002) and horse riding (act1004)!",
    images: [
      "https://images.unsplash.com/photo-1511578314322-379afb476865",
      "https://images.unsplash.com/photo-1431540015161-0bf868a2d407",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    ],
    location: "Plot 12, Venna Lake Road, Mahabaleshwar (HillView Resort)",
    city: "Mahabaleshwar",
    country: "India",
    category: "Adventure",
    durationDays: 2,
    featured: true,
  },
  {
    id: "pkg1004",
    title: "Birthday Blast Celebration 🎂",
    badge: "Birthday Special",
    rating: "4.6/10 ★",
    price: "From ₹15,000 / party",
    numericPrice: 15000,
    shortDesc:
      "Themed balloon & LED decoration, custom cake, party hall, music system, and fun games. Free horse riding included.",
    fullDesc:
      "Private party hall at HillView Resort (p5001) with custom themed decor, 1.5kg cake, party sound system, party games facilitation and free horse riding (act1004) for the squad!",
    images: [
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d",
      "https://images.unsplash.com/photo-1513151233558-d860c5398176",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    ],
    location: "Plot 12, Venna Lake Road, Mahabaleshwar (HillView Resort)",
    city: "Mahabaleshwar",
    country: "India",
    category: "Heritage",
    durationDays: 2,
    featured: true,
  },
];

// ─── Details Lookup Map ─────────────────────────────────────────
export const PACKAGES_DETAILS_MAP: Record<string, PackageDetail> = {
  pkg1001: pkg1001Detail,
  "romantic-anniversary-getaway": pkg1001Detail,
  "anniversary-special": pkg1001Detail,
  pkg1002: pkg1002Detail,
  "ultimate-bachelor-bash": pkg1002Detail,
  "bachelor-bash": pkg1002Detail,
  pkg1003: pkg1003Detail,
  "corporate-offsite-team-building": pkg1003Detail,
  "corporate-offsite": pkg1003Detail,
  pkg1004: pkg1004Detail,
  "birthday-blast-celebration": pkg1004Detail,
  "birthday-blast": pkg1004Detail,
};

// ─── Lookup Helper ──────────────────────────────────────────────
export function getPackageDetail(id: string): PackageDetail {
  if (PACKAGES_DETAILS_MAP[id]) {
    return PACKAGES_DETAILS_MAP[id];
  }
  const clean = (id || "").toLowerCase();
  if (clean.includes("bachelor") || clean === "pkg1002") return PACKAGES_DETAILS_MAP["pkg1002"];
  if (clean.includes("corporate") || clean === "pkg1003") return PACKAGES_DETAILS_MAP["pkg1003"];
  if (clean.includes("birthday") || clean === "pkg1004") return PACKAGES_DETAILS_MAP["pkg1004"];
  return PACKAGES_DETAILS_MAP["pkg1001"];
}
