import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { listTrips, toggleTripLove, toggleTripSave, toggleFollowUser, getUserFollowing } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Star, Clock, MoreHorizontal, LayoutGrid, TrendingUp, ArrowRight, Sparkles, Calendar, Flag } from "lucide-react";
import TripComments from "@/components/TripComments";
import ReportTripDialog from "@/components/ReportTripDialog";
import { SignedIn, useAuth, useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import TripSkeletonLoader from "@/components/TripSkeletonLoader";
import { StoriesBar } from "@/components/StoriesBar";
import { StoryViewer } from "@/components/StoryViewer";
import { StoryUserGroup } from "@/lib/api";
import { Comment } from "@/lib/trips-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LeftSidebar, { TimelineFilters } from "@/components/timeline/LeftSidebar";
import RightSidebar, { FollowedTraveler } from "@/components/timeline/RightSidebar";
import TimelineHero from "@/components/TimelineHero";
import TripAIChatWidget from "@/components/TripAIChatWidget";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

const getTripIdentifier = (trip: any) => {
  if (!trip) return "";
  return String(trip._id || trip.id || "");
};

const Timeline = () => {
  const { toast } = useToast();
  const { isSignedIn, getToken, userId } = useAuth();
  const { user } = useUser();
  const [showHeartByTrip, setShowHeartByTrip] = useState<Record<string, boolean>>({});
  const [activeImageByTrip, setActiveImageByTrip] = useState<Record<string, string>>({});
  const [activeCommentsTripId, setActiveCommentsTripId] = useState<string | null>(null);
  const [loveState, setLoveState] = useState<Record<string, { liked: boolean; likes: number }>>({});
  const [saveState, setSaveState] = useState<Record<string, boolean>>({});
  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryUserGroup | null>(null);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);

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
  const uniqueDestinations = new Set(userTrips.map(t => t.city || t.destination).filter(Boolean));
  const userStats = {
    citiesVisited: uniqueDestinations.size,
    storiesShared: myStoriesCount,
    tripsCreated: userTrips.length,
  };

  useEffect(() => {
    let isMounted = true;
    const loadTrips = async () => {
      setLoading(true);
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
          
          // Initialize states from fetched data
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
        if (isMounted) setLoading(false);
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

    loadTrips();
    return () => { isMounted = false; };
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
                status: `نشر ${formatDate(trip.postedAt)}`, tripCount: 1, isFollowing: false,
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
                // Handle different response structures
                const usersList = followingData.users || followingData.following || (Array.isArray(followingData) ? followingData : []);
                usersList.forEach((u: any) => followingIds.add(u.userId || u.id));
            }
        } catch (e) { console.warn("Failed to load following", e); }

        const uniqueSuggestions = new Map<string, FollowedTraveler>();
        const uniqueFollowing = new Map<string, FollowedTraveler>();

        trips.forEach(trip => {
          if (trip.ownerId && trip.ownerId !== userId && trip.author) {
             const isFollowing = followingIds.has(trip.ownerId) || (trip.viewerFollowsAuthor === true);
             
             // If I follow them, add to following list
             if (isFollowing) {
               if (!uniqueFollowing.has(trip.ownerId)) {
                  uniqueFollowing.set(trip.ownerId, {
                    userId: trip.ownerId, fullName: trip.author, imageUrl: trip.authorImage,
                    status: `نشر ${formatDate(trip.postedAt)}`, tripCount: 1, isFollowing: true,
                  });
               } else { uniqueFollowing.get(trip.ownerId)!.tripCount++; }
             } 
             // If I don't follow them, add to suggestions
             else {
               if (!uniqueSuggestions.has(trip.ownerId)) {
                   uniqueSuggestions.set(trip.ownerId, {
                      userId: trip.ownerId, fullName: trip.author, imageUrl: trip.authorImage,
                      status: `نشر ${formatDate(trip.postedAt)}`, tripCount: 1, isFollowing: false,
                   });
               } else { uniqueSuggestions.get(trip.ownerId)!.tripCount++; }
             }
          }
        });
        
        if (isMounted) {
          setFollowedTravelers(Array.from(uniqueFollowing.values()));
          // For suggestions, we explicitly want people we DON'T follow, or we can mix them. 
          // The user requested to check "if the user follow this user or not and change the button".
          // So we should probably show everyone found in trips, but with correct status.
          
          const allFoundUsers = new Map<string, FollowedTraveler>();
          trips.forEach(trip => {
             if (trip.ownerId && trip.ownerId !== userId && trip.author) {
               const isFollowing = followingIds.has(trip.ownerId) || (trip.viewerFollowsAuthor === true);
               if (!allFoundUsers.has(trip.ownerId)) {
                  allFoundUsers.set(trip.ownerId, {
                    userId: trip.ownerId, fullName: trip.author, imageUrl: trip.authorImage,
                    status: `نشر ${formatDate(trip.postedAt)}`, tripCount: 1, isFollowing,
                  });
               } else { allFoundUsers.get(trip.ownerId)!.tripCount++; }
             }
          });
          
          // Suggestions should prioritize those we don't follow, but can include others
          const sortedSuggestions = Array.from(allFoundUsers.values()).sort((a, b) => {
             // sort: non-following first
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

  useEffect(() => {
    setSaveState((prev) => {
      const next = { ...prev };
      trips.forEach((trip) => {
        const tripId = getTripIdentifier(trip);
        if (!tripId || next.hasOwnProperty(tripId)) return;
        next[tripId] = Boolean(trip.viewerSaved);
      });
      return next;
    });
  }, [trips]);

  const handleToggleLove = async (trip: any, fromGesture: boolean = false) => {
    const tripId = getTripIdentifier(trip);
    if (!tripId) return;
    if (!isSignedIn) { 
      if (!fromGesture) toast({ title: "تسجيل الدخول مطلوب" }); 
      return; 
    }

    const current = loveState[tripId] || { liked: Boolean(trip.viewerLoved), likes: trip.likes || 0 };
    
    // Opt-out of toggling if it's already liked and coming from double click
    if (fromGesture && current.liked) {
      setShowHeartByTrip((p) => ({ ...p, [tripId]: true }));
      setTimeout(() => setShowHeartByTrip((p) => ({ ...p, [tripId]: false })), 1000);
      return;
    }

    // Optimistic update
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
      // Sync with server result just in case
      setLoveState((prev) => ({ ...prev, [tripId]: { liked: result.loved, likes: result.likes } }));
    } catch (e) {
      console.error(e);
      // Rollback on error
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
    } catch (e) { console.error(e); }
  };

  const handleFollowedToggle = async (targetUserId: string) => {
     if (!isSignedIn) return;
     try {
       const token = await getToken();
       const res = await toggleFollowUser(targetUserId, token || "");
       setSuggestedTravelers(prev => prev.map(t => t.userId === targetUserId ? { ...t, isFollowing: res.following } : t));
       if (!res.following) setFollowedTravelers(prev => prev.filter(t => t.userId !== targetUserId));
       toast({ title: res.following ? "تمت المتابعة" : "تم إلغاء المتابعة" });
     } catch (e) { console.error(e); }
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
    return true;
  });

  const activeCommentsTrip = activeCommentsTripId ? trips.find(t => getTripIdentifier(t) === activeCommentsTripId) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-cairo text-right" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        
        <TimelineHero />

        <div className="max-w-[1400px] mx-auto mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
            
            {/* LEFT SIDEBAR */}
            <div className="lg:col-span-3 sticky top-24 hidden lg:block space-y-6 overflow-y-auto max-h-[85vh] no-scrollbar">
               <LeftSidebar
                 filters={filters}
                 onFiltersChange={setFilters}
                 userStats={userStats}
                 upcomingTrip={null}
               />
               
               <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center justify-end gap-2">
                     روابط سريعة
                     <LayoutGrid className="w-4 h-4 text-orange-500" />
                  </h4>
                  <div className="space-y-2">
                     {['لوحة المتصدرين', 'اكتشف الرحلات'].map(link => (
                       <Link key={link} to={link === 'لوحة المتصدرين' ? '/leaderboard' : link === 'اكتشف الرحلات' ? '/discover' : '#'} className="flex items-center justify-between p-2 rounded-xl text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-all">
                         <div className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 rotate-180" />
                            {link}
                         </div>
                       </Link>
                     ))}
                  </div>
               </div>
            </div>

            {/* CENTER FEED */}
            <div className="lg:col-span-6 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-100 overflow-hidden">
                <StoriesBar
                  onUserClick={(user) => { setActiveStoryGroup(user); setIsStoryViewerOpen(true); }}
                />
              </div>

              {loading ? (
                <div className="space-y-6">
                   <div className="h-96 bg-gray-100 rounded-[2.5rem] animate-pulse" />
                   <div className="h-96 bg-gray-100 rounded-[2.5rem] animate-pulse" />
                </div>
              ) : (
                <div className="space-y-8">
                  {filteredTrips.map((trip) => {
                    const id = getTripIdentifier(trip);
                    const isLiked = loveState[id]?.liked;
                    const isSaved = saveState[id];
                    const activeSrc = activeImageByTrip[id] || trip.image;
                    const thumbnails = [
                      ...((trip.activities || []).flatMap((a: any) => a.images || [])),
                      ...((trip.foodAndRestaurants || []).map((f: any) => f.image)),
                    ].filter(Boolean).slice(0, 8);

                    return (
                      <Card key={id} className="group border-0 shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white">
                        <CardContent className="p-0">
                          <div className="p-5 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <Link to={toProfilePath(trip)} className="relative shrink-0">
                                   <div className="p-1 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-500">
                                      <Avatar className="w-12 h-12 border-2 border-white">
                                         <AvatarImage src={trip.authorImage} />
                                         <AvatarFallback className="bg-orange-50 text-orange-600 font-bold">{trip.author?.[0]}</AvatarFallback>
                                      </Avatar>
                                   </div>
                                </Link>
                                <div className="space-y-0.5 text-right">
                                   <Link to={toProfilePath(trip)} className="font-bold text-gray-900 hover:text-orange-600 transition-colors block">
                                      {trip.author}
                                   </Link>
                                   <div className="flex items-center gap-2 text-xs text-gray-500">
                                      {formatDate(trip.postedAt)}
                                      <Clock className="w-3 h-3 text-orange-400" />
                                      <span className="text-gray-300">|</span>
                                      {trip.destination}
                                      <MapPin className="w-3 h-3 text-orange-400" />
                                   </div>
                                </div>
                             </div>
                             
                             <ReportTripDialog 
                               tripId={id} 
                               tripTitle={trip.title}
                               trigger={
                                 <Button variant="ghost" size="icon" className="rounded-full text-gray-400">
                                   <Flag className="w-5 h-5" />
                                 </Button>
                               }
                             />
                          </div>

                          <div className="relative aspect-video overflow-hidden cursor-pointer" onDoubleClick={() => handleToggleLove(trip, true)}>
                             <img src={activeSrc} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                             
                             <AnimatePresence>
                               {showHeartByTrip[id] && (
                                 <motion.div 
                                   initial={{ opacity: 0, scale: 0.5 }}
                                   animate={{ opacity: 1, scale: [0.5, 1.2, 1] }}
                                   exit={{ opacity: 0, scale: 0.5, y: -20 }}
                                   className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                                 >
                                   <div className="bg-white/20 backdrop-blur-sm p-8 rounded-full">
                                      <Heart className="w-20 h-20 text-white fill-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                                   </div>
                                 </motion.div>
                               )}
                             </AnimatePresence>

                             <div className="absolute bottom-4 left-4 flex flex-col gap-2 items-end">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20">
                                   {trip.rating} / 5
                                   <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                </div>
                                {trip.season && (
                                   <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/80 backdrop-blur-md rounded-full text-white text-xs font-bold border border-orange-400/30">
                                      {trip.season === 'winter' ? 'شتاء' : 
                                       trip.season === 'summer' ? 'صيف' :
                                       trip.season === 'fall' ? 'خريف' :
                                       trip.season === 'spring' ? 'ربيع' : trip.season}
                                      <Calendar className="w-3.5 h-3.5" />
                                   </div>
                                )}
                             </div>
                          </div>

                          {thumbnails.length > 0 && (
                            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
                               <button 
                                 onClick={() => setActiveImageByTrip(p => ({ ...p, [id]: trip.image }))}
                                 className={cn("w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all", activeSrc === trip.image ? "border-orange-500 scale-105 shadow-md" : "border-transparent opacity-70")}
                               >
                                  <img src={trip.image} className="w-full h-full object-cover" />
                               </button>
                               {thumbnails.map((src, i) => (
                                 <button 
                                   key={i} 
                                   onClick={() => setActiveImageByTrip(p => ({ ...p, [id]: src }))}
                                   className={cn("w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all", activeSrc === src ? "border-orange-500 scale-105 shadow-md" : "border-transparent opacity-70")}
                                 >
                                    <img src={src} className="w-full h-full object-cover" />
                                 </button>
                               ))}
                            </div>
                          )}

                          <div className="p-6 pt-2 text-right">
                             <Link to={`/trips/${id}`}>
                                <h3 className="text-2xl font-black text-gray-900 mb-2 hover:text-orange-600 transition-colors">
                                  {trip.title}
                                </h3>
                             </Link>
                             <p className="text-gray-500 leading-relaxed line-clamp-2 md:line-clamp-3 mb-6 font-light">
                                {trip.description}
                             </p>

                             <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                   <Button 
                                     variant="ghost" 
                                     className={cn("rounded-full px-5 h-11 gap-2 transition-all", isLiked ? "bg-red-50 text-red-600" : "hover:bg-gray-50 text-gray-500")}
                                     onClick={() => handleToggleLove(trip)}
                                   >
                                      <Heart className={cn("w-5 h-5", isLiked && "fill-red-600 scale-110")} />
                                      <span className="font-bold">{loveState[id]?.likes || 0}</span>
                                   </Button>
                                   
                                   <Button 
                                     variant="ghost" 
                                     className="rounded-full px-5 h-11 gap-2 text-gray-500 hover:bg-gray-50"
                                     onClick={() => setActiveCommentsTripId(id)}
                                   >
                                      <MessageCircle className="w-5 h-5" />
                                      <span className="font-bold">{(trip.comments || []).length}</span>
                                   </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                   <Button variant="ghost" className="rounded-full h-11 px-4 text-gray-500 hover:bg-gray-50" onClick={() => handleToggleSave(trip)}>
                                      <Bookmark className={cn("w-5 h-5", isSaved && "fill-orange-500 text-orange-500 font-bold")} />
                                   </Button>
                                   <Button variant="ghost" className="rounded-full h-11 px-4 text-gray-500 hover:bg-gray-50">
                                      <Share2 className="w-5 h-5" />
                                   </Button>
                                    <Link to={`/trips/${id}`}>
                                        <Button variant="ghost" size="sm" className="rounded-full px-4 text-orange-600 hover:bg-orange-50 h-11">
                                            المزيد
                                        </Button>
                                    </Link>
                                </div>
                             </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="lg:col-span-3 sticky top-24 hidden xl:block space-y-6">


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
      <TripAIChatWidget />
      {isStoryViewerOpen && activeStoryGroup && <StoryViewer group={activeStoryGroup} isOpen={isStoryViewerOpen} onClose={() => setIsStoryViewerOpen(false)} />}
      
      <Dialog open={!!activeCommentsTripId} onOpenChange={(open) => !open && setActiveCommentsTripId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden font-cairo shadow-2xl rounded-[2.5rem] border-0" dir="rtl">
           <div className="p-6 pb-2 border-b border-gray-50">
              <DialogHeader>
                 <DialogTitle className="text-right text-2xl font-black text-gray-900">
                    التعليقات
                    <span className="block text-sm font-bold text-indigo-500 mt-1">{activeCommentsTrip?.title}</span>
                 </DialogTitle>
              </DialogHeader>
           </div>
           <div className="p-6 pt-0 overflow-y-auto custom-scrollbar h-full">
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
