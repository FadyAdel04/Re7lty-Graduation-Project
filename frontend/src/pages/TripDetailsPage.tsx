import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Trip, Company } from "@/types/corporateTrips";
import { corporateTripsService } from "@/services/corporateTripsService";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import BookingCard from "@/components/BookingCard";
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
  Armchair
} from "lucide-react";
import BusSeatLayout from "@/components/company/BusSeatLayout";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { ChatWidget } from "@/components/chat/ChatWidget";

const TripDetailsPage = () => {
  const { user } = useUser();
  const { tripSlug } = useParams<{ tripSlug: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        }
      } catch (error) {
        console.error("Error fetching trip details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripSlug]);

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
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-gray-200 rounded-3xl" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!trip || !company) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">الرحلة غير موجودة</h1>
          <p className="text-gray-600 mb-8">عذراً، لم نتمكن من العثور على هذه الرحلة</p>
          <Link to="/templates">
            <Button className="rounded-xl">العودة إلى الرحلات</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "الرئيسية", href: "/" },
            { label: "باقات الشركات", href: "/templates" },
            { label: trip.title }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* 1. Hero Image Slider */}
            <div className="relative h-96 md:h-[500px] rounded-[2.5rem] overflow-hidden group shadow-2xl">
              <img
                src={trip.images[currentImageIndex]}
                alt={trip.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Image Navigation */}
              {trip.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/30"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/30"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              
              <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                <div className="space-y-4">
                   <div className="flex gap-2">
                      {trip.images.map((_, index) => (
                        <button
                          key={index}
                          className={`h-1.5 rounded-full transition-all ${
                            index === currentImageIndex 
                              ? 'w-10 bg-orange-500' 
                              : 'w-2 bg-white/50'
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* 2. Header & Countdown */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link to={`/companies/${company.id}`}>
                    <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-1.5 rounded-xl shadow-lg shadow-orange-100 transition-all hover:scale-105">
                      {company.name}
                    </Badge>
                  </Link>
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border-indigo-100">
                    <MapPin className="h-3.5 w-3.5" />
                    {trip.destination}
                  </Badge>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                  {trip.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-gray-500 font-bold">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-zinc-400" />
                    <span>{trip.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-900">{trip.rating}</span>
                    <span className="text-sm font-medium">({trip.likes} إعجاب)</span>
                  </div>
                  {trip.startDate && (
                     <div className="flex items-center gap-2">
                       <Calendar className="h-5 w-5 text-zinc-400" />
                       <span className="text-gray-900">
                         {new Date(trip.startDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                       </span>
                     </div>
                  )}
                </div>
              </div>

              {/* Countdown Banner */}
              {trip.startDate && timeRemaining && !timeRemaining.expired && (
                <div className="bg-indigo-600 rounded-[2rem] p-8 text-white overflow-hidden relative group shadow-2xl shadow-indigo-100">
                  <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                    <Timer className="w-48 h-48" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-2 text-center md:text-right">
                      <p className="text-indigo-200 text-xs font-black uppercase tracking-[0.2em]">عد تنازلي للمغامرة</p>
                      <h3 className="text-3xl font-black">جاهز للرحلة؟</h3>
                      <p className="text-indigo-100/80 font-medium">باقي القليل من الوقت قبل انطلاق حافلتنا!</p>
                    </div>
                    <div className="flex gap-4">
                      {[
                        { label: 'يوم', val: timeRemaining.details?.days },
                        { label: 'ساعة', val: timeRemaining.details?.hours },
                        { label: 'دقيقة', val: timeRemaining.details?.minutes },
                        { label: 'ثانية', val: timeRemaining.details?.seconds },
                      ].map((unit, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 min-w-[85px] text-center border border-white/20 shadow-xl">
                          <p className="text-3xl font-black leading-none mb-2">{unit.val}</p>
                          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">{unit.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="opacity-50" />

            {/* 3. Trip Overview */}
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-gray-900">عن هذه الرحلة</h2>
              <p className="text-gray-600 leading-relaxed text-xl font-medium">
                {trip.fullDescription}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                 <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 mb-3" />
                    <p className="text-xs font-black text-emerald-800 uppercase mb-1">الأمان</p>
                    <p className="text-sm font-bold text-emerald-900">رحلة مؤمنة بالكامل</p>
                 </div>
                 <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                    <Bus className="w-8 h-8 text-blue-600 mb-3" />
                    <p className="text-xs font-black text-blue-800 uppercase mb-1">النقل</p>
                    <p className="text-sm font-bold text-blue-900">حافلات سياحية حديثة</p>
                 </div>
                 <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100">
                    <Star className="w-8 h-8 text-orange-600 mb-3" />
                    <p className="text-xs font-black text-orange-800 uppercase mb-1">التقييم</p>
                    <p className="text-sm font-bold text-orange-900">{trip.rating} نجوم</p>
                 </div>
                 <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <Users className="w-8 h-8 text-zinc-600 mb-3" />
                    <p className="text-xs font-black text-zinc-800 uppercase mb-1">المجموعة</p>
                    <p className="text-sm font-bold text-zinc-900">حد أقصى {trip.maxGroupSize} فرد</p>
                 </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* 4. Itinerary */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1.5 bg-orange-600 rounded-full" />
                <h2 className="text-4xl font-black text-gray-900">خارطة الطريق</h2>
              </div>
              <ItineraryTimeline itinerary={trip.itinerary} />
            </div>

            <Separator className="opacity-50" />

            {/* 5. Transportation Section */}
            <div id="transportation" className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1.5 bg-indigo-600 rounded-full" />
                <h2 className="text-4xl font-black text-gray-900">وسيلة النقل</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                <div className="space-y-8">
                   <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
                      <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Bus className="w-8 h-8" />
                      </div>
                      <div className="space-y-3">
                         <h3 className="text-2xl font-black text-gray-900">حافلة الرحلة</h3>
                         <p className="text-gray-500 font-medium leading-relaxed">
                            نضمن لك رحلة مريحة مع أحدث الحافلات المزودة بكابلات شحن للشاشات وتكييف مركزي ومقاعد واسعة قابلة للطي.
                         </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         {[
                           { label: 'عدد المقاعد', val: trip.transportationType === 'bus-48' ? '48' : trip.transportationType === 'minibus-28' ? '28' : '14', color: 'indigo' },
                           { label: 'التكييف', val: 'متوفر', color: 'emerald' },
                           { label: 'شواحن USB', val: 'متوفر', color: 'orange' },
                           { label: 'شبكة WiFi', val: 'متوفر', color: 'blue' },
                         ].map((item, idx) => (
                           <div key={idx} className={`p-4 rounded-2xl border bg-gray-50/50 flex flex-col gap-1`}>
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{item.label}</span>
                              <span className="font-bold text-zinc-900">{item.val}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   {trip.transportationImages && trip.transportationImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {trip.transportationImages.map((img, idx) => (
                          <div key={idx} className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-zinc-100 group shadow-lg">
                             <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          </div>
                        ))}
                      </div>
                   )}
                </div>

                <div className="bg-white rounded-[3rem] p-10 border border-zinc-100 shadow-2xl shadow-zinc-200/50 flex flex-col items-center">
                   <div className="w-full text-center space-y-2 mb-10">
                      <h3 className="text-2xl font-black text-gray-900">مخطط المقاعد</h3>
                      <p className="text-sm font-bold text-zinc-400 uppercase">توزيع الركاب الافتراضي</p>
                   </div>
                   <BusSeatLayout 
                      type={trip.transportationType || 'bus-50'} 
                      bookedSeats={trip.seatBookings || []} 
                   />
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* 6. Included & Excluded Services */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-emerald-50/50 rounded-[2.5rem] p-10 border border-emerald-100 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-900">ما هو مشمول؟</h3>
                </div>
                <ul className="space-y-4">
                  {trip.includedServices.map((service, index) => (
                    <li key={index} className="flex items-center gap-4 group">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 transition-all group-hover:scale-150" />
                      <span className="text-gray-700 font-bold text-lg">{service}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-50/50 rounded-[2.5rem] p-10 border border-rose-100 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-rose-900">غير مشمول</h3>
                </div>
                <ul className="space-y-4">
                  {trip.excludedServices.map((service, index) => (
                    <li key={index} className="flex items-center gap-4 group">
                      <div className="h-2 w-2 rounded-full bg-rose-500 transition-all group-hover:scale-150" />
                      <span className="text-gray-700 font-bold text-lg">{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* 7. Meeting Location */}
            <div className="bg-zinc-900 rounded-[3rem] p-10 text-white space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0">
                <MapPin className="w-64 h-64" />
              </div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-xl shadow-orange-900/50">
                     <MapPin className="w-7 h-7" />
                   </div>
                   <div>
                      <h3 className="text-3xl font-black">نقطة التجمع</h3>
                      <p className="text-zinc-400 font-bold">{trip.meetingLocation}</p>
                   </div>
                </div>
                
                <div className="h-64 bg-zinc-800 rounded-[2rem] border border-zinc-700/50 flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-zinc-900 rounded-full border border-zinc-700 animate-pulse">
                    <MapPin className="w-12 h-12 text-orange-600" />
                  </div>
                  <p className="text-zinc-500 font-bold">سيتم إرسال الموقع الدقيق عبر الواتساب فور الحجز</p>
                  <Button variant="outline" className="rounded-xl border-zinc-700 bg-zinc-800 text-white hover:bg-white hover:text-black font-bold">
                    فتح في خرائط جوجل
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
             <div className="sticky top-28 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pl-1">
                {/* User Assigned Seat - New Badge */}
                {user && trip.seatBookings && trip.seatBookings.some(s => 
                  s.userId === user.id ||
                  s.passengerName.toLowerCase().includes(user.fullName?.toLowerCase() || "") ||
                  s.passengerName.toLowerCase().includes(user.firstName?.toLowerCase() || "")
                ) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-200 overflow-hidden relative group"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                      <Armchair className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                      <Badge className="bg-indigo-500 text-white border-0 mb-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">مقاعدك في الرحلة</Badge>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-indigo-100 text-xs font-bold mb-1">أرقام المقاعد المخصصة لك</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                             {trip.seatBookings
                               .filter(s => 
                                  s.userId === user.id ||
                                  s.passengerName.toLowerCase().includes(user.fullName?.toLowerCase() || "") ||
                                  s.passengerName.toLowerCase().includes(user.firstName?.toLowerCase() || "")
                               )
                               .map(s => (
                                  <div key={s.seatNumber} className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                                     <span className="text-2xl font-black">{s.seatNumber}</span>
                                     <p className="text-[8px] font-bold opacity-75">{s.passengerName}</p>
                                  </div>
                               ))
                             }
                          </div>
                        </div>
                        <Armchair className="w-8 h-8 text-indigo-400 opacity-50" />
                      </div>
                    </div>
                  </motion.div>
                )}

               <BookingCard trip={trip} company={company} />
               
             </div>
          </div>
        </div>
      </main>

      <Footer />
      {company && trip && (
        <ChatWidget 
          companyId={company.id}
          companyName={company.name}
          companyLogo={company.logo}
          tripId={trip.id}
          tripTitle={trip.title}
        />
      )}
    </div>
  );
};

export default TripDetailsPage;
