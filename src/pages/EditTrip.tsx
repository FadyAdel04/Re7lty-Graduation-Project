import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Calendar, DollarSign, Image as ImageIcon, Plus, Trash2, ArrowRight, ArrowLeft, Check, Star, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripMapEditor from "@/components/TripMapEditor";
import { TripLocation } from "@/components/TripMapEditor";
import LocationMediaManager from "@/components/LocationMediaManager";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { TripActivity, TripDay, FoodPlace } from "@/lib/trips-data";
import { getTrip, updateTrip } from "@/lib/api";

const EditTrip = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Step 1: Basic Info
  const [tripData, setTripData] = useState({
    title: "",
    destination: "",
    city: "",
    duration: "",
    budget: "",
    description: "",
    rating: 4.5,
    coverImage: null as File | null,
    coverImageUrl: "",
  });

  // Step 2: Activities with coordinates
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [locations, setLocations] = useState<TripLocation[]>([]);

  // Step 3: Organize activities into days
  const [days, setDays] = useState<TripDay[]>([]);
  const [currentDay, setCurrentDay] = useState(1);

  // Step 4: Food and Restaurants
  const [foodPlaces, setFoodPlaces] = useState<FoodPlace[]>([]);

  // Destination mapping
  const destinationMap: Record<string, string> = {
    alexandria: "الإسكندرية",
    matrouh: "مرسى مطروح",
    luxor: "الأقصر",
    aswan: "أسوان",
    hurghada: "الغردقة",
    sharm: "شرم الشيخ",
    dahab: "دهب",
    bahariya: "الواحات البحرية",
  };

  // Reverse destination mapping (Arabic to English key)
  const reverseDestinationMap: Record<string, string> = {
    "الإسكندرية": "alexandria",
    "مرسى مطروح": "matrouh",
    "الأقصر": "luxor",
    "أسوان": "aswan",
    "الغردقة": "hurghada",
    "شرم الشيخ": "sharm",
    "دهب": "dahab",
    "الواحات البحرية": "bahariya",
  };

  // Load trip data on mount
  useEffect(() => {
    const loadTrip = async () => {
      if (!id) {
        toast({
          title: "خطأ",
          description: "معرف الرحلة غير موجود",
          variant: "destructive",
        });
        navigate("/timeline");
        return;
      }

      setLoading(true);
      try {
        const trip = await getTrip(id);
        
        // Check ownership
        if (trip.ownerId !== user?.id) {
          toast({
            title: "غير مصرح",
            description: "يمكنك فقط تعديل رحلاتك الخاصة",
            variant: "destructive",
          });
          navigate(`/trips/${id}`);
          return;
        }

        // Populate trip data
        const destinationKey = reverseDestinationMap[trip.destination] || trip.destination || "";
        setTripData({
          title: trip.title || "",
          destination: destinationKey,
          city: trip.city || trip.destination || "",
          duration: trip.duration || "",
          budget: trip.budget || "",
          description: trip.description || "",
          rating: trip.rating || 4.5,
          coverImage: null,
          coverImageUrl: trip.image || "",
        });

        // Populate activities and locations
        if (trip.activities && trip.activities.length > 0) {
          const loadedLocations: TripLocation[] = trip.activities.map((act: any, idx: number) => ({
            id: act.id || `location-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: act.name || "",
            description: act.description || "",
            coordinates: Array.isArray(act.coordinates)
              ? [act.coordinates.lat || act.coordinates[0] || 0, act.coordinates.lng || act.coordinates[1] || 0]
              : [act.coordinates?.lat || 0, act.coordinates?.lng || 0],
            images: Array.isArray(act.images) ? act.images : [],
            videos: Array.isArray(act.videos) ? act.videos : [],
          }));

          setLocations(loadedLocations);
        }

        // Populate days
        if (trip.days && trip.days.length > 0) {
          const loadedDays: TripDay[] = trip.days.map((day: any, dayIdx: number) => {
            // Map activity indices based on day assignments
            const activityIndices: number[] = [];
            trip.activities?.forEach((act: any, actIdx: number) => {
              if (act.day === dayIdx + 1) {
                activityIndices.push(actIdx);
              }
            });
            return {
              title: day.title || `اليوم ${dayIdx + 1}`,
              activities: activityIndices,
            };
          });
          setDays(loadedDays);
        } else if (trip.activities && trip.activities.length > 0) {
          // Auto-create days if none exist
          const maxDay = Math.max(...trip.activities.map((act: any) => act.day || 1), 1);
          const newDays: TripDay[] = [];
          for (let i = 0; i < maxDay; i++) {
            const activityIndices: number[] = [];
            trip.activities.forEach((act: any, actIdx: number) => {
              if (act.day === i + 1) {
                activityIndices.push(actIdx);
              }
            });
            newDays.push({
              title: `اليوم ${i + 1}`,
              activities: activityIndices,
            });
          }
          setDays(newDays);
        }

        // Populate food places
        if (trip.foodAndRestaurants && trip.foodAndRestaurants.length > 0) {
          const loadedFoodPlaces: FoodPlace[] = trip.foodAndRestaurants.map((food: any) => ({
            name: food.name || "",
            image: food.image || "",
            rating: food.rating || 4.0,
            description: food.description || "",
          }));
          setFoodPlaces(loadedFoodPlaces);
        }
      } catch (error: any) {
        console.error("Error loading trip:", error);
        toast({
          title: "خطأ",
          description: error.message || "فشل تحميل الرحلة",
          variant: "destructive",
        });
        navigate("/timeline");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      loadTrip();
    }
  }, [id, user, navigate, toast]);

  // Update activities when locations change
  useEffect(() => {
    const newActivities: TripActivity[] = locations.map((loc, idx) => {
      const imageUrls: string[] = (loc.images || []).map((img) => {
        if (typeof img === 'string') return img;
        if (img instanceof File) return URL.createObjectURL(img);
        return '';
      }).filter(Boolean);
      
      return {
        name: loc.name || `موقع ${idx + 1}`,
        images: imageUrls,
        coordinates: Array.isArray(loc.coordinates) 
          ? { lat: loc.coordinates[0], lng: loc.coordinates[1] }
          : (loc.coordinates || { lat: 0, lng: 0 }),
        day: 1,
      };
    });
    setActivities(newActivities);
  }, [locations]);

  const handleCoverImageUpload = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setTripData({ ...tripData, coverImage: file, coverImageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addFoodPlace = () => {
    setFoodPlaces([...foodPlaces, { name: "", image: "", rating: 4.0, description: "" }]);
  };

  const removeFoodPlace = (index: number) => {
    setFoodPlaces(foodPlaces.filter((_, i) => i !== index));
  };

  const updateFoodPlace = (index: number, field: keyof FoodPlace, value: string | number) => {
    const updated = [...foodPlaces];
    updated[index] = { ...updated[index], [field]: value };
    setFoodPlaces(updated);
  };

  const handleFoodImageUpload = (index: number, files: FileList | null) => {
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFoodPlace(index, "image", reader.result as string);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const addDay = () => {
    setDays([...days, { title: `اليوم ${days.length + 1}`, activities: [] }]);
    setCurrentDay(days.length + 1);
  };

  const removeDay = (index: number) => {
    setDays(days.filter((_, i) => i !== index));
  };

  const updateDayTitle = (index: number, title: string) => {
    const updated = [...days];
    updated[index].title = title;
    setDays(updated);
  };

  const toggleActivityInDay = (dayIndex: number, activityIndex: number) => {
    const updated = [...days];
    const activityIndices = updated[dayIndex].activities;
    const idx = activityIndices.indexOf(activityIndex);
    if (idx > -1) {
      activityIndices.splice(idx, 1);
    } else {
      activityIndices.push(activityIndex);
    }
    setDays(updated);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!tripData.title || !tripData.destination || !tripData.duration || !tripData.budget || !tripData.description) {
        toast({
          title: "معلومات ناقصة",
          description: "الرجاء ملء جميع الحقول المطلوبة",
          variant: "destructive",
        });
        return;
      }
      const city = destinationMap[tripData.destination] || tripData.destination;
      setTripData({ ...tripData, city });
    } else if (currentStep === 2) {
      if (locations.length === 0) {
        toast({
          title: "لم يتم إضافة مواقع",
          description: "الرجاء إضافة موقع واحد على الأقل على الخريطة",
          variant: "destructive",
        });
        return;
      }
      if (days.length === 0) {
        const numDays = Math.ceil(locations.length / 3) || 1;
        const newDays: TripDay[] = [];
        for (let i = 0; i < numDays; i++) {
          newDays.push({ title: `اليوم ${i + 1}`, activities: [] });
        }
        setDays(newDays);
      }
    } else if (currentStep === 3) {
      const allAssignedActivities = new Set(days.flatMap(d => d.activities));
      if (allAssignedActivities.size < activities.length) {
        toast({
          title: "تنبيه",
          description: "بعض الأنشطة غير مخصصة لأي يوم. سيتم المتابعة.",
          variant: "default",
        });
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!id) return;

    if (!tripData.title || !tripData.destination || !tripData.duration || !tripData.budget || !tripData.description) {
      toast({
        title: "معلومات ناقصة",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (activities.length === 0) {
      toast({
        title: "معلومات ناقصة",
        description: "الرجاء إضافة نشاط واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      toast({
        title: "جاري حفظ التعديلات...",
        description: "يرجى الانتظار",
      });

      const coverImage = tripData.coverImageUrl || "";

      const finalActivities: TripActivity[] = await Promise.all(
        locations.map(async (location, index) => {
          const dayIndex = days.findIndex(d => d.activities.includes(index));
          
          const base64Images = await Promise.all(
            (location.images || []).map(async (img: string | File) => {
              if (typeof img === 'string' && img.startsWith('data:image')) {
                return img;
              } else if (img instanceof File) {
                return await fileToBase64(img);
              }
              return '';
            })
          );

          const base64Videos = await Promise.all(
            (location.videos || []).map(async (vid: string | File) => {
              if (typeof vid === 'string' && (vid.startsWith('data:video') || vid.startsWith('http'))) {
                return vid;
              } else if (vid instanceof File) {
                return await fileToBase64(vid);
              }
              return '';
            })
          );

          return {
            name: location.name || `موقع ${index + 1}`,
            images: base64Images.filter(img => img),
            videos: base64Videos.filter(vid => vid),
            coordinates: Array.isArray(location.coordinates) 
              ? { lat: location.coordinates[0], lng: location.coordinates[1] }
              : (location.coordinates || { lat: 0, lng: 0 }),
            day: dayIndex >= 0 ? dayIndex + 1 : 1,
          };
        })
      );

      const foodPlacesWithBase64 = await Promise.all(
        foodPlaces
          .filter(fp => fp.name && fp.image)
          .map(async (fp) => {
            let imageBase64 = String(fp.image || '');
            if (!imageBase64.startsWith('data:image')) {
              imageBase64 = '';
            }
            return {
              ...fp,
              image: imageBase64,
            };
          })
      );

      const token = await getToken();
      const payload = {
        title: tripData.title,
        destination: tripData.destination,
        city: tripData.city || destinationMap[tripData.destination] || tripData.destination,
        duration: tripData.duration,
        rating: tripData.rating,
        image: coverImage,
        description: tripData.description,
        budget: tripData.budget,
        activities: finalActivities,
        days: days.map((day) => ({
          ...day,
          activities: day.activities.filter(aIdx => aIdx < activities.length),
        })),
        foodAndRestaurants: foodPlacesWithBase64.filter(fp => fp.image),
      };

      await updateTrip(id, payload as any, token || undefined);

      toast({
        title: "تم التحديث",
        description: "تم تحديث الرحلة بنجاح",
      });

      navigate(`/trips/${id}`);
    } catch (error: any) {
      console.error("Error updating trip:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل تحديث الرحلة",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { number: 1, title: "معلومات أساسية" },
    { number: 2, title: "الأنشطة والمواقع" },
    { number: 3, title: "تنظيم الأيام" },
    { number: 4, title: "المطاعم والأكلات" },
    { number: 5, title: "المراجعة النهائية" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">جاري تحميل الرحلة...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl font-bold mb-4">
              تعديل <span className="text-gradient">رحلتك</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              قم بتحديث معلومات رحلتك
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 overflow-x-auto">
              {steps.map((step) => (
                <div key={step.number} className="flex items-center flex-1 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all flex-shrink-0 ${
                        currentStep >= step.number
                          ? 'bg-gradient-hero text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline truncate ${
                      currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {step.number < 5 && (
                    <div className={`h-1 flex-1 mx-2 rounded flex-shrink-0 ${
                      currentStep > step.number ? 'bg-gradient-hero' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <Card className="shadow-float-lg animate-slide-up">
              <CardHeader>
                <CardTitle>معلومات الرحلة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الرحلة *</Label>
                  <Input
                    id="title"
                    placeholder="مثال: جولة ساحلية في الإسكندرية"
                    className="text-lg"
                    value={tripData.title}
                    onChange={(e) => setTripData({ ...tripData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">الوجهة *</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                    <Select value={tripData.destination} onValueChange={(value) => {
                      const city = destinationMap[value] || value;
                      setTripData({ ...tripData, destination: value, city });
                    }}>
                      <SelectTrigger className="pr-10">
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alexandria">الإسكندرية</SelectItem>
                        <SelectItem value="matrouh">مرسى مطروح</SelectItem>
                        <SelectItem value="luxor">الأقصر</SelectItem>
                        <SelectItem value="aswan">أسوان</SelectItem>
                        <SelectItem value="hurghada">الغردقة</SelectItem>
                        <SelectItem value="sharm">شرم الشيخ</SelectItem>
                        <SelectItem value="dahab">دهب</SelectItem>
                        <SelectItem value="bahariya">الواحات البحرية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="duration">المدة *</Label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="duration"
                        placeholder="٣ أيام"
                        className="pr-10"
                        value={tripData.duration}
                        onChange={(e) => setTripData({ ...tripData, duration: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">الميزانية *</Label>
                    <div className="relative">
                      <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="budget"
                        placeholder="1500 جنيه"
                        className="pr-10"
                        value={tripData.budget}
                        onChange={(e) => setTripData({ ...tripData, budget: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">الوصف *</Label>
                  <Textarea
                    id="description"
                    placeholder="اكتب وصفاً شاملاً لرحلتك..."
                    rows={5}
                    value={tripData.description}
                    onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">التقييم المتوقع (اختياري)</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[tripData.rating]}
                      onValueChange={([value]) => setTripData({ ...tripData, rating: value })}
                      min={1}
                      max={5}
                      step={0.1}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1 min-w-[80px]">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-semibold">{tripData.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>صورة الغلاف *</Label>
                  {tripData.coverImageUrl || tripData.coverImage ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img
                        src={tripData.coverImageUrl || (tripData.coverImage ? URL.createObjectURL(tripData.coverImage) : "")}
                        alt="Cover"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={() => setTripData({ ...tripData, coverImage: null, coverImageUrl: "" })}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer block">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">
                        اسحب وأفلت الصورة هنا، أو انقر للاختيار
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG حتى 10MB
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCoverImageUpload(e.target.files)}
                      />
                    </label>
                  )}
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1" onClick={() => navigate(`/trips/${id}`)}>
                    إلغاء
                  </Button>
                  <Button className="flex-1" onClick={nextStep}>
                    التالي: الأنشطة والمواقع
                    <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Activities & Locations */}
          {currentStep === 2 && (
            <Card className="shadow-float-lg animate-slide-up">
              <CardHeader>
                <CardTitle>الأنشطة والمواقع</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  أضف المواقع والأنشطة على الخريطة أو يدوياً مع الإحداثيات والصور
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">الخريطة التفاعلية</h3>
                  <TripMapEditor
                    locations={locations}
                    route={[] as [number, number][]}
                    onLocationsChange={setLocations}
                    onRouteChange={() => {}}
                    destination={tripData.destination}
                  />
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">إضافة موقع يدوياً</h3>
                    <p className="text-sm text-muted-foreground">
                      أو استخدم النموذج أدناه لإضافة موقع بالإحداثيات يدوياً
                    </p>
                  </div>
                </div>

                {locations.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">إدارة الصور للمواقع</h3>
                    <LocationMediaManager
                      locations={locations}
                      onLocationsChange={setLocations}
                    />
                  </div>
                )}

                {locations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-semibold mb-2">لا توجد مواقع بعد</p>
                    <p className="text-sm">انقر على الخريطة أعلاه أو استخدم زر "إضافة موقع يدوياً" لإضافة موقع</p>
                  </div>
                )}

                {locations.length > 0 && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          تم إضافة {locations.length} موقع
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          تأكد من إضافة اسم و صور لكل موقع
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1" onClick={prevStep}>
                    <ArrowRight className="h-4 w-4 ml-2" />
                    السابق
                  </Button>
                  <Button className="flex-1" onClick={nextStep} disabled={locations.length === 0}>
                    التالي: تنظيم الأيام
                    <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Organize Days */}
          {currentStep === 3 && (
            <Card className="shadow-float-lg animate-slide-up">
              <CardHeader>
                <CardTitle>تنظيم الأيام</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  نظم الأنشطة في أيام محددة من رحلتك
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label>الأيام</Label>
                  <Button variant="outline" size="sm" onClick={addDay}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة يوم
                  </Button>
                </div>

                {days.length === 0 && (
                  <div className="text-center py-8">
                    <Button onClick={addDay} variant="outline">
                      <Plus className="h-4 w-4 ml-2" />
                      أضف أول يوم
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {days.map((day, dayIndex) => (
                    <Card key={dayIndex} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Input
                            value={day.title}
                            onChange={(e) => updateDayTitle(dayIndex, e.target.value)}
                            className="text-lg font-bold border-0 focus-visible:ring-0"
                            placeholder={`اليوم ${dayIndex + 1}`}
                          />
                          {days.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDay(dayIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activities.map((activity, activityIndex) => (
                            <Button
                              key={activityIndex}
                              variant={day.activities.includes(activityIndex) ? "default" : "outline"}
                              className="justify-start h-auto p-3"
                              onClick={() => toggleActivityInDay(dayIndex, activityIndex)}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <Check className={`h-4 w-4 ${day.activities.includes(activityIndex) ? "opacity-100" : "opacity-0"}`} />
                                <span className="text-right flex-1">{activity.name}</span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1" onClick={prevStep}>
                    <ArrowRight className="h-4 w-4 ml-2" />
                    السابق
                  </Button>
                  <Button className="flex-1" onClick={nextStep}>
                    التالي: المطاعم والأكلات
                    <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Food & Restaurants */}
          {currentStep === 4 && (
            <Card className="shadow-float-lg animate-slide-up">
              <CardHeader>
                <CardTitle>المطاعم والأكلات</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  أضف المطاعم والأكلات المميزة التي جربتها (اختياري)
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label>المطاعم</Label>
                  <Button variant="outline" size="sm" onClick={addFoodPlace}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مطعم
                  </Button>
                </div>

                {foodPlaces.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد مطاعم بعد. يمكنك إضافتها الآن أو تخطي هذه الخطوة.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {foodPlaces.map((place, index) => (
                    <Card key={index} className="border">
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>اسم المطعم *</Label>
                            <Input
                              value={place.name}
                              onChange={(e) => updateFoodPlace(index, "name", e.target.value)}
                              placeholder="مثال: مطعم محمد أحمد"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>التقييم</Label>
                            <div className="flex items-center gap-3">
                              <Slider
                                value={[place.rating]}
                                onValueChange={([value]) => updateFoodPlace(index, "rating", value)}
                                min={1}
                                max={5}
                                step={0.1}
                                className="flex-1"
                              />
                              <div className="flex items-center gap-1 min-w-[80px]">
                                <Star className="h-4 w-4 fill-primary text-primary" />
                                <span className="font-semibold">{place.rating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>الوصف</Label>
                          <Textarea
                            value={place.description || ""}
                            onChange={(e) => updateFoodPlace(index, "description", e.target.value)}
                            placeholder="وصف المطعم أو الأكلة المميزة..."
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>صورة المطعم *</Label>
                          {place.image ? (
                            <div className="relative rounded-lg overflow-hidden">
                              <img
                                src={place.image}
                                alt={place.name}
                                className="w-full h-48 object-cover"
                              />
                              <button
                                onClick={() => updateFoodPlace(index, "image", "")}
                                className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer block">
                              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">اضغط لاختيار صورة</p>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFoodImageUpload(index, e.target.files)}
                              />
                            </label>
                          )}
                        </div>

                        {foodPlaces.length > 1 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFoodPlace(index)}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف المطعم
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1" onClick={prevStep}>
                    <ArrowRight className="h-4 w-4 ml-2" />
                    السابق
                  </Button>
                  <Button className="flex-1" onClick={nextStep}>
                    التالي: المراجعة النهائية
                    <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <Card className="shadow-float-lg animate-slide-up">
              <CardHeader>
                <CardTitle>المراجعة النهائية</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  راجع معلومات رحلتك قبل الحفظ
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">المعلومات الأساسية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">العنوان</Label>
                      <p className="font-semibold">{tripData.title}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">الوجهة</Label>
                      <p className="font-semibold">{tripData.city}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">المدة</Label>
                      <p className="font-semibold">{tripData.duration}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">الميزانية</Label>
                      <p className="font-semibold">{tripData.budget}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">الوصف</Label>
                    <p className="mt-1">{tripData.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold">الأنشطة ({activities.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activities.map((activity, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <p className="font-semibold">{activity.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.coordinates.lat.toFixed(4)}, {activity.coordinates.lng.toFixed(4)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold">الأيام ({days.length})</h3>
                  <div className="space-y-2">
                    {days.map((day, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <p className="font-semibold mb-2">{day.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.activities.length} نشاط
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {foodPlaces.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold">المطاعم ({foodPlaces.filter(fp => fp.name).length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {foodPlaces.filter(fp => fp.name).map((place, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="font-semibold">{place.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span className="text-sm">{place.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1" onClick={prevStep} disabled={isSaving}>
                    <ArrowRight className="h-4 w-4 ml-2" />
                    السابق
                  </Button>
                  <Button className="flex-1" onClick={handleSubmit} size="lg" disabled={isSaving}>
                    <Check className="h-5 w-5 ml-2" />
                    {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditTrip;
