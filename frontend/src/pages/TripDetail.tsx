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
  ArrowUpRight,
  Hotel,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Info,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Flag,
  Sparkles,
  MessageCircle as MessageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripComments from "@/components/TripComments";
import { MapboxTripMap } from "@/components/MapboxTripMap";
import { egyptTrips, Comment as TripComment } from "@/lib/trips-data";
import { getTrip, toggleTripLove, toggleFollowUser, toggleTripSave } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SignedIn, SignedOut, SignInButton, useUser, useAuth } from "@clerk/clerk-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { deleteTrip } from "@/lib/api";
import TripSkeletonLoader from "@/components/TripSkeletonLoader";
import ReportTripDialog from "@/components/ReportTripDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserBadge from "@/components/UserBadge";

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

  // Check if current user is the owner or admin
  const isAdmin = clerkUser?.emailAddresses?.some(email => email.emailAddress === 'supermincraft52@gmail.com');
  const isOwner = trip?.ownerId && clerkUser?.id && trip.ownerId === clerkUser.id;
  const canModify = isOwner || isAdmin;

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
            startCity: apiTrip.startCity,
            transportationPrice: apiTrip.transportationPrice,
            totalEstimatedPrice: apiTrip.totalEstimatedPrice,
            transportOptions: apiTrip.transportOptions,
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
    if (!trip._id) {
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
      toast({
        title: isLiked ? "تم إلغاء الإعجاب" : "تم الإعجاب بالرحلة",
        description: !isLiked ? "يمكنك العثور عليها في قائمة المفضلة" : undefined,
      });
      return;
    }
    if (!isSignedIn) {
      toast({ title: "تسجيل الدخول مطلوب", description: "يجب تسجيل الدخول للإعجاب بالرحلات", variant: "destructive" });
      return;
    }
    try {
      setLoveLoading(true);
      const token = await getToken();
      const result = await toggleTripLove(String(trip._id || trip.id), token || "");
      setIsLiked(result.loved);
      setLikesCount(result.likes);
      toast({
        title: result.loved ? "تم الإعجاب بالرحلة" : "تم إلغاء الإعجاب",
        description: result.loved ? "يمكنك العثور عليها في قائمة المفضلة" : undefined,
      });
    } catch (error: any) {
      console.error("Error updating love state:", error);
      toast({ title: "خطأ", description: error.message || "تعذر تحديث حالة الإعجاب", variant: "destructive" });
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
      toast({ title: "تسجيل الدخول مطلوب", description: "يجب تسجيل الدخول لحفظ الرحلات", variant: "destructive" });
      return;
    }
    try {
      setSaveLoading(true);
      const token = await getToken();
      const result = await toggleTripSave(String(trip._id), token || "");
      setIsSaved(result.saved);
      setSavesCount(result.saves);
      toast({
        title: result.saved ? "تم حفظ الرحلة" : "تم إلغاء الحفظ",
        description: result.saved ? "يمكنك العثور عليها في قائمة المحفوظات" : "",
      });
    } catch (error: any) {
      console.error("Error updating save state:", error);
      toast({ title: "خطأ", description: error.message || "تعذر تحديث حالة الحفظ", variant: "destructive" });
    } finally {
      setSaveLoading(false);
    }
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
      toast({ title: "تسجيل الدخول مطلوب", description: "يجب تسجيل الدخول لمتابعة الرحالة", variant: "destructive" });
      return;
    }
    try {
      setFollowLoading(true);
      const token = await getToken();
      const response = await toggleFollowUser(trip.ownerId, token || "");
      setIsFollowingAuthor(response.following);
      setAuthorFollowers(response.followers || 0);
      toast({
        title: response.following ? "تمت المتابعة" : "تم إلغاء المتابعة",
        description: response.following ? "ستظهر تحديثات هذا العضو في متابعاتك" : undefined,
      });
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast({ title: "خطأ", description: error.message || "تعذر تحديث حالة المتابعة", variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <TripSkeletonLoader variant="detail" />
        <Footer />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background font-cairo" dir="rtl">
        <Header />
        <div className="container mx-auto px-4 py-32 text-center">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-32 h-32 bg-muted rounded-[3rem] flex items-center justify-center mx-auto mb-10 border border-border"
            >
                <MapPin className="w-16 h-16 text-muted-foreground/30" />
            </motion.div>
          <h1 className="text-4xl font-black mb-6 text-foreground tracking-tight">الرحلة غير موجودة</h1>
          <p className="text-muted-foreground mb-12 text-xl font-bold">{error || 'تعذر العثور على الرحلة المطلوبة'}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/timeline')} className="h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">العودة للخط الزمني</Button>
            <Button variant="outline" onClick={() => navigate(-1)} className="h-14 px-8 rounded-2xl font-black text-lg border-border">رجوع</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const galleryImages = [
    trip.image,
    ...trip.activities.flatMap((a: any) => a.images || [])
  ].filter(Boolean);

  const galleryVideos = [
    ...trip.activities.flatMap((a: any) => a.videos || [])
  ].filter(Boolean);

  const isQuickTrip = trip.postType === 'quick';

  return (
    <div className="min-h-screen bg-background font-cairo text-right transition-all duration-700" dir="rtl">
      <Header />

      {/* 1. Immersive Hero Section */}
      <div className="relative h-[60vh] md:h-[75vh] w-full overflow-hidden group">
         <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10 }}
            src={trip.image} 
            className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
            alt={trip.title} 
         />
         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/60" />
         <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
         
         <div className="container mx-auto px-4 h-full flex flex-col justify-end relative z-10 pb-20">
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-5xl"
            >
                <div className="flex flex-wrap items-center gap-3">
                   {isQuickTrip && (
                     <Badge className="bg-amber-500 text-white border-none px-5 py-2 rounded-2xl font-black text-sm gap-2 shadow-2xl animate-pulse">
                        <Zap className="w-4 h-4 fill-current" />
                        بوست سريع ⚡
                     </Badge>
                   )}
                   <Badge className="bg-primary/20 backdrop-blur-md text-primary border-primary/30 px-5 py-2 rounded-2xl font-black text-sm uppercase tracking-widest">
                       {trip.city || trip.destination}
                   </Badge>
                   {trip.season && (
                     <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 px-5 py-2 rounded-2xl font-black text-sm">
                        {trip.season === 'winter' ? '❄️ الشتاء' : trip.season === 'summer' ? '☀️ الصيف' : trip.season === 'fall' ? '🍂 خريف' : '🌸 الربيع'}
                     </Badge>
                   )}
                </div>

                <h1 className="text-5xl md:text-8xl font-black text-white leading-tight tracking-tighter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                   {trip.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 pt-4">
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-[2rem] border border-white/10 shadow-2xl">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        <span className="text-white font-black text-xl">{trip.rating} / 5</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-[2rem] border border-white/10 shadow-2xl">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        <span className="text-white font-black text-xl">{trip.budget}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-[2rem] border border-white/10 shadow-2xl">
                        <Clock className="w-5 h-5 text-indigo-400" />
                        <span className="text-white font-black text-xl">{trip.duration}</span>
                    </div>
                </div>
            </motion.div>
         </div>
          {canModify && (
            <div className="absolute top-10 left-10 z-30 flex gap-3">
                <Button onClick={() => navigate(`/edit-trip/${id}`)} className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white hover:text-foreground transition-all">
                    <Edit2 className="w-6 h-6" />
                </Button>
                <Button onClick={() => setShowDeleteDialog(true)} className="h-14 w-14 rounded-2xl bg-rose-500/80 backdrop-blur-xl border border-rose-400/30 text-white hover:bg-rose-600 transition-all">
                    <Trash2 className="w-6 h-6" />
                </Button>
            </div>
         )}
      </div>

      {/* 2. Key Actions & Social Bar */}
      <div className="container mx-auto px-4 -mt-16 relative z-30">
          <Card className="border border-border/60 shadow-[0_40px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-[3rem] bg-card/80 backdrop-blur-2xl overflow-hidden p-3 ring-1 ring-border">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-border/60">
               
               {/* Author Identity */}
               <div className="p-4 md:p-6 flex items-center gap-5">
                  <Link to={toProfilePath(trip)} className="shrink-0 relative group">
                     <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-background group-hover:rotate-6 transition-transform">
                        <Avatar className="w-full h-full rounded-none">
                            <AvatarImage src={trip.authorImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${trip.ownerId || trip.author}`} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">{trip.author?.[0]}</AvatarFallback>
                        </Avatar>
                     </div>
                     <div className="absolute -bottom-1 -right-1">
                         <UserBadge tier={trip.authorBadge || 'none'} size='sm' showLabel={false} />
                     </div>
                  </Link>
                  <div className="flex flex-col min-w-0">
                     <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">رحلة بواسطة</span>
                     <Link to={toProfilePath(trip)} className="text-foreground font-black text-lg hover:text-primary transition-colors truncate block">
                        {trip.author}
                     </Link>
                  </div>
                  {!isOwner && (
                    <Button 
                        onClick={handleFollowAuthor} 
                        disabled={followLoading}
                        variant={isFollowingAuthor ? "outline" : "default"}
                        className={cn(
                            "mr-auto rounded-xl font-black text-xs px-5",
                            isFollowingAuthor ? "border-primary/20 text-primary hover:bg-primary/5" : "bg-primary text-white"
                        )}
                    >
                        {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFollowingAuthor ? 'متابع' : 'متابعة')}
                    </Button>
                  )}
               </div>

               {/* Quick Stats Grid */}
               <div className="md:col-span-2 grid grid-cols-3 divide-x divide-x-reverse divide-border/60 h-full items-center">
                    <div className="flex flex-col items-center justify-center p-4">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">الإعجابات</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-foreground tabular-nums">{likesCount}</span>
                            <Heart className={cn("w-5 h-5", isLiked ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">المحفوظات</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-foreground tabular-nums">{savesCount}</span>
                            <Bookmark className={cn("w-5 h-5", isSaved ? "fill-primary text-primary" : "text-muted-foreground")} />
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">المتابعين</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-foreground tabular-nums">{authorFollowers}</span>
                            <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                    </div>
               </div>

               {/* Primary CTA */}
               <div className="p-4 md:p-6 flex items-center justify-center gap-3">
                   <Button 
                    onClick={handleLike} 
                    disabled={loveLoading}
                    variant="ghost" 
                    className={cn(
                        "h-14 w-14 rounded-2xl transition-all shadow-sm",
                        isLiked ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" : "bg-muted border border-border"
                    )}
                   >
                      {loveLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Heart className={cn("w-7 h-7", isLiked && "fill-rose-600")} />}
                   </Button>
                   <Button 
                    onClick={handleSave} 
                    disabled={saveLoading}
                    variant="ghost" 
                    className={cn(
                        "h-14 w-14 rounded-2xl transition-all shadow-sm",
                        isSaved ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted border border-border"
                    )}
                   >
                      {saveLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Bookmark className={cn("w-7 h-7", isSaved && "fill-primary")} />}
                   </Button>
                   <Button 
                    onClick={handleShare} 
                    className="flex-1 h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-black text-lg gap-3 shadow-2xl transition-all active:scale-95"
                   >
                      <Share2 className="w-5 h-5" />
                      مشاركة المغامرة
                   </Button>
               </div>
            </div>
          </Card>
      </div>

      {/* 3. Main Content Layout */}
      <div className="container mx-auto px-4 mt-16">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Content & Timeline */}
            <div className="lg:col-span-8 space-y-12">
               
               {/* Description Section */}
               <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-[3.5rem] p-10 border border-border shadow-xl space-y-8 relative overflow-hidden"
               >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                        <Quote className="w-64 h-64" />
                    </div>

                    <h2 className="text-3xl font-black text-foreground flex items-center gap-4 relative z-10">
                        <div className="h-12 w-3 bg-primary rounded-full" />
                        {isQuickTrip ? "قصة الرحلة" : "نظرة عامة على المغامرة"}
                    </h2>
                    
                    <p className="text-2xl text-muted-foreground leading-relaxed font-bold relative z-10 opacity-90">
                        {trip.description}
                    </p>

                    {/* Tagged Friends */}
                    {trip.taggedUsers && trip.taggedUsers.length > 0 && (
                        <div className="pt-10 border-t border-border space-y-6 relative z-10">
                           <div className="flex items-center gap-3">
                              <Users className="w-6 h-6 text-primary" />
                              <span className="text-xl font-black text-foreground">رفقاء الرحلة</span>
                           </div>
                           <div className="flex flex-wrap gap-4">
                              {trip.taggedUsers.map((u: any) => (
                                <Link 
                                  to={`/user/${u.userId}`}
                                  key={u.userId}
                                  className="flex items-center gap-3 bg-muted/50 hover:bg-primary/10 px-5 py-3 rounded-2xl transition-all border border-border hover:border-primary/20 shadow-sm group"
                                >
                                   <div className="relative">
                                      <img src={u.imageUrl} className="w-12 h-12 rounded-xl border-2 border-background shadow-md object-cover group-hover:rotate-6 transition-transform" />
                                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{u.fullName}</span>
                                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">مسافر مغامر</span>
                                   </div>
                                </Link>
                              ))}
                           </div>
                        </div>
                    )}
               </motion.div>

               {/* Quick Trip Media Display */}
               {isQuickTrip && (
                 <div className="space-y-12">
                    {galleryVideos.length > 0 && (
                      <div className="space-y-6">
                        <h2 className="text-2xl font-black text-foreground px-4 flex items-center gap-3">
                          <Video className="w-7 h-7 text-primary" />
                          فيديوهات من المغامرة
                        </h2>
                        <div className="grid grid-cols-1 gap-8">
                          {galleryVideos.map((vidUrl: string, idx: number) => (
                            <Card key={idx} className="border-0 shadow-2xl rounded-[3rem] bg-black overflow-hidden aspect-video relative group ring-1 ring-white/10">
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
                      <h2 className="text-2xl font-black text-foreground px-4 flex items-center gap-3">
                         <ImageIcon className="w-7 h-7 text-orange-500" />
                         ألبوم الصور
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {galleryImages.filter(img => img !== trip.image).map((imgUrl: string, idx: number) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            className="bg-card rounded-[3rem] p-3 border border-border shadow-xl"
                          >
                             <div className="rounded-[2.5rem] overflow-hidden aspect-square">
                                <img src={imgUrl} className="w-full h-full object-cover transition-transform duration-[1s] hover:scale-110" loading="lazy" />
                             </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                 </div>
               )}

               {/* Itinerary Timeline */}
               {!isQuickTrip && (
                 <div id="trip-itinerary" className="space-y-8">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-3xl font-black text-foreground">خط السير <span className="text-primary">التفصيلي</span></h2>
                        <Badge variant="outline" className="bg-muted px-4 py-2 rounded-xl font-black border-border">
                            {trip.days.length} أيام
                        </Badge>
                    </div>

                    <div className="space-y-10">
                        {trip.days.map((day: any, dayIdx: number) => {
                           const dayColor = day.color || "var(--primary)";
                           return (
                             <motion.div 
                                key={dayIdx}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: dayIdx * 0.1 }}
                             >
                                <Card className="border border-border/60 shadow-xl rounded-[3.5rem] bg-card overflow-hidden group">
                                    <div className="p-8 md:p-12 space-y-10">
                                        {/* Day Header */}
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                            <div className="flex items-center gap-6">
                                                <div
                                                    className="w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-3xl shrink-0 shadow-lg border-4 border-background"
                                                    style={{ backgroundColor: `rgba(${dayColor}, 0.1)`, color: dayColor }}
                                                >
                                                    {dayIdx + 1}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: dayColor }}>اليوم {dayIdx + 1}</p>
                                                    <h3 className="text-3xl font-black text-foreground tracking-tight">{day.title || `بداية المغامرة`}</h3>
                                                </div>
                                            </div>
                                            
                                            {day.hotel && (
                                                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-[2.2rem] border border-border shadow-sm max-w-sm hover:shadow-md transition-all group/hotel">
                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-background shadow-inner">
                                                        {day.hotel.image ? (
                                                            <img src={day.hotel.image} className="w-full h-full object-cover group-hover/hotel:scale-110 transition-transform" alt={day.hotel.name} />
                                                        ) : (
                                                            <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                                                                <Hotel className="w-7 h-7 text-primary/30" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[9px] font-black tracking-widest uppercase text-primary mb-1">مكان الإقامة</span>
                                                        <span className="font-black text-sm text-foreground line-clamp-1">{day.hotel.name}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                            <span className="text-[10px] font-bold text-muted-foreground">{day.hotel.rating || 5} / 5</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Activities Vertical Flow */}
                                        <div className="space-y-0 relative mr-4 md:mr-10">
                                            {/* Connector Line */}
                                            <div className="absolute top-0 bottom-0 right-[25px] w-1 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent rounded-full" />
                                            
                                            {(day.activities as any[]).map((actEntry: any, itemIdx: number) => {
                                                const activity = typeof actEntry === 'number' ? trip.activities[actEntry] : actEntry;
                                                if (!activity) return null;
                                                const isRestaurant = activity.type === "restaurant";

                                                return (
                                                    <div key={itemIdx} className="relative flex gap-8 pb-10 last:pb-0">
                                                        <div className="flex flex-col items-center shrink-0 w-12 relative z-10">
                                                            <div className="w-12 h-12 rounded-[1.2rem] bg-background border-4 border-border flex items-center justify-center shadow-xl group-hover:border-primary/50 transition-colors">
                                                                {isRestaurant ? "🍽️" : "📍"}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 bg-muted/20 hover:bg-muted/40 p-6 rounded-[2.5rem] border border-transparent hover:border-border/60 transition-all cursor-pointer group/activity shadow-sm hover:shadow-xl">
                                                            <div className="flex flex-col md:flex-row items-start gap-6">
                                                                {activity.images?.[0] && (
                                                                    <div className="w-full md:w-32 h-40 md:h-32 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                                                                        <img src={activity.images[0]} className="w-full h-full object-cover group-hover/activity:scale-110 transition-transform duration-700" />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 space-y-4">
                                                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                                                        <h4 className="text-xl font-black text-foreground tracking-tight">{activity.name}</h4>
                                                                        {activity.time && (
                                                                            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-lg font-black text-[10px]">
                                                                                <Clock className="w-3 h-3 ml-1.5" />
                                                                                {activity.time}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-muted-foreground font-bold leading-relaxed">{activity.description}</p>
                                                                    
                                                                    <div className="flex flex-wrap gap-3">
                                                                        {activity.note && (
                                                                            <div className="bg-amber-500/10 text-amber-600 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 border border-amber-500/20 shadow-sm">
                                                                                <Zap className="w-4 h-4" /> {activity.note}
                                                                            </div>
                                                                        )}
                                                                        {activity.tips && (
                                                                            <div className="bg-indigo-500/10 text-indigo-600 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 border border-indigo-500/20 shadow-sm">
                                                                                <Sparkles className="w-4 h-4" /> {activity.tips}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Card>
                             </motion.div>
                           );
                        })}
                    </div>
                 </div>
               )}

               {/* Hotel Cards Section */}
               {trip.hotels && trip.hotels.length > 0 && (
                 <div className="space-y-8">
                    <h2 className="text-3xl font-black text-foreground px-4 flex items-center gap-4">
                        <div className="h-12 w-3 bg-indigo-500 rounded-full" />
                        أماكن الإقامة المنصوح بها
                    </h2>
                    <div className="grid grid-cols-1 gap-8">
                       {trip.hotels.map((hotel: any, idx: number) => (
                          <motion.div key={idx} whileHover={{ y: -5 }}>
                            <Card className="border border-border/60 shadow-xl rounded-[3.5rem] bg-card overflow-hidden p-8 hover:shadow-2xl transition-all duration-500 group">
                                <div className="flex flex-col md:flex-row gap-10">
                                   <div className="w-full md:w-64 h-64 md:h-64 rounded-[2.5rem] overflow-hidden shrink-0 shadow-2xl relative border-4 border-background">
                                      {hotel.image || hotel.images?.[0] ? (
                                         <img src={typeof hotel.image === 'string' ? hotel.image : hotel.images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                                      ) : (
                                         <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <Hotel className="w-12 h-12 text-muted-foreground/20" />
                                         </div>
                                      )}
                                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                                          <Badge className="bg-white/90 backdrop-blur-md text-foreground border-none px-3 py-1.5 rounded-xl font-black text-[10px] shadow-xl">
                                             {hotel.review_word || 'ممتاز'}
                                          </Badge>
                                          {hotel.is_free_cancellable && (
                                              <Badge className="bg-emerald-500 text-white border-none px-3 py-1.5 rounded-xl font-black text-[10px] shadow-xl">
                                                  إلغاء مجاني
                                              </Badge>
                                          )}
                                      </div>
                                   </div>
                                   <div className="flex-1 space-y-6 flex flex-col justify-center">
                                       <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                              <div className="flex gap-0.5">
                                                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className={cn("w-3 h-3", i <= (hotel.rating || 5) ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />)}
                                              </div>
                                              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{hotel.rating || 5} نجوم</span>
                                          </div>
                                          <h3 className="text-3xl font-black text-foreground tracking-tight">{hotel.name}</h3>
                                          <div className="flex items-center gap-2 text-primary font-bold">
                                              <MapPin className="w-4 h-4" />
                                              <span>{hotel.location || trip.destination}</span>
                                          </div>
                                       </div>
                                       <p className="text-muted-foreground font-bold leading-relaxed line-clamp-3">{hotel.description || "استمتع بإقامة فاخرة وخدمات متميزة في قلب المدينة."}</p>
                                       
                                       <div className="flex items-center justify-between pt-4">
                                          <div className="space-y-1">
                                              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">يبدأ من</p>
                                              <p className="text-2xl font-black text-emerald-600 tabular-nums">{hotel.priceRange || '1200 ج.م'}</p>
                                          </div>
                                          <Button className="h-14 px-10 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-white transition-all font-black text-lg gap-3">
                                              احجز الآن
                                              <ArrowUpRight className="w-5 h-5" />
                                          </Button>
                                       </div>
                                   </div>
                                </div>
                            </Card>
                          </motion.div>
                       ))}
                    </div>
                 </div>
               )}
            </div>

            {/* Right Column: Interaction Dashboard */}
            <aside className="lg:col-span-4 space-y-10 sticky top-28">
               
               {/* Trip Map Tracker (Right Sidebar) */}
               <Card className="border border-border/60 shadow-2xl rounded-[3.5rem] bg-card overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-border bg-muted/20 shrink-0 flex items-center justify-between">
                     <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-emerald-500" />
                        الخريطة التفاعلية للمسار
                     </h3>
                     <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                              <Maximize2 className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                           </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 overflow-hidden rounded-[3rem] border-4 border-border shadow-2xl bg-muted flex flex-col" dir="rtl">
                           <div className="p-6 border-b border-border bg-card shrink-0 flex items-center gap-4 relative z-10 shadow-sm">
                              <MapPin className="w-6 h-6 text-emerald-500" />
                              <div>
                                <h2 className="text-2xl font-black text-foreground">مسار رحلة: {trip.title}</h2>
                                <p className="text-sm font-bold text-muted-foreground mt-1">تصفح النقاط على الخريطة لرؤية المزيد من التفاصيل</p>
                              </div>
                           </div>
                           <div className="flex-1 w-full relative">
                              <MapboxTripMap 
                                positions={
                                  trip.activities && trip.activities.length > 0 
                                    ? trip.activities.filter((a: any) => a.coordinates?.lat && a.coordinates?.lng).map((a: any) => a.coordinates)
                                    : [{ lat: 30.0444, lng: 31.2357 }]
                                }
                                activitiesData={trip.activities?.filter((a: any) => a.coordinates?.lat && a.coordinates?.lng) || []}
                                className="w-full h-full absolute inset-0"
                                height="100%"
                              />
                           </div>
                        </DialogContent>
                     </Dialog>
                  </div>
                  <div className="w-full h-[350px] relative bg-muted group/map">
                    <MapboxTripMap 
                      positions={
                        trip.activities && trip.activities.length > 0 
                          ? trip.activities.filter((a: any) => a.coordinates?.lat && a.coordinates?.lng).map((a: any) => a.coordinates)
                          : [{ lat: 30.0444, lng: 31.2357 }]
                      }
                      activitiesData={trip.activities?.filter((a: any) => a.coordinates?.lat && a.coordinates?.lng) || []}
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/map:bg-black/5 pointer-events-none transition-colors" />
                  </div>
               </Card>

               {/* Comments Widget */}
               <Card className="border border-border/60 shadow-2xl rounded-[3.5rem] bg-card overflow-hidden flex flex-col max-h-[800px]">
                  <div className="p-8 border-b border-border bg-muted/20 shrink-0">
                     <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
                        <MessageIcon className="w-6 h-6 text-primary" />
                        نقاشات المسافرين
                        <Badge className="mr-auto bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-lg tabular-nums">
                            {(trip.comments || []).length}
                        </Badge>
                     </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                     <TripComments
                        tripId={trip._id || trip.id}
                        initialComments={trip.comments || []}
                        tripOwnerId={trip.ownerId}
                        onCommentAdded={(newComment) => setTrip((prev: any) => ({ ...prev, comments: [newComment, ...(prev.comments || [])] }))}
                        onCommentUpdated={(id, changes) => setTrip((prev: any) => ({ ...prev, comments: prev.comments.map((c: any) => c.id === id ? { ...c, ...changes } : c) }))}
                        onCommentDeleted={(id) => setTrip((prev: any) => ({ ...prev, comments: prev.comments.filter((c: any) => c.id !== id) }))}
                     />
                  </div>
               </Card>

               {/* Reporting & Safety */}
               <div className="bg-primary/5 rounded-[3rem] p-8 border border-primary/10 space-y-6">
                    <div className="flex items-center gap-3 text-primary">
                        <ShieldCheck className="w-6 h-6" />
                        <h4 className="font-black text-lg">أمان وموثوقية</h4>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                        نحن نحرص على جودة المحتوى المنشور. إذا وجدت أي مخالفة أو معلومات غير صحيحة، يرجى إبلاغنا فوراً.
                    </p>
                    <ReportTripDialog 
                        tripId={trip._id || trip.id} 
                        tripTitle={trip.title}
                        trigger={
                            <Button variant="outline" className="w-full h-12 rounded-xl border-border text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all font-black text-sm gap-2">
                                <Flag className="w-4 h-4" /> إبلاغ عن المحتوى
                            </Button>
                        }
                    />
               </div>

            </aside>
         </div>
      </div>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-border bg-background p-10 font-cairo" dir="rtl">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
                <Trash2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-foreground">حذف الرحلة نهائياً؟</DialogTitle>
            <DialogDescription className="text-center font-bold text-muted-foreground text-lg">
              هل أنت متأكد من حذف هذه الرحلة؟ هذا الإجراء لا يمكن التراجع عنه وسيتم مسح كافة البيانات المرتبطة بها.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-4 mt-8">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1 h-14 rounded-2xl font-black text-lg border-border">إلغاء</Button>
            <Button onClick={handleDeleteTrip} disabled={isDeleting} className="flex-1 h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-lg shadow-xl shadow-rose-500/20">
               {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "حذف الآن"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const toProfilePath = (trip: any) => {
    return trip.ownerId ? `/user/${trip.ownerId}` : `/profile/${trip.author?.replace(/\s+/g, '-')}`;
};

export default TripDetail;
