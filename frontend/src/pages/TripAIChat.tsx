import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Send, 
  Star, 
  Camera, 
  Utensils, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  LayoutGrid,
  MapPin,
  Cloud,
  Sun,
  Search,
  Calendar,
  Plane,
  Bus,
  Car,
  Hotel,
  DollarSign,
  ChevronRight,
  Edit3,
  Navigation,
  Compass,
  Globe,
  Wallet,
  Building2
} from "lucide-react";
import { getTripPlan, type TripPlan } from "@/lib/travel-advisor-api";
import { useToast } from "@/hooks/use-toast";
import { createTrip, listTrips, getAITripQuota, recordAIPlanUsage, searchHotelsByLocation } from "@/lib/api";
import { GOVERNORATES_COORDINATES, TRANSPORT_PRICES, EGYPT_CITIES_LIST } from "@/lib/egypt-data";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { getCurrentSeason } from "@/lib/season-utils";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MapboxTripMap } from "@/components/MapboxTripMap";
import TravelPreferenceModal from "@/components/TravelPreferenceModal";
import TravelAgencyRecommendations from "@/components/TravelAgencyRecommendations";
import { useTheme } from "@/contexts/ThemeContext";
import { sendMessageToAI, generateItinerary, type AIResponse, type ItineraryDay, type GeneratedItineraryResponse } from "@/lib/openrouter-client";
import { buildSmartItinerary, normalizePlaces, calculateTransportOptions } from "@/lib/itinerary-engine";
import CityWeatherAdvisor from "@/components/CityWeatherAdvisor";

/* ─────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────── */

type WizardMode = "idle" | "smart" | "custom";

type TransportOption = {
  type: string;
  price: number;
  duration: string;
  label: string;
  icon: string;
};

type TripState = {
  destination: string;
  startCity: string;
  transportation: TransportOption | null;
  transportOptions: TransportOption[];
  days: number | null;
  budget: "low" | "medium" | "high" | null;
  customBudget: number | null;
  hotelNeeded: boolean | null;
  selectedHotel: any | null;
  hotel: {
    checkIn: string;
    checkOut: string;
    stars: string;
    roomType: string;
  };
  lat: number | null;
  lng: number | null;
};

const STEPS_CONFIG = [
  { id: 1, title: "الوجهة", icon: "📍", desc: "اختر وجهتك" },
  { id: 2, title: "مدينة الانطلاق", icon: "🚌", desc: "نقطة البداية" },
  { id: 3, title: "المواصلات", icon: "🚗", desc: "وسيلة النقل" },
  { id: 4, title: "المدة", icon: "📅", desc: "عدد الأيام" },
  { id: 5, title: "الميزانية", icon: "💰", desc: "نطاق الانفاق" },
  { id: 6, title: "الفندق", icon: "🏨", desc: "هل تحتاج إقامة؟" },
  { id: 7, title: "تفاصيل الإقامة", icon: "🛏️", desc: "تواريخ ونوع الفندق" },
  { id: 8, title: "المراجعة", icon: "✅", desc: "تأكيد الرحلة" },
];

const SMART_STEPS_CONFIG = [
  { id: 1, title: "الوجهة", icon: "📍", desc: "اختر وجهتك" },
  { id: 5, title: "الميزانية", icon: "💰", desc: "ميزانية الرحلة" },
  { id: 8, title: "المراجعة", icon: "✅", desc: "تأكيد البحث" },
];

const POPULAR_DESTINATIONS = [
  { name: "شرم الشيخ", emoji: "🏖️" },
  { name: "الإسكندرية", emoji: "🌊" },
  { name: "دهب", emoji: "🤿" },
  { name: "الغردقة", emoji: "☀️" },
  { name: "القاهرة", emoji: "🏛️" },
  { name: "أسوان", emoji: "⛵" },
  { name: "الأقصر", emoji: "🏺" },
  { name: "مرسى مطروح", emoji: "🐚" },
];

const POPULAR_ORIGINS = [
  { name: "القاهرة", emoji: "🏙️" },
  { name: "الإسكندرية", emoji: "🌊" },
  { name: "الجيزة", emoji: "🔺" },
  { name: "المنصورة", emoji: "🌾" },
  { name: "الشرقية", emoji: "🌿" },
  { name: "الغربية", emoji: "🏘️" },
];

/* ─────────────────────────────────────────────
   HELPER: Distance & Cost Calculator
   ───────────────────────────────────────────── */

function calcHaversineDistance(city1: string, city2: string): number | null {
  const c1 = GOVERNORATES_COORDINATES[city1];
  const c2 = GOVERNORATES_COORDINATES[city2];
  if (!c1 || !c2) return null;
  const R = 6371;
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLon = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((c1.lat * Math.PI) / 180) *
    Math.cos((c2.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1.25);
}

function buildTransportOptions(origin: string, dest: string): TransportOption[] {
  const distance = calcHaversineDistance(origin, dest);
  if (!distance || distance <= 0) return [];

  const fuelFactor = TRANSPORT_PRICES.FUEL_PRICE / 15;
  const busPrice = Math.round(distance * TRANSPORT_PRICES.BASE_PRICES.bus * fuelFactor);
  const microbusPrice = Math.round(distance * TRANSPORT_PRICES.BASE_PRICES.microbus * fuelFactor);
  const vipPrice = Math.round(distance * TRANSPORT_PRICES.BASE_PRICES.vip * fuelFactor);

  const avgSpeed = { bus: 60, microbus: 70, vip: 90 };
  const fmtDuration = (km: number, speed: number) => {
    const h = Math.floor(km / speed);
    const m = Math.round(((km / speed) - h) * 60);
    return h > 0 ? `${h} ساعة ${m > 0 ? `و ${m} دقيقة` : ""}` : `${m} دقيقة`;
  };

  return [
    { type: "bus", price: busPrice, duration: fmtDuration(distance, avgSpeed.bus), label: "أتوبيس", icon: "🚌" },
    { type: "microbus", price: microbusPrice, duration: fmtDuration(distance, avgSpeed.microbus), label: "ميكروباص", icon: "🚐" },
    { type: "vip", price: vipPrice, duration: fmtDuration(distance, avgSpeed.vip), label: "VIP / ليموزين", icon: "🚗" },
  ];
}

function calcEstimatedTotal(trip: TripState): number {
  const days = trip.days || 3;
  const dailyRate = trip.customBudget || (trip.budget === "low" ? 600 : trip.budget === "high" ? 3500 : 1400);
  const transportCost = trip.transportation?.price || 0;
  return days * dailyRate + transportCost;
}

/* ─────────────────────────────────────────────
   COUNTDOWN TIMER (reused for quota)
   ───────────────────────────────────────────── */

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <span className="text-emerald-600 font-black text-sm">التجديد متاح الآن، يرجى تحديث الصفحة!</span>;

  return (
    <span className="font-mono font-black text-sm" dir="ltr">
      {timeLeft.d > 0 && `${timeLeft.d}d `}
      {timeLeft.h.toString().padStart(2, '0')}:
      {timeLeft.m.toString().padStart(2, '0')}:
      {timeLeft.s.toString().padStart(2, '0')}
    </span>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

const TripAIChat = () => {
  const { theme } = useTheme();
  const { isSignedIn, getToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  // ─── Wizard State ───
  const [mode, setMode] = useState<WizardMode>("idle");
  const [step, setStep] = useState(1);
  const [trip, setTrip] = useState<TripState>({
    destination: "",
    startCity: "",
    transportation: null,
    transportOptions: [],
    days: null,
    budget: null,
    customBudget: null,
    hotelNeeded: null,
    selectedHotel: null,
    hotel: { checkIn: "", checkOut: "", stars: "", roomType: "" },
    lat: null,
    lng: null,
  });

  // ─── Trip Plan (result from API) ───
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [selectedAttractions, setSelectedAttractions] = useState<Set<string>>(new Set());
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<string>>(new Set());
  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set());
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<GeneratedItineraryResponse | null>(null);

  // ─── Platform trips (Smart Search) ───
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ─── AI Quota ───
  const [aiQuota, setAiQuota] = useState<{ count: number; limit: number; remaining: number; nextRestoreTime?: string; isAdmin?: boolean } | null>(null);

  // ─── Mobile ───
  const [mobileView, setMobileView] = useState<'wizard' | 'results'>('wizard');

  // ─── City Search Dropdowns ───
  const [destSearch, setDestSearch] = useState("");
  const [showDestList, setShowDestList] = useState(false);
  const [originSearch, setOriginSearch] = useState("");
  const [showOriginList, setShowOriginList] = useState(false);


  // ─── City Location ID & Attractions Preview ───
  const [destLocationId, setDestLocationId] = useState<string | null>(null);
  const [isFetchingLocationId, setIsFetchingLocationId] = useState(false);
  const [cityAttractions, setCityAttractions] = useState<any[]>([]);
  const [cityRestaurants, setCityRestaurants] = useState<any[]>([]);
  const [cityHotels, setCityHotels] = useState<any[]>([]);
  const [stepHotels, setStepHotels] = useState<any[]>([]);
  const [isFetchingStepHotels, setIsFetchingStepHotels] = useState(false);
  const [isFetchingCityData, setIsFetchingCityData] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── Travel Preference Integration State ───
  const [travelPreference, setTravelPreference] = useState<'company' | 'independent' | null>(null);
  const [showTravelPreferenceModal, setShowTravelPreferenceModal] = useState(false);
  const [showAgencyRecommendations, setShowAgencyRecommendations] = useState(false);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await listTrips({ limit: 100, sort: 'likes' });
        if (res.items) setAvailableTrips(res.items);
      } catch (e) {
        console.error("Failed to fetch trips for AI", e);
      }
    };
    fetchTrips();
  }, []);

  const refreshQuota = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (token) {
        const q = await getAITripQuota(token);
        setAiQuota(q ?? null);
      }
    } catch {
      setAiQuota(null);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => { refreshQuota(); }, [refreshQuota]);

  // ─── Auto-fetch hotels when dates are set ───
  useEffect(() => {
    if (trip.destination && trip.hotel.checkIn && trip.hotel.checkOut && step === 7) {
      fetchStepHotels();
    }
  }, [trip.destination, trip.hotel.checkIn, trip.hotel.checkOut, step]);

  // ─── Auto-scroll ───
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.closest('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [step]);

  // ─── Step Logic ───

  const totalSteps = trip.hotelNeeded === false ? 7 : 8; // skip hotel details if not needed
  const effectiveSteps = STEPS_CONFIG.filter(s => {
    if (s.id === 7 && trip.hotelNeeded === false) return false;
    return true;
  });

  const goNext = () => {
    if (mode === "smart") {
      if (step === 1) setStep(5);
      else if (step === 5) setStep(8);
      else setStep(prev => Math.min(prev + 1, 8));
    } else {
      if (step === 6 && trip.hotelNeeded === false) {
        setStep(8); // skip hotel details step
      } else {
        setStep(prev => Math.min(prev + 1, 8));
      }
    }
  };

  const goBack = () => {
    if (mode === "smart") {
      if (step === 8) setStep(5);
      else if (step === 5) setStep(1);
      else setStep(prev => Math.max(prev - 1, 1));
    } else {
      if (step === 8 && trip.hotelNeeded === false) {
        setStep(6);
      } else {
        setStep(prev => Math.max(prev - 1, 1));
      }
    }
  };

  const updateTrip = (patch: Partial<TripState>) => {
    setTrip(prev => ({ ...prev, ...patch }));
  };

  const updateHotel = (patch: Partial<TripState["hotel"]>) => {
    setTrip(prev => ({ ...prev, hotel: { ...prev.hotel, ...patch } }));
  };

  const fetchStepHotels = async () => {
    if (!trip.destination || !trip.hotel.checkIn || !trip.hotel.checkOut) return;
    
    setIsFetchingStepHotels(true);
    try {
      const coords = GOVERNORATES_COORDINATES[trip.destination];
      if (coords) {
        const res = await searchHotelsByLocation(
          String(coords.lat),
          String(coords.lng),
          trip.hotel.checkIn,
          trip.hotel.checkOut
        );
        if (res.data) {
          setStepHotels(res.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch step hotels:", error);
      toast({
        title: "خطأ في جلب الفنادق",
        description: "تعذر الحصول على توصيات الفنادق حالياً.",
        variant: "destructive"
      });
    } finally {
      setIsFetchingStepHotels(false);
    }
  };

  // ─── Auto-calculate transport when step 2 is completed ───
  const handleOriginSelected = () => {
    if (trip.destination && trip.startCity) {
      const options = buildTransportOptions(trip.startCity, trip.destination);
      updateTrip({ transportOptions: options });
    }
    goNext();
  };

  // ─── Smart Search Logic ───
  const handleSmartSearch = () => {
    setIsSearching(true);
    setMobileView('results');
    
    // Simulate AI thinking
    setTimeout(() => {
      const results = availableTrips.filter(t => {
        const destLower = (trip.destination || "").toLowerCase();
        const tDest = (t.destination || "").toLowerCase();
        const tCity = (t.city || "").toLowerCase();
        const tTitle = (t.title || "").toLowerCase();
        
        const matchDest = !trip.destination || 
                         tDest.includes(destLower) || 
                         tCity.includes(destLower) || 
                         tTitle.includes(destLower);
                         
        const budgetMapAr: Record<string, string> = { low: "اقتصادية", medium: "متوسطة", high: "فاخرة" };
        const tripBudgetAr = trip.budget ? budgetMapAr[trip.budget] : null;
        
        const matchBudget = !trip.budget || t.budget === trip.budget || t.budget === tripBudgetAr;
        
        return matchDest && matchBudget;
      });
      
      // Sort by "relevance" (just simple for now, but feels more AI-like if we say it is)
      const sortedResults = results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      setFilteredTrips(sortedResults.slice(0, 12));
      setIsSearching(false);
      
      if (results.length === 0) {
        toast({
          title: "عذراً",
          description: "لم نجد رحلات تطابق بحثك تماماً، جرب تغيير الميزانية أو المدينة.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "تم العثور على مقترحات",
          description: `لقد وجدنا ${results.length} رحلة تناسب طلبك من المنصة.`,
        });
      }
    }, 1500);
  };

  const filterAttractionsByCity = (cityName: string, items: any[]) => {
    const coords = GOVERNORATES_COORDINATES[cityName];
    if (!coords) return items;
    return items.filter(item => {
      const lat = parseFloat(item.latitude || item.lat);
      const lng = parseFloat(item.longitude || item.lng);
      if (isNaN(lat) || isNaN(lng)) return true;
      const latDiff = Math.abs(lat - coords.lat);
      const lngDiff = Math.abs(lng - coords.lng);
      return latDiff <= 0.8 && lngDiff <= 0.8;
    });
  };

  // ─── Custom Trip – Confirm & Generate ───
  const handleConfirmTrip = async () => {
    if (!trip.destination || !trip.days) return;

    if (!isSignedIn) {
      toast({ title: "تسجيل الدخول مطلوب", description: "يجب تسجيل الدخول لاستخدام المخطط الذكي", variant: "destructive" });
      return;
    }

    if (isSignedIn && aiQuota !== null && !aiQuota.isAdmin && aiQuota.remaining <= 0) {
      toast({ title: "تم استنفاد الحد الأسبوعي", description: `لقد استخدمت ${aiQuota.limit} خطط رحلات هذا الأسبوع.`, variant: "destructive" });
      return;
    }

    setIsGeneratingPlan(true);
    setMobileView('results');

    try {
      const coords = GOVERNORATES_COORDINATES[trip.destination];
      const plan = await getTripPlan(
        trip.destination,
        trip.days,
        trip.budget || undefined,
        trip.hotelNeeded ? (trip.hotel.checkIn || undefined) : undefined,
        trip.hotelNeeded ? (trip.hotel.checkOut || undefined) : undefined,
        coords?.lat || trip.lat,
        coords?.lng || trip.lng,
        destLocationId || undefined
      );

      if (plan) {
        // Strict coordinate-based validation to keep only attractions in the selected city area
        plan.attractions = filterAttractionsByCity(trip.destination, plan.attractions);
        plan.restaurants = filterAttractionsByCity(trip.destination, plan.restaurants);

        setTripPlan(plan);
        if (isSignedIn) {
          try {
            const token = await getToken();
            if (token) {
              const updated = await recordAIPlanUsage(token);
              if (updated) setAiQuota(updated);
            }
          } catch (e) { }
        }
        setSelectedAttractions(new Set(plan.attractions.map((a, idx) => a.location_id || idx.toString())));
        setSelectedRestaurants(new Set(plan.restaurants.map((r, idx) => r.location_id || idx.toString())));
        
        // Handle selected hotel from wizard step
        const hotelSet = new Set<string>();
        if (trip.selectedHotel) {
          hotelSet.add(trip.selectedHotel.location_id || "selected-hotel");
          // If the selected hotel isn't in the plan's hotels, add it
          if (!plan.hotels.find(h => h.location_id === trip.selectedHotel.location_id)) {
            plan.hotels.unshift(trip.selectedHotel);
          }
        } else {
          plan.hotels.forEach((h, idx) => hotelSet.add(h.location_id || idx.toString()));
        }
        setSelectedHotels(hotelSet);
      } else {
        toast({ title: "عذراً", description: "لم أتمكن من إيجاد معلومات كافية عن هذه الوجهة.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Trip plan generation failed:", error);
      toast({ title: "خطأ", description: "واجهت مشكلة أثناء البحث عن الأماكن.", variant: "destructive" });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // ─── Helper for coordinates ───
  const getCoords = (latStr: string | undefined | null, lngStr: string | undefined | null) => {
    const destCoords = GOVERNORATES_COORDINATES[trip.destination];
    const defaultLat = destCoords ? destCoords.lat : 30.0444;
    const defaultLng = destCoords ? destCoords.lng : 31.2357;
    
    const lat = parseFloat(latStr || "");
    const lng = parseFloat(lngStr || "");
    
    return { 
      lat: isNaN(lat) ? defaultLat : lat, 
      lng: isNaN(lng) ? defaultLng : lng 
    };
  };

  // ─── Generate AI Itinerary ───
  const handleGenerateItineraryAction = async () => {
    if (!tripPlan) return;
    setIsGeneratingItinerary(true);
    try {
      // 1. Get selected items
      const selectedAttractionsList = tripPlan.attractions.filter((a, idx) => 
        selectedAttractions.has(a.location_id || String(idx))
      );
      const selectedRestaurantsList = tripPlan.restaurants.filter((r, idx) => 
        selectedRestaurants.has(r.location_id || String(idx))
      );

      if (selectedAttractionsList.length === 0 && selectedRestaurantsList.length === 0) {
        toast({ title: "تنبيه", description: "يرجى اختيار مكان واحد على الأقل.", variant: "destructive" });
        return;
      }

      // 2. Normalize for engine
      const baseLat = parseFloat(tripPlan.location.latitude || "30.0444");
      const baseLng = parseFloat(tripPlan.location.longitude || "31.2357");
      
      const normalized = normalizePlaces(
        selectedAttractionsList,
        selectedRestaurantsList,
        baseLat,
        baseLng,
        trip.budget
      );

      // 3. Get transport context
      const transportOptionsFull = calculateTransportOptions(trip.startCity || "القاهرة", trip.destination);
      const selectedType = trip.transportation?.type || 'bus';

      // 4. Generate local smart itinerary
      const smartItinerary = buildSmartItinerary(
        normalized,
        trip.days || 3,
        trip.budget,
        transportOptionsFull,
        selectedType,
        trip.destination
      );

      // 5. Convert to format expected by UI (matches GeneratedItineraryResponse)
      const formattedResponse: GeneratedItineraryResponse = {
        title: smartItinerary.title,
        description: smartItinerary.description,
        days: smartItinerary.days.map(day => ({
          dayNum: day.day,
          title: day.title,
          color: day.color,
          activities: day.activities.map(act => ({
            name: act.place.name,
            time: act.startTime,
            note: act.note,
            type: act.place.type,
            coordinates: { lat: act.place.lat, lng: act.place.lng }
          }))
        }))
      };

      setGeneratedItinerary(formattedResponse);
      toast({ title: "تم تنظيم الرحلة", description: "لقد رتبت لك الأماكن حسب الأيام لتقليل مسافات التنقل." });
    } catch (err: any) {
      console.error("Local Organizing Failed:", err);
      toast({ title: "فشل التنظيم", description: "حدث خطأ أثناء تنظيم الرحلة.", variant: "destructive" });
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  // ─── Save Trip ───
  const handleCreateTrip = async () => {
    if (!tripPlan) return;
    if (!isSignedIn) {
      toast({ title: "تسجيل الدخول مطلوب", description: "يجب تسجيل الدخول لحفظ رحلتك.", variant: "destructive" });
      return;
    }
    setIsCreatingTrip(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("انتهت الجلسة، يرجى إعادة تسجيل الدخول.");

      const selectedAttractionsList = tripPlan.attractions.filter((a, idx) => selectedAttractions.has(a.location_id || String(idx)));
      const selectedRestaurantsList = tripPlan.restaurants.filter((r, idx) => selectedRestaurants.has(r.location_id || String(idx)));
      const selectedHotelsList = tripPlan.hotels.filter((h, idx) => selectedHotels.has(h.location_id || String(idx)));

      const activities: any[] = [];
      const finalDays: any[] = [];
      let actCounter = 0;
      const numDays = trip.days || 3;

      if (generatedItinerary && generatedItinerary.days) {
        generatedItinerary.days.forEach((day: any, dayIdx: number) => {
          const dayActs: number[] = [];
          (day.activities || []).forEach((act: any) => {
            const originalAttract = selectedAttractionsList.find(a => a.name === act.name);
            const originalRest = selectedRestaurantsList.find(r => r.name === act.name);
            const original = originalAttract || originalRest;
            const coords = getCoords(act.coordinates?.lat?.toString(), act.coordinates?.lng?.toString());
            activities.push({
              name: act.name,
              images: original?.photo?.images?.large?.url ? [original.photo.images.large.url] : (original?.photo?.images?.medium?.url ? [original.photo.images.medium.url] : []),
              day: dayIdx + 1, 
              time: act.time || "10:00 AM", 
              type: act.type || (originalRest ? 'restaurant' : 'attraction'), 
              coordinates: coords,
              note: act.note || original?.description || "نشاط سياحي ممتع",
              color: (act.type === 'restaurant' || originalRest) ? '#10b981' : '#3b82f6',
            });
            dayActs.push(actCounter++);
          });
          
          let hotelObj = undefined;
          if (trip.selectedHotel) {
            const h = trip.selectedHotel;
            const hotelCoords = getCoords(h.latitude, h.longitude);
            hotelObj = { 
              name: h.name, 
              image: h.photo?.images?.medium?.url || "", 
              rating: parseFloat(h.rating || "4.5"), 
              address: h.address || "", 
              priceRange: h.price || "متوسط", 
              coordinates: hotelCoords 
            };
          } else if (selectedHotelsList.length > 0) {
            const h = selectedHotelsList[dayIdx % selectedHotelsList.length];
            const hotelCoords = getCoords(h.latitude, h.longitude);
            hotelObj = { 
              name: h.name, 
              image: h.photo?.images?.medium?.url || "", 
              rating: parseFloat(h.rating || "4.5"), 
              address: h.address || "", 
              priceRange: h.price || "متوسط", 
              coordinates: hotelCoords 
            };
          }
          finalDays.push({ 
            title: day.title || `اليوم ${dayIdx + 1}`, 
            activities: dayActs, 
            hotel: hotelObj 
          });
        });
      } else {
        // Fallback or Manual Construction
        selectedAttractionsList.forEach((attraction, idx) => {
          const coords = getCoords(attraction.latitude, attraction.longitude);
          activities.push({ 
            name: attraction.name, 
            images: attraction.photo?.images?.large?.url ? [attraction.photo.images.large.url] : (attraction.photo?.images?.medium?.url ? [attraction.photo.images.medium.url] : []), 
            day: Math.floor(idx / 3) + 1, 
            time: "10:00 صباحاً", 
            description: attraction.description || 'نشاط سياحي ممتع', 
            type: 'attraction', 
            coordinates: coords 
          });
        });
        
        selectedRestaurantsList.forEach((restaurant, idx) => {
          const coords = getCoords(restaurant.latitude, restaurant.longitude);
          activities.push({ 
            name: restaurant.name, 
            images: restaurant.photo?.images?.large?.url ? [restaurant.photo.images.large.url] : (restaurant.photo?.images?.medium?.url ? [restaurant.photo.images.medium.url] : []), 
            day: Math.floor(idx / 2) + 1, 
            time: "02:00 مساءً", 
            description: restaurant.description || 'تجربة طعام مميزة', 
            type: 'restaurant', 
            coordinates: coords 
          });
        });

        // Ensure at least 1 restaurant per day if list is empty or short
        for (let d = 1; d <= numDays; d++) {
          const hasRest = activities.some(a => a.day === d && a.type === 'restaurant');
          if (!hasRest) {
            activities.push({
              name: "مطعم محلي مميز",
              images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"],
              day: d,
              time: "02:00 مساءً",
              description: "تجربة طعام محلية رائعة.",
              type: 'restaurant',
              coordinates: getCoords(null, null)
            });
          }
        }

        for (let i = 0; i < numDays; i++) {
          let hotelObj = undefined;
          if (trip.selectedHotel) {
            const h = trip.selectedHotel;
            const hotelCoords = getCoords(h.latitude, h.longitude);
            hotelObj = { name: h.name, image: h.photo?.images?.medium?.url || "", rating: parseFloat(h.rating || "4.5"), address: h.address || "", priceRange: h.price || "متوسط", coordinates: hotelCoords };
          } else if (selectedHotelsList.length > 0) {
            const h = selectedHotelsList[i % selectedHotelsList.length];
            const hotelCoords = getCoords(h.latitude, h.longitude);
            hotelObj = { name: h.name, image: h.photo?.images?.medium?.url || "", rating: parseFloat(h.rating || "4.5"), address: h.address || "", priceRange: h.price || "متوسط", coordinates: hotelCoords };
          }
          
          const dayActs = activities
            .map((_, idx) => idx)
            .filter((_, idx) => activities[idx].day === i + 1);
            
          finalDays.push({ 
            title: `اليوم ${i + 1}`, 
            activities: dayActs, 
            hotel: hotelObj 
          });
        }
      }

      const budgetMap = { low: "اقتصادية", medium: "متوسطة", high: "فاخرة" };
      const tripSeason = getCurrentSeason();
      const validSeasons = ['winter', 'summer', 'fall', 'spring'];
      const normalizedSeason = validSeasons.includes(tripSeason.toLowerCase()) ? tripSeason.toLowerCase() : getCurrentSeason();
      const estimatedPrice = calcEstimatedTotal(trip);

      const tripData = {
        title: generatedItinerary?.title || `رحلة ${trip.destination} - ${numDays} أيام`,
        destination: trip.destination, city: trip.destination, duration: `${numDays} أيام`,
        rating: 4.8,
        description: generatedItinerary?.description || `رحلة ممتعة تم إنشاؤها بالذكاء الاصطناعي إلى ${trip.destination}`,
        image: selectedAttractionsList[0]?.photo?.images?.large?.url || selectedAttractionsList[0]?.photo?.images?.medium?.url || "/assets/egypt-map.png",
        budget: budgetMap[trip.budget as keyof typeof budgetMap] || "متوسطة",
        season: normalizedSeason, activities, days: finalDays,
        foodAndRestaurants: selectedRestaurantsList.slice(0, 5).map(r => ({ name: r.name, image: r.photo?.images?.large?.url || r.photo?.images?.medium?.url || "", rating: parseFloat(r.rating || "4.5"), description: r.cuisine?.[0]?.name ? `مطعم ${r.cuisine[0].name}` : "مطعم رائع" })),
        hotels: selectedHotelsList.slice(0, 3).map(h => {
          const hotelCoords = getCoords(h.latitude, h.longitude);
          return { 
            name: h.name, 
            image: h.photo?.images?.large?.url || h.photo?.images?.medium?.url || "", 
            rating: parseFloat(h.rating || "4.5"), 
            description: h.description || h.address || "فندق وإقامة مميزة", 
            priceRange: h.price || "متوسط السعر", 
            address: h.address || "", 
            amenities: Array.isArray(h.amenities) && h.amenities.length > 0 
              ? h.amenities.map((a: any) => typeof a === 'string' ? a : a.name || a) 
              : ["Wi-Fi", "موقف سيارات", "حمام سباحة", "إفطار"], 
            coordinates: hotelCoords,
            review_word: h.review_word,
            star_rating: h.star_rating,
            is_free_cancellable: h.is_free_cancellable,
            distance_to_center: h.distance_to_center
          };
        }),
        isAIGenerated: true, postType: 'detailed', startCity: trip.startCity,
        transportationPrice: trip.transportation?.price || (trip.transportOptions.length > 0 ? trip.transportOptions[0].price : 0),
        totalEstimatedPrice: estimatedPrice || undefined,
        selectedTransportType: trip.transportation?.type || (trip.transportOptions.length > 0 ? trip.transportOptions[0].type : undefined),
        transportOptions: trip.transportOptions.length > 0 ? trip.transportOptions.map(o => ({ type: o.type, price: o.price, label: o.label, icon: o.icon, duration: o.duration })) : undefined,
      };

      let createdTrip;
      try {
        createdTrip = await createTrip(tripData, token);
        toast({ title: "تم الحفظ بنجاح", description: "رحلتك الآن في ملفك الشخصي." });
      } catch (err: any) {
        if (err.status === 429 && tripData.isAIGenerated) {
          // Fallback to manual trip if AI quota exceeded
          const manualData = { ...tripData, isAIGenerated: false };
          createdTrip = await createTrip(manualData, token);
          toast({ 
            title: "تم الحفظ بالنمط العادي", 
            description: "لقد استهلكت حصة الذكاء الاصطناعي، تم حفظ الرحلة كرحلة عادية.",
            variant: "default" 
          });
        } else {
          throw err;
        }
      }

      refreshQuota();
      navigate(`/trips/${createdTrip._id || createdTrip.id}`);
    } catch (error: any) {
      toast({ title: "فشل الحفظ", description: error.message || "حدث خطأ أثناء حفظ الرحلة.", variant: "destructive" });
    } finally {
      setIsCreatingTrip(false);
    }
  };

  // ─── Reset ───
  const fetchHotelsForBudget = async (budget: string) => {
    if (!trip.destination || !destLocationId) return;
    try {
      const { getHotels } = await import('@/lib/travel-advisor-api');
      const coords = GOVERNORATES_COORDINATES[trip.destination];
      const hotels = await getHotels(trip.destination, budget, undefined, undefined, coords?.lat, coords?.lng, destLocationId);
      setCityHotels(hotels || []);
    } catch (e) {
      console.error('Hotels re-fetch failed:', e);
    }
  };

  // ─── Fetch City LocationID + Attractions/Restaurants from TravelAdvisor ───
  const fetchCityData = async (cityName: string, locationIdHint?: string) => {
    setIsFetchingCityData(true);
    try {
      const cityEntry = EGYPT_CITIES_LIST.find(c => c.name === cityName);
      let locationId = locationIdHint || cityEntry?.locationId || null;

      if (!locationId) {
        setIsFetchingLocationId(true);
        const { searchLocation } = await import('@/lib/travel-advisor-api');
        const loc = await searchLocation(cityName);
        locationId = loc?.location_id || null;
        setIsFetchingLocationId(false);
      }

      setDestLocationId(locationId);

      if (locationId) {
        const { getAttractions, getRestaurants, getHotels } = await import('@/lib/travel-advisor-api');
        
        // Fetch everything in parallel
        const coords = GOVERNORATES_COORDINATES[cityName];
        const [attractions, restaurants] = await Promise.all([
          getAttractions(locationId, 15).catch(() => []),
          getRestaurants(locationId, 10).catch(() => []),
        ]);

        setCityAttractions(attractions);
        setCityRestaurants(restaurants);
      }
    } catch (e) {
      console.error('fetchCityData error:', e);
    } finally {
      setIsFetchingCityData(false);
      setIsFetchingLocationId(false);
    }
  };

  const resetWizard = () => {
    setMode("idle");
    setStep(1);
    setTrip({
      destination: "",
      startCity: "",
      transportation: null,
      transportOptions: [],
      days: null,
      budget: null,
      customBudget: null,
      hotelNeeded: null,
      selectedHotel: null,
      hotel: { checkIn: "", checkOut: "", stars: "", roomType: "" },
      lat: null,
      lng: null
    });
    setTripPlan(null);
    setGeneratedItinerary(null);
    setFilteredTrips([]);
    setMobileView('wizard');
    setTravelPreference(null);
    setShowTravelPreferenceModal(false);
    setShowAgencyRecommendations(false);
  };

  /* ═════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════ */

  // ─── STEP RENDERERS ───

  const renderStep1 = () => {
    const filteredDest = EGYPT_CITIES_LIST.filter(c =>
      !destSearch.trim() ||
      c.name.includes(destSearch) ||
      c.nameAr.includes(destSearch) ||
      c.name.toLowerCase().includes(destSearch.toLowerCase())
    );

    const handleSelectDest = (name: string) => {
      const cityEntry = EGYPT_CITIES_LIST.find(c => c.name === name);
      updateTrip({ destination: name });
      setDestSearch("");
      setShowDestList(false);
      setCityAttractions([]);
      setCityRestaurants([]);
      setDestLocationId(null);
      fetchCityData(name, cityEntry?.locationId);
    };

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-indigo-200">📍</div>
          <h3 className="text-2xl font-black text-foreground">عايز تسافر فين؟</h3>
          <p className="text-sm text-muted-foreground font-medium">ابحث أو اختر من قائمة المدن المصرية</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {POPULAR_DESTINATIONS.map(city => (
            <button key={city.name} onClick={() => handleSelectDest(city.name)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-bold text-sm transition-all duration-200",
                trip.destination === city.name
                  ? "border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-md"
                  : "border-border bg-card text-muted-foreground hover:border-indigo-200"
              )}>
              <span>{city.emoji}</span><span>{city.name}</span>
            </button>
          ))}
        </div>

        <div className="relative group">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary z-10 transition-transform group-focus-within:scale-110" />
            <input
              id="ai-chat-input"
              placeholder="ابحث عن أي مدينة..."
              className={cn(
                "h-14 w-full rounded-2xl pr-12 pl-4 text-base font-bold border-2 transition-all duration-300 outline-none shadow-sm bg-card text-foreground",
                showDestList ? "border-indigo-400 ring-4 ring-indigo-500/10 shadow-indigo-500/5 focus:border-indigo-500/50" : "border-border focus:border-indigo-400"
              )}
              value={destSearch || (trip.destination && !showDestList ? trip.destination : "")}
              onChange={e => { 
                setDestSearch(e.target.value); 
                setShowDestList(true); 
                if (!e.target.value) updateTrip({ destination: "" }); 
              }}
              onFocus={() => { 
                setShowDestList(true); 
                setDestSearch(""); 
              }}
              onBlur={() => setTimeout(() => setShowDestList(false), 200)}
              dir="rtl"
            />
            {trip.destination && !showDestList && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg text-xs font-black animate-in fade-in zoom-in">
                <span>📍 مدينة مختارة</span>
              </div>
            )}
          </div>

          {showDestList && (
            <div className="absolute top-[calc(100%+8px)] right-0 left-0 z-[100] bg-popover/95 backdrop-blur-xl border border-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden max-h-72 overflow-y-auto animate-in slide-in-from-top-2 duration-300 text-popover-foreground">
              {filteredDest.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm font-bold text-muted-foreground">لا توجد نتائج مطابقة</div>
              ) : (
                filteredDest.map(city => (
                  <button
                    key={city.name}
                    onMouseDown={() => handleSelectDest(city.name)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 text-right text-sm font-bold transition-colors hover:bg-accent",
                      trip.destination === city.name ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" : "text-foreground"
                    )}
                  >
                    <span className="text-lg shrink-0">{city.emoji}</span>
                    <span className="flex-1">{city.name}</span>
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-md",
                      city.category === 'beach' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' :
                      city.category === 'historical' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                      city.category === 'desert' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {city.category === 'beach' ? 'شواطئ' : city.category === 'historical' ? 'تاريخية' : city.category === 'desert' ? 'صحراء' : 'محافظة'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>



        <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black text-base shadow-xl shadow-indigo-200 gap-3 hover:shadow-2xl transition-all" disabled={!trip.destination.trim()} onClick={() => {
          const coords = GOVERNORATES_COORDINATES[trip.destination];
          if (coords) updateTrip({ lat: coords.lat, lng: coords.lng });
          goNext();
        }}>
          التالي <ArrowLeft className="w-5 h-5" />
        </Button>
      </motion.div>
    );
  };

  const renderStep2 = () => {
    const filteredOrigin = EGYPT_CITIES_LIST.filter(c =>
      !originSearch.trim() ||
      c.name.includes(originSearch) ||
      c.name.toLowerCase().includes(originSearch.toLowerCase())
    );

    const handleSelectOrigin = (name: string) => {
      updateTrip({ startCity: name });
      setOriginSearch("");
      setShowOriginList(false);
    };

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-200">🚌</div>
          <h3 className="text-2xl font-black text-foreground">هتتحرك منين؟</h3>
          <p className="text-sm text-muted-foreground font-medium">اختر مدينة الانطلاق لحساب المواصلات</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {POPULAR_ORIGINS.map(city => (
            <button key={city.name} onClick={() => { updateTrip({ startCity: city.name }); setOriginSearch(""); setShowOriginList(false); }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-bold text-sm transition-all duration-200",
                trip.startCity === city.name
                  ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-md"
                  : "border-border bg-card text-muted-foreground hover:border-emerald-200"
              )}>
              <span>{city.emoji}</span><span>{city.name}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="relative">
            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
            <input
              placeholder="ابحث عن محافظتك..."
              className="h-12 w-full rounded-2xl pr-11 pl-4 text-sm font-bold border-2 border-border focus:border-emerald-400 focus:outline-none transition-colors bg-card text-foreground"
              value={originSearch || (trip.startCity && !showOriginList ? trip.startCity : "")}
              onChange={e => { setOriginSearch(e.target.value); setShowOriginList(true); if (!e.target.value) updateTrip({ startCity: "" }); }}
              onFocus={() => { setShowOriginList(true); setOriginSearch(""); }}
              onBlur={() => setTimeout(() => setShowOriginList(false), 150)}
            />
            {trip.startCity && !showOriginList && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                
              </div>
            )}
          </div>

          {showOriginList && (
            <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto text-popover-foreground">
              {filteredOrigin.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm font-bold text-muted-foreground">لا توجد نتائج</div>
              ) : (
                filteredOrigin.map(city => (
                  <button
                    key={city.name}
                    onMouseDown={() => handleSelectOrigin(city.name)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 text-right text-sm font-bold transition-colors hover:bg-accent",
                      trip.startCity === city.name ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "text-foreground"
                    )}
                  >
                    <span className="text-lg shrink-0">{city.emoji}</span>
                    <span className="flex-1">{city.name}</span>
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-md",
                      city.category === 'beach' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' :
                      city.category === 'historical' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                      city.category === 'desert' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {city.category === 'beach' ? 'شواطئ' : city.category === 'historical' ? 'تاريخية' : city.category === 'desert' ? 'صحراء' : 'محافظة'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-muted-foreground border-border" onClick={goBack}>
            <ArrowRight className="w-5 h-5 ml-2" /> رجوع
          </Button>
          <Button className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black shadow-xl shadow-emerald-200 gap-3" disabled={!trip.startCity.trim()} onClick={handleOriginSelected}>
            التالي <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderStep3 = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-orange-200">🚗</div>
        <h3 className="text-2xl font-black text-foreground">اختر وسيلة النقل</h3>
        <p className="text-sm text-muted-foreground font-medium">من {trip.startCity} إلى {trip.destination}</p>
      </div>

      {trip.transportOptions.length > 0 ? (
        <div className="space-y-3">
          {trip.transportOptions.map(opt => (
            <button key={opt.type} onClick={() => updateTrip({ transportation: opt })}
              className={cn(
                "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-right",
                trip.transportation?.type === opt.type
                  ? "border-orange-500 bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 shadow-lg"
                  : "border-border bg-card hover:border-orange-200 hover:bg-orange-50/10"
              )}>
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0",
                trip.transportation?.type === opt.type ? "bg-orange-500 text-white shadow-md" : "bg-muted text-foreground"
              )}>
                {opt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-foreground text-base">{opt.label}</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> {opt.duration}
                </div>
              </div>
              <div className="text-left shrink-0">
                <div className="font-black text-lg text-orange-600">{opt.price}</div>
                <div className="text-[10px] font-bold text-gray-400">ج.م</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <Navigation className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-bold text-sm">لا يمكن حساب المواصلات لهذا المسار</p>
          <p className="text-xs mt-1">يمكنك المتابعة بدون اختيار مواصلات</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-muted-foreground border-border" onClick={goBack}>
          <ArrowRight className="w-5 h-5 ml-2" /> رجوع
        </Button>
        <Button className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black shadow-xl shadow-orange-200 gap-3" disabled={trip.transportOptions.length > 0 && !trip.transportation} onClick={goNext}>
          التالي <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-sky-200">📅</div>
        <h3 className="text-2xl font-black text-foreground">كام يوم رحلتك؟</h3>
        <p className="text-sm text-muted-foreground font-medium">اختر مدة الرحلة بالأيام</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "١-٣ أيام", value: 3, desc: "رحلة سريعة" },
          { label: "٤-٧ أيام", value: 5, desc: "عطلة مريحة" },
          { label: "+٧ أيام", value: 10, desc: "إجازة طويلة" },
        ].map(d => (
          <button key={d.value} onClick={() => updateTrip({ days: d.value })}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
              trip.days === d.value
                ? "border-sky-500 bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shadow-md"
                : "border-border bg-card hover:border-sky-200"
            )}>
            <span className="text-2xl font-black text-sky-600">{d.value}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{d.desc}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-gray-400 shrink-0">عدد مخصص:</span>
        <Input type="number" min="1" max="30" placeholder="..." className="h-12 rounded-2xl text-center font-black text-lg flex-1 border-border focus:border-sky-400 bg-card text-foreground" value={trip.days || ""} onChange={e => updateTrip({ days: parseInt(e.target.value) || null })} />
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-muted-foreground border-border" onClick={goBack}>
          <ArrowRight className="w-5 h-5 ml-2" /> رجوع
        </Button>
        <Button className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-black shadow-xl shadow-sky-200 gap-3" disabled={!trip.days || trip.days < 1} onClick={goNext}>
          التالي <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStep5 = () => {
    const handleBudgetSelect = (b: { key: "low" | "medium" | "high", val: number }) => {
      updateTrip({ budget: b.key, customBudget: b.val });
    };

    const handleCustomBudgetChange = (val: string) => {
      const num = parseInt(val);
      updateTrip({ customBudget: num || null, budget: null });
    };

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-200">💰</div>
          <h3 className="text-2xl font-black text-foreground">ميزانيتك اليومية؟</h3>
          <p className="text-sm text-muted-foreground font-medium">اختر مستوى الإنفاق اليومي</p>
        </div>
        <div className="space-y-3">
          {[
            { key: "low" as const, label: "اقتصادية", desc: "~٦٠٠ ج.م / يوم", emoji: "💵", color: "emerald", val: 600 },
            { key: "medium" as const, label: "متوسطة", desc: "~١٤٠٠ ج.م / يوم", emoji: "💳", color: "blue", val: 1400 },
            { key: "high" as const, label: "فاخرة", desc: "~٣٥٠٠ ج.م / يوم", emoji: "💎", color: "purple", val: 3500 },
          ].map(b => (
            <button key={b.key} onClick={() => handleBudgetSelect(b)}
              className={cn(
                "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200",
                trip.budget === b.key
                  ? b.color === 'emerald' ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-md"
                    : b.color === 'blue' ? "border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-md"
                    : "border-purple-500 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 shadow-md"
                  : "border-border bg-card text-muted-foreground hover:border-border"
              )}>
              <span className="text-2xl">{b.emoji}</span>
              <div className="flex-1 text-right">
                <div className="font-black text-foreground">{b.label}</div>
                <div className="text-xs text-muted-foreground font-medium">{b.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <label className="text-[10px] font-black text-gray-400 uppercase block mb-2">أو أدخل ميزانية يومية مخصصة</label>
          <div className="relative">
            <Input 
              type="number" 
              placeholder="مثلاً: ٢٠٠٠" 
              className="h-14 rounded-2xl pr-12 text-lg font-black border-2 border-border focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all bg-card text-foreground"
              value={trip.customBudget || ""}
              onChange={e => handleCustomBudgetChange(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ج.م</div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-muted-foreground border-border" onClick={goBack}>
            <ArrowRight className="w-5 h-5 ml-2" /> رجوع
          </Button>
          <Button className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black shadow-xl shadow-emerald-200 gap-3" disabled={!trip.budget && !trip.customBudget} onClick={goNext}>
            التالي <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderStep6 = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-violet-200">🏨</div>
        <h3 className="text-2xl font-black text-foreground">محتاج فندق؟</h3>
        <p className="text-sm text-muted-foreground font-medium">هل تريد البحث عن إقامة في {trip.destination}?</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => updateTrip({ hotelNeeded: true })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
            trip.hotelNeeded === true
              ? "border-violet-500 bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 shadow-lg"
              : "border-border bg-card hover:border-violet-200"
          )}>
          <span className="text-4xl">👍</span>
          <span className="font-black text-foreground">نعم</span>
          <span className="text-[10px] font-bold text-muted-foreground">أدور لك على فنادق</span>
        </button>
        <button onClick={() => updateTrip({ hotelNeeded: false, hotel: { checkIn: "", checkOut: "", stars: "", roomType: "" } })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
            trip.hotelNeeded === false
              ? "border-rose-500 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-lg"
              : "border-border bg-card hover:border-rose-200"
          )}>
          <span className="text-4xl">👎</span>
          <span className="font-black text-foreground">لا شكراً</span>
          <span className="text-[10px] font-bold text-gray-400">مش محتاج فنادق</span>
        </button>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-muted-foreground border-border" onClick={goBack}>
          <ArrowRight className="w-5 h-5 ml-2" /> رجوع
        </Button>
        <Button className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black shadow-xl shadow-violet-200 gap-3" disabled={trip.hotelNeeded === null} onClick={goNext}>
          {trip.hotelNeeded === false ? "المراجعة النهائية" : "التالي"} <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStep7 = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-pink-500 to-rose-600 mx-auto flex items-center justify-center text-4xl shadow-xl shadow-pink-200 ring-4 ring-white">🏨</div>
        <h3 className="text-2xl font-black text-foreground">متى ستبدأ رحلتك؟</h3>
        <p className="text-sm text-muted-foreground font-medium">حدد تاريخ الوصول وسنقوم بحساب تاريخ المغادرة تلقائياً بناءً على مدة الرحلة ({trip.days} أيام)</p>
      </div>

      <div className="bg-card border-2 border-border rounded-[2.5rem] p-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2 pr-1">
              <Calendar className="w-4 h-4 text-pink-500" /> تاريخ الوصول
            </label>
            <Input 
              type="date" 
              className="h-14 rounded-2xl font-black text-lg border-2 border-border focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all bg-card text-foreground" 
              value={trip.hotel.checkIn} 
              onChange={e => {
                const checkIn = e.target.value;
                if (checkIn && trip.days) {
                  const date = new Date(checkIn);
                  date.setDate(date.getDate() + (trip.days - 1));
                  const checkOut = date.toISOString().split('T')[0];
                  updateHotel({ checkIn, checkOut });
                } else {
                  updateHotel({ checkIn });
                }
              }} 
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2 pr-1">
              <Clock className="w-4 h-4 text-gray-400" /> تاريخ المغادرة (تلقائي)
            </label>
            <div className="relative">
              <Input 
                type="date" 
                readOnly
                className="h-14 rounded-2xl font-black text-lg border-2 border-border bg-accent/50 text-muted-foreground cursor-not-allowed pr-4" 
                value={trip.hotel.checkOut} 
              />
            </div>
          </div>
        </div>

        {trip.hotel.checkIn && trip.hotel.checkOut && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                <Hotel className="w-4 h-4 text-violet-500" /> فنادق مقترحة لك
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] font-black text-violet-600 hover:text-violet-700 h-7"
                onClick={fetchStepHotels}
                disabled={isFetchingStepHotels}
              >
                {isFetchingStepHotels ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Sparkles className="w-3 h-3 ml-1" />}
                تحديث المقترحات
              </Button>
            </div>

            {isFetchingStepHotels ? (
              <div className="flex flex-col items-center justify-center py-10 bg-muted/50 rounded-3xl border-2 border-dashed border-border">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">جاري جلب أفضل العروض...</p>
              </div>
            ) : stepHotels.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {stepHotels.slice(0, 5).map((h, i) => (
                  <div 
                    key={h.location_id || i}
                    onClick={() => updateTrip({ selectedHotel: h })}
                    className={cn(
                      "flex gap-4 p-3 rounded-2xl border-2 transition-all cursor-pointer group",
                      trip.selectedHotel?.location_id === h.location_id 
                        ? "border-violet-500 bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 shadow-sm" 
                        : "border-border bg-card hover:border-violet-200"
                    )}
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-sm relative">
                      <img src={h.photo?.images?.medium?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={h.name} />
                      {trip.selectedHotel?.location_id === h.location_id && (
                        <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h5 className="font-black text-xs text-foreground truncate mb-1">{h.name}</h5>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] font-black text-muted-foreground">{h.rating}</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">•</span>
                        <span className="text-[10px] font-black text-emerald-600">{h.price}</span>
                      </div>
                      <Badge variant="outline" className="text-[8px] px-2 py-0 border-border text-gray-400 font-black">
                        {h.review_word}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-800 leading-relaxed">
                  سنقوم باقتراح أفضل الفنادق المتاحة لك بناءً على ميزانيتك ووجهتك فور انتهاء التخطيط.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-muted-foreground border-border hover:bg-muted" onClick={goBack}>
          <ArrowRight className="w-5 h-5 ml-2" /> رجوع
        </Button>
        <Button 
          className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black shadow-xl shadow-pink-200 gap-3 hover:shadow-2xl transition-all" 
          disabled={!trip.hotel.checkIn || !trip.hotel.checkOut} 
          onClick={goNext}
        >
          المراجعة النهائية <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );

  const estimatedTotal = calcEstimatedTotal(trip);

  const renderStep8 = () => {
    const estimatedTotal = calcEstimatedTotal(trip);
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-indigo-200">✅</div>
        <h3 className="text-2xl font-black text-foreground">مراجعة نهائية</h3>
        <p className="text-sm text-muted-foreground font-medium">راجع التفاصيل وأكّد رحلتك</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 dark:from-indigo-950/20 to-violet-50 dark:to-violet-950/20 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl p-6 space-y-4">
        {mode === 'smart' ? (
          <>
            {[
              { icon: "📍", label: "الوجهة المطلوبة", value: trip.destination },
              { icon: "💰", label: "الميزانية المحددة", value: trip.budget === 'low' ? 'اقتصادية' : trip.budget === 'high' ? 'فاخرة' : 'متوسطة' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-indigo-500/10 dark:border-indigo-500/20 last:border-0">
                <span className="flex items-center gap-2 text-sm font-bold text-indigo-500">
                  <span>{item.icon}</span> {item.label}
                </span>
                <span className="font-black text-foreground text-base">{item.value}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { icon: "📍", label: "الوجهة", value: trip.destination },
              { icon: "🚌", label: "الانطلاق من", value: trip.startCity },
              { icon: trip.transportation?.icon || "🚗", label: "المواصلات", value: trip.transportation ? `${trip.transportation.label} — ${trip.transportation.price} ج.م (${trip.transportation.duration})` : "غير محدد" },
              { icon: "📅", label: "المدة", value: `${trip.days} أيام` },
              { icon: "💰", label: "الميزانية", value: trip.budget === 'low' ? 'اقتصادية' : trip.budget === 'high' ? 'فاخرة' : 'متوسطة' },
              { icon: "🏨", label: "فندق", value: trip.hotelNeeded ? "نعم" : "لا" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-indigo-500/10 dark:border-indigo-500/20 last:border-0">
                <span className="flex items-center gap-2 text-sm font-bold text-indigo-500 dark:text-indigo-400">
                  <span>{item.icon}</span> {item.label}
                </span>
                <span className="font-black text-foreground text-sm text-left max-w-[55%] truncate">{item.value}</span>
              </div>
            ))}

            {trip.hotelNeeded && trip.hotel.checkIn && (
              <div className="flex items-center justify-between py-2 border-b border-indigo-500/10 dark:border-indigo-500/20">
                <span className="flex items-center gap-2 text-sm font-bold text-indigo-500 dark:text-indigo-400">📅 التواريخ</span>
                <span className="font-black text-foreground text-sm">{trip.hotel.checkIn} ➔ {trip.hotel.checkOut}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t-2 border-indigo-200/60 dark:border-indigo-500/30">
              <div>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase block mb-0.5 tracking-widest">التكلفة التقديرية</span>
                <span className="text-[9px] font-bold text-indigo-400 dark:text-indigo-300">مواصلات + إقامة + أنشطة</span>
              </div>
              <span className="font-black text-emerald-600 text-2xl">{estimatedTotal.toLocaleString()} <span className="text-sm">ج.م</span></span>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-muted-foreground border-border" onClick={goBack}>
          <ArrowRight className="w-5 h-5 ml-2" /> رجوع
        </Button>
        <Button 
          className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-xl shadow-indigo-200 gap-3" 
          onClick={mode === 'smart' ? handleSmartSearch : handleConfirmTrip}
          disabled={isSearching || isGeneratingPlan}
        >
          {isSearching || isGeneratingPlan ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : mode === 'smart' ? (
            <>ابحث عن رحلات 🔍</>
          ) : (
            <>ابدأ تخطيط الرحلة 🚀</>
          )}
        </Button>
      </div>
    </motion.div>
    );
  };
  if (mode === "idle") {
    return (
      <div className="min-h-screen flex flex-col bg-background transition-colors duration-500 font-cairo overflow-x-hidden" dir="rtl">
        <Header />
        
        {/* Animated Background Layers */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-indigo-50/30 dark:bg-indigo-950/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-sky-50/30 dark:bg-sky-950/20 rounded-full blur-[150px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <main className="flex-1 flex items-center justify-center relative z-10 px-4 py-12 md:py-20">
          <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Hero Text Section */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8 }}
              className="flex-1 text-right space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black tracking-widest uppercase"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>مستقبلك السياحي يبدأ هنا</span>
                </motion.div>
                
                <h1 className="text-5xl md:text-7xl font-black text-foreground leading-[1.1] tracking-tight">
                  خطّط لرحلتك <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600">بذكاء استثنائي</span>
                </h1>
                
                <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-xl">
                  سواء كنت تبحث عن رحلة جاهزة من تجارب الآخرين، أو تريد تصميم رحلة أحلامك من الصفر بذكائنا الاصطناعي، نحن هنا لنجعلها حقيقة.
                </p>
              </div>

              <div className="flex items-center gap-8 py-4 border-y border-border">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-indigo-600">+١٠٠٠</span>
                  <span className="text-xs font-bold text-gray-400">رحلة ناجحة</span>
                </div>
                <div className="w-px h-10 bg-accent" />
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-violet-600">١٠٠٪</span>
                  <span className="text-xs font-bold text-gray-400">تخصيص كامل</span>
                </div>
                <div className="w-px h-10 bg-accent" />
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-emerald-600">مجاني</span>
                  <span className="text-xs font-bold text-gray-400">للمستخدمين</span>
                </div>
              </div>

              {aiQuota !== null && isSignedIn && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">رصيد الذكاء الاصطناعي</div>
                    <div className={cn("text-sm font-black", aiQuota.isAdmin ? "text-emerald-600" : aiQuota.remaining <= 0 ? "text-rose-600" : "text-indigo-600")}>
                      {aiQuota.isAdmin ? "غير محدود (مدير النظام)" : `${aiQuota.remaining} من أصل ${aiQuota.limit} رحلات متاحة`}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Selection Cards Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 grid grid-cols-1 gap-6 w-full max-w-md lg:max-w-none"
            >
              {/* Custom Trip Card (AI Generation) */}
              <motion.button
                whileHover={{ scale: 1.02, y: -8 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("custom")}
                className="group relative bg-card border border-border rounded-[2.5rem] p-10 text-right hover:border-violet-200 hover:shadow-[0_40px_80px_-20px_rgba(139,92,246,0.15)] transition-all duration-500 overflow-hidden flex items-center gap-8"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-violet-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform duration-500 shadow-inner">
                  <Sparkles className="w-10 h-10 text-violet-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-foreground mb-2 flex items-center justify-end gap-3">
                    <span>رحلة مخصصة</span>
                    <Badge className="bg-violet-600 text-white border-0 font-black text-[10px]">الأكثر تطوراً</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    اصنع برنامجاً سياحياً فريداً من الصفر باستخدام أقوى محرك ذكاء اصطناعي.
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-6 text-violet-600 font-black text-sm">
                    <span>ابدأ التصميم</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.button>

              {/* Smart Search Card (Platform Search) */}
              <motion.button
                whileHover={{ scale: 1.02, y: -8 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("smart")}
                className="group relative bg-card border border-border rounded-[2.5rem] p-10 text-right hover:border-indigo-200 hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.15)] transition-all duration-500 overflow-hidden flex items-center gap-8"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform duration-500 shadow-inner">
                  <Search className="w-10 h-10 text-indigo-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-foreground mb-2">بحث ذكي بالمنصة</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    أدخل وجهتك وميزانيتك وسيقوم الذكاء الاصطناعي باقتراح أفضل رحلة متاحة بالمنصة.
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-6 text-indigo-600 font-black text-sm">
                    <span>ابحث الآن</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.button>

              {!isSignedIn && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 1 }}
                  className="mt-4 p-6 rounded-[2rem] bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50 flex items-center justify-between gap-6 shadow-sm"
                >
                  <div className="flex items-center gap-4 text-amber-900">
                    <div className="w-10 h-10 rounded-full bg-amber-200/50 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-xs font-bold leading-relaxed">
                      سجّل دخولك الآن لتستمتع بمميزات الذكاء الاصطناعي وحفظ رحلاتك!
                    </p>
                  </div>
                  <SignInButton mode="modal">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6 font-black h-10 shadow-lg shadow-amber-200">
                      تسجيل الدخول
                    </Button>
                  </SignInButton>
                </motion.div>
              )}
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      case 8: return renderStep8();
      default: return renderStep1();
    }
  };

  /* ═════════════════════════════════════════════
     RENDER – WIZARD MODE (STEPS)
     ═════════════════════════════════════════════ */

  return (
    <div className="min-h-screen flex flex-col bg-background font-cairo transition-colors duration-500" dir="rtl">
      <Header />
      <div className="fixed inset-0 pointer-events-none opacity-30 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      <main className="flex-1 container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10 relative z-10">
        <div className="max-w-7xl mx-auto h-[calc(100vh-5.5rem)] sm:h-[calc(100vh-6rem)] min-h-[480px] flex flex-col lg:flex-row gap-4 lg:gap-6">

          {/* ════════════════ LEFT PANEL – Results / Preview ════════════════ */}
          <div 
            id="ai-trip-plan-preview"
            className={cn(
            "flex-1 bg-card/70 backdrop-blur-2xl rounded-2xl lg:rounded-[2.5rem] border border-border shadow-xl flex flex-col overflow-hidden min-h-0",
            "lg:flex",
            !tripPlan && filteredTrips.length === 0 && !isGeneratingPlan ? "hidden lg:flex" : "",
            mobileView === 'results' ? "flex" : "hidden lg:flex"
          )}>
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 sm:p-6 lg:p-10">
                {showAgencyRecommendations ? (
                  <TravelAgencyRecommendations
                    destination={trip.destination}
                    days={trip.days}
                    budget={trip.budget}
                    tripSummary={{
                      attractionsCount: selectedAttractions.size,
                      restaurantsCount: selectedRestaurants.size,
                      startCity: trip.startCity || "القاهرة",
                      hotelNeeded: trip.hotelNeeded,
                      checkIn: trip.hotel.checkIn,
                      checkOut: trip.hotel.checkOut,
                      estimatedCost: estimatedTotal,
                    }}
                    onBack={() => {
                      setShowAgencyRecommendations(false);
                      setTravelPreference(null);
                    }}
                    onSaveIndependent={handleCreateTrip}
                  />
                ) : isGeneratingPlan || isSearching ? (
                  <div className="flex flex-col items-center justify-center h-full py-32 space-y-8">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center shadow-xl shadow-indigo-100">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-indigo-200 animate-ping opacity-20" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs animate-bounce">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-black text-foreground">
                        {isSearching ? "جاري البحث في المنصة..." : "جاري هندسة رحلتك..."}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                        {isSearching 
                          ? "ذكاؤنا الاصطناعي يحلل مئات الرحلات بالمنصة ليجد لك الأنسب لميزانيتك ووجهتك." 
                          : "نقوم الآن بالبحث عن أفضل المعالم، المطاعم، والفنادق لنبني لك تجربة لا تُنسى. ✨"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-150" />
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-300" />
                    </div>
                  </div>
                ) : filteredTrips.length > 0 && mode === 'smart' ? (
                  /* Smart Search Results */
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black leading-tight">مقترحات ذكية لك</h3>
                          <p className="text-indigo-100 font-bold text-sm opacity-90 mt-1">لقد قمنا بتحليل {availableTrips.length} رحلة ووجدنا {filteredTrips.length} نتائج تطابق ميزانيتك ووجهتك.</p>
                        </div>
                      </div>
                      <Button variant="outline" className="rounded-2xl font-black text-xs bg-white/10 border-white/20 hover:bg-card text-white hover:text-indigo-600 transition-all px-6 h-12" onClick={resetWizard}>تعديل البحث</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredTrips.map((t, idx) => (
                        <div key={t.id || t._id} className="bg-card border-2 border-border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 group cursor-pointer" onClick={() => navigate(`/trips/${t.id || t._id}`)}>
                          <div className="relative h-56">
                            <img src={t.image || 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={t.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="absolute top-4 right-4 flex gap-2">
                              <Badge className="bg-indigo-600 text-white border-none px-3 py-1 rounded-full font-black text-[10px] shadow-lg shadow-black/20">{t.duration}</Badge>
                              {idx === 0 && <Badge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-full font-black text-[10px] shadow-lg shadow-black/20 animate-pulse">الأكثر مطابقة ✨</Badge>}
                            </div>
                            <div className="absolute bottom-5 right-5 left-5 text-white">
                              <div className="flex items-center gap-2 text-white/80 text-[10px] font-black uppercase tracking-widest mb-2"><MapPin className="w-3 h-3 text-sky-400" /> {t.destination}</div>
                              <h4 className="font-black text-xl mb-1 line-clamp-1 group-hover:text-sky-300 transition-colors">{t.title}</h4>
                            </div>
                          </div>
                          <div className="p-6 flex items-center justify-between bg-card">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-50 overflow-hidden shadow-sm border border-indigo-100/50 p-0.5"><img src={t.authorImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.author}`} alt={t.author} className="w-full h-full object-cover rounded-xl" /></div>
                              <div>
                                <span className="text-[10px] font-black text-gray-400 block uppercase mb-0.5">بواسطة</span>
                                <span className="text-xs font-black text-foreground">{t.author}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-left">
                                <span className="text-[10px] font-black text-muted-foreground block text-left">التقييم</span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  <span className="text-xs font-black text-foreground">{t.rating || "4.8"}</span>
                                </div>
                              </div>
                              <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm"><ArrowUpRight className="w-5 h-5" /></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : tripPlan ? (
                  /* Custom Trip Results */
                  <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="relative rounded-xl lg:rounded-[2rem] overflow-hidden group h-48 sm:h-64 lg:h-80 shadow-2xl">
                      <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900">
                        <img 
                          src="/assets/egypt-map.png" 
                          alt={tripPlan.location.name}
                          className="w-full h-full object-cover opacity-45 mix-blend-overlay scale-105 group-hover:scale-100 transition-transform duration-700"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30 z-10" />
                      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-10 lg:right-10 z-20">
                        <Badge className="bg-indigo-600 text-white border-0 mb-2 sm:mb-3 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-black uppercase text-[9px] sm:text-[10px] tracking-widest shadow-lg">وجهة مقترحة</Badge>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-2 leading-tight drop-shadow-md">{tripPlan.location.name}</h1>
                        <div className="flex items-center gap-4 text-white/95 font-bold">
                          <span className="flex items-center gap-2 bg-black/45 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg"><Clock className="w-4 h-4 text-indigo-300" /> {trip.days} أيام</span>
                        </div>
                      </div>
                    </div>

                    {generatedItinerary ? (
                      /* SMART ITINERARY DISPLAY */
                      <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-indigo-50/50 to-white p-8 rounded-[3rem] border border-indigo-100/50 shadow-sm">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                              <Calendar className="w-8 h-8" />
                            </div>
                            <div>
                              <h3 className="text-3xl font-black text-foreground leading-tight">برنامجك اليومي</h3>
                              <p className="text-sm font-bold text-indigo-600/70 mt-1">تم تنظيم الأماكن المختارة ذكياً حسب الوقت والموقع</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="lg"
                            className="rounded-2xl text-rose-500 hover:text-white hover:bg-rose-500 border-rose-100 hover:border-rose-500 font-black text-sm px-8 h-14 transition-all duration-300 shadow-sm" 
                            onClick={() => setGeneratedItinerary(null)}
                          >
                            إعادة اختيار الأماكن
                          </Button>
                        </div>

                        <div className="space-y-20 relative">
                          <div className="absolute top-4 bottom-4 right-[23px] w-1 bg-gradient-to-b from-indigo-50 via-indigo-100 to-indigo-50 rounded-full hidden md:block" />

                          {generatedItinerary.days.map((day, dIdx) => (
                            <motion.div key={dIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: dIdx * 0.1 }} className="relative md:pr-16">
                              <div className="absolute right-0 top-0 w-12 h-12 rounded-2xl bg-card border-4 shadow-xl z-10 hidden md:flex items-center justify-center" style={{ borderColor: day.color || '#6366f1' }}>
                                <span className="text-sm font-black" style={{ color: day.color || '#6366f1' }}>{dIdx + 1}</span>
                              </div>
                              
                              <div className="mb-10 pt-2">
                                <h4 className="text-2xl font-black text-foreground mb-2">{day.title}</h4>
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-accent text-muted-foreground border-none font-black text-[10px] px-3 py-1 rounded-lg">
                                    {day.activities.length} أنشطة
                                  </Badge>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-8">
                                {day.activities.map((act, aIdx) => {
                                  const original = tripPlan.attractions.find(a => a.name === act.name) || 
                                                   tripPlan.restaurants.find(r => r.name === act.name);
                                  const imgUrl = original?.photo?.images?.large?.url || original?.photo?.images?.medium?.url;

                                  return (
                                    <motion.div 
                                      key={aIdx} 
                                      whileHover={{ y: -5 }}
                                      className="bg-card rounded-[2.5rem] p-6 border border-border shadow-sm hover:shadow-2xl transition-all duration-500 group relative"
                                    >
                                      <div className="flex flex-col md:flex-row gap-8">
                                        <div className="w-full md:w-64 h-48 md:h-auto rounded-[2rem] overflow-hidden shrink-0 shadow-lg relative bg-muted">
                                          {imgUrl ? (
                                            <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={act.name} />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                              <Camera className="w-12 h-12" />
                                            </div>
                                          )}
                                          <div className="absolute top-4 right-4">
                                            <div className="text-[10px] font-black text-white bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl">
                                              {act.time}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex-1 py-2">
                                          <div className="flex items-center gap-3 mb-3">
                                            <h5 className="font-black text-foreground text-xl">{act.name}</h5>
                                            <Badge className={cn(
                                              "text-[9px] font-black h-5 px-2 rounded-lg border-none", 
                                              act.type === 'restaurant' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                                            )}>
                                              {act.type === 'restaurant' ? 'مطعم' : 'معلم'}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-muted-foreground font-bold leading-relaxed mb-6 line-clamp-3">
                                            {act.note || original?.description || "استمتع بزيارة هذا المكان الرائع كجزء من برنامجك اليومي."}
                                          </p>
                                          <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-2 text-xs font-black text-gray-400">
                                              <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {tripPlan.location.name}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </section>
                    ) : (
                      /* Selection View */
                      <div className="space-y-12 animate-in fade-in duration-700">
                        {/* Attractions (Popular Places) */}
                        <section>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                              <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
                                <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-50 flex items-center justify-center text-indigo-600">
                                  <Camera className="w-6 h-6" />
                                </div>
                                أماكن شهيرة في {tripPlan.location.name}
                              </h3>
                              <p className="text-sm font-medium text-gray-400 mt-1">اختر الأماكن التي تود زيارتها ليتم تنظيمها لك</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">المحدد:</span>
                              <Badge className="bg-indigo-600 text-white font-black text-xs px-3 py-1 rounded-lg shadow-lg shadow-indigo-100">{selectedAttractions.size}</Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {tripPlan.attractions.map((item, idx) => {
                              const isSelected = selectedAttractions.has(item.location_id || String(idx));
                              return (
                                <motion.div key={idx} whileHover={{ y: -4 }} className={cn("group bg-card border-2 rounded-[2.5rem] p-4 transition-all duration-300 cursor-pointer relative", isSelected ? "border-indigo-600 shadow-2xl shadow-indigo-100 ring-4 ring-indigo-50/50" : "border-gray-50 hover:border-indigo-200 hover:shadow-xl hover:shadow-gray-100/50")} onClick={() => { const newSet = new Set(selectedAttractions); if (newSet.has(item.location_id || String(idx))) newSet.delete(item.location_id || String(idx)); else newSet.add(item.location_id || String(idx)); setSelectedAttractions(newSet); }}>
                                  <div className="flex gap-5">
                                    <div className="w-24 h-24 rounded-[1.75rem] overflow-hidden shrink-0 shadow-inner bg-muted relative group-hover:rotate-2 transition-transform">
                                      {item.photo?.images?.medium?.url && <img src={item.photo.images.medium.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />}
                                      {isSelected && <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center"><CheckCircle2 className="w-10 h-10 text-white drop-shadow-lg" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                      <div className="flex items-center gap-2 mb-1.5"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /><span className="text-xs font-black text-foreground">{item.rating || "4.5"}</span></div>
                                      <h4 className="font-black text-foreground mb-1.5 truncate text-lg leading-tight group-hover:text-indigo-600 transition-colors">{item.name}</h4>
                                      <p className="text-[10px] font-bold text-gray-400 line-clamp-2 leading-relaxed">{item.description || "استكشف جمال وتاريخ هذا المكان الرائع في " + tripPlan.location.name}</p>
                                    </div>
                                    <div className="absolute top-4 left-4"><Checkbox checked={isSelected} className="rounded-full h-6 w-6 border-2 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" /></div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </section>

                        {/* Restaurants */}
                        <section>
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
                              <div className="w-12 h-12 rounded-[1.25rem] bg-orange-50 flex items-center justify-center text-orange-600">
                                <Utensils className="w-6 h-6" />
                              </div>
                              المطاعم المقترحة
                            </h3>
                            <Badge className="bg-orange-600 text-white font-black text-xs px-3 py-1 rounded-lg shadow-lg shadow-orange-100">{selectedRestaurants.size} محدد</Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {tripPlan.restaurants.slice(0, 6).map((item, idx) => (
                              <div key={`res-${idx}`} className={cn("border-2 rounded-[2rem] p-4 transition-all hover:bg-card hover:shadow-xl cursor-pointer flex flex-col items-center text-center", selectedRestaurants.has(item.location_id || String(idx)) ? "bg-orange-50/30 border-orange-300 ring-4 ring-orange-50" : "bg-card border-gray-50")} onClick={() => { const newSet = new Set(selectedRestaurants); if (newSet.has(item.location_id || String(idx))) newSet.delete(item.location_id || String(idx)); else newSet.add(item.location_id || String(idx)); setSelectedRestaurants(newSet); }}>
                                <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3 shadow-sm relative"><img src={item.photo?.images?.medium?.url} className="w-full h-full object-cover" />{selectedRestaurants.has(item.location_id || String(idx)) && <div className="absolute inset-0 bg-orange-600/20 flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-white" /></div>}</div>
                                <h4 className="font-black text-sm text-foreground truncate w-full mb-1">{item.name}</h4>
                                <Badge variant="outline" className="text-[8px] px-2 py-0 border-orange-100 text-orange-500 font-black mb-2">{item.cuisine?.[0]?.name || "عالمي"}</Badge>
                                <Checkbox checked={selectedRestaurants.has(item.location_id || String(idx))} className="rounded-full" />
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    )}

                    {/* Hotels - Always show when tripPlan exists */}
                    {tripPlan.hotels && tripPlan.hotels.length > 0 && (
                      <section className="border-t border-border pt-10">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <Hotel className="w-6 h-6" />
                            </div>
                            أفضل الفنادق المقترحة
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {tripPlan.hotels.map((item, idx) => {
                            const isSelected = selectedHotels.has(item.location_id || String(idx));
                            return (
                              <motion.div 
                                key={`hotel-${idx}`} 
                                whileHover={{ y: -8 }}
                                className={cn(
                                  "group bg-card border-2 rounded-[2.5rem] p-5 transition-all duration-500 cursor-pointer relative overflow-hidden", 
                                  isSelected ? "border-indigo-600 shadow-2xl shadow-indigo-100 ring-4 ring-indigo-50/50" : "border-gray-50 hover:border-indigo-200 hover:shadow-xl hover:shadow-gray-100/50"
                                )} 
                                onClick={() => { 
                                  const newSet = new Set<string>(); 
                                  newSet.add(item.location_id || String(idx)); 
                                  setSelectedHotels(newSet); 
                                  updateTrip({ selectedHotel: item });
                                }}
                              >
                                <div className="relative h-48 rounded-[2rem] overflow-hidden mb-5 shadow-inner">
                                  <img 
                                    src={item.photo?.images?.large?.url || item.photo?.images?.medium?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                    alt={item.name}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                                  
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                                      <CheckCircle2 className="w-12 h-12 text-white drop-shadow-lg" />
                                    </div>
                                  )}
                                  
                                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                                    {item.is_free_cancellable && (
                                      <Badge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-lg font-black text-[9px] shadow-lg shadow-emerald-500/20">
                                        إلغاء مجاني
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                    <Badge className="bg-card text-indigo-600 border-none px-3 py-1 rounded-lg font-black text-[10px]">
                                      {item.review_word || (parseFloat(item.rating || "0") >= 4.5 ? "ممتاز" : "جيد جداً")}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-black text-foreground truncate text-lg leading-tight flex-1">{item.name}</h4>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                      <span className="text-xs font-black text-foreground">{item.rating || "4.5"}</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-indigo-400" />
                                      <span className="line-clamp-1">{item.address || item.distance_to_center ? `${item.distance_to_center} عن المركز` : tripPlan.location.name}</span>
                                    </div>
                                    {item.amenities && item.amenities.length > 0 && (
                                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        <span>{typeof item.amenities[0] === 'string' ? item.amenities[0] : (item.amenities[0] as any)?.name}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                      <div className="flex gap-0.5">
                                        {[...Array(Math.min(5, Math.round(item.star_rating || 4)))].map((_, i) => (
                                          <Star key={i} className="w-2 h-2 fill-indigo-600 text-indigo-600" />
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">السعر التقديري</span>
                                      <span className="text-base font-black text-indigo-600">
                                        {item.price && item.price !== 'غير متوفر' ? item.price : "اطلب السعر"}
                                      </span>
                                    </div>
                                    <Checkbox checked={isSelected} className="rounded-full h-6 w-6 border-2 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </div>
                ) : (
                  /* Idle Preview */
                  <div className="flex flex-col items-center justify-center text-center py-24 space-y-6 h-full">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center shadow-inner relative">
                      <div className="absolute inset-0 bg-indigo-100 rounded-[2.5rem] animate-ping opacity-20" />
                      <Globe className="h-10 w-10 text-indigo-600 relative z-10" />
                    </div>
                    <div className="max-w-md">
                      <h2 className="text-2xl font-black text-foreground mb-3">أكمل الخطوات لعرض النتائج</h2>
                      <p className="text-gray-400 font-bold leading-relaxed">اختر الوجهة والمدة والميزانية وسنعرض لك أفضل الخيارات هنا</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Bottom Action Bar when results visible */}
            <AnimatePresence>
              {tripPlan && !showAgencyRecommendations && (
                <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="p-4 sm:p-6 border-t border-border bg-card shadow-[0_-10px_40px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative z-50">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{generatedItinerary ? "البرنامج جاهز" : "الخطة المختارة"}</p>
                    <h4 className="text-sm font-black text-foreground">{generatedItinerary ? `${generatedItinerary.days.length} أيام منظمة ذكياً` : `${selectedAttractions.size + selectedRestaurants.size + selectedHotels.size} عناصر`}</h4>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="ghost" className="rounded-2xl font-black text-gray-400" onClick={resetWizard}>إعادة البدء</Button>
                    {!generatedItinerary && <Button className="flex-1 md:min-w-[180px] h-12 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 font-black text-sm gap-2 shadow-sm disabled:opacity-60" onClick={handleGenerateItineraryAction} disabled={isGeneratingItinerary || (selectedAttractions.size === 0 && selectedRestaurants.size === 0)}>{isGeneratingItinerary ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}تنظيم ذكياً</Button>}
                    {travelPreference === null ? (
                      <Button 
                        className="flex-1 md:min-w-[200px] h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm gap-2 shadow-xl shadow-indigo-100" 
                        onClick={() => setShowTravelPreferenceModal(true)}
                        disabled={isCreatingTrip}
                      >
                        أعجبتني هذه الرحلة 🎉
                      </Button>
                    ) : travelPreference === "company" ? (
                      <Button 
                        className="flex-1 md:min-w-[200px] h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-2 shadow-xl shadow-indigo-100" 
                        onClick={() => setShowAgencyRecommendations(true)}
                        disabled={isCreatingTrip}
                      >
                        <Building2 className="w-5 h-5" /> عرض شركات السياحة 🏢
                      </Button>
                    ) : (
                      <Button 
                        className="flex-1 md:min-w-[200px] h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-2 shadow-xl shadow-indigo-100 disabled:opacity-60" 
                        onClick={handleCreateTrip} 
                        disabled={isCreatingTrip || (aiQuota !== null && !aiQuota?.isAdmin && aiQuota.remaining <= 0)}
                      >
                        {isCreatingTrip ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        {generatedItinerary ? "حفظ المنظمة وحجز مستقل 💾" : "حفظ الرحلة وحجز مستقل 💾"}
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ════════════════ RIGHT PANEL – Wizard Stepper ════════════════ */}
          <div className={cn(
            "w-full lg:w-[460px] bg-card rounded-2xl lg:rounded-[2.5rem] border border-border shadow-xl flex flex-col overflow-hidden min-h-0 shrink-0",
            "animate-in fade-in slide-in-from-left-4 duration-500",
            tripPlan && mobileView === 'results' ? "hidden lg:flex" : "flex"
          )}>
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-50 bg-gradient-to-br from-gray-50/80 to-white shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button onClick={resetWizard} className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-muted-foreground hover:bg-gray-200 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="font-black text-foreground text-base leading-none">
                      {mode === 'smart' ? '🔍 بحث ذكي' : '✨ رحلة مخصصة'}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 mt-0.5 block">
                      الخطوة {mode === 'smart' ? (step === 1 ? 1 : step === 5 ? 2 : 3) : step} من {mode === 'smart' ? 3 : (trip.hotelNeeded === false ? 7 : 8)}
                    </span>
                  </div>
                </div>
                {aiQuota !== null && isSignedIn && (
                  <Badge className={cn("rounded-lg font-black text-[10px]", aiQuota.isAdmin ? "bg-emerald-50 text-emerald-600" : aiQuota.remaining <= 0 ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600")}>
                    {aiQuota.isAdmin ? "∞" : `${aiQuota.remaining}/${aiQuota.limit}`}
                  </Badge>
                )}
              </div>

              {/* Progress Stepper */}
              <div className="flex items-center gap-1">
                {(mode === 'smart' ? SMART_STEPS_CONFIG : effectiveSteps).map((s, idx) => {
                  const isActive = step === s.id;
                  const isDone = mode === 'smart' 
                    ? (step > s.id || (step === 8 && s.id === 5)) 
                    : step > s.id;
                  return (
                    <div key={s.id} className="flex-1">
                      <div className={cn(
                        "h-1.5 rounded-full transition-all duration-500",
                        isDone ? "bg-emerald-500" : isActive ? "bg-indigo-600" : "bg-accent"
                      )} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <ScrollArea className="flex-1 min-h-0 relative z-10">
              <div className="p-5 sm:p-6 pb-32 lg:pb-10">
                <AnimatePresence mode="wait">
                  {renderCurrentStep()}
                </AnimatePresence>
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Mobile Toggle */}
            {(tripPlan || filteredTrips.length > 0) && (
              <div className="lg:hidden p-3 border-t border-border bg-muted/50 relative z-50">
                <div className="flex bg-card p-1 rounded-xl border border-border shadow-inner">
                  <button onClick={() => setMobileView('wizard')} className={cn("flex-1 py-2.5 rounded-lg font-black text-xs transition-all", mobileView === 'wizard' ? "bg-indigo-600 text-white shadow-md" : "text-muted-foreground")}>
                    الخطوات
                  </button>
                  <button onClick={() => setMobileView('results')} className={cn("flex-1 py-2.5 rounded-lg font-black text-xs transition-all", mobileView === 'results' ? "bg-indigo-600 text-white shadow-md" : "text-muted-foreground")}>
                    النتائج
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weather Widget */}
        {trip.destination && (
          <div className="fixed bottom-6 right-6 md:right-10 z-[40] lg:z-[100] group">
            <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto max-w-[calc(100vw-3rem)] origin-bottom-right">
              <div className="relative w-[320px] sm:w-[500px] md:w-[650px] lg:w-[820px] bg-card rounded-[2.5rem] p-5 lg:p-8 shadow-[0_30px_100px_-20px_rgba(79,70,229,0.4)] border border-indigo-100 overflow-hidden ring-8 ring-indigo-50/50">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 px-2 lg:px-4 gap-4">
                  <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Cloud className="w-6 h-6" /></div><div><h3 className="text-xl font-black text-foreground leading-none">توقعات الطقس: {trip.destination}</h3><p className="text-xs font-bold text-muted-foreground mt-2">خطة طقس لـ 7 أيام قادمة</p></div></div>
                  <Badge className="bg-indigo-600 text-white px-6 py-2 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100">{trip.destination}</Badge>
                </div>
                <div className="w-full"><CityWeatherAdvisor cityName={trip.destination} layout="horizontal" /></div>
              </div>
            </div>
            <motion.button initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} whileHover={{ scale: 1.1, rotate: -2 }} whileTap={{ scale: 0.95 }} className="group flex items-center gap-3 px-6 py-4 rounded-3xl bg-indigo-600 text-white shadow-[0_15px_40px_-10px_rgba(79,70,229,0.5)] transition-all font-black text-sm relative overflow-hidden border-[3px] border-white">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="relative"><Sun className="h-6 w-6 text-yellow-300 animate-spin-slow" /><Cloud className="h-3 w-3 absolute -bottom-1 -right-1 text-white" /></div>
                <div className="flex flex-col items-start leading-tight"><span className="text-[9px] text-indigo-100 uppercase tracking-widest">عرض التوقعات</span><span>طقس {trip.destination}</span></div>
                <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
            </motion.button>
          </div>
        )}
        {/* Travel Preference Modal overlay */}
        <TravelPreferenceModal
          open={showTravelPreferenceModal}
          onClose={() => setShowTravelPreferenceModal(false)}
          onSelectCompany={() => {
            setTravelPreference('company');
            setShowTravelPreferenceModal(false);
            setShowAgencyRecommendations(true);
          }}
          onSelectIndependent={() => {
            setTravelPreference('independent');
            setShowTravelPreferenceModal(false);
            handleCreateTrip();
          }}
          destination={trip.destination}
          days={trip.days}
        />
      </main>

      <Footer />
    </div>
  );
};

export default TripAIChat;
