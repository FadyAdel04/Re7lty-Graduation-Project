import { useMemo, useState } from "react";
import { egyptTrips } from "@/lib/trips-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, X, Send, MapPin, Star, Heart, Loader2, Utensils, Hotel, Camera, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getTripPlan, type TripPlan, type TravelAdvisorAttraction, type TravelAdvisorRestaurant, type TravelAdvisorHotel } from "@/lib/travel-advisor-api";
import { useToast } from "@/hooks/use-toast";
import { createTrip } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";

const TRIP_TYPES = ["تاريخية", "ساحلية", "مغامرات", "استرخاء", "غوص"] as const;

type TripType = typeof TRIP_TYPES[number];

const TripAIChatWidget = () => {
  // Extended list of Egyptian cities for Travel Advisor API
  const allCities = useMemo(() => {
    const tripCities = Array.from(new Set(egyptTrips.map((t) => t.city)));
    const additionalCities = [
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
    return Array.from(new Set([...tripCities, ...additionalCities]));
  }, []);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [city, setCity] = useState<string>("");
  const [days, setDays] = useState<string>("");
  const [tripType, setTripType] = useState<TripType | "">("");
  const [salary, setSalary] = useState<string>("");
  const [suggestions, setSuggestions] = useState<typeof egyptTrips>([]);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [showTripPlanDialog, setShowTripPlanDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAttractions, setSelectedAttractions] = useState<Set<string>>(new Set());
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<string>>(new Set());
  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set());
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const { toast } = useToast();
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();

  const reset = () => {
    setStep(0);
    setCity("");
    setDays("");
    setTripType("");
    setSalary("");
    setSuggestions([]);
    setTripPlan(null);
    setShowTripPlanDialog(false);
    setSelectedAttractions(new Set());
    setSelectedRestaurants(new Set());
    setSelectedHotels(new Set());
  };

  const computeSuggestions = async () => {
    if (!city) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المدينة أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const numDays = parseInt(days || "3");
      const plan = await getTripPlan(city, numDays);
      
      if (plan) {
        setTripPlan(plan);
        setShowTripPlanDialog(true);
        setStep(4);
        // Auto-select all items by default
        const allAttractions = new Set(plan.attractions.map(a => a.location_id || plan.attractions.indexOf(a).toString()));
        const allRestaurants = new Set(plan.restaurants.map(r => r.location_id || plan.restaurants.indexOf(r).toString()));
        const allHotels = new Set(plan.hotels.map(h => h.location_id || plan.hotels.indexOf(h).toString()));
        setSelectedAttractions(allAttractions);
        setSelectedRestaurants(allRestaurants);
        setSelectedHotels(allHotels);
      } else {
        toast({
          title: "لم يتم العثور على نتائج",
          description: "لم نتمكن من العثور على رحلة لهذه المدينة. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching trip plan:", error);
      toast({
        title: "خطأ في الاتصال",
        description: error.message || "حدث خطأ أثناء جلب بيانات الرحلة. يرجى المحاولة مرة أخرى.",
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
        day: Math.floor(idx / 3) + 1, // Distribute across days
      }));

      const foodAndRestaurants = selectedRestaurantsList.map((restaurant) => ({
        name: restaurant.name,
        image: restaurant.photo?.images?.medium?.url || "",
        rating: parseFloat(restaurant.rating || "4.5"),
        description: restaurant.description || restaurant.cuisine?.map(c => c.name).join(", ") || "",
      }));

      // Create days based on number of days
      const numDays = parseInt(days || "3");
      const daysArray = Array.from({ length: numDays }, (_, i) => ({
        title: `اليوم ${i + 1}`,
        activities: activities
          .map((_, idx) => idx)
          .filter((_, idx) => Math.floor(idx / 3) === i),
      }));

      // Get main image from first attraction or restaurant
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
        budget: salary ? `${salary} جنيه مصري` : "غير محدد",
        activities: activities,
        days: daysArray,
        foodAndRestaurants: foodAndRestaurants,
        isAIGenerated: true, // Mark as AI-generated
      };

      const createdTrip = await createTrip(tripData, token);
      
      toast({
        title: "تم إنشاء الرحلة بنجاح",
        description: "تم حفظ رحلتك في ملفك الشخصي",
      });

      // Reset and close
      reset();
      setShowTripPlanDialog(false);
      
      // Navigate to trip detail page
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

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="space-y-2">
          <div className="text-sm">مرحباً! سأساعدك لإيجاد أفضل رحلة. ما المدينة التي ترغب بزيارتها؟</div>
          <Select value={city} onValueChange={(v) => setCity(v)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المدينة" />
            </SelectTrigger>
            <SelectContent>
              {allCities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end">
            <Button size="sm" className="rounded-full" disabled={!city} onClick={() => setStep(1)}>
              التالي
            </Button>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-2">
          <div className="text-sm">كم عدد الأيام المتاحة لديك؟</div>
          <Input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep(0)}>رجوع</Button>
            <Button size="sm" className="rounded-full" disabled={!days} onClick={() => setStep(2)}>
              التالي
            </Button>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-2">
          <div className="text-sm">ما نوع الرحلة التي تفضلها؟</div>
          <Select value={tripType || undefined} onValueChange={(v) => setTripType(v as TripType)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر النوع" />
            </SelectTrigger>
            <SelectContent>
              {TRIP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>رجوع</Button>
            <Button size="sm" className="rounded-full" disabled={!tripType} onClick={() => setStep(3)}>
              التالي
            </Button>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-2">
          <div className="text-sm">ما ميزانيتك التقريبية بالجنيه المصري؟</div>
          <Input type="number" min={0} value={salary} onChange={(e) => setSalary(e.target.value)} />
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>رجوع</Button>
            <Button 
              size="sm" 
              className="rounded-full" 
              onClick={computeSuggestions}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري البحث...
                </>
              ) : (
                "اقترح رحلات"
              )}
            </Button>
          </div>
        </div>
      );
    }

    // step 4 results
    return (
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground">جاري البحث عن أفضل الرحلات...</div>
          </div>
        ) : tripPlan ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-center p-2 bg-primary/10 rounded-lg">
              ✓ تم إنشاء خطة رحلة مخصصة لـ {city}
            </div>
            <Button 
              className="w-full" 
              onClick={() => setShowTripPlanDialog(true)}
            >
              عرض تفاصيل الرحلة الكاملة
            </Button>
            <div className="pt-1 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>إعادة البدء</Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">لم أجد نتائج مطابقة. جرّب تعديل المعايير.</div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle Button */}
      {!open && (
        <Button className="rounded-full shadow-lg" onClick={() => setOpen(true)}>
          <MessageCircle className="h-4 w-4 ml-2" /> مساعد الرحلات
        </Button>
      )}
      {open && (
        <div className="w-[92vw] max-w-sm bg-background border rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
            <div className="font-bold">مساعد الرحلات الذكي</div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
            {renderStep()}
          </div>
          <div className="px-4 py-2 border-t text-xs text-muted-foreground">مدعوم بـ Travel Advisor API</div>
        </div>
      )}

      {/* Trip Plan Details Dialog */}
      <Dialog open={showTripPlanDialog} onOpenChange={setShowTripPlanDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">خطة رحلة مخصصة - {city}</DialogTitle>
            <DialogDescription>
              خطة رحلة لمدة {days} أيام في {city}
            </DialogDescription>
          </DialogHeader>

          {tripPlan && (
            <div className="space-y-6 py-4">
              {/* Location Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
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
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    المعالم السياحية ({tripPlan.attractions.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {tripPlan.attractions.map((attraction, idx) => {
                      const isSelected = selectedAttractions.has(attraction.location_id || String(idx));
                      return (
                      <div key={attraction.location_id || idx} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
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
                            {attraction.address && (
                              <p className="text-xs text-muted-foreground mt-1">{attraction.address}</p>
                            )}
                            {attraction.website && (
                              <a 
                                href={attraction.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-1 block"
                              >
                                زيارة الموقع
                              </a>
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
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" />
                    المطاعم ({tripPlan.restaurants.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {tripPlan.restaurants.map((restaurant, idx) => {
                      const isSelected = selectedRestaurants.has(restaurant.location_id || String(idx));
                      return (
                      <div key={restaurant.location_id || idx} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
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
                                {restaurant.num_reviews && (
                                  <span className="text-muted-foreground">({restaurant.num_reviews} تقييم)</span>
                                )}
                              </div>
                            )}
                            {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {restaurant.cuisine.map(c => c.name).filter(Boolean).join(", ")}
                              </p>
                            )}
                            {restaurant.price_level && (
                              <p className="text-xs text-muted-foreground">
                                مستوى الأسعار: {"$".repeat(parseInt(restaurant.price_level) || 0)}
                              </p>
                            )}
                            {restaurant.address && (
                              <p className="text-xs text-muted-foreground mt-1">{restaurant.address}</p>
                            )}
                            {restaurant.website && (
                              <a 
                                href={restaurant.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-1 block"
                              >
                                زيارة الموقع
                              </a>
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
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Hotel className="h-5 w-5 text-primary" />
                    الفنادق ({tripPlan.hotels.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {tripPlan.hotels.map((hotel, idx) => {
                      const isSelected = selectedHotels.has(hotel.location_id || String(idx));
                      return (
                      <div key={hotel.location_id || idx} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
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
                                {hotel.num_reviews && (
                                  <span className="text-muted-foreground">({hotel.num_reviews} تقييم)</span>
                                )}
                              </div>
                            )}
                            {hotel.price && (
                              <p className="text-sm font-medium mb-1">{hotel.price}</p>
                            )}
                            {hotel.amenities && hotel.amenities.length > 0 && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {hotel.amenities.slice(0, 3).map(a => a.name).filter(Boolean).join(", ")}
                              </p>
                            )}
                            {hotel.address && (
                              <p className="text-xs text-muted-foreground mt-1">{hotel.address}</p>
                            )}
                            {hotel.website && (
                              <a 
                                href={hotel.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-1 block"
                              >
                                زيارة الموقع
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tripPlan.attractions.length === 0 && tripPlan.restaurants.length === 0 && tripPlan.hotels.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لم يتم العثور على معلومات كافية لهذه المدينة
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <div className="flex gap-2 w-full justify-between">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {selectedAttractions.size + selectedRestaurants.size + selectedHotels.size} عنصر محدد
              </div>
              <Button
                onClick={handleCreateTrip}
                disabled={isCreatingTrip || (selectedAttractions.size === 0 && selectedRestaurants.size === 0 && selectedHotels.size === 0) || !isSignedIn}
                className="gap-2"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripAIChatWidget;
