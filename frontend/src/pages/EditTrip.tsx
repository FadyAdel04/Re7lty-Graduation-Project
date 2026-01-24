import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { MapPin, Calendar, DollarSign, Image as ImageIcon, Plus, Trash2, ArrowRight, ArrowLeft, Check, Star, Utensils, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripMapEditor from "@/components/TripMapEditor";
import { TripLocation } from "@/components/TripMapEditor";
import LocationMediaManager from "@/components/LocationMediaManager";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth } from "@clerk/clerk-react";
import { TripActivity, TripDay, FoodPlace, Hotel } from "@/lib/trips-data";
import { getTrip, updateTrip } from "@/lib/api";
import UploadProgressLoader from "@/components/UploadProgressLoader";

const EditTrip = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    show: false,
    total: 0,
    completed: 0,
    currentItem: "",
    isProcessing: false,
  });
  
  // Step 1: Basic Info
  const [tripData, setTripData] = useState({
    title: "",
    destination: "",
    city: "",
    duration: "",
    budget: "",
    season: "" as string, // winter, summer, fall, spring
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

  // Step 5: Hotels
  const [hotels, setHotels] = useState<Hotel[]>([]);

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
          season: trip.season || "",
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

        // Populate hotels
        if (trip.hotels && trip.hotels.length > 0) {
          const loadedHotels: Hotel[] = trip.hotels.map((hotel: any) => ({
            name: hotel.name || "",
            image: hotel.image || "",
            rating: hotel.rating || 4.0,
            description: hotel.description || "",
            priceRange: hotel.priceRange || "",
          }));
          setHotels(loadedHotels);
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

  // Set initial step from location state if available
  useEffect(() => {
    if (location.state && (location.state as any).initialStep) {
      setCurrentStep((location.state as any).initialStep);
    }
  }, [location.state]);

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

  const addHotel = () => {
    setHotels([...hotels, { name: "", image: "", rating: 4.0, description: "", priceRange: "" }]);
  };

  const removeHotel = (index: number) => {
    setHotels(hotels.filter((_, i) => i !== index));
  };

  const updateHotel = (index: number, field: keyof Hotel, value: string | number) => {
    const updated = [...hotels];
    updated[index] = { ...updated[index], [field]: value };
    setHotels(updated);
  };

  const handleHotelImageUpload = (index: number, files: FileList | null) => {
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateHotel(index, "image", reader.result as string);
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
    
    // Calculate total items to process
    const totalImages = locations.reduce((sum, loc) => sum + (loc.images || []).filter((img: any) => img instanceof File).length, 0);
    const totalVideos = locations.reduce((sum, loc) => sum + (loc.videos || []).filter((vid: any) => vid instanceof File).length, 0);
    const totalItems = totalImages + totalVideos;

    // Show upload progress if there are files to process
    if (totalItems > 0) {
      setUploadProgress({
        show: true,
        total: totalItems,
        completed: 0,
        currentItem: "جاري تحضير الملفات...",
        isProcessing: false,
      });
    }

    try {
      toast({
        title: "جاري حفظ التعديلات...",
        description: "يرجى الانتظار",
      });

      const coverImage = tripData.coverImageUrl || "";

      let processedCount = 0;

      const finalActivities: TripActivity[] = await Promise.all(
        locations.map(async (location, index) => {
          const dayIndex = days.findIndex(d => d.activities.includes(index));
          
          const base64Images = await Promise.all(
            (location.images || []).map(async (img: string | File) => {
              if (typeof img === 'string' && img.startsWith('data:image')) {
                return img;
              } else if (img instanceof File) {
                processedCount++;
                setUploadProgress(prev => ({
                  ...prev,
                  completed: processedCount,
                  currentItem: `جاري رفع الصورة: ${location.name || `موقع ${index + 1}`}`,
                }));
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
                processedCount++;
                setUploadProgress(prev => ({
                  ...prev,
                  completed: processedCount,
                  currentItem: `جاري رفع الفيديو: ${location.name || `موقع ${index + 1}`}`,
                }));
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

      // Update progress to show processing
      if (totalItems > 0) {
        setUploadProgress(prev => ({
          ...prev,
          isProcessing: true,
          currentItem: "جاري إرسال البيانات...",
        }));
      }

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
        season: tripData.season || undefined,
        foodAndRestaurants: foodPlacesWithBase64.filter(fp => fp.image),
        hotels: hotels.filter(h => h.name && h.image),
      };

      await updateTrip(id, payload as any, token || undefined);
      
      // Hide progress loader
      setUploadProgress(prev => ({ ...prev, show: false }));

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
      setUploadProgress(prev => ({ ...prev, show: false }));
    }
  };

  const steps = [
    { number: 1, title: "معلومات أساسية" },
    { number: 2, title: "الأنشطة والمواقع" },
    { number: 3, title: "تنظيم الأيام" },
    { number: 4, title: "المطاعم والأكلات" },
    { number: 5, title: "الفنادق والإقامة" },
    { number: 6, title: "المراجعة النهائية" },
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
    <div className="min-h-screen bg-[#F8FAFC] font-cairo text-right" dir="rtl">
      {uploadProgress.show && (
        <UploadProgressLoader
          totalItems={uploadProgress.total}
          completedItems={uploadProgress.completed}
          currentItem={uploadProgress.currentItem}
          isProcessing={uploadProgress.isProcessing}
        />
      )}
      <Header />
      
      <main className="pb-24">
        {/* 1. Cinematic Hero Header */}
        <section className="relative h-[300px] w-full overflow-hidden bg-indigo-900">
           <div className="absolute inset-0 z-0">
              <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 via-indigo-900/70 to-[#F8FAFC]" />
           </div>
           
           <div className="container mx-auto px-4 relative z-10 h-full flex flex-col items-center justify-center pt-10">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 animate-slide-up">
                 تحديث <span className="text-orange-500">رحلتك</span>
              </h1>
              <p className="text-indigo-100 text-lg font-bold max-w-2xl text-center">قم بتعديل وتحسين تفاصيل مغامرتك المسجلة</p>
           </div>
        </section>

        {/* 2. Steps Indicator */}
        <div className="container mx-auto px-4 -mt-16 relative z-20">
           <div className="max-w-5xl mx-auto mb-10">
              <Card className="border-0 shadow-2xl rounded-[3rem] bg-white/90 backdrop-blur-xl overflow-hidden p-6 md:p-8">
                 <div className="flex flex-wrap items-center justify-between gap-4 px-4">
                    {steps.map((step) => {
                       const isActive = currentStep === step.number;
                       const isCompleted = currentStep > step.number;
                       
                       return (
                         <div 
                           key={step.number} 
                           className={cn(
                             "flex items-center gap-3 transition-all duration-300",
                             step.number <= currentStep ? "opacity-100" : "opacity-40"
                           )}
                         >
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all duration-500",
                              isActive ? "bg-orange-600 text-white shadow-xl shadow-orange-200 scale-110" : 
                              isCompleted ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"
                            )}>
                               {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                            </div>
                            <span className={cn("hidden xl:block text-sm font-black", isActive ? "text-gray-900" : "text-gray-500")}>
                               {step.title}
                            </span>
                            {step.number < 6 && (
                              <div className="hidden 2xl:block w-6 h-0.5 bg-gray-100 mx-1" />
                            )}
                         </div>
                       );
                    })}
                 </div>
              </Card>
            </div>
         </div>
            <div className="max-w-4xl mx-auto">

           {/* Step 1: Basic Information */}
           {currentStep === 1 && (
              <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-5 duration-700">
                 <div className="p-10 space-y-8">
                    <div className="space-y-4">
                       <Label className="text-xl font-black text-gray-900 pr-2">عنوان الرحلة</Label>
                       <Input 
                         className="h-16 rounded-2xl bg-gray-50 border-gray-100 text-xl font-bold px-6 focus:bg-white transition-all"
                         placeholder="مثال: جولة تاريخية في معابد الأقصر"
                         value={tripData.title}
                         onChange={(e) => setTripData({ ...tripData, title: e.target.value })}
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <Label className="text-xl font-black text-gray-900 pr-2">الوجهة</Label>
                          <Select value={tripData.destination} onValueChange={(v) => {
                             const city = destinationMap[v] || v;
                             setTripData({...tripData, destination: v, city});
                          }}>
                             <SelectTrigger className="h-16 rounded-2xl bg-gray-50 border-gray-100 text-lg font-bold">
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
                       <div className="space-y-4">
                          <Label className="text-xl font-black text-gray-900 pr-2">الموسم (اختياري)</Label>
                          <Select value={tripData.season} onValueChange={(v) => setTripData({...tripData, season: v})}>
                             <SelectTrigger className="h-16 rounded-2xl bg-gray-50 border-gray-100 text-lg font-bold">
                                <SelectValue placeholder="أي وقت في السنة؟" />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="winter">❄️ الشتاء</SelectItem>
                                <SelectItem value="summer">☀️ الصيف</SelectItem>
                                <SelectItem value="fall">🍂 الخريف</SelectItem>
                                <SelectItem value="spring">🌸 الربيع</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <Label className="text-xl font-black text-gray-900 pr-2">المدة</Label>
                          <div className="relative">
                             <Clock className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                             <Input className="h-16 rounded-2xl bg-gray-50 border-gray-100 pr-14 text-lg font-bold" placeholder="مثال: ٣ أيام" value={tripData.duration} onChange={(e) => setTripData({...tripData, duration: e.target.value})} />
                          </div>
                       </div>
                       <div className="space-y-4">
                          <Label className="text-xl font-black text-gray-900 pr-2">الميزانية</Label>
                          <div className="relative">
                             <DollarSign className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                             <Input className="h-16 rounded-2xl bg-gray-50 border-gray-100 pr-14 text-lg font-bold" placeholder="مثال: ٢٠٠٠ ج.م" value={tripData.budget} onChange={(e) => setTripData({...tripData, budget: e.target.value})} />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <Label className="text-xl font-black text-gray-900 pr-2">ما قصتك في هذه الرحلة؟</Label>
                       <Textarea 
                         className="rounded-[2rem] bg-gray-50 border-gray-100 text-lg font-medium p-8 min-h-[200px] focus:bg-white transition-all"
                         placeholder="صِف تجاربك، مشاعرك، والنصائح التي تود مشاركتها..."
                         value={tripData.description}
                         onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                       />
                    </div>

                    <div className="space-y-4">
                       <Label className="text-xl font-black text-gray-900 pr-2">صورة الغلاف</Label>
                       <div className="relative group">
                          {tripData.coverImageUrl ? (
                             <div className="relative h-64 rounded-[2.5rem] overflow-hidden">
                                <img src={tripData.coverImageUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <label className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black cursor-pointer hover:scale-105 transition-transform">
                                      تغيير الصورة
                                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCoverImageUpload(e.target.files)} />
                                   </label>
                                </div>
                             </div>
                          ) : (
                             <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-gray-50 hover:bg-white hover:border-indigo-400 transition-all cursor-pointer">
                                <ImageIcon className="w-12 h-12 text-gray-300 mb-4" />
                                <span className="text-gray-400 font-bold">اختر صورة ملهمة لرحلتك</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCoverImageUpload(e.target.files)} />
                             </label>
                          )}
                       </div>
                    </div>

                    <div className="flex gap-4 pt-8">
                       <Button onClick={() => navigate(`/trips/${id}`)} variant="outline" className="h-20 flex-1 rounded-[2rem] font-black text-xl border-gray-100">إلغاء</Button>
                       <Button onClick={nextStep} className="h-20 flex-1 rounded-[2rem] bg-indigo-600 text-white font-black text-xl shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-transform">
                          التالي: الأنشطة
                          <ArrowLeft className="h-5 w-5 mr-3" />
                       </Button>
                    </div>
                 </div>
              </Card>
           )}

           {/* Step 2: Activities & Map */}
           {currentStep === 2 && (
             <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
               <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                  <CardHeader className="bg-indigo-50/50 p-10 border-b border-indigo-100/50">
                     <CardTitle className="text-3xl font-black text-gray-900 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                           <MapPin className="w-6 h-6" />
                        </div>
                        تحديد المواقع والأنشطة
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                     <div className="rounded-[3rem] overflow-hidden shadow-inner border-8 border-white bg-gray-100 aspect-video relative">
                       <TripMapEditor
                         locations={locations}
                         route={[] as [number, number][]}
                         onLocationsChange={setLocations}
                         onRouteChange={() => {}}
                         destination={tripData.destination}
                       />
                     </div>

                     {locations.length > 0 && (
                        <div className="space-y-6">
                           <h3 className="text-2xl font-black text-gray-900 px-2">إدارة صور المواقع <span className="text-indigo-600">({locations.length})</span></h3>
                           <LocationMediaManager locations={locations} onLocationsChange={setLocations} />
                        </div>
                     )}

                     <div className="flex gap-4 pt-10">
                        <Button variant="outline" onClick={prevStep} className="h-16 rounded-[1.5rem] px-10 font-black border-gray-100">السابق</Button>
                        <Button onClick={nextStep} className="flex-1 h-16 rounded-[1.5rem] bg-orange-600 text-white text-xl font-black shadow-2xl shadow-orange-100">
                           متابعة تنظيم الأيام
                           <ArrowLeft className="mr-3 w-6 h-6" />
                        </Button>
                     </div>
                  </CardContent>
               </Card>
             </div>
           )}

           {/* Step 3: Organize Days */}
           {currentStep === 3 && (
             <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
               <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                  <CardHeader className="bg-emerald-50/50 p-10">
                     <CardTitle className="text-3xl font-black text-gray-900">جدولة الرحلة</CardTitle>
                     <p className="text-gray-500 font-bold mt-2">قم بزيادة جودة رحلتك بتنظيم المواقع حسب الأيام.</p>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                     <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                        {days.map((day, dIdx) => (
                           <Button 
                             key={dIdx} 
                             onClick={() => setCurrentDay(dIdx + 1)}
                             variant={currentDay === dIdx + 1 ? "default" : "outline"}
                             className={cn(
                               "h-16 rounded-2xl px-10 font-black gap-3 shrink-0 transition-all", 
                               currentDay === dIdx + 1 ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100" : "border-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"
                             )}
                           >
                              {day.title}
                              {day.activities.length > 0 && <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{day.activities.length}</span>}
                           </Button>
                        ))}
                        <Button onClick={addDay} variant="ghost" className="h-16 w-16 rounded-2xl border-4 border-dashed border-gray-100 text-gray-300 p-0"><Plus className="w-8 h-8" /></Button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <h4 className="text-xl font-black text-gray-800 flex items-center gap-2">الأنشطة المتاحة <Badge className="bg-orange-50 text-orange-600 border-orange-100">{activities.length}</Badge></h4>
                           <div className="space-y-4">
                              {activities.map((act, idx) => {
                                 const isAssigned = days.some(d => d.activities.includes(idx));
                                 const isCurrentDay = days[currentDay-1]?.activities.includes(idx);
                                 
                                 return (
                                   <button 
                                     key={idx} 
                                     onClick={() => toggleActivityInDay(currentDay-1, idx)}
                                     className={cn(
                                       "w-full p-5 rounded-3xl border-2 text-right transition-all flex items-center justify-between group",
                                       isCurrentDay ? "border-emerald-500 bg-emerald-50/50 shadow-lg" : 
                                       isAssigned ? "opacity-30 border-gray-50 filter grayscale" : "border-gray-50 hover:border-orange-100 hover:bg-orange-50/20"
                                     )}
                                   >
                                      <div className="flex items-center gap-4">
                                         <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm bg-white border-2 border-white"><img src={act.images?.[0]} className="w-full h-full object-cover" /></div>
                                         <span className="font-black text-gray-700 text-lg">{act.name}</span>
                                      </div>
                                      {isCurrentDay ? <div className="bg-emerald-500 text-white rounded-full p-1.5"><Check className="w-4 h-4" /></div> : <Plus className="w-6 h-6 text-gray-200 group-hover:text-orange-400 transition-colors" />}
                                   </button>
                                 );
                              })}
                           </div>
                        </div>

                        <div className="bg-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                           <div className="relative z-10">
                              <h4 className="text-2xl font-black text-indigo-100 mb-8 flex items-center gap-3">
                                 <div className="w-10 h-10 bg-indigo-500/50 rounded-xl flex items-center justify-center text-white"><Clock className="w-5 h-5" /></div>
                                 خطة {days[currentDay-1]?.title}
                              </h4>
                              {days[currentDay - 1]?.activities.length === 0 ? (
                                 <div className="py-20 text-center space-y-4">
                                    <div className="w-20 h-20 bg-indigo-800 rounded-full flex items-center justify-center mx-auto text-indigo-400 italic">...</div>
                                    <p className="text-indigo-400 font-bold text-lg">لم تقم بإضافة أي أنشطة لهذا اليوم بعد.</p>
                                 </div>
                              ) : (
                                 <div className="space-y-4">
                                    {days[currentDay-1]?.activities.map((actIdx) => (
                                      <div key={actIdx} className="p-5 bg-white/10 backdrop-blur-md rounded-[1.5rem] flex items-center justify-between border border-white/10 group">
                                         <span className="text-xl font-black">{activities[actIdx].name}</span>
                                         <button onClick={() => toggleActivityInDay(currentDay-1, actIdx)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                      </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-4 pt-10">
                        <Button variant="outline" onClick={prevStep} className="h-16 rounded-[1.5rem] px-10 font-black border-gray-100">السابق</Button>
                        <Button onClick={nextStep} className="flex-1 h-16 rounded-[1.5rem] bg-orange-600 text-white text-xl font-black shadow-2xl shadow-orange-100">
                           متابعة إلى المطاعم
                           <ArrowLeft className="mr-3 w-6 h-6" />
                        </Button>
                     </div>
                  </CardContent>
               </Card>
             </div>
           )}

           {/* Step 4: Food & Restaurants */}
           {currentStep === 4 && (
             <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
               <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                  <CardHeader className="bg-orange-50/50 p-10 border-b border-orange-100/50 flex flex-row items-center justify-between">
                     <CardTitle className="text-3xl font-black text-gray-900 flex items-center gap-4">
                        <Utensils className="w-8 h-8 text-orange-600" />
                        المطاعم وتجارب الطعام
                     </CardTitle>
                     <Button onClick={addFoodPlace} className="bg-orange-600 hover:bg-orange-700 h-14 rounded-2xl px-8 font-black gap-2">
                        <Plus className="w-5 h-5" /> إضافة مطعم
                     </Button>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                     {foodPlaces.length === 0 ? (
                        <div className="py-20 text-center space-y-6">
                           <div className="w-24 h-24 bg-orange-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                              <Utensils className="w-10 h-10 text-orange-200" />
                           </div>
                           <p className="text-gray-400 font-bold text-xl">لم تضف أي تجارب طعام بعد. يمكنك تخطي هذه الخطوة أو البدء الآن.</p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {foodPlaces.map((place, idx) => (
                              <Card key={idx} className="border-0 bg-gray-50/50 rounded-[2.5rem] overflow-hidden group hover:bg-white hover:shadow-2xl transition-all border border-transparent hover:border-orange-100">
                                 <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start">
                                       <div className="space-y-4 flex-1">
                                          <Input 
                                            placeholder="اسم المطعم" 
                                            value={place.name} 
                                            onChange={e => updateFoodPlace(idx, 'name', e.target.value)}
                                            className="h-14 rounded-xl border-gray-100 font-black text-lg"
                                          />
                                          <div className="flex items-center gap-4">
                                             <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                             <Slider
                                               value={[place.rating]}
                                               onValueChange={([val]) => updateFoodPlace(idx, 'rating', val)}
                                               min={1} max={5} step={0.5}
                                               className="flex-1"
                                             />
                                             <span className="font-black text-gray-700 min-w-[30px]">{place.rating}</span>
                                          </div>
                                       </div>
                                       <Button variant="ghost" onClick={() => removeFoodPlace(idx)} className="text-red-300 hover:text-red-500 mr-2"><Trash2 className="w-5 h-5" /></Button>
                                    </div>
                                    <Textarea 
                                      placeholder="لماذا تنصح بهذا المطعم؟ ما هي الأطباق المميزة؟" 
                                      value={place.description}
                                      onChange={e => updateFoodPlace(idx, 'description', e.target.value)}
                                      className="rounded-2xl border-gray-100 font-medium min-h-[100px]"
                                    />
                                    <div className="relative group/img aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                                       {place.image ? (
                                          <>
                                             <img src={place.image} className="w-full h-full object-cover" />
                                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                <label className="cursor-pointer bg-white text-orange-600 px-6 py-2 rounded-xl font-black">
                                                   تغيير الصورة
                                                   <input type="file" className="hidden" accept="image/*" onChange={e => handleFoodImageUpload(idx, e.target.files)} />
                                                </label>
                                             </div>
                                          </>
                                       ) : (
                                          <label className="flex flex-col items-center justify-center w-full h-full bg-white cursor-pointer hover:bg-orange-50 transition-colors">
                                             <ImageIcon className="w-8 h-8 text-orange-200 mb-2" />
                                             <span className="text-gray-400 font-bold text-sm">أضف صورة لذيذة</span>
                                             <input type="file" className="hidden" accept="image/*" onChange={e => handleFoodImageUpload(idx, e.target.files)} />
                                          </label>
                                       )}
                                    </div>
                                 </div>
                              </Card>
                           ))}
                        </div>
                     )}

                     <div className="flex gap-4 pt-10">
                        <Button variant="outline" onClick={prevStep} className="h-16 rounded-[1.5rem] px-10 font-black border-gray-100">السابق</Button>
                        <Button onClick={nextStep} className="flex-1 h-16 rounded-[1.5rem] bg-orange-600 text-white text-xl font-black shadow-2xl shadow-orange-100">
                           متابعة إلى الفنادق
                           <ArrowLeft className="mr-3 w-6 h-6" />
                        </Button>
                     </div>
                  </CardContent>
               </Card>
             </div>
           )}

           {/* Step 5: Hotels & Stay */}
           {currentStep === 5 && (
             <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
               <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                  <CardHeader className="bg-blue-50/50 p-10 border-b border-blue-100/50 flex flex-row items-center justify-between">
                     <CardTitle className="text-3xl font-black text-gray-900 flex items-center gap-4">
                        <Sparkles className="w-8 h-8 text-blue-600" />
                        الإقامة والفنادق
                     </CardTitle>
                     <Button onClick={addHotel} className="bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl px-8 font-black gap-2">
                        <Plus className="w-5 h-5" /> إضافة فندق
                     </Button>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                     {hotels.length === 0 ? (
                        <div className="py-20 text-center space-y-6">
                           <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                              <Sparkles className="w-10 h-10 text-blue-200" />
                           </div>
                           <p className="text-gray-400 font-bold text-xl">أين كانت إقامتك؟ أضف الفنادق لزيادة جودة رحلتك.</p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {hotels.map((hotel, idx) => (
                              <Card key={idx} className="border-0 bg-gray-50/50 rounded-[2.5rem] overflow-hidden group hover:bg-white hover:shadow-2xl transition-all border border-transparent hover:border-blue-100">
                                 <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start">
                                       <div className="space-y-4 flex-1">
                                          <Input 
                                            placeholder="اسم الفندق" 
                                            value={hotel.name} 
                                            onChange={e => updateHotel(idx, 'name', e.target.value)}
                                            className="h-14 rounded-xl border-gray-100 font-black text-lg"
                                          />
                                          <div className="flex items-center gap-4">
                                             <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                             <Slider
                                               value={[hotel.rating]}
                                               onValueChange={([val]) => updateHotel(idx, 'rating', val)}
                                               min={1} max={5} step={0.5}
                                               className="flex-1"
                                             />
                                             <span className="font-black text-gray-700 min-w-[30px]">{hotel.rating}</span>
                                          </div>
                                          <Input 
                                            placeholder="مستوى السعر (مثلاً: اقتصادي، فاخر..)" 
                                            value={hotel.priceRange} 
                                            onChange={e => updateHotel(idx, 'priceRange', e.target.value)}
                                            className="h-12 rounded-xl border-gray-100 font-bold text-sm"
                                          />
                                       </div>
                                       <Button variant="ghost" onClick={() => removeHotel(idx)} className="text-red-300 hover:text-red-500 mr-2"><Trash2 className="w-5 h-5" /></Button>
                                    </div>
                                    <Textarea 
                                      placeholder="وصف الإقامة أو نصائح بخصوص الغرف.." 
                                      value={hotel.description}
                                      onChange={e => updateHotel(idx, 'description', e.target.value)}
                                      className="rounded-2xl border-gray-100 font-medium min-h-[100px]"
                                    />
                                    <div className="relative group/img aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                                       {hotel.image ? (
                                          <>
                                             <img src={hotel.image} className="w-full h-full object-cover" />
                                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                <label className="cursor-pointer bg-white text-blue-600 px-6 py-2 rounded-xl font-black">
                                                   تغيير الصورة
                                                   <input type="file" className="hidden" accept="image/*" onChange={e => handleHotelImageUpload(idx, e.target.files)} />
                                                </label>
                                             </div>
                                          </>
                                       ) : (
                                          <label className="flex flex-col items-center justify-center w-full h-full bg-white cursor-pointer hover:bg-blue-50 transition-colors">
                                             <ImageIcon className="w-8 h-8 text-blue-200 mb-2" />
                                             <span className="text-gray-400 font-bold text-sm">أضف صورة للفندق</span>
                                             <input type="file" className="hidden" accept="image/*" onChange={e => handleHotelImageUpload(idx, e.target.files)} />
                                          </label>
                                       )}
                                    </div>
                                 </div>
                              </Card>
                           ))}
                        </div>
                     )}

                     <div className="flex gap-4 pt-10">
                        <Button variant="outline" onClick={prevStep} className="h-16 rounded-[1.5rem] px-10 font-black border-gray-100">السابق</Button>
                        <Button onClick={nextStep} className="flex-1 h-16 rounded-[1.5rem] bg-orange-600 text-white text-xl font-black shadow-2xl shadow-orange-100">
                           المراجعة النهائية
                           <ArrowLeft className="mr-3 w-6 h-6" />
                        </Button>
                     </div>
                  </CardContent>
               </Card>
             </div>
           )}

           {/* Step 6: Review & Submit */}
           {currentStep === 6 && (
             <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
               <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                  <CardHeader className="bg-gray-900 p-10 text-white">
                     <CardTitle className="text-3xl font-black flex items-center gap-4">
                        <Check className="w-8 h-8 text-emerald-500" />
                        المراجعة النهائية
                     </CardTitle>
                     <p className="text-gray-400 font-bold mt-2">راجع معلوماتك قبل حفظ التحديثات.</p>
                  </CardHeader>
                  <CardContent className="p-10 space-y-12">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                           <h4 className="text-xl font-black text-gray-900 border-b-4 border-orange-500 pb-2 w-fit">المعلومات الأساسية</h4>
                           <div className="space-y-4">
                              <div className="flex justify-between border-b border-gray-50 pb-3"><span className="text-gray-400 font-bold">العنوان:</span> <span className="font-black text-gray-700">{tripData.title}</span></div>
                              <div className="flex justify-between border-b border-gray-50 pb-3"><span className="text-gray-400 font-bold">الوجهة:</span> <span className="font-black text-gray-700">{tripData.city}</span></div>
                              <div className="flex justify-between border-b border-gray-50 pb-3"><span className="text-gray-400 font-bold">المدة:</span> <span className="font-black text-gray-700">{tripData.duration}</span></div>
                              <div className="flex justify-between border-b border-gray-50 pb-3"><span className="text-gray-400 font-bold">الميزانية:</span> <span className="font-black text-gray-700">{tripData.budget}</span></div>
                           </div>
                        </div>
                        <div className="space-y-6">
                           <h4 className="text-xl font-black text-gray-900 border-b-4 border-indigo-500 pb-2 w-fit">الإحصائيات</h4>
                           <div className="space-y-4">
                              <div className="flex justify-between border-b border-gray-50 pb-3"><span className="text-gray-400 font-bold">المواقع المختارة:</span> <span className="font-black text-indigo-600">{locations.length} مواقع</span></div>
                              <div className="flex justify-between border-b border-gray-50 pb-3"><span className="text-gray-400 font-bold">عدد الأيام المنظمة:</span> <span className="font-black text-emerald-600">{days.length} أيام</span></div>
                              <div className="flex justify-between border-b border-gray-50 pb-3"><span className="text-gray-400 font-bold">المطاعم:</span> <span className="font-black text-orange-600">{foodPlaces.length} أماكن</span></div>
                              <div className="flex justify-between border-b border-gray-50 pb-3"><span className="text-gray-400 font-bold">الفنادق:</span> <span className="font-black text-blue-600">{hotels.length} فندق</span></div>
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-4 pt-10">
                        <Button variant="outline" onClick={prevStep} className="h-20 rounded-[2rem] px-10 font-black border-gray-100" disabled={isSaving}>السابق</Button>
                        <Button onClick={handleSubmit} disabled={isSaving} className="flex-1 h-20 rounded-[2rem] bg-emerald-600 text-white text-2xl font-black shadow-2xl shadow-emerald-100 hover:scale-[1.02] transition-transform">
                           {isSaving ? "جاري الحفظ..." : "حفظ التعديلات ونشر الرحلة ✨"}
                        </Button>
                     </div>
                  </CardContent>
               </Card>
             </div>
           )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditTrip;
