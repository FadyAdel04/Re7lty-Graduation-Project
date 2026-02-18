import { useState, useEffect, useMemo } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Phone, MessageCircle, Globe, Star, Clock, Calendar, CheckCircle2, Zap, CreditCard, Wallet, Smartphone, ShieldCheck, Users, Loader2, Check } from "lucide-react";
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
import { Link } from "react-router-dom";

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
    userPhone: "",
    specialRequests: "",
    selectedSeats: [] as string[],
    paymentMethod: "credit_card" as "credit_card" | "wallet",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    walletNumber: ""
  });

  const [currentBusIndex, setCurrentBusIndex] = useState(0);

  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    code: string;
  } | null>(null);

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    try {
        const result = await couponService.validateCoupon(couponCode, (trip._id || trip.id)!);
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
    return (trip.seatBookings || [])
        .filter(sb => (sb.busIndex || 0) === currentBusIndex)
        .map(sb => ({ seatNumber: sb.seatNumber, passengerName: sb.passengerName }));
  }, [trip.seatBookings, currentBusIndex]);

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
        selectedSeats: bookingData.selectedSeats,
        couponId: appliedCoupon?.couponId,
        discountApplied: discount,
        totalPrice: totalPrice,
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
          selectedSeats: [],
          paymentMethod: 'credit_card',
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          walletNumber: ""
        });

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

      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1150px] h-[95vh] p-0 font-cairo overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border-0 shadow-2xl flex flex-col" dir="rtl">
          {/* Minimal Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-3 md:p-4 text-white relative overflow-hidden shrink-0 border-b border-white/10">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
             <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                      <Calendar className="w-4 h-4 text-white" />
                   </div>
                   <div>
                      <DialogTitle className="text-lg md:text-xl font-black leading-tight">تأكيد حجز: <span className="text-indigo-200">{trip.title}</span></DialogTitle>
                      <p className="text-[10px] text-indigo-100/70 font-bold">بوابة الحجز الذكي - رِحلتـي</p>
                   </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                   <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-black">
                      <ShieldCheck className="w-3 h-3 ml-1" /> دفع آمن 100%
                   </Badge>
                </div>
             </div>
          </div>

          <form onSubmit={handleSubmitBooking} className="flex-1 overflow-hidden flex flex-col bg-gray-50/50">
            <div className="p-3 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
               
               {/* 1. Trip & Seat Details (4/12 -> 1/3) */}
               <div className="flex flex-col h-full min-h-0 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 shrink-0">
                     <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <Users className="w-4 h-4" />
                     </div>
                     <h4 className="text-sm font-black text-gray-900">عدد المسافرين والمقاعد</h4>
                  </div>

                  <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
                     <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100 shrink-0">
                        <Input
                          type="number"
                          min="1"
                          max={trip.maxGroupSize || 50}
                          value={bookingData.numberOfPeople}
                          onChange={(e) => setBookingData({ ...bookingData, numberOfPeople: parseInt(e.target.value) || 1 })}
                          className="h-8 text-center text-sm font-black rounded-lg border-gray-200 bg-white focus:ring-1 focus:ring-indigo-500 w-16"
                        />
                        <Label className="text-[10px] font-bold text-gray-500">مسافر في هذه الرحلة</Label>
                     </div>

                      <div className="relative flex-1 min-h-0 bg-gray-50/30 rounded-xl border border-dashed border-gray-200 flex flex-col items-center">
                         <div className="w-full p-2 border-b border-gray-100 bg-white/50 shrink-0">
                            {transportationUnits.length > 1 && (
                               <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                  {transportationUnits.map((unit, idx) => (
                                     <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setCurrentBusIndex(idx)}
                                        className={cn(
                                           "px-3 py-1.5 rounded-lg text-[9px] font-black whitespace-nowrap transition-all border",
                                           currentBusIndex === idx 
                                              ? "bg-indigo-600 text-white border-indigo-700 shadow-sm" 
                                              : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                                        )}
                                     >
                                        {unit.type === 'bus-48' || unit.type === 'bus-50' ? 'حافلة' : unit.type === 'minibus-28' ? 'ميني باص' : 'ميكروباص'} {idx + 1}
                                     </button>
                                  ))}
                               </div>
                            )}
                         </div>
                         <p className="text-[9px] font-black text-indigo-400 mt-2 z-10 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                            اختر {bookingData.numberOfPeople} مقاعد ({bookingData.selectedSeats.length} محددة)
                         </p>
                         <div className="flex-1 w-full mt-2 overflow-y-auto custom-scrollbar min-h-0">
                            <div className="flex items-start justify-center p-4">
                               <div className="scale-[0.85] md:scale-100 transition-transform">
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
                      </div>
                  </div>
               </div>

               {/* 2. Personal Information (4/12 -> 1/3) */}
               <div className="flex flex-col h-full min-h-0 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 shrink-0">
                     <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                        <Smartphone className="w-4 h-4" />
                     </div>
                     <h4 className="text-sm font-black text-gray-900">بيانات التواصل</h4>
                  </div>

                  <div className="space-y-3 flex-1 overflow-hidden">
                     <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                           <Label className="text-[10px] font-black text-gray-400 mr-1">الاسم الأول</Label>
                           <Input
                             value={bookingData.firstName}
                             onChange={(e) => setBookingData({ ...bookingData, firstName: e.target.value })}
                             className="h-9 rounded-lg bg-gray-50 border-gray-100 placeholder:text-gray-300 text-xs px-3 focus:bg-white transition-colors"
                             placeholder="محمد"
                             required
                           />
                        </div>
                        <div className="space-y-1">
                           <Label className="text-[10px] font-black text-gray-400 mr-1">اسم العائلة</Label>
                           <Input
                             value={bookingData.lastName}
                             onChange={(e) => setBookingData({ ...bookingData, lastName: e.target.value })}
                             className="h-9 rounded-lg bg-gray-50 border-gray-100 placeholder:text-gray-300 text-xs px-3 focus:bg-white transition-colors"
                             placeholder="أحمد"
                             required
                           />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[10px] font-black text-gray-400 mr-1">رقم الهاتف</Label>
                        <Input
                          type="tel"
                          value={bookingData.userPhone}
                          onChange={(e) => setBookingData({ ...bookingData, userPhone: e.target.value })}
                          className="h-9 rounded-lg bg-gray-50 border-gray-100 text-xs px-3 focus:bg-white transition-colors"
                          placeholder="01xxxxxxxxx"
                          required
                        />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[10px] font-black text-gray-400 mr-1">البريد الإلكتروني</Label>
                        <Input
                          type="email"
                          value={bookingData.email}
                          onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                          className="h-9 rounded-lg bg-gray-50 border-gray-100 text-xs px-3 focus:bg-white transition-colors"
                          placeholder="example@mail.com"
                          required
                        />
                     </div>
                     <div className="space-y-1 flex-1 flex flex-col min-h-0">
                        <Label className="text-[10px] font-black text-gray-400 mr-1">ملاحظات إضافية (اختياري)</Label>
                        <Textarea
                          value={bookingData.specialRequests}
                          onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                          className="flex-1 rounded-lg bg-gray-50 border-gray-100 resize-none font-cairo text-xs px-3 focus:bg-white transition-colors"
                          placeholder="هل تود إخبارنا بشيء؟"
                        />
                     </div>
                  </div>
               </div>

               {/* 3. Payment Simulation (4/12 -> 1/3) */}
               <div className="flex flex-col h-full min-h-0">
                  <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex-1 flex flex-col min-h-0">
                     <div className="flex items-center gap-2 mb-3 shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                           <CreditCard className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-black text-gray-900">بوابة الدفع التجريبية</h4>
                     </div>

                     <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
                        <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3 relative overflow-hidden group shadow-lg shrink-0">
                           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:rotate-12 transition-transform">
                              <Zap className="w-12 h-12 text-indigo-400" />
                           </div>

                           <div className="flex p-1 bg-white/5 rounded-lg relative z-10 border border-white/10">
                              <button
                                type="button"
                                onClick={() => setBookingData({...bookingData, paymentMethod: 'credit_card'})}
                                className={cn(
                                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all font-black text-[9px]",
                                  bookingData.paymentMethod === 'credit_card' ? "bg-white text-slate-900 shadow-md" : "text-gray-400 hover:text-white"
                                )}
                              >
                                 <CreditCard className="w-2.5 h-2.5" /> بطاقة بنكية
                              </button>
                              <button
                                type="button"
                                onClick={() => setBookingData({...bookingData, paymentMethod: 'wallet'})}
                                className={cn(
                                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all font-black text-[9px]",
                                  bookingData.paymentMethod === 'wallet' ? "bg-white text-slate-900 shadow-md" : "text-gray-400 hover:text-white"
                                )}
                              >
                                 <Wallet className="w-2.5 h-2.5" /> محفظة الكترونية
                              </button>
                           </div>

                           <div className="space-y-2 relative z-10">
                              {bookingData.paymentMethod === 'credit_card' ? (
                                 <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="space-y-0.5">
                                       <Label className="text-[8px] uppercase font-black text-gray-500 mr-1">Card Number</Label>
                                       <Input 
                                          placeholder="0000 0000 0000 0000" 
                                          className="bg-white/5 border-white/10 text-white h-8 rounded-lg tracking-widest placeholder:opacity-20 text-[10px] px-3 focus:border-indigo-500/50"
                                          value={bookingData.cardNumber}
                                          onChange={(e) => setBookingData({...bookingData, cardNumber: e.target.value})}
                                       />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                       <div className="space-y-0.5">
                                          <Label className="text-[8px] uppercase font-black text-gray-500 mr-1">Expiry</Label>
                                          <Input 
                                             placeholder="MM/YY" 
                                             className="bg-white/5 border-white/10 text-white h-8 rounded-lg text-center text-[10px] focus:border-indigo-500/50"
                                             value={bookingData.expiryDate}
                                             onChange={(e) => setBookingData({...bookingData, expiryDate: e.target.value})}
                                          />
                                       </div>
                                       <div className="space-y-0.5">
                                          <Label className="text-[8px] uppercase font-black text-gray-500 mr-1">CVV</Label>
                                          <Input 
                                             placeholder="***" 
                                             className="bg-white/5 border-white/10 text-white h-8 rounded-lg text-center text-[10px] focus:border-indigo-500/50"
                                             value={bookingData.cvv}
                                             onChange={(e) => setBookingData({...bookingData, cvv: e.target.value})}
                                          />
                                       </div>
                                    </div>
                                 </div>
                              ) : (
                                 <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="space-y-0.5">
                                       <Label className="text-[8px] uppercase font-black text-gray-500 mr-1">Wallet Phone Number</Label>
                                       <div className="relative">
                                          <Input 
                                             placeholder="01x xxxx xxxx" 
                                             className="bg-white/5 border-white/10 text-white h-10 rounded-lg pr-8 text-sm font-black focus:border-indigo-500/50"
                                             value={bookingData.walletNumber}
                                             onChange={(e) => setBookingData({...bookingData, walletNumber: e.target.value})}
                                          />
                                          <Wallet className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
                                       </div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                                       <p className="text-[8px] font-bold text-gray-400 flex items-center justify-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> سيصلك تأكيد فوري عبر الرسائل
                                       </p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>

                         <div className="mt-auto space-y-3 shrink-0">
                           {/* Coupon Input Section */}
                           <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                               <Label className="text-[10px] font-black text-gray-400 mb-2 block text-right">هل لديك كوبون خصم؟</Label>
                               <div className="flex gap-2">
                                  <div className="relative flex-1">
                                     <Input 
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="ادخل الكود..."
                                        className="h-9 pr-8 text-xs font-black rounded-lg border-gray-200 focus:bg-white text-right"
                                        disabled={!!appliedCoupon}
                                     />
                                     <Ticket className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                  </div>
                                  {appliedCoupon ? (
                                     <Button 
                                        type="button"
                                        variant="outline" 
                                        onClick={() => {setAppliedCoupon(null); setCouponCode("");}}
                                        className="h-9 px-3 rounded-lg border-red-100 text-red-600 hover:bg-red-50 text-[10px] font-bold"
                                     >
                                        إلغاء
                                     </Button>
                                  ) : (
                                     <Button 
                                        type="button"
                                        onClick={handleValidateCoupon}
                                        disabled={!couponCode || isValidatingCoupon}
                                        className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-sm"
                                     >
                                        {isValidatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "تطبيق"}
                                     </Button>
                                  )}
                               </div>
                           </div>

                           <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-2">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                 <span className="text-[10px] font-bold text-gray-500">التكلفة (x{bookingData.numberOfPeople})</span>
                                 <span className="text-xs font-black text-gray-900">{subtotal.toLocaleString()} ج.م</span>
                              </div>
                              
                              {appliedCoupon && (
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2 border-dashed">
                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                        <Tag className="w-3 h-3" />
                                        <span className="text-[10px] font-bold">خصم الكوبون ({appliedCoupon.code})</span>
                                    </div>
                                    <span className="text-xs font-black text-emerald-600">-{discount.toLocaleString()} ج.م</span>
                                </div>
                              )}

                              <div className="text-center pt-1">
                                 <p className="text-[9px] font-black text-indigo-500 uppercase mb-0.5">إجمالي المبلغ المستحق</p>
                                 <p className="text-2xl font-black text-gray-900">{totalPrice.toLocaleString()} <span className="text-xs text-gray-400">ج.م</span></p>
                              </div>
                              
                              <Button
                                 type="submit"
                                 disabled={isSubmitting}
                                 className="w-full h-11 mt-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-100 border-b-4 border-indigo-800 active:border-b-0 transition-all hover:scale-[1.02]"
                              >
                                 {isSubmitting ? (
                                   <>
                                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                     جاري المعالجة...
                                   </>
                                 ) : (
                                   "تأكيد الحجز والدفع الآن"
                                 )}
                              </Button>
                              <p className="text-[8px] text-center text-gray-400 font-bold">بمجرد الضغط على تأكيد، فإنك توافق على شروط الخدمة</p>
                           </div>
                         </div>
                     </div>
                  </div>
               </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingCard;
