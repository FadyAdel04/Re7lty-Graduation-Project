import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Phone, MessageCircle, Globe, Star, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trip, Company } from "@/types/corporateTrips";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { bookingService, Booking } from "@/services/bookingService";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import BusSeatLayout from "@/components/company/BusSeatLayout";

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
  const [userBookingsForTrip, setUserBookingsForTrip] = useState<Booking[]>([]);
  const [bookingData, setBookingData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.emailAddresses?.[0]?.emailAddress || "",
    numberOfPeople: 1,
    // bookingDate removed from user input
    userPhone: "",
    specialRequests: "",
    selectedSeats: [] as string[]
  });

  // Fetch existing bookings for this trip
  useEffect(() => {
    const fetchExistingBookings = async () => {
      if (!user) return;
      try {
        const token = await getToken();
        const allBookings = await bookingService.getMyBookings(token || undefined);
        const filtered = allBookings.filter(b => b.tripId === (trip._id || trip.id));
        setUserBookingsForTrip(filtered);
      } catch (error) {
        console.error("Error fetching trip bookings:", error);
      }
    };
    fetchExistingBookings();
  }, [user, trip._id, trip.id]);

  // Update form if user data loads later
  useEffect(() => {
    if (user) {
      setBookingData(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || "",
        lastName: prev.lastName || user.lastName || "",
        email: prev.email || user.emailAddresses?.[0]?.emailAddress || "",
        selectedSeats: prev.selectedSeats || []
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

  // Calculate available seats
  const totalSeats = trip.transportationType === 'minibus-28' ? 28 : trip.transportationType === 'van-14' ? 14 : 48;
  const bookedSeatsCount = trip.seatBookings?.length || 0;
  const availableSeats = totalSeats - bookedSeatsCount;

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
       toast({
         title: "يجب تسجيل الدخول",
         description: "يرجى تسجيل الدخول لإتمام الحجز",
         variant: "destructive"
       });
       return;
    }

    // Validate available seats
    if (bookingData.numberOfPeople > availableSeats) {
        toast({
            title: "عذراً، لا توجد مقاعد كافية",
            description: `المتبقي فقط ${availableSeats} مقاعد في هذه الرحلة.`,
            variant: "destructive"
        });
        return;
    }

    // Validate selected seats (REQUIRED feature)
    if (bookingData.selectedSeats.length !== bookingData.numberOfPeople) {
        toast({
            title: "يرجى اختيار المقاعد",
            description: `يجب عليك اختيار ${bookingData.numberOfPeople} مقاعد من المخطط لإتمام الحجز. (حالياً تم اختيار ${bookingData.selectedSeats.length})`,
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
      
      const bookingPayload = {
        tripId: trip._id || trip.id,
        numberOfPeople: bookingData.numberOfPeople,
        bookingDate: trip.startDate || new Date().toISOString(),
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        userPhone: bookingData.userPhone,
        specialRequests: bookingData.specialRequests,
        selectedSeats: bookingData.selectedSeats
      };

      const result = await bookingService.createBooking(bookingPayload, token || undefined);

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
          specialRequests: "",
          selectedSeats: []
        });

        // Refresh user bookings locally
        if (user) {
           setTimeout(async () => {
             const allBookings = await bookingService.getMyBookings(token || undefined);
             const filtered = allBookings.filter(b => b.tripId === (trip._id || trip.id));
             setUserBookingsForTrip(filtered);
           }, 1000);
        }
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
            {user && userBookingsForTrip.length > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 mb-4">
                 <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-indigo-900">لديك {userBookingsForTrip.length} حجز مسبق في هذه الرحلة</span>
                 </div>
                 <div className="space-y-1.5">
                    {userBookingsForTrip.map(b => (
                       <div key={b._id} className="flex items-center justify-between text-[10px] bg-white/50 p-2 rounded-lg">
                          <span className="font-bold text-gray-700 truncate max-w-[100px]">{b.userName}</span>
                          <Badge variant="outline" className={cn(
                             "text-[8px] px-1.5 h-4 border-0",
                             b.status === 'pending' ? "bg-amber-100 text-amber-700" :
                             b.status === 'accepted' ? "bg-emerald-100 text-emerald-700" :
                             "bg-gray-100 text-gray-700"
                          )}>
                             {b.status === 'pending' ? 'بانتظار الموافقة' : b.status === 'accepted' ? 'مؤكد' : 'ملغي'}
                          </Badge>
                       </div>
                    ))}
                 </div>
              </div>
            )}
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
        <DialogContent className="sm:max-w-[600px] p-0 font-cairo overflow-hidden rounded-[2.5rem] border-0 shadow-2xl" dir="rtl">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-8 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
             <div className="relative z-10">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-3 backdrop-blur-md">
                   رحلة مميزة
                </Badge>
                <DialogTitle className="text-3xl font-black mb-2 leading-tight">حجز رحلة {trip.title}</DialogTitle>
                <DialogDescription className="text-orange-100 font-medium">
                  أكمل البيانات التالية لتأمين مقعدك في هذه المغامرة.
                </DialogDescription>
             </div>
          </div>

          <form onSubmit={handleSubmitBooking} className="flex flex-col max-h-[85dvh]">
            <div className="overflow-y-auto flex-1 p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
              
              {/* 1. Trip Summary */}
              <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                 <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <Calendar className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-900">موعد الرحلة</h4>
                    <p className="text-sm text-gray-600 font-medium">
                      {trip.startDate ? 
                        new Date(trip.startDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
                        : "يتم تحديده لاحقاً"}
                    </p>
                 </div>
              </div>

              {/* 2. Passenger Count */}
              <div className="space-y-3">
                 <Label className="text-base font-black text-gray-900">عدد المسافرين</Label>
                 <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min="1"
                      max={trip.maxGroupSize || 50}
                      value={bookingData.numberOfPeople}
                      onChange={(e) => setBookingData({ ...bookingData, numberOfPeople: parseInt(e.target.value) || 1 })}
                      className="h-14 text-center text-xl font-bold rounded-2xl border-gray-200 bg-gray-50 focus:bg-white transition-all w-32"
                    />
                    <div className="text-sm text-gray-500 font-medium">
                       شخص
                       {trip.maxGroupSize && <span className="block text-xs opacity-70">(الحد الأقصى: {trip.maxGroupSize})</span>}
                    </div>
                 </div>
              </div>

              <Separator className="bg-gray-100" />

              {/* 3. Personal Info */}
              <div className="space-y-4">
                 <Label className="text-base font-black text-gray-900">بيانات المسافر الرئيسي</Label>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-xs font-bold text-gray-500">الاسم الأول</Label>
                       <Input
                         value={bookingData.firstName}
                         onChange={(e) => setBookingData({ ...bookingData, firstName: e.target.value })}
                         className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"
                         placeholder="محمد"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-bold text-gray-500">اسم العائلة</Label>
                       <Input
                         value={bookingData.lastName}
                         onChange={(e) => setBookingData({ ...bookingData, lastName: e.target.value })}
                         className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"
                         placeholder="أحمد"
                         required
                       />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-xs font-bold text-gray-500">رقم الهاتف</Label>
                       <Input
                         type="tel"
                         dir="ltr"
                         value={bookingData.userPhone}
                         onChange={(e) => setBookingData({ ...bookingData, userPhone: e.target.value })}
                         className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all text-left"
                         placeholder="+20 1xx xxx xxxx"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-bold text-gray-500">البريد الإلكتروني</Label>
                       <Input
                         type="email"
                         dir="ltr"
                         value={bookingData.email}
                         onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                         className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all text-left"
                         placeholder="email@example.com"
                         required
                       />
                    </div>
                 </div>
              </div>

              <Separator className="bg-gray-100" />

              {/* 4. Seats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <Label className="text-base font-black text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-6 bg-indigo-500 rounded-full" />
                      اختيار المقاعد
                   </Label>
                   <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-100 border-0 font-bold">
                      مطلوب *
                   </Badge>
                </div>

                {/* Validation Message */}
                {bookingData.selectedSeats.length !== bookingData.numberOfPeople && (
                   <div className="flex items-center gap-2 text-sm font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">
                      <Star className="w-4 h-4 fill-red-500" />
                      يرجى اختيار {bookingData.numberOfPeople} مقاعد من المخطط أدناه للمتابعة ({bookingData.numberOfPeople - bookingData.selectedSeats.length} متبقي)
                   </div>
                )}
                
                <div className="p-3 md:p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent opacity-50" />
                   <BusSeatLayout 
                      type={trip.transportationType || 'bus-48'} 
                      bookedSeats={trip.seatBookings || []}
                      onSelectSeats={(seats) => setBookingData(prev => ({ ...prev, selectedSeats: seats }))}
                      initialSelectedSeats={bookingData.selectedSeats}
                      maxSelection={bookingData.numberOfPeople}
                      isAdmin={false}
                   />
                </div>
              </div>

              {/* 5. Special Requests */}
              <div className="space-y-2">
                 <Label className="text-sm font-bold text-gray-700">ملاحظات إضافية</Label>
                 <Textarea
                   value={bookingData.specialRequests}
                   onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                   placeholder="هل لديك أي احتياجات خاصة أو استفسارات؟"
                   className="min-h-[100px] rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all resize-none"
                 />
              </div>

            </div>

            {/* Footer Summary */}
            <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                 <div className="text-sm text-gray-500 font-medium">الإجمالي المتوقع</div>
                 <div className="text-2xl font-black text-gray-900">
                    {parseInt(trip.price.match(/\d+/)?.[0] || "0") * bookingData.numberOfPeople} <span className="text-sm font-bold text-gray-500">ج.م</span>
                 </div>
              </div>

              <div className="flex gap-3">
                 <Button
                   type="button"
                   variant="outline"
                   onClick={() => setShowBookingDialog(false)}
                   className="flex-1 h-14 rounded-2xl font-bold border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                   disabled={isSubmitting}
                 >
                   إلغاء
                 </Button>
                 <Button
                   type="submit"
                   disabled={isSubmitting}
                   className="flex-[2] h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black shadow-lg shadow-gray-200 transition-all hover:scale-[1.02]"
                 >
                   {isSubmitting ? (
                     <>
                       <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                       جاري تأكيد الحجز...
                     </>
                   ) : (
                     "تأكيد وإرسال الطلب"
                   )}
                 </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingCard;
