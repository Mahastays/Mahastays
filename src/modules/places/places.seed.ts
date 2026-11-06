import type { CreatePlaceInput } from './places.types';

export const SEED_FAMOUS_PLACES: CreatePlaceInput[] = [
  {
    name: "Arthur's Seat (Queen of all Points)",
    slug: 'arthurs-seat',
    category: 'viewpoint',
    vicinity: 'Mahabaleshwar',
    shortDescription: 'Perched at 1,470 meters, Arthur’s Seat offers mesmerizing panoramic vistas of the dense Jor Valley and the meandering Savitri River.',
    description: `Arthur's Seat is widely revered as the Queen of all viewpoints in Mahabaleshwar. Standing tall at 1,470 meters (4,822 ft) above sea level, it provides a striking contrast between the rugged Konkan coastal plains on one side and the rolling Deccan plateau on the other.

Named after Sir Arthur Malet who tragically lost his wife and infant daughter in a ferry mishap on the Savitri River, the point features a unique aerodynamic phenomenon where light objects tossed into the canyon float back up due to intense air updrafts.

Arthur’s Seat is actually a cluster of six interconnected viewpoints including Window Point, Tiger Spring, Hunter Point, Malcolm Point, and Echo Point. Visiting during sunrise or late afternoon treats travelers to rolling cloud seas and golden horizons.`,
    address: 'Arthur Seat Road, Mahabaleshwar, Maharashtra 412806',
    latitude: 17.9866,
    longitude: 73.6128,
    altitude: '1,470 m (4,822 ft)',
    images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    timings: '6:00 AM – 6:00 PM (Daily)',
    entryFee: 'Free Entry (Parking ₹50)',
    bestTimeToVisit: 'October to June (Sunrise & Late Afternoon)',
    highlights: [
      'Anti-gravity updraft phenomenon where light items float back up',
      'Panoramic 360° views of Jor Valley and Savitri River',
      'Trail connecting 6 scenic viewpoints',
      'Spectacular sea of clouds during post-monsoon mornings',
    ],
    tips: [
      'Wear comfortable walking shoes as the trail from parking is approximately 800m',
      'Keep food items hidden from curious macaques along the pathways',
      'Reach before 9:00 AM for crystal clear skies before valley mist rolls in',
    ],
    isFeatured: true,
    order: 1,
    isActive: true,
  },
  {
    name: 'Venna Lake & Boating Pier',
    slug: 'venna-lake',
    category: 'lake',
    vicinity: 'Mahabaleshwar',
    shortDescription: 'The glittering centerpiece of Mahabaleshwar surrounded by towering pine trees, offering paddle boating, row boats, and fresh strawberry treats.',
    description: `Constructed in 1842 by Shri Appasaheb Maharaj, the ruler of Satara, Venna Lake is a sprawling 28-acre pristine waterbody fed by natural hillside streams. Surrounded by fragrant eucalyptus, lush pine grooves, and misty hillocks, it serves as the ultimate leisure destination for travelers of all ages.

Visitors can enjoy leisurely row boating and paddle boating across the serene waters. Along the lake promenade, bustling stalls serve Mahabaleshwar’s signature treats: fresh strawberries with whipped cream, hot sweet corn, roasted chana, and wood-fired snacks. Horse riding and pony rides are also popular along the dedicated lakeside trail.`,
    address: 'Venna Lake, Mahabaleshwar-Panchgani Road, Maharashtra 412806',
    latitude: 17.9256,
    longitude: 73.6625,
    altitude: '1,350 m (4,429 ft)',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    timings: '7:00 AM – 7:30 PM (Daily)',
    entryFee: 'Free (Row boat: ₹350/30min, Paddle boat: ₹250/30min)',
    bestTimeToVisit: 'All year round (Sunset boating is magical)',
    highlights: [
      'Scenic pedal and row boating in serene mountain waters',
      'Authentic local strawberry with fresh malai stalls',
      'Lakeside pony riding trails for kids and families',
      'Chilly evening breeze with picturesque forest reflections',
    ],
    tips: [
      'Row boats can be hired with a professional local oarsman for a relaxed experience',
      'Evenings get quite chilly near the water; carry a light cardigan or shawl',
      'Sunset slots between 5:00 PM and 6:30 PM witness maximum demand',
    ],
    isFeatured: true,
    order: 2,
    isActive: true,
  },
  {
    name: 'Pratapgad Fort (The Bastion of Shivaji Maharaj)',
    slug: 'pratapgad-fort',
    category: 'fort',
    vicinity: 'Mahabaleshwar',
    shortDescription: 'The invincible hilltop fortress commissioned by Chhatrapati Shivaji Maharaj in 1656, famed for the historic Battle of Pratapgad.',
    description: `Standing resolute at 1,080 meters (3,543 ft), Pratapgad Fort is one of Western India's most significant historical citadels. Built in 1656 under the stewardship of prime minister Moropant Trimbak Pingle by order of the Maratha ruler Chhatrapati Shivaji Maharaj, the fort commanded the high passes linking the Deccan plateau to the Konkan coast.

It was here in 1659 that the legendary encounter between Chhatrapati Shivaji Maharaj and the Bijapuri general Afzal Khan took place, forever changing the course of Indian history.

Divided into the Lower Fort and Upper Fort, Pratapgad houses the sacred Bhavani Mata Temple, the grand bronze statue of Chhatrapati Shivaji Maharaj unveiled by Pandit Jawaharlal Nehru in 1957, and dramatic cliff viewpoints overlooking the forested Radhanagari ridge.`,
    address: 'Poladpur-Mahabaleshwar Road, Satara District, Maharashtra 412806',
    latitude: 17.9239,
    longitude: 73.5786,
    altitude: '1,080 m (3,543 ft)',
    images: [
      'https://images.unsplash.com/photo-1590418606746-018840f9cd0f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1590418606746-018840f9cd0f?auto=format&fit=crop&w=1200&q=80',
    timings: '6:00 AM – 6:30 PM (Daily)',
    entryFee: 'Free (Local certified guides available for ₹300-₹500)',
    bestTimeToVisit: 'July to March (Lush green monsoons & clear winters)',
    highlights: [
      'Historic Battle of Pratapgad site and Afzal Buruj bastion',
      'Ancient Bhavani Mata Temple blessed with a sword gifted by the king',
      'Towering equestrian statue of Chhatrapati Shivaji Maharaj',
      'Unbroken views of the Sahyadri mountain range and deep ravines',
    ],
    tips: [
      'Climbing requires navigating around 450 stone steps; modest fitness is recommended',
      'Hiring a local registered Maratha history guide greatly enriches the tour',
      'Try the local village thali (pithla-bhakri & thecha) served by villagers at the base',
    ],
    isFeatured: true,
    order: 3,
    isActive: true,
  },
  {
    name: 'Lingmala Waterfall',
    slug: 'lingmala-waterfall',
    category: 'waterfall',
    vicinity: 'Mahabaleshwar',
    shortDescription: 'A dramatic 600-foot cascading torrent through dense subtropical rainforests with a tranquil natural plunge pool for bathing.',
    description: `Tucked away inside a tranquil forest sanctuary on the Mahabaleshwar-Panchgani highway, Lingmala Waterfall is formed by the roaring Venna River plunging off sheer cliffs into the Venna Valley.

The site is divided into two distinct levels:
1. The Mini Waterfall: A gentle, serene cascade accessible via a stone walking path through canopied woods. Its calm shallow waters are ideal for wading and cooling off.
2. The Main Waterfall: A sheer 600-foot roaring silver drop that crashes into deep gorges below with tremendous force, kicking up misty rainbows on sunny days.

The forest walk itself is a treat for birdwatchers and nature enthusiasts, lined with mossy teakwood trees, indigenous ferns, and butterflies.`,
    address: 'Near Forest Rest House, Mahabaleshwar-Panchgani Rd, Maharashtra 412806',
    latitude: 17.9288,
    longitude: 73.6821,
    altitude: '1,278 m (4,193 ft)',
    images: [
      'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
    timings: '8:00 AM – 5:30 PM (Daily)',
    entryFee: '₹20 per adult, ₹10 per child',
    bestTimeToVisit: 'July to November (Peak volume during monsoon)',
    highlights: [
      'Spectacular 600-ft main cascade with rainbow formations',
      'Safe upper mini-waterfall pool for dipping feet and wading',
      'Well-maintained paved forest trail under dense green canopy',
      'Abundant flora, wild orchids, and native birds',
    ],
    tips: [
      'Expect about a 1.5 km return walk on gentle stone steps from ticket counter',
      'Do not venture past the safety railings at the main viewing platform',
      'Carry rain gear or a waterproof phone pouch during monsoon months',
    ],
    isFeatured: true,
    order: 4,
    isActive: true,
  },
  {
    name: "Elephant's Head Point & Kate's Point",
    slug: 'elephants-head-point',
    category: 'viewpoint',
    vicinity: 'Mahabaleshwar',
    shortDescription: 'Famous rock overhang sculpted by nature resembling an elephant’s trunk, overlooking the emerald Dhom Dam and Kamalgad Fort.',
    description: `Elephant's Head Point, also known as Needle Hole Point, is one of Mahabaleshwar’s most photogenic geological wonders. Erosion over millions of years has carved an extraordinary rock silhouette that looks precisely like an elephant's head and trunk extended toward the horizon. A natural eye-shaped aperture beneath the rock gives it the moniker 'Needle Hole'.

Adjacent to it lies Kate's Point, named in memory of Sir John Malcolm’s daughter. Located at 1,290 meters above sea level, these sister points provide sweeping vistas of the Dhom Reservoir, the jagged peak of Kamalgad Fort, and the verdant Krishna Valley.`,
    address: "Kate's Point Road, Mahabaleshwar, Maharashtra 412806",
    latitude: 17.9312,
    longitude: 73.7024,
    altitude: '1,290 m (4,232 ft)',
    images: [
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
    timings: '6:00 AM – 6:30 PM (Daily)',
    entryFee: 'Free (Vehicle toll applicable at entrance)',
    bestTimeToVisit: 'September to May (Morning clear skies)',
    highlights: [
      'Distinctive natural elephant head rock formation with needle hole',
      'Unobstructed sightlines of the emerald blue Dhom Reservoir',
      'Echo point with clear acoustics echoing across the valley',
      'Fresh strawberry juice and corn stalls along the promenade',
    ],
    tips: [
      'Early mornings offer peaceful contemplation with fewer tourist crowds',
      'Use a zoom lens or binoculars to see Kamalgad Fort in the distance',
      'Telescope view booths are available for close-up sightings of the rock',
    ],
    isFeatured: true,
    order: 5,
    isActive: true,
  },
  {
    name: 'Mapro Garden & Strawberry Village',
    slug: 'mapro-garden',
    category: 'garden',
    vicinity: 'Panchgani',
    shortDescription: 'The strawberry paradise of Maharashtra featuring agro-tourism gardens, wood-fired pizzeria, factory tours, and gourmet fruit delicacies.',
    description: `Established in 1959 by a pharmacist named Kishore Vora, Mapro (short for Mahabaleshwar Products) has transformed from a humble strawberry processing unit into one of Maharashtra's most celebrated agro-tourism hubs.

Set amidst landscaped gardens with strawberry beds and ornamental ponds, Mapro Garden welcomes over a million travelers each year. The garden is famous for its iconic Strawberry with Fresh Whipped Cream, handmade wood-fired oven pizzas, gourmet syrups, chocolates, and fruit jams.

Visitors can tour the state-of-the-art fruit processing plant, purchase freshly picked seasonal strawberries, and enjoy the annual 4-day Mapro Strawberry Festival held every Easter weekend.`,
    address: 'Gureghar, Mahabaleshwar-Panchgani Road, Maharashtra 412806',
    latitude: 17.9211,
    longitude: 73.7431,
    altitude: '1,200 m (3,937 ft)',
    images: [
      'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
    timings: '8:00 AM – 8:30 PM (Daily)',
    entryFee: 'Free Entry',
    bestTimeToVisit: 'December to May (Peak strawberry harvesting season)',
    highlights: [
      'Signature fresh strawberries drenched in thick sweet cream',
      'Artisanal thin-crust wood-fired pizzas with garden fresh herbs',
      'Complimentary fruit crushes, syrups, and chocolate tasting counters',
      'Interactive strawberry farm and greenhouse botanical display',
    ],
    tips: [
      'Weekend afternoons can have heavy queues for food counters; plan lunch around 11:30 AM or 3:30 PM',
      'Check out the retail store for factory-discounted crushes, chocolates, and preserves',
      'Great restroom facilities and clean drinking water stations for road-trippers',
    ],
    isFeatured: true,
    order: 6,
    isActive: true,
  },
  {
    name: 'Wilson Point (Sunrise Point - Highest Peak)',
    slug: 'wilson-point',
    category: 'viewpoint',
    vicinity: 'Mahabaleshwar',
    shortDescription: 'The highest summit in Mahabaleshwar at 1,439 meters, boasting three spacious stone pavilions with sweeping 360-degree sunrise horizons.',
    description: `Rising to 1,439 meters (4,721 ft) above sea level, Wilson Point is the highest geographic altitude in the entire Mahabaleshwar plateau. Named after Sir Leslie Wilson, Governor of Bombay from 1923 to 1926, it is the only viewpoint in the region where you can witness both glorious sunrises and sun-drenched sunset horizons.

A sprawling stone-paved plateau houses three observation towers positioned strategically to capture the rising sun as it illuminates the mist-shrouded Sahyadri peaks. On crisp winter mornings, Wilson Point offers vistas stretching to Babington Point, the distant Koyna wildlife sanctuary, and the Satara plains.`,
    address: 'Wilson Point Road, Mahabaleshwar, Maharashtra 412806',
    latitude: 17.9198,
    longitude: 73.6635,
    altitude: '1,439 m (4,721 ft)',
    images: [
      'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=80',
    timings: '5:30 AM – 6:30 PM (Daily)',
    entryFee: 'Free Entry',
    bestTimeToVisit: 'October to May (Best at 5:45 AM before sunrise)',
    highlights: [
      'Highest geographical elevation in Mahabaleshwar (1,439 m)',
      'Unbroken 360-degree panorama of the Sahyadri range',
      'Three dedicated masonry observation towers for sunrise photography',
      'Peaceful morning breeze away from commercial market noise',
    ],
    tips: [
      'Arrive at least 20 minutes before sunrise time to secure a prime viewpoint tower',
      'Temperatures can dip below 10°C in winter mornings; pack a warm jacket',
      'Bring a tripod for long-exposure sunrise landscape photography',
    ],
    isFeatured: true,
    order: 7,
    isActive: true,
  },
  {
    name: 'Old Mahabaleshwar & Panchganga Temple',
    slug: 'panchganga-temple',
    category: 'temple',
    vicinity: 'Mahabaleshwar',
    shortDescription: 'Sacred 13th-century Hemadpanthi stone sanctuary where 5 holy rivers (Krishna, Venna, Koyna, Savitri, and Gayatri) originate from a stone gaumukh.',
    description: `Nestled in the serene hamlet of Old Mahabaleshwar 6 km north of the main bazaar, the Panchganga Temple is an ancient spiritual sanctum dating back to the 13th century Yadava dynasty, with subsequent patronage from Chhatrapati Shivaji Maharaj and the Raja of Chanda in the 16th century.

According to Hindu mythology, five holy rivers — Krishna, Venna, Koyna, Savitri, and Gayatri — burst forth from the spout of a carved stone Gomukha (cow’s mouth). The waters flow into a stepped holy cistern before diverging on their separate geographical paths across western and southern India.

Just steps away stands the magnificent Mahabaleshwar Temple, housing a 300-year-old self-manifested (Swayambhu) Rudraksha-shaped Shivalinga and sacred Trishul.`,
    address: 'Old Mahabaleshwar Village, Maharashtra 412806',
    latitude: 17.9582,
    longitude: 73.6599,
    altitude: '1,372 m (4,501 ft)',
    images: [
      'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590418606746-018840f9cd0f?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
    timings: '5:00 AM – 12:00 PM, 4:00 PM – 9:00 PM',
    entryFee: 'Free (Modest offerings accepted)',
    bestTimeToVisit: 'All year round (Special festivities during Mahashivratri)',
    highlights: [
      'Legendary source origin of 5 sacred Indian rivers from carved Gomukha',
      'Authentic 13th-century Hemadpanthi hand-carved stone architecture',
      'Ancient Swayambhu Shiva Lingam at sister Mahabaleshwar Temple',
      'Lush peaceful village setting rich with sacred cedar trees',
    ],
    tips: [
      'Modest dress is strictly required to enter the sanctum sanctorum',
      'Photography is restricted inside the inner water sanctum',
      'Taste pure mineral river water straight from the temple spout',
    ],
    isFeatured: true,
    order: 8,
    isActive: true,
  },
  {
    name: 'Table Land Plateau (Panchgani)',
    slug: 'table-land-panchgani',
    category: 'plateau',
    vicinity: 'Panchgani',
    shortDescription: 'Asia’s second-longest volcanic mountain plateau stretching across 95 flat acres at 1,387 meters, famous for horse safaris and sunset panoramas.',
    description: `Table Land is the crown jewel of Panchgani. Formed millions of years ago by ancient volcanic activity in the Deccan Traps, this vast flat laterite expanse spans an incredible 95 acres at an altitude of 1,387 meters, making it the second longest mountain plateau in all of Asia after the Tibetan Plateau.

From its cliff edge, visitors can look down upon the sprawling Krishna Valley, Dhom Reservoir, and the hillocks of Panchgani. The plateau has served as the backdrop for numerous Bollywood blockbuster movies.

Attractions on Table Land include Devil's Kitchen (a cave system believed to have sheltered the Pandavas during their exile), natural foot imprints known as Pandava's Footprints, horseback riding circuits, and paragliding take-off zones during windy seasons.`,
    address: 'Table Land Road, Panchgani, Maharashtra 412805',
    latitude: 17.9262,
    longitude: 73.8055,
    altitude: '1,387 m (4,550 ft)',
    images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    timings: '6:00 AM – 7:00 PM (Daily)',
    entryFee: 'Free (Vehicle parking ₹50; Horse riding ₹300-₹600)',
    bestTimeToVisit: 'August to April (Late afternoon for sunset)',
    highlights: [
      'Second longest mountain plateau in Asia (95 flat acres)',
      'Historic Devil’s Kitchen caves linked to Mahabharata lore',
      'Galloping horse rides and sunset buggy rides across the plain',
      'Unrivaled unobstructed 360-degree sunset and breeze',
    ],
    tips: [
      'Negotiate horse carriage or riding rates beforehand at the official rate board',
      'The plateau is completely open with zero tree shade; wear sunglasses & hat',
      'Watch your step near the unfenced cliff rims during windy weather',
    ],
    isFeatured: true,
    order: 9,
    isActive: true,
  },
  {
    name: 'Sydney Point (Panchgani Valley Lookout)',
    slug: 'sydney-point',
    category: 'viewpoint',
    vicinity: 'Panchgani',
    shortDescription: 'Cliff-edge promontory overlooking the azure waters of Dhom Dam, Krishna Valley, and the historic fort of Kamalgad.',
    description: `Standing guard at the entrance to Panchgani hill station, Sydney Point is perched atop a steep rocky cliff facing the Dhom Valley. Named after Sir Sidney Beckwarth, who served as Commander-in-Chief and acting Governor of Bombay in 1830, this viewpoint provides one of the cleanest, most serene perspectives in the region.

From the observation mound, travelers look out over the vast expanse of the Dhom Dam lake, the winding Krishna River, and the hills of Wai and Pandavgad. It is particularly renowned for its golden sunset hours when the tranquil reservoir waters reflect orange and purple skies.`,
    address: 'Sydney Point, Dandeghar, Panchgani, Maharashtra 412805',
    latitude: 17.9338,
    longitude: 73.8037,
    altitude: '1,250 m (4,101 ft)',
    images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    timings: '6:00 AM – 6:30 PM (Daily)',
    entryFee: 'Free Entry',
    bestTimeToVisit: 'September to May (Especially sunset)',
    highlights: [
      'Panoramic perspective of the Dhom Dam and Krishna river delta',
      'Clear view of Wai city in the valley below',
      'Gentle paved path from parking to the viewpoint pavilion',
      'Quiet, less commercialized ambiance compared to market points',
    ],
    tips: [
      'Ideal first or last stop when driving between Pune and Mahabaleshwar',
      'Sunset between 5:30 PM and 6:15 PM is the prime photography window',
    ],
    isFeatured: false,
    order: 10,
    isActive: true,
  },
  {
    name: 'Lodwick Point & Elephant Head Twin Lookout',
    slug: 'lodwick-point',
    category: 'viewpoint',
    vicinity: 'Mahabaleshwar',
    shortDescription: 'Towering cliff summit named after General Lodwick who first climbed the peak in 1824, featuring a commemorative 25-foot stone obelisk.',
    description: `Located at 1,240 meters above sea level, Lodwick Point (formerly known as Sydney Point) marks the spot where General Lodwick, accompanied only by a local guide and his dog, climbed this hazardous precipice in 1824, spearheading the British discovery and sanitarium development of Mahabaleshwar.

At the summit stands a 25-foot stone obelisk erected in 1874 by General Lodwick’s son, adorned with a marble bust of the general. Further along the narrow cliff ridge lies Elephant’s Trunk (Nosherwan’s Plateau), offering breathtaking plunges into the Koyna and Pratapgad valleys.`,
    address: 'Lodwick Point Road, Mahabaleshwar, Maharashtra 412806',
    latitude: 17.9289,
    longitude: 73.6358,
    altitude: '1,240 m (4,068 ft)',
    images: [
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    timings: '6:00 AM – 6:00 PM (Daily)',
    entryFee: 'Free Entry',
    bestTimeToVisit: 'October to May',
    highlights: [
      'Historic 1874 stone monument to General Lodwick',
      'Unmatched perspective of Pratapgad Fort floating above clouds',
      'Thrilling narrow ridge walk towards Elephant’s Trunk',
      'Deep serene pine forest approach road',
    ],
    tips: [
      'The walk from parking to the tip is about 500m through shaded woods',
      'Superb vantage point to observe evening valley fog rolling in',
    ],
    isFeatured: false,
    order: 11,
    isActive: true,
  },
  {
    name: 'Elphinstone Point',
    slug: 'elphinstone-point',
    category: 'viewpoint',
    vicinity: 'Mahabaleshwar',
    shortDescription: 'One of the highest and oldest discovered viewpoints in the Western Ghats, overlooking the deep ravines where Savitri and Koyna rivers branch.',
    description: `Discovered in 1830 by Dr. Murray and named in honor of Mountstuart Elphinstone, former Governor of Bombay, Elphinstone Point is one of the highest precipices in the Sahyadri ranges.

The point stands on a sheer rock wall rising over 2,500 feet directly above the Konkan valley. Looking down, travelers see the origin canyons of both the Savitri River to the right and Koyna River valley to the left. The ruins of Pratapgad Fort are visible perched upon its mountain ridge directly across the canyon.`,
    address: 'Elphinstone Road, Mahabaleshwar, Maharashtra 412806',
    latitude: 17.9625,
    longitude: 73.6184,
    altitude: '1,400 m (4,593 ft)',
    images: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    ],
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    timings: '6:00 AM – 6:00 PM (Daily)',
    entryFee: 'Free Entry',
    bestTimeToVisit: 'October to May',
    highlights: [
      'Sheer vertical 2,500-foot drop into the Konkan canyon',
      'Panoramic view of Pratapgad Fort and river forks',
      'One of the calmest, least crowded heritage viewpoints',
    ],
    tips: [
      'Often combined on the same day trip itinerary as Arthur’s Seat',
      'A great place to witness dramatic cloud inversions in early morning',
    ],
    isFeatured: false,
    order: 12,
    isActive: true,
  },
];

