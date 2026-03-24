import { useState, useRef, useEffect } from "react";
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
  ArrowDown,
  LayoutGrid,
  MapPin,
  Info,
  Cloud,
  Sun,
  SunDim,
} from "lucide-react";
import { getTripPlan, type TripPlan } from "@/lib/travel-advisor-api";
import { useToast } from "@/hooks/use-toast";
import { createTrip, listTrips, getAITripQuota, recordAIPlanUsage } from "@/lib/api";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { getCurrentSeason } from "@/lib/season-utils";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { sendMessageToAI, generateItinerary, type AIResponse, type ItineraryDay, type GeneratedItineraryResponse } from "@/lib/openrouter-client";
import CityWeatherAdvisor from "@/components/CityWeatherAdvisor";

type Message = {
  id: number;
  type: 'ai' | 'user';
  text: string;
  timestamp: Date;
  suggestedPlatformTrips?: { id: string; title: string; matchReason: string; image?: string; price?: string }[];
  weatherForCity?: string;
};

type ExtractedData = {
  destination: string | null;
  days: number | null;
  budget: "low" | "medium" | "high" | null;
  tripType: string | null;
  season: string | null;
};

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

const TripAIChat = () => {
  const { isSignedIn, getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      text: 'مرحباً بك! أنا TripAI، مستشارك الشخصي لتخطيط الرحلات. 🌍✨ يسعدني مساعدتك في تصميم رحلة استثنائية. أخبرني، ما هي وجهتك القادمة؟',
      timestamp: new Date(),
    },
  ]);

  const [userInput, setUserInput] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    destination: null,
    days: null,
    budget: null,
    tripType: null,
    season: null,
  });
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [selectedAttractions, setSelectedAttractions] = useState<Set<string>>(new Set());
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<string>>(new Set());
  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set());
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [aiQuota, setAiQuota] = useState<{ count: number; limit: number; remaining: number; nextRestoreTime?: string } | null>(null);
  const [mobileView, setMobileView] = useState<'chat' | 'plan'>('chat'); // For mobile: which panel to show
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<GeneratedItineraryResponse | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
        try {
            const res = await listTrips({ limit: 50, sort: 'likes' });
            if (res.items) {
                setAvailableTrips(res.items);
            }
        } catch (e) {
            console.error("Failed to fetch trips for AI", e);
        }
    };
    fetchTrips();
  }, []);

  const refreshQuota = async () => {
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
  };

  useEffect(() => {
    refreshQuota();
  }, [isSignedIn]);

  const { toast } = useToast();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.closest('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: "smooth"
          });
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading, isGeneratingPlan]);

  const addMessage = (type: 'ai' | 'user', text: string, suggestions?: { id: string; title: string; matchReason: string; image?: string; price?: string }[], weatherCity?: string) => {
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      type,
      text,
      timestamp: new Date(),
      suggestedPlatformTrips: suggestions,
      weatherForCity: weatherCity
    }]);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;
    if (!isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لاستخدام المحادثة والذكاء الاصطناعي",
        variant: "destructive",
      });
      return;
    }

    const userMessage = userInput.trim();
    setUserInput('');
    addMessage('user', userMessage);

    setIsLoading(true);
    try {
      // Build conversation context with extracted data
      const contextMessage = extractedData.destination || extractedData.days
        ? `المعلومات المستخرجة حتى الآن: ${JSON.stringify(extractedData, null, 2)}`
        : '';

      const updatedHistory = [
        ...conversationHistory,
        ...(contextMessage ? [{ role: 'system', content: contextMessage }] : []),
      ];



      const response: AIResponse = await sendMessageToAI(userMessage, updatedHistory, extractedData, availableTrips);


      // Add AI response to messages
      addMessage(
        'ai', 
        response.reply, 
        response.suggestedPlatformTrips,
        response.shouldGeneratePlan ? (response.extractedData.destination || extractedData.destination || undefined) : undefined
      );

      // Update conversation history
      setConversationHistory([
        ...updatedHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response.reply },
      ]);

      // Merge extracted data (keep previous values if new ones are null)
      setExtractedData(prev => ({
        destination: response.extractedData.destination || prev.destination,
        days: response.extractedData.days || prev.days,
        budget: response.extractedData.budget || prev.budget,
        tripType: response.extractedData.tripType || prev.tripType,
        season: response.extractedData.season || prev.season,
      }));

      // Update estimated price
      if (response.estimatedPriceEGP !== null) {
        setEstimatedPrice(response.estimatedPriceEGP);
      }

      // Handle awaiting confirmation state
      if (response.awaitingConfirmation !== undefined) {
        setAwaitingConfirmation(response.awaitingConfirmation);
      }

      // Check if we should generate the plan (only after confirmation)
      if (response.shouldGeneratePlan && !tripPlan) {
        setAwaitingConfirmation(false);
        setTimeout(() => {
          fetchTripPlan(
            response.extractedData.destination || extractedData.destination,
            response.extractedData.days || extractedData.days
          );
        }, 1000);
      }
    } catch (error: any) {
      addMessage('ai', error.message || 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTripPlan = async (destination: string | null, days: number | null) => {
    if (!destination || !days) return;

    // Check quota before generating (if signed in and quota available)
    if (isSignedIn && aiQuota !== null && aiQuota.remaining <= 0) {
      toast({
        title: "تم استنفاد الحد الأسبوعي",
        description: `لقد استخدمت ${aiQuota.limit} خطط رحلات بالذكاء الاصطناعي هذا الأسبوع. يرجى المحاولة الأسبوع المقبل.`,
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPlan(true);
    addMessage('ai', 'رائع! جاري البحث عن أفضل الأماكن والفنادق والمطاعم في ' + destination + '... 🔍✨');

    try {
      const plan = await getTripPlan(destination, days, extractedData.budget || undefined);
      
      if (plan) {
        setTripPlan(plan);
        // Record usage and update quota when plan is shown (counts toward 5/week)
        if (isSignedIn) {
          try {
            const token = await getToken();
            if (token) {
              const updated = await recordAIPlanUsage(token);
              if (updated) setAiQuota(updated);
            }
          } catch (e) {
            // Endpoint may not exist on older deployments - quota stays as is
          }
        }
        const allAttractions = new Set(plan.attractions.map((a, idx) => a.location_id || idx.toString()));
        const allRestaurants = new Set(plan.restaurants.map((r, idx) => r.location_id || idx.toString()));
        const allHotels = new Set(plan.hotels.map((h, idx) => h.location_id || idx.toString()));
        setSelectedAttractions(allAttractions);
        setSelectedRestaurants(allRestaurants);
        setSelectedHotels(allHotels);
        setMobileView('plan'); // Show plan on mobile when ready for user to confirm & choose
        setTimeout(() => {
          addMessage('ai', `تم! 🎉 لقد جهزت لك خطة رحلة متكاملة إلى ${destination}. يمكنك الآن مراجعة المعالم والمطاعم والفنادق واختيار ما يناسبك، ثم اضغط على "تنظيم الرحلة" لأقوم بترتيبها لك حسب الأيام.`);
        }, 500);
      } else {
        addMessage('ai', 'عذراً، لم أتمكن من إيجاد معلومات كافية عن هذه الوجهة. هل تريد تجربة وجهة أخرى؟');
      }
    } catch (error: any) {
      addMessage('ai', 'واجهت مشكلة أثناء البحث عن الأماكن. دعنا نحاول مرة أخرى.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateFullItinerary = async () => {
    if (!tripPlan) return;
    
    setIsGeneratingItinerary(true);
    try {
      const selectedAttractionsList = tripPlan.attractions
        .filter((a, idx) => selectedAttractions.has(a.location_id || String(idx)))
        .map(a => ({
          name: a.name,
          type: 'attraction' as const,
          lat: parseFloat(a.latitude || "0"),
          lng: parseFloat(a.longitude || "0")
        }));
        
      const selectedRestaurantsList = tripPlan.restaurants
        .filter((r, idx) => selectedRestaurants.has(r.location_id || String(idx)))
        .map(r => ({
          name: r.name,
          type: 'restaurant' as const,
          lat: parseFloat(r.latitude || "0"),
          lng: parseFloat(r.longitude || "0")
        }));
        
      const allSelected = [...selectedAttractionsList, ...selectedRestaurantsList];
      
      if (allSelected.length === 0) {
        toast({ title: "تنبيه", description: "يرجى اختيار مكان واحد على الأقل.", variant: "destructive" });
        return;
      }
      
      const itinerary = await generateItinerary(
        extractedData.destination || tripPlan.location.name,
        extractedData.days || 3,
        allSelected
      );
      
      setGeneratedItinerary(itinerary);
      toast({ title: "تم تنظيم الرحلة", description: "لقد رتبت لك الأماكن حسب الأيام لتقليل مسافات التنقل." });
    } catch (error: any) {
      toast({ title: "فشل التنظيم", description: "حدث خطأ أثناء تنظيم الرحلة. حاول مرة أخرى.", variant: "destructive" });
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!tripPlan || !isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لحفظ رحلتك.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingTrip(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("يرجى إعادة تسجيل الدخول");

      const selectedAttractionsList = tripPlan.attractions.filter((a, idx) => selectedAttractions.has(a.location_id || String(idx)));
      const selectedRestaurantsList = tripPlan.restaurants.filter((r, idx) => selectedRestaurants.has(r.location_id || String(idx)));
      const selectedHotelsList = tripPlan.hotels.filter((h, idx) => selectedHotels.has(h.location_id || String(idx)));

      let activities: any[] = [];
      let finalDays: any[] = [];

      if (generatedItinerary) {
        // Use the AI-generated itinerary
        let actCounter = 0;
        generatedItinerary.days.forEach((day, dayIdx) => {
          const dayActs: number[] = [];
          day.activities.forEach(act => {
             const originalAttract = selectedAttractionsList.find(a => a.name === act.name);
             const originalRest = selectedRestaurantsList.find(r => r.name === act.name);
             const original = originalAttract || originalRest;
             
             activities.push({
               name: act.name,
               images: original?.photo?.images?.large?.url 
                 ? [original.photo.images.large.url] 
                 : (original?.photo?.images?.medium?.url ? [original.photo.images.medium.url] : []),
               day: day.dayNum,
               color: day.color,
               time: act.time,
               note: act.note,
               description: original?.description || (act.type === 'restaurant' && originalRest ? (originalRest.cuisine?.[0]?.name ? `مطعم ${originalRest.cuisine[0].name}` : 'مطعم ومأكولات شهية') : 'نشاط سياحي ممتع'),
               rating: original?.rating,
               address: original?.address,
               price: (original as any)?.price || original?.price_level || "غير متوفر",
               type: act.type,
               coordinates: {
                lat: act.coordinates?.lat || parseFloat(tripPlan.location.latitude || "30.0444"),
                lng: act.coordinates?.lng || parseFloat(tripPlan.location.longitude || "31.2357"),
               }
             });
             dayActs.push(actCounter++);
          });
          let hotelObj = undefined;
          if (selectedHotelsList.length > 0) {
            const h = selectedHotelsList[dayIdx % selectedHotelsList.length];
            hotelObj = { name: h.name, image: h.photo?.images?.medium?.url, rating: h.rating, address: h.address, priceRange: h.price };
          }

          finalDays.push({
            title: day.title,
            activities: dayActs,
            color: day.color,
            hotel: hotelObj
          });
        });
      } else {
        // Default simple distribution
        activities = selectedAttractionsList.map((attraction, idx) => ({
          name: attraction.name,
          images: attraction.photo?.images?.large?.url ? [attraction.photo.images.large.url] : (attraction.photo?.images?.medium?.url ? [attraction.photo.images.medium.url] : []),
          day: Math.floor(idx / 3) + 1,
          time: "10:00 صباحاً", // Add default time for the fallback
          description: attraction.description || 'نشاط سياحي ممتع',
          rating: attraction.rating,
          address: attraction.address,
          price: (attraction as any).price || attraction.price_level || "غير متوفر",
          type: 'attraction',
          coordinates: {
            lat: parseFloat(attraction.latitude || tripPlan.location.latitude || "30.0444"),
            lng: parseFloat(attraction.longitude || tripPlan.location.longitude || "31.2357"),
          }
        }));

        const numDays = extractedData.days || 3;
        finalDays = Array.from({ length: numDays }, (_, i) => {
          let hotelObj = undefined;
          if (selectedHotelsList.length > 0) {
            const h = selectedHotelsList[i % selectedHotelsList.length];
            hotelObj = { name: h.name, image: h.photo?.images?.medium?.url, rating: h.rating, address: h.address, priceRange: h.price };
          }
          return {
            title: `اليوم ${i + 1}`,
            activities: activities
              .map((_, idx) => idx)
              .filter((_, idx) => Math.floor(idx / 3) === i),
            hotel: hotelObj
          };
        });
      }

      const numDays = extractedData.days || 3;
      const budgetMap = { low: "اقتصادية", medium: "متوسطة", high: "فاخرة" };
      
      const defaultDescription = `رحلة ذكية تم تصميمها بواسطة TripAI إلى ${extractedData.destination} لمدة ${numDays} أيام${extractedData.tripType ? ` - ${extractedData.tripType}` : ''}. تتضمن ${selectedAttractionsList.length} معلم سياحي، ${selectedRestaurantsList.length} مطعم، و ${selectedHotelsList.length} فندق.`;
      
      const tripData = {
        title: generatedItinerary?.title || `رحلة ${extractedData.destination} - ${numDays} أيام`,
        destination: tripPlan.location.name,
        city: extractedData.destination || tripPlan.location.name,
        duration: `${numDays} أيام`,
        rating: 4.8,
        image: selectedAttractionsList[0]?.photo?.images?.large?.url || selectedAttractionsList[0]?.photo?.images?.medium?.url || "",
        description: generatedItinerary?.description || defaultDescription,
        budget: extractedData.budget ? budgetMap[extractedData.budget] : (estimatedPrice ? `${estimatedPrice} جنيه مصري` : "غير محدد"),
        season: extractedData.season || getCurrentSeason(),
        activities: activities,
        days: finalDays,
        foodAndRestaurants: selectedRestaurantsList.map(r => ({
          name: r.name,
          image: r.photo?.images?.medium?.url || "",
          rating: parseFloat(r.rating || "4.5"),
          description: r.cuisine?.[0]?.name || "عالمي",
        })),
        hotels: selectedHotelsList.map(h => ({
          name: h.name,
          image: h.photo?.images?.medium?.url || "",
          rating: parseFloat(h.rating || "4.5"),
          priceRange: h.price || "غير متوفر",
          description: h.address || "فندق متميز",
          address: h.address || "",
          amenities: h.amenities?.map(a => typeof a === 'string' ? a : a.name) || [],
          coordinates: {
            lat: parseFloat(h.latitude || tripPlan?.location?.latitude || "0"),
            lng: parseFloat(h.longitude || tripPlan?.location?.longitude || "0")
          }
        })),
        isAIGenerated: true,
      };

      const createdTrip = await createTrip(tripData, token);
      toast({ title: "تم الحفظ بنجاح", description: "رحلتك الآن في ملفك الشخصي." });
      refreshQuota();
      navigate(`/trips/${createdTrip._id || createdTrip.id}`);
    } catch (error: any) {
      toast({ title: "فشل الحفظ", description: error.message || "حدث خطأ غير متوقع.", variant: "destructive" });
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFF] font-cairo" dir="rtl">
      <Header />
      
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-sky-100 rounded-full blur-[120px]" />
      </div>

      <main className="flex-1 container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10 relative z-10">
        <div className="max-w-7xl mx-auto h-[calc(100vh-5.5rem)] sm:h-[calc(100vh-6rem)] min-h-[480px] flex flex-col lg:flex-row gap-4 lg:gap-8">
          
          {/* Result Panel (Right now) - Trip plan to confirm & choose favourites */}
          <div id="ai-trip-plan-preview" className={cn(
            "flex-1 bg-white/70 backdrop-blur-2xl rounded-2xl lg:rounded-[2.5rem] border border-gray-100/50 shadow-xl lg:shadow-2xl shadow-indigo-500/5 flex flex-col overflow-hidden min-h-0",
            tripPlan && "animate-in fade-in slide-in-from-right-4 duration-500",
            "lg:flex",
            !tripPlan && "hidden lg:flex",
            tripPlan && mobileView === 'plan' && "flex",
            tripPlan && mobileView === 'chat' && "hidden lg:flex"
          )}>
             <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 sm:p-6 lg:p-12">
                   {!tripPlan ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-24">
                         <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center mb-8 animate-bounce transition-all duration-1000">
                            <Sparkles className="h-10 w-10 text-indigo-600" />
                         </div>
                         <h2 className="text-3xl font-black text-gray-900 mb-4">جاري الاستماع إليك...</h2>
                         <p className="text-gray-400 font-bold max-w-sm mb-8">أخبرني عن رحلتك المثالية وسأقوم بتصميم خطة متكاملة لك</p>
                         
                         {/* Show extracted data preview */}
                         {(extractedData.destination || extractedData.days || extractedData.budget) && (
                           <div className="bg-indigo-50/50 rounded-2xl p-6 max-w-md space-y-3">
                             <h3 className="text-sm font-black text-indigo-900 mb-3">المعلومات المستخرجة:</h3>
                             {extractedData.destination && (
                               <div className="flex items-center gap-3 text-sm">
                                 <Badge className="bg-indigo-600 text-white">الوجهة</Badge>
                                 <span className="font-bold text-gray-700">{extractedData.destination}</span>
                               </div>
                             )}
                             {extractedData.days && (
                               <div className="flex items-center gap-3 text-sm">
                                 <Badge className="bg-emerald-600 text-white">المدة</Badge>
                                 <span className="font-bold text-gray-700">{extractedData.days} أيام</span>
                               </div>
                             )}
                             {extractedData.budget && (
                               <div className="flex items-center gap-3 text-sm">
                                 <Badge className="bg-purple-600 text-white">الميزانية</Badge>
                                 <span className="font-bold text-gray-700">
                                   {extractedData.budget === 'low' ? 'اقتصادية' : extractedData.budget === 'medium' ? 'متوسطة' : 'فاخرة'}
                                 </span>
                               </div>
                             )}
                             {extractedData.tripType && (
                               <div className="flex items-center gap-3 text-sm">
                                 <Badge className="bg-orange-600 text-white">نوع الرحلة</Badge>
                                 <span className="font-bold text-gray-700">{extractedData.tripType}</span>
                               </div>
                             )}
                             {estimatedPrice && (
                               <div className="flex items-center gap-3 text-sm mt-4 pt-4 border-t border-indigo-100">
                                 <Badge className="bg-rose-600 text-white">السعر المتوقع</Badge>
                                 <span className="font-bold text-gray-700">{estimatedPrice.toLocaleString()} جنيه مصري</span>
                               </div>
                             )}
                           </div>
                         )}
                      </div>
                   ) : (
                      <div className="space-y-8 lg:space-y-12 animate-in fade-in duration-500">
                         {/* Confirmation banner - review and choose favourites */}
                         <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-indigo-600 shrink-0" />
                            <div>
                               <h3 className="font-black text-indigo-900">راجع خطتك واختر المفضلة</h3>
                               <p className="text-sm font-bold text-indigo-600">اختر المعالم والمطاعم والفنادق التي تريدها ثم اضغط حفظ الرحلة</p>
                            </div>
                         </div>
                         {/* Location Header */}
                         <div className="relative rounded-xl lg:rounded-[2rem] overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                            <img 
                              src={tripPlan.attractions?.[0]?.photo?.images?.large?.url || tripPlan.attractions?.[0]?.photo?.images?.medium?.url} 
                              alt=""
                              className="w-full h-48 sm:h-64 lg:h-80 object-cover group-hover:scale-110 transition-transform duration-1000"
                            />
                            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-10 lg:right-10 z-20">
                               <Badge className="bg-indigo-600 text-white border-0 mb-2 sm:mb-3 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-black uppercase text-[9px] sm:text-[10px] tracking-widest shadow-lg">وجهة مقترحة</Badge>
                               <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-2 leading-tight">{tripPlan.location.name}</h1>
                               <div className="flex items-center gap-4 text-white/80 font-bold">
                                  <span className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                     <Clock className="w-4 h-4 text-sky-400" /> {extractedData.days} {extractedData.days === 1 ? 'يوم' : 'أيام'}
                                  </span>
                                  {extractedData.tripType && (
                                    <span className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                       <Zap className="w-4 h-4 text-orange-400" /> {extractedData.tripType}
                                    </span>
                                  )}
                               </div>
                            </div>
                         </div>

                          {/* Results Content */}
                          <div className="space-y-16 pb-24">
                            {generatedItinerary ? (
                              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-8">
                                   <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                         <LayoutGrid className="w-5 h-5" />
                                      </div>
                                      برنامج الرحلة المُنظم ذكياً
                                   </h3>
                                   <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setGeneratedItinerary(null)} 
                                    className="rounded-xl font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                   >
                                     تعديل الاختيارات
                                   </Button>
                                </div>
                                <div className="space-y-12">
                                   {generatedItinerary.days.map((day, idx) => (
                                      <div key={idx} className="relative pr-8 border-r-2" style={{ borderRightColor: day.color + '40' }}>
                                         <div className="absolute top-0 right-[-11px] w-5 h-5 rounded-full border-4 border-white shadow-sm" style={{ backgroundColor: day.color }} />
                                         <div className="flex items-center gap-4 mb-6">
                                            <Badge style={{ backgroundColor: day.color }} className="text-white border-0 font-black">اليوم {day.dayNum}</Badge>
                                            <h4 className="text-2xl font-black" style={{ color: day.color }}>{day.title}</h4>
                                         </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {day.activities.map((act, actIdx) => (
                                               <div 
                                                key={actIdx} 
                                                className="bg-white border-2 rounded-[2rem] p-5 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all" 
                                                style={{ borderColor: day.color + '15' }}
                                               >
                                                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" style={{ backgroundColor: day.color + '10', color: day.color }}>
                                                     {act.type === 'restaurant' ? <Utensils className="w-7 h-7" /> : <Camera className="w-7 h-7" />}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                     <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-wider opacity-70" style={{ color: day.color }}>{act.time}</span>
                                                        <h5 className="font-black text-gray-900 truncate text-lg">{act.name}</h5>
                                                     </div>
                                                     <p className="text-xs text-gray-500 font-bold line-clamp-2 leading-relaxed">{act.note}</p>
                                                  </div>
                                               </div>
                                            ))}
                                         </div>
                                      </div>
                                   ))}
                                </div>
                              </section>
                            ) : (
                             <>
                               {/* Attractions Group */}
                               <section>
                                  <div className="flex items-center justify-between mb-8">
                                     <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                           <Camera className="w-5 h-5" />
                                        </div>
                                        المعالم والأنشطة
                                     </h3>
                                     <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg">{selectedAttractions.size} معلم محدد</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     {tripPlan.attractions.map((item, idx) => (
                                        <div 
                                         key={idx} 
                                         className={cn(
                                           "group border-2 rounded-[2rem] p-5 transition-all duration-300 cursor-pointer relative",
                                           selectedAttractions.has(item.location_id || String(idx)) 
                                             ? "bg-white border-indigo-600 shadow-xl shadow-indigo-500/5 ring-4 ring-indigo-50" 
                                             : "bg-gray-50/50 border-gray-100 hover:border-indigo-200"
                                         )}
                                         onClick={() => {
                                            const newSet = new Set(selectedAttractions);
                                            if (newSet.has(item.location_id || String(idx))) newSet.delete(item.location_id || String(idx));
                                            else newSet.add(item.location_id || String(idx));
                                            setSelectedAttractions(newSet);
                                         }}
                                        >
                                           <div className="flex gap-5">
                                              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-inner bg-gray-200">
                                                 {item.photo?.images?.medium?.url && <img src={item.photo.images.medium.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />}
                                              </div>
                                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                 <h4 className="font-black text-gray-900 mb-1 truncate text-lg">{item.name}</h4>
                                                 <div className="flex items-center gap-2">
                                                    <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                                                    <span className="text-xs font-black text-gray-600">{item.rating || "4.5"}</span>
                                                 </div>
                                              </div>
                                              <Checkbox checked={selectedAttractions.has(item.location_id || String(idx))} className="rounded-full h-6 w-6 border-2 data-[state=checked]:bg-indigo-600" />
                                           </div>
                                        </div>
                                     ))}
                                  </div>
                               </section>
   
                               {/* Restaurants */}
                               <section>
                                  <div className="flex items-center justify-between mb-8">
                                     <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                           <Utensils className="w-5 h-5" />
                                        </div>
                                        المطاعم المقترحة
                                     </h3>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     {tripPlan.restaurants.slice(0, 6).map((item, idx) => (
                                        <div 
                                         key={`res-${idx}`} 
                                         className={cn(
                                           "border border-gray-100 rounded-3xl p-4 transition-all hover:bg-white hover:shadow-lg cursor-pointer flex flex-col items-center text-center",
                                           selectedRestaurants.has(item.location_id || String(idx)) && "bg-orange-50/30 border-orange-200"
                                         )}
                                         onClick={() => {
                                           const newSet = new Set(selectedRestaurants);
                                           if (newSet.has(item.location_id || String(idx))) newSet.delete(item.location_id || String(idx));
                                           else newSet.add(item.location_id || String(idx));
                                           setSelectedRestaurants(newSet);
                                         }}
                                        >
                                           <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-sm">
                                              <img src={item.photo?.images?.medium?.url} className="w-full h-full object-cover" />
                                           </div>
                                           <h4 className="font-black text-sm text-gray-900 truncate w-full mb-1">{item.name}</h4>
                                           <div className="flex items-center gap-1.5 justify-center mb-3">
                                              <Badge variant="outline" className="text-[8px] px-2 py-0 border-orange-100 text-orange-500 font-black">{item.cuisine?.[0]?.name || "عالمي"}</Badge>
                                           </div>
                                           <Checkbox checked={selectedRestaurants.has(item.location_id || String(idx))} className="rounded-full" />
                                        </div>
                                     ))}
                                  </div>
                               </section>

                               {/* Hotels (New 3-Hotel Suggestion) */}
                               {tripPlan.hotels && tripPlan.hotels.length > 0 && (
                                <section className="mt-8 border-t border-gray-100 pt-8">
                                  <div className="flex items-center justify-between mb-8">
                                     <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                           <MapPin className="w-5 h-5" />
                                        </div>
                                        ترشيحات الإقامة (اختر فندقاً واحداً)
                                     </h3>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     {tripPlan.hotels.map((item, idx) => {
                                        const isSelected = selectedHotels.has(item.location_id || String(idx));
                                        return (
                                        <div 
                                         key={`hotel-${idx}`} 
                                         className={cn(
                                           "border border-gray-200 rounded-3xl p-4 transition-all hover:bg-white hover:shadow-lg cursor-pointer flex flex-col items-center text-center",
                                           isSelected && "bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-200"
                                         )}
                                         onClick={() => {
                                           const newSet = new Set<string>();
                                           newSet.add(item.location_id || String(idx));
                                           setSelectedHotels(newSet);
                                         }}
                                        >
                                           <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-sm relative">
                                              <img src={item.photo?.images?.medium?.url} className="w-full h-full object-cover" />
                                              {isSelected && (
                                                <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                                                  <CheckCircle2 className="w-8 h-8 text-white drop-shadow-md" />
                                                </div>
                                              )}
                                           </div>
                                           <h4 className="font-black text-sm text-gray-900 line-clamp-2 w-full mb-1">{item.name}</h4>
                                           <div className="flex items-center gap-1.5 justify-center mb-3">
                                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                              <span className="text-xs font-black text-gray-600">{item.rating || "4.5"}</span>
                                           </div>
                                           {item.price && item.price !== 'غير متوفر' && (
                                              <Badge className="bg-emerald-50 text-emerald-600 border-none mb-3 font-bold">{item.price}</Badge>
                                           )}
                                           <div className={cn(
                                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                              isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300"
                                           )}>
                                             {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                           </div>
                                        </div>
                                     )})}
                                  </div>
                               </section>
                               )}
                             </>
                            )}
                         </div>
                      </div>
                   )}
                </div>
             </ScrollArea>
             
             {/* Bottom Action Bar */}
             <AnimatePresence>
                {tripPlan && (
                  <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="p-4 sm:p-6 lg:p-8 border-t border-gray-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                     <div className="sm:block">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          {generatedItinerary ? "البرنامج جاهز" : "الخطة المختارة"}
                        </p>
                        <h4 className="text-sm font-black text-gray-900">
                          {generatedItinerary 
                            ? `${generatedItinerary.days.length} أيام منظمة ذكياً`
                            : `${selectedAttractions.size + selectedRestaurants.size + selectedHotels.size} عناصر بانتظار التنظيم`
                          }
                        </h4>
                        {aiQuota && (
                          <p className="text-[10px] font-bold text-indigo-500 mt-1">المتبقي هذا الأسبوع: {aiQuota.remaining}/{aiQuota.limit} رحلات</p>
                        )}
                     </div>
                     <div className="flex gap-4 w-full md:w-auto">
                        <Button variant="ghost" className="rounded-2xl font-black text-gray-400" onClick={() => window.location.reload()}>إعادة البدء</Button>
                        
                        {!generatedItinerary ? (
                          <Button 
                            className="flex-1 md:min-w-[200px] h-14 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 font-black text-sm gap-3 shadow-sm disabled:opacity-60"
                            onClick={handleGenerateFullItinerary}
                            disabled={isGeneratingItinerary || (selectedAttractions.size === 0 && selectedRestaurants.size === 0)}
                          >
                             {isGeneratingItinerary ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                             تنظيم الرحلة ذكياً
                          </Button>
                        ) : null}

                        <Button 
                          className="flex-1 md:min-w-[240px] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-3 shadow-xl shadow-indigo-100 disabled:opacity-60"
                          onClick={handleCreateTrip}
                          disabled={isCreatingTrip || (aiQuota !== null && aiQuota.remaining <= 0)}
                        >
                           {isCreatingTrip ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                           {generatedItinerary ? "حفظ الرحلة المنظمة" : "حفظ الرحلة مباشرة"}
                        </Button>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* Mobile tab switcher when trip plan exists */}
          {tripPlan && (
            <div className="lg:hidden flex gap-2 p-2 bg-white/80 rounded-2xl border border-gray-100 shadow-sm shrink-0">
              <button
                onClick={() => setMobileView('chat')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                  mobileView === 'chat' ? "bg-indigo-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                )}
              >
                <MessageCircle className="w-4 h-4" />
                المحادثة
              </button>
              <button
                onClick={() => setMobileView('plan')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                  mobileView === 'plan' ? "bg-indigo-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                خطة الرحلة
              </button>
            </div>
          )}

          {/* Chat Panel (Right) */}
          <div className={cn(
            "w-full lg:w-[420px] bg-white rounded-2xl lg:rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col overflow-hidden min-h-0 shrink-0",
            "animate-in fade-in slide-in-from-left-4 duration-500",
            tripPlan && mobileView === 'plan' && "hidden lg:flex",
            (!tripPlan || mobileView === 'chat') && "flex"
          )}>
             <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col gap-3 bg-indigo-50/30 shrink-0">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                      <div className="relative">
                         <MessageCircle className="h-6 w-6 text-indigo-600" />
                         <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-900 leading-none mb-1 text-lg">TripAI Assistant</h3>
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">مساعد ذكي للسفر</span>
                   </div>
                </div>
                {aiQuota !== null && isSignedIn && (
                   <div className="flex flex-col gap-2">
                     <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/80 border border-indigo-100 shadow-sm">
                        <span className="text-xs font-bold text-gray-600">استخدامك هذا الأسبوع</span>
                        <span className={cn(
                           "text-sm font-black",
                           aiQuota.remaining <= 0 ? "text-rose-600" : "text-indigo-600"
                        )}>
                           {aiQuota.remaining}/{aiQuota.limit} رحلات متبقية
                        </span>
                     </div>
                     {aiQuota.remaining < aiQuota.limit && aiQuota.nextRestoreTime && (
                       <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-rose-50/80 border border-rose-100 shadow-sm">
                         <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                           <Clock className="w-3.5 h-3.5" />
                           تجديد المحاولات بعد:
                         </span>
                         <span className="text-rose-600">
                           <CountdownTimer targetDate={aiQuota.nextRestoreTime} />
                         </span>
                       </div>
                     )}
                   </div>
                )}
             </div>

             <ScrollArea className="flex-1 min-h-0 p-4 sm:p-6">
                <div className="space-y-6">
                   <AnimatePresence>
                      {messages.map((m) => (
                        <motion.div 
                          key={m.id}
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className={cn(
                            "flex flex-col max-w-[85%]",
                            m.type === 'user' ? "mr-auto items-end" : "ml-auto"
                          )}
                        >
                           <div className={cn(
                             "px-5 py-3.5 rounded-[1.5rem] shadow-sm text-sm font-bold leading-relaxed",
                             m.type === 'user' 
                              ? "bg-indigo-600 text-white rounded-br-sm" 
                              : "bg-gray-100 text-gray-800 rounded-bl-sm"
                           )}>
                              {m.text}
                           </div>

                           {/* Suggested Platform Trips */}
                           {m.suggestedPlatformTrips && m.suggestedPlatformTrips.length > 0 && (
                               <div className="mt-3 space-y-2 w-full">
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 px-1">رحلات مقترحة من المنصة</p>
                                   {m.suggestedPlatformTrips.map(trip => (
                                       <div 
                                           key={trip.id} 
                                           className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-300 transition-all cursor-pointer group flex flex-col"
                                           onClick={() => window.open(`/trips/${trip.id}`, '_blank')}
                                       >
                                           {trip.image && (
                                               <div className="w-full h-24 overflow-hidden relative">
                                                   <img src={trip.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                   {trip.price && (
                                                       <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg">
                                                           {trip.price}
                                                       </div>
                                                   )}
                                               </div>
                                           )}
                                           <div className="p-3">
                                               <div className="flex justify-between items-start gap-2">
                                                   <h4 className="text-xs font-black text-indigo-700 group-hover:text-indigo-600 line-clamp-1">{trip.title}</h4>
                                                   <ArrowUpRight className="w-3 h-3 text-gray-400 group-hover:text-indigo-500 shrink-0" />
                                               </div>
                                                <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{trip.matchReason}</p>
                                                {!trip.image && trip.price && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                            السعر: {trip.price}
                                                        </span>
                                                    </div>
                                                )}
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           )}

                           <span className="text-[8px] font-black text-gray-300 uppercase mt-1.5 tracking-tighter">
                              {m.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </motion.div>
                      ))}
                      {(isLoading || isGeneratingPlan) && (
                         <div className="flex gap-2 p-3 bg-gray-50 rounded-2xl w-max ml-auto text-xs font-black text-gray-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {isGeneratingPlan ? 'جاري البحث...' : 'جاري التفكير...'}
                         </div>
                      )}
                   </AnimatePresence>
                   <div ref={scrollRef} />
                </div>
             </ScrollArea>

             {/* Message Input - visible to all; guests get toast when trying to send */}
             <div id="ai-chat-input" className="p-6 bg-gray-50/50 border-t border-gray-100">
                {!isSignedIn && (
                  <div className="flex items-center justify-center gap-2 py-2 px-3 mb-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold">
                    سجّل الدخول لاستخدام المحادثة
                    <SignInButton mode="modal">
                      <Button variant="outline" size="sm" className="h-7 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-100">
                        تسجيل الدخول
                      </Button>
                    </SignInButton>
                  </div>
                )}
                {/* Suggested Messages */}
                {!userInput && !isLoading && !isGeneratingPlan && (
                  <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
                    {[
                      { text: `ما هي أفضل الوجهات السياحية في فصل ${getCurrentSeason()}؟`, icon: <Star className="w-3 h-3" /> },
                      { text: "أريد تخطيط رحلة استرخاء في دهب", icon: <Zap className="w-3 h-3" /> },
                      { text: "اقترح لي معالم تاريخية في الأقصر", icon: <Camera className="w-3 h-3" /> },
                    ].map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                           setUserInput(s.text);
                           inputRef.current?.focus();
                        }}
                        className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-indigo-100 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
                      >
                        {s.icon}
                        {s.text}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                   <div className="relative flex-1 group">
                      <Input
                        ref={inputRef}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="اكتب رسالتك هنا..."
                        className="h-12 rounded-2xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400 font-bold bg-white relative z-10"
                        disabled={isLoading || isGeneratingPlan}
                      />
                   </div>
                   <Button
                     onClick={handleSendMessage}
                     disabled={!userInput.trim() || isLoading || isGeneratingPlan}
                     className="h-12 w-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all shrink-0"
                   >
                     <Send className="h-5 w-5" />
                   </Button>
                </div>
             </div>
          </div>
        </div>

        {/* Floating Weather Hover Button */}
        {extractedData.destination && (
          <div className="fixed bottom-24 right-6 md:right-10 z-[100] group">
            <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto max-w-[calc(100vw-3rem)] origin-bottom-right">
               <div className="relative w-[320px] sm:w-[500px] md:w-[650px] lg:w-[820px] bg-white rounded-[2.5rem] p-5 lg:p-8 shadow-[0_30px_100px_-20px_rgba(79,70,229,0.4)] border border-indigo-100 overflow-hidden ring-8 ring-indigo-50/50">
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-8 px-2 lg:px-4 gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                           <Cloud className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-gray-900 leading-none">توقعات الطقس: {extractedData.destination}</h3>
                           <p className="text-xs font-bold text-gray-500 mt-2">خطة طقس لـ 7 أيام قادمة</p>
                        </div>
                     </div>
                     <Badge className="bg-indigo-600 text-white px-6 py-2 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100">{extractedData.destination}</Badge>
                  </div>
                  <div className="w-full">
                    <CityWeatherAdvisor cityName={extractedData.destination} layout="horizontal" />
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
               </div>
            </div>

            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              whileHover={{ scale: 1.1, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center gap-3 px-6 py-4 rounded-3xl bg-indigo-600 text-white shadow-[0_15px_40px_-10px_rgba(79,70,229,0.5)] transition-all font-black text-sm relative overflow-hidden border-[3px] border-white"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-center gap-3">
                 <div className="relative">
                    <Sun className="h-6 w-6 text-yellow-300 animate-spin-slow" />
                    <Cloud className="h-3 w-3 absolute -bottom-1 -right-1 text-white" />
                 </div>
                 <div className="flex flex-col items-start leading-tight">
                    <span className="text-[9px] text-indigo-100 uppercase tracking-widest">عرض التوقعات</span>
                    <span>طقس {extractedData.destination}</span>
                 </div>
                 <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
            </motion.button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TripAIChat;
