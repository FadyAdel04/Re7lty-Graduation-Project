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
} from "lucide-react";
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
                disabled={loveLoading}
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
                disabled={saveLoading}
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
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                      <Star className="h-5 w-5 fill-primary text-primary" />
                      <span className="text-xl font-bold">{trip.rating}</span>
                    </div>
                    {trip.season && (
                      <Badge variant="secondary" className="text-lg py-1.5 px-4 bg-orange-100 text-orange-700 hover:bg-orange-200 gap-2">
                         {
                          trip.season === 'winter' ? '❄️ شتاء' :
                          trip.season === 'summer' ? '☀️ صيف' :
                          trip.season === 'fall' ? '🍂 خريف' :
                          trip.season === 'spring' ? '🌸 ربيع' : trip.season
                        }
                      </Badge>
                    )}
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
                  to={trip.ownerId ? `/user/${trip.ownerId}` : `/profile/${trip.author.replace(/\s+/g, "-")}`}
                  className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center text-white font-bold">
                    {trip.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{trip.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {authorFollowers.toLocaleString("ar-EG")} متابع
                    </p>
                  </div>
                </Link>
                <div className="mr-auto flex items-center gap-2">
                  {isOwner ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/trips/edit/${id}`)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        تعديل
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => setShowDeleteDialog(true)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant={isFollowingAuthor ? "secondary" : "outline"}
                      onClick={handleFollowAuthor}
                      disabled={followLoading}
                    >
                      {followLoading
                        ? "جاري التحديث..."
                        : isFollowingAuthor
                          ? "إلغاء المتابعة"
                          : "متابعة"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">عن الرحلة</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {trip.description}
                </p>
              </div>

              {/* Activities */}
              {trip.activities && trip.activities.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">
                    الأنشطة والمعالم التى تم زيارتها
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {trip.activities.map((activity: any, index: number) => (
                      <div
                        key={index}
                        className="relative flex flex-col gap-2 p-4 bg-secondary-light rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{activity.name || `نشاط ${index + 1}`}</span>
                        </div>
                        {activity.images && activity.images.length > 0 && (
                          <div className="flex gap-2 flex-wrap mt-2">
                            {activity.images.map((img: string, idx: number) => (
                              <img
                                key={`img-${idx}`}
                                src={img}
                                alt={activity.name || `صورة ${idx + 1}`}
                                className="h-20 w-28 object-cover rounded-lg border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ))}
                          </div>
                        )}
                        {activity.videos && activity.videos.length > 0 && (
                          <div className="flex gap-2 flex-wrap mt-2">
                            {activity.videos.map((video: string, idx: number) => (
                              <div key={`vid-${idx}`} className="relative">
                                <video
                                  src={video}
                                  controls
                                  className="h-32 w-48 sm:h-40 sm:w-64 object-cover rounded-lg border"
                                  onError={(e) => {
                                    (e.target as HTMLVideoElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Show on Map Button -> opens modal on click */}
                        {activity.coordinates && (
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
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile/Modal map for activity */}
              <Dialog open={dialogActivityIdx !== null} onOpenChange={(o) => !o && setDialogActivityIdx(null)}>
                <DialogContent className="sm:max-w-[720px]">
                  <DialogHeader>
                    <DialogTitle>موقع النشاط على الخريطة</DialogTitle>
                  </DialogHeader>
                  {dialogActivityIdx !== null && trip.activities && trip.activities[dialogActivityIdx] && trip.activities[dialogActivityIdx].coordinates && (
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
                  {dialogActivityIdx !== null && (!trip.activities || !trip.activities[dialogActivityIdx] || !trip.activities[dialogActivityIdx].coordinates) && (
                    <div className="w-full h-[50vh] rounded-xl overflow-hidden flex items-center justify-center bg-muted">
                      <p className="text-muted-foreground">لا توجد إحداثيات لهذا النشاط</p>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Show itinerary by day */}
              {trip.days && trip.days.length > 0 && trip.activities && trip.activities.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">
                    الجدول اليومي للرحلة
                  </h2>
                  <div className="space-y-6">
                    {trip.days.map((day: any, dayIdx: number) => (
                      <div key={dayIdx} className="bg-muted/30 rounded-xl p-4">
                        <h3 className="text-xl font-semibold mb-3">
                          {day.title || `اليوم ${dayIdx + 1}`}
                        </h3>
                        {day.activities && day.activities.length > 0 && (
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {day.activities
                              .filter((actIdx: number) => actIdx >= 0 && actIdx < trip.activities.length)
                              .map((actIdx: number) => {
                                const activity = trip.activities[actIdx];
                                if (!activity) return null;
                                return (
                                  <li
                                    key={`${dayIdx}-${actIdx}-${activity.name || actIdx}`}
                                    className="flex gap-4 items-start bg-white rounded-lg p-3 shadow"
                                  >
                                    {activity.images && activity.images[0] && (
                                      <img
                                        src={activity.images[0]}
                                        alt={activity.name || `نشاط ${actIdx + 1}`}
                                        className="w-24 h-16 object-cover rounded"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <div>
                                      <div className="font-bold">
                                        {activity.name || `نشاط ${actIdx + 1}`}
                                      </div>
                                      {activity.coordinates && (
                                        <div className="text-xs text-muted-foreground">
                                          الإحداثيات:{" "}
                                          {activity.coordinates.lat?.toFixed(4) || 'N/A'},{" "}
                                          {activity.coordinates.lng?.toFixed(4) || 'N/A'}
                                        </div>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                          </ul>
                        )}
                        {(!day.activities || day.activities.length === 0) && (
                          <p className="text-muted-foreground">لا توجد أنشطة مخصصة لهذا اليوم</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map Preview */}
              {trip.activities && trip.activities.length > 0 && trip.activities.some((a: any) => a.coordinates) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">الموقع</h2>
                  <div className="h-64 bg-muted rounded-xl overflow-hidden flex items-center justify-center relative">
                    {trip.activities[0]?.coordinates ? (
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
                        <FitBounds positions={trip.activities
                          .filter((a: any) => a.coordinates)
                          .map((a: any) => [a.coordinates.lat, a.coordinates.lng])} />
                        {/* Draw route line */}
                        {trip.activities.filter((a: any) => a.coordinates).length > 1 && (
                          <Polyline
                            positions={trip.activities
                              .filter((a: any) => a.coordinates)
                              .map((a: any) => [a.coordinates.lat, a.coordinates.lng])}
                            color="#ff6b35"
                            weight={4}
                            opacity={0.7}
                          />
                        )}
                        {/* Bus travel animation from first to last point */}
                        {trip.activities.filter((a: any) => a.coordinates).length > 1 && (
                          <BusTravelAnimator
                            positions={trip.activities
                              .filter((a: any) => a.coordinates)
                              .map((a: any) => [a.coordinates.lat, a.coordinates.lng])}
                          />
                        )}
                        {/* Markers for activities */}
                        {trip.activities
                          .filter((a: any) => a.coordinates)
                          .map((activity: any, index: number) => (
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
                                  <strong>{activity.name || `نشاط ${index + 1}`}</strong>
                                  <div className="mt-2">
                                    {activity.images && activity.images[0] && (
                                      <img
                                        src={activity.images[0]}
                                        alt={activity.name || `صورة ${index + 1}`}
                                        className="rounded"
                                        style={{ width: "120px" }}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
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
              )}

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
                  {dialogRestaurantIdx !== null && trip.activities && trip.activities[0] && trip.activities[0].coordinates && (
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
                  {dialogRestaurantIdx !== null && (!trip.activities || !trip.activities[0] || !trip.activities[0].coordinates) && (
                    <div className="w-full h-[50vh] rounded-xl overflow-hidden flex items-center justify-center bg-muted">
                      <p className="text-muted-foreground">لا توجد بيانات موقع متاحة</p>
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
          <TripComments
            tripId={String(trip._id || trip.id)}
            initialComments={trip.comments || []}
            onCommentAdded={handleCommentAdded}
            onCommentUpdated={handleCommentUpdated}
            onCommentDeleted={handleCommentDeleted}
            tripOwnerId={trip.ownerId}
          />
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه الرحلة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTrip}
              disabled={isDeleting}
            >
              {isDeleting ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default TripDetail;
