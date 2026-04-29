import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatFacebookDate } from "@/lib/dateUtils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { listTrips, toggleTripLove, toggleTripSave, toggleFollowUser, getUserFollowing } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MapPin, 
  Star, 
  Clock, 
  MoreHorizontal, 
  LayoutGrid, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  Flag, 
  Video, 
  Play, 
  Zap, 
  Filter, 
  MessageSquare as MessageIcon, 
  Image as ImageIcon,
  Users,
  Compass,
  ArrowUpRight,
  ArrowLeft
} from "lucide-react";
import TripComments from "@/components/TripComments";
import ReportTripDialog from "@/components/ReportTripDialog";
import { SignedIn, useAuth, useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/contexts/LoadingContext";
import TripSkeletonLoader from "@/components/TripSkeletonLoader";
import { StoriesBar } from "@/components/StoriesBar";
import { StoryViewer } from "@/components/StoryViewer";
import { StoryUserGroup } from "@/lib/api";
import { Comment } from "@/lib/trips-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LeftSidebar, { TimelineFilters } from "@/components/timeline/LeftSidebar";
import RightSidebar, { FollowedTraveler } from "@/components/timeline/RightSidebar";
import TimelineHero from "@/components/TimelineHero";
import LivePulseMap from "@/components/LivePulseMap";
import { Badge } from "@/components/ui/badge";
import UserBadge, { BadgeTier } from "@/components/UserBadge";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";

const getTripIdentifier = (trip: any) => {
  if (!trip) return "";
  return String(trip._id || trip.id || "");
};

const Timeline = () => {
  const { toast } = useToast();
  const { isSignedIn, getToken, userId } = useAuth();
  const { user } = useUser();
  const { startLoading, stopLoading } = useLoading();

  const normalizeCity = (name: string) => {
    if (!name) return 'unknown';
    let n = name.toLowerCase().trim();
    if (n.includes('alex')) return 'alexandria';
    if (n.includes('cairo') || n.includes('qahira')) return 'cairo';
    if (n.includes('luxor')) return 'luxor';
    if (n.includes('aswan')) return 'aswan';
    if (n.includes('sharm')) return 'sharm el sheikh';
    if (n.includes('dahab')) return 'dahab';
    if (n.includes('ghurghada') || n.includes('hurghada')) return 'hurghada';
    if (n.includes('matrouh') || n.includes('matro')) return 'mersa matrouh';
    return n;
  };

  const [showHeartByTrip, setShowHeartByTrip] = useState<Record<string, boolean>>({});
  const [activeImageByTrip, setActiveImageByTrip] = useState<Record<string, string>>({});
  const [activeCommentsTripId, setActiveCommentsTripId] = useState<string | null>(null);
  const [loveState, setLoveState] = useState<Record<string, { liked: boolean; likes: number }>>({});
  const [saveState, setSaveState] = useState<Record<string, boolean>>({});
  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryUserGroup | null>(null);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const [filters, setFilters] = useState<TimelineFilters>({
    showMyStories: false,
    showFollowed: false,
    showRecommended: true,
    onlyTrips: false,
    onlyTips: false,
  });

  const [followedTravelers, setFollowedTravelers] = useState<FollowedTraveler[]>([]);
  const [suggestedTravelers, setSuggestedTravelers] = useState<FollowedTraveler[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myStoriesCount, setMyStoriesCount] = useState(0);

  const userTrips = trips.filter(t => t.ownerId === userId);
  const uniqueDestinations = new Set(userTrips.map(t => normalizeCity(t.city || t.destination)).filter(c => c !== 'unknown'));
  
  const getTierFromPoints = (points: number): BadgeTier => {
    if (points >= 2000) return 'legend';
    if (points >= 800) return 'diamond';
    if (points >= 350) return 'gold';
    if (points >= 100) return 'silver';
    if (points >= 30) return 'bronze';
    return 'none';
  };

  const userStats = {
    citiesVisited: uniqueDestinations.size,
    storiesShared: myStoriesCount,
    tripsCreated: userTrips.length,
    points: uniqueDestinations.size * 150 + (userTrips.length * 20),
    tier: getTierFromPoints(uniqueDestinations.size * 150 + (userTrips.length * 20))
  };

  useEffect(() => {
    let isMounted = true;
    const loadTrips = async () => {
      setLoading(true);
      startLoading();
      try {
        let token: string | undefined = undefined;
        if (isSignedIn) {
          try {
            const t = await getToken();
            if (t) token = t;
          } catch (e) { console.error("Failed to get token", e); }
        }

        const data = await listTrips({ sort: "recent", limit: 30, page: 1 }, token);
        if (isMounted && data?.items) {
          setTrips(data.items);
          
          const initialLoves: Record<string, { liked: boolean; likes: number }> = {};
          const initialSaves: Record<string, boolean> = {};
          
          data.items.forEach((trip: any) => {
            const id = String(trip._id || trip.id);
            initialLoves[id] = { liked: Boolean(trip.viewerLoved), likes: trip.likes || 0 };
            initialSaves[id] = Boolean(trip.viewerSaved);
          });
          
          setLoveState(initialLoves);
          setSaveState(initialSaves);
        }
      } catch (error) {
        console.error("Error loading trips:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
          stopLoading();
        }
      }

      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            const { getMyStories } = await import("@/lib/api");
            const storiesData = await getMyStories(token);
            if (isMounted && storiesData?.items) setMyStoriesCount(storiesData.items.length);
          }
        } catch (e) { console.error(e); }
      }
    };

    const handleTripUpdated = () => {
      if (isMounted) loadTrips();
    };

    window.addEventListener('tripUpdated', handleTripUpdated);
    loadTrips();

    return () => { 
      isMounted = false; 
      window.removeEventListener('tripUpdated', handleTripUpdated);
    };
  }, [isSignedIn, getToken]);

  useEffect(() => {
    let isMounted = true;
    const loadFollowedAndSuggestions = async () => {
      if (!isSignedIn) {
          setFollowedTravelers([]);
          const uniqueUsers = new Map<string, FollowedTraveler>();
          trips.forEach(trip => {
          if (trip.ownerId && trip.author) {
            if (!uniqueUsers.has(trip.ownerId)) {
              uniqueUsers.set(trip.ownerId, {
                userId: trip.ownerId, fullName: trip.author, imageUrl: trip.authorImage,
                status: `نشر ${formatFacebookDate(trip.postedAt)}`, tripCount: 1, isFollowing: false,
                badgeTier: trip.authorBadge,
              });
            } else { uniqueUsers.get(trip.ownerId)!.tripCount += 1; }
          }
        });
        setSuggestedTravelers(Array.from(uniqueUsers.values()).slice(0, 8));
        return;
      }
      setLoadingFollowed(true);
      try {
        const token = await getToken();
        if (!token || !isMounted) return;
        
        let followingIds = new Set<string>();
        try {
            const followingData = await getUserFollowing(userId!);
            if (followingData) {
                const usersList = followingData.users || followingData.following || (Array.isArray(followingData) ? followingData : []);
                usersList.forEach((u: any) => followingIds.add(u.userId || u.id));
            }
        } catch (e) { console.warn("Failed to load following", e); }

        const allFoundUsers = new Map<string, FollowedTraveler>();
        trips.forEach(trip => {
           if (trip.ownerId && trip.ownerId !== userId && trip.author) {
             const isFollowing = followingIds.has(trip.ownerId) || (trip.viewerFollowsAuthor === true);
             if (!allFoundUsers.has(trip.ownerId)) {
                 allFoundUsers.set(trip.ownerId, {
                   userId: trip.ownerId, fullName: trip.author, imageUrl: trip.authorImage,
                   status: `نشر ${formatFacebookDate(trip.postedAt)}`, tripCount: 1, isFollowing,
                   points: trip.authorPoints || 200,
                   badgeTier: trip.authorBadge,
                 });
             } else { allFoundUsers.get(trip.ownerId)!.tripCount++; }
           }
        });
        
        if (isMounted) {
          const sortedSuggestions = Array.from(allFoundUsers.values()).sort((a, b) => {
             if (a.isFollowing === b.isFollowing) return b.tripCount - a.tripCount;
             return a.isFollowing ? 1 : -1;
          }).slice(0, 8);

          setSuggestedTravelers(sortedSuggestions);
          setLoadingFollowed(false);
        }
      } catch (e) { console.error(e); if (isMounted) setLoadingFollowed(false); }
    };
    loadFollowedAndSuggestions();
    return () => { isMounted = false; };
  }, [trips, isSignedIn, userId, getToken]);

  useEffect(() => {
    setLoveState((prev) => {
      const next = { ...prev };
      trips.forEach((trip) => {
        const tripId = getTripIdentifier(trip);
        if (!tripId || next[tripId]) return;
        next[tripId] = { liked: Boolean(trip.viewerLoved), likes: trip.likes || 0 };
      });
      return next;
    });
  }, [trips]);

  const handleToggleLove = async (trip: any, fromGesture: boolean = false) => {
    const tripId = getTripIdentifier(trip);
    if (!tripId) return;
    if (!isSignedIn) { 
      if (!fromGesture) toast({ title: "تسجيل الدخول مطلوب", description: "يجب تسجيل الدخول للإعجاب بالمنشورات" }); 
      return; 
    }

    const current = loveState[tripId] || { liked: Boolean(trip.viewerLoved), likes: trip.likes || 0 };
    if (fromGesture && current.liked) {
      setShowHeartByTrip((p) => ({ ...p, [tripId]: true }));
      setTimeout(() => setShowHeartByTrip((p) => ({ ...p, [tripId]: false })), 1000);
      return;
    }

    const nextLiked = !current.liked;
    const nextLikes = nextLiked ? current.likes + 1 : Math.max(0, current.likes - 1);
    
    setLoveState((prev) => ({ ...prev, [tripId]: { liked: nextLiked, likes: nextLikes } }));

    if (nextLiked) {
      setShowHeartByTrip((p) => ({ ...p, [tripId]: true }));
      setTimeout(() => setShowHeartByTrip((p) => ({ ...p, [tripId]: false })), 1000);
    }

    try {
      const token = await getToken();
      const result = await toggleTripLove(trip._id || trip.id, token || "");
      setLoveState((prev) => ({ ...prev, [tripId]: { liked: result.loved, likes: result.likes } }));
    } catch (e) {
      console.error(e);
      setLoveState((prev) => ({ ...prev, [tripId]: current }));
      toast({ title: "حدث خطأ ما", variant: "destructive" });
    }
  };

  const handleToggleSave = async (trip: any) => {
    const tripId = getTripIdentifier(trip);
    if (!tripId || !isSignedIn) return;
    try {
      const token = await getToken();
      const result = await toggleTripSave(trip._id, token || "");
      setSaveState((prev) => ({ ...prev, [tripId]: result.saved }));
      toast({ title: result.saved ? "تم الحفظ" : "تم إلغاء الحفظ", description: result.saved ? "تمت إضافة الرحلة للمحفوظات" : "" });
    } catch (e) { console.error(e); }
  };

  const handleFollowedToggle = async (targetUserId: string) => {
     if (!isSignedIn) return;
     try {
       const token = await getToken();
       const res = await toggleFollowUser(targetUserId, token || "");
       setSuggestedTravelers(prev => prev.map(t => t.userId === targetUserId ? { ...t, isFollowing: res.following } : t));
       toast({ title: res.following ? "تمت المتابعة" : "تم إلغاء المتابعة" });
     } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "رحلتي", url });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "تم نسخ الرابط" });
    }
  };

  const toProfilePath = (trip: any) => {
    return trip.ownerId ? `/user/${trip.ownerId}` : `/profile/${trip.author?.replace(/\s+/g, '-')}`;
  };

  const filteredTrips = trips.filter(trip => {
    const hasActiveFilters = filters.showMyStories || filters.showFollowed || filters.showRecommended;
    if (!hasActiveFilters) return true;
    if (filters.showMyStories && trip.ownerId === userId) return true;
    if (filters.showFollowed && followedTravelers.some(t => t.userId === trip.ownerId)) return true;
    if (filters.showRecommended && trip.ownerId !== userId) return true;
    return false;
  }).filter(trip => {
    if (filters.onlyTrips && trip.isAIGenerated) return false;
    if (filters.season && filters.season !== 'all' && trip.season !== filters.season) return false;
    if (filters.postType && filters.postType !== 'all' && trip.postType !== filters.postType) return false;
    return true;
  });

  const activeCommentsTrip = activeCommentsTripId ? trips.find(t => getTripIdentifier(t) === activeCommentsTripId) : null;

  return (
    <div className="min-h-screen bg-background font-cairo text-right transition-all duration-700" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        
        <TimelineHero />

        <div className="max-w-[1400px] mx-auto mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative items-start">
            
            {/* Left Sidebar - Sticky */}
            <div className="lg:col-span-3 sticky top-28 hidden lg:block space-y-8 overflow-y-auto max-h-[calc(100vh-8rem)] custom-scrollbar pr-1">
                 <LeftSidebar
                   filters={filters}
                   onFiltersChange={setFilters}
                   userStats={userStats}
                   upcomingTrip={null}
                 />
               
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-border group overflow-hidden relative"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                  
                  <h4 className="font-black text-foreground text-lg mb-6 flex items-center justify-end gap-3 relative z-10">
                     استكشف المزيد
                     <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Compass className="w-4 h-4" />
                     </div>
                  </h4>
                  <div className="space-y-3 relative z-10">
                     {[
                       { name: 'لوحة المتصدرين', path: '/leaderboard', icon: TrendingUp },
                       { name: 'اكتشف الرحلات', path: '/discover', icon: MapPin },
                       { name: 'وكالات السفر', path: '/agency', icon: Users }
                     ].map(link => (
                       <Link 
                        key={link.name} 
                        to={link.path} 
                        className="flex items-center justify-between p-4 rounded-2xl text-sm font-black text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-lg group/item"
                       >
                         <ArrowUpRight className="w-4 h-4 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                         <div className="flex items-center gap-3">
                            {link.name}
                            <link.icon className="w-4 h-4" />
                         </div>
                       </Link>
                     ))}
                  </div>
               </motion.div>
            </div>

            {/* Center Feed */}
            <div className="lg:col-span-6 space-y-10">
              {/* Mobile Filter Toggle */}
              <div className="flex lg:hidden mb-6">
                <Sheet open={showFiltersMobile} onOpenChange={setShowFiltersMobile}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full h-16 gap-3 rounded-2xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-black text-lg shadow-lg">
                      <Filter className="w-5 h-5" />
                      تخصيص الخلاصة
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[320px] max-w-[90vw] p-0 overflow-y-auto bg-background border-border" dir="rtl">
                    <SheetHeader className="p-6 border-b border-border">
                      <SheetTitle className="text-right font-black text-2xl text-foreground">تصفية الرحلات</SheetTitle>
                    </SheetHeader>
                    <div className="p-6 space-y-6">
                      <LeftSidebar
                        filters={filters}
                        onFiltersChange={setFilters}
                        userStats={userStats}
                        upcomingTrip={null}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Stories Section */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card/50 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-border overflow-hidden transition-all"
              >
                <StoriesBar
                  onUserClick={(user) => { setActiveStoryGroup(user); setIsStoryViewerOpen(true); }}
                />
              </motion.div>

              {/* Post Feed */}
              {loading ? (
                <div className="space-y-10">
                   <TripSkeletonLoader variant="list" />
                   <TripSkeletonLoader variant="list" />
                </div>
              ) : (
                <div id="timeline-posts" className="space-y-12">
                  {filteredTrips.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-[3rem] border border-dashed border-border shadow-inner">
                       <Sparkles className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                       <h3 className="text-2xl font-black text-foreground mb-2">لا توجد نتائج</h3>
                       <p className="text-muted-foreground font-bold">جرب تغيير الفلاتر لاستكشاف المزيد من الرحلات</p>
                    </div>
                  ) : (
                    filteredTrips.map((trip, index) => {
                      const id = getTripIdentifier(trip);
                      const isLiked = loveState[id]?.liked;
                      const isSaved = saveState[id];
                      const activeSrc = activeImageByTrip[id] || trip.image;
                      const thumbnails = [
                        ...((trip.activities || []).flatMap((a: any) => a.images || [])),
                        ...((trip.foodAndRestaurants || []).map((f: any) => f.image)),
                      ].filter(Boolean).slice(0, 8);

                      return (
                        <motion.div
                          key={id}
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.1, 0.5) }}
                        >
                          <Card className="group border-0 shadow-2xl hover:shadow-[0_40px_100px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_40px_100px_rgba(0,0,0,0.5)] transition-all duration-700 rounded-[3rem] overflow-hidden bg-card/80 backdrop-blur-xl ring-1 ring-border">
                            <CardContent className="p-0">
                              {/* Post Header */}
                              <div className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Link to={toProfilePath(trip)} className="relative shrink-0 group/avatar">
                                       <div className="p-1 rounded-2xl bg-gradient-to-tr from-primary to-orange-400 group-hover/avatar:rotate-6 transition-transform">
                                          <Avatar className="w-14 h-14 border-4 border-background rounded-[1.1rem]">
                                             <AvatarImage src={trip.authorImage} className="object-cover" />
                                             <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">{trip.author?.[0]}</AvatarFallback>
                                          </Avatar>
                                       </div>
                                       <div className="absolute -bottom-1 -right-1">
                                          <UserBadge tier={trip.authorBadge || 'none'} size='sm' showLabel={false} />
                                       </div>
                                    </Link>
                                     <div className="space-y-0.5 text-right flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-0.5">
                                             <Link to={toProfilePath(trip)} className="font-black text-foreground hover:text-primary transition-colors block text-lg leading-tight tracking-tight">
                                                {trip.author}
                                             </Link>
                                          </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold">
                                           {formatFacebookDate(trip.postedAt)}
                                           <span className="text-border/30">•</span>
                                           <div className="flex items-center gap-1 text-primary">
                                              <MapPin className="w-3 h-3" />
                                              {trip.destination}
                                           </div>
                                        </div>
                                     </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {trip.postType === 'quick' && (
                                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-200/50 gap-1.5 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                                      <Zap className="w-3.5 h-3.5 fill-amber-500" />
                                      بوست سريع
                                    </Badge>
                                  )}
                                  {trip.postType === 'ask' && (
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50 gap-1.5 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                                      <MessageCircle className="w-3.5 h-3.5 fill-emerald-600" />
                                      سؤال واستفسار
                                    </Badge>
                                  )}
                                  <ReportTripDialog 
                                    tripId={id} 
                                    tripTitle={trip.title}
                                    trigger={
                                      <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                                        <Flag className="w-5 h-5" />
                                      </Button>
                                    }
                                  />
                                </div>
                              </div>

                              {/* Post Media */}
                               {(!(trip.postType === 'ask' && !trip.image)) && (
                                 <div className={cn("relative aspect-video overflow-hidden bg-muted", trip.postType !== 'quick' && "cursor-pointer")} onDoubleClick={(!trip.activities?.[0]?.videos?.[0] && trip.postType !== 'quick') ? () => handleToggleLove(trip, true) : undefined}>
                                   {trip.activities?.[0]?.videos?.[0] ? (
                                     <CustomVideoPlayer 
                                       src={trip.activities[0].videos[0]} 
                                     />
                                   ) : (
                                     <>
                                       {activeSrc ? (
                                         <img src={activeSrc} alt="" className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" />
                                       ) : (
                                         <div className="w-full h-full flex items-center justify-center">
                                           <ImageIcon className="w-16 h-16 text-muted-foreground/10" />
                                         </div>
                                       )}
                                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                     </>
                                   )}
                                   
                                   <AnimatePresence>
                                     {showHeartByTrip[id] && (
                                       <motion.div 
                                         initial={{ opacity: 0, scale: 0 }}
                                         animate={{ opacity: 1, scale: [0, 1.5, 1] }}
                                         exit={{ opacity: 0, scale: 2, y: -100 }}
                                         transition={{ duration: 0.5, ease: "backOut" }}
                                         className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                                       >
                                          <div className="bg-white/20 backdrop-blur-md p-10 rounded-full border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                                             <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
                                          </div>
                                       </motion.div>
                                     )}
                                   </AnimatePresence>
      
                                   <div className="absolute bottom-6 left-6 flex flex-col gap-3 items-end">
                                      <div className="flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-xl rounded-2xl text-white text-xs font-black border border-white/20 shadow-2xl">
                                         {trip.rating} / 5
                                         <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                      </div>
                                      {trip.season && (
                                         <div className="flex items-center gap-2 px-4 py-2 bg-primary/80 backdrop-blur-xl rounded-2xl text-white text-xs font-black border border-white/20 shadow-2xl">
                                            {trip.season === 'winter' ? 'شتاء' : 
                                             trip.season === 'summer' ? 'صيف' :
                                             trip.season === 'fall' ? 'خريف' :
                                             trip.season === 'spring' ? 'ربيع' : trip.season}
                                            <Calendar className="w-4 h-4" />
                                         </div>
                                      )}
                                   </div>
                                 </div>
                               )}

                              {/* Thumbnails */}
                              {thumbnails.length > 0 && (
                                <div className="flex gap-3 p-6 pb-2 overflow-x-auto custom-scrollbar">
                                   <button 
                                     onClick={() => setActiveImageByTrip(p => ({ ...p, [id]: trip.image }))}
                                     className={cn("w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-4 transition-all duration-500", activeSrc === trip.image ? "border-primary scale-110 shadow-xl" : "border-transparent opacity-50 grayscale hover:grayscale-0")}
                                   >
                                      <img src={trip.image} className="w-full h-full object-cover" />
                                   </button>
                                   {thumbnails.map((src, i) => (
                                     <button 
                                       key={i} 
                                       onClick={() => setActiveImageByTrip(p => ({ ...p, [id]: src }))}
                                       className={cn("w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-4 transition-all duration-500", activeSrc === src ? "border-primary scale-110 shadow-xl" : "border-transparent opacity-50 grayscale hover:grayscale-0")}
                                     >
                                        <img src={src} className="w-full h-full object-cover" />
                                     </button>
                                   ))}
                                </div>
                              )}

                              {/* Post Body */}
                              <div className="p-8 pt-4 text-right">
                                 {trip.postType !== 'ask' ? (
                                   <>
                                     {trip.postType === 'quick' ? (
                                        <h3 className="text-3xl font-black text-foreground mb-4 tracking-tighter leading-none">
                                          {trip.title}
                                        </h3>
                                     ) : (
                                        <Link to={`/trips/${id}`}>
                                           <h3 className="text-3xl font-black text-foreground mb-4 hover:text-primary transition-colors tracking-tighter leading-none">
                                             {trip.title}
                                           </h3>
                                        </Link>
                                     )}
                                     <p className="text-muted-foreground leading-relaxed text-lg line-clamp-3 mb-8 font-bold opacity-80">
                                        {trip.description}
                                     </p>
                                   </>
                                 ) : (
                                   <p className="text-foreground text-2xl leading-relaxed mb-8 font-black tracking-tight">
                                      {trip.description}
                                   </p>
                                 )}

                                 <div className="flex items-center justify-between pt-6 border-t border-border/60">
                                    <div className="flex items-center gap-3">
                                       <Button 
                                         variant="ghost" 
                                         className={cn("rounded-2xl px-6 h-14 gap-3 transition-all font-black text-base shadow-sm", isLiked ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" : "hover:bg-muted text-muted-foreground border border-transparent")}
                                         onClick={() => handleToggleLove(trip)}
                                       >
                                          <Heart className={cn("w-6 h-6 transition-all", isLiked && "fill-rose-600 scale-125")} />
                                          <span className="tabular-nums">{loveState[id]?.likes || 0}</span>
                                       </Button>
                                       
                                       <Button 
                                         variant="ghost" 
                                         className="rounded-2xl px-6 h-14 gap-3 text-muted-foreground hover:bg-muted font-black text-base border border-transparent shadow-sm"
                                         onClick={() => setActiveCommentsTripId(id)}
                                       >
                                          <MessageCircle className="w-6 h-6" />
                                          <span className="tabular-nums">{(trip.comments || []).length}</span>
                                       </Button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                       <Button variant="ghost" className={cn("rounded-2xl h-14 w-14 p-0 text-muted-foreground hover:bg-muted border border-transparent shadow-sm", isSaved && "text-primary bg-primary/10 border-primary/20")} onClick={() => handleToggleSave(trip)}>
                                          <Bookmark className={cn("w-6 h-6", isSaved && "fill-primary")} />
                                       </Button>
                                       <Button variant="ghost" className="rounded-2xl h-14 w-14 p-0 text-muted-foreground hover:bg-muted border border-transparent shadow-sm" onClick={() => handleShare()}>
                                          <Share2 className="w-6 h-6" />
                                       </Button>
                                        {(trip.postType !== 'ask' && trip.postType !== 'quick') && (
                                          <Link to={`/trips/${id}`}>
                                              <Button className="rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-white font-black shadow-xl shadow-primary/20 gap-2 group/btn">
                                                  تفاصيل الرحلة
                                                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                              </Button>
                                          </Link>
                                        )}
                                    </div>
                                 </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar - Sticky */}
            <div className="lg:col-span-3 sticky top-28 hidden xl:block space-y-8">
                <RightSidebar
                  followedTravelers={suggestedTravelers}
                  onToggleFollow={handleFollowedToggle}
                  isLoading={loadingFollowed}
                />
            </div>
          </div>
        </div>
      </main>

      <Footer />
      {isStoryViewerOpen && activeStoryGroup && <StoryViewer group={activeStoryGroup} isOpen={isStoryViewerOpen} onClose={() => setIsStoryViewerOpen(false)} />}
      
      <Dialog open={!!activeCommentsTripId} onOpenChange={(open) => !open && setActiveCommentsTripId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden font-cairo shadow-[0_50px_100px_rgba(0,0,0,0.5)] rounded-[3.5rem] border-0 bg-background flex flex-col" dir="rtl">
           <div className="p-8 border-b border-border bg-card/50 backdrop-blur-xl shrink-0">
              <DialogHeader>
                 <DialogTitle className="text-right text-3xl font-black text-foreground tracking-tight">
                    التعليقات والمناقشات
                    <span className="block text-sm font-black text-primary mt-2 uppercase tracking-widest">{activeCommentsTrip?.title}</span>
                 </DialogTitle>
                 <DialogDescription className="sr-only">
                    عرض جميع تعليقات المستخدمين على هذا المنشور والتفاعل معها.
                 </DialogDescription>
              </DialogHeader>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <TripComments
                tripId={activeCommentsTripId || ""}
                initialComments={activeCommentsTrip ? (Array.isArray(activeCommentsTrip.comments) ? activeCommentsTrip.comments : []) : []}
                tripOwnerId={activeCommentsTrip?.ownerId || activeCommentsTrip?.userId}
                onCommentAdded={(newComment) => {
                   setTrips(prev => prev.map(t => getTripIdentifier(t) === activeCommentsTripId ? { ...t, comments: [newComment, ...(t.comments || [])] } : t));
                }}
              />
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timeline;
