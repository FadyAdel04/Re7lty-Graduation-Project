import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Trip, Company } from "@/types/corporateTrips";
import { corporateTripsService } from "@/services/corporateTripsService";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import BookingCard from "@/components/BookingCard";
import { MapboxTripMap } from "@/components/MapboxTripMap";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Clock, 
  Star, 
  Users, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Calendar,
  Timer,
  Bus,
  Image as ImageIcon,
  ShieldCheck,
  Check,
  Armchair,
  Zap,
  Share2,
  Heart,
  Flag,
  Navigation,
  Globe
} from "lucide-react";
import BusSeatLayout from "@/components/company/BusSeatLayout";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { cn } from "@/lib/utils";
import ReportTripDialog from "@/components/ReportTripDialog";
import TripComments from "@/components/TripComments";
import { Comment as TripComment } from "@/lib/trips-data";

const TripDetailsPage = () => {
  const { user } = useUser();
  const { tripSlug } = useParams<{ tripSlug: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentBusIndex, setCurrentBusIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const [availableSeats, setAvailableSeats] = useState<number>(0);
  const [tripBookings, setTripBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!tripSlug) return;
      
      setLoading(true);
      try {
        const tripData = await corporateTripsService.getTripBySlug(tripSlug);
        if (tripData) {
          setTrip(tripData);
          const companyData = await corporateTripsService.getCompanyById(tripData.companyId);
          setCompany(companyData || null);

          // Fetch all bookings to calculate real availability
          const tripId = tripData._id || tripData.id;
          const { bookingService } = await import("@/services/bookingService");
          const bookings = await bookingService.getTripBookings(tripId);
          setTripBookings(bookings);
          
          const bookedCount = bookings.reduce((sum, b) => sum + (b.numberOfPeople || 0), 0);
          const totalCapacity = tripData.transportations?.reduce((sum, t) => sum + (t.capacity * (t.count || 1)), 0) || 48;
          setAvailableSeats(Math.max(0, (tripData.maxGroupSize || totalCapacity) - bookedCount));
        }
      } catch (error) {
        console.error("Error fetching trip details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripSlug]);

  const handleCommentAdded = (comment: TripComment) => {
    setTrip((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: [comment, ...(prev.comments || [])],
      };
    });
  };

  const handleCommentUpdated = (commentId: string, changes: Partial<TripComment>) => {
    setTrip((prev) => {
      if (!prev) return prev;
      if (!Array.isArray(prev.comments)) return prev;
      return {
        ...prev,
        comments: prev.comments.map((c: any) =>
          (c.id === commentId || c._id === commentId) ? { ...c, ...changes } : c
        ),
      };
    });
  };

  const handleCommentDeleted = (commentId: string) => {
    setTrip((prev) => {
      if (!prev) return prev;
      const updatedComments = (prev.comments || []).filter((c: any) => (c.id !== commentId && c._id !== commentId));
      return {
        ...prev,
        comments: updatedComments,
      };
    });
  };

  const nextImage = () => {
    if (trip) {
      setCurrentImageIndex((prev) => (prev + 1) % trip.images.length);
    }
  };

  const prevImage = () => {
    if (trip) {
      setCurrentImageIndex((prev) => (prev - 1 + trip.images.length) % trip.images.length);
    }
  };

  const getTimeRemaining = (startDate: string) => {
    const total = Date.parse(startDate) - Date.parse(new Date().toString());
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const seconds = Math.floor((total / 1000) % 60);
    
    if (total <= 0) return { expired: true, text: "قد بدأت بالفعل" };
    return {
      expired: false,
      text: `${days} يوم و ${hours} ساعة`,
      details: { days, hours, minutes, seconds }
    };
  };

  const [timeRemaining, setTimeRemaining] = useState<any>(null);

  useEffect(() => {
    if (trip?.startDate) {
      setTimeRemaining(getTimeRemaining(trip.startDate));
      const timer = setInterval(() => {
        setTimeRemaining(getTimeRemaining(trip.startDate!));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [trip?.startDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="animate-pulse space-y-12">
            <div className="h-[500px] bg-muted rounded-[3rem]" />
            <div className="space-y-4">
              <div className="h-12 bg-muted rounded-2xl w-3/4" />
              <div className="h-6 bg-muted rounded-xl w-1/2" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!trip || !company) {
    return (
      <div className="min-h-screen bg-background font-cairo">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <XCircle className="w-12 h-12 text-rose-500" />
          </div>
          <h1 className="text-4xl font-black text-foreground mb-4">الرحلة غير موجودة</h1>
          <p className="text-muted-foreground mb-10 text-lg">عذراً، لم نتمكن من العثور على هذه الرحلة أو قد تكون انتهت صلاحيتها.</p>
          <Link to="/agency">
            <Button className="h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
              العودة لاستكشاف الرحلات
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const getTransportLabel = (type: string) => {
    switch(type) {
      case 'bus-48': return 'حافلة (48 مقعد)';
      case 'minibus-28': return 'ميني باص (28 مقعد)';
      case 'van-14': return 'ميكروباص (14 مقعد)';
      default: return 'حافلة';
    }
  };

  const getSeatCount = () => {
    if (trip.transportations && trip.transportations.length > 0) {
      return trip.transportations.reduce((sum, t) => sum + (t.capacity * (t.count || 1)), 0).toString();
    }
    return trip.transportationType === 'bus-48' ? '48' : trip.transportationType === 'minibus-28' ? '28' : '14';
  };

  return (
    <div className="min-h-screen bg-background font-cairo" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: "وكالات السفر", href: "/agency" },
              { label: trip.title }
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Area - 8 Columns */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* 1. Premium Gallery Slider */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl shadow-black/10 border border-border"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={trip.images[currentImageIndex]}
                  alt={trip.title}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              
              {/* Image Controls Overlay */}
              <div className="absolute inset-0 flex items-center justify-between p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white h-14 w-14 rounded-full border border-white/20 shadow-2xl"
                  onClick={prevImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white h-14 w-14 rounded-full border border-white/20 shadow-2xl"
                  onClick={nextImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              </div>

              {/* Progress Bar & Indicators */}
              <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                <div className="flex gap-2">
                  {trip.images.map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'w-12 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]' 
                          : 'w-2 bg-white/40 hover:bg-white/60'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-12 w-12 rounded-2xl backdrop-blur-xl transition-all border border-white/20",
                      isLiked ? "bg-rose-500 text-white border-rose-500" : "bg-white/10 text-white hover:bg-rose-500"
                    )}
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 border border-white/20">
                    <Share2 className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* 2. Header & Quick Info */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Link to={`/companies/${company.id}`}>
                    <Badge className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 font-black px-5 py-2 rounded-2xl transition-all flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      {company.name}
                    </Badge>
                  </Link>
                  <Badge variant="outline" className="gap-2 px-5 py-2 rounded-2xl bg-muted/50 text-foreground border-border font-bold">
                    <MapPin className="h-4 w-4 text-primary" />
                    {trip.destination}
                  </Badge>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-[1.1]">
                  {trip.title}
                </h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Clock, label: "المدة", value: trip.duration, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { icon: Star, label: "التقييم", value: `${trip.rating} / 5`, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { icon: Users, label: "المجموعة", value: `${trip.maxGroupSize} فرد`, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { icon: Navigation, label: "الوجهة", value: trip.destination, color: "text-rose-500", bg: "bg-rose-500/10" },
                  ].map((stat, i) => (
                    <div key={i} className={cn("p-6 rounded-[2rem] border border-border flex flex-col items-center text-center gap-3 transition-transform hover:scale-105", stat.bg)}>
                      <stat.icon className={cn("w-7 h-7", stat.color)} />
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">{stat.label}</p>
                        <p className="text-lg font-black text-foreground">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Countdown Banner */}
              {trip.startDate && timeRemaining && !timeRemaining.expired && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary rounded-[2.5rem] p-10 text-primary-foreground overflow-hidden relative group shadow-2xl shadow-primary/20"
                >
                  <div className="absolute top-0 left-0 p-12 transform -translate-x-1/4 -translate-y-1/4 opacity-10 -rotate-12 transition-transform group-hover:scale-110">
                    <Timer className="w-64 h-64" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="space-y-3 text-center md:text-right">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest border border-white/20 mb-2">
                        <Zap className="w-3 h-3 fill-current" /> عد تنازلي للمغامرة
                      </div>
                      <h3 className="text-4xl font-black tracking-tight">استعد للانطلاق!</h3>
                      <p className="text-primary-foreground/80 font-bold text-lg">باقي القليل من الوقت قبل حجز مقعدك الأخير.</p>
                    </div>
                    <div className="flex gap-4 sm:gap-6">
                      {[
                        { label: 'يوم', val: timeRemaining.details?.days },
                        { label: 'ساعة', val: timeRemaining.details?.hours },
                        { label: 'دقيقة', val: timeRemaining.details?.minutes },
                        { label: 'ثانية', val: timeRemaining.details?.seconds },
                      ].map((unit, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-2xl rounded-3xl p-5 min-w-[90px] sm:min-w-[110px] text-center border border-white/20 shadow-xl flex flex-col items-center justify-center">
                          <p className="text-4xl sm:text-5xl font-black leading-none mb-2 tabular-nums">{unit.val}</p>
                          <p className="text-[10px] font-black text-primary-foreground/60 uppercase tracking-widest">{unit.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 3. Trip Overview Section */}
            <div className="space-y-8 bg-card/50 rounded-[3rem] p-10 border border-border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-1.5 bg-primary rounded-full" />
                <h2 className="text-4xl font-black text-foreground">نظرة عامة</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-xl font-medium">
                {trip.fullDescription}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                 <div className="p-8 bg-emerald-500/5 rounded-3xl border border-emerald-500/20 group hover:bg-emerald-500/10 transition-colors">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="text-lg font-black text-foreground mb-2">سياسة الأمان</h4>
                    <p className="text-muted-foreground font-bold">رحلة مؤمنة بالكامل مع طاقم مدرب لضمان سلامتك وراحتك طوال الوقت.</p>
                 </div>
                 <div className="p-8 bg-blue-500/5 rounded-3xl border border-blue-500/20 group hover:bg-blue-500/10 transition-colors">
                    <Bus className="w-10 h-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="text-lg font-black text-foreground mb-2">وسائل النقل</h4>
                    <p className="text-muted-foreground font-bold">حافلات سياحية حديثة موديل العام مزودة بكافة وسائل الرفاهية والتكنولوجيا.</p>
                 </div>
              </div>
            </div>

            {/* 4. Road Map / Itinerary */}
            <div id="trip-itinerary" className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-1.5 bg-primary rounded-full" />
                <h2 className="text-4xl font-black text-foreground">خارطة الطريق</h2>
              </div>
              <div className="bg-card/30 rounded-[3rem] p-1 md:p-8 border border-border shadow-inner">
                <ItineraryTimeline itinerary={trip.itinerary} />
              </div>
            </div>

            {/* 5. Transportation Experience */}
            <div id="transportation" className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-1.5 bg-primary rounded-full" />
                <h2 className="text-4xl font-black text-foreground">تجربة التنقل</h2>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                   <div className="bg-card rounded-[2.5rem] p-10 border border-border shadow-xl space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5 -mr-10 -mt-10">
                        <Bus className="w-48 h-48" />
                      </div>
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Bus className="w-9 h-9" />
                      </div>
                      <div className="space-y-3">
                         <h3 className="text-3xl font-black text-foreground">حافلة الرحلة</h3>
                         <p className="text-muted-foreground font-bold text-lg leading-relaxed">
                            نضمن لك رحلة مريحة مع أحدث الحافلات المزودة بكابلات شحن للشاشات وتكييف مركزي ومقاعد واسعة قابلة للطي.
                         </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         {[
                           { label: 'إجمالي المقاعد', val: getSeatCount(), color: 'primary', icon: Armchair },
                           { label: 'التكييف', val: 'متوفر', color: 'emerald', icon: Zap },
                           { label: 'شواحن USB', val: 'متوفر', color: 'orange', icon: Timer },
                           { label: 'شبكة WiFi', val: 'متوفر', color: 'blue', icon: Globe },
                         ].map((item, idx) => (
                           <div key={idx} className="p-5 rounded-[1.5rem] border border-border bg-muted/50 flex items-center gap-4 group hover:bg-background transition-colors">
                              <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm border border-border group-hover:scale-110 transition-transform">
                                <item.icon className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{item.label}</span>
                                <span className="font-black text-foreground">{item.val}</span>
                              </div>
                           </div>
                         ))}
                      </div>

                      {/* Bus Selection Tabs if multiple buses */}
                      {trip.transportations && trip.transportations.length > 1 && (
                        <div className="space-y-4 pt-6 border-t border-border">
                           <p className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">اختر المركبة لعرض المقاعد المتاحة:</p>
                           <div className="flex flex-wrap gap-3">
                             {trip.transportations.map((unit, idx) => (
                               <Button
                                 key={idx}
                                 variant={currentBusIndex === idx ? "default" : "outline"}
                                 className={cn(
                                   "rounded-2xl h-14 px-6 font-black transition-all gap-3 border-2",
                                   currentBusIndex === idx ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-105" : "hover:border-primary/50 text-muted-foreground"
                                 )}
                                 onClick={() => setCurrentBusIndex(idx)}
                               >
                                 <Bus className="w-5 h-5" />
                                 {getTransportLabel(unit.type)} {unit.count > 1 ? `#${idx + 1}` : ''}
                               </Button>
                             ))}
                           </div>
                        </div>
                      )}
                   </div>

                   {trip.transportationImages && trip.transportationImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {trip.transportationImages.map((img, idx) => (
                          <div key={idx} className="aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-border group shadow-lg hover:shadow-2xl transition-all">
                             <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          </div>
                        ))}
                      </div>
                   )}
                </div>

                <div className="bg-card rounded-[3.5rem] p-12 border border-border shadow-2xl shadow-black/5 flex flex-col items-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />
                   <div className="w-full text-center space-y-3 mb-12">
                      <h3 className="text-3xl font-black text-foreground">مخطط المقاعد</h3>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-xs font-black text-primary uppercase tracking-widest border border-primary/20">
                        {trip.transportations && trip.transportations.length > 0 
                          ? `${getTransportLabel(trip.transportations[currentBusIndex].type)}`
                          : "التوزيع الافتراضي"
                        }
                      </div>
                   </div>
                   <div className="scale-[0.85] sm:scale-100 origin-center">
                    <BusSeatLayout 
                        type={
                          trip.transportations && trip.transportations.length > 0 
                            ? trip.transportations[currentBusIndex].type as any
                            : (trip.transportationType || 'bus-48') as any
                        } 
                        bookedSeats={(trip.seatBookings || []).filter(s => (s.busIndex || 0) === currentBusIndex)} 
                    />
                   </div>
                   <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm font-bold">
                      <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-md bg-muted border border-border" /> <span>متاح</span></div>
                      <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-md bg-rose-500/20 border border-rose-500/40" /> <span>محجوز</span></div>
                      <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-md bg-primary shadow-lg shadow-primary/20" /> <span>اختيارك</span></div>
                   </div>
                </div>
              </div>
            </div>

            {/* 6. Included & Excluded Services */}
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-emerald-500/5 rounded-[3rem] p-12 border border-emerald-500/20 space-y-10 group transition-all hover:shadow-xl hover:shadow-emerald-500/5"
              >
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Check className="w-9 h-9" />
                  </div>
                  <h3 className="text-3xl font-black text-emerald-600">ما هو مشمول؟</h3>
                </div>
                <ul className="space-y-5">
                  {trip.includedServices.map((service, index) => (
                    <li key={index} className="flex items-center gap-5 group/item">
                      <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all group-hover/item:scale-150" />
                      <span className="text-foreground/80 font-black text-xl">{service}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-rose-500/5 rounded-[3rem] p-12 border border-rose-500/20 space-y-10 group transition-all hover:shadow-xl hover:shadow-rose-500/5"
              >
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-3xl bg-rose-500/20 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10 border border-rose-500/20 group-hover:scale-110 transition-transform">
                    <XCircle className="w-9 h-9" />
                  </div>
                  <h3 className="text-3xl font-black text-rose-600">غير مشمول</h3>
                </div>
                <ul className="space-y-5">
                  {trip.excludedServices.map((service, index) => (
                    <li key={index} className="flex items-center gap-5 group/item">
                      <div className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all group-hover/item:scale-150" />
                      <span className="text-foreground/80 font-black text-xl">{service}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

{/* 7. Meeting Location - Immersive Card */}
<div className="bg-card rounded-[3.5rem] p-12 text-foreground space-y-10 relative overflow-hidden group border border-border shadow-2xl">
  <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 rotate-12 transition-transform duration-1000 group-hover:rotate-0 group-hover:scale-[1.6]">
    <Navigation className="w-96 h-96" />
  </div>
  
  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
    <div className="flex items-center gap-6">
      <div className="h-20 w-20 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 text-primary-foreground border-4 border-background group-hover:rotate-6 transition-transform">
        <MapPin className="w-10 h-10" />
      </div>
      <div>
        <h3 className="text-4xl font-black tracking-tight">نقطة التجمع</h3>
        <p className="text-muted-foreground font-black text-xl">{trip.meetingLocation || company?.contactInfo?.address || 'مقر الشركة'}</p>
      </div>
    </div>
    <Button className="h-16 px-10 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black text-lg gap-3 transition-all active:scale-95 shadow-xl">
      <Navigation className="w-6 h-6" />
      الاتجاهات في الخرائط
    </Button>
  </div>
  
  <div className="w-full h-80 rounded-[2.5rem] overflow-hidden border-4 border-background shadow-2xl relative z-10 bg-muted">
    <MapboxTripMap 
      positions={[{ lat: 30.0444, lng: 31.2357 }]}
      className="w-full h-full"
    />
  </div>
</div>
          </div>

          {/* Sidebar - 4 Columns */}
          <aside className="lg:col-span-4">
             <div className="space-y-8 pl-2 py-2">
                
                {/* 1. User Personalized Badge (if booked) */}
                <AnimatePresence>
                  {user && trip.seatBookings && trip.seatBookings.some(s => 
                    s.userId === user.id ||
                    s.passengerName.toLowerCase().includes(user.fullName?.toLowerCase() || "") ||
                    s.passengerName.toLowerCase().includes(user.firstName?.toLowerCase() || "")
                  ) && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="p-8 rounded-[2.5rem] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 overflow-hidden relative group border-4 border-white/10"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform duration-500 rotate-12">
                        <CheckCircle2 className="w-32 h-32" />
                      </div>
                      <div className="relative z-10 space-y-5">
                        <Badge className="bg-white/20 text-white border-0 mb-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">لقد تم تأكيد حجزك!</Badge>
                        <div>
                          <p className="text-white/80 text-sm font-black mb-3 uppercase tracking-wider">مقاعدك المخصصة في الرحلة:</p>
                          <div className="flex flex-wrap gap-3">
                             {trip.seatBookings
                               .filter(s => 
                                  s.userId === user.id ||
                                  s.passengerName.toLowerCase().includes(user.fullName?.toLowerCase() || "") ||
                                  s.passengerName.toLowerCase().includes(user.firstName?.toLowerCase() || "")
                               )
                               .map(s => (
                                  <div key={s.seatNumber} className="bg-white/20 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/30 shadow-lg flex flex-col items-center min-w-[70px]">
                                     <span className="text-3xl font-black tabular-nums">{s.seatNumber}</span>
                                     <p className="text-[9px] font-black opacity-70 uppercase mt-1">مقعد</p>
                                  </div>
                               ))
                             }
                          </div>
                        </div>
                        <p className="text-xs font-bold text-white/90 leading-relaxed bg-black/10 p-3 rounded-xl border border-white/10">
                          يرجى التواجد في نقطة التجمع قبل الموعد بـ 15 دقيقة على الأقل. رحلة سعيدة!
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 2. Main Booking Card */}
                <motion.div 
                  id="booking-card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative z-0"
                >
                  <BookingCard trip={trip} company={company} />
                </motion.div>

                {/* 3. Safety/Support Quick Links */}
                <div className="bg-muted/50 rounded-[2rem] p-6 border border-border space-y-4">
                  <h4 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                    <Flag className="w-4 h-4 text-primary" /> هل لديك تساؤل؟
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <ReportTripDialog 
                      tripId={trip._id || trip.id} 
                      tripTitle={trip.title} 
                      tripModel="CorporateTrip"
                      trigger={
                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-border bg-card hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all gap-2">
                          <Flag className="h-4 w-4" /> إبلاغ
                        </Button>
                      }
                    />
                    <Link to="/support">
                      <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-border bg-card hover:bg-primary hover:text-white hover:border-primary transition-all gap-2">
                        <Users className="h-4 w-4" /> دعم
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Comments Section - Moved under the left sidebar */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="pt-8"
                >
                  <div className="space-y-8">
                    <div className="text-right space-y-2">
                       <h2 className="text-2xl font-black text-foreground tracking-tight">التعليقات والاستفسارات</h2>
                       <p className="text-muted-foreground font-bold text-sm">شاركنا رأيك أو استفسارك حول الرحلة</p>
                    </div>
                    
                    <div className="bg-card/50 rounded-[2.5rem] p-6 border border-border shadow-lg">
                      <TripComments
                        tripId={String(trip?._id || trip?.id || "")}
                        initialComments={trip?.comments || []}
                        onCommentAdded={handleCommentAdded}
                        onCommentUpdated={handleCommentUpdated}
                        onCommentDeleted={handleCommentDeleted}
                        tripOwnerId={trip?.companyId as any}
                        isCorporate={true}
                      />
                    </div>
                  </div>
                </motion.div>

             </div>
          </aside>
        </div>
      </main>

      <Footer />
      
      {/* Floating Elements */}
      {company && trip && (
        <ChatWidget 
          companyId={company._id || company.id}
          companyName={company.name}
          companyLogo={company.logo}
          tripId={trip._id}
          tripTitle={trip.title}
        />
      )}

      {/* Floating Action Button for Mobile */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-8 left-8 right-8 z-[60] lg:hidden"
      >
        <Button 
          size="lg" 
          className="w-full h-16 rounded-2xl shadow-[0_20px_50px_rgba(var(--primary),0.3)] bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xl gap-3 border-2 border-white/20 backdrop-blur-xl transition-all active:scale-95 group"
          onClick={() => {
            const bookingCard = document.getElementById('booking-card');
            if (bookingCard) {
              bookingCard.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <Zap className="w-6 h-6 fill-primary-foreground animate-pulse" />
          <span>احجز رحلتك الآن</span>
        </Button>
      </motion.div>
  </div>
  );
};

export default TripDetailsPage;
