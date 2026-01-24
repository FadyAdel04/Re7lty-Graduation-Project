import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MessageCircle, 
  Send, 
  MapPin, 
  Star, 
  Camera, 
  Utensils, 
  Hotel, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  Search,
  ArrowRight,
  TrendingUp,
  Wind,
  Compass,
  Zap,
  Clock,
  ExternalLink,
  ChevronLeft
} from "lucide-react";
import { getTripPlan, type TripPlan } from "@/lib/travel-advisor-api";
import { useToast } from "@/hooks/use-toast";
import { createTrip } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import { getCurrentSeason } from "@/lib/season-utils";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const CITIES = [
  'القاهرة', 'الإسكندرية', 'مرسى مطروح', 'الأقصر', 'أسوان', 
  'شرم الشيخ', 'دهب', 'الجونة', 'مرسى علم', 'الغردقة',
];

const DAYS_OPTIONS = ['1', '2', '3', '4', '5', '7', '10', '14'];

const BUDGET_OPTIONS = [
  { label: '500 جنيه', value: '500', color: 'bg-emerald-50 text-emerald-600' },
  { label: '1000 جنيه', value: '1000', color: 'bg-indigo-50 text-indigo-600' },
  { label: '2000 جنيه', value: '2000', color: 'bg-indigo-100 text-indigo-700' },
  { label: '5000 جنيه', value: '5000', color: 'bg-purple-50 text-purple-600' },
  { label: '10000+ جنيه', value: '10000', color: 'bg-rose-50 text-rose-600' },
];

const TRIP_TYPES = [
  { name: "تاريخية", icon: Compass, color: "text-amber-600", bg: "bg-amber-50" },
  { name: "ساحلية", icon: Wind, color: "text-blue-600", bg: "bg-blue-50" },
  { name: "مغامرات", icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
  { name: "استرخاء", icon: Star, color: "text-purple-600", bg: "bg-purple-50" },
];

const SEASONS = [
  { value: 'winter', label: 'شتاء', emoji: '❄️', color: 'text-blue-500' },
  { value: 'summer', label: 'صيف', emoji: '☀️', color: 'text-orange-500' },
  { value: 'fall', label: 'خريف', emoji: '🍂', color: 'text-amber-600' },
  { value: 'spring', label: 'ربيع', emoji: '🌸', color: 'text-rose-500' },
];

type Message = {
  id: number;
  type: 'ai' | 'user';
  text: string;
  timestamp: Date;
};

type QuestionStep = 'city' | 'days' | 'tripType' | 'season' | 'budget' | 'results' | 'complete';

const TripAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      text: 'مرحباً بك في مستقبل التخطيط السياحي! 🚀 أنا مساعدك الذكي، سأقوم ببناء رحلة أحلامك بدقة متناهية. لنبدأ مغامرتنا، ما هي المدينة التي تود استكشافها؟',
      timestamp: new Date(),
    },
  ]);

  const [currentStep, setCurrentStep] = useState<QuestionStep>('city');
  const [city, setCity] = useState<string>('');
  const [days, setDays] = useState<string>('');
  const [tripType, setTripType] = useState<string>('');
  const [season, setSeason] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAttractions, setSelectedAttractions] = useState<Set<string>>(new Set());
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<string>>(new Set());
  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set());
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  const { toast } = useToast();
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStep]);

  const addMessage = (type: 'ai' | 'user', text: string) => {
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      type,
      text,
      timestamp: new Date(),
    }]);
  };

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    addMessage('user', selectedCity);
    setTimeout(() => {
      addMessage('ai', 'اختيار رائع! كم يوماً تنوي قضاءها في هذه المغامرة؟');
      setCurrentStep('days');
    }, 500);
  };

  const handleDaysSelect = (selectedDays: string) => {
    setDays(selectedDays);
    addMessage('user', `${selectedDays} ${parseInt(selectedDays) === 1 ? 'يوم' : 'أيام'}`);
    setTimeout(() => {
      addMessage('ai', 'ممتاز. والآن، ما هو طابع الرحلة الذي تفضله؟');
      setCurrentStep('tripType');
    }, 500);
  };

  const handleTripTypeSelect = (selectedType: string) => {
    setTripType(selectedType);
    addMessage('user', selectedType);
    setTimeout(() => {
      addMessage('ai', 'جميل جداً. في أي موسم تفضل أن تكون هذه الرحلة؟');
      setCurrentStep('season');
    }, 500);
  };

  const handleSeasonSelect = (selectedSeason: string) => {
    setSeason(selectedSeason);
    const seasonInfo = SEASONS.find(s => s.value === selectedSeason);
    addMessage('user', `${seasonInfo?.emoji} ${seasonInfo?.label}`);
    setTimeout(() => {
      addMessage('ai', 'أخيراً، ما هو سقف الميزانية الذي حددته لهذه الرحلة؟');
      setCurrentStep('budget');
    }, 500);
  };

  const handleBudgetSelect = async (selectedBudget: string) => {
    setBudget(selectedBudget);
    const budgetLabel = BUDGET_OPTIONS.find(b => b.value === selectedBudget)?.label || selectedBudget;
    addMessage('user', budgetLabel);
    
    setTimeout(() => {
      addMessage('ai', 'جاري معالجة بياناتك والبحث في قاعدة بياناتنا العالمية لتصميم الخطة المثالية لك... 🔮');
      setCurrentStep('results');
      fetchTripPlan();
    }, 500);
  };

  const fetchTripPlan = async () => {
    setIsLoading(true);
    try {
      const numDays = parseInt(days || "3");
      const plan = await getTripPlan(city, numDays);
      
      if (plan) {
        setTripPlan(plan);
        const allAttractions = new Set(plan.attractions.map((a, idx) => a.location_id || idx.toString()));
        const allRestaurants = new Set(plan.restaurants.map((r, idx) => r.location_id || idx.toString()));
        const allHotels = new Set(plan.hotels.map((h, idx) => h.location_id || idx.toString()));
        setSelectedAttractions(allAttractions);
        setSelectedRestaurants(allRestaurants);
        setSelectedHotels(allHotels);
        
        setTimeout(() => {
          addMessage('ai', `اكتمل التصميم! 🎉 لقد قمت ببناء خطة متكاملة لك في ${city}. يمكنك الآن مراجعة المعالم، المطاعم والفنادق واختيار ما يحلو لك.`);
          setCurrentStep('complete');
        }, 1000);
      } else {
        addMessage('ai', 'عذراً، لم أوفق في إيجاد نتائج دقيقة لهذه الوجهة. هل تود تجربة مدينة أخرى؟');
      }
    } catch (error: any) {
      addMessage('ai', 'واجهت مشكلة تقنية أثناء التخطيط. دعنا نحاول مجدداً.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!tripPlan || !isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لحفظ رحلتك الذكية.",
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

      const activities = selectedAttractionsList.map((attraction, idx) => ({
        name: attraction.name,
        images: attraction.photo?.images?.medium?.url ? [attraction.photo.images.medium.url] : [],
        day: Math.floor(idx / 3) + 1,
      }));

      const numDays = parseInt(days || "3");
      const tripData = {
        title: `رحلة ${city} - ${numDays} أيام`,
        destination: tripPlan.location.name,
        city: city,
        duration: `${numDays} أيام`,
        rating: 4.8,
        image: selectedAttractionsList[0]?.photo?.images?.large?.url || selectedAttractionsList[0]?.photo?.images?.medium?.url || "",
        description: `رحلة ذكية تم تصميمها بواسطة المساعد الرقمي إلى ${city} لمدة ${numDays} أيام. تتضمن ${selectedAttractionsList.length} معلم سياحي، ${selectedRestaurantsList.length} مطعم، و ${selectedHotelsList.length} فندق.`,
        budget: budget ? `${budget} جنيه مصري` : "غير محدد",
        season: season || getCurrentSeason(),
        activities: activities,
        days: Array.from({ length: numDays }, (_, i) => ({
          title: `اليوم ${i + 1}`,
          activities: activities
            .map((_, idx) => idx)
            .filter((_, idx) => Math.floor(idx / 3) === i),
        })),
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
          price: h.price || "غير متوفر",
        })),
        isAIGenerated: true,
      };

      const createdTrip = await createTrip(tripData, token);
      toast({ title: "تم الحفظ بنجاح", description: "رحلتك الآن في ملفك الشخصي." });
      navigate(`/trips/${createdTrip._id || createdTrip.id}`);
    } catch (error: any) {
      toast({ title: "فشل الحفظ", description: error.message, variant: "destructive" });
    } finally {
      setIsCreatingTrip(false);
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

      <main className="flex-1 container mx-auto px-6 py-10 relative z-10">
        <div className="max-w-7xl mx-auto h-[calc(100vh-200px)] min-h-[600px] flex flex-col lg:flex-row gap-8">
          
          {/* Result Panel (Left) */}
          <div className="flex-1 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-gray-100/50 shadow-2xl shadow-indigo-500/5 flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700">
             <ScrollArea className="flex-1">
                <div className="p-8 lg:p-12">
                   {!tripPlan ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-24">
                         <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center mb-8 animate-bounce transition-all duration-1000">
                            <Sparkles className="h-10 w-10 text-indigo-600" />
                         </div>
                         <h2 className="text-3xl font-black text-gray-900 mb-4">بانتظار مدخلاتك...</h2>
                         <p className="text-gray-400 font-bold max-w-sm">أجب عن الأسئلة في المحادثة الجانبية لنقوم ببناء خطة رحلة متكاملة ومخصصة لك.</p>
                      </div>
                   ) : (
                      <div className="space-y-12 animate-in fade-in duration-500">
                         {/* Location Header */}
                         <div className="relative rounded-[2rem] overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                            <img 
                              src={tripPlan.attractions?.[0]?.photo?.images?.large?.url || tripPlan.attractions?.[0]?.photo?.images?.medium?.url} 
                              className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-1000"
                            />
                            <div className="absolute bottom-10 right-10 z-20">
                               <Badge className="bg-indigo-600 text-white border-0 mb-3 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg">وجهة مقترحة</Badge>
                               <h1 className="text-5xl font-black text-white mb-2 leading-tight">{tripPlan.location.name}</h1>
                               <div className="flex items-center gap-4 text-white/80 font-bold">
                                  <span className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                     <Clock className="w-4 h-4 text-sky-400" /> {days} {parseInt(days) === 1 ? 'يوم' : 'أيام'}
                                  </span>
                                  <span className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                     <Zap className="w-4 h-4 text-orange-400" /> {SEASONS.find(s => s.value === season)?.label}
                                  </span>
                               </div>
                            </div>
                         </div>

                         {/* Results Content */}
                         <div className="space-y-16 pb-24">
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

                            {/* Restaurants/Hotels (Similar blocks) */}
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
                                      key={idx} 
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
                         </div>
                      </div>
                   )}
                </div>
             </ScrollArea>
             
             {/* Bottom Action Bar */}
             <AnimatePresence>
                {tripPlan && currentStep === 'complete' && (
                  <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="p-8 border-t border-gray-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.02)] flex items-center justify-between">
                     <div className="hidden md:block">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">الخطة المختارة</p>
                        <h4 className="text-sm font-black text-gray-900">{selectedAttractions.size + selectedRestaurants.size + selectedHotels.size} عناصر بانتظار الحفظ</h4>
                     </div>
                     <div className="flex gap-4 w-full md:w-auto">
                        <Button variant="ghost" className="rounded-2xl font-black text-gray-400" onClick={() => window.location.reload()}>إعادة البدء</Button>
                        <Button 
                          className="flex-1 md:min-w-[240px] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-3 shadow-xl shadow-indigo-100"
                          onClick={handleCreateTrip}
                          disabled={isCreatingTrip}
                        >
                           {isCreatingTrip ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                           حفظ الرحلة في مفضلتك
                        </Button>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* Chat Panel (Right) */}
          <div className="w-full lg:w-[420px] bg-white rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700">
             <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-indigo-50/30">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                   <div className="relative">
                      <MessageCircle className="h-6 w-6 text-indigo-600" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                   </div>
                </div>
                <div>
                   <h3 className="font-black text-gray-900 leading-none mb-1 text-lg">بناء الرحلة الذكي</h3>
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">تخطيط معتمد على البيانات</span>
                </div>
             </div>

             <ScrollArea className="flex-1 p-6" ref={scrollRef}>
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
                           <span className="text-[8px] font-black text-gray-300 uppercase mt-1.5 tracking-tighter">
                              {m.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </motion.div>
                      ))}
                      {isLoading && (
                         <div className="flex gap-2 p-3 bg-gray-50 rounded-2xl w-max ml-auto text-xs font-black text-gray-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            جاري التخطيط...
                         </div>
                      )}
                   </AnimatePresence>
                </div>
             </ScrollArea>

             {/* Dynamic Options Area */}
             <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                <AnimatePresence mode="wait">
                   <motion.div 
                     key={currentStep}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20 }}
                     className="max-h-60 overflow-y-auto custom-scrollbar"
                   >
                      {currentStep === 'city' && (
                         <div className="grid grid-cols-2 gap-3">
                            {CITIES.map(c => (
                               <Button 
                                key={c} 
                                variant="outline" 
                                className="h-12 rounded-xl bg-white border-0 shadow-sm hover:shadow-md hover:bg-indigo-50 hover:text-indigo-600 font-bold text-sm transition-all"
                                onClick={() => handleCitySelect(c)}
                               >
                                  <MapPin className="w-4 h-4 ml-2 opacity-30" /> {c}
                               </Button>
                            ))}
                         </div>
                      )}

                      {currentStep === 'days' && (
                         <div className="grid grid-cols-4 gap-2">
                            {DAYS_OPTIONS.map(d => (
                               <Button 
                                key={d} 
                                variant="outline" 
                                className="h-12 rounded-xl bg-white border-0 shadow-sm hover:bg-emerald-50 hover:text-emerald-600 font-black"
                                onClick={() => handleDaysSelect(d)}
                               >
                                  {d}
                               </Button>
                            ))}
                         </div>
                      )}

                      {currentStep === 'tripType' && (
                         <div className="grid grid-cols-2 gap-3">
                            {TRIP_TYPES.map(t => (
                               <Button 
                                key={t.name}
                                variant="outline"
                                className="h-20 flex-col rounded-2xl bg-white border-0 shadow-sm hover:bg-white hover:ring-2 hover:ring-indigo-600 transition-all gap-2"
                                onClick={() => handleTripTypeSelect(t.name)}
                               >
                                  <t.icon className={cn("w-6 h-6", t.color)} />
                                  <span className="font-black text-xs text-gray-600">{t.name}</span>
                               </Button>
                            ))}
                         </div>
                      )}

                      {currentStep === 'season' && (
                         <div className="grid grid-cols-2 gap-3">
                            {SEASONS.map(s => (
                               <Button 
                                key={s.value}
                                variant="outline"
                                className="h-14 rounded-xl bg-white border-0 shadow-sm hover:bg-white hover:ring-2 hover:ring-rose-500 font-black gap-3"
                                onClick={() => handleSeasonSelect(s.value)}
                               >
                                  <span className="text-xl">{s.emoji}</span>
                                  <span>{s.label}</span>
                               </Button>
                            ))}
                         </div>
                      )}

                      {currentStep === 'budget' && (
                         <div className="grid grid-cols-2 gap-3">
                            {BUDGET_OPTIONS.map(b => (
                               <Button 
                                key={b.value}
                                variant="outline"
                                className={cn("h-14 rounded-xl border-0 shadow-sm font-black transition-all", b.color)}
                                onClick={() => handleBudgetSelect(b.value)}
                               >
                                  {b.label}
                               </Button>
                            ))}
                         </div>
                      )}

                      {currentStep === 'complete' && (
                         <div className="text-center py-4">
                            <CheckCircle2 className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                            <h4 className="font-black text-gray-900 mb-1">تمت العملية بنجاح!</h4>
                            <p className="text-[10px] font-black text-gray-400 uppercase">لقد قمنا بتصميم خطتك الذكية</p>
                         </div>
                      )}
                   </motion.div>
                </AnimatePresence>
             </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TripAIChat;
