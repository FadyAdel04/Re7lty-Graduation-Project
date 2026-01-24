import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { adminService } from "@/services/adminService";
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
  Building2,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Phone
} from "lucide-react";
import { Company } from "@/types/corporateTrips";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TripFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  companies: Company[];
  initialData?: any;
}

const TripFormDialog = ({ open, onOpenChange, onSuccess, companies, initialData }: TripFormDialogProps) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  const [formData, setFormData] = useState<any>({
    title: "",
    destination: "",
    duration: "",
    price: "",
    season: "",
    rating: 4.5,
    shortDescription: "",
    fullDescription: "",
    companyId: "",
    difficulty: "متوسط",
    maxGroupSize: "",
    meetingLocation: "",
    images: ["", ""],
    itinerary: [{ day: 1, title: "", description: "" }],
    includedServices: [""],
    excludedServices: [""],
    bookingMethod: {
      whatsapp: true,
      phone: true,
      website: false
    }
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          ...initialData,
          companyId: initialData.companyId?._id || initialData.companyId,
          images: initialData.images?.length > 0 ? initialData.images : ["", ""],
          itinerary: initialData.itinerary?.length > 0 ? initialData.itinerary : [{ day: 1, title: "", description: "" }],
          includedServices: initialData.includedServices?.length > 0 ? initialData.includedServices : [""],
          excludedServices: initialData.excludedServices?.length > 0 ? initialData.excludedServices : [""],
          season: initialData.season || "",
        });
      } else {
        setFormData({
          title: "",
          destination: "",
          duration: "",
          price: "",
          season: "",
          rating: 4.5,
          shortDescription: "",
          fullDescription: "",
          companyId: "",
          difficulty: "متوسط",
          maxGroupSize: "",
          meetingLocation: "",
          images: ["", ""],
          itinerary: [{ day: 1, title: "", description: "" }],
          includedServices: [""],
          excludedServices: [""],
          bookingMethod: {
            whatsapp: true,
            phone: true,
            website: false
          }
        });
      }
      setActiveTab("basic");
    }
  }, [initialData, open]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      const processedData = {
        ...formData,
        slug: initialData?.slug || formData.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        images: formData.images.filter((img: string) => img.trim() !== ""),
        includedServices: formData.includedServices.filter((s: string) => s.trim() !== ""),
        excludedServices: formData.excludedServices.filter((s: string) => s.trim() !== ""),
      };

      if (initialData) {
        await adminService.updateTrip(initialData._id, processedData, token || undefined);
      } else {
        await adminService.createTrip(processedData, token || undefined);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving trip:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    { id: 'basic', label: 'أساسي', icon: Info },
    { id: 'details', label: 'تفاصيل', icon: ListChecks },
    { id: 'itinerary', label: 'برنامج', icon: Layers },
    { id: 'images', label: 'صور', icon: Camera },
    { id: 'settings', label: 'إعدادات', icon: Settings2 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden border-0 rounded-[2.5rem] shadow-2xl" dir="rtl">
        
        <DialogHeader className="px-10 pt-10 pb-6 border-b border-gray-100 bg-white shrink-0">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    {initialData ? <Settings2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                 </div>
                 <div>
                    <DialogTitle className="text-2xl font-black text-gray-900 font-cairo leading-none">{initialData ? "تعديل الرحلة" : "إضافة رحلة جديدة"}</DialogTitle>
                    <DialogDescription className="text-sm font-bold text-gray-400 mt-1">تعديل بيانات الرحلة والأسعار والبرنامج الزمني.</DialogDescription>
                 </div>
              </div>
           </div>

           <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
              <TabsList className="bg-gray-50 h-14 p-1.5 rounded-2xl gap-2 w-full max-w-2xl overflow-x-auto scrollbar-none">
                 {tabItems.map((tab) => (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id}
                      className="flex-1 h-full rounded-xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest gap-2 transition-all"
                    >
                       <tab.icon className="w-4 h-4" />
                       {tab.label}
                    </TabsTrigger>
                 ))}
              </TabsList>
           </Tabs>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-[#FDFDFF]">
           <ScrollArea className="flex-1 px-10 py-10">
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
                                  className="h-14 rounded-2xl bg-white border-gray-100 shadow-sm font-bold text-gray-900 placeholder:text-gray-300 focus:border-indigo-500 transition-all"
                                  value={formData.title} 
                                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                                  required 
                                  placeholder="مثال: رحلة استكشاف جبال العلا"
                                />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">الوجهة *</Label>
                                <div className="relative">
                                   <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                   <Input 
                                     className="h-14 pr-12 rounded-2xl bg-white border-gray-100 shadow-sm font-bold text-gray-900 placeholder:text-gray-300 focus:border-indigo-500 transition-all"
                                     value={formData.destination} 
                                     onChange={(e) => setFormData({...formData, destination: e.target.value})}
                                     required 
                                     placeholder="المنطقة، المدينة"
                                   />
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 text-center block">المدة *</Label>
                                   <Input 
                                      className="h-14 rounded-2xl bg-white border-gray-100 shadow-sm font-bold text-gray-900 text-center placeholder:text-gray-300"
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
                                         className="h-14 pl-12 rounded-2xl bg-white border-gray-100 shadow-sm font-bold text-gray-900 text-center placeholder:text-gray-300"
                                         value={formData.price} 
                                         onChange={(e) => setFormData({...formData, price: e.target.value})}
                                         required 
                                         placeholder="1500 ريال"
                                      />
                                   </div>
                                </div>
                             </div>
                          </div>
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">الموسم المفضل</Label>
                                <Select value={formData.season} onValueChange={(v) => setFormData({...formData, season: v})}>
                                   <SelectTrigger className="h-14 rounded-2xl bg-white border-gray-100 font-bold text-gray-900 shadow-sm">
                                      <SelectValue placeholder="اختر الموسم" />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-2xl border-gray-100 shadow-xl overflow-hidden">
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
                                <Select value={formData.difficulty} onValueChange={(v) => setFormData({...formData, difficulty: v})}>
                                   <SelectTrigger className="h-14 rounded-2xl bg-white border-gray-100 font-bold text-gray-900 shadow-sm">
                                      <SelectValue placeholder="اختر المستوى" />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                      {['سهل', 'متوسط', 'صعب'].map(d => <SelectItem key={d} value={d} className="font-bold py-3">{d}</SelectItem>)}
                                   </SelectContent>
                                </Select>
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">وصف مقتضب *</Label>
                                <Textarea 
                                   className="min-h-[100px] rounded-2xl bg-white border-gray-100 shadow-sm font-bold text-gray-900 py-4 resize-none"
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
                                className="min-h-[200px] rounded-3xl bg-white border-gray-100 shadow-sm font-bold text-gray-900 p-6 resize-none leading-relaxed"
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
                                            className="h-12 rounded-xl border-gray-100 shadow-sm font-bold text-gray-700 text-sm"
                                            value={s} 
                                            onChange={(e) => handleArrayChange('includedServices', idx, e.target.value)}
                                            placeholder="إفطار، تنقلات..."
                                         />
                                         <Button type="button" variant="ghost" className="h-12 w-12 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 p-0" onClick={() => removeArrayItem('includedServices', idx)}>
                                            <Trash2 className="w-4 h-4" />
                                         </Button>
                                      </div>
                                   ))}
                                </div>
                             </div>
                             <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                   <Label className="text-sm font-black text-rose-900 border-r-4 border-rose-600 pr-3">غير مشمول</Label>
                                   <Button type="button" variant="ghost" className="h-8 px-3 rounded-lg bg-gray-50 text-gray-400 font-black text-[10px]" onClick={() => addArrayItem('excludedServices')}>
                                      <Plus className="w-3.5 h-3.5 ml-1" /> إضافة
                                   </Button>
                                </div>
                                <div className="space-y-3">
                                   {formData.excludedServices.map((s: string, idx: number) => (
                                      <div key={idx} className="flex gap-2 text-sm">
                                         <Input 
                                            className="h-12 rounded-xl border-gray-100 shadow-sm font-bold text-gray-700 text-sm opacity-60"
                                            value={s} 
                                            onChange={(e) => handleArrayChange('excludedServices', idx, e.target.value)}
                                            placeholder="تأمين سفر، مشتريات..."
                                         />
                                         <Button type="button" variant="ghost" className="h-12 w-12 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 p-0" onClick={() => removeArrayItem('excludedServices', idx)}>
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
                                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                                   <div className="flex items-center justify-between mb-6">
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center shadow-lg shadow-indigo-100">
                                            {idx + 1}
                                         </div>
                                         <h4 className="text-lg font-black text-gray-900">أجندة اليوم</h4>
                                      </div>
                                      <Button type="button" variant="ghost" className="h-10 w-10 p-0 text-gray-300 hover:text-rose-600 hover:bg-rose-50" onClick={() => removeArrayItem('itinerary', idx)}>
                                         <Trash2 className="w-4 h-4" />
                                      </Button>
                                   </div>
                                   <div className="space-y-4">
                                      <Input 
                                         className="h-14 rounded-2xl border-gray-100 shadow-sm font-black text-gray-900"
                                         value={day.title} 
                                         onChange={(e) => handleItineraryChange(idx, 'title', e.target.value)}
                                         placeholder="عنوان اليوم الرئيسي (مثال: يوم الاستكشاف الجبلي)"
                                      />
                                      <Textarea 
                                         className="min-h-[100px] rounded-2xl border-gray-100 shadow-sm font-bold text-gray-600 resize-none"
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

                    {activeTab === 'images' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {formData.images.map((img: string, idx: number) => (
                             <Card key={idx} className="border-2 border-dashed border-gray-200 bg-white rounded-[2rem] overflow-hidden group hover:border-indigo-500 transition-all">
                                <CardContent className="p-0 h-64 relative">
                                   {img ? (
                                      <div className="relative h-full w-full">
                                         <img src={img} className="h-full w-full object-cover" />
                                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button type="button" variant="ghost" className="text-white hover:text-rose-500 bg-white/10 backdrop-blur-md rounded-2xl px-6 font-black" onClick={() => removeArrayItem('images', idx)}>
                                               حذف
                                            </Button>
                                         </div>
                                      </div>
                                   ) : (
                                      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                         <ImageIcon className="w-10 h-10 text-gray-200 mb-4" />
                                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">أدخل رابط الصورة</p>
                                         <Input 
                                           className="h-10 rounded-xl bg-gray-50 border-0 font-bold text-xs"
                                           value={img} 
                                           onChange={(e) => handleArrayChange('images', idx, e.target.value)}
                                           placeholder="https://..."
                                         />
                                      </div>
                                   )}
                                </CardContent>
                             </Card>
                          ))}
                          <button type="button" className="h-64 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-black text-sm gap-3" onClick={() => addArrayItem('images')}>
                             <Camera className="w-8 h-8" /> إضافة صورة أخرى
                          </button>
                       </div>
                    )}

                    {activeTab === 'settings' && (
                       <div className="max-w-2xl mx-auto space-y-10">
                          <div className="space-y-4">
                             <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">الشركة المنظمة *</Label>
                             <Select value={formData.companyId} onValueChange={(v) => setFormData({...formData, companyId: v})}>
                                <SelectTrigger className="h-16 rounded-[1.25rem] bg-white border-gray-100 font-bold text-gray-900 shadow-sm text-lg px-8">
                                   <div className="flex items-center gap-3">
                                      <Building2 className="w-5 h-5 text-indigo-600" />
                                      <SelectValue placeholder="اختر الشركة الشريكة" />
                                   </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl p-2">
                                   {companies.map((c: any) => (
                                      <SelectItem key={c._id} value={c._id} className="font-black text-sm py-4 rounded-xl">
                                         {c.name}
                                      </SelectItem>
                                   ))}
                                </SelectContent>
                             </Select>
                          </div>

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
                                      formData.bookingMethod[item.id] ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-100 text-gray-400"
                                   )} onClick={() => setFormData({...formData, bookingMethod: {...formData.bookingMethod, [item.id]: !formData.bookingMethod[item.id]}})}>
                                      <div className="flex items-center gap-4">
                                         <item.icon className="w-5 h-5" />
                                         <span className="font-black text-sm">{item.label}</span>
                                      </div>
                                      <Checkbox 
                                         checked={formData.bookingMethod[item.id]} 
                                         className="rounded-full border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-indigo-600" 
                                      />
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    )}
                 </motion.div>
              </AnimatePresence>
           </ScrollArea>

           <div className="px-10 py-8 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
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

export default TripFormDialog;
