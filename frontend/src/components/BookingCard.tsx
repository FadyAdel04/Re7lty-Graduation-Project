import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Phone, MessageCircle, Globe, Star, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trip, Company } from "@/types/corporateTrips";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { bookingService } from "@/services/bookingService";
import { Loader2 } from "lucide-react";

interface BookingCardProps {
  trip: Trip;
  company: Company;
  sticky?: boolean;
}

const BookingCard = ({ trip, company, sticky = false }: BookingCardProps) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.emailAddresses?.[0]?.emailAddress || "",
    numberOfPeople: 1,
    // bookingDate removed from user input
    userPhone: "",
    specialRequests: ""
  });

  // Update form if user data loads later
  useEffect(() => {
    if (user) {
      setBookingData(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || "",
        lastName: prev.lastName || user.lastName || "",
        email: prev.email || user.emailAddresses?.[0]?.emailAddress || ""
      }));
    }
  }, [user]);

  const handleWhatsAppBooking = () => {
    const message = `مرحباً، أود حجز رحلة "${trip.title}" إلى ${trip.destination}`;
    const phoneNumber = company.contactInfo.whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePhoneCall = () => {
    window.location.href = `tel:${company.contactInfo.phone}`;
  };

  const handleWebsiteBooking = () => {
    if (company.contactInfo.website) {
      window.open(company.contactInfo.website, '_blank');
    }
  };

  const handleDirectBooking = () => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول أولاً لحجز الرحلة",
        variant: "destructive"
      });
      return;
    }
    setShowBookingDialog(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!bookingData.userPhone || !bookingData.firstName || !bookingData.lastName || !bookingData.email || bookingData.numberOfPeople < 1) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      
      // Ensure we have the MongoDB _id
      if (!trip._id) {
        throw new Error("Trip ID is missing");
      }
      
      const result = await bookingService.createBooking({
        tripId: trip._id,
        numberOfPeople: bookingData.numberOfPeople,
        bookingDate: trip.startDate || new Date().toISOString(),
        userPhone: bookingData.userPhone,
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        specialRequests: bookingData.specialRequests
      }, token || undefined);

      if (result.success) {
        toast({
          title: "تم إرسال الحجز بنجاح! 🎉",
          description: "سيتم مراجعة طلبك وإخطارك بالنتيجة قريباً",
        });
        setShowBookingDialog(false);
        setBookingData({
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.emailAddresses?.[0]?.emailAddress || "",
          numberOfPeople: 1,
          userPhone: "",
          specialRequests: ""
        });
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "فشل إرسال الحجز",
        description: error.response?.data?.error || "حدث خطأ أثناء إرسال الحجز. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className={`border-gray-200 shadow-xl ${sticky ? 'sticky top-24' : ''}`}>
        <CardContent className="p-6 space-y-6">
          {/* Price Section */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {trip.price} <span className="text-2xl text-gray-500">ج.م</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{trip.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="font-semibold">{trip.rating}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Booking Methods */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-center mb-4">احجز الآن</h4>
            
            {/* Direct Booking Button */}
            <Button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white gap-2 font-bold shadow-lg"
              onClick={handleDirectBooking}
            >
              <Calendar className="h-5 w-5" />
              حجز مباشر
            </Button>

            {trip.bookingMethod.whatsapp && (
              <Button
                className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white gap-2"
                onClick={handleWhatsAppBooking}
              >
                <MessageCircle className="h-5 w-5" />
                حجز عبر واتساب
              </Button>
            )}

            {trip.bookingMethod.phone && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-gray-300 hover:bg-gray-50 gap-2"
                onClick={handlePhoneCall}
              >
                <Phone className="h-5 w-5" />
                اتصل الآن
              </Button>
            )}

            {trip.bookingMethod.website && company.contactInfo.website && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-gray-300 hover:bg-gray-50 gap-2"
                onClick={handleWebsiteBooking}
              >
                <Globe className="h-5 w-5" />
                احجز من الموقع
              </Button>
            )}
          </div>

          <Separator />

          {/* Company Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold shadow-md overflow-hidden`}>
                {company.logo.startsWith('http') ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  company.logo
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">{company.name}</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm text-gray-600">{company.rating} تقييم</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-orange-50 rounded-xl p-4 text-sm text-gray-700">
            <p className="text-center">
              💡 <span className="font-semibold">نصيحة:</span> احجز مبكراً لضمان توفر المقاعد
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-[550px] max-h-[95vh] overflow-y-auto font-cairo" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">حجز رحلة {trip.title}</DialogTitle>
            <DialogDescription className="text-gray-600">
              املأ البيانات التالية لإرسال طلب الحجز. سيتم مراجعة طلبك وإخطارك بالنتيجة.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitBooking}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfPeople">عدد الأشخاص *</Label>
                <Input
                  id="numberOfPeople"
                  type="number"
                  min="1"
                  max={trip.maxGroupSize || 100}
                  value={bookingData.numberOfPeople}
                  onChange={(e) => setBookingData({ ...bookingData, numberOfPeople: parseInt(e.target.value) })}
                  required
                  className="h-12 rounded-xl"
                />
                {trip.maxGroupSize && (
                  <p className="text-xs text-gray-500">الحد الأقصى: {trip.maxGroupSize} شخص</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">الاسم الأول *</Label>
                  <Input
                    id="firstName"
                    value={bookingData.firstName}
                    onChange={(e) => setBookingData({ ...bookingData, firstName: e.target.value })}
                    placeholder="الاسم الأول"
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">اسم العائلة *</Label>
                  <Input
                    id="lastName"
                    value={bookingData.lastName}
                    onChange={(e) => setBookingData({ ...bookingData, lastName: e.target.value })}
                    placeholder="اسم العائلة"
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={bookingData.email}
                  onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                  placeholder="example@email.com"
                  required
                  className="h-12 rounded-xl"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>تاريخ الرحلة</Label>
                <div className="h-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center px-4 text-gray-700 font-medium">
                  <Calendar className="w-5 h-5 ml-2 text-gray-500" />
                  {trip.startDate ? 
                    new Date(trip.startDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
                    : "يتم تحديده لاحقاً مع الشركة"}
                </div>
                <p className="text-xs text-orange-600 font-semibold mt-1">* يرجى التأكد من مناسبة التاريخ قبل تأكيد الحجز</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userPhone">رقم الهاتف *</Label>
                <Input
                  id="userPhone"
                  type="tel"
                  value={bookingData.userPhone}
                  onChange={(e) => setBookingData({ ...bookingData, userPhone: e.target.value })}
                  placeholder="+20 123 456 7890"
                  required
                  className="h-12 rounded-xl"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequests">طلبات خاصة (اختياري)</Label>
                <Textarea
                  id="specialRequests"
                  value={bookingData.specialRequests}
                  onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                  placeholder="مثل: وجبات خاصة، احتياجات طبية، إلخ..."
                  className="min-h-[100px] rounded-xl"
                />
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">السعر للفرد:</span>
                  <span className="font-semibold">{trip.price} ج.م</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">عدد الأشخاص:</span>
                  <span className="font-semibold">{bookingData.numberOfPeople}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>الإجمالي المتوقع:</span>
                  <span className="text-orange-600">
                    {parseInt(trip.price.match(/\d+/)?.[0] || "0") * bookingData.numberOfPeople} ج.م
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBookingDialog(false)}
                className="rounded-xl h-11"
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  "تأكيد الحجز"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingCard;
