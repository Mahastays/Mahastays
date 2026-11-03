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
  flag: string;
  title: string;
  duration: string;
  rating: string;
  price: string;
  image: string;
  description: string;
}

export interface ExperienceData {
  id: string;
  country: string;
  flag: string;
  title: string;
  duration: string;
  rating: string;
  price: string;
  numericPrice?: number;
  image: string;
  description: string;
  category?: string;
  city?: string;
  featured?: boolean;
}

// ─── (1) act1001: Sunrise Trek to Arthur Seat ───────────────────
export const act1001Detail: ExperienceDetail = {
  _id: "act1001",
  id: "act1001",
  vendorId: "u3001",
  title: "Sunrise Trek to Arthur Seat",
  name: "Sunrise Trek to Arthur Seat",
  country: "India",
  flag: "🇮🇳",
  city: "Old Mahabaleshwar",
  locationId: "loc-old-mahabaleshwar",
  duration: "2 Hours (6:00 AM – 8:00 AM)",
  category: "Trekking",
  rating: "4.8/5 ★",
  ratingScore: 4.8,
  reviewsCount: 210,
  price: "₹350 / person",
  numericPrice: 350,
  originalPrice: 500,
  difficulty: "Moderate",
  ageLimit: "8 – 60 years",
  groupSize: "Up to 20 per batch",
  language: "English, Hindi, Marathi",
  image: "https://images.unsplash.com/photo-1551632811-561732d1e306",
  gallery: [
    "https://images.unsplash.com/photo-1551632811-561732d1e306",
    "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
    "/mountain-peaks.jpg",
  ],
  description:
    "Guided 4km morning trek to famous Arthur Seat viewpoint. Watch sunrise over Savitri valley with hot tea at the summit.",
  overview:
    "Set out in the crisp dawn air on a guided 4km morning trek ascending to Arthur Seat, the Queen of Points. Witness the golden sunrise over the deep Savitri river valley and dense Mahabaleshwar forest canopy, accompanied by freshly brewed ginger tea at the summit.",
  highlights: [
    "4 km scenic guided trail through mist-covered forest trails",
    "Breathtaking panoramic sunrise view over Savitri Valley",
    "Summit hot ginger tea and traditional biscuit breakfast",
    "Safety briefing by certified mountain guide (vendor u3001)",
    "10% group discount available for bookings of 4+ guests",
  ],
  timeline: [
    { time: "05:45 AM", title: "Meeting & Safety Briefing", desc: "Gather at Old Mahabaleshwar base camp for gear check and trail briefing." },
    { time: "06:00 AM", title: "Sunrise Forest Ascent", desc: "4 km gentle morning trek through pine trees and morning mist." },
    { time: "07:15 AM", title: "Arthur Seat Viewpoint & Tea", desc: "Reach the cliff edge, witness golden sunrise over Savitri valley and enjoy freshly brewed ginger tea." },
    { time: "08:00 AM", title: "Descent & Wrap-up", desc: "Return to base with memorable photo opportunities." },
  ],
  inclusions: [
    { title: "Expert Trek Guide", desc: "Certified local wilderness guide and route navigator", icon: "user" },
    { title: "Summit Hot Tea", desc: "Freshly brewed ginger chai at viewpoint", icon: "coffee" },
    { title: "Safety Briefing", desc: "Pre-trek route briefing & first aid kit support", icon: "shield" },
  ],
  exclusions: ["Trek shoes & jackets (bring your own)", "Personal transport to base point"],
  whatToBring: ["Water bottle", "Sturdy trekking shoes", "Sun cap", "Light windbreaker/jacket"],
  meetingPoint: "Old Mahabaleshwar Base Camp, near Arthur Seat Trail Head (loc-old-mahabaleshwar)",
  coordinates: { lat: 17.9622, lng: 73.6601 },
  slots: [
    { id: "slot-sunrise", time: "6:00 AM – 8:00 AM", label: "Sunrise Batch (6 to 8 AM)", availableSpots: 20, price: 350 },
  ],
  tiers: [
    { id: "adult-trek", name: "Adult Ticket", tagline: "Per adult participant (Age 12-60)", pricePerPerson: 350, originalPrice: 500, features: ["Full 4km Guided Trek", "Summit Ginger Tea", "Safety Briefing", "Group Discount 10% on 4+"] },
    { id: "child-trek", name: "Child Ticket (Age 8-11)", tagline: "Special reduced child pass", pricePerPerson: 250, originalPrice: 350, features: ["Guided Trail", "Summit Refreshment", "First Aid Support"] },
  ],
  guide: {
    name: "Rajesh Gaikwad",
    role: "Lead Mountain Guide (Vendor u3001)",
  },
  guideName: "Rajesh Gaikwad",
  guideRole: "Lead Mountain Guide (Vendor u3001)",
  reviews: [
    { id: "rev-act-1", author: "Sameer Joshi", location: "Pune, India", date: "October 2026", rating: 5, comment: "The sunrise view from Arthur Seat was heavenly! The hot ginger tea at 7:15 AM was pure bliss.", slotBooked: "Sunrise Batch", helpfulCount: 42 },
  ],
  cancellationPolicy: "Free cancellation up to 24 hours prior to activity start.",
  status: "active",
  featured: true,
};

// ─── (2) act1002: Evening Fun Games Arena ───────────────────────
export const act1002Detail: ExperienceDetail = {
  _id: "act1002",
  id: "act1002",
  vendorId: "u3001",
  title: "Evening Fun Games Arena",
  name: "Evening Fun Games Arena",
  country: "India",
  flag: "🇮🇳",
  city: "Venna Lake, Mahabaleshwar",
  locationId: "loc-venna-lake",
  duration: "3 Hours (3:00 PM – 6:00 PM)",
  category: "Culture & Food",
  rating: "4.5/5 ★",
  ratingScore: 4.5,
  reviewsCount: 98,
  price: "₹200 / person",
  numericPrice: 200,
  originalPrice: 300,
  difficulty: "Easy",
  ageLimit: "5 – 70 years",
  groupSize: "Up to 40 per batch",
  language: "English, Hindi, Marathi",
  image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  gallery: [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
  ],
  description:
    "3 hours of group games — tug of war, treasure hunt, musical chairs, balloon games and team challenges on the resort lawn.",
  overview:
    "Unleash high-energy fun on the lush resort lawns overlooking Venna Lake. Perfect for families, corporate offsites, and travel groups, this 3-hour curated arena includes tug of war, thrilling treasure hunts, musical chairs, sack races, and epic water balloon battles directed by professional emcees.",
  highlights: [
    "5 classic group games: Tug of War, Treasure Hunt, Musical Chairs, Sack Race & Water Balloon Fight",
    "Fun energetic games coordinator and music soundtrack",
    "Lawn seating with complimentary lemon mint coolers",
    "15% group discount for groups of 6 or more",
    "Weekend batches (Saturdays & Sundays 3:00 PM to 6:00 PM)",
  ],
  timeline: [
    { time: "03:00 PM", title: "Welcome & Team Division", desc: "Assemble on the lawn, team band distribution and warm-up icebreakers." },
    { time: "03:30 PM", title: "Tug of War & Sack Race", desc: "Cheer on your squad in exciting head-to-head agility and strength games." },
    { time: "04:30 PM", title: "Venna Lawn Treasure Hunt", desc: "Clue-based scavenger race across the resort gardens." },
    { time: "05:15 PM", title: "Water Balloon Fight & Musical Chairs", desc: "Splash into fun water games and grand finale musical chairs." },
    { time: "06:00 PM", title: "Prize Distribution", desc: "Medals, fun badges, and refreshments." },
  ],
  inclusions: [
    { title: "All Game Props", desc: "Tug of war rope, balloons, sacks, clues & speaker system", icon: "shield" },
    { title: "Games Emcee", desc: "High-energy host keeping teams engaged", icon: "user" },
    { title: "Coolers & Water", desc: "Unlimited refreshing lemon mint cooler", icon: "coffee" },
  ],
  exclusions: ["Personal towels (bring change of clothes for water balloon game)"],
  whatToBring: ["Comfortable casual clothes / sneakers", "Extra pair of clothes for water balloon games"],
  meetingPoint: "Resort Lawn Arena, Venna Lake Road (loc-venna-lake)",
  coordinates: { lat: 17.9258, lng: 73.665 },
  slots: [
    { id: "slot-evening-games", time: "3:00 PM – 6:00 PM", label: "Evening Weekend Batch (Sat/Sun)", availableSpots: 40, price: 200 },
  ],
  tiers: [
    { id: "adult-games", name: "Adult Pass", tagline: "Full 3-hour game pass for adults", pricePerPerson: 200, originalPrice: 300, features: ["All 5 Group Games", "Free Lemon Cooler", "15% Group Discount on 6+"] },
    { id: "child-games", name: "Kids Pass (Age 5-11)", tagline: "Fun pack for junior adventurers", pricePerPerson: 150, originalPrice: 200, features: ["All Games Included", "Fun Mascot High-fives", "Winner Badges"] },
  ],
  guide: {
    name: "Sameer Patil",
    role: "Activities & Games Master (Vendor u3001)",
  },
  guideName: "Sameer Patil",
  guideRole: "Activities & Games Master (Vendor u3001)",
  reviews: [
    { id: "rev-act-2", author: "Pooja Mehta", location: "Mumbai, India", date: "October 2026", rating: 5, comment: "Our family had a blast! The tug of war and water balloon fight brought back childhood memories.", slotBooked: "Evening Weekend Batch", helpfulCount: 38 },
  ],
  cancellationPolicy: "Free cancellation up to 24 hours prior to activity start.",
  status: "active",
  featured: true,
};

// ─── (3) act1003: Karaoke Night Under The Stars ─────────────────
export const act1003Detail: ExperienceDetail = {
  _id: "act1003",
  id: "act1003",
  vendorId: "u3001",
  title: "Karaoke Night Under The Stars",
  name: "Karaoke Night Under The Stars",
  country: "India",
  flag: "🇮🇳",
  city: "Venna Lake, Mahabaleshwar",
  locationId: "loc-venna-lake",
  duration: "3 Hours (8:00 PM – 11:00 PM)",
  category: "Culture & Food",
  rating: "4.7/5 ★",
  ratingScore: 4.7,
  reviewsCount: 156,
  price: "₹300 / person",
  numericPrice: 300,
  originalPrice: 450,
  difficulty: "Easy",
  ageLimit: "12+ years",
  groupSize: "Up to 50 guests",
  language: "Hindi, English, Marathi",
  image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
  gallery: [
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
  ],
  description:
    "Open-air karaoke with 5000+ songs in Hindi, English and Marathi. Solo and duet modes. Best singer wins a free drink!",
  overview:
    "Sing your heart out under the starry Mahabaleshwar skies! Features dual wireless microphones, concert acoustics, live lyrics screens, and a library of 5,000+ Bollywood retro, modern chartbusters, Marathi folk, and English classics. Best singer of the night wins a complimentary drink.",
  highlights: [
    "5000+ track selection spanning Hindi, English, and Marathi favorites",
    "Solo and Duet stage modes with professional wireless microphones",
    "Open-air amphitheater setup with bonfire & atmospheric fairy lights",
    "Complimentary welcome drink included with every entry pass",
    "'Best Singer of the Night' trophy and prize drink",
  ],
  timeline: [
    { time: "08:00 PM", title: "Doors Open & Song Registration", desc: "Check in, order your drinks and browse the digital song catalog." },
    { time: "08:30 PM", title: "Acoustic Warm-Up & Open Mic", desc: "Kick off the night with favorite acoustic classics and solos." },
    { time: "09:30 PM", title: "Duet Battles & Retro Hours", desc: "Sing along with friends, couples duets, and crowd singalongs." },
    { time: "10:30 PM", title: "Grand Finale & Winner Announcement", desc: "The crowd votes for Best Singer of the Night with celebration prizes." },
  ],
  inclusions: [
    { title: "Karaoke Pass", desc: "10 minutes minimum stage time per person with dual mics", icon: "music" },
    { title: "Welcome Drink", desc: "Choice of strawberry mocktail or iced tea", icon: "wine" },
    { title: "Bonfire Seating", desc: "Cozy open-air seating beside crackling fire pit", icon: "fire" },
  ],
  exclusions: ["Alcoholic beverages beyond welcome drink (available at bar)"],
  whatToBring: ["Your singing spirit!", "Warm jacket for cool evening breeze"],
  meetingPoint: "Lakeside Amphitheater, Venna Lake Road (loc-venna-lake)",
  coordinates: { lat: 17.9258, lng: 73.665 },
  slots: [
    { id: "slot-night-show", time: "8:00 PM – 11:00 PM", label: "Night Show (Fri / Sat / Sun)", availableSpots: 50, price: 300 },
  ],
  tiers: [
    { id: "adult-karaoke", name: "Adult Singer Pass", tagline: "Entry + 1 Welcome Drink + Stage Pass", pricePerPerson: 300, originalPrice: 450, features: ["Solo & Duet Stage Time", "Welcome Drink Included", "Bonfire Seating Access"] },
    { id: "child-karaoke", name: "Youth Pass (Age 12-17)", tagline: "Entry + Mocktail + Stage Pass", pricePerPerson: 200, originalPrice: 300, features: ["Stage Access", "Free Mocktail", "Lawn Seating"] },
  ],
  guide: {
    name: "DJ Rohan & Anchor Priya",
    role: "Karaoke Host & Sound Engineer (Vendor u3001)",
  },
  guideName: "DJ Rohan & Anchor Priya",
  guideRole: "Karaoke Host & Sound Engineer (Vendor u3001)",
  reviews: [
    { id: "rev-act-3", author: "Karan Singhal", location: "Surat, India", date: "October 2026", rating: 5, comment: "The duet setup and open bonfire vibe was unforgettable. Best nightlife experience in Mahabaleshwar!", slotBooked: "Night Show", helpfulCount: 29 },
  ],
  cancellationPolicy: "Free cancellation up to 24 hours prior to show start.",
  status: "active",
  featured: true,
};

// ─── (4) act1004: Horse Riding — Venna Lake Circuit ─────────────
export const act1004Detail: ExperienceDetail = {
  _id: "act1004",
  id: "act1004",
  vendorId: "u3001",
  title: "Horse Riding — Venna Lake Circuit",
  name: "Horse Riding — Venna Lake Circuit",
  country: "India",
  flag: "🇮🇳",
  city: "Venna Lake, Mahabaleshwar",
  locationId: "loc-venna-lake",
  duration: "30 Minutes",
  category: "Safari & Desert",
  rating: "4.6/5 ★",
  ratingScore: 4.6,
  reviewsCount: 143,
  price: "₹400 / person",
  numericPrice: 400,
  originalPrice: 550,
  difficulty: "Easy",
  ageLimit: "5 – 65 years",
  groupSize: "Up to 15 per slot",
  language: "Hindi, Marathi, English",
  image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a",
  gallery: [
    "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a",
    "https://images.unsplash.com/photo-1551632811-561732d1e306",
  ],
  description:
    "30-minute guided horse ride around Venna Lake with experienced handlers. Perfect for first-timers and kids.",
  overview:
    "Experience the timeless Mahabaleshwar tradition of horse riding along the scenic banks of Venna Lake. Led by experienced handlers who walk beside you, this 30-minute circuit winds through pine groves and scenic lakeview trails, making it totally safe and delightful for kids, beginners, and couples.",
  highlights: [
    "30-minute leisurely circuit around the tranquil perimeter of Venna Lake",
    "Gentle, well-trained horses accompanied by experienced handlers",
    "Perfect for beginners, children (age 5+), and family photo shoots",
    "Safety helmet and stirrup briefing included",
    "Morning (8 AM - 12 PM) and Afternoon (2 PM - 5 PM) availability",
  ],
  timeline: [
    { time: "00:00", title: "Mounting & Safety Check", desc: "Select helmet, mount your horse with handler assistance, and test stirrup comfort." },
    { time: "00:05", title: "Pine Grove Trail", desc: "Gentle trot along the scenic pine forest path overlooking Venna Lake." },
    { time: "00:20", title: "Lakeside Photo Stop", desc: "Pause at the scenic lake vista point for memorable photos on horseback." },
    { time: "00:30", title: "Circuit Completion", desc: "Dismount at base point with handler assistance." },
  ],
  inclusions: [
    { title: "Horse & Handler", desc: "Gentle horse with dedicated handler walking alongside", icon: "user" },
    { title: "Safety Gear", desc: "Sanitized safety riding helmet", icon: "shield" },
  ],
  exclusions: ["Professional DSLR photography (handler will click photos on your phone)"],
  whatToBring: ["Comfortable pants or jeans", "Closed-toe shoes"],
  meetingPoint: "Venna Lake Horse Point, Gate 2, Venna Lake Road (loc-venna-lake)",
  coordinates: { lat: 17.9258, lng: 73.665 },
  slots: [
    { id: "slot-horse-morning", time: "8:00 AM – 12:00 PM", label: "Morning Flexible Slot", availableSpots: 15, price: 400 },
    { id: "slot-horse-afternoon", time: "2:00 PM – 5:00 PM", label: "Afternoon Flexible Slot", availableSpots: 15, price: 400 },
  ],
  tiers: [
    { id: "adult-horse", name: "Adult Ride", tagline: "30-minute lake circuit for adults", pricePerPerson: 400, originalPrice: 550, features: ["30-min Circuit", "Handler Walking Alongside", "Photo Stop", "10% Group Discount on 4+"] },
    { id: "child-horse", name: "Kids Ride (Age 5-11)", tagline: "Supervised gentle pony ride for children", pricePerPerson: 300, originalPrice: 400, features: ["Supervised Gentle Pony", "Handler Support", "Safety Helmet"] },
  ],
  guide: {
    name: "Anil Shinde",
    role: "Lead Equestrian Handler (Vendor u3001)",
  },
  guideName: "Anil Shinde",
  guideRole: "Lead Equestrian Handler (Vendor u3001)",
  reviews: [
    { id: "rev-act-4", author: "Neha Deshmukh", location: "Nashik, India", date: "September 2026", rating: 5, comment: "The handler was so patient with my 7-year-old daughter. She couldn't stop smiling!", slotBooked: "Morning Slot", helpfulCount: 31 },
  ],
  cancellationPolicy: "Free cancellation up to 24 hours prior to activity start.",
  status: "active",
  featured: true,
};

// ─── (5) act1005: Boating at Venna Lake ─────────────────────────
export const act1005Detail: ExperienceDetail = {
  _id: "act1005",
  id: "act1005",
  vendorId: "u3001",
  title: "Boating at Venna Lake",
  name: "Boating at Venna Lake",
  country: "India",
  flag: "🇮🇳",
  city: "Venna Lake, Mahabaleshwar",
  locationId: "loc-venna-lake",
  duration: "1 Hour Flexible (9:00 AM – 6:00 PM)",
  category: "Cruises",
  rating: "4.4/5 ★",
  ratingScore: 4.4,
  reviewsCount: 320,
  price: "₹250 / person",
  numericPrice: 250,
  originalPrice: 350,
  difficulty: "Easy",
  ageLimit: "3 – 70 years",
  groupSize: "Up to 60 capacity",
  language: "Hindi, English, Marathi",
  image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
  gallery: [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
    "https://images.unsplash.com/photo-1551632811-561732d1e306",
  ],
  description:
    "Row boat and paddle boat rides on the scenic Venna Lake. Life jackets provided.",
  overview:
    "Venna Lake is the crown jewel of Mahabaleshwar. Glide across its calm, shimmering waters surrounded by lush eucalyptus trees and misty hills. Choose between leisurely self-pedal boats or traditional wooden row boats with experienced boatmen navigating for you.",
  highlights: [
    "Choice of 2-seater paddle boats, 4-seater family pedal boats, or wooden row boats",
    "Calm, pristine water with picturesque hill reflections",
    "Certified life jackets for adults and children included",
    "All-day flexible entry between 9:00 AM and 6:00 PM",
    "Lakeside corn and fresh strawberry snack stalls right by the dock",
  ],
  timeline: [
    { time: "Flexible", title: "Dock Check-in & Life Jacket Fit", desc: "Present your digital pass, collect life jackets, and board your chosen boat." },
    { time: "+15 mins", title: "Open Lake Cruising", desc: "Paddle toward the secluded eastern cove with panoramic view of the dam." },
    { time: "+45 mins", title: "Return to Jetty", desc: "Smooth return to the main dock." },
  ],
  inclusions: [
    { title: "Boat Rental", desc: "Choice of row boat or paddle boat", icon: "anchor" },
    { title: "Life Jackets", desc: "Mandatory inspected safety vests for all guests", icon: "shield" },
  ],
  exclusions: ["Snacks and strawberry cups at dock stalls"],
  whatToBring: ["Sunglasses & sun protection", "Water bottle"],
  meetingPoint: "Venna Lake Main Boat Jetty, Mahabaleshwar (loc-venna-lake)",
  coordinates: { lat: 17.9258, lng: 73.665 },
  slots: [
    { id: "slot-boating-fullday", time: "9:00 AM – 6:00 PM", label: "Full Day Flexible Pass", availableSpots: 60, price: 250 },
  ],
  tiers: [
    { id: "adult-boating", name: "Adult Boat Pass", tagline: "Entry + 45-min boat hire", pricePerPerson: 250, originalPrice: 350, features: ["Row or Paddle Boat", "Life Jacket Included", "Dock Priority Queue"] },
    { id: "child-boating", name: "Child Pass (Age 3-11)", tagline: "Child safety pass", pricePerPerson: 150, originalPrice: 200, features: ["Child Life Vest", "Parent Boat Entry"] },
  ],
  guide: {
    name: "Venna Boatman Guild",
    role: "Certified Water Patrol (Vendor u3001)",
  },
  guideName: "Venna Boatman Guild",
  guideRole: "Certified Water Patrol (Vendor u3001)",
  reviews: [
    { id: "rev-act-5", author: "Deepak Sharma", location: "Thane, India", date: "September 2026", rating: 5, comment: "Pedal boating with mist floating on the water was magical. Super smooth booking.", slotBooked: "Full Day Pass", helpfulCount: 45 },
  ],
  cancellationPolicy: "Free cancellation up to 24 hours prior to activity start.",
  status: "active",
  featured: true,
};

// ─── (6) act1006: Tandem Paragliding — Panchgani ────────────────
export const act1006Detail: ExperienceDetail = {
  _id: "act1006",
  id: "act1006",
  vendorId: "u3001",
  title: "Tandem Paragliding — Panchgani",
  name: "Tandem Paragliding — Panchgani",
  country: "India",
  flag: "🇮🇳",
  city: "Panchgani",
  locationId: "loc-panchgani",
  duration: "10-Min Flight (Total 1 Hour)",
  category: "Trekking",
  rating: "4.9/5 ★",
  ratingScore: 4.9,
  reviewsCount: 175,
  price: "₹2,500 / flight",
  numericPrice: 2500,
  originalPrice: 3200,
  difficulty: "Moderate",
  ageLimit: "12 – 60 years",
  groupSize: "Up to 10 per batch",
  language: "English, Hindi, Marathi",
  image: "https://images.unsplash.com/photo-1504276048855-f58379e20788",
  gallery: [
    "https://images.unsplash.com/photo-1504276048855-f58379e20788",
    "https://images.unsplash.com/photo-1551632811-561732d1e306",
  ],
  description:
    "Soar over the Krishna valley with a certified instructor. 10-minute flight with GoPro video included.",
  overview:
    "Feel the ultimate thrill of flying like a bird over the scenic Krishna River Valley. Take off from the famous Panchgani plateau at 450 meters elevation harnessed securely to an APPI-certified tandem pilot. Catch thermals, perform gentle spirals, and capture 4K GoPro footage of your flight.",
  highlights: [
    "Tandem flight with licensed APPI / FAI certified instructor",
    "Soar 450 meters (1,475 ft) above Krishna Valley and Dhom Dam waters",
    "High-definition wide-angle 4K GoPro video and photo package included",
    "All safety gear, tandem harness, and helmet provided",
    "Morning flight (thermal wind) and sunset golden hour options",
  ],
  timeline: [
    { time: "00:00", title: "Launch Pad Arrival & Harness Fit", desc: "Check in at Panchgani Table Land launch cliff, harness adjustment and safety briefing." },
    { time: "00:15", title: "Wind Check & Launch", desc: "A few running steps into the breeze as the glider inflates and lifts you skyward." },
    { time: "00:25", title: "10-Minute Valley Flight", desc: "Soar over terraced strawberry farms and river vistas while your pilot records 4K video." },
    { time: "00:35", title: "Smooth Landing & Video Transfer", desc: "Gentle touchdown on the valley landing field and immediate GoPro video transfer to your phone." },
  ],
  inclusions: [
    { title: "Certified Tandem Pilot", desc: "5000+ hours logged instructor", icon: "user" },
    { title: "4K GoPro Footage", desc: "Action camera video and photos handed over on spot", icon: "camera" },
    { title: "Safety Insurance & Gear", desc: "Certified harness, reserve parachute, helmet", icon: "shield" },
  ],
  exclusions: ["Transport back up to launch cliff (nominal ₹100 local jeep fee)"],
  whatToBring: ["Sport shoes (closed toe mandatory)", "Sunglasses", "Phone with 2GB free storage for video transfer"],
  meetingPoint: "Panchgani Paragliding Cliff, Harrison's Folly / Table Land (loc-panchgani)",
  coordinates: { lat: 17.924, lng: 73.8021 },
  slots: [
    { id: "slot-para-morning", time: "8:00 AM – 11:00 AM", label: "Morning Flight Session", availableSpots: 10, price: 2500 },
    { id: "slot-para-evening", time: "4:00 PM – 6:00 PM", label: "Evening Golden Hour Flight", availableSpots: 10, price: 2800 },
  ],
  tiers: [
    { id: "morning-flight", name: "Morning Flight Pass", tagline: "10-minute flight + 4K GoPro Video", pricePerPerson: 2500, originalPrice: 3200, features: ["10-Min Tandem Flight", "GoPro 4K Video Included", "Certified Pilot", "5% Group Discount on 3+"] },
    { id: "sunset-flight", name: "Evening Sunset Flight", tagline: "Golden hour flight with panoramic sunset view", pricePerPerson: 2800, originalPrice: 3500, features: ["Sunset Golden Hour Flight", "GoPro Video & Stills", "Acrobatic Wingover Option"] },
  ],
  guide: {
    name: "Capt. Vicky Mane",
    role: "APPI Certified Master Tandem Pilot (Vendor u3001)",
  },
  guideName: "Capt. Vicky Mane",
  guideRole: "APPI Certified Master Tandem Pilot (Vendor u3001)",
  reviews: [
    { id: "rev-act-6", author: "Akshay Verma", location: "Bangalore, India", date: "October 2026", rating: 5, comment: "Floating 450m above the Krishna valley was mindblowing! The GoPro video turned out phenomenal.", slotBooked: "Evening Golden Hour", helpfulCount: 52 },
  ],
  cancellationPolicy: "Free cancellation or reschedule in case of unfavorable wind conditions.",
  status: "active",
  featured: true,
};

// ─── (7) act1007: Go-Karting Track — Panchgani ──────────────────
export const act1007Detail: ExperienceDetail = {
  _id: "act1007",
  id: "act1007",
  vendorId: "u3001",
  title: "Go-Karting Track — Panchgani",
  name: "Go-Karting Track — Panchgani",
  country: "India",
  flag: "🇮🇳",
  city: "Panchgani",
  locationId: "loc-panchgani",
  duration: "10 Laps (Approx 30 Mins)",
  category: "Safari & Desert",
  rating: "4.5/5 ★",
  ratingScore: 4.5,
  reviewsCount: 88,
  price: "₹600 / person",
  numericPrice: 600,
  originalPrice: 800,
  difficulty: "Moderate",
  ageLimit: "10+ years",
  groupSize: "Up to 20 racers per slot",
  language: "English, Hindi, Marathi",
  image: "https://images.unsplash.com/photo-1567789884554-0b844b597180",
  gallery: [
    "https://images.unsplash.com/photo-1567789884554-0b844b597180",
    "https://images.unsplash.com/photo-1551632811-561732d1e306",
  ],
  description:
    "800m professional go-karting track. 10 laps with full safety gear and live timing board.",
  overview:
    "Feed your need for speed on Maharashtra's premier hilltop asphalt racing circuit! This 800-meter professional track features hairpin turns, chicane curves, and high-speed straights. Race twin-engine 200cc karts with digital telemetry and live LED lap timing.",
  highlights: [
    "800-meter banked asphalt circuit with professional curbs and safety barriers",
    "10 exhilarating laps per driver with electronic lap timing",
    "200cc Honda-powered performance racing karts",
    "Full DOT-certified full-face helmet and rib protector provided",
    "20% group discount for squads of 4 or more drivers",
  ],
  timeline: [
    { time: "00:00", title: "Briefing & Suit Up", desc: "Safety orientation, track flag rules, helmet sizing and neck brace fitting." },
    { time: "00:10", title: "Kart Assignment & Warm-Up", desc: "Grid lineup, pedal adjustment, and formation lap." },
    { time: "00:15", title: "10-Lap Race Heat", desc: "Green flag drops! Race for fastest lap on the live leaderboard." },
    { time: "00:25", title: "Lap Printout & Podium", desc: "Collect your personal telemetry printout with top speed and best split times." },
  ],
  inclusions: [
    { title: "10 Track Laps", desc: "Single driver kart session on 800m track", icon: "car" },
    { title: "Full Safety Gear", desc: "Full-face helmet, neck brace & racing gloves", icon: "shield" },
    { title: "Telemetry Sheet", desc: "Printed lap time sheet with fastest sector stats", icon: "clock" },
  ],
  exclusions: ["GoPro helmet mount rental (optional ₹200)"],
  whatToBring: ["Closed-toe sport shoes mandatory", "Comfortable clothing"],
  meetingPoint: "Panchgani Circuit Raceway, Table Land Road (loc-panchgani)",
  coordinates: { lat: 17.924, lng: 73.8021 },
  slots: [
    { id: "slot-karting-allday", time: "10:00 AM – 7:00 PM", label: "All Day Open Track (10 AM - 7 PM)", availableSpots: 20, price: 600 },
  ],
  tiers: [
    { id: "adult-karting", name: "Pro 10-Lap Heat", tagline: "10 laps on 200cc race kart", pricePerPerson: 600, originalPrice: 800, features: ["10 Flying Laps", "Live Telemetry Sheet", "All Safety Gear", "20% Group Discount on 4+"] },
    { id: "child-karting", name: "Junior Kart Heat (Age 10-14)", tagline: "Governor-limited junior safety kart", pricePerPerson: 450, originalPrice: 600, features: ["10 Junior Laps", "Full Safety Briefing", "Junior Kart"] },
  ],
  guide: {
    name: "Marshal Rohit Kadam",
    role: "Race Director & Track Marshal (Vendor u3001)",
  },
  guideName: "Marshal Rohit Kadam",
  guideRole: "Race Director & Track Marshal (Vendor u3001)",
  reviews: [
    { id: "rev-act-7", author: "Aman Kapoor", location: "Pune, India", date: "October 2026", rating: 5, comment: "High speed, grippy track, and the live lap timing board made it super competitive between friends!", slotBooked: "Open Track", helpfulCount: 27 },
  ],
  cancellationPolicy: "Free cancellation up to 24 hours prior to activity start.",
  status: "active",
  featured: true,
};

// ─── Database Array of Activities ───────────────────────────────
export const SAMPLE_ACTIVITIES: ExperienceDetail[] = [
  act1001Detail,
  act1002Detail,
  act1003Detail,
  act1004Detail,
  act1005Detail,
  act1006Detail,
  act1007Detail,
];

// ─── Activities Section Data (Home Page Carousel) ───────────────
export const ACTIVITIES_SECTION_DATA: ActivityItem[] = [
  {
    id: "act1001",
    country: "Mahabaleshwar",
    flag: "🇮🇳",
    title: "Sunrise Trek to Arthur Seat",
    duration: "2 Hours (6-8 AM)",
    rating: "4.8 (210 reviews)",
    price: "₹350 / person",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306",
    description: "Guided 4km morning trek to famous Arthur Seat viewpoint. Sunrise over Savitri valley with summit tea.",
  },
  {
    id: "act1002",
    country: "Venna Lake",
    flag: "🇮🇳",
    title: "Evening Fun Games Arena",
    duration: "3 Hours (3-6 PM)",
    rating: "4.5 (98 reviews)",
    price: "₹200 / person",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    description: "3 hours of group games — tug of war, treasure hunt, musical chairs & water balloon fights on resort lawn.",
  },
  {
    id: "act1003",
    country: "Venna Lake",
    flag: "🇮🇳",
    title: "Karaoke Night Under The Stars",
    duration: "3 Hours (8-11 PM)",
    rating: "4.7 (156 reviews)",
    price: "₹300 / person",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    description: "Open-air karaoke with 5000+ Hindi, English and Marathi songs. Solo and duet modes with bonfire.",
  },
  {
    id: "act1004",
    country: "Venna Lake",
    flag: "🇮🇳",
    title: "Horse Riding — Venna Lake Circuit",
    duration: "30 Mins",
    rating: "4.6 (143 reviews)",
    price: "₹400 / person",
    image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a",
    description: "30-minute guided horse ride around Venna Lake with experienced handlers. Safe for beginners and kids.",
  },
  {
    id: "act1005",
    country: "Venna Lake",
    flag: "🇮🇳",
    title: "Boating at Venna Lake",
    duration: "1 Hour Flexible",
    rating: "4.4 (320 reviews)",
    price: "₹250 / person",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
    description: "Row boat and paddle boat rides on serene Venna Lake with safety life jackets and scenic hill views.",
  },
  {
    id: "act1006",
    country: "Panchgani",
    flag: "🇮🇳",
    title: "Tandem Paragliding — Panchgani",
    duration: "10-Min Flight",
    rating: "4.9 (175 reviews)",
    price: "₹2,500 / flight",
    image: "https://images.unsplash.com/photo-1504276048855-f58379e20788",
    description: "Soar over Krishna valley at 450m elevation with certified pilot. Includes high-res 4K GoPro video.",
  },
  {
    id: "act1007",
    country: "Panchgani",
    flag: "🇮🇳",
    title: "Go-Karting Track — Panchgani",
    duration: "10 Flying Laps",
    rating: "4.5 (88 reviews)",
    price: "₹600 / driver",
    image: "https://images.unsplash.com/photo-1567789884554-0b844b597180",
    description: "800m professional banked asphalt racing track with 200cc Honda karts, timing board & full safety gear.",
  },
];

// ─── Experiences Catalog for Cards and Listing ──────────────────
export const EXPERIENCES_CATALOG_DATA: ExperienceData[] = [
  {
    id: "act1001",
    country: "India",
    flag: "🇮🇳",
    title: "Sunrise Trek to Arthur Seat",
    duration: "2 Hours (6-8 AM)",
    rating: "4.8 (210 reviews)",
    price: "₹350 / person",
    numericPrice: 350,
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306",
    description: "Guided 4km morning trek to the famous Arthur Seat viewpoint. Watch sunrise over Savitri valley with summit ginger tea.",
    category: "Trekking",
    city: "Old Mahabaleshwar",
    featured: true,
  },
  {
    id: "act1002",
    country: "India",
    flag: "🇮🇳",
    title: "Evening Fun Games Arena",
    duration: "3 Hours (3-6 PM)",
    rating: "4.5 (98 reviews)",
    price: "₹200 / person",
    numericPrice: 200,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    description: "3 hours of group games — tug of war, treasure hunt, musical chairs & water balloon challenges on resort lawns.",
    category: "Culture & Food",
    city: "Venna Lake",
    featured: true,
  },
  {
    id: "act1003",
    country: "India",
    flag: "🇮🇳",
    title: "Karaoke Night Under The Stars",
    duration: "3 Hours (8-11 PM)",
    rating: "4.7 (156 reviews)",
    price: "₹300 / person",
    numericPrice: 300,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    description: "Open-air karaoke with 5000+ Hindi, Marathi & English songs. Solo and duet modes under the stars.",
    category: "Culture & Food",
    city: "Venna Lake",
    featured: true,
  },
  {
    id: "act1004",
    country: "India",
    flag: "🇮🇳",
    title: "Horse Riding — Venna Lake Circuit",
    duration: "30 Mins",
    rating: "4.6 (143 reviews)",
    price: "₹400 / person",
    numericPrice: 400,
    image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a",
    description: "30-minute guided horse ride around Venna Lake with experienced handlers. Perfect for first-timers and kids.",
    category: "Safari & Desert",
    city: "Venna Lake",
    featured: true,
  },
  {
    id: "act1005",
    country: "India",
    flag: "🇮🇳",
    title: "Boating at Venna Lake",
    duration: "1 Hour Flexible",
    rating: "4.4 (320 reviews)",
    price: "₹250 / person",
    numericPrice: 250,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
    description: "Row boat and paddle boat rides on scenic Venna Lake with life jackets and panoramic lake views.",
    category: "Cruises",
    city: "Venna Lake",
    featured: true,
  },
  {
    id: "act1006",
    country: "India",
    flag: "🇮🇳",
    title: "Tandem Paragliding — Panchgani",
    duration: "10-Min Flight",
    rating: "4.9 (175 reviews)",
    price: "₹2,500 / flight",
    numericPrice: 2500,
    image: "https://images.unsplash.com/photo-1504276048855-f58379e20788",
    description: "Soar over Krishna valley with certified instructor. 450m elevation, 10-minute flight with GoPro 4K video.",
    category: "Trekking",
    city: "Panchgani",
    featured: true,
  },
  {
    id: "act1007",
    country: "India",
    flag: "🇮🇳",
    title: "Go-Karting Track — Panchgani",
    duration: "10 Laps",
    rating: "4.5 (88 reviews)",
    price: "₹600 / person",
    numericPrice: 600,
    image: "https://images.unsplash.com/photo-1567789884554-0b844b597180",
    description: "800m professional banked asphalt racing track with 200cc Honda karts, telemetry printout and full safety gear.",
    category: "Safari & Desert",
    city: "Panchgani",
    featured: true,
  },
];

// ─── Details Lookup Map ─────────────────────────────────────────
export const EXPERIENCES_DETAILS_MAP: Record<string, ExperienceDetail> = {
  act1001: act1001Detail,
  "sunrise-trek-arthur-seat": act1001Detail,
  act1002: act1002Detail,
  "evening-fun-games": act1002Detail,
  act1003: act1003Detail,
  "karaoke-night-stars": act1003Detail,
  act1004: act1004Detail,
  "horse-riding-venna-lake": act1004Detail,
  act1005: act1005Detail,
  "boating-venna-lake": act1005Detail,
  act1006: act1006Detail,
  "tandem-paragliding-panchgani": act1006Detail,
  act1007: act1007Detail,
  "gokarting-panchgani": act1007Detail,
};

// ─── Lookup Helper ──────────────────────────────────────────────
export function getExperienceDetail(id: string): ExperienceDetail {
  if (EXPERIENCES_DETAILS_MAP[id]) {
    return EXPERIENCES_DETAILS_MAP[id];
  }
  const clean = (id || "").toLowerCase();
  if (clean.includes("game") || clean === "act1002") return EXPERIENCES_DETAILS_MAP["act1002"];
  if (clean.includes("karaoke") || clean === "act1003") return EXPERIENCES_DETAILS_MAP["act1003"];
  if (clean.includes("horse") || clean === "act1004") return EXPERIENCES_DETAILS_MAP["act1004"];
  if (clean.includes("boat") || clean === "act1005") return EXPERIENCES_DETAILS_MAP["act1005"];
  if (clean.includes("paraglid") || clean === "act1006") return EXPERIENCES_DETAILS_MAP["act1006"];
  if (clean.includes("kart") || clean === "act1007") return EXPERIENCES_DETAILS_MAP["act1007"];
  return EXPERIENCES_DETAILS_MAP["act1001"];
}
