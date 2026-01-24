import { useState, useEffect } from "react";
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
import TripAIChatWidget from "@/components/TripAIChatWidget";
import TripMapEditor from "@/components/TripMapEditor";
import { TripLocation } from "@/components/TripMapEditor";
import LocationMediaManager from "@/components/LocationMediaManager";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Trip, TripActivity, TripDay, FoodPlace, Hotel } from "@/lib/trips-data";
import { createTrip } from "@/lib/api";
import UploadProgressLoader from "@/components/UploadProgressLoader";

const CreateTrip = () => {
  const { toast } = useToast();
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
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
    cairo: "القاهرة",
    matrouh: "مرسى مطروح",
    luxor: "الأقصر",
    aswan: "أسوان",
    hurghada: "الغردقة",
    sharm: "شرم الشيخ",
    dahab: "دهب",
    bahariya: "الواحات البحرية",
  };

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('tripDraft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setTripData(parsed.tripData || tripData);
        setActivities(parsed.activities || []);
        setLocations(parsed.locations || []);
        setDays(parsed.days || []);
        setFoodPlaces(parsed.foodPlaces || []);
        setCurrentStep(parsed.currentStep || 1);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    const dataToSave = {
      tripData: {
        ...tripData,
        coverImage: null, // Don't save file
      },
      activities,
      locations,
      days,
      foodPlaces,
      currentStep,
    };
    localStorage.setItem('tripDraft', JSON.stringify(dataToSave));
  }, [tripData, activities, locations, days, foodPlaces, currentStep]);

  // Update activities when locations change
  useEffect(() => {
    const newActivities: TripActivity[] = locations.map((loc, idx) => {
      // Convert File[] to preview URLs for display
      // We'll convert to base64 on submit using the locations array
      const imageUrls: string[] = (loc.images || []).map((img) => {
        if (typeof img === 'string') return img; // Already a URL/base64
        if (img instanceof File) return URL.createObjectURL(img); // Create blob URL for preview
        return '';
      }).filter(Boolean);
      
      return {
        name: loc.name || `موقع ${idx + 1}`,
        images: imageUrls, // Preview URLs for display
        coordinates: Array.isArray(loc.coordinates) 
          ? { lat: loc.coordinates[0], lng: loc.coordinates[1] }
          : (loc.coordinates || { lat: 0, lng: 0 }),
        day: 1, // Default day, will be organized in step 3
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
      // Auto-set city from destination
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
      // Auto-create days if none exist
      if (days.length === 0) {
        const numDays = Math.ceil(locations.length / 3) || 1;
        const newDays: TripDay[] = [];
        for (let i = 0; i < numDays; i++) {
          newDays.push({ title: `اليوم ${i + 1}`, activities: [] });
        }
        setDays(newDays);
      }
    } else if (currentStep === 3) {
      // Validate that each activity is assigned to at least one day
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

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (isEarlyShare = false) => {
    // Validate all data
    if (!tripData.title || !tripData.destination || !tripData.duration || !tripData.budget || !tripData.description) {
      toast({
        title: "معلومات ناقصة",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (!isEarlyShare && activities.length === 0) {
      toast({
        title: "معلومات ناقصة",
        description: "الرجاء إضافة نشاط واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show loading toast
      toast({
        title: "جاري إنشاء الرحلة...",
        description: "يرجى الانتظار بينما نقوم بتحميل الصور",
      });

      // Calculate total items to process
      const totalImages = locations.reduce((sum, loc) => sum + (loc.images || []).filter((img: any) => img instanceof File).length, 0);
      const totalVideos = locations.reduce((sum, loc) => sum + (loc.videos || []).filter((vid: any) => vid instanceof File).length, 0);
      // Add cover image if it's a file
      const hasCoverImage = tripData.coverImage instanceof File;
      const totalItems = totalImages + totalVideos + (hasCoverImage ? 1 : 0);

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

      let processedCount = 0;

      // Convert all images to base64 before sending
      // Convert cover image (already base64, but ensure it's valid)
      const coverImage = tripData.coverImageUrl || "";
      if (hasCoverImage) {
        processedCount++;
        setUploadProgress(prev => ({
          ...prev,
          completed: processedCount,
          currentItem: "جاري معالجة صورة الغلاف...",
        }));
      }

      // Convert activity images from locations (File objects) to base64
      // Activities are created from locations, so we can directly use locations array
      const finalActivities: TripActivity[] = await Promise.all(
        locations.map(async (location, index) => {
          // Find which day(s) this activity belongs to (activities[index] corresponds to locations[index])
          const dayIndex = days.findIndex(d => d.activities.includes(index));
          
          // Convert location images (File objects) to base64
          const base64Images = await Promise.all(
            (location.images || []).map(async (img) => {
              if (typeof img === 'string' && img.startsWith('data:image')) {
                return img; // Already base64
              } else if (img instanceof File) {
                // Convert File to base64
                processedCount++;
                setUploadProgress(prev => ({
                  ...prev,
                  completed: processedCount,
                  currentItem: `جاري رفع الصورة: ${location.name || `موقع ${index + 1}`}`,
                }));
                return await fileToBase64(img);
              }
              return ''; // Skip invalid images
            })
          );

          // Convert location videos (File objects) to base64
          const base64Videos = await Promise.all(
            (location.videos || []).map(async (vid) => {
              if (typeof vid === 'string' && (vid.startsWith('data:video') || vid.startsWith('http'))) {
                return vid; // Already base64 or URL
              } else if (vid instanceof File) {
                // Convert File to base64
                processedCount++;
                setUploadProgress(prev => ({
                  ...prev,
                  completed: processedCount,
                  currentItem: `جاري رفع الفيديو: ${location.name || `موقع ${index + 1}`}`,
                }));
                return await fileToBase64(vid);
              }
              return ''; // Skip invalid videos
            })
          );

          return {
            name: location.name || `موقع ${index + 1}`,
            images: base64Images.filter(img => img), // Remove empty strings
            videos: base64Videos.filter(vid => vid), // Remove empty strings
            coordinates: Array.isArray(location.coordinates) 
              ? { lat: location.coordinates[0], lng: location.coordinates[1] }
              : (location.coordinates || { lat: 0, lng: 0 }),
            day: dayIndex >= 0 ? dayIndex + 1 : 1,
          };
        })
      );

      // Convert food place images to base64
      const foodPlacesWithBase64 = await Promise.all(
        foodPlaces
          .filter(fp => fp.name && fp.image)
          .map(async (fp) => {
            let imageBase64 = fp.image;
            // If it's a blob URL, we need to get the file
            // For now, if it's already base64, use it; otherwise skip
            if (!imageBase64.startsWith('data:image')) {
              // Try to find the file in the food places
              // This might need adjustment based on how food images are stored
              imageBase64 = ''; // Skip invalid images
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
        author: user?.fullName || user?.firstName || user?.username || "مستخدم",
        description: tripData.description,
        budget: tripData.budget,
        season: tripData.season || undefined, // Only include if selected
        activities: finalActivities,
        days: days.map((day) => ({
          ...day,
          activities: day.activities.filter(aIdx => aIdx < activities.length),
        })),
        foodAndRestaurants: foodPlacesWithBase64.filter(fp => fp.image), // Only include places with valid images
        hotels: hotels.filter(h => h.name && h.image), // Only include hotels with name and image
      };
      
      // Update progress to show processing
      if (totalItems > 0) {
        setUploadProgress(prev => ({
          ...prev,
          isProcessing: true,
          currentItem: "جاري إرسال البيانات...",
        }));
      }

      const created = await createTrip(payload as any, token || undefined);
      toast({
        title: "تم إنشاء الرحلة بنجاح!",
        description: isEarlyShare ? "تم نشر الرحلة. يمكنك الآن إضافة المزيد من التفاصيل." : "تم نشر رحلتك",
      });
      localStorage.removeItem('tripDraft');
      setTimeout(() => {
        if (created?._id) {
          // If early share, go to edit page at step 2
          if (isEarlyShare) {
            navigate(`/trips/edit/${created._id}`, { state: { initialStep: 2 } });
          } else {
            navigate(`/trips/${created._id}`);
          }
        } else {
          navigate(`/timeline`);
        }
      }, 800);
      return;
    } catch (err: any) {
      console.error('Error creating trip:', err);
      // Hide progress loader on error
      setUploadProgress(prev => ({ ...prev, show: false }));
      const errorMessage = err?.message || "حدث خطأ غير متوقع";
      const errorDetails = err?.details || (err?.response?.data?.details ? JSON.stringify(err.response.data.details) : null);
      toast({ 
        title: "فشل إنشاء الرحلة", 
        description: errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage, 
        variant: "destructive",
        duration: 5000
      });
      return;
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
        <section className="relative h-[350px] w-full overflow-hidden bg-indigo-900">
           <div className="absolute inset-0 z-0">
              <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 via-indigo-900/70 to-[#F8FAFC]" />
           </div>
           
           <div className="container mx-auto px-4 relative z-10 h-full flex flex-col items-center justify-center pt-16">
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 animate-slide-up">
                 أنشئ <span className="text-orange-500">رحلتك</span> الجديدة
              </h1>
              <p className="text-indigo-100 text-lg md:text-xl font-light max-w-2xl text-center leading-relaxed">
                 شارك تجاربك وأماكنك المفضلة مع المسافرين الآخرين.
              </p>
           </div>
        </section>

        {/* 2. Content Section */}
        <div className="container mx-auto px-4 -mt-20 relative z-20">
           
           {/* Steps Indicator - Premium Navbar Style */}
           <div className="max-w-5xl mx-auto mb-12">
              <Card className="border-0 shadow-2xl rounded-[3rem] bg-white/80 backdrop-blur-xl overflow-hidden p-4 md:p-6">
                 <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4 px-4">
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

           {/* Active Step Content */}
           <div className="max-w-4xl mx-auto">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                     <CardHeader className="bg-orange-50/50 p-10 border-b border-orange-100/50">
                        <CardTitle className="text-3xl font-black text-gray-900 flex items-center gap-4">
                           المعلومات الأساسية
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-10 space-y-8">
                        <div className="space-y-4">
                           <Label className="text-lg font-black text-gray-800">عنوان الرحلة</Label>
                           <Input 
                             placeholder="مثال: استكشاف واحة سيوة بالدراجات.." 
                             value={tripData.title}
                             onChange={e => setTripData({...tripData, title: e.target.value})}
                             className="h-16 rounded-[1.5rem] border-gray-100 bg-gray-50/30 focus:bg-white text-xl font-bold px-6 border-2 transition-all"
                           />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <Label className="text-lg font-black text-gray-800">الوجهة الرئيسية</Label>
                              <Select value={tripData.destination} onValueChange={val => setTripData({...tripData, destination: val})}>
                                 <SelectTrigger className="h-16 rounded-[1.5rem] border-gray-100 bg-gray-50/30 text-lg font-bold border-2">
                                    <SelectValue placeholder="اختر المدينة" />
                                 </SelectTrigger>
                                 <SelectContent className="font-cairo font-bold">
                                    {Object.entries(destinationMap).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-4">
                              <Label className="text-lg font-black text-gray-800">الموسم</Label>
                              <div className="flex gap-2">
                                 {['winter', 'summer', 'fall', 'spring'].map((s) => (
                                   <button
                                     key={s}
                                     onClick={() => setTripData({...tripData, season: s})}
                                     className={cn(
                                       "flex-1 h-14 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all border-2",
                                       tripData.season === s ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100" : "bg-white border-gray-50 text-gray-400 hover:border-orange-100 hover:text-orange-400"
                                     )}
                                   >
                                      <span className="text-xl">{s === 'winter' ? '❄️' : s === 'summer' ? '☀️' : s === 'fall' ? '🍂' : '🌸'}</span>
                                      <span className="text-[10px] uppercase font-black">{s}</span>
                                   </button>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <Label className="text-lg font-black text-gray-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-600" /> مدة الرحلة</Label>
                              <Input placeholder="مثال: ٤ أيام" value={tripData.duration} onChange={e => setTripData({...tripData, duration: e.target.value})} className="h-16 rounded-[1.5rem] border-gray-100 text-lg font-bold border-2" />
                           </div>
                           <div className="space-y-4">
                              <Label className="text-lg font-black text-gray-800 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-600" /> الميزانية</Label>
                              <Input placeholder="مثال: ٣٠٠٠ جنيه" value={tripData.budget} onChange={e => setTripData({...tripData, budget: e.target.value})} className="h-16 rounded-[1.5rem] border-gray-100 text-lg font-bold border-2" />
                           </div>
                        </div>

                        <div className="space-y-4">
                           <Label className="text-lg font-black text-gray-800">وصف الرحلة</Label>
                           <Textarea 
                             placeholder="احكِ لنا قصة الرحلة، ما الذي جعلها مميزة؟" 
                             value={tripData.description}
                             onChange={e => setTripData({...tripData, description: e.target.value})}
                             className="rounded-[2rem] border-gray-100 bg-gray-50/30 text-lg font-medium p-8 min-h-[180px] border-2 focus:bg-white transition-all leading-relaxed"
                           />
                        </div>

                        <div className="space-y-6">
                           <Label className="text-lg font-black text-gray-800">صورة غلاف الرحلة</Label>
                           {tripData.coverImageUrl ? (
                             <div className="relative aspect-video rounded-[3rem] overflow-hidden group shadow-2xl border-4 border-white">
                                <img src={tripData.coverImageUrl} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <Button variant="destructive" onClick={() => setTripData({...tripData, coverImageUrl: "", coverImage: null})} className="rounded-full w-14 h-14 p-0 shadow-lg">
                                      <Trash2 className="w-6 h-6" />
                                   </Button>
                                </div>
                             </div>
                           ) : (
                             <label className="flex flex-col items-center justify-center aspect-video w-full rounded-[3rem] border-4 border-dashed border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-orange-50 transition-all group">
                                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                   <ImageIcon className="w-10 h-10 text-orange-200" />
                                </div>
                                <span className="text-2xl font-black text-gray-900">اختر صورة الغلاف</span>
                                <span className="text-gray-400 mt-2 font-medium">يفضل أن تكون صورة عرضية عالية الدقة</span>
                                <input type="file" accept="image/*" onChange={(e) => handleCoverImageUpload(e.target.files)} className="hidden" />
                             </label>
                           )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-10">
                           <Button onClick={nextStep} className="h-16 flex-[2] rounded-[1.5rem] bg-orange-600 hover:bg-orange-700 text-white text-xl font-black shadow-2xl shadow-orange-100 transition-all hover:scale-[1.02]">
                              التالي
                              <ArrowLeft className="mr-3 w-6 h-6" />
                           </Button>
                           <Button variant="outline" onClick={() => handleSubmit(true)} className="h-16 flex-1 rounded-[1.5rem] border-gray-100 text-gray-500 font-bold hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100">
                              نشر سريع
                           </Button>
                        </div>
                     </CardContent>
                  </Card>
                </div>
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
                           <Button onClick={nextStep} className="flex-1 h-16 rounded-[1.5rem] bg-orange-600 text-white text-xl font-black shadow-2xl shadow-orange-100">المتابعة</Button>
                        </div>
                     </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 4 & 5: Dining & Stay */}
              {(currentStep === 4 || currentStep === 5) && (
                 <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                       <CardHeader className="bg-amber-50/50 p-10 border-b border-amber-100/50">
                          <CardTitle className="text-3xl font-black text-gray-900 flex items-center gap-4">
                             <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white">
                                {currentStep === 4 ? <Utensils className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                             </div>
                             {currentStep === 4 ? "تجارب المطاعم والأكلات" : "أماكن الإقامة والفنادق"}
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="p-10 space-y-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             {(currentStep === 4 ? foodPlaces : hotels).map((item, idx) => (
                                <div key={idx} className="p-8 rounded-[2.5rem] bg-gray-50 relative group border-2 border-transparent hover:border-amber-200 transition-all shadow-sm hover:shadow-xl">
                                   <button onClick={() => currentStep === 4 ? removeFoodPlace(idx) : removeHotel(idx)} className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full text-red-500 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 className="w-4 h-4" /></button>
                                   <div className="space-y-6">
                                      <label className="aspect-[16/10] w-full rounded-[2rem] bg-white border-4 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-amber-50 group/up">
                                         {(item as any).image ? <img src={(item as any).image} className="w-full h-full object-cover" /> : <><ImageIcon className="w-10 h-10 text-gray-200 mb-2 group-hover/up:scale-110 transition-transform" /><span className="text-sm font-black text-gray-300">أضف صورة المكان</span></>}
                                         <input type="file" accept="image/*" onChange={(e) => currentStep === 4 ? handleFoodImageUpload(idx, e.target.files) : handleHotelImageUpload(idx, e.target.files)} className="hidden" />
                                      </label>
                                      <div className="space-y-4">
                                         <Input placeholder="اسم المكان.." value={item.name} onChange={e => currentStep === 4 ? updateFoodPlace(idx, 'name', e.target.value) : updateHotel(idx, 'name', e.target.value)} className="h-14 rounded-2xl font-black text-xl border-gray-100 bg-white shadow-sm" />
                                         <Textarea placeholder="ما هو انطباعك عن هذا المكان؟" value={item.description} onChange={e => currentStep === 4 ? updateFoodPlace(idx, 'description', e.target.value) : updateHotel(idx, 'description', e.target.value)} className="rounded-2xl bg-white border-gray-100 text-lg leading-relaxed min-h-[100px]" />
                                         <div className="flex items-center gap-4 pt-2">
                                            <div className="flex items-center gap-1.5 bg-amber-100 text-amber-600 px-4 py-2 rounded-xl font-bold">
                                               <Star className="w-4 h-4 fill-amber-500 border-none" />
                                               {item.rating}
                                            </div>
                                            <Slider min={1} max={5} step={0.5} value={[item.rating]} onValueChange={([val]) => currentStep === 4 ? updateFoodPlace(idx, 'rating', val) : updateHotel(idx, 'rating', val)} className="flex-1" />
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             ))}
                             <button 
                               onClick={currentStep === 4 ? addFoodPlace : addHotel}
                               className="aspect-[16/10] w-full rounded-[2.5rem] border-4 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50/20 transition-all gap-4"
                             >
                                <div className="w-16 h-16 rounded-3xl bg-white shadow-lg flex items-center justify-center"><Plus className="w-8 h-8" /></div>
                                <span className="text-xl font-black">إضافة مكان جديد</span>
                             </button>
                          </div>
                          
                          <div className="flex gap-4 pt-10 border-t border-gray-50">
                             <Button variant="outline" onClick={prevStep} className="h-16 rounded-[1.5rem] px-10 font-black border-gray-100">السابق</Button>
                             <Button onClick={nextStep} className="flex-1 h-16 rounded-[1.5rem] bg-orange-600 text-white text-xl font-black shadow-2xl shadow-orange-100">المتابعة</Button>
                          </div>
                       </CardContent>
                    </Card>
                 </div>
              )}

              {/* Step 6: Final Review */}
              {currentStep === 6 && (
                <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
                   <div className="relative mb-12">
                      <div className="bg-orange-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                         <div className="relative z-10 max-w-2xl">
                            <h2 className="text-5xl font-black mb-6">جاهز للنشر! 🛫</h2>
                            <p className="text-orange-100 text-xl font-light leading-relaxed">راجع تفاصيل رحلتك قبل نشرها ليراها الجميع.</p>
                         </div>
                      </div>
                   </div>

                   <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white mb-10">
                      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                         <div className="lg:col-span-12 relative aspect-[21/9]">
                            <img src={tripData.coverImageUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-12">
                               <Badge className="w-fit mb-4 bg-orange-600 border-none text-white px-6 py-2 rounded-full font-black text-lg shadow-xl">{destinationMap[tripData.destination]}</Badge>
                               <h3 className="text-5xl font-black text-white mb-6 leading-tight">{tripData.title}</h3>
                               <div className="flex flex-wrap gap-8 text-white/80 font-bold text-xl">
                                  <span className="flex items-center gap-3"><Clock className="w-6 h-6 text-orange-400" /> {tripData.duration}</span>
                                  <span className="flex items-center gap-3"><DollarSign className="w-6 h-6 text-emerald-400" /> {tripData.budget}</span>
                                  <span className="flex items-center gap-3"><MapPin className="w-6 h-6 text-indigo-400" /> {locations.length} موقع</span>
                               </div>
                            </div>
                         </div>
                         <div className="lg:col-span-12 p-12 space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                               <div className="md:col-span-2 space-y-6">
                                  <h4 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                     <div className="w-2 h-8 bg-orange-600 rounded-full" />
                                     وصف الرحلة
                                  </h4>
                                  <p className="text-gray-500 text-xl leading-relaxed italic border-r-4 border-gray-50 pr-6">"{tripData.description}"</p>
                               </div>
                               <div className="space-y-6">
                                  <h4 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                     <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                                     إحصائيات سريعة
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="p-6 bg-gray-50 rounded-3xl text-center">
                                        <div className="text-4xl font-black text-indigo-600 mb-1">{days.length}</div>
                                        <div className="text-xs text-gray-400 font-black uppercase">أيام</div>
                                     </div>
                                     <div className="p-6 bg-gray-50 rounded-3xl text-center">
                                        <div className="text-4xl font-black text-emerald-600">{foodPlaces.length}</div>
                                        <div className="text-xs text-gray-400 font-black uppercase">مطعم</div>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row gap-6">
                               <Button onClick={() => handleSubmit(false)} className="h-20 flex-[2] rounded-[2rem] bg-orange-600 hover:bg-orange-700 text-white text-2xl font-black shadow-2xl shadow-orange-100 transition-all hover:scale-[1.02]">
                                  انشر رحلتك الآن 🚀
                               </Button>
                               <Button variant="outline" onClick={prevStep} className="h-20 flex-1 rounded-[2rem] border-gray-100 text-gray-400 font-black text-xl hover:bg-gray-50">
                                  تعديل البيانات
                               </Button>
                            </div>
                         </div>
                      </div>
                   </Card>
                </div>
              )}
           </div>
        </div>
      </main>

      <TripAIChatWidget />
      <Footer />
    </div>
  );
};

export default CreateTrip;
