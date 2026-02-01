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
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TripDetailsPage = () => {
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
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image Slider */}
            <div className="relative h-96 md:h-[500px] rounded-3xl overflow-hidden group">
              <img
                src={trip.images[currentImageIndex]}
                alt={trip.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Image Navigation */}
              {trip.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {trip.images.map((_, index) => (
                      <button
                        key={index}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex 
                            ? 'w-8 bg-white' 
                            : 'w-2 bg-white/50'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Trip Header */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Link to={`/companies/${company.id}`}>
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer transition-colors px-4 py-1.5 rounded-full shadow-sm">
                    {company.name}
                  </Badge>
                </Link>
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {trip.destination}
                </Badge>
                {trip.season && (
                  <Badge variant="outline" className="gap-1 border-blue-200 text-blue-700 bg-blue-50">
                    {trip.season === 'winter' ? '❄️ شتاء' :
                     trip.season === 'summer' ? '☀️ صيف' :
                     trip.season === 'fall' ? '🍂 خريف' :
                     trip.season === 'spring' ? '🌸 ربيع' : trip.season}
                  </Badge>
                )}
                {trip.difficulty && (
                  <Badge variant="secondary">
                    {trip.difficulty}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {trip.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{trip.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-gray-900">{trip.rating}</span>
                  <span className="text-sm">({trip.likes} إعجاب)</span>
                </div>
                {trip.startDate && (
                   <div className="flex items-center gap-2">
                     <Calendar className="h-5 w-5" />
                     <span>
                       {new Date(trip.startDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                     </span>
                   </div>
                )}
                {trip.maxGroupSize && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>حتى {trip.maxGroupSize} شخص</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Trip Overview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">نظرة عامة</h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                {trip.fullDescription}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-[2rem] p-6 border border-zinc-100 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${company.color} p-0.5 shadow-lg`}>
                   <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                      {company.logo.startsWith('http') ? (
                        <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-black text-gray-900">{company.logo}</span>
                      )}
                   </div>
                </div>
                <div>
                   <h3 className="font-black text-gray-900 text-xl">{company.name}</h3>
                   <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-bold text-gray-600">{company.rating} تقييم</span>
                   </div>
                </div>
              </div>
              <Link to={`/companies/${company.id}`}>
                <Button variant="outline" className="rounded-xl font-bold border-zinc-200 hover:bg-zinc-900 hover:text-white transition-all px-6">
                  عرض ملف الشركة
                </Button>
              </Link>
            </div>

            <Separator />

            {/* Itinerary */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-orange-500 rounded-full" />
                <h2 className="text-3xl font-bold text-gray-900">البرنامج اليومي</h2>
              </div>
              <ItineraryTimeline itinerary={trip.itinerary} />
            </div>

            <Separator />

            {/* Included & Excluded Services */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Included */}
              <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  الخدمات المشمولة
                </h3>
                <ul className="space-y-3">
                  {trip.includedServices.map((service, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-none mt-0.5" />
                      <span className="text-gray-700">{service}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Excluded */}
              <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-red-600" />
                  الخدمات غير المشمولة
                </h3>
                <ul className="space-y-3">
                  {trip.excludedServices.map((service, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600 flex-none mt-0.5" />
                      <span className="text-gray-700">{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            {/* Meeting Location */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-600" />
                نقطة التجمع
              </h3>
              <p className="text-gray-700 text-lg">{trip.meetingLocation}</p>
              <div className="mt-4 h-48 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
                {/* Placeholder for map - can be integrated with Google Maps later */}
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>خريطة الموقع</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <BookingCard trip={trip} company={company} sticky={true} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TripDetailsPage;
