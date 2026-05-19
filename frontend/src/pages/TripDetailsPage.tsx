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
  Globe, 
  Hotel,
  Wifi,
  Coffee,
  Utensils,
  Waves,
  Palmtree,
  Wind,
  Bed,
  Sparkles,
  MessageCircle,
  X
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

const HotelImageSlider = ({ images, name }: { images: string[], name: string }) => {
  const [current, setCurrent] = useState(0);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <Hotel className="w-24 h-24 text-muted-foreground/20" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group/slider overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]}
          alt={`${name} - ${current + 1}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

      {images.length > 1 && (
        <>
          <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover/slider:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/20 hover:bg-black/40 backdrop-blur-md text-white h-10 w-10 rounded-full border border-white/20"
              onClick={prev}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/20 hover:bg-black/40 backdrop-blur-md text-white h-10 w-10 rounded-full border border-white/20"
              onClick={next}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === current ? "w-6 bg-white shadow-lg" : "w-1.5 bg-white/40"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TripDetailsPage = () => {
  const { user } = useUser();
  const { tripSlug } = useParams<{ tripSlug: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentBusIndex, setCurrentBusIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

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

  const [timeRemaining, setTimeRemaining] = useState<any>(null);

  useEffect(() => {
    if (trip?.startDate) {
      const getTimeRemaining = (date: string) => {
        const total = Date.parse(date) - Date.parse(new Date().toString());
        const days = Math.floor(total / (1000 * 60 * 60 * 24));
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const seconds = Math.floor((total / 1000) % 60);
        return total <= 0 ? { expired: true, text: "قد بدأت بالفعل" } : { expired: false, details: { days, hours, minutes, seconds } };
      };
      setTimeRemaining(getTimeRemaining(trip.startDate));
      const timer = setInterval(() => setTimeRemaining(getTimeRemaining(trip.startDate!)), 1000);
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
      
      {/* Modern UX/UI Hero Section */}
      <section className="container mx-auto px-4 pt-8 md:pt-12 pb-6">
        <div className="space-y-8">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-5">

              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-tight max-w-4xl"
              >
                {trip.title}
              </motion.h1>
            </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-3"
              >
                <Link to={`/companies/${company.id}`}>
                  <Badge className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 font-black px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                    {company.name}
                  </Badge>
                </Link>
                <Badge variant="outline" className="gap-1.5 px-4 py-2 rounded-xl bg-card text-muted-foreground border-border font-bold shadow-sm hover:bg-muted transition-colors">
                  <MapPin className="h-4 w-4 text-primary" />
                  {trip.destination}
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold shadow-sm hover:bg-amber-500/20 transition-colors">
                  <Star className="h-4 w-4 fill-amber-500" />
                  {trip.rating} / 5
                </Badge>
                {trip.startDate && (
                  <Badge variant="outline" className="gap-1.5 px-4 py-2 rounded-xl bg-card text-muted-foreground border-border font-bold shadow-sm hover:bg-muted transition-colors">
                    <Calendar className="h-4 w-4 text-primary" />
                    {new Date(trip.startDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Badge>
                )}
              </motion.div>
          </div>

          {/* Image Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[50vh] md:h-[65vh] rounded-[2.5rem] overflow-hidden relative group shadow-2xl border border-border"
          >
            {/* Main Image */}
            <div className="md:col-span-2 md:row-span-2 relative overflow-hidden group/main" onClick={() => { setCurrentImageIndex(0); setShowGallery(true); }}>
              <img 
                src={trip.images[0] || '/placeholder.svg'} 
                alt={trip.title} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover/main:scale-105 cursor-pointer"
              />
              <div className="absolute inset-0 bg-black/10 group-hover/main:bg-transparent transition-colors duration-500 cursor-pointer" />
            </div>
            
            {/* Secondary Images */}
            {trip.images.slice(1, 5).map((img, idx) => (
              <div key={idx} className="hidden md:block relative overflow-hidden group/sub" onClick={() => { setCurrentImageIndex(idx + 1); setShowGallery(true); }}>
                <img 
                  src={img} 
                  alt={`${trip.title} - ${idx + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover/sub:scale-110 cursor-pointer"
                />
                <div className="absolute inset-0 bg-black/10 group-hover/sub:bg-transparent transition-colors duration-500 cursor-pointer" />
              </div>
            ))}
            
            {/* If there are less than 5 images, fill the rest with the main image or placeholder */}
            {Array.from({ length: Math.max(0, 4 - (trip.images.length - 1)) }).map((_, idx) => (
               <div key={`empty-${idx}`} className="hidden md:block relative overflow-hidden bg-muted group/sub" onClick={() => { setCurrentImageIndex(0); setShowGallery(true); }}>
                  <img 
                    src={trip.images[0] || '/placeholder.svg'} 
                    alt="placeholder" 
                    className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover/sub:scale-110 cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover/sub:bg-transparent transition-colors duration-500 cursor-pointer" />
               </div>
            ))}

            {/* Show All Photos Button */}
            <Button 
              variant="secondary" 
              className="absolute bottom-6 right-6 gap-2 rounded-2xl h-12 px-6 font-black shadow-2xl backdrop-blur-xl bg-white/95 hover:bg-white text-gray-900 border border-black/5 hover:scale-105 transition-all"
              onClick={() => setShowGallery(true)}
            >
              <ImageIcon className="w-5 h-5 text-primary" />
              عرض كل الصور ({trip.images.length})
            </Button>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-20">
            
            {/* Countdown Timer */}
            {timeRemaining && !timeRemaining.expired && (
              <div className="bg-gradient-to-l from-primary/10 to-transparent border border-primary/20 rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-right gap-2">
                  <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest">
                    <Timer className="w-5 h-5 animate-pulse" /> الوقت المتبقي للرحلة
                  </div>
                  <p className="text-muted-foreground font-bold text-sm">سارع بحجز مقعدك قبل اكتمال العدد!</p>
                </div>
                <div className="relative z-10 flex gap-3 md:gap-5" dir="ltr">
                  {[
                    { label: "يوم", value: timeRemaining.details.days },
                    { label: "ساعة", value: timeRemaining.details.hours },
                    { label: "دقيقة", value: timeRemaining.details.minutes },
                    { label: "ثانية", value: timeRemaining.details.seconds, isSeconds: true }
                  ].map((unit, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div className={cn(
                        "w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-2xl md:rounded-3xl shadow-lg border backdrop-blur-xl",
                        unit.isSeconds ? "bg-primary text-primary-foreground border-primary/20 shadow-primary/20" : "bg-card text-foreground border-border"
                      )}>
                        <span className="text-2xl md:text-4xl font-black tabular-nums">{unit.value.toString().padStart(2, '0')}</span>
                      </div>
                      <span className="text-[10px] md:text-xs font-black text-muted-foreground">{unit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Clock, label: "المدة", value: trip.duration, color: "text-blue-500", bg: "bg-blue-500/5" },
                { icon: Star, label: "التقييم", value: `${trip.rating} / 5`, color: "text-amber-500", bg: "bg-amber-500/5" },
                { icon: Users, label: "المجموعة", value: `${trip.maxGroupSize} فرد`, color: "text-emerald-500", bg: "bg-emerald-500/5" },
                { icon: Timer, label: "المقاعد", value: `${availableSeats} متبقية`, color: "text-rose-500", bg: "bg-rose-500/5" },
              ].map((stat, i) => (
                <div key={i} className={cn("p-8 rounded-[2.5rem] border border-border flex flex-col items-center text-center gap-4 transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5", stat.bg)}>
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-border bg-background shadow-sm", stat.color)}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{stat.label}</p>
                    <p className="text-xl font-black text-foreground">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Overview */}
            <section id="overview" className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-2 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
                <h2 className="text-4xl font-black text-foreground tracking-tight">نظرة عامة على المغامرة</h2>
              </div>
              <div className="bg-card/30 backdrop-blur-sm rounded-[3rem] p-10 border border-border space-y-8">
                <p className="text-muted-foreground leading-relaxed text-xl font-medium">
                  {trip.fullDescription}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="flex items-start gap-4 p-6 rounded-3xl bg-primary/5 border border-primary/10">
                    <ShieldCheck className="w-8 h-8 text-primary mt-1" />
                    <div>
                      <h4 className="font-black text-foreground text-lg">رحلة آمنة</h4>
                      <p className="text-sm text-muted-foreground font-bold mt-1">تأمين شامل وفريق دعم متاح 24/7 طوال الرحلة.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                    <Sparkles className="w-8 h-8 text-blue-500 mt-1" />
                    <div>
                      <h4 className="font-black text-foreground text-lg">جودة متميزة</h4>
                      <p className="text-sm text-muted-foreground font-bold mt-1">أفضل الخدمات المختارة بعناية لضمان رفاهيتك.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section id="itinerary" className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-2 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
                  <h2 className="text-4xl font-black text-foreground tracking-tight">خارطة الطريق</h2>
                </div>
                <Badge className="bg-muted text-muted-foreground border-border px-4 py-2 rounded-xl font-black">
                  {trip.itinerary?.length || 0} أيام من الإثارة
                </Badge>
              </div>
              <div className="bg-card/20 rounded-[4rem] p-6 md:p-12 border border-border">
                <ItineraryTimeline itinerary={trip.itinerary} />
              </div>
            </section>

            {/* Stay Details */}
            {trip.stayDetails && trip.stayDetails.length > 0 && (
              <section id="stay" className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-2 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)]" />
                      <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">تجربة الإقامة</h2>
                    </div>
                    <p className="text-muted-foreground font-bold text-lg max-w-xl">لقد اخترنا لك أفضل الفنادق والمنتجعات لضمان راحة تامة.</p>
                  </div>
                </div>
                
                <div className="space-y-16">
                  {trip.stayDetails.map((stay, idx) => {
                    const amenities = [
                      { icon: Wifi, label: 'Wifi', match: ['wifi', 'واي فاي', 'إنترنت'] },
                      { icon: Waves, label: 'Pool', match: ['pool', 'مسبح', 'حمام سباحة'] },
                      { icon: Coffee, label: 'Breakfast', match: ['breakfast', 'إفطار', 'فطور'] },
                      { icon: Utensils, label: 'Dining', match: ['restaurant', 'مطعم', 'وجبات'] },
                      { icon: Palmtree, label: 'Beach', match: ['beach', 'شاطئ', 'بحر'] },
                      { icon: Wind, label: 'AC', match: ['ac', 'تكييف', 'مكيف'] },
                      { icon: Bed, label: 'Suite', match: ['suite', 'جناح', 'غرفة'] },
                    ].filter(a => a.match.some(m => stay.details?.toLowerCase().includes(m))).slice(0, 4);

                    return (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="group bg-card rounded-[4rem] overflow-hidden border border-border shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[500px]">
                          <div className="lg:col-span-5 relative min-h-[350px] lg:min-h-full">
                            <HotelImageSlider images={stay.images || []} name={stay.name} />
                          </div>

                          <div className="lg:col-span-7 p-10 md:p-14 flex flex-col justify-center space-y-10">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                 <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5" /> إقامة فاخرة
                                 </div>
                                 <div className="flex gap-1 text-amber-400">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                                 </div>
                              </div>
                              <h3 className="text-4xl md:text-5xl font-black text-foreground group-hover:text-indigo-600 transition-colors leading-tight">
                                {stay.name}
                              </h3>
                              <p className="text-muted-foreground text-xl font-medium leading-relaxed">
                                {stay.details}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {amenities.map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-muted/30 border border-border group/icon hover:bg-indigo-50 hover:border-indigo-100 transition-all">
                                  <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center text-indigo-500 shadow-sm border border-border group-hover/icon:bg-indigo-600 group-hover/icon:text-white transition-all">
                                    <item.icon className="w-6 h-6" />
                                  </div>
                                  <span className="text-xs font-black text-foreground">{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 6. Transportation Experience */}
            <section id="transport" className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-2 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
                    <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">تجربة الانتقال</h2>
                  </div>
                  <p className="text-muted-foreground font-bold text-lg max-w-xl">انتقالات مريحة وآمنة بأحدث الحافلات المجهزة.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card rounded-[3.5rem] p-10 border border-border shadow-xl space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <Bus className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black">{getTransportLabel(trip.transportationType || 'bus-48')}</h4>
                      <p className="text-sm text-muted-foreground font-bold">تجهيزات سياحية متكاملة</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: ShieldCheck, text: "سائقين محترفين ومعتمدين" },
                      { icon: Wind, text: "تكييف مركزي متطور" },
                      { icon: Armchair, text: "مقاعد مريحة قابلة للميل" },
                      { icon: Wifi, text: "إنترنت مجاني طوال الطريق" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                        <item.icon className="w-5 h-5 text-rose-500" />
                        <span className="font-bold text-foreground/80">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-[3.5rem] p-10 border border-border shadow-xl flex flex-col items-center justify-center space-y-6">
                   <h4 className="text-xl font-black text-center">توزيع المقاعد</h4>
                   <div className="scale-90 origin-center">
                     <BusSeatLayout 
                        type={trip.transportationType as any || 'bus-48'}
                        bookedSeats={(() => {
                          const list: { seatNumber: string; passengerName: string }[] = [];
                          (trip.seatBookings || [])
                            .filter(sb => (sb.busIndex || 0) === 0)
                            .forEach(sb => list.push({ seatNumber: sb.seatNumber, passengerName: sb.passengerName }));
                          
                          tripBookings.forEach(booking => {
                            if (booking.selectedSeats) {
                              booking.selectedSeats.forEach(seatStr => {
                                let seatNumber = seatStr;
                                let busIndex = 0;
                                if (seatStr.includes('-')) {
                                  const parts = seatStr.split('-');
                                  busIndex = parseInt(parts[0]) || 0;
                                  seatNumber = parts[1];
                                }
                                if (busIndex === 0 && !list.some(item => item.seatNumber === seatNumber)) {
                                  list.push({ seatNumber: seatNumber, passengerName: booking.userName });
                                }
                              });
                            }
                          });
                          return list;
                        })()}
                        tripBookings={tripBookings}
                     />
                   </div>
                   <div className="flex gap-6 text-xs font-black">
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-4 rounded bg-primary" />
                       <span>متاح</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-4 rounded bg-rose-500" />
                       <span>محجوز</span>
                     </div>
                   </div>
                </div>
              </div>
            </section>

            {/* 7. Included & Excluded Services */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-emerald-500/5 rounded-[3.5rem] p-12 border border-emerald-500/10 space-y-8">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="text-3xl font-black text-emerald-600">ما هو مشمول؟</h3>
                </div>
                <ul className="space-y-4">
                  {trip.includedServices.map((service, index) => (
                    <li key={index} className="flex items-center gap-4 group">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 group-hover:scale-150 transition-all" />
                      <span className="text-foreground/80 font-bold text-lg">{service}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-500/5 rounded-[3.5rem] p-12 border border-rose-500/10 space-y-8">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-3xl bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-500/20">
                    <XCircle className="w-9 h-9" />
                  </div>
                  <h3 className="text-3xl font-black text-rose-600">غير مشمول</h3>
                </div>
                <ul className="space-y-4">
                  {trip.excludedServices.map((service, index) => (
                    <li key={index} className="flex items-center gap-4 group">
                      <div className="h-2 w-2 rounded-full bg-rose-500 group-hover:scale-150 transition-all" />
                      <span className="text-foreground/80 font-bold text-lg">{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Comments Area */}
            <section id="comments" className="space-y-10 pt-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-2 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
                <h2 className="text-4xl font-black text-foreground tracking-tight">التعليقات والاستفسارات</h2>
              </div>
              <div className="bg-card/40 backdrop-blur-sm rounded-[3.5rem] p-8 md:p-12 border border-border shadow-xl">
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
            </section>
          </div>

          {/* Sticky Sidebar (Right) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-8">
            <motion.div 
              id="booking-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative z-10"
            >
              <BookingCard trip={trip} company={company} />
            </motion.div>

            {/* User Confirmation Card (if already booked) */}
            {user && trip.seatBookings?.some(s => s.userId === user.id) && (
              <div className="p-8 rounded-[3rem] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group border-4 border-white/10">
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform rotate-12">
                  <CheckCircle2 className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-4">
                  <Badge className="bg-white/20 text-white border-0 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">تم الحجز بنجاح</Badge>
                  <h4 className="text-2xl font-black">رحلة سعيدة، {user.firstName}!</h4>
                  <p className="text-white/80 font-medium">مقعدك محجوز ومنتظرينك في نقطة التجمع.</p>
                </div>
              </div>
            )}

            {/* Meeting Point Card */}
            <div className="bg-card rounded-[3rem] p-8 border border-border shadow-xl space-y-6 overflow-hidden group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black">نقطة التجمع</h3>
              </div>
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-border bg-muted relative">
                <MapboxTripMap positions={[{ lat: 30.0444, lng: 31.2357 }]} className="w-full h-full" />
              </div>
              <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                {trip.meetingLocation || company?.contactInfo?.address || 'مقر الشركة'}
              </p>
              <Button variant="outline" className="w-full h-14 rounded-2xl font-black gap-2 border-2 hover:bg-primary hover:text-white transition-all shadow-sm">
                <Navigation className="w-5 h-5" /> الاتجاهات في الخرائط
              </Button>
            </div>

            {/* Help & Support */}
            <div className="bg-muted/50 rounded-[2.5rem] p-8 border border-border space-y-6">
              <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary" /> هل تحتاج لمساعدة؟
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <ReportTripDialog 
                  tripId={trip._id || trip.id} 
                  tripTitle={trip.title} 
                  tripModel="CorporateTrip"
                  trigger={
                    <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-border bg-card hover:bg-rose-500 hover:text-white transition-all gap-2">
                      <Flag className="h-4 w-4" /> إبلاغ
                    </Button>
                  }
                />
                <Link to="/support">
                  <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-border bg-card hover:bg-primary hover:text-white transition-all gap-2">
                    <Users className="h-4 w-4" /> دعم
                  </Button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
      
      {/* Chat Widget */}
      {company && trip && (
        <ChatWidget 
          companyId={company._id || company.id}
          companyName={company.name}
          companyLogo={company.logo}
          tripId={trip._id}
          tripTitle={trip.title}
        />
      )}

      {/* Floating Action Bar (Mobile Only) */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 left-6 right-6 z-[60] lg:hidden flex flex-col gap-3"
      >
        <Button 
          size="lg" 
          className="w-full h-16 rounded-2xl shadow-[0_20px_50px_rgba(var(--primary),0.4)] bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xl gap-3 border-2 border-white/20 backdrop-blur-xl transition-all active:scale-95 group"
          onClick={() => document.getElementById('booking-card')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <Zap className="w-6 h-6 fill-primary-foreground animate-pulse" />
          <span>احجز رحلتك الآن</span>
        </Button>


      </motion.div>

      {/* Full-Screen Image Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center"
            dir="rtl"
          >
            {/* Header controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
              <div className="text-white font-black text-lg">
                {currentImageIndex + 1} / {trip.images.length}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10 rounded-full h-12 w-12"
                onClick={() => setShowGallery(false)}
              >
                <X className="w-8 h-8" />
              </Button>
            </div>

            {/* Main Image */}
            <div className="relative w-full max-w-5xl h-[70vh] flex items-center justify-center px-4">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={trip.images[currentImageIndex]}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                  alt={`Gallery Image ${currentImageIndex + 1}`}
                />
              </AnimatePresence>

              {/* Navigation Arrows */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 md:right-8 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full h-14 w-14 border border-white/20 shadow-2xl z-50"
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-4 md:left-8 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full h-14 w-14 border border-white/20 shadow-2xl z-50"
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            </div>

            {/* Thumbnail Strip */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 px-4 overflow-x-auto pb-4 no-scrollbar">
              {trip.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={cn(
                    "w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0",
                    idx === currentImageIndex 
                      ? "border-primary scale-110 shadow-xl" 
                      : "border-white/20 opacity-50 hover:opacity-100"
                  )}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TripDetailsPage;
