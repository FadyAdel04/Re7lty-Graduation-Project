import { useState } from "react";
import { MapPin, Calendar, DollarSign, Image as ImageIcon, Plus, Trash2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MapboxTripEditor from "@/components/MapboxTripEditor";
import { TripLocation } from "@/components/TripMapEditor";
import LocationMediaManager from "@/components/LocationMediaManager";
import { useToast } from "@/hooks/use-toast";

const CreateTrip = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [activities, setActivities] = useState<string[]>([""]);
  
  // Step 1: Basic Info
  const [tripData, setTripData] = useState({
    title: "",
    destination: "",
    duration: "",
    budget: "",
    description: "",
    coverImage: null as File | null,
  });

  // Step 2: Map & Route
  const [locations, setLocations] = useState<TripLocation[]>([]);
  const [route, setRoute] = useState<[number, number][]>([]);

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

  const handleCoverImageUpload = (files: FileList | null) => {
    if (files && files[0]) {
      setTripData({ ...tripData, coverImage: files[0] });
    }
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
    } else if (currentStep === 2) {
      if (locations.length === 0) {
        toast({
          title: "لم يتم إضافة مواقع",
          description: "الرجاء إضافة موقع واحد على الأقل على الخريطة",
          variant: "destructive",
        });
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    // Validate all locations have names
    const invalidLocations = locations.filter(loc => !loc.name);
    if (invalidLocations.length > 0) {
      toast({
        title: "معلومات ناقصة",
        description: "الرجاء إضافة اسم لجميع المواقع",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "تم إنشاء الرحلة بنجاح!",
      description: "تمت إضافة رحلتك وسيتم نشرها قريباً",
    });
    
    console.log({
      tripData,
      activities: activities.filter(a => a),
      locations,
      route,
    });
  };

  const steps = [
    { number: 1, title: "معلومات أساسية" },
    { number: 2, title: "المسار والمواقع" },
    { number: 3, title: "الصور والفيديوهات" },
  ];

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
            <div className="flex items-center justify-between mb-4">
              {steps.map((step) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        currentStep >= step.number
                          ? 'bg-gradient-hero text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${
                      currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {step.number < 3 && (
                    <div className={`h-1 flex-1 mx-2 rounded ${
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
                {/* Title */}
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

                {/* Destination */}
                <div className="space-y-2">
                  <Label htmlFor="destination">الوجهة *</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Select value={tripData.destination} onValueChange={(value) => setTripData({ ...tripData, destination: value })}>
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

                {/* Description */}
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

                {/* Activities */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>الأنشطة والمعالم</Label>
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
                  <Label>صورة الغلاف</Label>
                  {tripData.coverImage ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img
                        src={URL.createObjectURL(tripData.coverImage)}
                        alt="Cover"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={() => setTripData({ ...tripData, coverImage: null })}
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

                {/* Actions */}
                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1">
                    حفظ كمسودة
                  </Button>
                  <Button className="flex-1" onClick={nextStep}>
                    التالي: إضافة المسار
                    <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Map & Route */}
          {currentStep === 2 && (
            <Card className="shadow-float-lg animate-slide-up">
              <CardHeader>
                <CardTitle>المسار والمواقع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <MapboxTripEditor
                  locations={locations}
                  route={route}
                  onLocationsChange={setLocations}
                  onRouteChange={setRoute}
                />

                {/* Actions */}
                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1" onClick={prevStep}>
                    <ArrowRight className="h-4 w-4 ml-2" />
                    السابق
                  </Button>
                  <Button className="flex-1" onClick={nextStep}>
                    التالي: إضافة الوسائط
                    <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Media Upload */}
          {currentStep === 3 && (
            <Card className="shadow-float-lg animate-slide-up">
              <CardHeader>
                <CardTitle>الصور والفيديوهات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <LocationMediaManager
                  locations={locations}
                  onLocationsChange={setLocations}
                />

                {/* Actions */}
                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1" onClick={prevStep}>
                    <ArrowRight className="h-4 w-4 ml-2" />
                    السابق
                  </Button>
                  <Button className="flex-1" onClick={handleSubmit}>
                    <Check className="h-4 w-4 ml-2" />
                    نشر الرحلة
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

export default CreateTrip;
