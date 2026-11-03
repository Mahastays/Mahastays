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
  amenities: PropertyAmenity[];
  policies: RawPropertyPolicies;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
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

// ─── (1) PROPERTY p5001: HillView Luxury Resort & Spa ────────────
export const p5001Detail: StayDetail = {
  _id: "p5001",
  id: "p5001",
  hostId: "u2001",
  propertyType: "resort",
  type: "Resort",
  name: "HillView Luxury Resort & Spa",
  price: "₹5,500",
  numericPrice: 5500,
  inrPrice: 5500,
  originalPrice: 7500,
  rating: 4.6,
  reviewsCount: 128,
  description:
    "5-acre resort overlooking Venna Lake with private pool villas, bonfire nights, and in-house adventure desk. Perfect for couples, families, and corporate offsites.",
  longDescription:
    "Perched gracefully across 5 verdant acres overlooking the tranquil waters of Venna Lake, HillView Luxury Resort & Spa is Mahabaleshwar's premier luxury mountain retreat. The property features private pool villas, panoramic lake-view suites, lush landscaped lawns, nightly bonfire gatherings, and an active in-house adventure desk offering boating excursions, strawberry trail tours, and guided valley hikes. Perfect for couples seeking romance, families seeking memorable holidays, and corporate offsites desiring state-of-the-art conference facilities with signature Mahastays concierge hospitality.",
  location: "Venna Lake Road, Mahabaleshwar",
  locationId: "loc-venna-lake",
  city: "Mahabaleshwar",
  country: "India",
  tagline: "5-Acre Lakeside Resort with Private Pool Villas & In-House Adventure Desk",
  badge: "Venna Lake Premier",
  tags: ["Resort", "Venna Lake", "Pool", "Spa", "Pet Friendly", "Breakfast Included"],
  address: {
    fullAddress: "Plot 12, Venna Lake Road, Mahabaleshwar, Maharashtra 412806",
    lat: 17.9258,
    lng: 73.665,
    mapLink: "https://maps.google.com/?q=17.9258,73.6650",
  },
  images: [
    { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945", alt: "Resort pool view", isCover: true },
    { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd", alt: "Deluxe room", isCover: false },
    { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d", alt: "Resort exterior", isCover: false },
  ],
  gallery: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
    "https://images.unsplash.com/photo-1602002418082-a4443e081dd1",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427",
  ],
  videos: ["https://youtube.com/watch?v=xyz123"],
  host: {
    name: "Vikramaditya & Team",
    role: "Resort General Manager",
    experience: "Host since 2018 · 128+ Verified Reviews",
  },
  hostName: "Vikramaditya & Team",
  hostRole: "Resort General Manager",
  hostExperience: "Host since 2018 · 128+ Verified Reviews",
  highlights: [
    {
      title: "Venna Lake Panorama",
      desc: "Front-row unobstructed views of the glistening lake and pine-clad hills.",
      icon: "mountain",
    },
    {
      title: "Private Pool Villas",
      desc: "Private temperature-controlled plunge pool villas with jacuzzi & lawn.",
      icon: "pool",
    },
    {
      title: "In-House Adventure Desk",
      desc: "On-site desk for boating, strawberry tours, trekking, and campfire nights.",
      icon: "activity",
    },
    {
      title: "Lakeside Bonfire & Dining",
      desc: "Nightly bonfire gatherings with live barbecue and artisanal cuisine.",
      icon: "sparkles",
    },
  ],
  amenities: [
    { name: "Swimming Pool", icon: "pool" },
    { name: "High-Speed Wi-Fi", icon: "wifi" },
    { name: "Free Valet Parking", icon: "car" },
    { name: "Nightly Bonfire", icon: "sparkles" },
    { name: "Multi-Cuisine Restaurant", icon: "coffee" },
    { name: "Lakeside Bar & Lounge", icon: "gift" },
    { name: "Ayurvedic Spa & Wellness", icon: "spa" },
    { name: "24/7 Room Service", icon: "service" },
    { name: "Conference & Banquet Hall", icon: "user" },
    { name: "Dedicated Kids Play Area", icon: "check" },
    { name: "Air Conditioning", icon: "wind" },
    { name: "Power Backup", icon: "shield" },
  ],
  policies: {
    checkInTime: "14:00",
    checkOutTime: "11:00",
    cancellationPolicy: "Free cancellation up to 48 hrs before check-in. 50% charge after that.",
    petsAllowed: true,
    smokingAllowed: false,
    coupleFriendly: true,
    maxGuestsPerRoom: 4,
  },
  checkInTime: "2:00 PM",
  checkOutTime: "11:00 AM",
  cancellationPolicy: "Free cancellation up to 48 hrs before check-in. 50% charge after that.",
  petsAllowed: true,
  smokingAllowed: false,
  coupleFriendly: true,
  maxGuestsPerRoom: 4,
  rooms: [
    {
      id: "r501",
      roomId: "r501",
      name: "Deluxe Lake View Room",
      roomType: "Deluxe Lake View Room",
      badge: "Lake View",
      tagline: "Serene panoramic sunrises over Venna Lake with private open-air balcony.",
      size: "320 sq.ft.",
      roomSize: 320,
      bed: "King Bed",
      bedType: "King",
      maxGuests: 3,
      capacity: { adults: 2, children: 1 },
      pricePerNight: 5500,
      basePrice: 5500,
      originalPrice: 7500,
      weekendPrice: 7500,
      holidayPrice: 9000,
      count: 10,
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd",
      roomImages: ["https://images.unsplash.com/photo-1582719508461-905c673771fd"],
      amenities: ["Air Conditioning", "HD Smart TV", "Minibar", "Private Balcony", "Lake View"],
      roomAmenities: ["ac", "tv", "minibar", "balcony", "lakeView"],
    },
    {
      id: "r502",
      roomId: "r502",
      name: "Private Pool Villa 2BHK",
      roomType: "Private Pool Villa 2BHK",
      badge: "Most Popular",
      tagline: "Luxurious 2BHK villa with temperature-controlled private pool, jacuzzi & barbecue setup.",
      size: "850 sq.ft.",
      roomSize: 850,
      bed: "King + Twin Beds",
      bedType: "King + Twin",
      maxGuests: 6,
      capacity: { adults: 4, children: 2 },
      pricePerNight: 14000,
      basePrice: 14000,
      originalPrice: 18000,
      weekendPrice: 18000,
      holidayPrice: 22000,
      count: 4,
      image: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1",
      roomImages: ["https://images.unsplash.com/photo-1602002418082-a4443e081dd1"],
      amenities: ["Private Pool", "Heated Jacuzzi", "Modular Kitchen", "Barbecue Setup", "AC", "Smart TV"],
      roomAmenities: ["ac", "tv", "privatePool", "jacuzzi", "kitchen", "barbecue"],
    },
    {
      id: "r503",
      roomId: "r503",
      name: "Family Suite",
      roomType: "Family Suite",
      badge: "Valley View",
      tagline: "Spacious multi-room suite overlooking misty valleys with separate living lounge.",
      size: "480 sq.ft.",
      roomSize: 480,
      bed: "King + Sofa Bed",
      bedType: "King + Sofa Bed",
      maxGuests: 5,
      capacity: { adults: 3, children: 2 },
      pricePerNight: 8500,
      basePrice: 8500,
      originalPrice: 11000,
      weekendPrice: 11000,
      holidayPrice: 13000,
      count: 6,
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427",
      roomImages: ["https://images.unsplash.com/photo-1590490360182-c33d57733427"],
      amenities: ["Air Conditioning", "Smart TV", "Minibar", "Separate Living Room", "Valley View"],
      roomAmenities: ["ac", "tv", "minibar", "livingRoom", "valleyView"],
    },
  ],
  mapCoordinates: { lat: 17.9258, lng: 73.665 },
  attractions: [
    { name: "Venna Lake & Boating Pier", distance: "0.3 km", time: "2 mins walk" },
    { name: "Mahabaleshwar Market", distance: "2.5 km", time: "6 mins drive" },
    { name: "Lingmala Waterfalls", distance: "4.1 km", time: "10 mins drive" },
    { name: "Kate's Point Plateau", distance: "5.2 km", time: "12 mins drive" },
  ],
  ratingBreakdown: [
    { label: "Cleanliness", score: "4.9" },
    { label: "Accuracy", score: "5.0" },
    { label: "Communication", score: "4.9" },
    { label: "Location", score: "4.8" },
    { label: "Check-in", score: "5.0" },
    { label: "Value", score: "4.9" },
  ],
  reviews: [
    {
      id: "rev-p5001-1",
      author: "Rohan & Sneha Joshi",
      location: "Pune, India",
      date: "October 2026",
      rating: 5,
      comment:
        "Staying right on Venna Lake was an unbelievable experience. The private pool villa was sparkling clean, bonfire in the evening was super cozy, and strawberry dessert at the restaurant was divine.",
      roomStayed: "Private Pool Villa 2BHK",
      helpfulCount: 42,
    },
    {
      id: "rev-p5001-2",
      author: "Amitabh Banerjee",
      location: "Mumbai, India",
      date: "September 2026",
      rating: 5,
      comment:
        "Our corporate leadership offsite at HillView was seamless. The conference hall had top AV facilities, food was five-star quality, and the in-house adventure desk organized shikara boating smoothly.",
      roomStayed: "Deluxe Lake View Room",
      helpfulCount: 28,
    },
  ],
  curatedPackages: [
    {
      id: "pkg1001",
      title: "Romantic Anniversary Getaway 💑",
      badge: "Couple Special",
      category: "Honeymoon",
      duration: "3D / 2N",
      shortDesc: "Lake-view room, candlelight dinner, flower bed, cake, couple spa, plus FREE fun games & karaoke.",
      price: "₹11,500",
      numericPrice: 11500,
    },
    {
      id: "pkg1003",
      title: "Corporate Offsite & Team Building 🏢",
      badge: "Corporate Special",
      category: "Adventure",
      duration: "2D / 1N",
      shortDesc: "60-cap conference hall, 200Mbps WiFi, full catering, plus FREE fun games & horse riding.",
      price: "₹60,000",
      numericPrice: 60000,
    },
    {
      id: "pkg1004",
      title: "Birthday Blast Celebration 🎂",
      badge: "Birthday Special",
      category: "Heritage",
      duration: "2D / 1N",
      shortDesc: "Decorated party hall, custom cake, music system, party games, plus FREE Venna horse riding.",
      price: "₹15,000",
      numericPrice: 15000,
    },
  ],
  status: "active",
  bgColor: "bg-[#173e45]",
  gradientOverlay: "from-black/10 via-[#173e45]/45 to-[#173e45]",
  featured: true,
};

// ─── (2) PROPERTY p5002: Sunset Ridge Private Villa ─────────────
export const p5002Detail: StayDetail = {
  _id: "p5002",
  id: "p5002",
  hostId: "u2001",
  propertyType: "villa",
  type: "Villa",
  name: "Sunset Ridge Private Villa",
  price: "₹22,000",
  numericPrice: 22000,
  inrPrice: 22000,
  originalPrice: 28000,
  rating: 4.8,
  reviewsCount: 64,
  description:
    "Standalone 4BHK villa with infinity pool, perfect for bachelor parties and group stays. Loud music allowed, BBQ setup, and bonfire pit.",
  longDescription:
    "Commanding breathtaking clifftop vistas over the vast Panchgani valley from Table Land Road, Sunset Ridge Private Villa is an exclusive 4BHK standalone sanctuary tailored for celebrations, reunion weekends, and unforgettable group stays. Featuring a private infinity pool facing the Sahyadri sunset, an open-air barbecue station, dedicated bonfire pit, concert-grade sound system, cinema projector, and a resident caretaker catering to your every need.",
  location: "Table Land Road, Panchgani",
  locationId: "loc-panchgani",
  city: "Panchgani",
  country: "India",
  tagline: "Standalone 4BHK Infinity Pool Villa with BBQ & Concert Sound System",
  badge: "Top Rated Villa",
  tags: ["Villa", "Infinity Pool", "BBQ Setup", "Panchgani", "Pet Friendly"],
  address: {
    fullAddress: "Survey No. 45, Table Land Road, Panchgani 412805",
    lat: 17.924,
    lng: 73.8021,
    mapLink: "https://maps.google.com/?q=17.9240,73.8021",
  },
  images: [
    { url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811", alt: "Villa with pool at sunset", isCover: true },
    { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", alt: "Living room", isCover: false },
  ],
  gallery: [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
    "https://images.unsplash.com/photo-1602002418082-a4443e081dd1",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427",
  ],
  videos: [],
  host: {
    name: "Kunal & Caretaker Ramesh",
    role: "Property Owner & Manager",
    experience: "Host since 2019 · 64+ Verified Group Stays",
  },
  hostName: "Kunal & Caretaker Ramesh",
  hostRole: "Property Owner & Manager",
  hostExperience: "Host since 2019 · 64+ Verified Group Stays",
  highlights: [
    {
      title: "Cliff-Edge Infinity Pool",
      desc: "Private pool facing western sunset over the Sahyadri valley horizon.",
      icon: "pool",
    },
    {
      title: "Party & Group Friendly",
      desc: "Loud music permitted indoors/poolside with concert-grade speaker system.",
      icon: "activity",
    },
    {
      title: "BBQ Station & Bonfire Pit",
      desc: "Outdoor barbecue grills and stone fire pit for stargazing evenings.",
      icon: "sparkles",
    },
    {
      title: "Resident 24/7 Caretaker",
      desc: "Dedicated on-premise caretaker for housekeeping, luggage, and meal assistance.",
      icon: "service",
    },
  ],
  amenities: [
    { name: "Private Infinity Pool", icon: "pool" },
    { name: "High-Speed Wi-Fi", icon: "wifi" },
    { name: "Private 4-Car Parking", icon: "car" },
    { name: "Dedicated Bonfire Pit", icon: "sparkles" },
    { name: "Barbecue Grill Station", icon: "coffee" },
    { name: "Concert Speaker System", icon: "activity" },
    { name: "Indoor Games & Billiards", icon: "gift" },
    { name: "Resident Caretaker", icon: "user" },
    { name: "Cinema Projector", icon: "tv" },
    { name: "Full Modular Kitchen", icon: "coffee" },
    { name: "Air Conditioning", icon: "wind" },
    { name: "Pet Friendly Grounds", icon: "check" },
  ],
  policies: {
    checkInTime: "13:00",
    checkOutTime: "10:00",
    cancellationPolicy: "Non-refundable within 7 days of check-in.",
    petsAllowed: true,
    smokingAllowed: true,
    coupleFriendly: false,
    maxGuestsPerRoom: 12,
  },
  checkInTime: "1:00 PM",
  checkOutTime: "10:00 AM",
  cancellationPolicy: "Non-refundable within 7 days of check-in.",
  petsAllowed: true,
  smokingAllowed: true,
  coupleFriendly: false,
  maxGuestsPerRoom: 12,
  rooms: [
    {
      id: "r601",
      roomId: "r601",
      name: "Entire Villa 4BHK",
      roomType: "Entire Villa 4BHK",
      badge: "Exclusive 4BHK",
      tagline: "Sprawling 2,200 sq.ft. private villa with infinity pool, party deck, cinema projector & bar.",
      size: "2,200 sq.ft.",
      roomSize: 2200,
      bed: "3 King + 2 Twin Beds",
      bedType: "3 King + 2 Twin",
      maxGuests: 12,
      capacity: { adults: 8, children: 4 },
      pricePerNight: 22000,
      basePrice: 22000,
      originalPrice: 28000,
      weekendPrice: 28000,
      holidayPrice: 35000,
      count: 1,
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
      roomImages: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c"],
      amenities: ["Private Infinity Pool", "Full Kitchen", "Private Bar Counter", "Cinema Projector", "Concert Sound System", "AC", "Smart TV"],
      roomAmenities: ["ac", "tv", "privatePool", "kitchen", "bar", "projector", "soundSystem"],
    },
  ],
  mapCoordinates: { lat: 17.924, lng: 73.8021 },
  attractions: [
    { name: "Table Land Plateau", distance: "0.8 km", time: "2 mins drive" },
    { name: "Sydney Point Lookout", distance: "2.3 km", time: "6 mins drive" },
    { name: "Panchgani Market", distance: "1.5 km", time: "4 mins drive" },
    { name: "Parsi Point Scenic View", distance: "3.5 km", time: "8 mins drive" },
  ],
  ratingBreakdown: [
    { label: "Cleanliness", score: "4.8" },
    { label: "Accuracy", score: "4.9" },
    { label: "Communication", score: "4.9" },
    { label: "Location", score: "5.0" },
    { label: "Check-in", score: "4.9" },
    { label: "Value", score: "4.8" },
  ],
  reviews: [
    {
      id: "rev-p5002-1",
      author: "Varun Mehta & Friends",
      location: "Mumbai, India",
      date: "September 2026",
      rating: 5,
      comment:
        "Hands down the best villa for a bachelor trip! The sound system is killer, infinity pool gives sunset views of dreams, and caretaker Ramesh made delicious barbecue for us.",
      roomStayed: "Entire Villa 4BHK",
      helpfulCount: 38,
    },
    {
      id: "rev-p5002-2",
      author: "Deepika Deshmukh",
      location: "Pune, India",
      date: "August 2026",
      rating: 5,
      comment:
        "Celebrated my 30th birthday here with 10 college buddies. The villa was spacious, private, loud music was totally cool, and the projector movie night by the pool was epic.",
      roomStayed: "Entire Villa 4BHK",
      helpfulCount: 22,
    },
  ],
  curatedPackages: [
    {
      id: "pkg1002",
      title: "Ultimate Bachelor Bash 🎉 (Full Villa Takeover)",
      badge: "Party & Bachelor Special",
      category: "Luxury",
      duration: "3D / 2N",
      shortDesc: "Entire 4BHK villa, private infinity pool party with DJ sound, BBQ grill setup, booze package, loud music allowed, plus FREE Venna Lake boating passes.",
      price: "₹45,000",
      numericPrice: 45000,
    },
  ],
  status: "active",
  bgColor: "bg-[#212e42]",
  gradientOverlay: "from-black/10 via-[#212e42]/45 to-[#212e42]",
  featured: true,
};

// ─── Database Array of Properties ────────────────────────────────
export const SAMPLE_PROPERTIES: StayDetail[] = [p5001Detail, p5002Detail];

// ─── Popular Stays for Home Page Carousel / Section ─────────────
export const POPULAR_STAYS: Stay[] = [
  {
    id: "p5001",
    name: "HillView Luxury Resort & Spa",
    price: "₹5,500",
    inrPrice: 5500,
    numericPrice: 5500,
    rating: "4.6",
    description:
      "5-acre resort overlooking Venna Lake with private pool villas, bonfire nights, and in-house adventure desk.",
    tags: ["Resort", "Venna Lake", "Private Pool", "Spa"],
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    bgColor: "bg-[#173e45]",
    gradientOverlay: "from-black/10 via-[#173e45]/45 to-[#173e45]",
    location: "Venna Lake, Mahabaleshwar",
    city: "Mahabaleshwar",
    country: "India",
    type: "Resort",
    featured: true,
  },
  {
    id: "p5002",
    name: "Sunset Ridge Private Villa",
    price: "₹22,000",
    inrPrice: 22000,
    numericPrice: 22000,
    rating: "4.8",
    description:
      "Standalone 4BHK villa with infinity pool, perfect for bachelor parties and group stays with BBQ setup.",
    tags: ["Villa", "Infinity Pool", "BBQ Setup", "Panchgani"],
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
    bgColor: "bg-[#212e42]",
    gradientOverlay: "from-black/10 via-[#212e42]/45 to-[#212e42]",
    location: "Table Land, Panchgani",
    city: "Panchgani",
    country: "India",
    type: "Villa",
    featured: true,
  },
];

// ─── Explore Stays Catalog ──────────────────────────────────────
export const EXPLORE_STAYS: Stay[] = [
  {
    id: "p5001",
    name: "HillView Luxury Resort & Spa",
    price: "₹5,500",
    numericPrice: 5500,
    inrPrice: 5500,
    rating: "4.6",
    description:
      "5-acre resort overlooking Venna Lake with private pool villas, bonfire nights, and in-house adventure desk.",
    tags: ["Pool", "Pet Friendly", "Breakfast Included", "Near Me"],
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    bgColor: "bg-[#173e45]",
    gradientOverlay: "from-black/10 via-[#173e45]/45 to-[#173e45]",
    location: "Venna Lake, Mahabaleshwar",
    city: "Mahabaleshwar",
    country: "India",
    type: "Resort",
    featured: true,
  },
  {
    id: "p5002",
    name: "Sunset Ridge Private Villa",
    price: "₹22,000",
    numericPrice: 22000,
    inrPrice: 22000,
    rating: "4.8",
    description:
      "Standalone 4BHK villa with infinity pool, perfect for bachelor parties and group stays with BBQ setup.",
    tags: ["Pool", "Pet Friendly", "Mountains", "Near Me"],
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
    bgColor: "bg-[#212e42]",
    gradientOverlay: "from-black/10 via-[#212e42]/45 to-[#212e42]",
    location: "Table Land, Panchgani",
    city: "Panchgani",
    country: "India",
    type: "Villa",
    featured: true,
  },
];

// ─── Details Lookup Map ─────────────────────────────────────────
export const STAYS_DETAILS_MAP: Record<string, StayDetail> = {
  p5001: p5001Detail,
  "hillview-luxury-resort": p5001Detail,
  "hillview-resort": p5001Detail,
  p5002: p5002Detail,
  "sunset-ridge-private-villa": p5002Detail,
  "sunset-ridge-villa": p5002Detail,
};

// ─── Lookup Helper ──────────────────────────────────────────────
export function getStayDetail(id: string): StayDetail {
  if (STAYS_DETAILS_MAP[id]) {
    return STAYS_DETAILS_MAP[id];
  }
  const cleanId = (id || "").toLowerCase();
  if (cleanId === "p5002" || cleanId.includes("sunset") || cleanId.includes("villa") || cleanId.includes("panchgani")) {
    return p5002Detail;
  }
  return p5001Detail;
}
