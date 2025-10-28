import { useState } from "react";
import { MapPin, Calendar, DollarSign, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CreateTrip = () => {
  const [activities, setActivities] = useState<string[]>([""]);

  const addActivity = () => {
    setActivities([...activities, ""]);
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const updateActivity = (index: number, value: string) => {
    const newActivities = [...activities];
    newActivities[index] = value;
    setActivities(newActivities);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl font-bold mb-4">
              أنشئ <span className="text-gradient">رحلتك</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              شارك تجربة سفرك مع مجتمع المسافرين
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">الخطوة 1 من 3</span>
              <span className="text-sm text-muted-foreground">معلومات أساسية</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-hero w-1/3 transition-all duration-300" />
            </div>
          </div>

          <Card className="shadow-float-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle>معلومات الرحلة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الرحلة *</Label>
                <Input
                  id="title"
                  placeholder="مثال: جولة ساحلية في الإسكندرية"
                  className="text-lg"
                />
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination">الوجهة *</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Select>
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

              {/* Duration & Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">المدة *</Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="duration"
                      placeholder="٣ أيام"
                      className="pr-10"
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
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">الوصف *</Label>
                <Textarea
                  id="description"
                  placeholder="اكتب وصفاً شاملاً لرحلتك..."
                  rows={5}
                />
              </div>

              {/* Activities */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>الأنشطة والمعالم *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addActivity}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة نشاط
                  </Button>
                </div>
                
                {activities.map((activity, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={activity}
                      onChange={(e) => updateActivity(index, e.target.value)}
                      placeholder={`النشاط ${index + 1}`}
                    />
                    {activities.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeActivity(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>صورة الغلاف *</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">
                    اسحب وأفلت الصورة هنا، أو انقر للاختيار
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG حتى 10MB
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <Button variant="outline" className="flex-1">
                  حفظ كمسودة
                </Button>
                <Button className="flex-1">
                  التالي: إضافة المسار
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateTrip;
