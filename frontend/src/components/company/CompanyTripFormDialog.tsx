import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { API_BASE_URL } from "@/config/api";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { corporateTripsService } from "@/services/corporateTripsService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  MapPin, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Settings2, 
  Info,
  ListChecks,
  Camera,
  Layers,
  MessageSquare,
  Phone,
  ExternalLink,
  Bus,
  Hotel,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EGYPT_CITIES_LIST } from "@/lib/egypt-data";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  validateTripTitle,
  validateDescription,
  validatePrice,
  validateSeats,
  validateStartDate,
  validateReturnDate,
  validateImageFile,
} from "@/lib/validators";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

interface CompanyTripFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

const CompanyTripFormDialog = ({ open, onOpenChange, onSuccess, initialData }: CompanyTripFormDialogProps) => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  const [formData, setFormData] = useState<any>({
    title: "",
    destination: "",
    duration: "",
    price: "",
    season: "winter",
    rating: 4.5,
    shortDescription: "",
    fullDescription: "",
    difficulty: "متوسط",
    maxGroupSize: "",
    meetingLocation: "",
    startDate: "",
    endDate: "",
    images: ["", ""],
    itinerary: [{ day: 1, title: "", description: "" }],
    includedServices: [""],
    excludedServices: [""],
    transportationImages: ["", ""],
    availableSeats: "",
    isActive: true,
    bookingMethod: {
      whatsapp: true,
      phone: true,
      website: false
    },
    transportationType: "bus-48",
    seatBookings: [],
    stayDetails: []
  });
  const [openDestination, setOpenDestination] = useState(false);
  const [suggestedHotels, setSuggestedHotels] = useState<any[]>([]);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);
  const [fetchingHotels, setFetchingHotels] = useState(false);

  const calculateTransportations = (totalSeats: number) => {
    let remaining = totalSeats;
    const units: { type: string; capacity: number; count: number }[] = [];
    
    const bigBuses = Math.floor(remaining / 48);
    if (bigBuses > 0) {
      units.push({ type: 'bus-48', capacity: 48, count: bigBuses });
      remaining %= 48;
    }
    
    if (remaining > 0) {
      if (remaining > 28) {
        units.push({ type: 'bus-48', capacity: 48, count: 1 });
      } else if (remaining > 14) {
        units.push({ type: 'minibus-28', capacity: 28, count: 1 });
      } else {
        units.push({ type: 'van-14', capacity: 14, count: 1 });
      }
    }
    
    return units;
  };

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          ...initialData,
          images: initialData.images?.length > 0 ? initialData.images : ["", ""],
          itinerary: initialData.itinerary?.length > 0 ? initialData.itinerary : [{ day: 1, title: "", description: "" }],
          includedServices: initialData.includedServices?.length > 0 ? initialData.includedServices : [""],
          excludedServices: initialData.excludedServices?.length > 0 ? initialData.excludedServices : [""],
          season: initialData?.season || "winter",
          difficulty: initialData?.difficulty || "سهل",
          transportationType: initialData?.transportationType || "bus-48",
          transportations: initialData?.transportations || calculateTransportations(parseInt(initialData.availableSeats) || 0),
          seatBookings: initialData?.seatBookings || [],
          availableSeats: initialData.availableSeats || "",
          transportationImages: initialData.transportationImages?.length > 0 ? initialData.transportationImages : ["", ""],
          isActive: initialData.isActive !== undefined ? initialData.isActive : true,
          stayDetails: initialData.stayDetails || [],
        });
      } else {
        const savedDraft = localStorage.getItem("companyTripDraft");
        if (savedDraft) {
          try {
            setFormData(JSON.parse(savedDraft));
          } catch (e) {
            console.error("Failed to parse trip draft", e);
          }
        } else {
          setFormData({
            title: "",
            destination: "",
            duration: "",
            price: "",
            season: "winter",
            rating: 4.5,
            shortDescription: "",
            fullDescription: "",
            difficulty: "متوسط",
            maxGroupSize: "",
            meetingLocation: "",
            startDate: "",
            endDate: "",
            images: ["", ""],
            itinerary: [{ day: 1, title: "", description: "" }],
            includedServices: [""],
            excludedServices: [""],
            transportationImages: ["", ""],
            availableSeats: "",
            isActive: true,
            bookingMethod: {
              whatsapp: true,
              phone: true,
              website: false
            },
            transportationType: "bus-48",
            transportations: [],
            seatBookings: [],
            stayDetails: []
          });
        }
      }
      setActiveTab("basic");
    }
  }, [initialData, open]);

  useEffect(() => {
    if (open && !initialData) {
      localStorage.setItem("companyTripDraft", JSON.stringify(formData));
    }
  }, [formData, open, initialData]);

  const handleArrayChange = (field: string, index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: string, initialValue: any = "") => {
    setFormData({ ...formData, [field]: [...formData[field], initialValue] });
  };

  const removeArrayItem = (field: string, index: number) => {
    const newArray = [...formData[field]];
    newArray.splice(index, 1);
    setFormData({ ...formData, [field]: newArray });
  };

  const handleItineraryChange = (index: number, field: string, value: string) => {
    const newItinerary = [...formData.itinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    setFormData({ ...formData, itinerary: newItinerary });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number, isTransportation: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
        const imgCheck = validateImageFile(file);
        if (!imgCheck.valid) {
            toast({ title: "خطأ في الصورة", description: imgCheck.message, variant: "destructive" });
            e.target.value = "";
            return;
        }

        try {
            setLoading(true);
            const token = await getToken();
            
            const sigData = await fetch(`${API_BASE_URL}/api/trips/cloudinary-signature`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json());

            const formDataToUpload = new FormData();
            formDataToUpload.append('file', file);
            formDataToUpload.append('api_key', sigData.apiKey);
            formDataToUpload.append('timestamp', sigData.timestamp.toString());
            formDataToUpload.append('signature', sigData.signature);
            formDataToUpload.append('folder', sigData.folder);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
                { method: 'POST', body: formDataToUpload }
            );
            
            if (!response.ok) throw new Error('فشل رفع الصورة إلى Cloudinary');
            const data = await response.json();
            
            if (isTransportation) {
                handleArrayChange('transportationImages', index, data.secure_url);
            } else {
                handleArrayChange('images', index, data.secure_url);
            }
            toast({ title: "تم رفع الصورة بنجاح" });
        } catch (err) {
            console.error("Upload error", err);
            toast({ title: "خطأ في الرفع", description: "فشل رفع الصورة، يرجى المحاولة مرة أخرى", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tCheck = validateTripTitle(formData.title);
    if (!tCheck.valid) {
      toast({ title: "خطأ في العنوان", description: tCheck.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const descVal = formData.fullDescription || formData.shortDescription || "";
    const dCheck = validateDescription(descVal);
    if (!dCheck.valid) {
      toast({ title: "خطأ في الوصف", description: dCheck.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const pCheck = validatePrice(formData.price);
    if (!pCheck.valid) {
      toast({ title: "خطأ في السعر", description: pCheck.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const seatsVal = formData.availableSeats || formData.maxGroupSize || 0;
    const bookedCount = initialData ? (initialData.seatBookings?.length || 0) : 0;
    const sCheck = validateSeats(seatsVal, bookedCount);
    if (!sCheck.valid) {
      toast({ title: "خطأ في المقاعد", description: sCheck.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    if (formData.startDate) {
      const sdCheck = validateStartDate(formData.startDate);
      if (!sdCheck.valid) {
        toast({ title: "خطأ في التاريخ", description: sdCheck.message, variant: "destructive" });
        setLoading(false);
        return;
      }
    }
    if (formData.startDate && formData.endDate) {
      const rdCheck = validateReturnDate(formData.endDate, formData.startDate);
      if (!rdCheck.valid) {
        toast({ title: "خطأ في التاريخ", description: rdCheck.message, variant: "destructive" });
        setLoading(false);
        return;
      }
    }

    try {
      const token = await getToken();
      const processedData = {
        ...formData,
        slug: initialData?.slug || formData.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        images: formData.images.filter((img: string) => img.trim() !== ""),
        itinerary: formData.itinerary.filter((item: any) => item.title.trim() !== "" || item.description.trim() !== ""),
        includedServices: formData.includedServices.filter((s: string) => s.trim() !== ""),
        excludedServices: formData.excludedServices.filter((s: string) => s.trim() !== ""),
        transportationImages: formData.transportationImages.filter((img: string) => img.trim() !== ""),
        stayDetails: (formData.stayDetails || []).filter((s: any) => s.name?.trim() !== ""),
      };

      if (initialData) {
        await corporateTripsService.updateMyTrip(initialData._id, processedData, token || undefined);
        toast({ title: "تم تحديث الرحلة بنجاح", description: "تم حفظ التغييرات على بيانات الرحلة" });
      } else {
        await corporateTripsService.createMyTrip(processedData, token || undefined);
        toast({ title: "تم نشر الرحلة بنجاح", description: "ستظهر رحلتك الآن في صفحة الشركات" });
        localStorage.removeItem("companyTripDraft");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving trip:", error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || "فشل نشر الرحلة";
      toast({ title: "خطأ", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    { id: 'basic', label: 'أساسي', icon: Info },
    { id: 'details', label: 'تفاصيل', icon: ListChecks },
    { id: 'stay', label: 'الإقامة', icon: Hotel },
    { id: 'itinerary', label: 'برنامج', icon: Layers },
    { id: 'images', label: 'صور', icon: Camera },
    { id: 'settings', label: 'إعدادات', icon: Settings2 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1400px] w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden border-0 rounded-[2.5rem] shadow-2xl" dir="rtl">
        
        <DialogHeader className="px-10 pt-10 pb-6 border-b border-border bg-card shrink-0">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    {initialData ? <Settings2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                 </div>
                 <div>
                    <DialogTitle className="text-2xl font-black text-foreground font-cairo leading-none">{initialData ? "تعديل الرحلة" : "إضافة رحلة جديدة"}</DialogTitle>
                    <DialogDescription className="text-sm font-bold text-gray-400 mt-1">
                        {initialData ? "تعديل بيانات الرحلة الحالية" : "إضافة رحلة جديدة لقائمة رحلات شركتك"}
                    </DialogDescription>
                 </div>
              </div>
           </div>

           <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
              <TabsList className="bg-muted h-14 p-1.5 rounded-2xl gap-2 w-full max-w-4xl overflow-x-auto scrollbar-none">
                 {tabItems.map((tab) => (
                    <TabsTrigger 
                       key={tab.id} 
                       value={tab.id}
                       className="flex-1 h-full rounded-xl data-[state=active]:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest gap-2 transition-all"
                    >
                       <tab.icon className="w-4 h-4" />
                       {tab.label}
                    </TabsTrigger>
                 ))}
              </TabsList>
           </Tabs>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-[#FDFDFF]">
           <ScrollArea className="flex-1 px-12 py-12">
              <AnimatePresence mode="wait">
                 <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                 >
                    {activeTab === 'basic' && (
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">عنوان الرحلة *</Label>
                                <Input 
                                  className="h-14 rounded-2xl bg-card border-border shadow-sm font-bold text-foreground placeholder:text-gray-300 focus:border-indigo-500 transition-all"
                                  value={formData.title} 
                                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                                  required 
                                  placeholder="مثال: رحلة استكشاف جبال العلا"
                                />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">الوجهة (في مصر) *</Label>
                                <Popover open={openDestination} onOpenChange={setOpenDestination}>
                                   <PopoverTrigger asChild>
                                      <Button
                                         variant="outline"
                                         role="combobox"
                                         aria-expanded={openDestination}
                                         className="w-full h-14 justify-between rounded-2xl bg-card border-border shadow-sm font-bold text-foreground hover:bg-card/80 transition-all px-4"
                                      >
                                         <div className="flex items-center gap-3">
                                            <MapPin className="w-5 h-5 text-gray-300" />
                                            {formData.destination ? (
                                               <span className="text-foreground">
                                                  {EGYPT_CITIES_LIST.find(city => city.nameAr === formData.destination)?.emoji} {formData.destination}
                                               </span>
                                            ) : (
                                               <span className="text-gray-300">اختر الوجهة (مثال: شرم الشيخ، الأقصر...)</span>
                                            )}
                                         </div>
                                         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                   </PopoverTrigger>
                                   <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-2xl border-border shadow-xl overflow-hidden z-[9999]" align="start">
                                      <Command className="bg-card">
                                         <CommandInput placeholder="ابحث عن مدينة..." className="h-12 border-none focus:ring-0 font-bold" />
                                         <CommandList className="max-h-[300px]">
                                            <CommandEmpty>لم يتم العثور على المدينة.</CommandEmpty>
                                            <CommandGroup heading="المدن والمحافظات">
                                               {EGYPT_CITIES_LIST.map((city) => (
                                                  <CommandItem
                                                     key={city.nameAr}
                                                     value={city.nameAr}
                                                     onSelect={(currentValue) => {
                                                        setFormData({...formData, destination: currentValue});
                                                        setOpenDestination(false);
                                                     }}
                                                     className="flex items-center gap-3 p-3 cursor-pointer hover:bg-indigo-50 transition-colors"
                                                  >
                                                     <span className="text-lg">{city.emoji}</span>
                                                     <div className="flex flex-col">
                                                        <span className="font-bold text-foreground">{city.nameAr}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                                           {city.category === 'beach' ? 'مدينة ساحلية' : 
                                                            city.category === 'historical' ? 'مدينة تاريخية' : 
                                                            city.category === 'desert' ? 'واحة / صحراء' : 'محافظة'}
                                                        </span>
                                                     </div>
                                                     <Check
                                                        className={cn(
                                                           "mr-auto h-4 w-4 text-indigo-600",
                                                           formData.destination === city.nameAr ? "opacity-100" : "opacity-0"
                                                        )}
                                                     />
                                                  </CommandItem>
                                               ))}
                                            </CommandGroup>
                                         </CommandList>
                                      </Command>
                                   </PopoverContent>
                                </Popover>
                             </div>

                             <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">نقطة التجمع (Meeting Location) *</Label>
                                <div className="relative">
                                   <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                   <Input 
                                     className="h-14 pr-12 rounded-2xl bg-card border-border shadow-sm font-bold text-foreground placeholder:text-gray-300 focus:border-indigo-500 transition-all"
                                     value={formData.meetingLocation} 
                                     onChange={(e) => setFormData({...formData, meetingLocation: e.target.value})}
                                     required 
                                     placeholder="مثال: ميدان التحرير، أمام فندق ريتز كارلتون"
                                   />
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">تاريخ البداية</Label>
                                   <Input 
                                      type="date"
                                      className="h-14 rounded-2xl bg-card border-border shadow-sm font-bold text-foreground"
                                      value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''} 
                                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                   />
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">تاريخ النهاية</Label>
                                   <Input 
                                      type="date"
                                      className="h-14 rounded-2xl bg-card border-border shadow-sm font-bold text-foreground"
                                      value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''} 
                                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                   />
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 text-center block">المدة *</Label>
                                   <Input 
                                      className="h-14 rounded-2xl bg-card border-border shadow-sm font-bold text-foreground text-center placeholder:text-gray-300"
                                      value={formData.duration} 
                                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                      required 
                                      placeholder="3 أيام"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 text-center block">السعر *</Label>
                                   <div className="relative">
                                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                      <Input 
                                         className="h-14 pl-12 rounded-2xl bg-card border-border shadow-sm font-bold text-foreground text-center placeholder:text-gray-300"
                                         value={formData.price} 
                                         onChange={(e) => setFormData({...formData, price: e.target.value})}
                                         required 
                                         placeholder="2500 ج.م"
                                      />
                                   </div>
                                </div>
                             </div>
                          </div>
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">الموسم المفضل</Label>
                                 <Select dir="rtl" value={formData.season} onValueChange={(v) => setFormData({...formData, season: v})}>
                                   <SelectTrigger className="h-14 rounded-2xl bg-card border-border font-bold text-foreground shadow-sm">
                                      <SelectValue placeholder="اختر الموسم" />
                                   </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border shadow-xl overflow-hidden z-[9999] bg-card">
                                      {['winter', 'summer', 'fall', 'spring'].map(s => (
                                         <SelectItem key={s} value={s} className="font-bold py-3">
                                            {s === 'winter' ? 'الشتاء' : s === 'summer' ? 'الصيف' : s === 'fall' ? 'الخريف' : 'الربيع'}
                                         </SelectItem>
                                      ))}
                                   </SelectContent>
                                </Select>
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">الصعوبة</Label>
                                <Select dir="rtl" value={formData.difficulty} onValueChange={(v) => setFormData({...formData, difficulty: v})}>
                                   <SelectTrigger className="h-14 rounded-2xl bg-card border-border font-bold text-foreground shadow-sm">
                                      <SelectValue placeholder="اختر المستوى" />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-2xl border-border shadow-xl z-[9999] bg-card">
                                      {['سهل', 'متوسط', 'صعب'].map(d => <SelectItem key={d} value={d} className="font-bold py-3">{d}</SelectItem>)}
                                   </SelectContent>
                                </Select>
                             </div>

                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">عدد الركاب</Label>
                                   <Input 
                                      type="number"
                                      className="h-14 rounded-2xl bg-card border-border shadow-sm font-bold text-foreground"
                                      value={formData.maxGroupSize} 
                                      onChange={(e) => setFormData({...formData, maxGroupSize: e.target.value})}
                                      placeholder="مثال: 10"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">التقييم الافتراضي</Label>
                                   <Input 
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="5"
                                      className="h-14 rounded-2xl bg-card border-border shadow-sm font-bold text-foreground"
                                      value={formData.rating} 
                                      onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value) || 4.5})}
                                   />
                                </div>
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">المقاعد المتاحة</Label>
                                     <Input
                                         type="number"
                                         className="h-14 rounded-2xl bg-card border-border shadow-sm font-bold text-foreground"
                                         value={formData.availableSeats}
                                         onChange={(e) => {
                                             const val = parseInt(e.target.value) || 0;
                                             const transportUnits = calculateTransportations(val);
                                             const suggested = transportUnits.length > 0 ? transportUnits[0].type : 'bus-48';
                                             
                                             setFormData({
                                                 ...formData, 
                                                 availableSeats: val,
                                                 transportationType: suggested,
                                                 transportations: transportUnits
                                             });
                                         }}
                                         placeholder="مثال: 15"
                                     />
                                 </div>
                                 <div className="space-y-4">
                                     <Label className="text-sm font-black text-foreground mr-2 flex items-center gap-2">
                                         <Bus className="w-4 h-4 text-indigo-600" />
                                         وسائل النقل المخصصة
                                     </Label>
                                     
                                     {formData.transportations && formData.transportations.length > 0 ? (
                                         <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-2xl border border-border">
                                             {formData.transportations.map((unit: any, idx: number) => (
                                                 <Badge key={idx} variant="secondary" className="px-3 py-1.5 rounded-xl bg-card border-border text-indigo-700 font-black text-xs flex items-center gap-2">
                                                     <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                     {unit.count}x {
                                                         unit.type === 'bus-48' ? 'حافلة (48 مقعد)' : 
                                                         unit.type === 'minibus-28' ? 'ميني باص (28 مقعد)' : 
                                                         'ميكروباص (14 مقعد)'
                                                     }
                                                 </Badge>
                                             ))}
                                         </div>
                                     ) : (
                                         <Select 
                                             value={formData.transportationType} 
                                             onValueChange={(val: any) => {
                                                 const cap = val === 'bus-48' ? 48 : val === 'minibus-28' ? 28 : 14;
                                                 setFormData({
                                                     ...formData, 
                                                     transportationType: val,
                                                     transportations: [{ type: val, capacity: cap, count: 1 }]
                                                 });
                                             }}
                                         >
                                             <SelectTrigger className="h-14 rounded-2xl bg-card border-border shadow-sm font-bold">
                                                 <SelectValue placeholder="اختر نوع الحافلة" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                 <SelectItem value="bus-48">حافلة فاخرة (48 مقعد)</SelectItem>
                                                 <SelectItem value="minibus-28">ميني باص (28 مقعد)</SelectItem>
                                                 <SelectItem value="van-14">ميكروباص (14 مقعد)</SelectItem>
                                             </SelectContent>
                                         </Select>
                                     )}
                                     
                                     {formData.availableSeats > 48 && (
                                         <p className="text-[10px] font-bold text-amber-600 px-2">
                                             💡 تم حساب وسائل النقل تلقائياً لتغطية {formData.availableSeats} مقعد.
                                         </p>
                                     )}
                                 </div>
                             </div>

                             <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">وصف مقتضب *</Label>
                                <Textarea 
                                   className="min-h-[100px] rounded-2xl bg-card border-border shadow-sm font-bold text-foreground py-4 resize-none"
                                   value={formData.shortDescription} 
                                   onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                                   required 
                                   placeholder="نص يظهر في بطاقة المعاينة..."
                                />
                             </div>
                          </div>
                       </div>
                    )}

                    {activeTab === 'details' && (
                       <div className="space-y-8">
                          <div className="space-y-4">
                             <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">التجربة الكاملة للرحلة *</Label>
                             <Textarea 
                                className="min-h-[200px] rounded-3xl bg-card border-border shadow-sm font-bold text-foreground p-6 resize-none leading-relaxed"
                                value={formData.fullDescription} 
                                onChange={(e) => setFormData({...formData, fullDescription: e.target.value})}
                                required 
                                placeholder="اكتب تفاصيل الرحلة، ما الذي سيختبره المسافر، ولماذا هذه الرحلة مميزة..."
                             />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                   <Label className="text-sm font-black text-indigo-900 border-r-4 border-indigo-600 pr-3">المزايا والمرافق</Label>
                                   <Button type="button" variant="ghost" className="h-8 px-3 rounded-lg bg-emerald-50 text-emerald-600 font-black text-[10px]" onClick={() => addArrayItem('includedServices')}>
                                      <Plus className="w-3.5 h-3.5 ml-1" /> إضافة
                                   </Button>
                                </div>
                                <div className="space-y-3">
                                   {formData.includedServices.map((s: string, idx: number) => (
                                      <div key={idx} className="group flex gap-2">
                                         <Input 
                                            className="h-12 rounded-xl border-border shadow-sm font-bold text-muted-foreground text-sm"
                                            value={s} 
                                            onChange={(e) => handleArrayChange('includedServices', idx, e.target.value)}
                                            placeholder="إفطار، تنقلات..."
                                         />
                                         <Button type="button" variant="ghost" className="h-12 w-12 rounded-xl bg-muted text-gray-400 hover:bg-rose-50 hover:text-rose-600 p-0" onClick={() => removeArrayItem('includedServices', idx)}>
                                            <Trash2 className="w-4 h-4" />
                                         </Button>
                                      </div>
                                   ))}
                                </div>
                             </div>
                             <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                   <Label className="text-sm font-black text-rose-900 border-r-4 border-rose-600 pr-3">غير مشمول</Label>
                                   <Button type="button" variant="ghost" className="h-8 px-3 rounded-lg bg-muted text-gray-400 font-black text-[10px]" onClick={() => addArrayItem('excludedServices')}>
                                      <Plus className="w-3.5 h-3.5 ml-1" /> إضافة
                                   </Button>
                                </div>
                                <div className="space-y-3">
                                   {formData.excludedServices.map((s: string, idx: number) => (
                                      <div key={idx} className="flex gap-2 text-sm">
                                         <Input 
                                            className="h-12 rounded-xl border-border shadow-sm font-bold text-muted-foreground text-sm opacity-60"
                                            value={s} 
                                            onChange={(e) => handleArrayChange('excludedServices', idx, e.target.value)}
                                            placeholder="تأمين سفر، مشتريات..."
                                         />
                                         <Button type="button" variant="ghost" className="h-12 w-12 rounded-xl bg-muted text-gray-400 hover:bg-rose-50 hover:text-rose-600 p-0" onClick={() => removeArrayItem('excludedServices', idx)}>
                                            <Trash2 className="w-4 h-4" />
                                         </Button>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    )}

                    {activeTab === 'itinerary' && (
                       <div className="space-y-8">
                          <AnimatePresence mode="popLayout">
                             {formData.itinerary.map((day: any, idx: number) => (
                                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative bg-card border border-border rounded-3xl p-8 shadow-sm">
                                   <div className="flex items-center justify-between mb-6">
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center shadow-lg shadow-indigo-100">
                                            {idx + 1}
                                         </div>
                                         <h4 className="text-lg font-black text-foreground">أجندة اليوم</h4>
                                      </div>
                                      <Button type="button" variant="ghost" className="h-10 w-10 p-0 text-gray-300 hover:text-rose-600 hover:bg-rose-50" onClick={() => removeArrayItem('itinerary', idx)}>
                                         <Trash2 className="w-4 h-4" />
                                      </Button>
                                   </div>
                                   <div className="space-y-4">
                                      <Input 
                                         className="h-14 rounded-2xl border-border shadow-sm font-black text-foreground"
                                         value={day.title} 
                                         onChange={(e) => handleItineraryChange(idx, 'title', e.target.value)}
                                         placeholder="عنوان اليوم الرئيسي (مثال: يوم الاستكشاف الجبلي)"
                                      />
                                      <Textarea 
                                         className="min-h-[100px] rounded-2xl border-border shadow-sm font-bold text-muted-foreground resize-none"
                                         value={day.description} 
                                         onChange={(e) => handleItineraryChange(idx, 'description', e.target.value)}
                                         placeholder="صف الأنشطة وجدول المواعيد لهذا اليوم بالتفصيل..."
                                      />
                                   </div>
                                </motion.div>
                             ))}
                          </AnimatePresence>
                          <Button type="button" className="w-full h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-2 border-dashed border-indigo-200 font-black text-sm gap-2 transition-all active:scale-[0.98]" onClick={() => addArrayItem('itinerary', { day: formData.itinerary.length + 1, title: "", description: "" })}>
                             <Plus className="w-5 h-5" /> إضافة يوم جديد للبرنامج
                          </Button>
                       </div>
                    )}

                    {activeTab === 'stay' && (
                       <div className="space-y-8">
                          <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-black text-indigo-900 border-r-4 border-indigo-600 pr-3">تفاصيل الإقامة والفنادق</h4>
                              <Button
                                  type="button"
                                  disabled={fetchingHotels}
                                  onClick={async () => {
                                     if (!formData.destination) {
                                        toast({ title: "تنبيه", description: "يرجى تحديد الوجهة في التبويب الأساسي أولاً", variant: "destructive" });
                                        return;
                                     }
                                     setFetchingHotels(true);
                                     toast({ title: "جاري البحث...", description: "نبحث عن أفضل الفنادق في " + formData.destination });
                                     try {
                                        const res = await fetch(`${API_BASE_URL}/api/proxy/hotels?city=${encodeURIComponent(formData.destination)}`);
                                        const data = await res.json();
                                        if (data && data.length > 0) {
                                           const hotels = data.slice(0, 6).map((h: any) => ({
                                              name: h.name,
                                              details: `${h.rating || 'N/A'} نجوم - السعر المتوقع: ${h.price || 'غير متوفر'}\n${h.description || h.address || ''}`,
                                              images: h.photo?.images?.large?.url ? [h.photo.images.large.url] : [],
                                              selected: false
                                           }));
                                           setSuggestedHotels(hotels);
                                           setShowSuggestionsDialog(true);
                                        } else {
                                           toast({ title: "لم نجد نتائج", description: "عذراً لم نجد فنادق مقترحة، يمكنك إضافتها يدوياً", variant: "destructive" });
                                        }
                                     } catch(e) {
                                        toast({ title: "خطأ", description: "حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي للفنادق", variant: "destructive" });
                                     } finally {
                                        setFetchingHotels(false);
                                     }
                                  }}
                                  className="h-10 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-xs transition-colors gap-2"
                              >
                                  {fetchingHotels ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hotel className="w-4 h-4" />}
                                  اقتراح فنادق ذكاء اصطناعي
                              </Button>
                          </div>

                           <Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
                              <DialogContent className="max-w-2xl font-cairo rounded-[2rem]">
                                 <DialogHeader>
                                    <DialogTitle className="text-xl font-black text-indigo-900 flex items-center gap-2">
                                       <Hotel className="w-6 h-6" />
                                       اقتراحات الفنادق في {formData.destination}
                                    </DialogTitle>
                                    <DialogDescription className="text-right">اختر الفنادق التي ترغب في إضافتها لرحلتك</DialogDescription>
                                 </DialogHeader>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2">
                                    {suggestedHotels.map((hotel, idx) => (
                                       <div 
                                          key={idx} 
                                          onClick={() => {
                                             const newSuggest = [...suggestedHotels];
                                             newSuggest[idx].selected = !newSuggest[idx].selected;
                                             setSuggestedHotels(newSuggest);
                                          }}
                                          className={cn(
                                             "relative group cursor-pointer border-2 rounded-2xl p-4 transition-all duration-300",
                                             hotel.selected ? "border-indigo-500 bg-indigo-50" : "border-border hover:border-indigo-200 bg-card"
                                          )}
                                       >
                                          {hotel.selected && (
                                             <div className="absolute top-2 left-2 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                                <Check className="w-4 h-4" />
                                             </div>
                                          )}
                                          <div className="aspect-video rounded-xl bg-muted overflow-hidden mb-3">
                                             {hotel.images?.[0] ? (
                                                <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                             ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                   <ImageIcon className="w-8 h-8" />
                                                </div>
                                             )}
                                          </div>
                                          <h5 className="font-black text-indigo-950 text-sm line-clamp-1">{hotel.name}</h5>
                                          <p className="text-[10px] text-gray-500 line-clamp-2 mt-1">{hotel.details}</p>
                                       </div>
                                    ))}
                                 </div>
                                 <div className="flex gap-4 mt-6">
                                    <Button 
                                       className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black"
                                       onClick={() => {
                                          const selected = suggestedHotels.filter(h => h.selected).map(h => ({
                                             name: h.name,
                                             details: h.details,
                                             images: h.images
                                          }));
                                          if (selected.length === 0) {
                                             toast({ title: "تنبيه", description: "يرجى اختيار فندق واحد على الأقل", variant: "destructive" });
                                             return;
                                          }
                                          setFormData({...formData, stayDetails: [...(formData.stayDetails || []), ...selected]});
                                          setShowSuggestionsDialog(false);
                                          toast({ title: "تم الإضافة", description: `تمت إضافة ${selected.length} فنادق بنجاح` });
                                       }}
                                    >
                                       إضافة المختار ({suggestedHotels.filter(h => h.selected).length})
                                    </Button>
                                    <Button variant="ghost" className="h-12 px-6 rounded-xl font-bold" onClick={() => setShowSuggestionsDialog(false)}>إلغاء</Button>
                                 </div>
                              </DialogContent>
                           </Dialog>

                          <AnimatePresence mode="popLayout">
                             {(formData.stayDetails || []).map((stay: any, idx: number) => (
                                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative bg-card border border-border rounded-3xl p-8 shadow-sm">
                                   <div className="flex items-center justify-between mb-6">
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center shadow-lg shadow-blue-100">
                                            <Hotel className="w-5 h-5" />
                                         </div>
                                         <h4 className="text-lg font-black text-foreground">مكان الإقامة {idx + 1}</h4>
                                      </div>
                                      <Button type="button" variant="ghost" className="h-10 w-10 p-0 text-gray-300 hover:text-rose-600 hover:bg-rose-50" onClick={() => removeArrayItem('stayDetails', idx)}>
                                         <Trash2 className="w-4 h-4" />
                                      </Button>
                                   </div>
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                       {/* Image Management Section */}
                                       <div className="md:col-span-4 space-y-4">
                                          <div className="flex items-center justify-between">
                                             <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">صور الفندق</Label>
                                             <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                                                {stay.images?.length || 0} صور
                                             </span>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-3">
                                             <AnimatePresence mode="popLayout">
                                                {stay.images?.map((img: string, imgIdx: number) => (
                                                   <motion.div 
                                                      layout
                                                      key={imgIdx}
                                                      initial={{ opacity: 0, scale: 0.8 }}
                                                      animate={{ opacity: 1, scale: 1 }}
                                                      exit={{ opacity: 0, scale: 0.8 }}
                                                      className="relative aspect-square rounded-[1.5rem] bg-muted overflow-hidden border border-border group"
                                                   >
                                                      <img src={img} alt="" className="w-full h-full object-cover" />
                                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                         <Button 
                                                            type="button" 
                                                            variant="destructive" 
                                                            size="icon" 
                                                            className="h-8 w-8 rounded-xl shadow-lg"
                                                            onClick={() => {
                                                               const newStay = [...(formData.stayDetails || [])];
                                                               newStay[idx].images = (newStay[idx].images || []).filter((_: any, i: number) => i !== imgIdx);
                                                               setFormData({ ...formData, stayDetails: newStay });
                                                            }}
                                                         >
                                                            <Trash2 className="w-4 h-4" />
                                                         </Button>
                                                      </div>
                                                   </motion.div>
                                                ))}
                                             </AnimatePresence>

                                             {/* Add Image Button */}
                                             <button 
                                                type="button"
                                                onClick={() => document.getElementById(`hotel-images-upload-${idx}`)?.click()}
                                                className="aspect-square rounded-[1.5rem] border-2 border-dashed border-border hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 group text-muted-foreground hover:text-blue-600"
                                             >
                                                <div className="w-10 h-10 rounded-2xl bg-muted group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                                   <Camera className="w-5 h-5" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-tighter">إضافة صور</span>
                                             </button>
                                          </div>

                                          <input 
                                             id={`hotel-images-upload-${idx}`}
                                             type="file" 
                                             className="hidden" 
                                             accept="image/*"
                                             multiple
                                             onChange={async (e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (files.length === 0) return;

                                                for (const file of files) {
                                                   const validation = validateImageFile(file);
                                                   if (!validation.valid) {
                                                      toast({ title: "خطأ في الصورة", description: validation.message, variant: "destructive" });
                                                      continue;
                                                   }
                                                   
                                                   const reader = new FileReader();
                                                   reader.onloadend = () => {
                                                      const base64 = reader.result as string;
                                                      const newStay = [...(formData.stayDetails || [])];
                                                      newStay[idx].images = [...(newStay[idx].images || []), base64];
                                                      setFormData({ ...formData, stayDetails: newStay });
                                                   };
                                                   reader.readAsDataURL(file);
                                                }
                                             }}
                                          />

                                          <div className="relative group">
                                             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                                                <ImageIcon className="w-3.5 h-3.5" />
                                             </div>
                                             <Input 
                                                className="h-9 pr-9 pl-3 rounded-xl bg-muted/50 border-0 text-[10px] font-bold focus-visible:ring-1 focus-visible:ring-blue-400"
                                                placeholder="أضف رابط صورة واضغط Enter..."
                                                onKeyDown={(e) => {
                                                   if (e.key === 'Enter') {
                                                      e.preventDefault();
                                                      const input = e.currentTarget;
                                                      const url = input.value.trim();
                                                      if (url) {
                                                         const newStay = [...(formData.stayDetails || [])];
                                                         newStay[idx].images = [...(newStay[idx].images || []), url];
                                                         setFormData({ ...formData, stayDetails: newStay });
                                                         input.value = '';
                                                         toast({ title: "تمت الإضافة", description: "تمت إضافة الصورة بنجاح" });
                                                      }
                                                   }
                                                }}
                                             />
                                          </div>
                                       </div>

                                       {/* Details Section */}
                                       <div className="md:col-span-8 space-y-5">
                                          <div className="space-y-1.5">
                                             <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">اسم الفندق *</Label>
                                             <Input 
                                                className="h-12 rounded-2xl border-border shadow-sm font-black text-foreground focus:ring-2 focus:ring-blue-500/10"
                                                value={stay.name} 
                                                onChange={(e) => {
                                                   const newStay = [...(formData.stayDetails || [])];
                                                   newStay[idx] = { ...newStay[idx], name: e.target.value };
                                                   setFormData({ ...formData, stayDetails: newStay });
                                                }}
                                                placeholder="مثال: فندق هيلتون، ريكسوس..."
                                             />
                                          </div>
                                          <div className="space-y-1.5">
                                             <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">التفاصيل / المميزات</Label>
                                             <Textarea 
                                                className="min-h-[140px] rounded-2xl border-border shadow-sm font-bold text-muted-foreground resize-none text-xs leading-relaxed"
                                                value={stay.details} 
                                                onChange={(e) => {
                                                   const newStay = [...(formData.stayDetails || [])];
                                                   newStay[idx] = { ...newStay[idx], details: e.target.value };
                                                   setFormData({ ...formData, stayDetails: newStay });
                                                }}
                                                placeholder="أهم المميزات، نوع الغرفة، الوجبات، المرافق المتاحة..."
                                             />
                                          </div>
                                       </div>
                                   </div>
                                </motion.div>
                             ))}
                          </AnimatePresence>
                          <Button type="button" className="w-full h-16 rounded-[1.5rem] bg-blue-50 text-blue-600 hover:bg-blue-100 border-2 border-dashed border-blue-200 font-black text-sm gap-2 transition-all active:scale-[0.98]" onClick={() => {
                              if (!formData.stayDetails) {
                                  setFormData({...formData, stayDetails: [{ name: "", details: "", images: [] }]});
                              } else {
                                  addArrayItem('stayDetails', { name: "", details: "", images: [] });
                              }
                          }}>
                             <Plus className="w-5 h-5" /> إضافة مكان إقامة يدوي
                          </Button>
                       </div>
                    )}

                    {activeTab === 'images' && (
                       <div className="space-y-10">
                          <div>
                             <h4 className="text-sm font-black text-indigo-900 border-r-4 border-indigo-600 pr-3 mb-6">صور الرحلة العامة</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {formData.images.map((img: string, idx: number) => (
                                   <Card key={idx} className="border-2 border-dashed border-border bg-card rounded-[2rem] overflow-hidden group hover:border-indigo-500 transition-all">
                                      <CardContent className="p-0 h-64 relative">
                                         {img ? (
                                            <div className="relative h-full w-full">
                                               <img src={img} className="h-full w-full object-cover" />
                                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                  <Button type="button" variant="ghost" className="text-white hover:text-rose-500 bg-card/10 backdrop-blur-md rounded-2xl px-6 font-black" onClick={() => removeArrayItem('images', idx)}>
                                                     حذف
                                                  </Button>
                                               </div>
                                            </div>
                                         ) : (
                                            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                               <ImageIcon className="w-10 h-10 text-gray-200 mb-4" />
                                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">أضف رابط أو ارفع صورة</p>
                                               <Input 
                                                 className="h-10 rounded-xl bg-muted border-0 font-bold text-xs mb-2"
                                                 value={img} 
                                                 onChange={(e) => handleArrayChange('images', idx, e.target.value)}
                                                 placeholder="https://..."
                                               />
                                               <div className="relative w-full">
                                                   <Input 
                                                      type="file" 
                                                      className="hidden" 
                                                      id={`image-upload-${idx}`}
                                                      accept="image/*"
                                                      onChange={(e) => handleImageUpload(e, idx)}
                                                   />
                                                   <Label htmlFor={`image-upload-${idx}`} className="block w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
                                                       رفع صورة من الجهاز
                                                   </Label>
                                               </div>
                                            </div>
                                         )}
                                      </CardContent>
                                   </Card>
                                ))}
                                <button type="button" className="h-64 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-black text-sm gap-3" onClick={() => addArrayItem('images')}>
                                   <Camera className="w-8 h-8" /> إضافة صورة أخرى
                                </button>
                             </div>
                          </div>

                          <div>
                             <h4 className="text-sm font-black text-orange-900 border-r-4 border-orange-600 pr-3 mb-6">صور وسائل النقل (Transportation)</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {formData.transportationImages.map((img: string, idx: number) => (
                                   <Card key={idx} className="border-2 border-dashed border-border bg-card rounded-[2rem] overflow-hidden group hover:border-orange-500 transition-all">
                                      <CardContent className="p-0 h-64 relative">
                                         {img ? (
                                            <div className="relative h-full w-full">
                                               <img src={img} className="h-full w-full object-cover" />
                                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                  <Button type="button" variant="ghost" className="text-white hover:text-rose-500 bg-card/10 backdrop-blur-md rounded-2xl px-6 font-black" onClick={() => removeArrayItem('transportationImages', idx)}>
                                                     حذف
                                                  </Button>
                                               </div>
                                            </div>
                                         ) : (
                                            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                               <ImageIcon className="w-10 h-10 text-gray-200 mb-4" />
                                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">أضف رابط أو ارفع صورة</p>
                                               <Input 
                                                 className="h-10 rounded-xl bg-muted border-0 font-bold text-xs mb-2"
                                                 value={img} 
                                                 onChange={(e) => handleArrayChange('transportationImages', idx, e.target.value)}
                                                 placeholder="https://..."
                                               />
                                               <div className="relative w-full">
                                                   <Input 
                                                      type="file" 
                                                      className="hidden" 
                                                      id={`transportation-upload-${idx}`}
                                                      accept="image/*"
                                                      onChange={(e) => handleImageUpload(e, idx, true)}
                                                   />
                                                   <Label htmlFor={`transportation-upload-${idx}`} className="block w-full py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-orange-100 transition-colors">
                                                       رفع صورة من الجهاز
                                                   </Label>
                                               </div>
                                            </div>
                                         )}
                                      </CardContent>
                                   </Card>
                                ))}
                                <button type="button" className="h-64 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-gray-400 hover:text-orange-600 hover:border-orange-600 hover:bg-orange-50 transition-all font-black text-sm gap-3" onClick={() => addArrayItem('transportationImages')}>
                                   <Camera className="w-8 h-8" /> إضافة صورة نقل أخرى
                                </button>
                             </div>
                          </div>
                       </div>
                    )}

                    {activeTab === 'settings' && (
                       <div className="max-w-5xl mx-auto space-y-10">
                          <div className="space-y-4">
                             <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">طرق الحجز والدفع</Label>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                   { id: 'whatsapp', label: 'واتساب مباشر', icon: MessageSquare },
                                   { id: 'phone', label: 'اتصال هاتفي', icon: Phone },
                                   { id: 'website', label: 'الموقع الرسمي', icon: ExternalLink },
                                ].map((item) => (
                                   <div key={item.id} className={cn(
                                      "p-5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer",
                                      formData.bookingMethod[item.id] ? "bg-indigo-600 border-indigo-600 text-white" : "bg-card border-border text-gray-400"
                                   )} onClick={() => setFormData({...formData, bookingMethod: {...formData.bookingMethod, [item.id]: !formData.bookingMethod[item.id]}})}>
                                      <div className="flex items-center gap-4">
                                         <item.icon className="w-5 h-5" />
                                         <span className="font-black text-sm">{item.label}</span>
                                      </div>
                                      <Checkbox 
                                         checked={formData.bookingMethod[item.id]} 
                                         className="rounded-full border-white/20 data-[state=checked]:bg-card data-[state=checked]:text-indigo-600" 
                                      />
                                   </div>
                                ))}
                             </div>
                          </div>

                          <div className="pt-6 border-t border-border">
                              <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/50 border border-border">
                                 <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-2xl bg-card shadow-sm flex items-center justify-center text-indigo-600">
                                       <Layers className="w-6 h-6" />
                                    </div>
                                    <div>
                                       <h4 className="font-black text-foreground">تفعيل الرحلة</h4>
                                       <p className="text-xs font-bold text-gray-400">اجعل الرحلة مرئية للجمهور</p>
                                    </div>
                                 </div>
                                 <Checkbox 
                                    checked={formData.isActive} 
                                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                                    className="w-8 h-8 rounded-xl border-border data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                 />
                              </div>
                           </div>
                       </div>
                    )}
                 </motion.div>
              </AnimatePresence>
           </ScrollArea>

           <div className="px-10 py-8 border-t border-border bg-card flex justify-between items-center shrink-0">
              <Button type="button" variant="ghost" className="rounded-xl font-black text-sm text-gray-400" onClick={() => onOpenChange(false)}>
                 إلغاء
              </Button>
              <div className="flex gap-4">
                 <Button 
                   type="submit" 
                   disabled={loading} 
                   className="h-14 px-10 rounded-[1.25rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100 min-w-[180px] transition-all active:scale-95"
                 >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : initialData ? "حفظ التغييرات" : "نشر الرحلة"}
                 </Button>
              </div>
           </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyTripFormDialog;
