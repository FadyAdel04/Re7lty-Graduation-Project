import { useState, useEffect, useMemo } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Phone, MessageCircle, Globe, Star, Clock, Calendar, CheckCircle2, Zap, CreditCard, Wallet, Smartphone, ShieldCheck, Users, Loader2, Check, ChevronLeft, ChevronRight } from "lucide-react";
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
import { couponService } from "@/services/couponService";
import { Tag, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import BusSeatLayout from "@/components/company/BusSeatLayout";
import { Link, useNavigate } from "react-router-dom";
import { validatePhone, validateEmail } from "@/lib/validators";

interface BookingCardProps {
  trip: Trip;
  company: Company;
  sticky?: boolean;
}

const BookingCard = ({ trip, company, sticky = false }: BookingCardProps) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userBookingsForTrip, setUserBookingsForTrip] = useState<Booking[]>([]);
  const [bookingData, setBookingData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.emailAddresses?.[0]?.emailAddress || "",
    numberOfPeople: 1,
    userPhone: "",
    specialRequests: "",
    selectedSeats: [] as string[],
    paymentMethod: "card" as "card" | "wallet" | "instapay",
    walletPhone: ""
  });
  const [allTripBookings, setAllTripBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        const tripId = trip._id || trip.id;
        if (tripId) {
          const bookings = await bookingService.getTripBookings(tripId);
          setAllTripBookings(bookings);
        }
      } catch (error) {
        console.error("Error fetching all trip bookings:", error);
      }
    };
    fetchAllBookings();
  }, [trip._id, trip.id]);

  const [currentBusIndex, setCurrentBusIndex] = useState(0);
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);

  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    code: string;
  } | null>(null);

  const handleValidateCoupon = async () => {
    const tripId = trip._id || trip.id;
    if (!couponCode?.trim() || !tripId) {
      toast({ title: "خطأ", description: "أدخل كود الخصم وتأكد من وجود الرحلة", variant: "destructive" });
      return;
    }
    setIsValidatingCoupon(true);
    try {
        const result = await couponService.validateCoupon(couponCode.trim(), String(tripId));
        if (result.success) {
            setAppliedCoupon({
                ...result,
                code: couponCode.toUpperCase()
            });
            toast({ title: "تم تطبيق الكوبون", description: "تم تحديث السعر بنجاح" });
        }
    } catch (error: any) {
        toast({ 
            title: "فشل تطبيق الكوبون", 
            description: error.response?.data?.error || "الكود غير صالح", 
            variant: "destructive" 
        });
        setAppliedCoupon(null);
    } finally {
        setIsValidatingCoupon(false);
    }
  };

  const basePrice = parseInt(trip.price.replace(/[^0-9]/g, "")) || 0;
  const subtotal = basePrice * bookingData.numberOfPeople;
  
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
       discount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
       discount = appliedCoupon.discountValue;
    }
  }
  
  const totalPrice = Math.max(0, subtotal - discount);

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
  const transportationUnits = useMemo(() => {
    const list: any[] = [];
    if (trip.transportations && trip.transportations.length > 0) {
        trip.transportations.forEach((t) => {
            for (let j = 0; j < (t.count || 1); j++) {
                list.push({ ...t, unitIndex: list.length });
            }
        });
    } else {
        const capacity = trip.transportationType === 'minibus-28' ? 28 : trip.transportationType === 'van-14' ? 14 : 48;
        list.push({ type: trip.transportationType || 'bus-48', capacity, count: 1, unitIndex: 0 });
    }
    return list;
  }, [trip.transportations, trip.transportationType]);

  const currentUnit = transportationUnits[currentBusIndex] || transportationUnits[0];

  const totalSeats = transportationUnits.reduce((acc, unit) => acc + (unit.capacity * (unit.count || 1)), 0);
  const bookedSeatsCount = trip.seatBookings?.length || 0;
  const availableSeats = Math.max(0, (trip.maxGroupSize || totalSeats) - bookedSeatsCount);

  // Filter booked seats for current bus
  const currentBookedSeats = useMemo(() => {
    const list: { seatNumber: string; passengerName: string }[] = [];
    
    // Add existing accepted seat bookings from trip model
    (trip.seatBookings || [])
        .filter(sb => (sb.busIndex || 0) === currentBusIndex)
        .forEach(sb => {
          list.push({ seatNumber: sb.seatNumber, passengerName: sb.passengerName });
        });
        
    // Add seats from all current (pending/accepted) bookings
    allTripBookings.forEach(booking => {
      if (booking.selectedSeats) {
        booking.selectedSeats.forEach(seatStr => {
          let seatNumber = seatStr;
          let busIndex = 0;
          if (seatStr.includes('-')) {
            const parts = seatStr.split('-');
            busIndex = parseInt(parts[0]) || 0;
            seatNumber = parts[1];
          }
          
          if (busIndex === currentBusIndex) {
            // Avoid duplicates
            if (!list.some(item => item.seatNumber === seatNumber)) {
              list.push({ seatNumber: seatNumber, passengerName: booking.userName });
            }
          }
        });
      }
    });
    
    return list;
  }, [trip.seatBookings, allTripBookings, currentBusIndex]);

  // Selected seats for current bus
  const currentSelectedSeats = useMemo(() => {
    return bookingData.selectedSeats
        .filter(s => s.startsWith(`${currentBusIndex}-`))
        .map(s => s.split('-')[1]);
  }, [bookingData.selectedSeats, currentBusIndex]);

  const handleSeatSelection = (seats: string[]) => {
    // Keep seats from other buses, replace seats for current bus
    const otherBusesSeats = bookingData.selectedSeats.filter(s => !s.startsWith(`${currentBusIndex}-`));
    const newCurrentSeats = seats.map(s => `${currentBusIndex}-${s}`);
    setBookingData(prev => ({ ...prev, selectedSeats: [...otherBusesSeats, ...newCurrentSeats] }));
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingStep !== 2) return;

    if (couponCode.trim() && !appliedCoupon) {
      toast({ title: "الكوبون", description: "طبّق الكوبون أو احذف الكود", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "يجب تسجيل الدخول", variant: "destructive" });
      return;
    }
    const phoneCheck = validatePhone(bookingData.userPhone);
    if (!phoneCheck.valid) {
      toast({ title: "رقم الهاتف غير صحيح", description: phoneCheck.message, variant: "destructive" });
      return;
    }
    const emailCheck = validateEmail(bookingData.email);
    if (!emailCheck.valid) {
      toast({ title: "البريد الإلكتروني غير صحيح", description: emailCheck.message, variant: "destructive" });
      return;
    }
    if (trip.startDate && new Date(trip.startDate) <= new Date()) {
      toast({ title: "انتهى موعد الرحلة", variant: "destructive" });
      return;
    }
    // Removed: check for existing bookings to allow multiple bookings per user
    if (bookingData.numberOfPeople > availableSeats) {
      toast({ title: `لا توجد مقاعد كافية (المتاح ${availableSeats})`, variant: "destructive" });
      return;
    }
    if (bookingData.selectedSeats.length !== bookingData.numberOfPeople) {
      toast({ title: `اختر ${bookingData.numberOfPeople} مقاعد (اخترت ${bookingData.selectedSeats.length})`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!trip._id) throw new Error("Trip ID is missing");

      // Step 1: Create the booking
      const bookingPayload = {
        tripId: trip._id || trip.id,
        numberOfPeople: bookingData.numberOfPeople,
        bookingDate: trip.startDate || new Date().toISOString(),
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        userPhone: bookingData.userPhone,
        specialRequests: bookingData.specialRequests,
        selectedSeats: bookingData.selectedSeats,
        couponId: appliedCoupon?.couponId,
        discountApplied: discount,
        totalPrice: totalPrice,
      };
      const result = await bookingService.createBooking(bookingPayload, token || undefined);

      if (!result.success) throw new Error("فشل إنشاء الحجز");

      const bookingId = result.booking._id;

      // Redirect to the new dedicated payment page
      toast({ title: "تم إنشاء الحجز", description: "جاري تحويلك لصفحة الدفع الآمن" });
      navigate(`/booking/${bookingId}/pay`);
    } catch (error: any) {
      console.error("Booking/Payment error:", error);
      toast({
        title: "فشل إتمام العملية",
        description: error.response?.data?.error || error.message || "حدث خطأ. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className={`border-gray-200 shadow-xl ${sticky ? 'sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar' : ''}`}>
        <CardContent className="p-4 md:p-6 space-y-6">
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

          <div className="space-y-3">
            {user && userBookingsForTrip.length > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 mb-4">
                 <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-indigo-900">لديك {userBookingsForTrip.length} حجز مسبق في هذه الرحلة</span>
                 </div>
                 <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
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
            
            <Button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white gap-2 font-bold shadow-lg"
              onClick={handleDirectBooking}
            >
              <Calendar className="h-5 w-5" />
              حجز مباشر
            </Button>

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

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold shadow-md overflow-hidden shrink-0`}>
                {company.logo.startsWith('http') ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  company.logo
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">{company.name}</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm text-gray-600">{company.rating} تقييم</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 text-sm text-gray-700">
            <p className="text-center">
              💡 <span className="font-semibold">نصيحة:</span> احجز مبكراً لضمان توفر المقاعد
            </p>
          </div>

                            <Separator className="opacity-50" />
                  <Link to={`/companies/${company.id}`}>
                    <Button variant="outline" className="w-full h-14 rounded-2xl font-black border-zinc-200 hover:bg-zinc-900 hover:text-white transition-all shadow-sm">
                      عرض ملف الشركة
                    </Button>
                  </Link>
        </CardContent>
      </Card>

      <Dialog open={showBookingDialog} onOpenChange={(open) => { setShowBookingDialog(open); if (!open) setBookingStep(1); }}>
        <DialogContent className="w-[100vw] max-w-[100vw] sm:max-w-[95vw] lg:max-w-[640px] h-[100dvh] max-h-[100dvh] sm:h-[95vh] sm:max-h-[95vh] p-0 font-cairo overflow-hidden rounded-none sm:rounded-2xl md:rounded-[2.5rem] border-0 shadow-2xl flex flex-col max-sm:left-0 max-sm:top-0 max-sm:right-0 max-sm:bottom-0 max-sm:translate-x-0 max-sm:translate-y-0 [&>*]:min-h-0" dir="rtl">
          {/* Header with stepper */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-3 md:p-4 text-white relative overflow-hidden shrink-0 border-b border-white/10">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
             <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-3">
                   <DialogTitle className="text-sm sm:text-lg font-black leading-tight truncate">تأكيد حجز: <span className="text-indigo-200">{trip.title}</span></DialogTitle>
                   <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-black shrink-0 hidden sm:inline-flex">
                      <ShieldCheck className="w-3 h-3 ml-1" /> دفع آمن
                   </Badge>
                </div>
                {/* Step indicator */}
                <div className="flex items-center gap-1 sm:gap-2">
                   {[1, 2].map((step) => (
                     <div key={step} className="flex items-center">
                        <div className={cn(
                          "flex items-center justify-center rounded-full w-8 h-8 sm:w-9 sm:h-9 text-xs font-black border-2 transition-all",
                          bookingStep === step ? "bg-white text-indigo-700 border-white" : bookingStep > step ? "bg-emerald-500/30 border-emerald-400 text-emerald-200" : "bg-white/10 border-white/30 text-white/70"
                        )}>
                          {bookingStep > step ? <Check className="w-4 h-4" /> : step}
                        </div>
                        <span className={cn("mr-1.5 sm:mr-2 text-[10px] sm:text-xs font-bold hidden sm:inline", bookingStep === step ? "text-white" : "text-white/70")}>
                          {step === 1 ? "البيانات" : "المقاعد"}
                        </span>
                        {step < 2 && <ChevronLeft className="w-4 h-4 text-white/40 -mr-0.5" />}
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <form
            onSubmit={handleSubmitBooking}
            onKeyDown={(e) => {
              if (e.key === "Enter" && bookingStep !== 2) e.preventDefault();
            }}
            className="flex-1 min-h-0 flex flex-col bg-gray-50/50 relative overflow-hidden"
          >
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-4 md:p-6 pb-40 sm:pb-36 scroll-smooth custom-scrollbar">
               
               {/* Step 1: Passenger info + number of people */}
               {bookingStep === 1 && (
                 <div className="max-w-lg mx-auto bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                          <Users className="w-4 h-4" />
                       </div>
                       <h4 className="text-base font-black text-gray-900">بيانات المسافرين وعددهم</h4>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <Label className="text-sm font-bold text-gray-600">عدد المسافرين</Label>
                       <Input
                         type="number"
                         min="1"
                         max={trip.maxGroupSize || 50}
                         value={bookingData.numberOfPeople}
                         onChange={(e) => setBookingData({ ...bookingData, numberOfPeople: parseInt(e.target.value) || 1 })}
                         className="h-11 w-20 text-center text-base font-black rounded-lg border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 touch-manipulation"
                       />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <div className="space-y-1">
                          <Label className="text-xs font-black text-gray-500">الاسم الأول</Label>
                          <Input
                            value={bookingData.firstName}
                            onChange={(e) => setBookingData({ ...bookingData, firstName: e.target.value })}
                            className="h-11 rounded-lg bg-gray-50 border-gray-100 placeholder:text-gray-400 text-sm px-3 focus:bg-white touch-manipulation"
                            placeholder="محمد"
                            required
                          />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-xs font-black text-gray-500">اسم العائلة</Label>
                          <Input
                            value={bookingData.lastName}
                            onChange={(e) => setBookingData({ ...bookingData, lastName: e.target.value })}
                            className="h-11 rounded-lg bg-gray-50 border-gray-100 placeholder:text-gray-400 text-sm px-3 focus:bg-white touch-manipulation"
                            placeholder="أحمد"
                            required
                          />
                       </div>
                    </div>
                     <div className="space-y-1">
                        <Label className="text-xs font-black text-gray-500">رقم الهاتف (مثال: 01x xxxx xxxx)</Label>
                        <Input
                          type="tel"
                          value={bookingData.userPhone}
                          onChange={(e) => {
                            let v = e.target.value.replace(/[^\d+]/g, "");
                            // Simple Egypt format: 01x xxxx xxxx
                            if (v.startsWith("01") && !v.startsWith("0100") && v.length <= 11 && !v.includes("+")) {
                               if (v.length > 3 && v.length <= 7) v = v.slice(0, 3) + " " + v.slice(3);
                               else if (v.length > 7) v = v.slice(0, 3) + " " + v.slice(3, 7) + " " + v.slice(7);
                            }
                            setBookingData({ ...bookingData, userPhone: v });
                          }}
                          className="h-11 rounded-lg bg-gray-50 border-gray-100 text-sm px-3 focus:bg-white touch-manipulation"
                          placeholder="01x xxxx xxxx"
                          required
                        />
                     </div>
                    <div className="space-y-1">
                       <Label className="text-xs font-black text-gray-500">البريد الإلكتروني</Label>
                       <Input
                         type="email"
                         inputMode="email"
                         value={bookingData.email}
                         onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                         className="h-11 rounded-lg bg-gray-50 border-gray-100 text-sm px-3 focus:bg-white touch-manipulation"
                         placeholder="example@mail.com"
                         required
                       />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-xs font-black text-gray-500">ملاحظات (اختياري)</Label>
                       <Textarea
                         value={bookingData.specialRequests}
                         onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                         className="min-h-[88px] rounded-lg bg-gray-50 border-gray-100 resize-none text-sm px-3 focus:bg-white touch-manipulation"
                         placeholder="هل تود إخبارنا بشيء؟"
                       />
                    </div>
                 </div>
               )}

               {/* Step 2: Choose seats */}
               {bookingStep === 2 && (
                 <div className="max-w-lg mx-auto bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
                    <div className="flex items-center gap-2 mb-4">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                          <Users className="w-4 h-4" />
                       </div>
                       <h4 className="text-base font-black text-gray-900">اختر مقاعدك</h4>
                    </div>
                    <p className="text-xs font-bold text-indigo-600 mb-3">اختر {bookingData.numberOfPeople} مقعد ({bookingData.selectedSeats.length} محددة)</p>
                    {transportationUnits.length > 1 && (
                       <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                          {transportationUnits.map((unit, idx) => (
                             <button
                                key={idx}
                                type="button"
                                onClick={() => setCurrentBusIndex(idx)}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border touch-manipulation",
                                  currentBusIndex === idx ? "bg-indigo-600 text-white border-indigo-700" : "bg-gray-50 text-gray-600 border-gray-200"
                                )}
                             >
                                {unit.type === 'bus-48' || unit.type === 'bus-50' ? 'حافلة' : unit.type === 'minibus-28' ? 'ميني باص' : 'ميكروباص'} {idx + 1}
                             </button>
                          ))}
                       </div>
                    )}
                    <div className="flex-1 min-h-[280px] overflow-auto flex justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-4">
                       <div className="scale-[0.75] sm:scale-90 origin-top">
                          <BusSeatLayout
                             type={currentUnit.type}
                             bookedSeats={currentBookedSeats}
                             onSelectSeats={handleSeatSelection}
                             initialSelectedSeats={currentSelectedSeats}
                             maxSelection={bookingData.numberOfPeople - (bookingData.selectedSeats.length - currentSelectedSeats.length)}
                             isAdmin={false}
                          />
                       </div>
                    </div>
                 </div>
               )}

              {/* Coupon and Summary moved to step 2 for transparency */}
               {bookingStep === 2 && (
                 <div className="max-w-lg mx-auto space-y-4 mt-6">
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                       <Label className="text-xs font-black text-indigo-600 mb-2 block">هل لديك كوبون خصم؟</Label>
                       <div className="flex gap-2">
                          <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="ادخل الكود..." className="h-10 flex-1 text-sm rounded-lg bg-white border-indigo-100" disabled={!!appliedCoupon} />
                          {appliedCoupon ? (
                             <Button type="button" variant="outline" size="sm" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="text-red-600 border-red-100 bg-white">إلغاء</Button>
                          ) : (
                             <Button type="button" size="sm" onClick={handleValidateCoupon} disabled={!couponCode || isValidatingCoupon} className="bg-indigo-600 hover:bg-indigo-700">{isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}</Button>
                          )}
                       </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                       <div className="flex justify-between border-b border-gray-50 pb-2 text-sm">
                          <span className="text-gray-500 font-bold">التكلفة (x{bookingData.numberOfPeople})</span>
                          <span className="font-black text-gray-900">{subtotal.toLocaleString()} ج.م</span>
                       </div>
                       {appliedCoupon && (
                         <div className="flex justify-between border-b border-gray-50 py-2 text-sm text-emerald-600 font-bold">
                            <span>خصم ({appliedCoupon.code})</span>
                            <span>-{discount.toLocaleString()} ج.م</span>
                         </div>
                       )}
                       <div className="flex justify-between items-center pt-3">
                          <p className="text-sm font-black text-gray-400 uppercase">الإجمالي النهائي</p>
                          <p className="text-2xl font-black text-indigo-600">{totalPrice.toLocaleString()} <span className="text-sm">ج.م</span></p>
                       </div>
                    </div>
                 </div>
               )}
            </div>

            {/* Step navigation footer - payment step required to confirm */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex items-center justify-between gap-3 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
               <Button
                 type="button"
                 variant="outline"
                 className="rounded-xl border-gray-200 gap-1 font-bold"
                 onClick={() => setBookingStep((s) => (s > 1 ? (s - 1) as 1 | 2 : 1))}
                 style={{ visibility: bookingStep === 1 ? "hidden" : "visible" }}
               >
                 <ChevronRight className="w-4 h-4" /> رجوع
               </Button>
               {bookingStep < 2 ? (
                 <Button
                   type="button"
                   className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-1 font-black"
                   onClick={() => {
                     if (bookingStep === 1) {
                       if (!bookingData.firstName?.trim() || !bookingData.lastName?.trim() || !bookingData.userPhone?.trim() || !bookingData.email?.trim()) {
                         toast({ title: "أكمل البيانات", description: "يرجى تعبئة الاسم والهاتف والبريد", variant: "destructive" });
                         return;
                       }
                       setBookingStep(2);
                     }
                   }}
                 >
                   الخطوة التالية <ChevronLeft className="w-4 h-4" />
                 </Button>
               ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 font-black min-h-[48px] px-6 gap-2"
                  >
                    {isSubmitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</>
                      : <><CreditCard className="w-4 h-4" /> تأكيد الحجز والانتقال للدفع</>
                    }
                  </Button>
               )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingCard;
