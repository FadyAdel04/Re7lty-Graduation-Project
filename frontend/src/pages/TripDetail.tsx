import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Loader2,
  Clock,
  Utensils,
  Plus,
  Maximize2,
  Quote,
  Navigation,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripComments from "@/components/TripComments";
import { egyptTrips, Comment } from "@/lib/trips-data";
import { getTrip, toggleTripLove, toggleFollowUser, toggleTripSave } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SignedIn, SignedOut, SignInButton, useUser, useAuth } from "@clerk/clerk-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit2, Trash2 } from "lucide-react";
import { deleteTrip } from "@/lib/api";
import TripSkeletonLoader from "@/components/TripSkeletonLoader";

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

function BusTravelAnimator({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!positions || positions.length < 2) return;

    const busIcon = L.divIcon({
      className: "bus-travel-icon",
      html:
        "<div style='transform: translate(-50%, -50%); font-size: 20px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4))'>🚌</div>",
    });

    const marker = L.marker(positions[0], { icon: busIcon }).addTo(map);

    let segmentIndex = 0;
    let t = 0;
    let rafId: number;
    const stepIncrement = 0.005; // speed factor (higher = faster)

    const animate = () => {
      if (segmentIndex >= positions.length - 1) {
        cancelAnimationFrame(rafId);
        return;
      }

      const [fromLat, fromLng] = positions[segmentIndex];
      const [toLat, toLng] = positions[segmentIndex + 1];

      t += stepIncrement;
      if (t >= 1) {
        t = 0;
        segmentIndex += 1;
        if (segmentIndex >= positions.length - 1) {
          marker.setLatLng(positions[positions.length - 1]);
          cancelAnimationFrame(rafId);
          return;
        }
      }

      const lat = fromLat + (toLat - fromLat) * t;
      const lng = fromLng + (toLng - fromLng) * t;
      marker.setLatLng([lat, lng]);

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      map.removeLayer(marker);
    };
  }, [map, positions]);

  return null;
}

const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: clerkUser } = useUser();
  const { isSignedIn, getToken } = useAuth();

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);
const [authorFollowers, setAuthorFollowers] = useState(0);
const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
const [loveLoading, setLoveLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
const [followLoading, setFollowLoading] = useState(false);
  const [dialogActivityIdx, setDialogActivityIdx] = useState<number | null>(null);
  const [dialogRestaurantIdx, setDialogRestaurantIdx] = useState<number | null>(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user is the owner
  const isOwner = trip?.ownerId && clerkUser?.id && trip.ownerId === clerkUser.id;

  // Handle delete trip
  const handleDeleteTrip = async () => {
    if (!id || !isSignedIn) return;
    
    setIsDeleting(true);
    try {
      const token = await getToken();
      await deleteTrip(id, token || undefined);
      
      toast({
        title: "تم الحذف",
        description: "تم حذف الرحلة بنجاح",
      });
      
      // Navigate to timeline or home after deletion
      navigate("/timeline");
    } catch (error: any) {
      console.error("Error deleting trip:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل حذف الرحلة",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Fetch trip from API or fallback to static data
useEffect(() => {
  const fetchTrip = async () => {
    if (!id) {
      setError('Trip ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let token: string | undefined;
      if (isSignedIn) {
        token = await getToken();
      }

      try {
        const apiTrip = await getTrip(id, token || undefined);
        const transformedTrip = {
          id: apiTrip._id || apiTrip.id,
          _id: apiTrip._id,
          title: apiTrip.title,
          destination: apiTrip.destination,
          city: apiTrip.city || apiTrip.destination,
          duration: apiTrip.duration,
          rating: apiTrip.rating || 4.5,
          image: apiTrip.image || '',
          author: apiTrip.author || 'مستخدم',
          authorFollowers: apiTrip.authorFollowers || 0,
          ownerId: apiTrip.ownerId,
          likes: apiTrip.likes || 0,
          weeklyLikes: apiTrip.weeklyLikes || 0,
          saves: apiTrip.saves || 0,
          shares: apiTrip.shares || 0,
          description: apiTrip.description || '',
          season: apiTrip.season || '',
          budget: apiTrip.budget || '',
          activities: apiTrip.activities || [],
          days: apiTrip.days || [],
          foodAndRestaurants: apiTrip.foodAndRestaurants || [],
          hotels: apiTrip.hotels || [],
          comments: apiTrip.comments || [],
          postedAt: apiTrip.postedAt || new Date().toISOString(),
        };
        setTrip(transformedTrip);
        setLikesCount(transformedTrip.likes);
        setSavesCount(transformedTrip.saves);
        setAuthorFollowers(transformedTrip.authorFollowers || 0);
        setIsLiked(Boolean(apiTrip.viewerLoved));
        setIsFollowingAuthor(Boolean(apiTrip.viewerFollowsAuthor));
        setIsSaved(Boolean(apiTrip.viewerSaved));
      } catch (apiError: any) {
        console.log('API trip not found, trying static data:', apiError.message);
        const staticTrip = egyptTrips.find((t) => t.id === id);
        if (staticTrip) {
          setTrip(staticTrip);
          setLikesCount(staticTrip.likes);
          setSavesCount(staticTrip.saves);
          setAuthorFollowers(staticTrip.authorFollowers || 0);
          setIsLiked(false);
          setIsFollowingAuthor(false);
        setIsSaved(false);
        } else {
          setError('Trip not found');
        }
      }
    } catch (err: any) {
      console.error('Error fetching trip:', err);
      setError(err.message || 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  fetchTrip();
}, [id, isSignedIn, getToken]);

  const handleLike = async () => {
    if (!trip) return;

    // Fallback for static demo trips that don't exist in the database
    if (!trip._id) {
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
      toast({
        title: isLiked ? "تم إلغاء الإعجاب" : "تم الإعجاب بالرحلة",
        description: !isLiked ? "يمكنك العثور عليها في قائمة المفضلات" : undefined,
      });
      return;
    }
    if (!isSignedIn) {
      handleUnauthenticatedLike();
      return;
    }

    try {
      setLoveLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }
      const result = await toggleTripLove(String(trip._id || trip.id), token);
      setIsLiked(result.loved);
      setLikesCount(result.likes);
      toast({
        title: result.loved ? "تم الإعجاب بالرحلة" : "تم إلغاء الإعجاب",
        description: result.loved ? "يمكنك العثور عليها في قائمة المفضلات" : undefined,
      });
    } catch (error: any) {
      console.error("Error updating love state:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر تحديث حالة الإعجاب",
        variant: "destructive",
      });
    } finally {
      setLoveLoading(false);
    }
  };

  const handleSave = async () => {
    if (!trip) return;

    if (!trip._id) {
      const nextSaved = !isSaved;
      setIsSaved(nextSaved);
      setSavesCount((prev) => (nextSaved ? prev + 1 : Math.max(0, prev - 1)));
      toast({
        title: nextSaved ? "تم حفظ الرحلة" : "تم إلغاء الحفظ",
        description: nextSaved ? "يمكنك العثور عليها في قائمة المحفوظات" : "",
      });
      return;
    }

    if (!isSignedIn) {
      handleUnauthenticatedSave();
      return;
    }

    try {
      setSaveLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }
      const result = await toggleTripSave(String(trip._id), token);
      setIsSaved(result.saved);
      setSavesCount(result.saves);
      toast({
        title: result.saved ? "تم حفظ الرحلة" : "تم إلغاء الحفظ",
        description: result.saved ? "يمكنك العثور عليها في قائمة المحفوظات" : "",
      });
    } catch (error: any) {
      console.error("Error updating save state:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر تحديث حالة الحفظ",
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
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

  const handleFollowAuthor = async () => {
    if (!trip?.ownerId) return;
    if (!isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لمتابعة الرحلات",
        variant: "destructive",
      });
      return;
    }

    try {
      setFollowLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }
      const response = await toggleFollowUser(trip.ownerId, token);
      setIsFollowingAuthor(response.following);
      setAuthorFollowers(response.followers || 0);
      toast({
        title: response.following ? "تمت المتابعة" : "تم إلغاء المتابعة",
        description: response.following
          ? "ستظهر تحديثات هذا العضو في متابعاتك"
          : undefined,
      });
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر تحديث حالة المتابعة",
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCommentAdded = (comment: Comment) => {
    setTrip((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: [comment, ...(prev.comments || [])],
      };
    });
  };

  const handleCommentUpdated = (commentId: string, changes: Partial<Comment>) => {
    setTrip((prev) => {
      if (!prev) return prev;
      if (!Array.isArray(prev.comments)) return prev;
      return {
        ...prev,
        comments: prev.comments.map((c: Comment) =>
          c.id === commentId ? { ...c, ...changes } : c
        ),
      };
    });
  };

  const handleCommentDeleted = (commentId: string) => {
    setTrip((prev) => {
      if (!prev) return prev;
      const updatedComments = (prev.comments || []).filter((c: Comment) => c.id !== commentId);
      return {
        ...prev,
        comments: updatedComments,
      };
    });
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Header />
        <TripSkeletonLoader variant="detail" />
        <Footer />
      </>
    );
  }

  // Error state or trip not found
  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">الرحلة غير موجودة</h1>
          <p className="text-muted-foreground mb-6">{error || 'تعذر العثور على الرحلة'}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/timeline')}>العودة إلى الخط الزمني</Button>
            <Button variant="outline" onClick={() => window.history.back()}>رجوع</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Collect all images for the gallery
  const galleryImages = [
    trip.image,
    ...trip.activities.flatMap((a: any) => a.images || [])
  ].filter(Boolean).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-cairo text-right pb-20" dir="rtl">
      <Header />

      {/* 1. Immersive Hero Background */}
      <div className="relative h-[45vh] w-full overflow-hidden">
         <img src={trip.image} className="w-full h-full object-cover" alt={trip.title} />
         <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
         
         <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10 pt-20">
            <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg max-w-4xl leading-tight">
               {trip.title}
            </h1>
            <div className="flex gap-3 mt-6">
               <Badge className="bg-orange-600 text-white border-none px-6 py-2 rounded-xl font-black">{trip.city}</Badge>
               <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 px-6 py-2 rounded-xl font-black">
                  {trip.season === 'winter' ? '❄️ الشتاء' : trip.season === 'summer' ? '☀️ الصيف' : trip.season === 'fall' ? '🍂 خريف' : '🌸 الربيع'}
               </Badge>
            </div>
         </div>
      </div>

      {/* 2. Floating Stats Island */}
      <div className="container mx-auto px-4 -mt-12 relative z-30">
         <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-2">
            <div className="grid grid-cols-2 md:grid-cols-4 items-center">
               <div className="p-6 text-center border-l md:border-l border-gray-100 last:border-0">
                  <span className="block text-gray-400 text-xs font-black uppercase mb-1">المدة الزمني</span>
                  <span className="text-2xl font-black text-indigo-600 flex items-center justify-center gap-2"><Clock className="w-5 h-5" /> {trip.duration}</span>
               </div>
               <div className="p-6 text-center border-l md:border-l border-gray-100 last:border-0">
                  <span className="block text-gray-400 text-xs font-black uppercase mb-1">الميزانية</span>
                  <span className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-2"><DollarSign className="w-5 h-5" /> {trip.budget}</span>
               </div>
               <div className="p-6 text-center border-l md:border-l border-gray-100 last:border-0">
                  <span className="block text-gray-400 text-xs font-black uppercase mb-1">التقييم العام</span>
                  <span className="text-2xl font-black text-amber-500 flex items-center justify-center gap-2"><Star className="w-5 h-5 fill-current" /> {trip.rating}</span>
               </div>
               <div className="p-4">
                  <Button onClick={handleShare} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black gap-2 shadow-lg shadow-indigo-100 transition-all">
                     <Share2 className="w-5 h-5" /> شارك التجربة
                  </Button>
               </div>
            </div>
         </Card>
      </div>

      {/* 3. Main Dashboard Layout */}
      <div className="container mx-auto px-4 mt-12">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (65%): Content & Timeline */}
            <div className="lg:col-span-8 space-y-8">
               
               {/* About Trip */}
               <Card className="border-0 shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                  <div className="p-10 space-y-6">
                     <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                        نظرة عامة على المغامرة
                     </h2>
                     <p className="text-xl text-gray-500 leading-relaxed font-medium">
                        {trip.description}
                     </p>
                  </div>
               </Card>

               {/* Timeline Activities */}
               <div className="space-y-6">
                  <h2 className="text-2xl font-black text-gray-900 px-4">خط السير <span className="text-indigo-600">التفصيلي</span></h2>
                  <div className="space-y-4">
                     {trip.days.map((day: any, idx: number) => (
                        <Card key={idx} className="border-0 shadow-lg rounded-[2.5rem] bg-white overflow-hidden group">
                           <div className="p-8">
                              <div className="flex items-center gap-6 mb-8">
                                 <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-2xl">
                                    {idx + 1}
                                 </div>
                                 <h3 className="text-2xl font-black text-gray-900">{day.title || `اليوم ${idx + 1}`}</h3>
                              </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {day.activities
                                   .filter((actIdx: number) => actIdx >= 0 && actIdx < trip.activities.length)
                                   .map((actIdx: number) => {
                                      const activity = trip.activities[actIdx];
                                      return (
                                        <div 
                                          key={actIdx} 
                                          onClick={() => setDialogActivityIdx(actIdx)}
                                          className="p-4 rounded-[2rem] bg-gray-50/50 border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 transition-all flex items-center gap-4 cursor-pointer group/item"
                                        >
                                           <div className="w-20 h-16 rounded-2xl overflow-hidden shadow-sm bg-white shrink-0">
                                              <img src={activity.images?.[0]} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                           </div>
                                           <span className="font-black text-gray-700 text-lg uppercase line-clamp-1">{activity.name}</span>
                                        </div>
                                      );
                                   })}
                              </div>
                           </div>
                        </Card>
                     ))}
                  </div>
               </div>

               {/* Place of Stay (Hotels) */}
               {trip.hotels && trip.hotels.length > 0 && (
                 <div className="space-y-6">
                    <h2 className="text-2xl font-black text-gray-900 px-4">أماكن الإقامة</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {trip.hotels.map((hotel: any, idx: number) => (
                          <Card key={idx} className="border-0 shadow-lg rounded-[2rem] bg-white overflow-hidden p-4">
                             <div className="flex gap-4 items-center">
                                <img src={hotel.image} className="w-24 h-24 rounded-2xl object-cover" />
                                <div>
                                   <h4 className="font-black text-gray-800">{hotel.name}</h4>
                                   <div className="flex items-center gap-1 text-amber-500 mt-1">
                                      <Star className="w-3 h-3 fill-current" /> <span className="text-xs font-black">{hotel.rating}</span>
                                   </div>
                                </div>
                             </div>
                          </Card>
                       ))}
                    </div>
                 </div>
               )}

               {/* Food & Restaurants */}
               {trip.foodAndRestaurants && trip.foodAndRestaurants.length > 0 && (
                 <div className="space-y-6">
                    <h2 className="text-2xl font-black text-gray-900 px-4">تجارب الطعام</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {trip.foodAndRestaurants.map((food: any, idx: number) => (
                          <Card key={idx} className="border-0 shadow-lg rounded-[2rem] bg-white overflow-hidden p-4">
                             <div className="flex gap-4 items-center">
                                <img src={food.image} className="w-24 h-24 rounded-2xl object-cover" />
                                <div>
                                   <h4 className="font-black text-gray-800">{food.name}</h4>
                                   <Badge className="bg-orange-50 text-orange-600 border-none mt-1">{food.rating} ⭐</Badge>
                                </div>
                             </div>
                          </Card>
                       ))}
                    </div>
                 </div>
               )}
            </div>

            {/* Right Column (35%): Interactive Widgets */}
            <div className="lg:col-span-4 space-y-8 sticky top-24">
               
               {/* Map Widget */}
               <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-indigo-900 overflow-hidden text-white relative">
                  <div className="h-[350px] relative">
                      <div 
                        onClick={() => setShowFullMap(true)}
                        className="absolute top-4 right-4 bg-indigo-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-sm font-black flex items-center gap-2 cursor-pointer hover:bg-indigo-800 transition-colors z-[1001] shadow-lg"
                      >
                        <Maximize2 className="w-4 h-4 text-orange-400" /> عرض الخريطة المكبرة
                      </div>
                      {trip.activities?.[0]?.coordinates ? (
                        <MapContainer
                           center={[trip.activities[0].coordinates.lat, trip.activities[0].coordinates.lng]}
                           zoom={13}
                           scrollWheelZoom={false}
                           style={{ height: "100%", width: "100%" }}
                        >
                           <TileLayer url="https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=hCkkPcZUo3rUCAmU8HwE" />
                           <FitBounds positions={trip.activities.filter((a: any) => a.coordinates).map((a: any) => [a.coordinates.lat, a.coordinates.lng])} />
                           
                           {/* Route Line */}
                           <Polyline 
                              positions={trip.activities.filter((a: any) => a.coordinates).map((a: any) => [a.coordinates.lat, a.coordinates.lng])}
                              color="#4F46E5"
                              weight={3}
                              opacity={0.6}
                              dashArray="10, 10"
                           />
                           
                           {/* Bus Animation */}
                           <BusTravelAnimator positions={trip.activities.filter((a: any) => a.coordinates).map((a: any) => [a.coordinates.lat, a.coordinates.lng])} />

                           {trip.activities.map((act: any, idx: number) => act.coordinates && (
                             <Marker 
                               key={idx} 
                               position={[act.coordinates.lat, act.coordinates.lng]}
                               eventHandlers={{
                                 click: () => {
                                   setDialogActivityIdx(idx);
                                 },
                               }}
                               icon={L.divIcon({
                                  className: "custom-marker-mini",
                                  html: `<div style='background:white;color:#4F46E5;width:24px;height:24px;border-radius:full;display:flex;align-items:center;justify-content:center;font-weight:900;box-shadow:0 4px 10px rgba(0,0,0,0.3);cursor:pointer'>${idx+1}</div>`
                               })}
                             >
                               <Popup className="font-cairo text-right">
                                  <div className="p-1" dir="rtl">
                                      <h4 className="font-black text-indigo-600 mb-1">{act.name}</h4>
                                      <p className="text-xs text-gray-500 line-clamp-2">{act.description}</p>
                                      <Button 
                                        variant="link" 
                                        className="p-0 h-auto text-orange-500 text-xs font-black mt-2"
                                        onClick={() => setDialogActivityIdx(idx)}
                                      >
                                        عرض التفاصيل
                                      </Button>
                                   </div>
                                </Popup>
                             </Marker>
                           ))}
                        </MapContainer>
                     ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-950 p-10 text-center gap-4">
                           <MapPin className="w-12 h-12 text-indigo-400 opacity-30" />
                           <p className="text-indigo-400 font-bold">الموقع الجغرافي غير متوفر لهذه الرحلة</p>
                        </div>
                     )}
                  </div>
                  <div className="p-8 bg-indigo-800">
                     <h3 className="text-xl font-black mb-2">تتبع المسار</h3>
                     <p className="text-indigo-300 text-sm font-medium leading-relaxed">يمكنك متابعة المسار الجغرافي لهذه الرحلة عبر خرائطنا الذكية المتكاملة.</p>
                  </div>
               </Card>

               {/* Actions Widget */}
               <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-6 space-y-4">
                  <div className="flex gap-4">
                     <SignedIn>
                        <Button 
                          onClick={handleLike} 
                          disabled={loveLoading}
                          className={cn(
                            "h-16 flex-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all",
                            isLiked ? "bg-red-500 text-white shadow-lg shadow-red-100" : "bg-red-50 text-red-500 hover:bg-red-100"
                          )}
                        >
                           <div className="flex items-center gap-2">
                             <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                             <span className="text-lg font-black">{likesCount}</span>
                           </div>
                           <span className="text-xs font-black uppercase">أعجبني</span>
                        </Button>
                     </SignedIn>
                     <SignedIn>
                        <Button 
                          onClick={handleSave} 
                          disabled={saveLoading}
                          className={cn(
                            "h-16 flex-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all",
                            isSaved ? "bg-amber-500 text-white shadow-lg shadow-amber-100" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          )}
                        >
                           <div className="flex items-center gap-2">
                             <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
                             <span className="text-lg font-black">{savesCount}</span>
                           </div>
                           <span className="text-xs font-black uppercase">حفظ</span>
                        </Button>
                     </SignedIn>
                  </div>
                  
                  {!isOwner && (
                     <Button 
                       onClick={handleFollowAuthor}
                       disabled={followLoading}
                       className={cn(
                         "w-full h-16 rounded-2xl font-black text-lg transition-all",
                         isFollowingAuthor ? "bg-gray-100 text-gray-500" : "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                       )}
                     >
                        {isFollowingAuthor ? "إلغاء المتابعة" : `متابعة ${trip.author}`}
                     </Button>
                  )}

                  {isOwner && (
                     <div className="flex gap-2">
                        <Button onClick={() => navigate(`/trips/edit/${id}`)} className="h-16 flex-1 rounded-2xl bg-gray-100 text-gray-900 font-black gap-2">
                           <Edit2 className="w-5 h-5" /> تعديل
                        </Button>
                        <Button onClick={() => setShowDeleteDialog(true)} variant="destructive" className="h-16 w-16 rounded-2xl p-0">
                           <Trash2 className="w-6 h-6" />
                        </Button>
                     </div>
                  )}
               </Card>

               {/* Comments Widget */}
               <div className="hidden lg:block">
                  <TripComments
                     tripId={String(trip._id || trip.id)}
                     initialComments={trip.comments || []}
                     onCommentAdded={handleCommentAdded}
                     onCommentUpdated={handleCommentUpdated}
                     onCommentDeleted={handleCommentDeleted}
                     tripOwnerId={trip.ownerId}
                  />
               </div>
            </div>
         </div>

         {/* 4. Full Gallery Section */}
         <section className="mt-16 pt-16 border-t border-gray-200">
            <h2 className="text-3xl font-black text-gray-900 mb-8 px-4 flex items-center gap-3">
               <ImageIcon className="w-8 h-8 text-indigo-600" /> معرض الذكريات
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {[...new Set([
                  trip.image,
                  ...trip.activities.flatMap((a: any) => a.images || []),
                  ...trip.hotels?.map((h: any) => h.image) || [],
                  ...trip.foodAndRestaurants?.map((f: any) => f.image) || []
               ])].filter(Boolean).map((img, i) => (
                  <div key={i} className="aspect-square rounded-3xl overflow-hidden shadow-lg border-4 border-white group transition-transform hover:-rotate-1">
                     <img src={img} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                  </div>
               ))}
            </div>
         </section>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <DialogContent className="rounded-[2.5rem] p-10 max-w-lg font-cairo text-right" dir="rtl">
            <DialogHeader className="space-y-4">
               <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
                  <Trash2 className="w-10 h-10" />
               </div>
               <DialogTitle className="text-3xl font-black text-center">حذف المغامرة؟</DialogTitle>
               <DialogDescription className="text-center text-lg font-bold text-gray-400 leading-relaxed">هل أنت متأكد من حذف هذه التجربة؟ سيختفي كل شيء ولن نتمكن من استعادة الذكريات.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-4 mt-8">
               <Button onClick={handleDeleteTrip} disabled={isDeleting} className="h-16 flex-1 rounded-2xl bg-red-50 text-white font-black text-xl shadow-xl shadow-red-100 truncate">تأكيد الحذف</Button>
               <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="h-16 flex-1 rounded-2xl font-black text-xl border-gray-100">تراجـع</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
      
      {/* Full Map Dialog */}
      <Dialog open={showFullMap} onOpenChange={setShowFullMap}>
         <DialogContent className="max-w-6xl w-[90vw] h-[80vh] p-0 overflow-hidden rounded-[2.5rem] border-0 bg-transparent z-[6000]" dir="rtl">
            <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-white shadow-2xl border-4 border-white">
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="absolute top-6 left-6 z-[6001] bg-white/80 backdrop-blur-md rounded-2xl hover:bg-white transition-all shadow-xl"
                 onClick={() => setShowFullMap(false)}
               >
                  <Plus className="w-6 h-6 rotate-45" />
               </Button>
               
               {trip.activities?.[0]?.coordinates && (
                 <MapContainer
                    center={[trip.activities[0].coordinates.lat, trip.activities[0].coordinates.lng]}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                 >
                    <TileLayer url="https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=hCkkPcZUo3rUCAmU8HwE" />
                    <FitBounds positions={trip.activities.filter((a: any) => a.coordinates).map((a: any) => [a.coordinates.lat, a.coordinates.lng])} />
                    
                    <Polyline 
                       positions={trip.activities.filter((a: any) => a.coordinates).map((a: any) => [a.coordinates.lat, a.coordinates.lng])}
                       color="#4F46E5"
                       weight={4}
                       opacity={0.6}
                       dashArray="10, 15"
                    />
                    
                    <BusTravelAnimator positions={trip.activities.filter((a: any) => a.coordinates).map((a: any) => [a.coordinates.lat, a.coordinates.lng])} />

                    {trip.activities.map((act: any, idx: number) => act.coordinates && (
                      <Marker 
                        key={idx} 
                        position={[act.coordinates.lat, act.coordinates.lng]}
                        icon={L.divIcon({
                           className: "custom-marker-full",
                           html: `<div style='background:white;color:#4F46E5;width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900;box-shadow:0 8px 20px rgba(0,0,0,0.2)'>${idx+1}</div>`
                        })}
                      >
                         <Popup className="font-cairo text-right min-w-[200px]">
                            <div className="p-2 space-y-2" dir="rtl">
                               <div className="w-full h-24 rounded-xl overflow-hidden mb-2">
                                  <img src={act.images?.[0]} className="w-full h-full object-cover" />
                               </div>
                               <h4 className="font-black text-indigo-600 text-lg">{act.name}</h4>
                               <p className="text-sm text-gray-600 leading-relaxed">{act.description}</p>
                               {act.duration && <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none">{act.duration}</Badge>}
                            </div>
                         </Popup>
                      </Marker>
                    ))}
                 </MapContainer>
               )}
            </div>
         </DialogContent>
      </Dialog>

      {/* Place Details Dialog */}
      <Dialog open={dialogActivityIdx !== null} onOpenChange={(open) => !open && setDialogActivityIdx(null)}>
         <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2.5rem] font-cairo text-right" dir="rtl">
            {dialogActivityIdx !== null && trip.activities[dialogActivityIdx] && (
               <div>
                  <div className="h-64 relative bg-gray-100">
                     <img 
                       src={trip.activities[dialogActivityIdx].images?.[0]} 
                       className="w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     <div className="absolute bottom-6 right-6 text-white">
                        <Badge className="bg-orange-500 mb-2 border-none">نشاط ومغامرة</Badge>
                        <h3 className="text-3xl font-black">{trip.activities[dialogActivityIdx].name}</h3>
                     </div>
                  </div>
                  <div className="p-8 space-y-4">
                     <p className="text-lg text-gray-600 leading-relaxed font-bold">
                        {trip.activities[dialogActivityIdx].description}
                     </p>
                     
                     <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-4 rounded-3xl bg-gray-50 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                              <MapPin className="w-5 h-5" />
                           </div>
                           <div>
                              <span className="block text-xs text-gray-400 font-bold">الموقع</span>
                              <span className="font-black text-gray-700">{trip.city}</span>
                           </div>
                        </div>
                        {trip.activities[dialogActivityIdx].duration && (
                           <div className="p-4 rounded-3xl bg-gray-50 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                 <Clock className="w-5 h-5" />
                              </div>
                              <div>
                                 <span className="block text-xs text-gray-400 font-bold">المدة المقدرة</span>
                                 <span className="font-black text-gray-700">{trip.activities[dialogActivityIdx].duration}</span>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                        <Button className="flex-1 h-14 rounded-2xl bg-indigo-600 font-black text-lg shadow-lg shadow-indigo-100" onClick={() => setDialogActivityIdx(null)}>إغلاق التفاصيل</Button>
                     </div>
                  </div>
               </div>
            )}
         </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default TripDetail;
