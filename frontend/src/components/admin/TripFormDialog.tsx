import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { adminService } from "@/services/adminService";
import { Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { Company } from "@/types/corporateTrips";

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
  const [formData, setFormData] = useState<any>({
    title: "",
    destination: "",
    duration: "",
    price: "",
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
        });
      } else {
        // Reset form
        setFormData({
          title: "",
          destination: "",
          duration: "",
          price: "",
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
    }
  }, [initialData, open]);

  // Helper to handle dynamic arrays (images, services)
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

  // Itinerary helpers
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
      // Clean up data
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
      alert("حدث خطأ أثناء حفظ الرحلة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "تعديل الرحلة" : "إضافة رحلة جديدة"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 h-auto flex-wrap">
              <TabsTrigger value="basic">أساسي</TabsTrigger>
              <TabsTrigger value="details">تفاصيل</TabsTrigger>
              <TabsTrigger value="itinerary">برنامج</TabsTrigger>
              <TabsTrigger value="images">صور</TabsTrigger>
              <TabsTrigger value="settings">إعدادات</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الرحلة *</Label>
                  <Input 
                    id="title" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required 
                    placeholder="رحلة إلى العلا..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">الوجهة *</Label>
                  <Input 
                    id="destination" 
                    value={formData.destination} 
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    required 
                    placeholder="العلا، السعودية"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>المدة *</Label>
                  <Input 
                    value={formData.duration} 
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    required 
                    placeholder="3 أيام"
                  />
                </div>
                <div className="space-y-2">
                  <Label>السعر *</Label>
                  <Input 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required 
                    placeholder="1500 ريال"
                  />
                </div>
                <div className="space-y-2">
                  <Label>المستوى</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(val) => setFormData({...formData, difficulty: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="سهل">سهل</SelectItem>
                      <SelectItem value="متوسط">متوسط</SelectItem>
                      <SelectItem value="صعب">صعب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>حجم المجموعة</Label>
                  <Input 
                    type="number"
                    value={formData.maxGroupSize} 
                    onChange={(e) => setFormData({...formData, maxGroupSize: e.target.value})}
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">وصف قصير (للبطاقة) *</Label>
                <Textarea 
                  id="shortDescription" 
                  value={formData.shortDescription} 
                  onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                  required 
                  placeholder="وصف مختصر يجذب الانتباه..."
                />
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="fullDescription">الوصف الكامل *</Label>
                <Textarea 
                  id="fullDescription" 
                  value={formData.fullDescription} 
                  onChange={(e) => setFormData({...formData, fullDescription: e.target.value})}
                  required 
                  className="min-h-[150px]"
                  placeholder="تفاصيل الرحلة الكاملة..."
                />
              </div>

              <div className="space-y-2">
                <Label>نقطة التجمع *</Label>
                <Input 
                  value={formData.meetingLocation} 
                  onChange={(e) => setFormData({...formData, meetingLocation: e.target.value})}
                  required 
                  placeholder="مطار الملك خالد..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>الخدمات المشمولة</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => addArrayItem('includedServices')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.includedServices.map((service: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <Input 
                        value={service} 
                        onChange={(e) => handleArrayChange('includedServices', idx, e.target.value)}
                        placeholder="طيران، سكن..."
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('includedServices', idx)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                    <Label>الخدمات المستبعدة</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => addArrayItem('excludedServices')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.excludedServices.map((service: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <Input 
                        value={service} 
                        onChange={(e) => handleArrayChange('excludedServices', idx, e.target.value)}
                        placeholder="وجبات إضافية..."
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('excludedServices', idx)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="itinerary" className="space-y-4 pt-4">
              {formData.itinerary.map((day: any, idx: number) => (
                <div key={idx} className="border p-4 rounded-lg bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-lg font-bold text-orange-600">اليوم {idx + 1}</Label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('itinerary', idx)}>
                       <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>عنوان اليوم</Label>
                    <Input 
                      value={day.title} 
                      onChange={(e) => handleItineraryChange(idx, 'title', e.target.value)}
                      placeholder="الوصول والسكن"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تفاصيل</Label>
                    <Textarea 
                      value={day.description} 
                      onChange={(e) => handleItineraryChange(idx, 'description', e.target.value)}
                      placeholder="تفاصيل أنشطة هذا اليوم..."
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full" onClick={() => addArrayItem('itinerary', { day: formData.itinerary.length + 1, title: "", description: "" })}>
                <Plus className="h-4 w-4 mr-2" /> إضافة يوم
              </Button>
            </TabsContent>

            <TabsContent value="images" className="space-y-4 pt-4">
               <div className="space-y-4">
                 <Label>روابط الصور (URL)</Label>
                 {formData.images.map((img: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Input 
                          value={img} 
                          onChange={(e) => handleArrayChange('images', idx, e.target.value)}
                          placeholder="https://..."
                        />
                        {/* Preview */}
                        {img && (
                          <div className="h-24 w-40 rounded-lg overflow-hidden border bg-gray-100">
                             <img src={img} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          </div>
                        )}
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('images', idx)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => addArrayItem('images')}>
                    <ImageIcon className="h-4 w-4 mr-2" /> إضافة صورة أخرى
                  </Button>
               </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>الشركة المنظمة *</Label>
                 <Select 
                    value={formData.companyId} 
                    onValueChange={(val) => setFormData({...formData, companyId: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company: any) => (
                        <SelectItem key={company.id || company._id} value={company.id || company._id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              <div className="space-y-4 border p-4 rounded-lg">
                <Label>طرق الحجز المتاحة</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                     <Checkbox 
                        id="whatsapp" 
                        checked={formData.bookingMethod.whatsapp}
                        onCheckedChange={(checked) => setFormData({...formData, bookingMethod: {...formData.bookingMethod, whatsapp: checked}})}
                     />
                     <Label htmlFor="whatsapp">واتساب</Label>
                  </div>
                  <div className="flex items-center gap-2">
                     <Checkbox 
                        id="phone" 
                        checked={formData.bookingMethod.phone}
                        onCheckedChange={(checked) => setFormData({...formData, bookingMethod: {...formData.bookingMethod, phone: checked}})}
                     />
                     <Label htmlFor="phone">اتصال هاتفي</Label>
                  </div>
                  <div className="flex items-center gap-2">
                     <Checkbox 
                        id="website" 
                        checked={formData.bookingMethod.website}
                        onCheckedChange={(checked) => setFormData({...formData, bookingMethod: {...formData.bookingMethod, website: checked}})}
                     />
                     <Label htmlFor="website">الموقع الإلكتروني</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "حفظ التعديلات" : "إضافة الرحلة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TripFormDialog;
