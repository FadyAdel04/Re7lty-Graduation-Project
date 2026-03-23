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
  Timer,
  Bus,
  Image as ImageIcon,
  Video,
  Play,
  Zap,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripComments from "@/components/TripComments";
import { egyptTrips, Comment as TripComment } from "@/lib/trips-data";
import { getTrip, toggleTripLove, toggleFollowUser, toggleTripSave } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MapboxTripMap } from "@/components/MapboxTripMap";
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
          authorImage: apiTrip.authorImage,
          authorBadge: apiTrip.authorBadge,
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
          postType: apiTrip.postType || 'detailed',
          taggedUsers: apiTrip.taggedUsers || [],
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
        comments: prev.comments.map((c: TripComment) =>
          c.id === commentId ? { ...c, ...changes } : c
        ),
      };
    });
  };

  const handleCommentDeleted = (commentId: string) => {
    setTrip((prev) => {
      if (!prev) return prev;
      const updatedComments = (prev.comments || []).filter((c: TripComment) => c.id !== commentId);
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

  // Collect all images and videos for the gallery
  const galleryImages = [
    trip.image,
    ...trip.activities.flatMap((a: any) => a.images || [])
  ].filter(Boolean);

  const galleryVideos = [
    ...trip.activities.flatMap((a: any) => a.videos || [])
  ].filter(Boolean);

  const isQuickTrip = trip.postType === 'quick';

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-cairo text-right pb-20" dir="rtl">
      <Header />

      {/* 1. Immersive Hero Background */}
      <div className="relative h-[45vh] w-full overflow-hidden">
         <img src={trip.image} className="w-full h-full object-cover" alt={trip.title} loading="eager" />
         <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
         
         <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10 pt-20">
            <div className="flex items-center gap-3 mb-4">
               {isQuickTrip && (
                 <div className="bg-amber-500 text-white px-6 py-2 rounded-r-none rounded-l-2xl font-black text-sm flex items-center gap-2 shadow-2xl animate-pulse relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                   <Zap className="w-5 h-5 fill-white" />
                   <span>بوست سريع ⚡</span>
                 </div>
               )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg max-w-4xl leading-tight">
               {trip.title}
            </h1>
            <div className="flex gap-3 mt-6">
               <Badge className="bg-orange-600 text-white border-none px-6 py-2 rounded-xl font-black text-lg">{trip.city}</Badge>
               {!isQuickTrip && trip.season && (
                 <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 px-6 py-2 rounded-xl font-black text-lg">
                    {trip.season === 'winter' ? '❄️ الشتاء' : trip.season === 'summer' ? '☀️ الصيف' : trip.season === 'fall' ? '🍂 خريف' : '🌸 الربيع'}
                 </Badge>
               )}
            </div>
         </div>
      </div>

      {/* 2. Key Details & Author */}
      <div className="container mx-auto px-4 -mt-12 relative z-30">
         <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-2">
            <div className="grid grid-cols-2 md:grid-cols-5 items-center divide-x divide-x-reverse divide-gray-100">
               
               {/* Author Column */}
               <div className="p-3 pl-6 flex items-center gap-4 h-24">
                  <Link to={`/user/${trip.ownerId}`} className="shrink-0 relative group">
                     <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm ring-2 ring-indigo-50 group-hover:ring-indigo-100 transition-all bg-gray-100">
                        <img 
                          src={trip.authorImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${trip.ownerId || trip.author}`} 
                          alt={trip.author}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                     </div>
                     <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                  </Link>
                  <div className="flex flex-col min-w-0">
                     <span className="text-[10px] text-gray-400 font-black uppercase mb-0.5">رحلة بواسطة</span>
                     <Link to={`/user/${trip.ownerId}`} className="text-gray-900 font-black text-sm hover:text-indigo-600 transition-colors truncate block max-w-[120px]">
                        {trip.author}
                     </Link>
                  </div>
               </div>

               {/* Duration */}
               <div className="p-3 text-center h-24 flex flex-col justify-center">
                  <span className="block text-gray-400 text-[10px] font-black uppercase mb-1">المدة</span>
                  <span className="text-xl font-black text-indigo-600 flex items-center justify-center gap-1.5">
                     <Clock className="w-5 h-5 opacity-80" /> {trip.duration}
                  </span>
               </div>

               {/* Budget */}
               <div className="p-3 text-center h-24 flex flex-col justify-center">
                  <span className="block text-gray-400 text-[10px] font-black uppercase mb-1">الميزانية</span>
                  <span className="text-xl font-black text-emerald-600 flex items-center justify-center gap-1.5">
                     <DollarSign className="w-5 h-5 opacity-80" /> {trip.budget}
                  </span>
               </div>

               {/* Rating */}
               <div className="p-3 text-center h-24 flex flex-col justify-center">
                  <span className="block text-gray-400 text-[10px] font-black uppercase mb-1">التقييم</span>
                  <span className="text-xl font-black text-amber-500 flex items-center justify-center gap-1.5">
                     <Star className="w-5 h-5 fill-current" /> {trip.rating}
                  </span>
               </div>

               {/* Share Action */}
               <div className="p-3 h-24 flex items-center justify-center">
                  <Button onClick={handleShare} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black gap-2 shadow-lg shadow-indigo-100 transition-all text-sm">
                     <Share2 className="w-5 h-5" /> مشاركة
                  </Button>
               </div>
            </div>
         </Card>
      </div>

      {/* 4. Main Dashboard Layout */}
      <div className="container mx-auto px-4 mt-12">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (65%): Content & Timeline */}
            <div className="lg:col-span-8 space-y-8">
               
               {/* About Trip */}
               <Card id="trip-itinerary" className="border-0 shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                  <div className="p-10 space-y-6">
                     <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                        {isQuickTrip ? "قصة الرحلة" : "نظرة عامة على المغامرة"}
                     </h2>
                     <p className="text-xl text-gray-500 leading-relaxed font-medium">
                        {trip.description}
                     </p>
                     {/* Tagged Friends / Travel Companions */}
                     {trip.taggedUsers && trip.taggedUsers.length > 0 && (
                        <div className="pt-8 border-t border-gray-50 space-y-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <span className="text-lg font-black text-gray-900">رفقاء الرحلة</span>
                              <Users className="w-5 h-5 text-indigo-600" />
                           </div>
                           <div className="flex flex-wrap justify-end gap-4">
                              {trip.taggedUsers.map((u: any) => (
                                <Link 
                                  to={`/profile/${u.userId}`}
                                  key={u.userId}
                                  className="flex items-center gap-3 bg-gray-50 hover:bg-indigo-50 px-4 py-2.5 rounded-2xl group transition-all border border-transparent hover:border-indigo-100 shadow-sm flex-row-reverse"
                                >
                                   <div className="relative">
                                      <img src={u.imageUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white" />
                                   </div>
                                   <div className="flex flex-col text-right">
                                      <span className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{u.fullName}</span>
                                      <span className="text-[10px] text-gray-400 font-bold uppercase">مسافر مغامر</span>
                                   </div>
                                </Link>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </Card>

               {/* Quick Trip Media Gallery / Video Player */}
               {isQuickTrip && (
                 <div className="space-y-8">
                    {galleryVideos.length > 0 && (
                      <div className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-900 px-4 flex items-center gap-3">
                          <Video className="w-7 h-7 text-indigo-600" />
                          فيديوهات من الرحلة
                        </h2>
                        <div className="grid grid-cols-1 gap-6">
                          {galleryVideos.map((vidUrl: string, idx: number) => (
                            <Card key={idx} className="border-0 shadow-2xl rounded-[2.5rem] bg-black overflow-hidden aspect-video relative group">
                              <video 
                                src={vidUrl} 
                                controls 
                                className="w-full h-full object-contain"
                                poster={trip.image}
                              />
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <h2 className="text-2xl font-black text-gray-900 px-4 flex items-center gap-3">
                         <ImageIcon className="w-7 h-7 text-orange-500" />
                         صور الرحلة
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {galleryImages.filter(img => img !== trip.image).map((imgUrl: string, idx: number) => (
                          <Card key={idx} className="border-0 shadow-lg rounded-[2.5rem] bg-white overflow-hidden aspect-square group">
                            <img src={imgUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                          </Card>
                        ))}
                      </div>
                    </div>
                 </div>
               )}

               {!isQuickTrip && (
                 <>
                   {/* Timeline Activities */}
                   <div id="trip-itinerary" className="space-y-6">
                      <h2 className="text-2xl font-black text-gray-900 px-4">خط السير <span className="text-indigo-600">التفصيلي</span></h2>
                      <div className="space-y-4">
                          {trip.days.map((day: any, dayIdx: number) => {
                             const dayColor = day.color || "#4F46E5";
                             return (
                             <Card key={dayIdx} className="border-0 shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
                                {/* Day Header */}
                                <div className="px-8 pt-8 pb-4">
                                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                                      <div className="flex items-center gap-5">
                                         <div
                                           className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0"
                                           style={{ backgroundColor: dayColor + "15", border: `3px solid ${dayColor}`, color: dayColor }}
                                         >
                                            {dayIdx + 1}
                                         </div>
                                         <div>
                                           <p className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: dayColor }}>اليوم {dayIdx + 1}</p>
                                           <h3 className="text-xl font-black text-gray-900">{day.title || `اليوم ${dayIdx + 1}`}</h3>
                                         </div>
                                      </div>
                                      
                                      {day.hotel && (
                                        <div className="flex items-center gap-3 bg-indigo-50/50 p-2.5 rounded-2xl border border-indigo-100 shadow-sm max-w-[280px]">
                                          {day.hotel.image ? (
                                            <img src={day.hotel.image} className="w-12 h-12 rounded-xl object-cover shrink-0" alt={day.hotel.name} />
                                          ) : (
                                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                              <MapPin className="w-5 h-5 text-indigo-400" />
                                            </div>
                                          )}
                                          <div className="flex flex-col text-right pr-1">
                                            <span className="text-[9px] font-black tracking-widest uppercase text-indigo-400 mb-0.5">مكان الإقامة المنصوح به</span>
                                            <span className="font-bold text-sm text-gray-800 line-clamp-1">{day.hotel.name}</span>
                                            {day.hotel.priceRange && day.hotel.priceRange !== 'غير متوفر' && (
                                               <span className="text-[10px] font-bold text-emerald-600 mt-0.5">{day.hotel.priceRange}</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                   </div>
                                </div>
                                {/* Activities vertical timeline */}
                                <div className="px-8 pb-8 space-y-0">
                                  {day.activities
                                    .filter((actIdx: number) => actIdx >= 0 && actIdx < trip.activities.length)
                                    .map((actIdx: number, itemIdx: number, arr: number[]) => {
                                       const activity = trip.activities[actIdx];
                                       const isLast = itemIdx === arr.length - 1;
                                       const isRestaurant = activity.type === "restaurant";
                                       return (
                                         <div key={actIdx} className="relative flex gap-4">
                                           {/* Timeline connector dot */}
                                           <div className="flex flex-col items-center shrink-0 w-10">
                                             <div
                                               className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm z-10 shadow-sm"
                                               style={{ backgroundColor: dayColor }}
                                             >
                                               {isRestaurant ? "" : ""}
                                             </div>
                                             {!isLast && (
                                               <div className="w-0.5 flex-1 my-1 rounded-full" style={{ backgroundColor: dayColor + "30" }} />
                                             )}
                                           </div>
                                           {/* Activity card */}
                                           <div
                                             onClick={() => setDialogActivityIdx(actIdx)}
                                             className="flex-1 mb-4 p-4 rounded-[1.5rem] bg-gray-50/60 border border-gray-100 hover:border-gray-200 hover:bg-white transition-all cursor-pointer group/item shadow-sm hover:shadow-md"
                                           >
                                             <div className="flex items-start gap-3">
                                               {activity.images?.[0] && (
                                                 <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm">
                                                   <img src={activity.images[0]} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                                 </div>
                                               )}
                                               <div className="flex-1 min-w-0">
                                                 {activity.time && (
                                                   <div
                                                     className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black mb-1.5"
                                                     style={{ backgroundColor: dayColor + "15", color: dayColor }}
                                                   >
                                                     <Clock className="w-3 h-3" />
                                                     {activity.time}
                                                   </div>
                                                 )}
                                                 <p className="font-black text-gray-800 text-base leading-tight line-clamp-1">{activity.name}</p>
                                                 {activity.note && (
                                                   <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed line-clamp-2">
                                                     {"💡"} {activity.note}
                                                   </p>
                                                 )}
                                               </div>
                                             </div>
                                           </div>
                                         </div>
                                       );
                                    })}
                                </div>
                             </Card>
                             );
                          })}
                      </div>
                   </div>

                   {/* Place of Stay (Hotels) */}
                   {trip.hotels && trip.hotels.length > 0 && (
                     <div className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-900 px-4">أماكن الإقامة</h2>
                        <div className="grid grid-cols-1 gap-4">
                           {trip.hotels.map((hotel: any, idx: number) => (
                              <Card key={idx} className="border-0 shadow-lg rounded-[2rem] bg-white overflow-hidden p-5">
                                 <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
                                    {hotel.image ? (
                                       <img src={hotel.image} className="w-full md:w-32 h-40 md:h-32 rounded-2xl object-cover" loading="lazy" />
                                    ) : (
                                       <div className="w-full md:w-32 h-40 md:h-32 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                                          <MapPin className="w-10 h-10 text-gray-300" />
                                       </div>
                                    )}
                                    <div className="flex-1 w-full space-y-3">
                                       <div className="flex justify-between items-start">
                                         <div>
                                            <h4 className="font-black text-gray-800 text-xl">{hotel.name}</h4>
                                            {hotel.address && (
                                               <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mt-1">
                                                  <MapPin className="w-3.5 h-3.5" />
                                                  <span className="truncate max-w-[200px]">{hotel.address}</span>
                                               </div>
                                            )}
                                         </div>
                                         <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-2.5 py-1.5 rounded-xl">
                                               <Star className="w-4 h-4 fill-current" />
                                               <span className="text-sm font-black">{hotel.rating}</span>
                                            </div>
                                         </div>
                                       </div>
                                       
                                       <p className="text-sm text-gray-500 font-bold line-clamp-2">{hotel.description || 'فندق وإقامة مميزة'}</p>
                                       
                                       <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                          <div className="flex flex-wrap gap-2">
                                             {hotel.amenities && hotel.amenities.slice(0, 4).map((amenity: string, i: number) => (
                                                <Badge key={i} variant="outline" className="bg-indigo-50 border-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg">
                                                   {amenity}
                                                </Badge>
                                             ))}
                                             {hotel.amenities && hotel.amenities.length > 4 && (
                                                <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-600 font-bold text-[10px] rounded-lg">
                                                   +{hotel.amenities.length - 4}
                                                </Badge>
                                             )}
                                          </div>
                                          
                                          {hotel.priceRange && hotel.priceRange !== "غير متوفر" && (
                                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-xs px-3 py-1.5 shrink-0">
                                                {hotel.priceRange}
                                            </Badge>
                                          )}
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
                                    {food.image ? (
                                       <img src={food.image} className="w-24 h-24 rounded-2xl object-cover" loading="lazy" />
                                    ) : (
                                       <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                                          <Utensils className="w-8 h-8 text-gray-300" />
                                       </div>
                                    )}
                                    <div className="flex-1 w-full">
                                       <h4 className="font-black text-gray-800 text-lg">{food.name}</h4>
                                       <p className="text-xs text-gray-500 font-bold mt-1 line-clamp-2">{food.description || 'مطعم ومأكولات شهية'}</p>
                                       <div className="mt-3 inline-flex">
                                          <Badge className="bg-orange-50 text-orange-600 border-none px-2.5 py-1 rounded-lg font-black gap-1.5"><Utensils className="w-3 h-3" /> {food.rating} ⭐</Badge>
                                       </div>
                                    </div>
                                 </div>
                              </Card>
                           ))}
                        </div>
                     </div>
                   )}
                 </>
               )}
            </div>

            {/* Right Column (35%): Interactive Widgets */}
            <div className="lg:col-span-4 space-y-8 sticky top-24">
               
               {/* Map Widget */}
               <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-indigo-900 overflow-hidden text-white relative">
                  <div className="h-[280px] w-full relative overflow-hidden rounded-[2rem]">
                      <div 
                        onClick={() => setShowFullMap(true)}
                        className="absolute top-4 right-4 bg-indigo-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-sm font-black flex items-center gap-2 cursor-pointer hover:bg-indigo-800 transition-colors z-[1001] shadow-lg"
                      >
                        <Maximize2 className="w-4 h-4 text-orange-400" /> عرض الخريطة المكبرة
                      </div>
                      {trip.activities?.[0]?.coordinates ? (
                        <div className="absolute inset-0 z-0 rounded-[2rem] overflow-hidden">
                        <MapboxTripMap
                          key={`map-${trip._id || trip.id}`}
                          positions={trip.activities
                            .filter((a: any) => a.coordinates)
                            .map((a: any) => ({ lat: a.coordinates.lat, lng: a.coordinates.lng }))}
                          activityNames={trip.activities
                            .filter((a: any) => a.coordinates)
                            .map((a: any) => a.name)}
                          markerColors={trip.activities
                            .filter((a: any) => a.coordinates)
                            .map((a: any) => a.color)}
                          onMarkerClick={setDialogActivityIdx}
                          height="100%"
                          className="rounded-[2rem]"
                        />
                        </div>
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

               {/* Comments Widget - visible on all screen sizes */}
               <div>
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
                 <MapboxTripMap
                   key={`fullmap-${trip._id || trip.id}`}
                   positions={trip.activities
                     .filter((a: any) => a.coordinates)
                     .map((a: any) => ({ lat: a.coordinates.lat, lng: a.coordinates.lng }))}
                   activityNames={trip.activities
                     .filter((a: any) => a.coordinates)
                     .map((a: any) => a.name)}
                   markerColors={trip.activities
                     .filter((a: any) => a.coordinates)
                     .map((a: any) => a.color)}
                   onMarkerClick={setDialogActivityIdx}
                   height="100%"
                   className="absolute inset-0 rounded-[2.5rem]"
                 />
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
                       src={trip.activities[dialogActivityIdx].images?.[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80'} 
                       className="w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                     <div className="absolute top-6 left-6 flex gap-2">
                        {trip.activities[dialogActivityIdx].rating && (
                          <Badge className="bg-white/90 text-amber-500 hover:bg-white border-none font-black flex gap-1 shadow-lg backdrop-blur-sm">
                            <Star className="w-3.5 h-3.5 fill-current" /> {trip.activities[dialogActivityIdx].rating}
                          </Badge>
                        )}
                        {trip.activities[dialogActivityIdx].price && (
                          <Badge className="bg-white/90 text-emerald-600 hover:bg-white border-none font-black shadow-lg backdrop-blur-sm">
                            {trip.activities[dialogActivityIdx].price}
                          </Badge>
                        )}
                     </div>
                     <div className="absolute bottom-6 right-6 text-white w-full pr-8">
                        <Badge className={cn("mb-3 border-none shadow-md", trip.activities[dialogActivityIdx].type === 'restaurant' ? 'bg-orange-500' : 'bg-indigo-500')}>
                          {trip.activities[dialogActivityIdx].type === 'restaurant' ? 'مطعم' : 'نشاط سياحي'}
                        </Badge>
                        <h3 className="text-3xl font-black max-w-[90%] leading-tight">{trip.activities[dialogActivityIdx].name}</h3>
                     </div>
                  </div>
                  <div className="p-8 space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                     {trip.activities[dialogActivityIdx].description && (
                       <p className="text-lg text-gray-600 leading-relaxed font-bold">
                          {trip.activities[dialogActivityIdx].description}
                       </p>
                     )}
                     
                     {trip.activities[dialogActivityIdx].note && (
                       <div className="bg-indigo-50 border-r-4 border-indigo-500 p-4 rounded-l-2xl">
                          <p className="text-indigo-900 font-bold leading-relaxed whitespace-pre-line">
                            💡 {trip.activities[dialogActivityIdx].note}
                          </p>
                       </div>
                     )}
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <div className="p-4 rounded-3xl bg-gray-50 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                              <MapPin className="w-6 h-6" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <span className="block text-xs text-gray-400 font-bold mb-1">الموقع</span>
                              <span className="font-black text-gray-700 text-sm line-clamp-2 leading-snug">
                                {trip.activities[dialogActivityIdx].address || trip.city}
                              </span>
                           </div>
                        </div>
                        
                        {(trip.activities[dialogActivityIdx].time || trip.activities[dialogActivityIdx].duration) && (
                           <div className="p-4 rounded-3xl bg-gray-50 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                 <Clock className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <span className="block text-xs text-gray-400 font-bold mb-1">التوقيت</span>
                                 <span className="font-black text-gray-700 text-sm line-clamp-2">
                                   {trip.activities[dialogActivityIdx].time || trip.activities[dialogActivityIdx].duration}
                                 </span>
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
