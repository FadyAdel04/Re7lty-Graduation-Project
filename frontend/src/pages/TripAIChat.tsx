import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, Send, MapPin, Star, Camera, Utensils, Hotel, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { getTripPlan, type TripPlan } from "@/lib/travel-advisor-api";
import { useToast } from "@/hooks/use-toast";
import { createTrip } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import { getCurrentSeason } from "@/lib/season-utils";

const CITIES = [
  'القاهرة',
  'الإسكندرية',
  'مرسى مطروح',
  'الأقصر',
  'أسوان',
  'شرم الشيخ',
  'دهب',
  'الجونة',
  'مرسى علم',
  'الغردقة',
];

const DAYS_OPTIONS = ['1', '2', '3', '4', '5', '7', '10', '14'];

const BUDGET_OPTIONS = [
  { label: '500 جنيه', value: '500' },
  { label: '1000 جنيه', value: '1000' },
  { label: '2000 جنيه', value: '2000' },
  { label: '3000 جنيه', value: '3000' },
  { label: '5000 جنيه', value: '5000' },
  { label: '10000+ جنيه', value: '10000' },
];

const TRIP_TYPES = ["تاريخية", "ساحلية", "مغامرات", "استرخاء", "غوص"];

const SEASONS = [
  { value: 'winter', label: 'شتاء', emoji: '❄️' },
  { value: 'summer', label: 'صيف', emoji: '☀️' },
  { value: 'fall', label: 'خريف', emoji: '🍂' },
  { value: 'spring', label: 'ربيع', emoji: '🌸' },
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
      text: 'مرحباً! أنا مساعدك الذكي لتخطيط الرحلات 🌍 سأساعدك في إيجاد أفضل رحلة تناسب احتياجاتك. لنبدأ!',
      timestamp: new Date(),
    },
    {
      id: 2,
      type: 'ai',
      text: 'ما المدينة التي ترغب بزيارتها؟',
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
      addMessage('ai', 'رائع! كم عدد الأيام المتاحة لديك للرحلة؟');
      setCurrentStep('days');
    }, 500);
  };

  const handleDaysSelect = (selectedDays: string) => {
    setDays(selectedDays);
    addMessage('user', `${selectedDays} ${selectedDays === '1' ? 'يوم' : 'أيام'}`);
    setTimeout(() => {
      addMessage('ai', 'ممتاز! ما نوع الرحلة التي تفضلها؟');
      setCurrentStep('tripType');
    }, 500);
  };

  const handleTripTypeSelect = (selectedType: string) => {
    setTripType(selectedType);
    addMessage('user', selectedType);
    setTimeout(() => {
      addMessage('ai', 'ما الموسم المفضل لديك للرحلة؟');
      setCurrentStep('season');
    }, 500);
  };

  const handleSeasonSelect = (selectedSeason: string) => {
    setSeason(selectedSeason);
    const seasonInfo = SEASONS.find(s => s.value === selectedSeason);
    addMessage('user', `${seasonInfo?.emoji} ${seasonInfo?.label}`);
    setTimeout(() => {
      addMessage('ai', 'ما ميزانيتك التقريبية للرحلة؟');
      setCurrentStep('budget');
    }, 500);
  };

  const handleBudgetSelect = async (selectedBudget: string) => {
    setBudget(selectedBudget);
    const budgetLabel = BUDGET_OPTIONS.find(b => b.value === selectedBudget)?.label || selectedBudget;
    addMessage('user', budgetLabel);
    
    setTimeout(() => {
      addMessage('ai', 'جاري البحث عن أفضل الرحلات المناسبة لك... ⏳');
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
        // Auto-select all items by default
        const allAttractions = new Set(plan.attractions.map((a, idx) => a.location_id || idx.toString()));
        const allRestaurants = new Set(plan.restaurants.map((r, idx) => r.location_id || idx.toString()));
        const allHotels = new Set(plan.hotels.map((h, idx) => h.location_id || idx.toString()));
        setSelectedAttractions(allAttractions);
        setSelectedRestaurants(allRestaurants);
        setSelectedHotels(allHotels);
        
        setTimeout(() => {
          addMessage('ai', `وجدت خطة رحلة رائعة لك في ${city}! 🎉 تحتوي على ${plan.attractions.length} معلم سياحي، ${plan.restaurants.length} مطعم، و ${plan.hotels.length} فندق. يمكنك تحديد ما يناسبك من الخيارات أدناه.`);
          setCurrentStep('complete');
        }, 1000);
      } else {
        addMessage('ai', 'عذراً، لم أتمكن من العثور على رحلة مناسبة لهذه المدينة. هل تريد المحاولة مرة أخرى؟');
        toast({
          title: "لم يتم العثور على نتائج",
          description: "لم نتمكن من العثور على رحلة لهذه المدينة.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching trip plan:", error);
      addMessage('ai', 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
      toast({
        title: "خطأ في الاتصال",
        description: error.message || "حدث خطأ أثناء جلب بيانات الرحلة.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!tripPlan || !isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لإنشاء رحلة",
        variant: "destructive",
      });
      return;
    }

    const totalSelected = selectedAttractions.size + selectedRestaurants.size + selectedHotels.size;
    if (totalSelected === 0) {
      toast({
        title: "يرجى تحديد عناصر",
        description: "يجب تحديد معالم أو مطاعم أو فنادق على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingTrip(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }

      // Get selected items
      const selectedAttractionsList = tripPlan.attractions.filter((a, idx) => 
        selectedAttractions.has(a.location_id || String(idx))
      );
      const selectedRestaurantsList = tripPlan.restaurants.filter((r, idx) => 
        selectedRestaurants.has(r.location_id || String(idx))
      );
      const selectedHotelsList = tripPlan.hotels.filter((h, idx) => 
        selectedHotels.has(h.location_id || String(idx))
      );

      // Transform to trip format
      const activities = selectedAttractionsList.map((attraction, idx) => ({
        name: attraction.name,
        images: attraction.photo?.images?.medium?.url ? [attraction.photo.images.medium.url] : [],
        coordinates: attraction.location_id ? {
          lat: parseFloat(tripPlan.location.latitude || "0"),
          lng: parseFloat(tripPlan.location.longitude || "0"),
        } : undefined,
        day: Math.floor(idx / 3) + 1,
      }));

      const foodAndRestaurants = selectedRestaurantsList.map((restaurant) => ({
        name: restaurant.name,
        image: restaurant.photo?.images?.medium?.url || "",
        rating: parseFloat(restaurant.rating || "4.5"),
        description: restaurant.description || restaurant.cuisine?.map(c => c.name).join(", ") || "",
      }));

      const numDays = parseInt(days || "3");
      const daysArray = Array.from({ length: numDays }, (_, i) => ({
        title: `اليوم ${i + 1}`,
        activities: activities
          .map((_, idx) => idx)
          .filter((_, idx) => Math.floor(idx / 3) === i),
      }));

      const mainImage = selectedAttractionsList[0]?.photo?.images?.medium?.url ||
                       selectedRestaurantsList[0]?.photo?.images?.medium?.url ||
                       selectedHotelsList[0]?.photo?.images?.medium?.url ||
                       "";

      const tripData = {
        title: `رحلة ${city} - ${numDays} أيام`,
        destination: tripPlan.location.name,
        city: city,
        duration: `${numDays} أيام`,
        rating: 4.5,
        image: mainImage,
        description: `رحلة مخصصة إلى ${city} لمدة ${numDays} أيام. تتضمن ${selectedAttractionsList.length} معلم سياحي، ${selectedRestaurantsList.length} مطعم، و ${selectedHotelsList.length} فندق.`,
        budget: budget ? `${budget} جنيه مصري` : "غير محدد",
        season: season || getCurrentSeason(), // Use selected season or fallback to current
        activities: activities,
        days: daysArray,
        foodAndRestaurants: foodAndRestaurants,
        isAIGenerated: true,
      };

      const createdTrip = await createTrip(tripData, token);
      
      toast({
        title: "تم إنشاء الرحلة بنجاح",
        description: "تم حفظ رحلتك في ملفك الشخصي",
      });

      navigate(`/trips/${createdTrip._id || createdTrip.id}`);
    } catch (error: any) {
      console.error("Error creating trip:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل إنشاء الرحلة",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const renderMultipleChoice = () => {
    if (currentStep === 'city') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
          {CITIES.map((cityOption) => (
            <Button
              key={cityOption}
              variant="outline"
              className="h-auto py-3 text-sm hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => handleCitySelect(cityOption)}
            >
              <MapPin className="h-4 w-4 ml-2" />
              {cityOption}
            </Button>
          ))}
        </div>
      );
    }

    if (currentStep === 'days') {
      return (
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-4">
          {DAYS_OPTIONS.map((dayOption) => (
            <Button
              key={dayOption}
              variant="outline"
              className="h-auto py-3 hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => handleDaysSelect(dayOption)}
            >
              {dayOption}
            </Button>
          ))}
        </div>
      );
    }

    if (currentStep === 'tripType') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
          {TRIP_TYPES.map((type) => (
            <Button
              key={type}
              variant="outline"
              className="h-auto py-3 hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => handleTripTypeSelect(type)}
            >
              <Sparkles className="h-4 w-4 ml-2" />
              {type}
            </Button>
          ))}
        </div>
      );
    }

    if (currentStep === 'season') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 mt-4">
          {SEASONS.map((seasonOption) => (
            <Button
              key={seasonOption.value}
              variant="outline"
              className="h-auto py-3 text-sm hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
              onClick={() => handleSeasonSelect(seasonOption.value)}
            >
              <span className="text-lg">{seasonOption.emoji}</span>
              <span>{seasonOption.label}</span>
            </Button>
          ))}
        </div>
      );
    }

    if (currentStep === 'budget') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
          {BUDGET_OPTIONS.map((budgetOption) => (
            <Button
              key={budgetOption.value}
              variant="outline"
              className="h-auto py-3 text-sm hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => handleBudgetSelect(budgetOption.value)}
            >
              {budgetOption.label}
            </Button>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            مساعد الرحلات الذكي
          </h1>
          <p className="text-muted-foreground">دعني أساعدك في تخطيط رحلتك المثالية</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[calc(100vh-280px)]">
          
          {/* LEFT PANEL - Trip Results & Suggestions */}
          <div className="order-2 lg:order-1 bg-gradient-to-br from-background via-background to-muted/20 rounded-2xl shadow-lg border p-4 md:p-6 overflow-y-auto h-auto lg:h-full min-h-[500px] lg:min-h-0">
            {!tripPlan || currentStep !== 'complete' ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8 lg:py-0">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">خطة رحلتك ستظهر هنا</h3>
                  <p className="text-muted-foreground">أجب عن الأسئلة في الجانب الأيمن لبدء التخطيط</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-20 lg:pb-0 relative">
                {/* Location Info Card */}
                <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-5 rounded-xl border border-primary/30 shadow-sm">
                  <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-primary" />
                    {tripPlan.location.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {tripPlan.location.latitude && tripPlan.location.longitude && (
                      <span className="flex items-center gap-1">📍 {parseFloat(tripPlan.location.latitude).toFixed(4)}, {parseFloat(tripPlan.location.longitude).toFixed(4)}</span>
                    )}
                    <span className="flex items-center gap-1">📅 {days} {days === '1' ? 'يوم' : 'أيام'}</span>
                    <span className="flex items-center gap-1">💰 {BUDGET_OPTIONS.find(b => b.value === budget)?.label || budget}</span>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                    <Camera className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold">{tripPlan.attractions.length}</div>
                    <div className="text-xs text-muted-foreground">معالم سياحية</div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
                    <Utensils className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold">{tripPlan.restaurants.length}</div>
                    <div className="text-xs text-muted-foreground">مطاعم</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                    <Hotel className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold">{tripPlan.hotels.length}</div>
                    <div className="text-xs text-muted-foreground">فنادق</div>
                  </div>
                </div>

                {/* Attractions */}
                {tripPlan.attractions.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 sticky top-20 lg:top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                      <Camera className="h-5 w-5 text-primary" />
                      المعالم السياحية
                    </h3>
                    <div className="space-y-3">
                      {tripPlan.attractions.map((attraction, idx) => {
                        const isSelected = selectedAttractions.has(attraction.location_id || String(idx));
                        return (
                          <div
                            key={attraction.location_id || idx}
                            className={`border rounded-xl p-3 hover:shadow-md transition-all cursor-pointer ${
                              isSelected ? 'ring-2 ring-primary bg-primary/5 border-primary/30' : 'hover:border-primary/20'
                            }`}
                            onClick={() => {
                              const newSet = new Set(selectedAttractions);
                              if (isSelected) {
                                newSet.delete(attraction.location_id || String(idx));
                              } else {
                                newSet.add(attraction.location_id || String(idx));
                              }
                              setSelectedAttractions(newSet);
                            }}
                          >
                            <div className="flex gap-3">
                              <Checkbox
                                checked={isSelected}
                                className="mt-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              {attraction.photo?.images?.medium?.url && (
                                <img
                                  src={attraction.photo.images.medium.url}
                                  alt={attraction.name}
                                  className="w-20 h-20 object-cover rounded-lg shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold mb-1 text-sm">{attraction.name}</h4>
                                {attraction.rating && (
                                  <div className="flex items-center gap-1 text-xs mb-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{attraction.rating}</span>
                                    {attraction.num_reviews && (
                                      <span className="text-muted-foreground">({attraction.num_reviews})</span>
                                    )}
                                  </div>
                                )}
                                {attraction.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">{attraction.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Restaurants */}
                {tripPlan.restaurants.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 sticky top-20 lg:top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                      <Utensils className="h-5 w-5 text-primary" />
                      المطاعم
                    </h3>
                    <div className="space-y-3">
                      {tripPlan.restaurants.map((restaurant, idx) => {
                        const isSelected = selectedRestaurants.has(restaurant.location_id || String(idx));
                        return (
                          <div
                            key={restaurant.location_id || idx}
                            className={`border rounded-xl p-3 hover:shadow-md transition-all cursor-pointer ${
                              isSelected ? 'ring-2 ring-primary bg-primary/5 border-primary/30' : 'hover:border-primary/20'
                            }`}
                            onClick={() => {
                              const newSet = new Set(selectedRestaurants);
                              if (isSelected) {
                                newSet.delete(restaurant.location_id || String(idx));
                              } else {
                                newSet.add(restaurant.location_id || String(idx));
                              }
                              setSelectedRestaurants(newSet);
                            }}
                          >
                            <div className="flex gap-3">
                              <Checkbox
                                checked={isSelected}
                                className="mt-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              {restaurant.photo?.images?.medium?.url && (
                                <img
                                  src={restaurant.photo.images.medium.url}
                                  alt={restaurant.name}
                                  className="w-20 h-20 object-cover rounded-lg shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold mb-1 text-sm">{restaurant.name}</h4>
                                {restaurant.rating && (
                                  <div className="flex items-center gap-1 text-xs mb-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{restaurant.rating}</span>
                                  </div>
                                )}
                                {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {restaurant.cuisine.map(c => c.name).filter(Boolean).join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Hotels */}
                {tripPlan.hotels.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 sticky top-20 lg:top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                      <Hotel className="h-5 w-5 text-primary" />
                      الفنادق
                    </h3>
                    <div className="space-y-3">
                      {tripPlan.hotels.map((hotel, idx) => {
                        const isSelected = selectedHotels.has(hotel.location_id || String(idx));
                        return (
                          <div
                            key={hotel.location_id || idx}
                            className={`border rounded-xl p-3 hover:shadow-md transition-all cursor-pointer ${
                              isSelected ? 'ring-2 ring-primary bg-primary/5 border-primary/30' : 'hover:border-primary/20'
                            }`}
                            onClick={() => {
                              const newSet = new Set(selectedHotels);
                              if (isSelected) {
                                newSet.delete(hotel.location_id || String(idx));
                              } else {
                                newSet.add(hotel.location_id || String(idx));
                              }
                              setSelectedHotels(newSet);
                            }}
                          >
                            <div className="flex gap-3">
                              <Checkbox
                                checked={isSelected}
                                className="mt-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              {hotel.photo?.images?.medium?.url && (
                                <img
                                  src={hotel.photo.images.medium.url}
                                  alt={hotel.name}
                                  className="w-20 h-20 object-cover rounded-lg shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold mb-1 text-sm">{hotel.name}</h4>
                                {hotel.rating && (
                                  <div className="flex items-center gap-1 text-xs mb-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{hotel.rating}</span>
                                  </div>
                                )}
                                {hotel.price && (
                                  <p className="text-xs font-medium text-primary">{hotel.price}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Create Trip Button - Fixed at bottom */}
                <div className="fixed lg:sticky bottom-0 left-0 right-0 lg:left-auto lg:right-auto bg-gradient-to-t from-background via-background to-transparent pt-4 pb-4 px-4 lg:p-0 z-50 lg:z-auto">
                  <div className="bg-background/95 backdrop-blur-sm border rounded-xl p-4 shadow-lg lg:mb-2 max-w-md mx-auto lg:max-w-none">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{selectedAttractions.size + selectedRestaurants.size + selectedHotels.size}</span>
                        عنصر محدد
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateTrip}
                      disabled={isCreatingTrip || (selectedAttractions.size === 0 && selectedRestaurants.size === 0 && selectedHotels.size === 0) || !isSignedIn}
                      className="w-full gap-2 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                    >
                      {isCreatingTrip ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          جاري الإنشاء...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          إنشاء خطة الرحلة
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL - Chat Interface & Options */}
          <div className="order-1 lg:order-2 flex flex-col bg-gradient-to-br from-primary/5 via-background to-background rounded-2xl shadow-lg border overflow-hidden h-[85vh] lg:h-full">
            {/* Chat Messages Area */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted/80 backdrop-blur-sm rounded-bl-sm border'
                      }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed">{message.text}</p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start animate-in fade-in">
                    <div className="bg-muted/80 backdrop-blur-sm border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm">جاري البحث...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Options Area */}
            <div className="border-t bg-background/50 backdrop-blur-sm p-4">
              {renderMultipleChoice()}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TripAIChat;
