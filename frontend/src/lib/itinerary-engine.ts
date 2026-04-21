/**
 * ═══════════════════════════════════════════════
 *  Smart Itinerary Engine
 *  Geo-based clustering, budget filtering,
 *  dynamic transport pricing, and day planning
 * ═══════════════════════════════════════════════
 */

import { GOVERNORATES_COORDINATES, TRANSPORT_PRICES } from './egypt-data';
import type { TravelAdvisorAttraction, TravelAdvisorRestaurant, TravelAdvisorHotel } from './travel-advisor-api';

/* ─────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────── */

export type CostLevel = 'free' | 'low' | 'medium' | 'high';

export interface PlaceItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'attraction' | 'restaurant';
  category: string;           // "museum" | "park" | "beach" | "cafe" | "restaurant" | "activity" | "historical" | "nature"
  costLevel: CostLevel;
  estimatedDuration: number;  // minutes
  rating: number;
  image: string;
  description: string;
  priceLevel: string;
  originalData: any;          // preserve raw API object for saving
}

export interface DayActivity {
  place: PlaceItem;
  startTime: string;      // "10:00 AM"
  endTime: string;        // "12:00 PM"
  duration: number;       // minutes
  distanceFromPrev: number; // km
  travelTime: number;     // minutes from previous place
  costLevel: CostLevel;
  note: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  area: string;
  color: string;
  totalCost: number;       // estimated EGP for the day
  totalDistance: number;    // km traveled within the day
  totalDuration: number;   // total hours of activities
  activities: DayActivity[];
}

export interface SmartItinerary {
  title: string;
  description: string;
  days: ItineraryDay[];
  transportation: TransportBreakdown;
  totalEstimatedCost: number;
}

export interface TransportBreakdown {
  options: TransportOptionFull[];
  selectedType: string;
  distance: number;
  selectedPrice: number;
}

export interface TransportOptionFull {
  type: string;
  label: string;
  icon: string;
  price: number;
  priceMin: number;
  priceMax: number;
  duration: string;
  durationMinutes: number;
  confidence: 'high' | 'medium' | 'low';
  breakdown: string;
  recommended?: boolean;
}

/* ─────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────── */

const DAY_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#e11d48', // rose
  '#14b8a6', // teal
];

// Egypt-specific fuel + toll data (2024–2025 avg)
const EGYPT_FUEL_DATA = {
  petrol92Price: 12.25,    // EGP/liter
  petrol95Price: 13.75,    // EGP/liter
  dieselPrice: 10.0,       // EGP/liter
  avgConsumption: 12,      // liters/100km (average car)
  busConsumption: 25,      // liters/100km
  tollPerTrip: 40,         // average toll estimate per long-distance trip
};

// Average per-km rates calibrated to Egyptian market (2024/2025)
const TRANSPORT_RATES = {
  bus: {
    perKm: 0.70,           // Egyptian bus avg rate/km
    fixedFee: 15,           // terminal fee
    minPrice: 50,
  },
  microbus: {
    perKm: 0.55,
    fixedFee: 10,
    minPrice: 30,
  },
  vip: {
    perKm: 1.80,
    fixedFee: 50,
    minPrice: 150,
  },
  privateCar: {
    fuelCostPerKm: (EGYPT_FUEL_DATA.petrol92Price * EGYPT_FUEL_DATA.avgConsumption) / 100,
    tollEstimate: EGYPT_FUEL_DATA.tollPerTrip,
  },
};

// Daily budget ranges (EGP)
const DAILY_BUDGET = {
  low:    { min: 400, max: 800,  dailyRate: 600 },
  medium: { min: 800, max: 2000, dailyRate: 1400 },
  high:   { min: 2000, max: 5000, dailyRate: 3500 },
};

// Time slots for day planning
const TIME_SLOTS = {
  morning:   { start: '09:00 AM', hours: [9, 10, 11] },
  afternoon: { start: '12:30 PM', hours: [12, 13, 14, 15] },
  evening:   { start: '05:00 PM', hours: [17, 18, 19, 20] },
};

/* ─────────────────────────────────────────────
   1. HAVERSINE DISTANCE
   ───────────────────────────────────────────── */

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // km, 2 decimal
}

/** Road distance estimate ≈ Haversine * 1.25 (for road vs straight line) */
export function roadDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.round(haversineDistance(lat1, lng1, lat2, lng2) * 1.25 * 10) / 10;
}

/* ─────────────────────────────────────────────
   2. BUILD DISTANCE MATRIX (cached)
   ───────────────────────────────────────────── */

export function buildDistanceMatrix(places: PlaceItem[]): number[][] {
  const n = places.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = haversineDistance(places[i].lat, places[i].lng, places[j].lat, places[j].lng);
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }
  return matrix;
}

/* ─────────────────────────────────────────────
   3. PLACE NORMALIZATION
   Convert API data → PlaceItem with inferred metadata
   ───────────────────────────────────────────── */

function inferCategory(item: any, type: 'attraction' | 'restaurant'): string {
  const name = (item.name || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const catKey = item.category?.key || '';
  
  if (type === 'restaurant') {
    if (name.includes('كافيه') || name.includes('cafe') || name.includes('coffee')) return 'cafe';
    return 'restaurant';
  }
  
  if (catKey.includes('museum') || name.includes('متحف') || name.includes('museum')) return 'museum';
  if (catKey.includes('beach') || name.includes('شاطئ') || name.includes('beach')) return 'beach';
  if (catKey.includes('park') || name.includes('حديقة') || name.includes('حدائق') || name.includes('park')) return 'park';
  if (catKey.includes('temple') || catKey.includes('monument') || name.includes('معبد') || name.includes('قلعة') || name.includes('أهرام')) return 'historical';
  if (name.includes('جزيرة') || name.includes('وادي') || name.includes('island')) return 'nature';
  if (name.includes('سوق') || name.includes('خان') || name.includes('market')) return 'market';
  if (desc.includes('diving') || desc.includes('snorkel') || desc.includes('غوص') || desc.includes('سنوركل')) return 'activity';
  
  return 'attraction';
}

function inferCostLevel(item: any, budget: string | null): CostLevel {
  const priceLevel = item.price_level || '';
  if (priceLevel.includes('$$$') || priceLevel.includes('فاخر')) return 'high';
  if (priceLevel.includes('$$') || priceLevel.includes('متوسط')) return 'medium';
  if (priceLevel.includes('$') || priceLevel.includes('رخيص')) return 'low';
  
  // Infer from name/category
  const name = (item.name || '').toLowerCase();
  if (name.includes('حديقة') || name.includes('شاطئ') || name.includes('سوق') || name.includes('ممشى')) return 'free';
  if (name.includes('متحف') || name.includes('معبد') || name.includes('قلعة')) return 'low';
  
  return 'medium';
}

function inferDuration(category: string): number {
  switch (category) {
    case 'museum': return 120;
    case 'historical': return 120;
    case 'beach': return 180;
    case 'nature': return 150;
    case 'park': return 90;
    case 'market': return 90;
    case 'activity': return 150;
    case 'restaurant': return 75;
    case 'cafe': return 60;
    default: return 90;
  }
}

function parseCoord(val: string | undefined, fallback: number): number {
  const parsed = parseFloat(val || '');
  return isNaN(parsed) ? fallback : parsed;
}

export function normalizePlaces(
  attractions: TravelAdvisorAttraction[],
  restaurants: TravelAdvisorRestaurant[],
  baseLat: number,
  baseLng: number,
  budget: string | null
): PlaceItem[] {
  const jitter = () => (Math.random() - 0.5) * 0.012;
  
  const attractionPlaces: PlaceItem[] = attractions.map((a, idx) => {
    const category = inferCategory(a, 'attraction');
    const lat = parseCoord(a.latitude, baseLat + jitter());
    const lng = parseCoord(a.longitude, baseLng + jitter());
    return {
      id: a.location_id || `attr_${idx}`,
      name: a.name,
      lat, lng,
      type: 'attraction',
      category,
      costLevel: inferCostLevel(a, budget),
      estimatedDuration: inferDuration(category),
      rating: parseFloat(a.rating || '4.5'),
      image: a.photo?.images?.medium?.url || a.photo?.images?.large?.url || '',
      description: a.description || '',
      priceLevel: a.price_level || '',
      originalData: a,
    };
  });

  const restaurantPlaces: PlaceItem[] = restaurants.map((r, idx) => {
    const category = inferCategory(r, 'restaurant');
    const lat = parseCoord(r.latitude, baseLat + jitter());
    const lng = parseCoord(r.longitude, baseLng + jitter());
    return {
      id: r.location_id || `rest_${idx}`,
      name: r.name,
      lat, lng,
      type: 'restaurant',
      category,
      costLevel: inferCostLevel(r, budget),
      estimatedDuration: inferDuration(category),
      rating: parseFloat(r.rating || '4.5'),
      image: r.photo?.images?.medium?.url || r.photo?.images?.large?.url || '',
      description: r.cuisine?.[0]?.name ? `مطعم ${r.cuisine[0].name}` : (r.description || ''),
      priceLevel: r.price_level || '',
      originalData: r,
    };
  });

  return [...attractionPlaces, ...restaurantPlaces];
}

/* ─────────────────────────────────────────────
   4. BUDGET FILTER
   ───────────────────────────────────────────── */

export function filterByBudget(places: PlaceItem[], budget: 'low' | 'medium' | 'high' | null): PlaceItem[] {
  if (!budget) return places;

  // Score each place and sort: lower budget → prefer cheaper
  const scored = places.map(p => {
    let score = p.rating * 10; // base: rating
    
    if (budget === 'low') {
      if (p.costLevel === 'free') score += 50;
      else if (p.costLevel === 'low') score += 30;
      else if (p.costLevel === 'medium') score += 10;
      else score -= 20; // expensive places penalized
    } else if (budget === 'high') {
      if (p.costLevel === 'high') score += 40;
      else if (p.costLevel === 'medium') score += 20;
      else score += 10;
    } else {
      // medium: all welcome, slight boost for medium
      if (p.costLevel === 'medium') score += 20;
      else score += 10;
    }
    
    return { place: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.place);
}

/* ─────────────────────────────────────────────
   5. GEO-BASED DAY CLUSTERING
   (K-Means inspired + nearest-neighbor TSP)
   ───────────────────────────────────────────── */

function kMeansCluster(places: PlaceItem[], k: number): PlaceItem[][] {
  if (places.length <= k) {
    return places.map(p => [p]);
  }

  // Initialize centroids by picking spread-out places
  const centroids: { lat: number; lng: number }[] = [];
  const used = new Set<number>();
  
  // First centroid: the place closest to overall centroid
  const avgLat = places.reduce((s, p) => s + p.lat, 0) / places.length;
  const avgLng = places.reduce((s, p) => s + p.lng, 0) / places.length;
  
  let bestFirst = 0;
  let bestFirstDist = Infinity;
  places.forEach((p, i) => {
    const d = haversineDistance(p.lat, p.lng, avgLat, avgLng);
    if (d < bestFirstDist) { bestFirstDist = d; bestFirst = i; }
  });
  centroids.push({ lat: places[bestFirst].lat, lng: places[bestFirst].lng });
  used.add(bestFirst);

  // Remaining centroids: pick farthest from existing centroids
  for (let c = 1; c < k; c++) {
    let bestIdx = 0;
    let bestMinDist = -1;
    places.forEach((p, i) => {
      if (used.has(i)) return;
      const minDist = Math.min(...centroids.map(cent => haversineDistance(p.lat, p.lng, cent.lat, cent.lng)));
      if (minDist > bestMinDist) { bestMinDist = minDist; bestIdx = i; }
    });
    centroids.push({ lat: places[bestIdx].lat, lng: places[bestIdx].lng });
    used.add(bestIdx);
  }

  // K-Means iterations (max 20)
  let clusters: PlaceItem[][] = Array.from({ length: k }, () => []);
  
  for (let iter = 0; iter < 20; iter++) {
    clusters = Array.from({ length: k }, () => []);
    
    // Assign each place to nearest centroid
    places.forEach(p => {
      let bestCluster = 0;
      let bestDist = Infinity;
      centroids.forEach((c, ci) => {
        const d = haversineDistance(p.lat, p.lng, c.lat, c.lng);
        if (d < bestDist) { bestDist = d; bestCluster = ci; }
      });
      clusters[bestCluster].push(p);
    });

    // Recalculate centroids
    let converged = true;
    centroids.forEach((c, ci) => {
      if (clusters[ci].length === 0) return;
      const newLat = clusters[ci].reduce((s, p) => s + p.lat, 0) / clusters[ci].length;
      const newLng = clusters[ci].reduce((s, p) => s + p.lng, 0) / clusters[ci].length;
      if (Math.abs(newLat - c.lat) > 0.001 || Math.abs(newLng - c.lng) > 0.001) converged = false;
      c.lat = newLat;
      c.lng = newLng;
    });

    if (converged) break;
  }

  // Remove empty clusters
  return clusters.filter(c => c.length > 0);
}

/** Nearest-neighbor sort within a cluster for optimal visiting order */
function sortByProximity(places: PlaceItem[]): PlaceItem[] {
  if (places.length <= 1) return places;
  
  const sorted: PlaceItem[] = [];
  const remaining = [...places];
  
  // Start with the place that has the earliest "natural" time (attractions first, then restaurants)
  remaining.sort((a, b) => {
    if (a.type === 'attraction' && b.type === 'restaurant') return -1;
    if (a.type === 'restaurant' && b.type === 'attraction') return 1;
    return b.rating - a.rating;
  });
  
  sorted.push(remaining.shift()!);
  
  while (remaining.length > 0) {
    const last = sorted[sorted.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((p, i) => {
      const d = haversineDistance(last.lat, last.lng, p.lat, p.lng);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    });
    sorted.push(remaining.splice(nearestIdx, 1)[0]);
  }
  
  return sorted;
}

/** Sort within a day: morning → attractions, afternoon → activities, evening → restaurants */
/** Generates a localized Arabic tip/note based on category */
function generateActivityNote(place: PlaceItem): string {
  const notes: Record<string, string[]> = {
    'museum': ['يفضل زيارته مبكراً لتجنب الزحام.', 'لا تنسى التقاط صور تذكارية في القاعة الرئيسية.', 'يمكنك الاستعانة بمرشد سياحي لشرح التفاصيل.'],
    'historical': ['المكان رائع وقت الغروب للتصوير.', 'ارتدِ ملابس مريحة للمشي مسافات طويلة.', 'احرص على قراءة اللوحات الإرشادية لمعرفة تاريخ المكان.'],
    'beach': ['فترة الصباح هي الأنسب للمياه الصافية.', 'لا تنسى واقي الشمس ومنشفة خاصة.', 'المكان مثالي للاسترخاء ومشاهدة البحر.'],
    'nature': ['مكان مثالي لمحبي الهدوء والطبيعة.', 'احرص على أخذ زجاجة مياه معك.', 'يفضل إحضار كاميرا احترافية لتوثيق الجمال.'],
    'park': ['مكان ممتاز للتنزه في الهواء الطلق.', 'مناسب جداً للعائلات والأطفال.', 'يفضل زيارته في وقت متأخر من بعد الظهر.'],
    'restaurant': ['يُنصح بتجربة الطبق الرئيسي المميز لديهم.', 'يفضل الحجز مسبقاً في أوقات الذروة.', 'إطلالة المطعم رائعة وتضيف جواً مميزاً للوجبة.'],
    'cafe': ['مكان هادئ ومناسب للاستراحة بين الأنشطة.', 'قهوتهم مميزة جداً وتستحق التجربة.', 'الأجواء هنا تبعث على الراحة والهدوء.'],
    'market': ['فرصة جيدة لشراء الهدايا التذكارية.', 'لا تتردد في الفصال للحصول على أفضل سعر.', 'تجول في الشوارع الجانبية لاكتشاف كنوز خفية.'],
  };
  const categoryNotes = notes[place.category] || ['مكان يستحق الزيارة والاستمتاع بتفاصيله.'];
  return categoryNotes[Math.floor(Math.random() * categoryNotes.length)];
}

function sortByTimeSlot(places: PlaceItem[]): PlaceItem[] {
  const attractions = places.filter(p => p.type === 'attraction');
  const restaurants = places.filter(p => p.type === 'restaurant');
  
  // Sort by proximity to start smoothly
  const sortedAttractions = sortByProximity(attractions);
  const sortedRestaurants = sortByProximity(restaurants);
  
  const result: PlaceItem[] = [];
  let aIdx = 0, rIdx = 0;
  
  // Morning Activity 1
  if (aIdx < sortedAttractions.length) result.push(sortedAttractions[aIdx++]);
  
  // Morning Activity 2
  if (aIdx < sortedAttractions.length) result.push(sortedAttractions[aIdx++]);
  
  // Lunch (Restaurant 1)
  if (rIdx < sortedRestaurants.length) result.push(sortedRestaurants[rIdx++]);
  
  // Afternoon Activity 3
  if (aIdx < sortedAttractions.length) result.push(sortedAttractions[aIdx++]);
  
  // Dinner (Restaurant 2)
  if (rIdx < sortedRestaurants.length) result.push(sortedRestaurants[rIdx++]);

  // Append any leftovers
  while (aIdx < sortedAttractions.length) result.push(sortedAttractions[aIdx++]);
  while (rIdx < sortedRestaurants.length) result.push(sortedRestaurants[rIdx++]);
  
  return result;
}

/* ─────────────────────────────────────────────
   6. DYNAMIC TRANSPORT PRICING
   ───────────────────────────────────────────── */

export function calculateTransportOptions(origin: string, destination: string): TransportOptionFull[] {
  const c1 = GOVERNORATES_COORDINATES[origin];
  const c2 = GOVERNORATES_COORDINATES[destination];
  if (!c1 || !c2) return [];

  const distance = roadDistance(c1.lat, c1.lng, c2.lat, c2.lng);
  if (distance <= 0) return [];

  const avgSpeed = { bus: 55, microbus: 65, vip: 85 };

  const fmtDuration = (km: number, speed: number) => {
    const totalHours = km / speed;
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return { text: h > 0 ? `${h} ساعة ${m > 0 ? `و ${m} دقيقة` : ''}` : `${m} دقيقة`, minutes: Math.round(totalHours * 60) };
  };

  // Bus pricing: per-km rate * distance + fixed fee (round-trip consideration)
  const busBase = Math.round(distance * TRANSPORT_RATES.bus.perKm + TRANSPORT_RATES.bus.fixedFee);
  const busPrice = Math.max(busBase, TRANSPORT_RATES.bus.minPrice);
  const busDur = fmtDuration(distance, avgSpeed.bus);

  // Microbus pricing
  const microBase = Math.round(distance * TRANSPORT_RATES.microbus.perKm + TRANSPORT_RATES.microbus.fixedFee);
  const microPrice = Math.max(microBase, TRANSPORT_RATES.microbus.minPrice);
  const microDur = fmtDuration(distance, avgSpeed.microbus);

  // VIP pricing
  const vipBase = Math.round(distance * TRANSPORT_RATES.vip.perKm + TRANSPORT_RATES.vip.fixedFee);
  const vipPrice = Math.max(vipBase, TRANSPORT_RATES.vip.minPrice);
  const vipDur = fmtDuration(distance, avgSpeed.vip);

  // Private car (fuel calculation)
  const fuelCost = Math.round(distance * TRANSPORT_RATES.privateCar.fuelCostPerKm);
  const carTotal = fuelCost + TRANSPORT_RATES.privateCar.tollEstimate;
  const carDur = fmtDuration(distance, avgSpeed.vip);

  const varianceRate = 0.15; // ±15% price range

  const options: TransportOptionFull[] = [
    {
      type: 'microbus', label: 'ميكروباص', icon: '🚐',
      price: microPrice,
      priceMin: Math.round(microPrice * (1 - varianceRate)),
      priceMax: Math.round(microPrice * (1 + varianceRate)),
      duration: microDur.text,
      durationMinutes: microDur.minutes,
      confidence: distance < 200 ? 'high' : 'medium',
      breakdown: `${distance} كم × ${TRANSPORT_RATES.microbus.perKm} ج.م/كم + ${TRANSPORT_RATES.microbus.fixedFee} رسوم`,
      recommended: true,
    },
    {
      type: 'bus', label: 'أتوبيس', icon: '🚌',
      price: busPrice,
      priceMin: Math.round(busPrice * (1 - varianceRate)),
      priceMax: Math.round(busPrice * (1 + varianceRate)),
      duration: busDur.text,
      durationMinutes: busDur.minutes,
      confidence: 'high',
      breakdown: `${distance} كم × ${TRANSPORT_RATES.bus.perKm} ج.م/كم + ${TRANSPORT_RATES.bus.fixedFee} رسوم محطة`,
    },
    {
      type: 'vip', label: 'VIP / سوبر جيت', icon: '🚗',
      price: vipPrice,
      priceMin: Math.round(vipPrice * (1 - varianceRate)),
      priceMax: Math.round(vipPrice * (1 + varianceRate)),
      duration: vipDur.text,
      durationMinutes: vipDur.minutes,
      confidence: 'high',
      breakdown: `${distance} كم × ${TRANSPORT_RATES.vip.perKm} ج.م/كم + ${TRANSPORT_RATES.vip.fixedFee} رسوم`,
    },
    {
      type: 'car', label: 'سيارة خاصة', icon: '🚙',
      price: carTotal,
      priceMin: Math.round(carTotal * (1 - varianceRate)),
      priceMax: Math.round(carTotal * (1 + 0.25)),
      duration: carDur.text,
      durationMinutes: carDur.minutes,
      confidence: 'medium',
      breakdown: `وقود: ${fuelCost} ج.م (${distance} كم × ${TRANSPORT_RATES.privateCar.fuelCostPerKm.toFixed(1)} ج.م/كم) + رسوم طرق: ${TRANSPORT_RATES.privateCar.tollEstimate} ج.م`,
    },
  ];

  return options;
}

export function getTransportDistance(origin: string, destination: string): number {
  const c1 = GOVERNORATES_COORDINATES[origin];
  const c2 = GOVERNORATES_COORDINATES[destination];
  if (!c1 || !c2) return 0;
  return roadDistance(c1.lat, c1.lng, c2.lat, c2.lng);
}

/* ─────────────────────────────────────────────
   7. TIME FORMATTING HELPERS
   ───────────────────────────────────────────── */

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const m = minute.toString().padStart(2, '0');
  return `${h12}:${m} ${period}`;
}

function addMinutes(hour: number, minute: number, addMin: number): { hour: number; minute: number } {
  const totalMin = hour * 60 + minute + addMin;
  return { hour: Math.floor(totalMin / 60), minute: totalMin % 60 };
}

/* ─────────────────────────────────────────────
   8. CORE: BUILD SMART ITINERARY
   ───────────────────────────────────────────── */

export function buildSmartItinerary(
  allPlaces: PlaceItem[],
  numDays: number,
  budget: 'low' | 'medium' | 'high' | null,
  transportOptions: TransportOptionFull[],
  selectedTransportType: string,
  destination: string
): SmartItinerary {

  // Step 1: Filter by budget
  const filtered = filterByBudget(allPlaces, budget);
  
  // Step 2: Select balanced mix
  const attractions = filtered.filter(p => p.type === 'attraction');
  const restaurants = filtered.filter(p => p.type === 'restaurant');

  // Need ~3 attractions and ~2 restaurants per day
  const selected = [
    ...attractions.slice(0, numDays * 3),
    ...restaurants.slice(0, numDays * 2)
  ];
  
  // Step 3: Geo-cluster into days
  let clusters = kMeansCluster(selected, numDays);
  
  // Ensure each day has 2 restaurants if available
  clusters.forEach((cluster) => {
    let restaurantCount = cluster.filter(p => p.type === 'restaurant').length;
    while (restaurantCount < 2) {
      const centLat = cluster.reduce((s, p) => s + p.lat, 0) / cluster.length;
      const centLng = cluster.reduce((s, p) => s + p.lng, 0) / cluster.length;
      
      const usedIds = new Set(clusters.flat().map(p => p.id));
      const availableRest = restaurants.filter(r => !usedIds.has(r.id));
      
      if (availableRest.length > 0) {
        availableRest.sort((a, b) => 
          haversineDistance(a.lat, a.lng, centLat, centLng) - 
          haversineDistance(b.lat, b.lng, centLat, centLng)
        );
        cluster.push(availableRest[0]);
        restaurantCount++;
      } else {
        // Fallback: Add a generic high-quality restaurant if no API data available
        const localRestNames = ["مطعم محلي مميز", "ركن المأكولات الشعبية", "مطعم وكافيه الإطلالة", "بيت المشويات"];
        const randomName = localRestNames[Math.floor(Math.random() * localRestNames.length)];
        
        cluster.push({
          id: `virtual_rest_${Math.random()}`,
          name: randomName,
          lat: centLat + (Math.random() - 0.5) * 0.005,
          lng: centLng + (Math.random() - 0.5) * 0.005,
          type: 'restaurant',
          category: 'restaurant',
          costLevel: 'medium',
          estimatedDuration: 75,
          rating: 4.5,
          image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
          description: "تجربة طعام محلية رائعة في قلب المدينة.",
          priceLevel: "$$",
          originalData: {}
        });
        restaurantCount++;
      }
    }
  });

  // Cap each day at maxPerDay
  clusters = clusters.map(c => c.slice(0, 5));

  // Step 4: Sort within each day → morning attractions, lunch, afternoon, evening
  const sortedClusters = clusters.map(c => sortByTimeSlot(c));

  // Step 5: Build timeline for each day
  const selectedTransport = transportOptions.find(t => t.type === selectedTransportType);
  const transportPrice = selectedTransport?.price || 0;
  const dailyBudget = DAILY_BUDGET[budget || 'medium'].dailyRate;

  const dayThemes = [
    'استكشاف المعالم التاريخية',
    'يوم الترفيه والاستجمام والأنشطة',
    'جولة ثقافية وتجربة الأطعمة الشعبية',
    'يوم المغامرة واستكشاف الطبيعة',
    'التسوق وشراء الهدايا التذكارية',
    'يوم حر للاسترخاء والاستمتاع بالأجواء',
  ];

  const days: ItineraryDay[] = sortedClusters.map((cluster, dayIdx) => {
    let currentHour = 9;
    let currentMinute = 0;
    let totalDistance = 0;
    
    const activities: DayActivity[] = cluster.map((place, placeIdx) => {
      // Distance from previous
      let distanceFromPrev = 0;
      let travelTime = 0;
      if (placeIdx > 0) {
        const prev = cluster[placeIdx - 1];
        distanceFromPrev = Math.round(haversineDistance(prev.lat, prev.lng, place.lat, place.lng) * 1.25 * 10) / 10;
        travelTime = Math.max(10, Math.round((distanceFromPrev / 30) * 60)); // ~30km/h city avg
        totalDistance += distanceFromPrev;
      }

      // Add travel time gap
      if (placeIdx > 0) {
        const afterTravel = addMinutes(currentHour, currentMinute, travelTime + 15); // 15 min buffer
        currentHour = afterTravel.hour;
        currentMinute = afterTravel.minute;
      }

      // Insert lunch break if passing noon and next is not restaurant
      if (currentHour >= 13 && currentHour < 14 && place.type !== 'restaurant' && placeIdx > 0) {
        const afterLunch = addMinutes(currentHour, currentMinute, 45);
        currentHour = afterLunch.hour;
        currentMinute = afterLunch.minute;
      }

      const startTime = formatTime(currentHour, currentMinute);
      const duration = place.estimatedDuration;
      const end = addMinutes(currentHour, currentMinute, duration);
      const endTime = formatTime(end.hour, end.minute);
      currentHour = end.hour;
      currentMinute = end.minute;

      return {
        place,
        startTime,
        endTime,
        duration,
        distanceFromPrev,
        travelTime,
        costLevel: place.costLevel,
        note: generateActivityNote(place),
      };
    });

    // Use theme name instead of generic regions
    const theme = dayThemes[dayIdx % dayThemes.length];

    return {
      day: dayIdx + 1,
      title: `اليوم ${dayIdx + 1} — ${theme}`,
      area: theme,
      color: DAY_COLORS[dayIdx % DAY_COLORS.length],
      totalCost: Math.round(dailyBudget),
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalDuration: Math.round(activities.reduce((s, a) => s + a.duration, 0) / 60 * 10) / 10,
      activities,
    };
  });

  // Handle case where we have fewer clusters than requested days
  while (days.length < numDays) {
    days.push({
      day: days.length + 1,
      title: `اليوم ${days.length + 1} — يوم مفتوح للاستكشاف`,
      area: 'حر / استجمام',
      color: DAY_COLORS[days.length % DAY_COLORS.length],
      totalCost: Math.round(dailyBudget * 0.5),
      totalDistance: 0,
      totalDuration: 0,
      activities: [],
    });
  }

  const totalAccommodation = numDays * dailyBudget;
  const totalEstimatedCost = totalAccommodation + transportPrice;

  return {
    title: `رحلة ${destination} المخططة`,
    description: `خطة رحلة متكاملة لـ ${numDays} أيام في ${destination} تشمل أهم المعالم والمطاعم المختارة.`,
    days,
    transportation: {
      options: transportOptions,
      selectedType: selectedTransportType,
      distance: getTransportDistance('', destination), // will be overridden by caller
      selectedPrice: transportPrice,
    },
    totalEstimatedCost,
  };
}
