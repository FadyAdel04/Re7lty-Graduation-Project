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
import { getTrip, updateTrip, getCloudinarySignature } from "@/lib/api";
import UploadProgressLoader from "@/components/UploadProgressLoader";

const EditTrip = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to upload file to Cloudinary
  const uploadFileToCloudinary = async (file: File, token: string) => {
    try {
      const sigData = await getCloudinarySignature(token);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp.toString());
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${file.type.startsWith('video/') ? 'video' : 'image'}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };
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
  const [newFoodPlace, setNewFoodPlace] = useState<{
    name: string;
    description: string;
    location: string;
    type: string;
    image: string;
    rating: number;
    file?: File;
  }>({ name: '', description: '', location: '', type: 'restaurant', image: '', rating: 4.5 });

  // Step 5: Hotels
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [newHotel, setNewHotel] = useState<{
    name: string;
    description: string;
    location: string;
    bookingUrl: string;
    image: string;
    rating: number;
    priceRange: string;
    file?: File;
  }>({ name: '', description: '', location: '', bookingUrl: '', image: '', rating: 4.5, priceRange: '' });

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

      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");

      let processedCount = 0;

      // Handle cover image
      let coverImage = tripData.coverImageUrl || "";
      if (tripData.coverImage instanceof File) {
        processedCount++;
        setUploadProgress(prev => ({
          ...prev,
          completed: processedCount,
          currentItem: "جاري رفع صورة الغلاف...",
        }));
        coverImage = await uploadFileToCloudinary(tripData.coverImage, token);
      }

      let processedCountInLoop = 0; // Use a distinct variable if needed or refine scope

      const finalActivities: TripActivity[] = await Promise.all(
        locations.map(async (location, index) => {
          const dayIndex = days.findIndex(d => d.activities.includes(index));
          
          const uploadedImages = await Promise.all(
            (location.images || []).map(async (img: string | File) => {
              if (typeof img === 'string' && img.startsWith('http')) {
                return img;
              } else if (img instanceof File) {
                processedCount++;
                setUploadProgress(prev => ({
                  ...prev,
                  completed: processedCount,
                  currentItem: `جاري رفع الصورة: ${location.name || `موقع ${index + 1}`}`,
                }));
                return await uploadFileToCloudinary(img, token);
              }
              return '';
            })
          );

          const uploadedVideos = await Promise.all(
            (location.videos || []).map(async (vid: string | File) => {
              if (typeof vid === 'string' && vid.startsWith('http')) {
                return vid;
              } else if (vid instanceof File) {
                processedCount++;
                setUploadProgress(prev => ({
                  ...prev,
                  completed: processedCount,
                  currentItem: `جاري رفع الفيديو: ${location.name || `موقع ${index + 1}`}`,
                }));
                return await uploadFileToCloudinary(vid, token);
              }
              return '';
            })
          );

            return {
              name: location.name || `موقع ${index + 1}`,
              images: uploadedImages.filter(img => img),
              videos: uploadedVideos.filter(vid => vid),
              coordinates: Array.isArray(location.coordinates) 
                ? { lat: location.coordinates[0], lng: location.coordinates[1] }
                : (location.coordinates || { lat: 0, lng: 0 }),
              day: dayIndex >= 0 ? dayIndex + 1 : 1,
            };
          })
        );

      const foodPlacesWithBase64 = await Promise.all(
        foodPlaces
          .filter(fp => fp.name)
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
        foodAndRestaurants: foodPlacesWithBase64,
        hotels: hotels.filter(h => h.name),
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

        {/* 2. Sidebar Navigation Layout */}
        <div className="container mx-auto px-4 -mt-20 relative z-20">
           <div className="flex flex-col lg:flex-row gap-8 items-start">
               {/* Sidebar Navigation */}
               <aside className="hidden lg:block w-72 shrink-0 sticky top-24 space-y-4 animate-in fade-in slide-in-from-left-6 duration-700">
                  <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden bg-white/90 backdrop-blur-xl p-5">
                    <div className="space-y-2">
                       {steps.map((step) => {
                          const isActive = currentStep === step.number;
                          const isCompleted = currentStep > step.number;
                          return (
                             <button
                                key={step.number}
                                onClick={() => setCurrentStep(step.number)}
                                className={cn(
                                   "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold text-right group relative overflow-hidden",
                                   isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105" : 
                                   isCompleted ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                )}
                             >
                                <div className={cn(
                                   "w-10 h-10 rounded-full flex items-center justify-center text-sm border-[3px] shrink-0 transition-colors z-10",
                                   isActive ? "border-white/30 bg-white/20 text-white" : 
                                   isCompleted ? "border-indigo-200 bg-indigo-100 text-indigo-600" : "border-gray-200 bg-gray-50 text-gray-400"
                                )}>
                                   {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                                </div>
                                <span className="z-10 relative">{step.title}</span>
                                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-100 z-0" />}
                             </button>
                          )
                       })}
                    </div>
                  </Card>

                  {/* Progress Card */}
                  <Card className="border-0 shadow-lg rounded-[2.5rem] bg-gradient-to-br from-orange-400 to-pink-500 text-white p-6 overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
                      <div className="relative z-10">
                         <h4 className="font-black text-lg mb-2">مكتمل: {Math.round(((currentStep - 1) / 6) * 100)}%</h4>
                         <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white transition-all duration-500" style={{ width: `${((currentStep - 1) / 6) * 100}%` }} />
                         </div>
                      </div>
                  </Card>
               </aside>

               {/* Mobile Horizontal Stepper */}
               <div className="lg:hidden w-full mb-8 overflow-x-auto pb-4 no-scrollbar">
                  <div className="flex items-center gap-3 min-w-max px-2">
                     {steps.map((step) => {
                        const isActive = currentStep === step.number;
                        return (
                           <button
                              key={step.number}
                              onClick={() => setCurrentStep(step.number)}
                              className={cn(
                                 "flex items-center gap-2 px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all border-2",
                                 isActive ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-white border-gray-100 text-gray-500"
                              )}
                           >
                              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs bg-white text-indigo-600", !isActive && "bg-gray-100 text-gray-500")}>{step.number}</span>
                              {step.title}
                           </button>
                        )
                     })}
                  </div>
               </div>

               {/* Active Step Content */}
               <div className={cn("flex-1 min-w-0 w-full transition-all duration-500")}>

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
                   <CardContent className="p-6 h-[calc(100vh-200px)]">
                     <div className="grid grid-cols-12 gap-6 h-full">
                        {/* Map Section - takes 8 columns */}
                        <div className="col-span-12 lg:col-span-8 h-full rounded-3xl overflow-hidden border-2 border-indigo-50 shadow-inner bg-indigo-50/10">
                           <TripMapEditor
                             locations={locations}
                             route={[] as [number, number][]}
                             onLocationsChange={setLocations}
                             onRouteChange={() => {}}
                             destination={tripData.destination}
                             className="h-full w-full"
                           />
                        </div>

                        {/* Sidebar Section - takes 4 columns */}
                        <div className="col-span-12 lg:col-span-4 h-full flex flex-col space-y-4">
                           <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                             <h3 className="text-xl font-black text-gray-900">المواقع <span className="text-indigo-600">({locations.length})</span></h3>
                             <p className="text-xs text-gray-400 font-bold">اضغط على الخريطة لإضافة موقع</p>
                           </div>

                           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                             {locations.length === 0 ? (
                               <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-4 border-2 border-dashed border-gray-100 rounded-2xl">
                                 <MapPin className="w-12 h-12 text-gray-200" />
                                 <p className="font-bold">لا توجد مواقع محددة بعد.</p>
                                 <p className="text-sm">استخدم البحث أو اضغط على الخريطة لإضافة الأماكن التي زرتها.</p>
                               </div>
                             ) : (
                               locations.map((loc, idx) => (
                                 <div key={loc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4 group hover:border-indigo-200 transition-all">
                                    <div className="flex items-start justify-between gap-3">
                                       <div className="flex-1 space-y-2">
                                          <Input 
                                            value={loc.name} 
                                            onChange={(e) => {
                                              const newLocs = [...locations];
                                              newLocs[idx].name = e.target.value;
                                              setLocations(newLocs);
                                            }}
                                            placeholder={`موقع ${idx + 1}`}
                                            className="h-9 font-bold border-gray-100 bg-gray-50 focus:bg-white transition-all"
                                          />
                                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                                             <span>{loc.coordinates[0].toFixed(4)}, {loc.coordinates[1].toFixed(4)}</span>
                                          </div>
                                       </div>
                                       <Button variant="ghost" size="sm" onClick={() => setLocations(locations.filter(l => l.id !== loc.id))} className="h-8 w-8 p-0 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                          <Trash2 className="w-4 h-4" />
                                       </Button>
                                    </div>

                                    {/* Media Uploader Micro-Component */}
                                    <div className="space-y-2">
                                       <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                          {/* Add Button */}
                                          <label className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center cursor-pointer transition-all">
                                             <Plus className="w-5 h-5 text-gray-400" />
                                             <input 
                                               type="file" 
                                               multiple 
                                               accept="image/*,video/*" 
                                               className="hidden"
                                               onChange={(e) => {
                                                 if(e.target.files?.length) {
                                                   const newLocs = [...locations];
                                                   const newFiles = Array.from(e.target.files!);
                                                   newLocs[idx].images = [...(newLocs[idx].images || []), ...newFiles.filter(f => f.type.startsWith('image/'))];
                                                   newLocs[idx].videos = [...(newLocs[idx].videos || []), ...newFiles.filter(f => f.type.startsWith('video/'))];
                                                   setLocations(newLocs);
                                                 }
                                               }}
                                             />
                                          </label>

                                          {/* Standardize display of images/videos */}
                                          {[...(loc.images || []), ...(loc.videos || [])].map((file, i) => {
                                             const url = file instanceof File ? URL.createObjectURL(file) : file as string;
                                             const isVideo = file instanceof File ? file.type.startsWith('video/') : typeof file === 'string' ? (file.includes('video') || file.endsWith('.mp4')) : false;
                                             return (
                                                <div key={i} className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden relative group/img border border-gray-100 bg-gray-50">
                                                   {isVideo ? (
                                                     <video src={url} className="w-full h-full object-cover" />
                                                   ) : (
                                                     <img src={url} className="w-full h-full object-cover" />
                                                   )}
                                                   <button 
                                                     onClick={() => {
                                                         const newLocs = [...locations];
                                                         if (isVideo) {
                                                           newLocs[idx].videos = newLocs[idx].videos?.filter(v => v !== file);
                                                         } else {
                                                           newLocs[idx].images = newLocs[idx].images?.filter(img => img !== file);
                                                         }
                                                         setLocations(newLocs);
                                                     }}
                                                     className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white"
                                                   >
                                                      <Trash2 className="w-4 h-4" />
                                                   </button>
                                                </div>
                                             )
                                          })}
                                       </div>
                                    </div>
                                 </div>
                               ))
                             )}
                           </div>

                           {/* Navigation Buttons */}
                           <div className="flex gap-3 pt-2 mt-auto border-t border-gray-100">
                              <Button variant="outline" onClick={prevStep} className="h-12 w-12 rounded-xl p-0 border-gray-200"><ArrowRight className="w-5 h-5 text-gray-500" /></Button>
                              <Button onClick={nextStep} className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100">
                                 التالي: تنظيم الأيام
                                 <ArrowLeft className="mr-2 w-5 h-5" />
                              </Button>
                           </div>
                        </div>
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
                   <CardContent className="p-6 h-[calc(100vh-200px)]">
                     <div className="grid grid-cols-12 gap-6 h-full">
                        {/* Days Sidebar - Col 3 */}
                        <div className="col-span-3 h-full flex flex-col space-y-4 border-l border-gray-100 pl-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-xl font-black text-gray-900">الأيام</h3>
                              <Button onClick={addDay} variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full border border-dashed border-gray-300 hover:border-emerald-500 hover:text-emerald-500"><Plus className="w-4 h-4" /></Button>
                           </div>
                           <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                              {days.map((day, dIdx) => (
                                 <div 
                                   key={dIdx} 
                                   className={cn(
                                     "w-full p-1 rounded-xl transition-all flex items-center justify-between group relative", 
                                     currentDay === dIdx + 1 ? "bg-emerald-600 shadow-lg shadow-emerald-100" : "bg-gray-50 hover:bg-emerald-50"
                                   )}
                                 >
                                   <button
                                     onClick={() => setCurrentDay(dIdx + 1)}
                                     className={cn("flex-1 text-right p-3 font-bold flex items-center justify-between", currentDay === dIdx + 1 ? "text-white" : "text-gray-500 hover:text-emerald-600")}
                                   >
                                      <span>{day.title}</span>
                                      {day.activities.length > 0 && (
                                        <Badge className={cn("text-[10px]", currentDay === dIdx + 1 ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500")}>
                                          {day.activities.length}
                                        </Badge>
                                      )}
                                   </button>
                                   {days.length > 1 && (
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); removeDay(dIdx); }}
                                       className={cn(
                                         "w-8 h-8 flex items-center justify-center rounded-lg transition-all opacity-0 group-hover:opacity-100 absolute left-1",
                                         currentDay === dIdx + 1 ? "text-red-200 hover:bg-red-500/20 hover:text-white" : "text-red-300 hover:bg-red-50 hover:text-red-500"
                                       )}
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   )}
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Activities Canvas - Col 9 */}
                        <div className="col-span-9 h-full grid grid-rows-2 gap-6">
                           {/* Top: Unassigned Activities */}
                           <div className="bg-gray-50/50 rounded-3xl p-6 border-2 border-dashed border-gray-100 flex flex-col min-h-0">
                              <h4 className="text-lg font-black text-gray-400 mb-4 flex items-center gap-2">
                                 <MapPin className="w-5 h-5" />
                                 أنشطة غير محددة
                                 <Badge variant="outline" className="mr-auto">{activities.filter((_, idx) => !days.some(d => d.activities.includes(idx))).length}</Badge>
                              </h4>
                              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                 <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {activities.map((act, idx) => {
                                       const isAssigned = days.some(d => d.activities.includes(idx));
                                       if (isAssigned) return null;
                                       return (
                                          <div key={idx} className="group relative bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer" onClick={() => toggleActivityInDay(currentDay-1, idx)}>
                                             <div className="aspect-video rounded-xl bg-gray-100 mb-3 overflow-hidden">
                                                {act.images?.[0] ? (
                                                   <img src={typeof act.images[0] === 'string' ? act.images[0] : URL.createObjectURL(act.images[0])} className="w-full h-full object-cover" />
                                                ) : (
                                                   <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-8 h-8" /></div>
                                                )}
                                             </div>
                                             <h5 className="font-bold text-sm text-gray-800 line-clamp-1">{act.name}</h5>
                                             <Button size="sm" variant="ghost" className="absolute top-2 left-2 h-8 w-8 p-0 rounded-full bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:bg-emerald-50">
                                                <Plus className="w-5 h-5" />
                                             </Button>
                                          </div>
                                       )
                                    })}
                                    {activities.filter((_, idx) => !days.some(d => d.activities.includes(idx))).length === 0 && (
                                       <div className="col-span-full py-10 text-center text-gray-300 font-bold">كل الأنشطة تم توزيعها! 🎉</div>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {/* Bottom: Current Day Schedule */}
                           <div className="bg-emerald-50/30 rounded-3xl p-6 border-2 border-emerald-50 flex flex-col min-h-0">
                              <h4 className="text-lg font-black text-emerald-800 mb-4 flex items-center gap-2">
                                 <Calendar className="w-5 h-5" />
                                 جدول {days[currentDay-1]?.title}
                              </h4>
                              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                 {days[currentDay-1]?.activities.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-emerald-200 font-bold">
                                       <p>اختر من الأنشطة في الأعلى لإضافتها هنا</p>
                                    </div>
                                 ) : (
                                    days[currentDay-1]?.activities.map((actIdx) => {
                                       const act = activities[actIdx];
                                       return (
                                          <div key={actIdx} className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 flex items-center justify-between group">
                                             <div className="flex items-center gap-4">
                                                <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center p-0 border-emerald-200 text-emerald-600 bg-emerald-50 font-mono">
                                                   {days[currentDay-1]?.activities.indexOf(actIdx) + 1}
                                                </Badge>
                                                <div>
                                                   <h5 className="font-bold text-gray-900">{act.name}</h5>
                                                   <p className="text-xs text-gray-400 font-bold line-clamp-1">{act.description || "لا يوجد وصف"}</p>
                                                </div>
                                             </div>
                                             <Button variant="ghost" size="sm" onClick={() => toggleActivityInDay(currentDay-1, actIdx)} className="text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl">
                                                <Trash2 className="w-4 h-4" />
                                             </Button>
                                          </div>
                                       )
                                    })
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>

                   </CardContent>
                           {/* Navigation Buttons */}
                           <div className="flex gap-3 pt-2 mt-auto border-t border-gray-100">
                              <Button variant="outline" onClick={prevStep} className="h-12 w-12 rounded-xl p-0 border-gray-200"><ArrowRight className="w-5 h-5 text-gray-500" /></Button>
                              <Button onClick={nextStep} className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100">
                                 التالي: المطاعم والأكلات
                                 <ArrowLeft className="mr-2 w-5 h-5" />
                              </Button>
                           </div>

               </Card>
             </div>
           )}

           {/* Step 4: Food & Restaurants */}
           {currentStep === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                 <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    <CardHeader className="bg-amber-50/50 p-10 border-b border-amber-100/50">
                       <CardTitle className="text-3xl font-black text-gray-900 flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white">
                             <Utensils className="w-6 h-6" />
                          </div>
                          تجارب المطاعم والأكلات
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[calc(100vh-200px)]">
                       <div className="grid grid-cols-12 gap-6 h-full">
                          {/* Form Section */}
                          <div className="col-span-12 lg:col-span-4 h-full flex flex-col space-y-4 border-l border-gray-100 pl-4 overflow-y-auto custom-scrollbar">
                             <h3 className="text-xl font-black text-gray-900 mb-2">أضف مطعم جديد</h3>
                             <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                {/* Name */}
                                <div className="space-y-2">
                                   <Label>الاسم</Label>
                                   <Input 
                                     value={newFoodPlace.name}
                                     onChange={e => setNewFoodPlace({...newFoodPlace, name: e.target.value})}
                                     className="h-12 bg-white rounded-xl"
                                     placeholder="اسم المطعم"
                                   />
                                </div>
                                 {/* Location */}
                                 <div className="space-y-2">
                                   <Label>الموقع / العنوان</Label>
                                   <Input 
                                     value={newFoodPlace.location}
                                     onChange={e => setNewFoodPlace({...newFoodPlace, location: e.target.value})}
                                     className="h-12 bg-white rounded-xl"
                                     placeholder="رابط جوجل مابس أو العنوان"
                                   />
                                </div>
                                {/* Type */}
                                <div className="space-y-2">
                                   <Label>النوع</Label>
                                   <Select value={newFoodPlace.type} onValueChange={val => setNewFoodPlace({...newFoodPlace, type: val})}>
                                     <SelectTrigger className="h-12 bg-white rounded-xl"><SelectValue /></SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="restaurant">مطعم</SelectItem>
                                       <SelectItem value="cafe">كافيه</SelectItem>
                                       <SelectItem value="street_food">أكل شوارع</SelectItem>
                                     </SelectContent>
                                   </Select>
                                </div>
                                {/* Description */}
                                <div className="space-y-2">
                                   <Label>الوصف</Label>
                                   <Textarea 
                                     value={newFoodPlace.description}
                                     onChange={e => setNewFoodPlace({...newFoodPlace, description: e.target.value})}
                                     className="bg-white rounded-xl min-h-[100px]"
                                     placeholder="وصف التجربة..."
                                   />
                                </div>
                                {/* Image Upload in Form */}
                                <div className="space-y-2">
                                   <Label>صورة المطعم</Label>
                                   <div className="flex items-center gap-4">
                                      {(newFoodPlace as any).image && (
                                         <img src={(newFoodPlace as any).image} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                                      )}
                                      <label className="flex-1 cursor-pointer">
                                         <div className="flex items-center justify-center w-full h-12 rounded-xl bg-white border border-dashed border-gray-300 hover:bg-gray-50 hover:border-amber-400 transition-all text-gray-400 text-sm font-bold gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            <span>{(newFoodPlace as any).image ? "تغيير الصورة" : "رفع صورة"}</span>
                                         </div>
                                         <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                               const file = e.target.files[0];
                                               const url = URL.createObjectURL(file);
                                               setNewFoodPlace({...newFoodPlace, image: url, file: file} as any);
                                            }
                                         }} />
                                      </label>
                                   </div>
                                </div>

                                <Button 
                                  onClick={() => {
                                     if(!newFoodPlace.name) return;
                                     setFoodPlaces([...foodPlaces, { ...newFoodPlace, id: Date.now().toString() } as any]);
                                     setNewFoodPlace({ name: '', description: '', location: '', type: 'restaurant', image: '' } as any);
                                  }}
                                  className="w-full h-12 rounded-xl text-white font-bold shadow-lg bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                                >
                                   <Plus className="w-5 h-5 mr-2" />
                                   أضف المطعم
                                </Button>
                             </div>
                          </div>

                          {/* List Section */}
                          <div className="col-span-12 lg:col-span-8 h-full overflow-y-auto custom-scrollbar">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {foodPlaces.map((item, idx) => (
                                   <div key={idx} className="group relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex gap-4">
                                      <div className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                                         {(item as any).image ? <img src={(item as any).image} className="w-full h-full object-cover" /> : (
                                            <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                                              <ImageIcon className="w-6 h-6 text-gray-400" />
                                              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                 if (e.target.files?.[0]) {
                                                    const file = e.target.files[0];
                                                    const url = URL.createObjectURL(file);
                                                    const newArr = [...foodPlaces]; 
                                                    newArr[idx] = { ...newArr[idx], image: url, file: file } as any; 
                                                    setFoodPlaces(newArr);
                                                 }
                                              }} />
                                            </label>
                                         )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <h5 className="font-bold text-gray-900 truncate">{item.name}</h5>
                                         <p className="text-gray-500 text-xs line-clamp-2 mt-1">{item.description}</p>
                                         {(item as any).location && <div className="flex items-center gap-1 mt-2 text-xs text-blue-500"><MapPin className="w-3 h-3" /><a href={(item as any).location} target="_blank" rel="noreferrer" className="truncate hover:underline">الموقع</a></div>}
                                         <div className="flex items-center gap-1 mt-2 text-amber-500 text-xs font-bold"><Star className="w-3 h-3 fill-amber-500" /> {item.rating || 5}</div>
                                      </div>
                                      <button onClick={() => setFoodPlaces(foodPlaces.filter((_, i) => i !== idx))} className="absolute top-2 left-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                   </div>
                                ))}
                                {foodPlaces.length === 0 && (
                                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-300 border-2 border-dashed border-gray-100 rounded-3xl">
                                     <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Utensils className="w-8 h-8 text-gray-300" /></div>
                                     <p className="font-bold">قائمة المطاعم فارغة.</p>
                                  </div>
                                )}
                             </div>
                          </div>
                       </div>


                    </CardContent>
                    {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-2 mt-auto border-t border-gray-100">
                       <Button variant="outline" onClick={prevStep} className="h-12 w-12 rounded-xl p-0 border-gray-200"><ArrowRight className="w-5 h-5 text-gray-500" /></Button>
                       <Button onClick={nextStep} className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100">
                          التالي:  الفنادق والاقامة
                          <ArrowLeft className="mr-2 w-5 h-5" />
                       </Button>
                    </div>
                 </Card>
                 
              </div>
           )}

           {/* Step 5: Hotels & Stay */}
           {currentStep === 5 && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                 <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    <CardHeader className="bg-blue-50/50 p-10 border-b border-blue-100/50">
                       <CardTitle className="text-3xl font-black text-gray-900 flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                             <MapPin className="w-6 h-6" />
                          </div>
                          أماكن الإقامة والفنادق
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[calc(100vh-200px)]">
                       <div className="grid grid-cols-12 gap-6 h-full">
                          {/* Form Section */}
                          <div className="col-span-12 lg:col-span-4 h-full flex flex-col space-y-4 border-l border-gray-100 pl-4 overflow-y-auto custom-scrollbar">
                             <h3 className="text-xl font-black text-gray-900 mb-2">أضف مكان إقامة</h3>
                             <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <div className="space-y-2">
                                   <Label>الاسم</Label>
                                   <Input 
                                     value={newHotel.name}
                                     onChange={e => setNewHotel({...newHotel, name: e.target.value})}
                                     className="h-12 bg-white rounded-xl"
                                     placeholder="اسم الفندق/المكان"
                                   />
                                </div>
                                 <div className="space-y-2">
                                   <Label>الموقع / العنوان</Label>
                                   <Input 
                                     value={newHotel.location}
                                     onChange={e => setNewHotel({...newHotel, location: e.target.value})}
                                     className="h-12 bg-white rounded-xl"
                                     placeholder="رابط جوجل مابس أو العنوان"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <Label>الوصف</Label>
                                   <Textarea 
                                     value={newHotel.description}
                                     onChange={e => setNewHotel({...newHotel, description: e.target.value})}
                                     className="bg-white rounded-xl min-h-[100px]"
                                     placeholder="وصف المكان..."
                                   />
                                </div>
                                  <div className="space-y-2">
                                   <Label>رابط الحجز (اختياري)</Label>
                                   <Input 
                                     value={newHotel.bookingUrl}
                                     onChange={e => setNewHotel({...newHotel, bookingUrl: e.target.value})}
                                     className="h-12 bg-white rounded-xl" 
                                     placeholder="Booking.com / Airbnb..."
                                   />
                                  </div>
                                
                                {/* Image Upload in Form */}
                                <div className="space-y-2">
                                   <Label>صورة الفندق</Label>
                                   <div className="flex items-center gap-4">
                                      {(newHotel as any).image && (
                                         <img src={(newHotel as any).image} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                                      )}
                                      <label className="flex-1 cursor-pointer">
                                         <div className="flex items-center justify-center w-full h-12 rounded-xl bg-white border border-dashed border-gray-300 hover:bg-gray-50 hover:border-blue-400 transition-all text-gray-400 text-sm font-bold gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            <span>{(newHotel as any).image ? "تغيير الصورة" : "رفع صورة"}</span>
                                         </div>
                                         <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                               const file = e.target.files[0];
                                               const url = URL.createObjectURL(file);
                                               setNewHotel({...newHotel, image: url, file: file} as any);
                                            }
                                         }} />
                                      </label>
                                   </div>
                                </div>

                                <Button 
                                  onClick={() => {
                                     if(!newHotel.name) return;
                                     setHotels([...hotels, { ...newHotel, id: Date.now().toString() } as any]);
                                     setNewHotel({ name: '', description: '', location: '', bookingUrl: '', image: '', file: undefined } as any);
                                  }}
                                  className="w-full h-12 rounded-xl text-white font-bold shadow-lg bg-blue-500 hover:bg-blue-600 shadow-blue-100"
                                >
                                   <Plus className="w-5 h-5 mr-2" />
                                   أضف الفندق
                                </Button>
                             </div>
                          </div>

                          {/* List Section */}
                          <div className="col-span-12 lg:col-span-8 h-full overflow-y-auto custom-scrollbar">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {hotels.map((item, idx) => (
                                   <div key={idx} className="group relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex gap-4">
                                      <div className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                                         {(item as any).image ? <img src={(item as any).image} className="w-full h-full object-cover" /> : (
                                            <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                                              <ImageIcon className="w-6 h-6 text-gray-400" />
                                              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                 if (e.target.files?.[0]) {
                                                    const file = e.target.files[0];
                                                    const url = URL.createObjectURL(file);
                                                    const newArr = [...hotels]; 
                                                    newArr[idx] = { ...newArr[idx], image: url, file: file } as any; 
                                                    setHotels(newArr);
                                                 }
                                              }} />
                                            </label>
                                         )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <h5 className="font-bold text-gray-900 truncate">{item.name}</h5>
                                         <p className="text-gray-500 text-xs line-clamp-2 mt-1">{item.description}</p>
                                         {(item as any).location && <div className="flex items-center gap-1 mt-2 text-xs text-blue-500"><MapPin className="w-3 h-3" /><a href={(item as any).location} target="_blank" rel="noreferrer" className="truncate hover:underline">الموقع</a></div>}
                                         <div className="flex items-center gap-1 mt-2 text-amber-500 text-xs font-bold"><Star className="w-3 h-3 fill-amber-500" /> {item.rating || 5}</div>
                                      </div>
                                      <button onClick={() => setHotels(hotels.filter((_, i) => i !== idx))} className="absolute top-2 left-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                   </div>
                                ))}
                                {hotels.length === 0 && (
                                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-300 border-2 border-dashed border-gray-100 rounded-3xl">
                                     <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><MapPin className="w-8 h-8 text-gray-300" /></div>
                                     <p className="font-bold">قائمة الفنادق فارغة.</p>
                                  </div>
                                )}
                             </div>
                          </div>
                       </div>


                    </CardContent>
                     {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-2 mt-auto border-t border-gray-100">
                       <Button variant="outline" onClick={prevStep} className="h-12 w-12 rounded-xl p-0 border-gray-200"><ArrowRight className="w-5 h-5 text-gray-500" /></Button>
                       <Button onClick={nextStep} className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100">
                          التالي:   مراحعة الرحلة 
                          <ArrowLeft className="mr-2 w-5 h-5" />
                       </Button>
                    </div>
                 </Card>
              </div>
           )}

           {/* Step 6: Final Review */}
           {currentStep === 6 && (
             <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-20">
                {/* Celebration Banner */}
                <div className="relative mb-8 text-center">
                   <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-2">رحلتك جاهزة للتحديث! 🎉</h2>
                   <p className="text-gray-500 text-lg font-bold">هذه نظرة أخيرة قبل حفظ التعديلات.</p>
                </div>

                <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white mb-8">
                   {/* Hero Section */}
                   <div className="relative h-[400px] w-full">
                      <img src={tripData.coverImageUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8 lg:p-12">
                         <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className="bg-orange-600 border-none text-white px-4 py-1.5 rounded-full font-bold text-base shadow-lg">{tripData.destination}</Badge>
                            {tripData.season && <Badge className="bg-white/20 backdrop-blur-md border-none text-white px-4 py-1.5 rounded-full font-bold text-base">{tripData.season === 'winter' ? 'شتاء' : tripData.season === 'summer' ? 'صيف' : tripData.season === 'spring' ? 'ربيع' : 'خريف'}</Badge>}
                         </div>
                         <h1 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-tight max-w-4xl">{tripData.title}</h1>
                         <div className="flex flex-wrap gap-6 text-white/90 font-bold text-lg lg:text-xl p-4 bg-white/10 backdrop-blur-md rounded-2xl w-fit border border-white/10">
                            <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-400" /> {tripData.duration}</span>
                            <span className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-400" /> {tripData.budget}</span>
                            <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-400" /> {locations.length} موقع</span>
                         </div>
                      </div>
                   </div>

                   <CardContent className="p-8 lg:p-12 space-y-12">
                     {/* Description & Stats */}
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-2 space-y-4">
                             <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                <div className="w-2 h-8 bg-orange-500 rounded-full" />
                                عن الرحلة
                             </h3>
                             <p className="text-gray-600 text-lg leading-relaxed font-medium bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                "{tripData.description}"
                             </p>
                          </div>
                          <div className="space-y-4">
                             <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                                إحصائيات
                             </h3>
                             <div className="grid grid-cols-1 gap-3">
                                <div className="bg-indigo-50 p-4 rounded-2xl flex items-center justify-between">
                                   <span className="text-indigo-800 font-bold">الأيام</span>
                                   <Badge className="bg-indigo-200 text-indigo-800 hover:bg-indigo-300 border-none text-lg">{days.length}</Badge>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-2xl flex items-center justify-between">
                                   <span className="text-emerald-800 font-bold">الأنشطة</span>
                                   <Badge className="bg-emerald-200 text-emerald-800 hover:bg-emerald-300 border-none text-lg">{activities.length}</Badge>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-2xl flex items-center justify-between">
                                   <span className="text-orange-800 font-bold">المطاعم</span>
                                   <Badge className="bg-orange-200 text-orange-800 hover:bg-orange-300 border-none text-lg">{foodPlaces.length}</Badge>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between">
                                   <span className="text-blue-800 font-bold">الفنادق</span>
                                   <Badge className="bg-blue-200 text-blue-800 hover:bg-blue-300 border-none text-lg">{hotels.length}</Badge>
                                </div>
                             </div>
                          </div>
                     </div>
                     
                     {/* Itinerary Timeline Preview */}
                     <div className="space-y-6">
                        <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                           <div className="w-2 h-8 bg-purple-500 rounded-full" />
                           جدول الرحلة
                        </h3>
                        <div className="space-y-6 relative border-r-2 border-gray-100 pr-6 mr-3">
                           {days.map((day, i) => (
                              <div key={i} className="relative">
                                 <div className="absolute -right-[33px] top-0 w-4 h-4 rounded-full bg-purple-500 ring-4 ring-white" />
                                 <h4 className="text-xl font-bold text-gray-900 mb-4">{day.title}</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {day.activities.length > 0 ? day.activities.map(actIdx => {
                                       const act = activities[actIdx];
                                       return (
                                          <div key={actIdx} className="bg-white border border-gray-100 rounded-2xl p-3 flex gap-3 shadow-sm hover:shadow-md transition-all">
                                             <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                                                {act.images?.[0] ? <img src={typeof act.images[0] === 'string' ? act.images[0] : ''} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-50"><MapPin className="w-6 h-6 text-gray-300" /></div>}
                                             </div>
                                             <div className="overflow-hidden">
                                                <div className="font-bold text-gray-900 truncate">{act.name}</div>
                                                <div className="text-xs text-gray-500 line-clamp-2">{act.name}</div>
                                             </div>
                                          </div>
                                       )
                                    }) : (
                                       <div className="col-span-full text-gray-400 italic font-medium">لا توجد أنشطة لهذا اليوم</div>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Restaurants & Hotels Grid */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          {/* Restaurants */}
                          <div className="space-y-4">
                             <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                <div className="w-2 h-8 bg-amber-500 rounded-full" />
                                المطاعم
                             </h3>
                             <div className="space-y-3">
                                {foodPlaces.length > 0 ? foodPlaces.map((place, idx) => (
                                   <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                       <div className="w-16 h-16 rounded-xl bg-white shrink-0 overflow-hidden border border-gray-200">
                                          {(place as any).image ? <img src={(place as any).image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full"><Utensils className="text-gray-300" /></div>}
                                       </div>
                                       <div>
                                          <div className="font-bold text-gray-900">{place.name}</div>
                                          <div className="text-xs text-gray-500">{place.rating} ⭐</div>
                                       </div>
                                   </div>
                                )) : <p className="text-gray-400 font-medium">لم يتم إضافة مطاعم</p>}
                             </div>
                          </div>

                          {/* Hotels */}
                          <div className="space-y-4">
                             <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                <div className="w-2 h-8 bg-blue-500 rounded-full" />
                                الفنادق
                             </h3>
                             <div className="space-y-3">
                                {hotels.length > 0 ? hotels.map((hotel, idx) => (
                                   <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                       <div className="w-16 h-16 rounded-xl bg-white shrink-0 overflow-hidden border border-gray-200">
                                          {(hotel as any).image ? <img src={(hotel as any).image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full"><Sparkles className="text-gray-300" /></div>}
                                       </div>
                                       <div>
                                          <div className="font-bold text-gray-900">{hotel.name}</div>
                                          <div className="text-xs text-gray-500">{hotel.rating} ⭐ • {hotel.priceRange}</div>
                                       </div>
                                   </div>
                                )) : <p className="text-gray-400 font-medium">لم يتم إضافة فنادق</p>}
                             </div>
                          </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="flex flex-col sm:flex-row gap-4 pt-10">
                        <Button 
                          onClick={handleSubmit} 
                          disabled={isSaving}
                          className="h-20 flex-[2] rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-black shadow-2xl shadow-indigo-100 transition-all hover:scale-[1.02]"
                        >
                          {isSaving ? (
                             <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                جاري الحفظ...
                             </span>
                          ) : (
                             <span className="flex items-center gap-3">
                                حفظ التعديلات ونشر الرحلة ✨
                             </span>
                          )}
                        </Button>
                        <Button variant="outline" onClick={prevStep} className="h-20 flex-1 rounded-[1.5rem] border-gray-200 bg-white text-gray-500 font-black text-lg hover:border-indigo-200 hover:text-indigo-600">
                           تعديل البيانات
                        </Button>
                     </div>
                </CardContent>
             </Card>
           </div>
           )}
               </div>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditTrip;
