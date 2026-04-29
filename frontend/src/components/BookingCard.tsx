import { useState, useEffect, useMemo } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { 
  Phone, 
  MessageCircle, 
  Globe, 
  Star, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Zap, 
  CreditCard, 
  Wallet, 
  Smartphone, 
  ShieldCheck, 
  Users, 
  Loader2, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Tag,
  Ticket,
  Armchair,
  ArrowRight
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import BusSeatLayout from "@/components/company/BusSeatLayout";
import { Link, useNavigate } from "react-router-dom";
import { validatePhone, validateEmail } from "@/lib/validators";
import { motion, AnimatePresence } from "framer-motion";

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

  const getTransportLabel = (type: string) => {
    switch (type) {
      case 'bus-48': return 'حافلة (48 مقعد)';
      case 'bus-30': return 'حافلة (30 مقعد)';
      case 'van-14': return 'سيارة فان (14 مقعد)';
      default: return type;
    }
  };



  const basePrice = parseInt(trip.price.replace(/[^0-9]/g, "")) || 0;
  const subtotal = basePrice * bookingData.numberOfPeople;
  
  const totalPrice = subtotal;

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
  const bookedSeatsCount = useMemo(() => {
    return allTripBookings.reduce((sum, b) => sum + (b.numberOfPeople || 0), 0);
  }, [allTripBookings]);

  const availableSeatsCount = Math.max(0, (trip.maxGroupSize || totalSeats) - bookedSeatsCount);

  const currentBookedSeats = useMemo(() => {
    const list: { seatNumber: string; passengerName: string }[] = [];
    (trip.seatBookings || [])
        .filter(sb => (sb.busIndex || 0) === currentBusIndex)
        .forEach(sb => {
          list.push({ seatNumber: sb.seatNumber, passengerName: sb.passengerName });
        });
        
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
            if (!list.some(item => item.seatNumber === seatNumber)) {
              list.push({ seatNumber: seatNumber, passengerName: booking.userName });
            }
          }
        });
      }
    });
    return list;
  }, [trip.seatBookings, allTripBookings, currentBusIndex]);

  const currentSelectedSeats = useMemo(() => {
    return bookingData.selectedSeats
        .filter(s => s.startsWith(`${currentBusIndex}-`))
        .map(s => s.split('-')[1]);
  }, [bookingData.selectedSeats, currentBusIndex]);

  const handleSeatSelection = (seats: string[]) => {
    const otherBusesSeats = bookingData.selectedSeats.filter(s => !s.startsWith(`${currentBusIndex}-`));
    const newCurrentSeats = seats.map(s => `${currentBusIndex}-${s}`);
    setBookingData(prev => ({ ...prev, selectedSeats: [...otherBusesSeats, ...newCurrentSeats] }));
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingStep !== 2) return;

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
    if (bookingData.numberOfPeople > availableSeatsCount) {
      toast({ title: `لا توجد مقاعد كافية (المتاح ${availableSeatsCount})`, variant: "destructive" });
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
        totalPrice: totalPrice,
      };
      const result = await bookingService.createBooking(bookingPayload, token || undefined);

      if (!result.success) throw new Error("فشل إنشاء الحجز");

      const bookingId = result.booking._id;
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
      <Card className={cn(
        "border-border shadow-2xl bg-card/80 backdrop-blur-xl transition-all duration-500 rounded-[2.5rem] overflow-hidden group",
        sticky && "sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar"
      )}>
        <CardContent className="p-8 space-y-8 relative overflow-hidden">
          {/* Subtle Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
          
          <div className="text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">
                <Zap className="w-3 h-3 ml-1 fill-current" /> متاح للحجز
              </Badge>
            </div>
            <div className="text-5xl font-black text-foreground tracking-tighter mb-2 tabular-nums">
              {trip.price} <span className="text-xl text-muted-foreground font-bold">ج.م</span>
            </div>
            <p className="text-muted-foreground font-bold text-sm">شامل كافة الرسوم والضرائب</p>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-muted/50 p-4 rounded-2xl border border-border flex flex-col items-center gap-1">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">المدة</span>
              <span className="font-bold text-foreground text-sm">{trip.duration}</span>
            </div>
            <div className="bg-muted/50 p-4 rounded-2xl border border-border flex flex-col items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">التقييم</span>
              <span className="font-bold text-foreground text-sm">{trip.rating} / 5</span>
            </div>
          </div>

          <Separator className="bg-border/60" />

          <div className="space-y-4 relative z-10">
            {user && userBookingsForTrip.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-primary/5 border border-primary/20 shadow-inner"
              >
                 <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-black text-foreground">لديك {userBookingsForTrip.length} حجز مسبق في هذه الرحلة</span>
                 </div>
                 <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                    {userBookingsForTrip.map(b => (
                       <div key={b._id} className="flex items-center justify-between text-[11px] bg-card/60 p-2.5 rounded-xl border border-border shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                              {b.numberOfPeople}
                            </div>
                            <span className="font-black text-foreground truncate max-w-[120px]">{b.userName}</span>
                          </div>
                          <Badge className={cn(
                             "text-[9px] px-2 py-0.5 border-0 rounded-lg font-black",
                             b.status === 'pending' ? "bg-amber-500/10 text-amber-600" :
                             b.status === 'accepted' ? "bg-emerald-500/10 text-emerald-600" :
                             "bg-rose-500/10 text-rose-600"
                          )}>
                             {b.status === 'pending' ? 'انتظار' : b.status === 'accepted' ? 'مؤكد' : 'ملغي'}
                          </Badge>
                       </div>
                    ))}
                 </div>
              </motion.div>
            )}
            
            <Button
              className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground gap-3 font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95 group"
              onClick={handleDirectBooking}
            >
              <Zap className="h-6 w-6 fill-current group-hover:scale-110 transition-transform" />
              حجز فوري وآمن
            </Button>

            <div className="grid grid-cols-2 gap-3">
              {trip.bookingMethod.website && company.contactInfo.website && (
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-border hover:bg-muted font-bold text-sm gap-2"
                  onClick={handleWebsiteBooking}
                >
                  <Globe className="h-4 w-4" />
                  الموقع
                </Button>
              )}
              <Button
                variant="outline"
                className="h-12 rounded-xl border-border hover:bg-muted font-bold text-sm gap-2"
                onClick={handleWhatsAppBooking}
              >
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                واتساب
              </Button>
            </div>
          </div>

          <Separator className="bg-border/60" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-4 group/company">
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-black text-xl shadow-lg overflow-hidden shrink-0 group-hover/company:scale-110 transition-transform border-4 border-background`}>
                {company.logo && company.logo !== "undefined" ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  company.name.charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-foreground text-lg truncate group-hover/company:text-primary transition-colors">{company.name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={cn("h-3 w-3", i <= (company.rating || 5) ? "fill-amber-500 text-amber-500" : "text-muted")} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground font-bold">({company.rating} / 5)</span>
                </div>
              </div>
              <Link to={`/companies/${company.id}`}>
                <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-primary/5 rounded-2xl p-5 text-sm text-foreground/80 border border-primary/10 relative z-10 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="font-bold leading-relaxed">
              تأكد من اختيار مقاعدك المفضلة بعناية قبل إتمام عملية الدفع. المقاعد المحجوزة نهائية.
            </p>
          </div>

          <Link to={`/companies/${company.id}`} className="block relative z-10">
            <Button variant="outline" className="w-full h-14 rounded-2xl font-black border-border hover:bg-foreground hover:text-background transition-all gap-2 group">
              ملف الشركة والرحلات الأخرى
              <ArrowRight className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Dialog open={showBookingDialog} onOpenChange={(open) => { setShowBookingDialog(open); if (!open) setBookingStep(1); }}>
        <DialogContent className="w-[100vw] max-w-[100vw] sm:max-w-[95vw] lg:max-w-[700px] h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 font-cairo overflow-hidden rounded-none sm:rounded-[3rem] border-border bg-background shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col" dir="rtl">
          {/* Enhanced Header with stepper */}
          <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden shrink-0 border-b border-white/10">
             <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
             <div className="relative z-10">
                <div className="flex items-center justify-between gap-4 mb-6">
                   <div className="space-y-1">
                      <DialogTitle className="text-xl md:text-2xl font-black tracking-tight">تأكيد حجز الرحلة</DialogTitle>
                      <p className="text-primary-foreground/70 font-bold text-sm">{trip.title}</p>
                   </div>
                   <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-black shrink-0 hidden md:flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> حجز مشفر وآمن
                   </Badge>
                </div>
                {/* Visual Step indicator */}
                <div className="flex items-center gap-4">
                   {[1, 2].map((step) => (
                     <div key={step} className="flex items-center gap-3 group">
                        <div className={cn(
                          "flex items-center justify-center rounded-2xl w-10 h-10 text-sm font-black border-2 transition-all duration-500",
                          bookingStep === step 
                            ? "bg-white text-primary border-white shadow-xl shadow-white/20" 
                            : bookingStep > step 
                              ? "bg-emerald-500/40 border-emerald-300 text-white" 
                              : "bg-white/5 border-white/20 text-white/40"
                        )}>
                          {bookingStep > step ? <Check className="w-5 h-5" /> : step}
                        </div>
                        <div className="flex flex-col">
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", bookingStep >= step ? "text-white" : "text-white/40")}>
                            {step === 1 ? "الخطوة الأولى" : "الخطوة الثانية"}
                          </span>
                          <span className={cn("text-sm font-black", bookingStep >= step ? "text-white" : "text-white/40")}>
                            {step === 1 ? "البيانات الأساسية" : "تحديد المقاعد"}
                          </span>
                        </div>
                        {step < 2 && <div className="h-px w-8 bg-white/20 mx-2 hidden sm:block" />}
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <form
            onSubmit={handleSubmitBooking}
            className="flex-1 min-h-0 flex flex-col bg-background relative overflow-hidden"
          >
            <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 pb-32 custom-scrollbar scroll-smooth">
               <AnimatePresence mode="wait">
                {/* Step 1: Passenger info */}
                {bookingStep === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    <div className="bg-card/50 p-8 rounded-[2.5rem] border border-border shadow-xl space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                              <Users className="w-6 h-6" />
                          </div>
                          <h4 className="text-xl font-black text-foreground tracking-tight">بيانات المسافر الرئيسي</h4>
                        </div>

                        <div className="bg-muted/30 p-6 rounded-[2rem] border border-border flex items-center justify-between gap-6">
                          <div className="space-y-1">
                            <Label className="text-sm font-black text-foreground">عدد المسافرين</Label>
                            <p className="text-xs text-muted-foreground font-bold">يرجى تحديد إجمالي عدد الأشخاص في حجزك</p>
                          </div>
                          <div className="flex items-center gap-4 bg-background p-2 rounded-2xl border border-border">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary"
                              onClick={() => setBookingData(prev => ({ ...prev, numberOfPeople: Math.max(1, prev.numberOfPeople - 1) }))}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              max={trip.maxGroupSize || 50}
                              value={bookingData.numberOfPeople}
                              onChange={(e) => setBookingData({ ...bookingData, numberOfPeople: parseInt(e.target.value) || 1 })}
                              className="h-10 w-12 text-center text-xl font-black border-0 bg-transparent focus-visible:ring-0 text-foreground"
                            />
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary"
                              onClick={() => setBookingData(prev => ({ ...prev, numberOfPeople: Math.min(trip.maxGroupSize || 50, prev.numberOfPeople + 1) }))}
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">الاسم الأول</Label>
                              <Input
                                value={bookingData.firstName}
                                onChange={(e) => setBookingData({ ...bookingData, firstName: e.target.value })}
                                className="h-14 rounded-2xl bg-background border-border text-base font-bold px-5 focus:ring-primary shadow-sm"
                                placeholder="محمد"
                                required
                              />
                          </div>
                          <div className="space-y-2">
                              <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">اسم العائلة</Label>
                              <Input
                                value={bookingData.lastName}
                                onChange={(e) => setBookingData({ ...bookingData, lastName: e.target.value })}
                                className="h-14 rounded-2xl bg-background border-border text-base font-bold px-5 focus:ring-primary shadow-sm"
                                placeholder="أحمد"
                                required
                              />
                          </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">رقم الهاتف النشط</Label>
                            <div className="relative">
                              <Phone className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                type="tel"
                                value={bookingData.userPhone}
                                onChange={(e) => setBookingData({ ...bookingData, userPhone: e.target.value })}
                                className="h-14 rounded-2xl bg-background border-border text-base font-black pr-14 focus:ring-primary shadow-sm"
                                placeholder="01x xxxx xxxx"
                                required
                                dir="ltr"
                              />
                            </div>
                        </div>

                        <div className="space-y-2">
                           <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">البريد الإلكتروني</Label>
                           <Input
                             type="email"
                             value={bookingData.email}
                             onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                             className="h-14 rounded-2xl bg-background border-border text-base font-bold px-5 focus:ring-primary shadow-sm"
                             placeholder="example@mail.com"
                             required
                           />
                        </div>

                        <div className="space-y-2">
                           <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">طلبات خاصة أو ملاحظات</Label>
                           <Textarea
                             value={bookingData.specialRequests}
                             onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                             className="min-h-[120px] rounded-[2rem] bg-background border-border text-base font-bold p-6 focus:ring-primary shadow-sm resize-none"
                             placeholder="هل لديك أي حساسية غذائية أو تفضيلات معينة؟"
                           />
                        </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Choose seats */}
                {bookingStep === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    <div className="bg-card/50 p-8 rounded-[2.5rem] border border-border shadow-xl space-y-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Armchair className="w-6 h-6" />
                            </div>
                            <h4 className="text-xl font-black text-foreground tracking-tight">اختر أماكن الجلوس</h4>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-2xl font-black">
                            {bookingData.selectedSeats.length} / {bookingData.numberOfPeople} مقعد
                          </Badge>
                        </div>

                        {transportationUnits.length > 1 && (
                          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                             {transportationUnits.map((unit, idx) => (
                                <button
                                   key={idx}
                                   type="button"
                                   onClick={() => setCurrentBusIndex(idx)}
                                   className={cn(
                                     "px-6 py-3 rounded-2xl text-sm font-black whitespace-nowrap transition-all border-2",
                                     currentBusIndex === idx 
                                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" 
                                      : "bg-background text-muted-foreground border-border hover:border-primary/30"
                                   )}
                                >
                                   {getTransportLabel(unit.type)} {idx + 1}
                                </button>
                             ))}
                          </div>
                        )}

                        <div className="bg-muted/40 rounded-[2.5rem] border border-dashed border-border p-10 flex flex-col items-center shadow-inner overflow-hidden relative">
                           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.03)_0%,transparent_70%)]" />
                           <div className="scale-[0.85] md:scale-110 origin-center transition-transform">
                              <BusSeatLayout
                                 type={currentUnit.type}
                                 bookedSeats={currentBookedSeats}
                                 onSelectSeats={handleSeatSelection}
                                 initialSelectedSeats={currentSelectedSeats}
                                 maxSelection={bookingData.numberOfPeople - (bookingData.selectedSeats.length - currentSelectedSeats.length)}
                                 isAdmin={false}
                              />
                           </div>
                           <div className="mt-12 flex flex-wrap justify-center gap-8 text-xs font-black uppercase tracking-wider text-muted-foreground">
                              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-white border border-border" /> <span>متاح</span></div>
                              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-rose-500/20 border border-rose-500/40" /> <span>محجوز</span></div>
                              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-primary shadow-lg shadow-primary/20" /> <span className="text-primary">اختيارك</span></div>
                           </div>
                        </div>
                    </div>

                    {/* Summary Card within Step 2 */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-foreground text-background rounded-[2.5rem] p-8 shadow-2xl space-y-4 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-background/60 font-black uppercase tracking-widest">التكلفة الأساسية</span>
                              <span className="font-black tabular-nums">{subtotal.toLocaleString()} ج.م</span>
                           </div>
                           <Separator className="bg-white/10" />
                           <div className="flex justify-between items-end">
                              <div className="space-y-1">
                                <p className="text-xs font-black text-background/60 uppercase tracking-widest">الإجمالي النهائي</p>
                                <p className="text-4xl font-black text-primary tabular-nums leading-none">{totalPrice.toLocaleString()} <span className="text-sm font-bold opacity-80">ج.م</span></p>
                              </div>
                              <Ticket className="w-12 h-12 text-white/10" />
                           </div>
                        </div>
                    </div>
                  </motion.div>
                )}
               </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 md:p-8 bg-card border-t border-border flex items-center justify-between gap-4 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] relative z-20">
               <Button
                 type="button"
                 variant="ghost"
                 className={cn(
                  "rounded-2xl h-14 px-8 font-black gap-2 transition-all",
                  bookingStep === 1 ? "opacity-0 pointer-events-none" : "hover:bg-muted"
                 )}
                 onClick={() => setBookingStep(1)}
               >
                 <ChevronRight className="w-5 h-5" /> رجوع للبيانات
               </Button>

               <div className="flex gap-4">
                 <Button
                    type="button"
                    variant="ghost"
                    className="rounded-2xl h-14 px-8 font-black hidden sm:flex"
                    onClick={() => setShowBookingDialog(false)}
                 >
                    إلغاء
                 </Button>
                 {bookingStep < 2 ? (
                    <Button
                      type="button"
                      className="rounded-2xl h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-black shadow-xl shadow-primary/20 transition-all active:scale-95"
                      onClick={() => {
                        if (!bookingData.firstName?.trim() || !bookingData.lastName?.trim() || !bookingData.userPhone?.trim() || !bookingData.email?.trim()) {
                          toast({ title: "البيانات ناقصة", description: "يرجى تعبئة كافة الحقول المطلوبة للمتابعة", variant: "destructive" });
                          return;
                        }
                        setBookingStep(2);
                      }}
                    >
                      متابعة لاختيار المقاعد <ChevronLeft className="w-5 h-5" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-2xl h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-xl shadow-primary/20 gap-3 transition-all active:scale-95"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-6 h-6 animate-spin" /> جاري المعالجة...</>
                      ) : (
                        <><CreditCard className="w-6 h-6" /> تأكيد الحجز والدفع</>
                      )}
                    </Button>
                 )}
               </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingCard;
