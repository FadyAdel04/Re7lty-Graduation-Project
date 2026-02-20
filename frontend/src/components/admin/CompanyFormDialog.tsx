import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminService } from "@/services/adminService";
import { Loader2 } from "lucide-react";
import { validateEgyptPhone, validateEmail } from "@/lib/validators";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any; // If provided, we are in edit mode
}

const GRADIENT_PRESETS = [
  "from-orange-500 to-red-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-pink-500",
  "from-yellow-500 to-orange-500",
  "from-gray-700 to-gray-900"
];

const CompanyFormDialog = ({ open, onOpenChange, onSuccess, initialData }: CompanyFormDialogProps) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
    color: GRADIENT_PRESETS[0],
    tags: "",
    contactInfo: {
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      address: ""
    }
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          description: initialData.description || "",
          logo: initialData.logo || "",
          color: initialData.color || GRADIENT_PRESETS[0],
          tags: initialData.tags ? initialData.tags.join(", ") : "",
          contactInfo: {
            phone: initialData.contactInfo?.phone || "",
            whatsapp: initialData.contactInfo?.whatsapp || "",
            email: initialData.contactInfo?.email || "",
            website: initialData.contactInfo?.website || "",
            address: initialData.contactInfo?.address || ""
          }
        });
      } else {
        // Reset form for new company
        setFormData({
          name: "",
          description: "",
          logo: "",
          color: GRADIENT_PRESETS[0],
          tags: "",
          contactInfo: {
            phone: "",
            whatsapp: "",
            email: "",
            website: "",
            address: ""
          }
        });
      }
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneCheck = validateEgyptPhone(formData.contactInfo.phone || "");
    if (!phoneCheck.valid) { alert("رقم الهاتف: " + (phoneCheck.message || "")); return; }
    const whatsappCheck = validateEgyptPhone(formData.contactInfo.whatsapp || "");
    if (!whatsappCheck.valid) { alert("رقم الواتساب: " + (whatsappCheck.message || "")); return; }
    const emailCheck = validateEmail(formData.contactInfo.email || "");
    if (!emailCheck.valid) { alert("البريد الإلكتروني: " + (emailCheck.message || "")); return; }
    setLoading(true);

    try {
      const token = await getToken();
      // Process tags
      const processedData = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean)
      };

      if (initialData) {
        await adminService.updateCompany(initialData._id, processedData, token || undefined);
      } else {
        await adminService.createCompany(processedData, token || undefined);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving company:", error);
      alert("حدث خطأ أثناء حفظ الشركة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "تعديل الشركة" : "إضافة شركة جديدة"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">المعلومات الأساسية</TabsTrigger>
              <TabsTrigger value="design">التصميم والتواصل</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الشركة *</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                  placeholder="شركة السفر والسياحة..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف الشركة *</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required 
                  placeholder="نبذة عن الشركة وخدماتها..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="logo">شعار الشركة (URL) *</Label>
                  <Input 
                    id="logo" 
                    value={formData.logo} 
                    onChange={(e) => setFormData({...formData, logo: e.target.value})}
                    required 
                    placeholder="https://..."
                  />
                  {/* Logo Preview */}
                  {formData.logo && (
                     <div className="mt-2 text-center text-xs text-gray-500">
                       <p className="mb-1">معاينة:</p>
                       <div className={`h-12 w-12 mx-auto rounded-lg bg-gradient-to-br ${formData.color} flex items-center justify-center text-white overflow-hidden shadow-sm`}>
                         <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                       </div>
                     </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags">الوسوم (مفصولة بفاصلة)</Label>
                  <Input 
                    id="tags" 
                    value={formData.tags} 
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="سفاري, بحر, عائلي..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="design" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>لون الشركة (التدرج) *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {GRADIENT_PRESETS.map((preset) => (
                    <div 
                      key={preset}
                      className={`h-12 rounded-lg bg-gradient-to-br ${preset} cursor-pointer transition-all ${formData.color === preset ? 'ring-2 ring-offset-2 ring-black' : 'hover:opacity-80'}`}
                      onClick={() => setFormData({...formData, color: preset})}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">بيانات التواصل</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input 
                      id="phone" 
                      value={formData.contactInfo.phone} 
                      onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, phone: e.target.value}})}
                      required 
                      placeholder="+966..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">واتساب *</Label>
                    <Input 
                      id="whatsapp" 
                      value={formData.contactInfo.whatsapp} 
                      onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, whatsapp: e.target.value}})}
                      required 
                      placeholder="+966..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.contactInfo.email} 
                      onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, email: e.target.value}})}
                      required 
                      placeholder="info@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">الموقع الإلكتروني (اختياري)</Label>
                    <Input 
                      id="website" 
                      value={formData.contactInfo.website} 
                      onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, website: e.target.value}})}
                      placeholder="www.company.com"
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="address">العنوان (اختياري)</Label>
                  <Input 
                    id="address" 
                    value={formData.contactInfo.address} 
                    onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, address: e.target.value}})}
                    placeholder="المدينة، الحي..."
                  />
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
              {initialData ? "حفظ التعديلات" : "إضافة الشركة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyFormDialog;
