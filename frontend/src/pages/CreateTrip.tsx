import { useState, useEffect } from "react";
import { MapPin, Calendar, DollarSign, Image as ImageIcon, Plus, Trash2, ArrowRight, ArrowLeft, Check, Star, Utensils, Clock, Sparkles, FileText, Zap, Trophy, Camera, Video, Smile, Users, Search, X, Home, List } from "lucide-react";
import { cn } from "@/lib/utils";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { createTrip, getCloudinarySignature, searchUsers } from "@/lib/api";
import UploadProgressLoader from "@/components/UploadProgressLoader";

const CreateTrip = () => {
  const { toast } = useToast();
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

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

  const [postType, setPostType] = useState<'detailed' | 'quick' | null>(null); // null = selection screen
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState({
    show: false,
    total: 0,
    completed: 0,
    currentItem: "",
    isProcessing: false,
  });

  // Quick post media
  const [quickMedia, setQuickMedia] = useState<{ files: File[]; previews: string[] }>({ files: [], previews: [] });
  
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

  const [taggedUsers, setTaggedUsers] = useState<{ userId: string; fullName: string; imageUrl: string }[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Step 2: Activities with coordinates
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [locations, setLocations] = useState<TripLocation[]>([]);

  // Step 3: Organize activities into days
  const [days, setDays] = useState<TripDay[]>([]);
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    const search = async () => {
      if (userSearchQuery.trim().length < 2) {
        setUserSearchResults([]);
        return;
      }
      setIsSearchingUsers(true);
      try {
        const token = await getToken();
        const results = await searchUsers(userSearchQuery, token || "");
        setUserSearchResults(results);
      } catch (err) {
        console.error("User search error:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    };
    const timer = setTimeout(search, 500);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);
  // Step 4: Food and Restaurants
  // Step 4: Food and Restaurants
  const [foodPlaces, setFoodPlaces] = useState<FoodPlace[]>([]);
  const [newFoodPlace, setNewFoodPlace] = useState<{name:string, description:string, location:string, type:string}>({ name: '', description: '', location: '', type: 'restaurant' });

  // Step 5: Hotels
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [newHotel, setNewHotel] = useState<{name:string, description:string, location:string, bookingUrl:string}>({ name: '', description: '', location: '', bookingUrl: '' });

  // Comprehensive list of Egypt's cities and governorates
  const EGYPT_CITIES = [
    { value: 'alexandria', label: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
    { value: 'cairo', label: 'القاهرة', lat: 30.0444, lng: 31.2357 },
    { value: 'giza', label: 'الجيزة', lat: 30.0131, lng: 31.2089 },
    { value: 'luxor', label: 'الأقصر', lat: 25.6872, lng: 32.6396 },
    { value: 'aswan', label: 'أسوان', lat: 24.0889, lng: 32.8998 },
    { value: 'matrouh', label: 'مرسى مطروح', lat: 31.3543, lng: 27.2373 },
    { value: 'hurghada', label: 'الغردقة', lat: 27.2579, lng: 33.8116 },
    { value: 'sharm', label: 'شرم الشيخ', lat: 27.9158, lng: 34.3299 },
    { value: 'dahab', label: 'دهب', lat: 28.501, lng: 34.511 },
    { value: 'siwa', label: 'سيوة', lat: 29.2032, lng: 25.5195 },
    { value: 'port_said', label: 'بورسعيد', lat: 31.2653, lng: 32.3026 },
    { value: 'suez', label: 'السويس', lat: 29.9668, lng: 32.5498 },
    { value: 'ismailia', label: 'الإسماعيلية', lat: 30.5965, lng: 32.2715 },
    { value: 'faiyum', label: 'الفيوم', lat: 29.3084, lng: 30.8428 },
    { value: 'minya', label: 'المنيا', lat: 28.1099, lng: 30.7503 },
    { value: 'asyut', label: 'أسيوط', lat: 27.1783, lng: 31.1859 },
    { value: 'sohag', label: 'سوهج', lat: 26.5590, lng: 31.6957 },
    { value: 'qena', label: 'قنا', lat: 26.1551, lng: 32.7160 },
    { value: 'beni_suef', label: 'بني سويف', lat: 29.0661, lng: 31.0994 },
    { value: 'damietta', label: 'دمياط', lat: 31.4175, lng: 31.8144 },
    { value: 'dakahlia', label: 'الدقهلية', lat: 31.0379, lng: 31.3815 }, 
    { value: 'sharkia', label: 'الشرقية', lat: 30.5865, lng: 31.5035 }, 
    { value: 'gharbia', label: 'الغربية', lat: 30.7917, lng: 31.0094 }, 
    { value: 'monufia', label: 'المنوفية', lat: 30.5503, lng: 31.0109 }, 
    { value: 'beheira', label: 'البحيرة', lat: 31.0427, lng: 30.4704 }, 
    { value: 'kafr_el_sheikh', label: 'كفر الشيخ', lat: 31.1107, lng: 30.9388 },
    { value: 'north_sinai', label: 'شمال سيناء', lat: 31.1316, lng: 33.7984 },
    { value: 'south_sinai', label: 'جنوب سيناء', lat: 28.9719, lng: 34.0041 },
    { value: 'new_valley', label: 'الوادي الجديد', lat: 25.4390, lng: 30.5496 },
  ].sort((a, b) => a.label.localeCompare(b.label, 'ar'));
  
  // Helper to find city by value
  const getCity = (val: string) => EGYPT_CITIES.find(c => c.value === val);

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
      const city = getCity(tripData.destination)?.label || tripData.destination;
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
      // Sync locations to activities
      const newActivities = locations.map(loc => ({
        name: loc.name,
        description: loc.description,
        coordinates: { lat: loc.coordinates[0], lng: loc.coordinates[1] },
        images: loc.images.map(img => img instanceof File ? URL.createObjectURL(img) : img),
        videos: loc.videos.map(vid => vid instanceof File ? URL.createObjectURL(vid) : vid),
        price: 0, // Default price, can be edited later?
        day: 0
      }));
      setActivities(newActivities as TripActivity[]);

      // Auto-create days if none exist
      if (days.length === 0) {
        const numDays = parseInt(tripData.duration) || Math.ceil(locations.length / 3) || 1;
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
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setPostType(null);
    }
  };

  // Helper function to convert File to base64


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
      const hasCoverImage = tripData.coverImage instanceof File;
      const foodImages = foodPlaces.reduce((sum, fp) => sum + ((fp as any).file instanceof File ? 1 : 0), 0);
      const hotelImages = hotels.reduce((sum, h) => sum + ((h as any).file instanceof File ? 1 : 0), 0);
      
      const totalItems = totalImages + totalVideos + (hasCoverImage ? 1 : 0) + foodImages + hotelImages;

      // Show upload progress
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
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");

      // 1. Handle Cover Image
      let coverImage = tripData.coverImageUrl || "";
      if (tripData.coverImage instanceof File) {
        processedCount++;
        setUploadProgress(prev => ({ ...prev, completed: processedCount, currentItem: "جاري رفع صورة الغلاف..." }));
        coverImage = await uploadFileToCloudinary(tripData.coverImage, token);
      }

      // 2. Handle Activities (Locations) Images & Videos
      const finalActivities: TripActivity[] = await Promise.all(
        locations.map(async (location, index) => {
          const dayIndex = days.findIndex(d => d.activities.includes(index));
          
          // Images
          const base64Images = await Promise.all(
            (location.images || []).map(async (img) => {
              if (typeof img === 'string' && img.startsWith('http')) return img;
              if (img instanceof File) {
                processedCount++;
                setUploadProgress(prev => ({ ...prev, completed: processedCount, currentItem: `جاري رفع الصورة: ${location.name || `موقع ${index + 1}`}` }));
                return await uploadFileToCloudinary(img, token);
              }
              return '';
            })
          );

          // Videos
          const base64Videos = await Promise.all(
            (location.videos || []).map(async (vid) => {
              if (typeof vid === 'string' && vid.startsWith('http')) return vid;
              if (vid instanceof File) {
                processedCount++;
                setUploadProgress(prev => ({ ...prev, completed: processedCount, currentItem: `جاري رفع الفيديو: ${location.name || `موقع ${index + 1}`}` }));
                return await uploadFileToCloudinary(vid, token);
              }
              return '';
            })
          );

          return {
            name: location.name || `موقع ${index + 1}`,
            images: base64Images.filter(img => img), 
            videos: base64Videos.filter(vid => vid), 
            coordinates: Array.isArray(location.coordinates) ? { lat: location.coordinates[0], lng: location.coordinates[1] } : (location.coordinates || { lat: 0, lng: 0 }),
            day: dayIndex >= 0 ? dayIndex + 1 : 1,
          };
        })
      );

      // 3. Handle Food Places Images
      const finalFoodPlaces = await Promise.all(foodPlaces.map(async (fp) => {
        let imageUrl = fp.image;
        if ((fp as any).file instanceof File) {
           processedCount++;
           setUploadProgress(prev => ({ ...prev, completed: processedCount, currentItem: `جاري رفع صورة المطعم: ${fp.name}` }));
           imageUrl = await uploadFileToCloudinary((fp as any).file, token);
        }
        // If image is a blob URL but no file, we can't upload it (shouldn't happen with correct logic). 
        // We act conservative and only save if it's http or we just uploaded it.
        // Actually, if it's blob and we lost the file, we can't save it. content of blob is local.
        if (imageUrl && imageUrl.startsWith('blob:') && !((fp as any).file instanceof File)) {
            imageUrl = ''; // Cannot save local blob without file
        }
        return { ...fp, image: imageUrl };
      }));

      // 4. Handle Hotels Images
      const finalHotels = await Promise.all(hotels.map(async (h) => {
        let imageUrl = h.image;
        if ((h as any).file instanceof File) {
           processedCount++;
           setUploadProgress(prev => ({ ...prev, completed: processedCount, currentItem: `جاري رفع صورة الفندق: ${h.name}` }));
           imageUrl = await uploadFileToCloudinary((h as any).file, token);
        }
        if (imageUrl && imageUrl.startsWith('blob:') && !((h as any).file instanceof File)) {
            imageUrl = ''; 
        }
        return { ...h, image: imageUrl };
      }));

      // Construct Payload
      const payload = {
        title: tripData.title,
        destination: tripData.destination,
        city: tripData.city || getCity(tripData.destination)?.label || tripData.destination,
        duration: tripData.duration,
        rating: tripData.rating,
        image: coverImage,
        author: user?.fullName || user?.firstName || user?.username || "مستخدم",
        description: tripData.description,
        budget: tripData.budget,
        season: tripData.season || undefined,
        postType: 'detailed',
        activities: finalActivities,
        days: days.map((day) => ({
          ...day,
          activities: day.activities.filter(aIdx => aIdx < activities.length),
        })),
        foodAndRestaurants: finalFoodPlaces.filter(fp => fp.name), // Allow places without images if name exists
        hotels: finalHotels.filter(h => h.name), // Allow hotels without images if name exists
        taggedUsers,
      };
      
      if (totalItems > 0) {
        setUploadProgress(prev => ({ ...prev, isProcessing: true, currentItem: "جاري إرسال البيانات..." }));
      }

      const created = await createTrip(payload as any, token || undefined);
      toast({
        title: "تم إنشاء الرحلة بنجاح!",
        description: isEarlyShare ? "تم نشر الرحلة. يمكنك الآن إضافة المزيد من التفاصيل." : "تم نشر رحلتك",
      });
      localStorage.removeItem('tripDraft');
      setTimeout(() => {
        if (created?._id) {
          if (isEarlyShare) {
            navigate(`/trips/edit/${created._id}`, { state: { initialStep: 2 } });
          } else {
            navigate(`/trips/${created._id}`);
          }
        } else {
          navigate(`/timeline`);
        }
      }, 800);
    } catch (err: any) {
      console.error('Error creating trip:', err);
      setUploadProgress(prev => ({ ...prev, show: false }));
      const errorMessage = err?.message || "حدث خطأ غير متوقع";
      const errorDetails = err?.details || (err?.response?.data?.details ? JSON.stringify(err.response.data.details) : null);
      toast({ 
        title: "فشل إنشاء الرحلة", 
        description: errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage, 
        variant: "destructive",
        duration: 5000
      });
    }
  };

  // Handle quick media upload (images/videos)
  const MAX_VIDEO_SIZE_MB = 45; // Support up to 45MB for videos
  const MAX_IMAGE_SIZE_MB = 15; // Support up to 15MB per image
  const TOTAL_LIMIT_MB = 50;   // Total 50MB limit

  const handleQuickMediaUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles: File[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(files)) {
      const sizeMB = file.size / (1024 * 1024);
      if (file.type.startsWith('video/') && sizeMB > MAX_VIDEO_SIZE_MB) {
        rejected.push(`${file.name} (${sizeMB.toFixed(1)}MB - الحد الأقصى للفيديو ${MAX_VIDEO_SIZE_MB}MB)`);
      } else if (file.type.startsWith('image/') && sizeMB > MAX_IMAGE_SIZE_MB) {
        rejected.push(`${file.name} (${sizeMB.toFixed(1)}MB - الحد الأقصى للصورة ${MAX_IMAGE_SIZE_MB}MB)`);
      } else {
        newFiles.push(file);
      }
    }

    if (rejected.length > 0) {
      toast({
        title: "بعض الملفات كبيرة جداً",
        description: `تم رفض: ${rejected.join('، ')}. حاول ضغط الملفات أولاً.`,
        variant: "destructive",
        duration: 6000,
      });
    }

    if (newFiles.length > 0) {
      const newPreviews = newFiles.map(f => URL.createObjectURL(f));
      setQuickMedia(prev => ({
        files: [...prev.files, ...newFiles],
        previews: [...prev.previews, ...newPreviews],
      }));
    }
  };

  const removeQuickMedia = (index: number) => {
    setQuickMedia(prev => ({
      files: prev.files.filter((_, i) => i !== index),
      previews: prev.previews.filter((_, i) => i !== index),
    }));
  };

  // Quick post submit
  const handleQuickSubmit = async () => {
    if (!tripData.title || !tripData.destination || !tripData.description) {
      toast({
        title: "معلومات ناقصة",
        description: "الرجاء ملء العنوان والوجهة والوصف",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check total payload size before proceeding (MongoDB 16MB BSON limit)
      const totalFileSizeMB = quickMedia.files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
      const coverSizeMB = tripData.coverImage ? tripData.coverImage.size / (1024 * 1024) : 0;
      const totalMediaMB = totalFileSizeMB + coverSizeMB;
      
      if (totalMediaMB > TOTAL_LIMIT_MB) {
        toast({
          title: "حجم الملفات كبير جداً",
          description: `إجمالي حجم الملفات ${totalMediaMB.toFixed(1)}MB. الحد الأقصى هو ${TOTAL_LIMIT_MB}MB. حاول إزالة بعض الملفات أو ضغطها.`,
          variant: "destructive",
          duration: 6000,
        });
        return;
      }

      toast({
        title: "جاري نشر البوست...",
        description: "يرجى الانتظار بينما نقوم بتحميل الملفات",
      });

      const totalItems = quickMedia.files.length + (tripData.coverImage ? 1 : 0);
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
      let coverImage = tripData.coverImageUrl || "";
      const token = await getToken();
      if (!token) throw new Error("لم يتم العثور على توكن المصادقة");

      if (tripData.coverImage) {
        processedCount++;
        setUploadProgress(prev => ({ ...prev, completed: processedCount, currentItem: "جاري رفع صورة الغلاف..." }));
        coverImage = await uploadFileToCloudinary(tripData.coverImage, token);
      }

      // Upload quick media files directly to Cloudinary
      const mediaImages: string[] = [];
      const mediaVideos: string[] = [];
      for (const file of quickMedia.files) {
        processedCount++;
        setUploadProgress(prev => ({ ...prev, completed: processedCount, currentItem: `جاري رفع: ${file.name}` }));
        const uploadedUrl = await uploadFileToCloudinary(file, token);
        if (file.type.startsWith('video/')) {
          mediaVideos.push(uploadedUrl);
        } else {
          mediaImages.push(uploadedUrl);
        }
      }

      // Get city info from our comprehensive list
      const cityInfo = getCity(tripData.destination);
      const cityLabel = cityInfo?.label || tripData.destination;
      const cityCoords = cityInfo ? { lat: cityInfo.lat, lng: cityInfo.lng } : { lat: 26.8206, lng: 30.8025 };

      const payload = {
        title: tripData.title,
        destination: tripData.destination,
        city: cityLabel,
        description: tripData.description,
        image: coverImage,
        author: user?.fullName || user?.firstName || user?.username || "مستخدم",
        postType: 'quick',
        season: tripData.season || undefined,
        // Store quick media as a single activity with the city name and correct coordinates
        activities: (mediaImages.length > 0 || mediaVideos.length > 0) ? [{
          name: cityLabel,
          images: mediaImages,
          videos: mediaVideos,
          coordinates: cityCoords,
          day: 1,
        }] : [],
        taggedUsers,
      };

      if (totalItems > 0) {
        setUploadProgress(prev => ({ ...prev, isProcessing: true, currentItem: "جاري إرسال البيانات..." }));
      }

      const created = await createTrip(payload as any, token || undefined);
      toast({
        title: "تم نشر البوست بنجاح! 🎉",
        description: "تم نشر رحلتك السريعة",
      });
      localStorage.removeItem('tripDraft');
      setTimeout(() => {
        if (created?._id) {
          navigate(`/trips/${created._id}`);
        } else {
          navigate(`/timeline`);
        }
      }, 800);
    } catch (err: any) {
      console.error('Error creating quick trip:', err);
      setUploadProgress(prev => ({ ...prev, show: false }));
      toast({
        title: "فشل نشر البوست",
        description: err?.message || "حدث خطأ غير متوقع",
        variant: "destructive",
        duration: 5000,
      });
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
                 {postType === null ? <>اختر <span className="text-orange-500">نوع</span> المنشور</> : <>أنشئ <span className="text-orange-500">رحلتك</span> الجديدة</>}
              </h1>
              <p className="text-indigo-100 text-lg md:text-xl font-light max-w-2xl text-center leading-relaxed">
                 {postType === null ? "شارك تجربتك بالطريقة التي تناسبك" : "شارك تجاربك وأماكنك المفضلة مع المسافرين الآخرين."}
              </p>
           </div>
        </section>

        {/* Post Type Selection Screen */}
        {postType === null && (
          <div className="container mx-auto px-4 -mt-20 relative z-20">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Detailed Trip Card */}
              <button 
                onClick={() => { setPostType('detailed'); setCurrentStep(1); }}
                className="group text-right animate-in fade-in slide-in-from-bottom-6 duration-700"
              >
                <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white hover:shadow-[0_30px_80px_-20px_rgba(234,88,12,0.3)] transition-all duration-500 hover:scale-[1.02] h-full relative">
                  <div className="absolute top-6 left-6 z-10">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2 rounded-full text-sm font-black flex items-center gap-2 shadow-lg">
                      <Trophy className="w-4 h-4" />
                      +20 نقطة
                    </div>
                  </div>
                  <div className="h-48 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute w-40 h-40 bg-white/10 rounded-full -top-10 -right-10 group-hover:scale-150 transition-transform duration-700" />
                      <div className="absolute w-32 h-32 bg-white/10 rounded-full bottom-0 left-10 group-hover:scale-125 transition-transform duration-700 delay-100" />
                    </div>
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-500">
                      <FileText className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <CardContent className="p-10 space-y-6">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 mb-3">رحلة بالتفاصيل الكاملة</h3>
                      <p className="text-gray-500 text-lg leading-relaxed">شارك رحلتك مع كل التفاصيل: المواقع على الخريطة، جدول الأيام، المطاعم، الفنادق والأنشطة</p>
                    </div>
                    <div className="space-y-3">
                      {["تحديد المواقع على الخريطة", "تنظيم جدول الأيام", "إضافة المطاعم والفنادق", "صور وفيديوهات لكل موقع"].map((feat, i) => (
                        <div key={i} className="flex items-center gap-3 text-gray-600">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-orange-600" />
                          </div>
                          <span className="font-bold text-sm">{feat}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4">
                      <div className="h-14 bg-orange-50 rounded-2xl flex items-center justify-center gap-3 text-orange-600 font-black text-lg group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                        ابدأ الآن
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>

              {/* Quick Trip Card */}
              <button 
                onClick={() => { setPostType('quick'); setCurrentStep(1); }}
                className="group text-right animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150"
              >
                <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white hover:shadow-[0_30px_80px_-20px_rgba(99,102,241,0.3)] transition-all duration-500 hover:scale-[1.02] h-full relative">
                  <div className="absolute top-6 left-6 z-10">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-5 py-2 rounded-full text-sm font-black flex items-center gap-2 shadow-lg">
                      <Zap className="w-4 h-4" />
                      +8 نقطة
                    </div>
                  </div>
                  <div className="h-48 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute w-40 h-40 bg-white/10 rounded-full -top-10 -left-10 group-hover:scale-150 transition-transform duration-700" />
                      <div className="absolute w-32 h-32 bg-white/10 rounded-full bottom-0 right-10 group-hover:scale-125 transition-transform duration-700 delay-100" />
                    </div>
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-500">
                      <Zap className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <CardContent className="p-10 space-y-6">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 mb-3">بوست سريع</h3>
                      <p className="text-gray-500 text-lg leading-relaxed">شارك صورك وفيديوهاتك مع وصف بسيط — زي أي بوست عادي بس مخصص للسفر</p>
                    </div>
                    <div className="space-y-3">
                      {["اختيار المدينة", "إضافة صور وفيديوهات", "كتابة وصف الرحلة", "نشر فوري وسريع"].map((feat, i) => (
                        <div key={i} className="flex items-center gap-3 text-gray-600">
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-indigo-600" />
                          </div>
                          <span className="font-bold text-sm">{feat}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4">
                      <div className="h-14 bg-indigo-50 rounded-2xl flex items-center justify-center gap-3 text-indigo-600 font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        ابدأ الآن
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </div>

            {/* Points info note */}
            <div className="max-w-3xl mx-auto mt-10 text-center">
              <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-lg border border-gray-100">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-gray-600 font-bold text-sm">البوست التفصيلي يمنحك نقاط أكثر لرفع مستوى حسابك وشارتك</span>
              </div>
            </div>
          </div>
        )}

        {/* QUICK POST FORM */}
        {postType === 'quick' && (
          <div className="container mx-auto px-4 -mt-20 relative z-20">
            <div className="max-w-7xl mx-auto">
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                  <CardHeader className="bg-indigo-50/50 p-10 border-b border-indigo-100/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-3xl font-black text-gray-900 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                          <Zap className="w-6 h-6" />
                        </div>
                        بوست سريع
                      </CardTitle>
                      <Badge className="bg-indigo-100 text-indigo-600 border-indigo-200 px-4 py-2 font-black gap-1">
                        <Zap className="w-3 h-3" /> +8 نقطة
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    {/* Quick Post Grid Layout */}
                    <div className="grid grid-cols-12 gap-6">
                      {/* Row 1: Title (Full) */}
                      <div className="col-span-12 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-lg font-black text-gray-800">عنوان البوست</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                                <Smile className="h-5 w-5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden mb-2" side="top" align="end">
                              <EmojiPicker
                                onEmojiClick={(emojiData) => setTripData(prev => ({ ...prev, title: prev.title + emojiData.emoji }))}
                                theme={Theme.LIGHT}
                                autoFocusSearch={false}
                                width={320}
                                height={400}
                                searchPlaceholder="بحث عن رمز..."
                                previewConfig={{ showPreview: false }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Input
                          placeholder="مثال: يوم جميل في الإسكندرية 🌊"
                          value={tripData.title}
                          onChange={e => setTripData({ ...tripData, title: e.target.value })}
                          className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 focus:bg-white text-lg font-bold px-4 border-2 transition-all"
                        />
                      </div>

                      {/* Row 2: Destination & Season (Half) */}
                      <div className="col-span-12 md:col-span-6 space-y-2">
                        <Label className="text-base font-black text-gray-800">المدينة</Label>
                        <Select value={tripData.destination} onValueChange={val => setTripData({ ...tripData, destination: val })}>
                          <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 text-base font-bold border-2">
                            <SelectValue placeholder="اختر المدينة" />
                          </SelectTrigger>
                          <SelectContent className="font-cairo font-bold max-h-[300px]">
                            {EGYPT_CITIES.map((city) => (
                              <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-12 md:col-span-6 space-y-2">
                        <Label className="text-base font-black text-gray-800">إحداثيات المدينة (تلقائي)</Label>
                         <div className="relative">
                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input 
                              readOnly 
                              value={tripData.destination ? `${getCity(tripData.destination)?.lat}, ${getCity(tripData.destination)?.lng}` : "اختر المدينة..."} 
                              className="h-14 rounded-2xl border-gray-100 bg-gray-50 text-base font-bold pr-10 text-gray-500" 
                            />
                         </div>
                      </div>

                      <div className="col-span-12 md:col-span-6 space-y-2">
                        <Label className="text-base font-black text-gray-800">الموسم</Label>
                        <div className="flex gap-2 h-14">
                          {['winter', 'summer', 'fall', 'spring'].map((s) => (
                            <button
                              key={s}
                              onClick={() => setTripData({ ...tripData, season: s })}
                              className={cn(
                                "flex-1 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 transition-all border-2",
                                tripData.season === s ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-gray-50 text-gray-400 hover:border-indigo-100 hover:text-indigo-400"
                              )}
                            >
                              <span className="text-lg">{s === 'winter' ? '❄️' : s === 'summer' ? '☀️' : s === 'fall' ? '🍂' : '🌸'}</span>
                              <span className="text-[9px] uppercase font-black">{s}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                       {/* Row 3: Description (Left) and Visuals (Right) */}
                      <div className="col-span-12 lg:col-span-6 space-y-2 h-full flex flex-col">
                         <div className="flex items-center justify-between">
                            <Label className="text-base font-black text-gray-800">وصف الرحلة</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                                  <Smile className="h-5 w-5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden mb-2" side="top" align="end">
                                <EmojiPicker
                                  onEmojiClick={(emojiData) => setTripData(prev => ({ ...prev, description: prev.description + emojiData.emoji }))}
                                  theme={Theme.LIGHT}
                                  autoFocusSearch={false}
                                  width={320}
                                  height={400}
                                  searchPlaceholder="بحث عن رمز..."
                                  previewConfig={{ showPreview: false }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <Textarea
                            placeholder="وصف سريع..."
                            value={tripData.description}
                            onChange={e => setTripData({ ...tripData, description: e.target.value })}
                            className="flex-1 rounded-2xl border-gray-100 bg-gray-50/30 text-base font-medium p-6 border-2 focus:bg-white transition-all leading-relaxed resize-none min-h-[300px]"
                          />
                      </div>

                      <div className="col-span-12 lg:col-span-6 space-y-4 flex flex-col">
                        {/* Cover Image */}
                         <div className="flex-1">
                           <Label className="text-base font-black text-gray-800 mb-2 block">صورة الغلاف (اختياري)</Label>
                           {tripData.coverImageUrl ? (
                             <div className="relative h-48 w-full rounded-2xl overflow-hidden group shadow-lg border-2 border-white cursor-pointer" onClick={() => (document.getElementById('cover-upload') as HTMLInputElement)?.click()}>
                                <img src={tripData.coverImageUrl} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setTripData({ ...tripData, coverImageUrl: '', coverImage: null }); }} className="rounded-full w-10 h-10 p-0 shadow-lg">
                                      <Trash2 className="w-5 h-5" />
                                   </Button>
                                </div>
                             </div>
                           ) : (
                             <label className="flex flex-col items-center justify-center h-48 w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-indigo-50 transition-all cursor-pointer group">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                   <ImageIcon className="w-6 h-6 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                                </div>
                                <span className="text-sm font-black text-gray-400 group-hover:text-indigo-500 transition-colors">صورة الغلاف</span>
                                <input id="cover-upload" type="file" accept="image/*" onChange={(e) => handleCoverImageUpload(e.target.files)} className="hidden" />
                             </label>
                           )}
                         </div>

                         {/* Quick Media Upload */}
                         <div className="flex-1 space-y-2">
                            <Label className="text-sm font-black text-gray-800">الصور والفيديوهات</Label>
                            <label className="flex items-center justify-center w-full h-16 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 transition-all cursor-pointer gap-2">
                               <Plus className="w-5 h-5 text-indigo-400" />
                               <span className="text-xs font-black text-indigo-500">أضف ملفات إضافية</span>
                               <input type="file" accept="image/*,video/*" multiple onChange={(e) => handleQuickMediaUpload(e.target.files)} className="hidden" />
                            </label>
                            
                            {/* Media Previews Horizontal Scroll */}
                             {quickMedia.files.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar h-20 pt-2">
                                  {quickMedia.previews.map((preview, idx) => (
                                    <div key={idx} className="relative aspect-square h-full rounded-lg overflow-hidden shrink-0 group border border-gray-100 bg-gray-50">
                                      {quickMedia.files[idx]?.type.startsWith('video/') ? (
                                        <video src={preview} className="w-full h-full object-cover" />
                                      ) : (
                                        <img src={preview} className="w-full h-full object-cover" />
                                      )}
                                      <button onClick={() => removeQuickMedia(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                             )}
                         </div>

                        {/* Tag Friends Mini Section */}
                        <div className="flex-1 relative border-t border-gray-100 pt-3 mt-auto">
                           <div className="flex items-center justify-between mb-2">
                              <Label className="text-base font-black text-gray-900 flex items-center gap-2">
                                 <Users className="w-4 h-4 text-indigo-600" />
                                 أصدقاء معك
                              </Label>
                              <div className="relative">
                                 <Search className="absolute right-2 top-1.5 w-4 h-4 text-gray-400" />
                                 <Input 
                                   placeholder="بحث..."
                                   value={userSearchQuery}
                                   onChange={(e) => setUserSearchQuery(e.target.value)}
                                   className="h-8 w-40 rounded-lg border-gray-100 bg-gray-50 pr-8 text-xs focus:w-60 transition-all font-bold"
                                 />
                                 
                                  {userSearchResults.length > 0 && (
                                   <div className="absolute top-full right-0 w-60 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100]">
                                      <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                         {userSearchResults.map((u) => {
                                           const isAlreadyTagged = taggedUsers.some(t => t.userId === u.clerkId);
                                           return (
                                             <button
                                               key={u.clerkId}
                                               disabled={isAlreadyTagged}
                                               onClick={() => {
                                                 setTaggedUsers([...taggedUsers, { userId: u.clerkId, fullName: u.fullName, imageUrl: u.imageUrl }]);
                                                 setUserSearchQuery("");
                                                 setUserSearchResults([]);
                                               }}
                                               className="w-full p-2 flex items-center gap-3 hover:bg-gray-50 text-right"
                                             >
                                                <img src={u.imageUrl} className="w-8 h-8 rounded-full" />
                                                <div className="flex-1 overflow-hidden">
                                                   <div className="font-bold text-sm truncate">{u.fullName}</div>
                                                </div>
                                             </button>
                                           );
                                         })}
                                      </div>
                                   </div>
                                 )}
                              </div>
                           </div>
                           
                           {taggedUsers.length > 0 && (
                             <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-2">
                                {taggedUsers.map((u) => (
                                  <div key={u.userId} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold border border-indigo-100">
                                     <img src={u.imageUrl} className="w-4 h-4 rounded-full" />
                                     <span>{u.fullName.split(' ')[0]}</span>
                                     <button onClick={() => setTaggedUsers(taggedUsers.filter(t => t.userId !== u.userId))} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                             </div>
                           )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                      <Button onClick={handleQuickSubmit} className="h-16 flex-[2] rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-black shadow-2xl shadow-indigo-100 transition-all hover:scale-[1.02]">
                        انشر البوست 🚀
                      </Button>
                      <Button variant="outline" onClick={() => setPostType(null)} className="h-16 flex-1 rounded-[1.5rem] border-gray-100 text-gray-500 font-bold hover:bg-gray-50">
                        <ArrowRight className="ml-2 w-5 h-5" />
                        رجوع
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* DETAILED POST FLOW */}
        {postType === 'detailed' && (
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
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                     <CardHeader className="bg-orange-50/50 p-10 border-b border-orange-100/50">
                        <CardTitle className="text-3xl font-black text-gray-900 flex items-center gap-4">
                           المعلومات الأساسية
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-6 md:p-8">
                        <div className="grid grid-cols-12 gap-6">
                           {/* Row 1: Title (Full Width) */}
                           <div className="col-span-12 space-y-2">
                              <div className="flex items-center justify-between">
                                  <Label className="text-lg font-black text-gray-800">عنوان الرحلة</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors">
                                        <Smile className="h-5 w-5" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden mb-2" side="top" align="end">
                                      <EmojiPicker
                                        onEmojiClick={(emojiData) => setTripData(prev => ({ ...prev, title: prev.title + emojiData.emoji }))}
                                        theme={Theme.LIGHT}
                                        autoFocusSearch={false}
                                        width={320}
                                        height={400}
                                        searchPlaceholder="بحث عن رمز..."
                                        previewConfig={{ showPreview: false }}
                                      />
                                    </PopoverContent>
                                  </Popover>
                               </div>
                              <Input 
                                placeholder="مثال: استكشاف واحة سيوة بالدراجات.." 
                                value={tripData.title}
                                onChange={e => setTripData({...tripData, title: e.target.value})}
                                className="h-12 md:h-14 rounded-2xl border-gray-100 bg-gray-50/30 focus:bg-white text-lg font-bold px-4 border-2 transition-all"
                              />
                           </div>

                           {/* Row 2: 4 Columns for Details */}
                           <div className="col-span-12 md:col-span-6 lg:col-span-3 space-y-2">
                              <Label className="text-base font-black text-gray-800">الوجهة</Label>
                              <Select value={tripData.destination} onValueChange={val => setTripData({...tripData, destination: val})}>
                                 <SelectTrigger className="h-12 md:h-14 rounded-2xl border-gray-100 bg-gray-50/30 text-base font-bold border-2">
                                    <SelectValue placeholder="اختر المدينة" />
                                 </SelectTrigger>
                                 <SelectContent className="font-cairo font-bold max-h-[300px]">
                                    {EGYPT_CITIES.map((city) => (
                                      <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>

                           <div className="col-span-12 md:col-span-6 lg:col-span-3 space-y-2">
                              <Label className="text-base font-black text-gray-800">الموسم</Label>
                              <div className="flex gap-1 h-12 md:h-14">
                                 {['winter', 'summer', 'fall', 'spring'].map((s) => (
                                   <button
                                     key={s}
                                     onClick={() => setTripData({...tripData, season: s})}
                                     className={cn(
                                       "flex-1 rounded-xl font-bold flex items-center justify-center transition-all border-2",
                                       tripData.season === s ? "bg-orange-600 border-orange-600 text-white shadow-md" : "bg-white border-gray-50 text-gray-400 hover:border-orange-100 hover:text-orange-400"
                                     )}
                                     title={s}
                                   >
                                      <span className="text-xl">{s === 'winter' ? '❄️' : s === 'summer' ? '☀️' : s === 'fall' ? '🍂' : '🌸'}</span>
                                   </button>
                                 ))}
                              </div>
                           </div>

                           <div className="col-span-12 md:col-span-6 lg:col-span-3 space-y-2">
                              <Label className="text-base font-black text-gray-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-600" /> مدة الرحلة</Label>
                              <Input placeholder="مثال: ٤ أيام" value={tripData.duration} onChange={e => setTripData({...tripData, duration: e.target.value})} className="h-12 md:h-14 rounded-2xl border-gray-100 text-base font-bold border-2" />
                           </div>

                           <div className="col-span-12 md:col-span-6 lg:col-span-3 space-y-2">
                              <Label className="text-base font-black text-gray-800 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /> الميزانية</Label>
                              <Input placeholder="مثال: ٣٠٠٠ جنيه" value={tripData.budget} onChange={e => setTripData({...tripData, budget: e.target.value})} className="h-12 md:h-14 rounded-2xl border-gray-100 text-base font-bold border-2" />
                           </div>

                           {/* Row 3: Description (Left) and Visuals (Right) */}
                           <div className="col-span-12 lg:col-span-6 space-y-2 h-full flex flex-col">
                              <div className="flex items-center justify-between">
                                <Label className="text-lg font-black text-gray-800">وصف الرحلة</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors">
                                      <Smile className="h-5 w-5" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden mb-2" side="top" align="end">
                                    <EmojiPicker
                                      onEmojiClick={(emojiData) => setTripData(prev => ({ ...prev, description: prev.description + emojiData.emoji }))}
                                      theme={Theme.LIGHT}
                                      autoFocusSearch={false}
                                      width={320}
                                      height={400}
                                      searchPlaceholder="بحث عن رمز..."
                                      previewConfig={{ showPreview: false }}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <Textarea 
                                placeholder="احكِ لنا قصة الرحلة، ما الذي جعلها مميزة؟" 
                                value={tripData.description}
                                onChange={e => setTripData({...tripData, description: e.target.value})}
                                className="flex-1 min-h-[150px] rounded-2xl border-gray-100 bg-gray-50/30 text-base font-medium p-6 border-2 focus:bg-white transition-all leading-relaxed resize-none"
                              />
                           </div>

                           <div className="col-span-12 lg:col-span-6 space-y-4 flex flex-col">
                              {/* Cover Image */}
                               <div className="flex-1">
                                 <Label className="text-base font-black text-gray-800 mb-2 block">صورة الغلاف</Label>
                                 {tripData.coverImageUrl ? (
                                   <div className="relative h-40 w-full rounded-2xl overflow-hidden group shadow-lg border-2 border-white">
                                      <img src={tripData.coverImageUrl} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <Button variant="destructive" onClick={() => setTripData({...tripData, coverImageUrl: "", coverImage: null})} className="rounded-full w-10 h-10 p-0 shadow-lg">
                                            <Trash2 className="w-5 h-5" />
                                         </Button>
                                      </div>
                                   </div>
                                 ) : (
                                   <label className="flex flex-col items-center justify-center h-40 w-full rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-orange-50 transition-all group">
                                      <div className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                         <ImageIcon className="w-5 h-5 text-orange-200" />
                                      </div>
                                      <span className="text-sm font-black text-gray-900">اختر صورة الغلاف</span>
                                      <input type="file" accept="image/*" onChange={(e) => handleCoverImageUpload(e.target.files)} className="hidden" />
                                   </label>
                                 )}
                               </div>

                              {/* Tag Friends Mini Section */}
                              <div className="flex-1 relative border-t border-gray-100 pt-3">
                                 <div className="flex items-center justify-between mb-2">
                                    <Label className="text-base font-black text-gray-900 flex items-center gap-2">
                                       <Users className="w-4 h-4 text-indigo-600" />
                                       أصدقاء معك
                                    </Label>
                                    <div className="relative">
                                       <Search className="absolute right-2 top-1.5 w-4 h-4 text-gray-400" />
                                       <Input 
                                         placeholder="بحث..."
                                         value={userSearchQuery}
                                         onChange={(e) => setUserSearchQuery(e.target.value)}
                                         className="h-8 w-40 rounded-lg border-gray-100 bg-gray-50 pr-8 text-xs focus:w-60 transition-all"
                                       />
                                       
                                        {userSearchResults.length > 0 && (
                                         <div className="absolute top-full right-0 w-60 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100]">
                                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                               {userSearchResults.map((u) => {
                                                 const isAlreadyTagged = taggedUsers.some(t => t.userId === u.clerkId);
                                                 return (
                                                   <button
                                                     key={u.clerkId}
                                                     disabled={isAlreadyTagged}
                                                     onClick={() => {
                                                       setTaggedUsers([...taggedUsers, { userId: u.clerkId, fullName: u.fullName, imageUrl: u.imageUrl }]);
                                                       setUserSearchQuery("");
                                                       setUserSearchResults([]);
                                                     }}
                                                     className="w-full p-2 flex items-center gap-3 hover:bg-gray-50 text-right"
                                                   >
                                                      <img src={u.imageUrl} className="w-8 h-8 rounded-full" />
                                                      <div className="flex-1 overflow-hidden">
                                                         <div className="font-bold text-sm truncate">{u.fullName}</div>
                                                      </div>
                                                   </button>
                                                 );
                                               })}
                                            </div>
                                         </div>
                                       )}
                                    </div>
                                 </div>
                                 
                                 {taggedUsers.length > 0 && (
                                   <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                      {taggedUsers.map((u) => (
                                        <div key={u.userId} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold border border-indigo-100">
                                           <img src={u.imageUrl} className="w-4 h-4 rounded-full" />
                                           <span>{u.fullName.split(' ')[0]}</span>
                                           <button onClick={() => setTaggedUsers(taggedUsers.filter(t => t.userId !== u.userId))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                        </div>
                                      ))}
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 mt-6">
                           <Button variant="outline" onClick={prevStep} className="h-14 px-8 rounded-[1.5rem] border-gray-200 font-bold text-gray-500 hover:text-gray-900">
                              السابق
                           </Button>
                           <Button onClick={nextStep} className="h-14 flex-[2] rounded-[1.5rem] bg-orange-600 hover:bg-orange-700 text-white text-lg font-black shadow-lg shadow-orange-100 transition-all hover:scale-[1.01]">
                              التالي
                              <ArrowLeft className="mr-3 w-5 h-5" />
                           </Button>
                           <Button variant="ghost" onClick={() => handleSubmit(true)} className="h-14 flex-1 rounded-[1.5rem] text-gray-400 font-bold hover:bg-emerald-50 hover:text-emerald-600">
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
                                // We need to pass a way to highlight selected location if desired, but for now simple 
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
                                                            // Logic to remove accurate item is tricky with merged array, simplified:
                                                            // We'll separate for deletion logic or just keep basic for now
                                                            // For MVP: Re-filter both arrays
                                                            if (isVideo) {
                                                              newLocs[idx].videos = newLocs[idx].videos.filter(v => v !== file);
                                                            } else {
                                                              newLocs[idx].images = newLocs[idx].images.filter(img => img !== file);
                                                            }
                                                            setLocations(newLocs);
                                                        }}
                                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white"
                                                      >
                                                         <X className="w-4 h-4" />
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
                                                   <X className="w-4 h-4" />
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
                      <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-2">رحلتك جاهزة! 🎉</h2>
                      <p className="text-gray-500 text-lg font-bold">هذه نظرة أخيرة قبل أن يراها العالم.</p>
                   </div>

                   <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white mb-8">
                      {/* Hero Section */}
                      <div className="relative h-[400px] w-full">
                         <img src={tripData.coverImageUrl} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8 lg:p-12">
                            <div className="flex flex-wrap gap-2 mb-4">
                               <Badge className="bg-orange-600 border-none text-white px-4 py-1.5 rounded-full font-bold text-base shadow-lg">{tripData.destination}</Badge>
                               <Badge className="bg-white/20 backdrop-blur-md border-none text-white px-4 py-1.5 rounded-full font-bold text-base">{tripData.season === 'winter' ? 'شتاء' : tripData.season === 'summer' ? 'صيف' : tripData.season === 'spring' ? 'ربيع' : 'خريف'}</Badge>
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-tight max-w-4xl">{tripData.title}</h1>
                            <div className="flex flex-wrap gap-6 text-white/90 font-bold text-lg lg:text-xl p-4 bg-white/10 backdrop-blur-md rounded-2xl w-fit border border-white/10">
                               <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-400" /> {tripData.duration}</span>
                               <span className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-400" /> {tripData.budget}</span>
                               <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-400" /> {locations.length} موقع</span>
                               <span className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> {taggedUsers.length}</span>
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
                                   ملخص
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                   <div className="bg-orange-50 p-4 rounded-2xl text-center border border-orange-100">
                                      <div className="text-3xl font-black text-orange-600">{days.length}</div>
                                      <div className="text-xs font-bold text-gray-500">أيام</div>
                                   </div>
                                   <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                                      <div className="text-3xl font-black text-emerald-600">{activities.length}</div>
                                      <div className="text-xs font-bold text-gray-500">نشاط</div>
                                   </div>
                                   <div className="bg-amber-50 p-4 rounded-2xl text-center border border-amber-100">
                                      <div className="text-3xl font-black text-amber-600">{foodPlaces.length}</div>
                                      <div className="text-xs font-bold text-gray-500">مطعم</div>
                                   </div>
                                   <div className="bg-blue-50 p-4 rounded-2xl text-center border border-blue-100">
                                      <div className="text-3xl font-black text-blue-600">{hotels.length}</div>
                                      <div className="text-xs font-bold text-gray-500">سكن</div>
                                   </div>
                                </div>
                             </div>
                        </div>

                        {/* Itinerary Timeline */}
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
                                                   <div className="text-xs text-gray-500 line-clamp-2">{act.description || "استكشاف المكان"}</div>
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
                                             <div className="text-xs text-gray-500">{place.type === 'restaurant' ? 'مطعم' : place.type === 'cafe' ? 'كافيه' : 'أكل شوارع'} • {place.rating} ⭐</div>
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
                                   {hotels.length > 0 ? hotels.map((place, idx) => (
                                      <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                          <div className="w-16 h-16 rounded-xl bg-white shrink-0 overflow-hidden border border-gray-200">
                                             {(place as any).image ? <img src={(place as any).image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full"><MapPin className="text-gray-300" /></div>}
                                          </div>
                                          <div>
                                             <div className="font-bold text-gray-900">{place.name}</div>
                                             <div className="text-xs text-gray-500 truncate max-w-[200px]">{place.location || "بدون عنوان"}</div>
                                          </div>
                                      </div>
                                   )) : <p className="text-gray-400 font-medium">لم يتم إضافة فنادق</p>}
                                </div>
                             </div>
                        </div>

                      </CardContent>
                      
                       <div className="p-8 lg:p-12 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row gap-6">
                           <Button onClick={() => handleSubmit(false)} className="h-16 flex-[2] rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-black shadow-2xl shadow-indigo-100 transition-all hover:scale-[1.02] flex items-center justify-center gap-3">
                              نشر الرحلة الآن 🚀
                              <Check className="w-6 h-6" />
                           </Button>
                           <Button variant="outline" onClick={prevStep} className="h-16 flex-1 rounded-[1.5rem] border-gray-200 bg-white text-gray-500 font-black text-lg hover:border-indigo-200 hover:text-indigo-600">
                              تعديل البيانات
                           </Button>
                        </div>
                   </Card>
                </div>
              )}
               </div>
           </div>
        </div>
        )}
      </main>

      <TripAIChatWidget />
      <Footer />
    </div>
  );
};

export default CreateTrip;
