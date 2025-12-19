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

const CITIES = [
  'القاهرة',
  'الإسكندرية',
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

type Message = {
  id: number;
  type: 'ai' | 'user';
  text: string;
  timestamp: Date;
};

type QuestionStep = 'city' | 'days' | 'tripType' | 'budget' | 'results' | 'complete';

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
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            مساعد الرحلات الذكي
          </h1>
          <p className="text-muted-foreground">دعني أساعدك في تخطيط رحلتك المثالية</p>
        </div>

        {/* Chat Messages */}
        <div className="bg-background rounded-2xl shadow-lg border p-4 md:p-6 mb-6 min-h-[400px] max-h-[600px] overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm md:text-base">{message.text}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">جاري البحث...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Multiple Choice Options */}
        {renderMultipleChoice()}

        {/* Trip Plan Results */}
        {tripPlan && currentStep === 'complete' && (
          <div className="mt-6 space-y-6">
            {/* Location Info */}
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {tripPlan.location.name}
              </h3>
              {tripPlan.location.latitude && tripPlan.location.longitude && (
                <p className="text-sm text-muted-foreground">
                  الموقع: {tripPlan.location.latitude}, {tripPlan.location.longitude}
                </p>
              )}
            </div>

            {/* Attractions */}
            {tripPlan.attractions.length > 0 && (
              <div>
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <Camera className="h-6 w-6 text-primary" />
                  المعالم السياحية ({tripPlan.attractions.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {tripPlan.attractions.map((attraction, idx) => {
                    const isSelected = selectedAttractions.has(attraction.location_id || String(idx));
                    return (
                      <div
                        key={attraction.location_id || idx}
                        className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedAttractions);
                              if (checked) {
                                newSet.add(attraction.location_id || String(idx));
                              } else {
                                newSet.delete(attraction.location_id || String(idx));
                              }
                              setSelectedAttractions(newSet);
                            }}
                            className="mt-1"
                          />
                          {attraction.photo?.images?.medium?.url && (
                            <img
                              src={attraction.photo.images.medium.url}
                              alt={attraction.name}
                              className="w-24 h-24 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold mb-1 truncate">{attraction.name}</h4>
                            {attraction.rating && (
                              <div className="flex items-center gap-1 text-sm mb-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{attraction.rating}</span>
                                {attraction.num_reviews && (
                                  <span className="text-muted-foreground">({attraction.num_reviews} تقييم)</span>
                                )}
                              </div>
                            )}
                            {attraction.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{attraction.description}</p>
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
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <Utensils className="h-6 w-6 text-primary" />
                  المطاعم ({tripPlan.restaurants.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {tripPlan.restaurants.map((restaurant, idx) => {
                    const isSelected = selectedRestaurants.has(restaurant.location_id || String(idx));
                    return (
                      <div
                        key={restaurant.location_id || idx}
                        className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedRestaurants);
                              if (checked) {
                                newSet.add(restaurant.location_id || String(idx));
                              } else {
                                newSet.delete(restaurant.location_id || String(idx));
                              }
                              setSelectedRestaurants(newSet);
                            }}
                            className="mt-1"
                          />
                          {restaurant.photo?.images?.medium?.url && (
                            <img
                              src={restaurant.photo.images.medium.url}
                              alt={restaurant.name}
                              className="w-24 h-24 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold mb-1 truncate">{restaurant.name}</h4>
                            {restaurant.rating && (
                              <div className="flex items-center gap-1 text-sm mb-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{restaurant.rating}</span>
                              </div>
                            )}
                            {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                              <p className="text-xs text-muted-foreground">
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
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <Hotel className="h-6 w-6 text-primary" />
                  الفنادق ({tripPlan.hotels.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {tripPlan.hotels.map((hotel, idx) => {
                    const isSelected = selectedHotels.has(hotel.location_id || String(idx));
                    return (
                      <div
                        key={hotel.location_id || idx}
                        className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedHotels);
                              if (checked) {
                                newSet.add(hotel.location_id || String(idx));
                              } else {
                                newSet.delete(hotel.location_id || String(idx));
                              }
                              setSelectedHotels(newSet);
                            }}
                            className="mt-1"
                          />
                          {hotel.photo?.images?.medium?.url && (
                            <img
                              src={hotel.photo.images.medium.url}
                              alt={hotel.name}
                              className="w-24 h-24 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold mb-1 truncate">{hotel.name}</h4>
                            {hotel.rating && (
                              <div className="flex items-center gap-1 text-sm mb-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{hotel.rating}</span>
                              </div>
                            )}
                            {hotel.price && (
                              <p className="text-sm font-medium">{hotel.price}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Create Trip Button */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t pt-4 pb-2 flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {selectedAttractions.size + selectedRestaurants.size + selectedHotels.size} عنصر محدد
              </div>
              <Button
                onClick={handleCreateTrip}
                disabled={isCreatingTrip || (selectedAttractions.size === 0 && selectedRestaurants.size === 0 && selectedHotels.size === 0) || !isSignedIn}
                className="gap-2"
                size="lg"
              >
                {isCreatingTrip ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    إنشاء خطة الرحلة
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TripAIChat;
