import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Heart,
  Share2,
  Bookmark,
  Star,
  Users,
  DollarSign,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripComments from "@/components/TripComments";
import { egyptTrips } from "@/lib/trips-data";
import { useToast } from "@/hooks/use-toast";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import { useEffect } from 'react';
import L from "leaflet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions.map(([lat, lng]) => [lat, lng])));
    } else if (positions.length === 1) {
      map.setView(positions[0], 13);
    }
    // eslint-disable-next-line
  }, [positions.length]);
  return null;
}

const TripDetail = () => {
  const { id } = useParams();
  const trip = egyptTrips.find((t) => t.id === id);
  const { toast } = useToast();

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(trip?.likes || 0);
  const [savesCount, setSavesCount] = useState(trip?.saves || 0);
  const [dialogActivityIdx, setDialogActivityIdx] = useState<number | null>(null);
  const [dialogRestaurantIdx, setDialogRestaurantIdx] = useState<number | null>(null);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    toast({
      title: isLiked ? "تم إلغاء الإعجاب" : "تم الإعجاب بالرحلة",
      description: isLiked ? "" : "يمكنك العثور عليها في قائمة المفضلات",
    });
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    setSavesCount((prev) => (isSaved ? prev - 1 : prev + 1));
    toast({
      title: isSaved ? "تم إلغاء الحفظ" : "تم حفظ الرحلة",
      description: isSaved ? "" : "يمكنك العثور عليها في قائمة المحفوظات",
    });
  };

  const handleUnauthenticatedLike = () => {
    toast({
      title: "تسجيل الدخول مطلوب",
      description: "يجب تسجيل الدخول للإعجاب بالرحلات",
      variant: "destructive",
    });
  };

  const handleUnauthenticatedSave = () => {
    toast({
      title: "تسجيل الدخول مطلوب",
      description: "يجب تسجيل الدخول لحفظ الرحلات",
      variant: "destructive",
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip?.title,
          text: trip?.description,
          url: url,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "تم نسخ الرابط",
        description: "يمكنك مشاركة الرابط الآن",
      });
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">الرحلة غير موجودة</h1>
          <Button onClick={() => window.history.back()}>العودة</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pb-20">
        {/* Hero Image */}
        <div className="relative h-[60vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-10" />
          <img
            src={trip.image}
            alt={trip.title}
            className="w-full h-full object-cover"
          />

          {/* Floating Actions */}
          <div className="absolute top-6 left-6 z-20 flex gap-3">
            {/* Like Button */}
            <SignedIn>
              <Button
                variant="secondary"
                size="icon"
                className={`transition-all duration-300 bg-red-500/80 text-white hover:bg-red-600 shadow-md hover:scale-110 ${
                  isLiked ? "bg-red-600 scale-110" : ""
                }`}
                onClick={handleLike}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isLiked ? "fill-white" : "fill-transparent"
                  }`}
                />
              </Button>
            </SignedIn>
            
            <SignedOut>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="transition-all duration-300 bg-red-500/80 text-white hover:bg-red-600 shadow-md hover:scale-110"
                      onClick={handleUnauthenticatedLike}
                    >
                      <Heart className="h-5 w-5 fill-transparent" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تسجيل الدخول مطلوب</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SignedOut>

            {/* Share Button */}
            <Button
              variant="secondary"
              size="icon"
              className="transition-all duration-300 bg-blue-500/80 text-white hover:bg-blue-600 shadow-md hover:scale-110"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>

            {/* Save Button */}
            <SignedIn>
              <Button
                variant="secondary"
                size="icon"
                className={`transition-all duration-300 bg-purple-500/80 text-white hover:bg-purple-600 shadow-md hover:scale-110 ${
                  isSaved ? "bg-purple-600 scale-110" : ""
                }`}
                onClick={handleSave}
              >
                <Bookmark
                  className={`h-5 w-5 ${
                    isSaved ? "fill-white" : "fill-transparent"
                  }`}
                />
              </Button>
            </SignedIn>
            
            <SignedOut>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="transition-all duration-300 bg-purple-500/80 text-white hover:bg-purple-600 shadow-md hover:scale-110"
                      onClick={handleUnauthenticatedSave}
                    >
                      <Bookmark className="h-5 w-5 fill-transparent" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تسجيل الدخول مطلوب</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SignedOut>
          </div>

          {/* Stats Badge */}
          <div className="absolute top-6 right-6 z-20 bg-background/80 backdrop-blur rounded-full px-4 py-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-primary" />
                {likesCount}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="h-4 w-4 text-secondary" />
                {savesCount}
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-20 relative z-20 space-y-6">
          <Card className="shadow-float-lg animate-slide-up">
            <CardContent className="p-8">
              {/* Title & Rating */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-3">
                  <h1 className="text-4xl font-bold text-gradient">
                    {trip.title}
                  </h1>
                  <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 fill-primary text-primary" />
                    <span className="text-xl font-bold">{trip.rating}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-secondary" />
                    <span className="font-medium">{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>{trip.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span>{trip.budget}</span>
                  </div>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-4 pb-6 mb-6 border-b border-border">
                <Link
                  to={`/profile/${trip.author.replace(/\s+/g, "-")}`}
                  className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center text-white font-bold">
                    {trip.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{trip.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.authorFollowers.toLocaleString("ar-EG")} متابع
                    </p>
                  </div>
                </Link>
                <Button variant="outline" className="mr-auto">
                  متابعة
                </Button>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">عن الرحلة</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {trip.description}
                </p>
              </div>

              {/* Activities */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  الأنشطة والمعالم التى تم زيارتها
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {trip.activities.map((activity, index) => (
                    <div
                      key={index}
                      className="relative flex flex-col gap-2 p-4 bg-secondary-light rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{activity.name}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {activity.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={activity.name}
                            className="h-20 w-28 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                      {/* Show on Map Button -> opens modal on click */}
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full ml-2"
                          onClick={() => setDialogActivityIdx(index)}
                        >
                          عرض على الخريطة
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile/Modal map for activity */}
              <Dialog open={dialogActivityIdx !== null} onOpenChange={(o) => !o && setDialogActivityIdx(null)}>
                <DialogContent className="sm:max-w-[720px]">
                  <DialogHeader>
                    <DialogTitle>موقع النشاط على الخريطة</DialogTitle>
                  </DialogHeader>
                  {dialogActivityIdx !== null && (
                    <div className="w-full h-[50vh] rounded-xl overflow-hidden">
                      <MapContainer
                        center={[trip.activities[dialogActivityIdx].coordinates.lat, trip.activities[dialogActivityIdx].coordinates.lng]}
                        zoom={15}
                        style={{ width: "100%", height: "100%" }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=hCkkPcZUo3rUCAmU8HwE"
                        />
                        <Marker position={[trip.activities[dialogActivityIdx].coordinates.lat, trip.activities[dialogActivityIdx].coordinates.lng]} />
                      </MapContainer>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Show itinerary by day */}
              {trip.days && trip.days.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">
                    الجدول اليومي للرحلة
                  </h2>
                  <div className="space-y-6">
                    {trip.days.map((day, dayIdx) => (
                      <div key={dayIdx} className="bg-muted/30 rounded-xl p-4">
                        <h3 className="text-xl font-semibold mb-3">
                          {day.title}
                        </h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {day.activities.map((actIdx) => {
                            const activity = trip.activities[actIdx];
                            return (
                              <li
                                key={activity.name}
                                className="flex gap-4 items-start bg-white rounded-lg p-3 shadow"
                              >
                                {activity.images[0] && (
                                  <img
                                    src={activity.images[0]}
                                    alt={activity.name}
                                    className="w-24 h-16 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <div className="font-bold">
                                    {activity.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    الإحداثيات:{" "}
                                    {activity.coordinates.lat.toFixed(4)},{" "}
                                    {activity.coordinates.lng.toFixed(4)}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map Preview */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">الموقع</h2>
                <div className="h-64 bg-muted rounded-xl overflow-hidden flex items-center justify-center relative">
                  {trip.activities && trip.activities.length > 0 ? (
                    <MapContainer
                      center={[trip.activities[0].coordinates.lat, trip.activities[0].coordinates.lng]}
                      zoom={13}
                      scrollWheelZoom={true}
                      style={{ height: "100%", width: "100%" }}
                      className="z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=hCkkPcZUo3rUCAmU8HwE"
                      />
                      {/* Auto-fit map bounds to all activity positions */}
                      <FitBounds positions={trip.activities.map((a) => [a.coordinates.lat, a.coordinates.lng])} />
                      {/* Draw route line */}
                      <Polyline
                        positions={trip.activities.map((a) => [a.coordinates.lat, a.coordinates.lng])}
                        color="#ff6b35"
                        weight={4}
                        opacity={0.7}
                      />
                      {/* Markers for activities */}
                      {trip.activities.map((activity, index) => (
                        <Marker
                          key={index}
                          position={[activity.coordinates.lat, activity.coordinates.lng]}
                          // Custom icon with day number
                          icon={L.divIcon({
                            className: "custom-marker-label",
                            html: `<div style='background:#fff;border:2px solid #ff6b35;border-radius:100%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;color:#ff6b35;'>${index+1}</div>`
                          })}
                        >
                          <Popup>
                            <div style={{ minWidth: 150 }}>
                              <strong>{activity.name}</strong>
                              <div className="mt-2">
                                {activity.images[0] && (
                                  <img
                                    src={activity.images[0]}
                                    alt={activity.name}
                                    className="rounded"
                                    style={{ width: "120px" }}
                                  />
                                )}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  ) : (
                    <div className="text-center w-full">
                      لا توجد بيانات موقع للأنشطة
                    </div>
                  )}
                </div>
              </div>

              {/* Food & Restaurants */}
              {trip.foodAndRestaurants &&
                trip.foodAndRestaurants.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">
                      المطاعم والأكلات المميزة
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {trip.foodAndRestaurants.map((place, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-xl p-4 bg-secondary-light flex flex-col items-center text-center shadow"
                        >
                          <img
                            src={place.image}
                            alt={place.name}
                            className="w-36 h-24 object-cover rounded mb-2 border"
                          />
                          <div className="font-bold text-lg mb-1">
                            {place.name}
                          </div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={
                                  i < Math.round(place.rating)
                                    ? "fill-primary text-primary"
                                    : "text-gray-300"
                                }
                                size={18}
                              />
                            ))}
                            <span className="text-sm text-muted-foreground">
                              ({place.rating})
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {place.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Modal map for restaurant */}
              <Dialog open={dialogRestaurantIdx !== null} onOpenChange={(o) => !o && setDialogRestaurantIdx(null)}>
                <DialogContent className="sm:max-w-[720px]">
                  <DialogHeader>
                    <DialogTitle>موقع المطعم على الخريطة</DialogTitle>
                  </DialogHeader>
                  {dialogRestaurantIdx !== null && trip.activities[0] && (
                    <div className="w-full h-[50vh] rounded-xl overflow-hidden">
                      <MapContainer
                        center={[trip.activities[0].coordinates.lat, trip.activities[0].coordinates.lng]}
                        zoom={15}
                        style={{ width: "100%", height: "100%" }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer url="https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=hCkkPcZUo3rUCAmU8HwE" />
                        <Marker position={[trip.activities[0].coordinates.lat, trip.activities[0].coordinates.lng]} />
                      </MapContainer>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="flex-1">
                  احجز هذه الرحلة
                </Button>
                <Button size="lg" variant="outline" className="flex-1">
                  حفظ كقالب
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <TripComments comments={trip.comments} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TripDetail;
