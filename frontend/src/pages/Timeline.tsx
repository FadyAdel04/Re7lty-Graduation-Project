import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { listTrips, toggleTripLove, toggleTripSave, toggleFollowUser } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Star, Eye } from "lucide-react";
import TripComments from "@/components/TripComments";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TripSkeletonLoader from "@/components/TripSkeletonLoader";
import { StoriesBar } from "@/components/StoriesBar";
import { StoryViewer } from "@/components/StoryViewer";
import { StoryUserGroup } from "@/lib/api";
import { Comment } from "@/lib/trips-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LeftSidebar, { TimelineFilters } from "@/components/timeline/LeftSidebar";
import RightSidebar, { FollowedTraveler } from "@/components/timeline/RightSidebar";

// Module-level cache for trips data (loaded once per session)
let tripsCache: any[] | null = null;
let isLoadingCache = false;
let loadPromise: Promise<any[]> | null = null;

async function fetchTripsFromApi() {
  try {
    const data = await listTrips({ sort: "recent", limit: 20, page: 1 });
    return data.items || [];
  } catch (error) {
    console.error("Error loading trips:", error);
    return [];
  }
}

function primeTripsCache() {
  if (tripsCache || loadPromise || isLoadingCache) {
    return loadPromise;
  }

  isLoadingCache = true;
  const promise = fetchTripsFromApi()
    .then((items) => {
      tripsCache = items;
      return items;
    })
    .finally(() => {
      isLoadingCache = false;
      loadPromise = null;
    });

  loadPromise = promise;
  return promise;
}

// Start fetching as soon as the module loads to minimize perceived wait time
primeTripsCache();

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    // Format as: YYYY-MM-DD or DD/MM/YYYY based on preference
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

const getTripIdentifier = (trip: any) => {
  if (!trip) return "";
  if (trip._id) return String(trip._id);
  if (trip.id) return String(trip.id);
  return "";
};

const Timeline = () => {
  const { toast } = useToast();
  const { isSignedIn, getToken, userId } = useAuth();
  const { user } = useUser();
  const [showHeartByTrip, setShowHeartByTrip] = useState<Record<string, boolean>>({});
  const [activeImageByTrip, setActiveImageByTrip] = useState<Record<string, string>>({});
  const [activeCommentsTripId, setActiveCommentsTripId] = useState<string | null>(null);
  const lastTapRef = useRef<Record<string, number>>({});
  const [loveState, setLoveState] = useState<Record<string, { liked: boolean; likes: number }>>({});
  const [saveState, setSaveState] = useState<Record<string, boolean>>({});
  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryUserGroup | null>(null);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);

  // New state for three-column layout
  const [filters, setFilters] = useState<TimelineFilters>({
    showMyStories: false,
    showFollowed: false,
    showRecommended: true,
    onlyTrips: false,
    onlyTips: false,
  });

  // Followed travelers state - fetch from API
  const [followedTravelers, setFollowedTravelers] = useState<FollowedTraveler[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);

  // Upcoming trip - will be fetched from API
  const upcomingTrip = null; // Set to null for now

  const triggerHeart = (tripId: string) => {
    setShowHeartByTrip((prev) => ({ ...prev, [tripId]: true }));
    setTimeout(() => setShowHeartByTrip((prev) => ({ ...prev, [tripId]: false })), 700);
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

  const handleDouble = (trip: any) => {
    const id = getTripIdentifier(trip);
    if (!id) return;
    const now = Date.now();
    const last = lastTapRef.current[id] || 0;
    if (now - last < 350) {
      handleToggleLove(trip, true);
    }
    lastTapRef.current[id] = now;
  };

  const [trips, setTrips] = useState<any[]>(tripsCache || []);
  const [loading, setLoading] = useState(!tripsCache);

  // User stats - calculated from actual trip data
  const userStats = {
    countriesVisited: 12,
    storiesShared: trips.filter(t => t.ownerId === userId).length,
    tripsCreated: trips.filter(t => t.ownerId === userId).length,
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadTrips = async () => {
      // If cache already filled, use it immediately
      if (tripsCache) {
        setTrips(tripsCache);
        setLoading(false);
        return;
      }

      // If a fetch is already in flight, await it
      if (loadPromise) {
        try {
          const data = await loadPromise;
          if (isMounted && data) {
            setTrips(data);
            setLoading(false);
          }
          return;
        } catch {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
      }

      // Kick off a new fetch immediately
      setLoading(true);
      const promise = primeTripsCache();

      if (!promise) {
        setLoading(false);
        return;
      }

      try {
        const tripsData = await promise;
        if (isMounted) {
          setTrips(tripsData || []);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadTrips();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Load followed users
  useEffect(() => {
    let isMounted = true;

    const loadFollowedUsers = async () => {
      if (!isSignedIn) {
        setFollowedTravelers([]);
        return;
      }

      setLoadingFollowed(true);
      try {
        const token = await getToken();
        if (!token || !isMounted) return;

        // For now, extract unique users from trips
        // In production, this would be a dedicated API call
        const uniqueUsers = new Map<string, FollowedTraveler>();
        
        trips.forEach(trip => {
          if (trip.ownerId && trip.ownerId !== userId && trip.author) {
            if (!uniqueUsers.has(trip.ownerId)) {
              uniqueUsers.set(trip.ownerId, {
                userId: trip.ownerId,
                fullName: trip.author,
                imageUrl: trip.authorImage,
                status: `نشر ${formatDate(trip.postedAt)}`,
                tripCount: 1,
                isFollowing: true,
              });
            } else {
              const user = uniqueUsers.get(trip.ownerId)!;
              user.tripCount += 1;
            }
          }
        });

        if (isMounted) {
          setFollowedTravelers(Array.from(uniqueUsers.values()).slice(0, 10));
          setLoadingFollowed(false);
        }
      } catch (error) {
        console.error('Error loading followed users:', error);
        if (isMounted) {
          setLoadingFollowed(false);
        }
      }
    };

    loadFollowedUsers();

    return () => {
      isMounted = false;
    };
  }, [trips, isSignedIn, userId, getToken]);

  useEffect(() => {
    setLoveState((prev) => {
      const next = { ...prev };
      trips.forEach((trip) => {
        const tripId = getTripIdentifier(trip);
        if (!tripId || next[tripId]) return;
        next[tripId] = {
          liked: Boolean(trip.viewerLoved),
          likes: typeof trip.likes === "number" ? trip.likes : 0,
        };
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

  const updateTripComments = (tripId: string, updater: (comments: Comment[]) => Comment[]) => {
    let updatedSnapshot: any = null;
    setTrips((prev) =>
      prev.map((trip) => {
        if (getTripIdentifier(trip) !== tripId) return trip;
        const currentComments: Comment[] = Array.isArray(trip.comments) ? trip.comments : [];
        const nextComments = updater([...currentComments]);
        const updatedTrip = { ...trip, comments: nextComments };
        updatedSnapshot = updatedTrip;
        return updatedTrip;
      })
    );
    if (updatedSnapshot && tripsCache) {
      tripsCache = tripsCache.map((trip) =>
        getTripIdentifier(trip) === tripId ? updatedSnapshot : trip
      );
    }
  };

  const syncTripLikes = (tripId: string, likes: number) => {
    setTrips((prev) =>
      prev.map((trip) =>
        getTripIdentifier(trip) === tripId ? { ...trip, likes } : trip
      )
    );
    if (tripsCache) {
      tripsCache = tripsCache.map((trip) =>
        getTripIdentifier(trip) === tripId ? { ...trip, likes } : trip
      );
    }
  };

  const syncTripSaves = (tripId: string, saves: number) => {
    setTrips((prev) =>
      prev.map((trip) =>
        getTripIdentifier(trip) === tripId ? { ...trip, saves } : trip
      )
    );
    if (tripsCache) {
      tripsCache = tripsCache.map((trip) =>
        getTripIdentifier(trip) === tripId ? { ...trip, saves } : trip
      );
    }
  };

  const handleToggleLove = async (trip: any, fromGesture: boolean = false) => {
    const tripId = getTripIdentifier(trip);
    if (!tripId) return;
    const current = loveState[tripId] || {
      liked: Boolean(trip.viewerLoved),
      likes: typeof trip.likes === "number" ? trip.likes : 0,
    };

    if (!trip?._id) {
      const nextLiked = !current.liked;
      const nextLikes = Math.max(0, current.likes + (nextLiked ? 1 : -1));
      setLoveState((prev) => ({ ...prev, [tripId]: { liked: nextLiked, likes: nextLikes } }));
      syncTripLikes(tripId, nextLikes);
      if (nextLiked) triggerHeart(tripId);
      return;
    }

    if (!isSignedIn) {
      if (!fromGesture) {
        handleUnauthenticatedLike();
      }
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }
      const result = await toggleTripLove(trip._id, token);
      setLoveState((prev) => ({ ...prev, [tripId]: { liked: result.loved, likes: result.likes } }));
      syncTripLikes(tripId, result.likes);
      if (result.loved) {
        triggerHeart(tripId);
      }
    } catch (error: any) {
      console.error("Error toggling love:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر تحديث حالة الإعجاب",
        variant: "destructive",
      });
    }
  };

  const handleToggleSave = async (trip: any) => {
    const tripId = getTripIdentifier(trip);
    if (!tripId) return;

    if (!trip?._id) {
      const current = saveState.hasOwnProperty(tripId)
        ? saveState[tripId]
        : Boolean(trip.viewerSaved);
      const nextSaved = !current;
      setSaveState((prev) => ({ ...prev, [tripId]: nextSaved }));
      setTrips((prevTrips) =>
        prevTrips.map((t) =>
          getTripIdentifier(t) === tripId
            ? { ...t, saves: Math.max(0, (t.saves || 0) + (nextSaved ? 1 : -1)) }
            : t
        )
      );
      return;
    }

    if (!isSignedIn) {
      handleUnauthenticatedSave();
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }
      const result = await toggleTripSave(trip._id, token);
      setSaveState((prev) => ({ ...prev, [tripId]: result.saved }));
      syncTripSaves(tripId, result.saves);
    } catch (error: any) {
      console.error("Error toggling save:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر تحديث حالة الحفظ",
        variant: "destructive",
      });
    }
  };

  const activeCommentsTrip = activeCommentsTripId
    ? trips.find((trip) => getTripIdentifier(trip) === activeCommentsTripId)
    : null;

  const toProfilePath = (trip: any) => {
    // Use ownerId if available, otherwise fallback to author name
    return trip.ownerId ? `/user/${trip.ownerId}` : `/profile/${trip.author.replace(/\s+/g, '-')}`;
  };

  // Filter trips based on selected filters
  const filteredTrips = trips.filter((trip) => {
    // If no filters are active (all false), show all trips
    const hasActiveFilters = filters.showMyStories || filters.showFollowed || filters.showRecommended;
    
    if (!hasActiveFilters) {
      // No filters active, show all trips
      return true;
    }

    // Check user-specific filters
    if (filters.showMyStories && trip.ownerId === userId) {
      return true;
    }

    if (filters.showFollowed) {
      // Check if trip author is in followed travelers list
      const isFromFollowedUser = followedTravelers.some(
        (traveler) => traveler.userId === trip.ownerId
      );
      if (isFromFollowedUser) {
        return true;
      }
    }

    if (filters.showRecommended) {
      // For now, show all non-user trips as recommended
      // In production, this would use a recommendation algorithm
      return trip.ownerId !== userId;
    }

    return false;
  }).filter((trip) => {
    // Apply content type filters
    if (filters.onlyTrips && trip.isAIGenerated) {
      return false; // Exclude AI-generated trips if only showing manual trips
    }
    if (filters.onlyTips) {
      // For now, we don't have a "tips" type, so this would filter nothing
      // In production, you'd check for a trip.type === 'tip' or similar
      return false;
    }
    return true;
  });

  // Handle toggle follow
  const handleToggleFollow = async (targetUserId: string) => {
    if (!isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لمتابعة المسافرين",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }

      await toggleFollowUser(targetUserId, token);
      
      // Update local state
      setFollowedTravelers((prev) =>
        prev.map((traveler) =>
          traveler.userId === targetUserId
            ? { ...traveler, isFollowing: !traveler.isFollowing }
            : traveler
        )
      );

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة المتابعة بنجاح",
      });
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر تحديث حالة المتابعة",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full px-4 py-6 sm:py-8">
        <div className="max-w-[1600px] mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">الرحلات التى تمت مشاركتها مؤخرا</h1>
          
          {/* Three-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_minmax(500px,700px)_320px] gap-6 justify-center">
            {/* Left Sidebar - Hidden on mobile, visible on lg+ */}
            <div className="hidden lg:block sticky top-24 h-fit">
              <LeftSidebar
                filters={filters}
                onFiltersChange={setFilters}
                userStats={userStats}
                upcomingTrip={upcomingTrip}
              />
            </div>

            {/* Center Column - Main Timeline */}
            <div className="space-y-4">
              <StoriesBar
                onUserClick={(user) => {
                  setActiveStoryGroup(user);
                  setIsStoryViewerOpen(true);
                }}
              />
            {loading ? (
              <TripSkeletonLoader count={3} variant="list" />
            ) : (
              <div className="space-y-4 sm:space-y-6">
            {filteredTrips.map((trip) => {
            // Use _id (MongoDB) or id (static data) consistently
            const tripId = getTripIdentifier(trip);
            const loveInfo = loveState[tripId] || {
              liked: Boolean(trip.viewerLoved),
              likes: typeof trip.likes === "number" ? trip.likes : 0,
            };
            const isLiked = loveInfo.liked;
            const isSaved = saveState.hasOwnProperty(tripId)
              ? saveState[tripId]
              : Boolean(trip.viewerSaved);
            const likeCount = loveInfo.likes;
            const thumbnails = [
              ...((trip.activities || []).flatMap((a: any) => a.images || [])),
              ...((trip.foodAndRestaurants || []).map((f: any) => f.image)),
            ].filter(Boolean).slice(0, 12);
            const activeSrc = activeImageByTrip[tripId] || trip.image;

            return (
              <Card key={tripId} className="shadow-float">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 p-3 sm:p-4">
                    <Link to={toProfilePath(trip)} className="flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        {trip.authorImage ? (
                          <AvatarImage src={trip.authorImage} alt={trip.author} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-hero text-white font-bold">
                          {trip.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link to={toProfilePath(trip)} className="truncate font-bold hover:underline">
                            {trip.author}
                          </Link>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">• {formatDate(trip.postedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                          <MapPin className="h-4 w-4 text-secondary" />
                          <span className="truncate max-w-[160px] sm:max-w-none">{trip.destination}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        تقييم <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" /> {trip.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Image (double-click to like) */}
                  <div
                    className="relative select-none"
                    onDoubleClick={() => handleDouble(trip)}
                    onClick={() => handleDouble(trip)}
                  >
                    <img src={activeSrc} alt={trip.title} className="w-full aspect-video object-cover" />
                      {showHeartByTrip[tripId] && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Heart className="h-16 w-16 text-red-500 fill-red-500 animate-ping" />
                      </div>
                    )}
                  </div>

                  {/* Thumbnails (activities + food) */}
                  {thumbnails.length > 0 && (
                    <div className="flex gap-2 p-3 sm:p-4 overflow-x-auto snap-x snap-mandatory">
                      {[trip.image, ...thumbnails].slice(0, 12).map((src, idx) => (
                        <button
                          key={idx}
                          className={`relative h-14 w-20 sm:h-16 sm:w-24 flex-shrink-0 overflow-hidden rounded-lg border snap-start ${activeSrc === src ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => setActiveImageByTrip((prev) => ({ ...prev, [tripId]: src }))}
                          aria-label={`عرض الصورة ${idx + 1}`}
                        >
                          <img src={src} alt={`${trip.title}-${idx + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Body */}
                  <div className="px-3 sm:px-4 pb-2 sm:pb-3 space-y-1.5 sm:space-y-2">
                    <Link to={`/trips/${tripId}`} className="block">
                      <h2 className="text-lg sm:text-xl font-bold hover:underline leading-snug">{trip.title}</h2>
                    </Link>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 sm:line-clamp-none">
                      {trip.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 sm:pt-2 flex flex-wrap items-center gap-2 justify-between text-sm">
                    <div className="flex items-center gap-1 sm:gap-3 flex-wrap">
                      <SignedIn>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-full px-2 sm:px-3 ${isLiked ? 'text-primary' : ''}`}
                        onClick={() => handleToggleLove(trip)}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary' : ''}`} />
                        <span className="ml-1 sm:ml-2">{likeCount}</span>
                      </Button>
                      </SignedIn>
                      
                      <SignedOut>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="rounded-full px-2 sm:px-3" onClick={handleUnauthenticatedLike}>
                                <Heart className="h-4 w-4" />
                                <span className="ml-1 sm:ml-2">{likeCount}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>تسجيل الدخول مطلوب</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </SignedOut>
                      
                      <Button variant="ghost" size="sm" className="rounded-full px-2 sm:px-3" onClick={() => setActiveCommentsTripId(tripId)}>
                        <MessageCircle className="h-4 w-4" />
                        <span className="ml-1 sm:ml-2">{(trip.comments || []).length}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full px-2 sm:px-3" onClick={() => navigator.share ? navigator.share({ title: trip.title, text: trip.description, url: window.location.origin + '/trips/' + tripId }) : window.open(window.location.origin + '/trips/' + tripId, '_blank')}>
                        <Share2 className="h-4 w-4" />
                        <span className="ml-1 sm:ml-2">{trip.shares || 0}</span>
                      </Button>
                      
                      {/* View Their Journey Button */}
                      <Link to={toProfilePath(trip)}>
                        <Button variant="ghost" size="sm" className="rounded-full px-2 sm:px-3 text-primary hover:text-primary">
                          <Eye className="h-4 w-4" />
                          <span className="ml-1 sm:ml-2 hidden md:inline">رحلتهم</span>
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <SignedIn>
                      <Button
                        variant={isSaved ? "secondary" : "outline"}
                        size="sm"
                        className="rounded-full px-3"
                        onClick={() => handleToggleSave(trip)}
                      >
                        <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-secondary' : ''}`} />
                        <span className="ml-2 hidden xs:inline">{isSaved ? 'محفوظ' : 'حفظ'}</span>
                      </Button>
                      </SignedIn>
                      
                      <SignedOut>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" className="rounded-full px-3" onClick={handleUnauthenticatedSave}>
                                <Bookmark className="h-4 w-4" />
                                <span className="ml-2 hidden xs:inline">حفظ</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>تسجيل الدخول مطلوب</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </SignedOut>
                      
                      <Link to={`/trips/${tripId}`}>
                        <Button size="sm" className="rounded-full px-3">التفاصيل</Button>
                      </Link>
                    </div>
                  </div>
                  {/* Comments preview */}
                  <div className="px-3 sm:px-4 pb-4">
                    {trip.comments && trip.comments.length > 0 ? (
                      <div className="space-y-3">
                        {trip.comments.slice(0, 2).map((comment: Comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-9 w-9">
                              {comment.authorAvatar ? (
                                <AvatarImage src={comment.authorAvatar} alt={comment.author} />
                              ) : null}
                              <AvatarFallback className="bg-gradient-hero text-white">
                                {comment.author.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 rounded-2xl bg-muted/40 px-3 py-2">
                              <div className="text-sm font-semibold">{comment.author}</div>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                        {trip.comments.length > 2 && (
                          <Button
                            variant="link"
                            className="px-0"
                            onClick={() => setActiveCommentsTripId(tripId)}
                          >
                            عرض جميع التعليقات ({trip.comments.length})
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        لا توجد تعليقات بعد.{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto align-baseline"
                          onClick={() => setActiveCommentsTripId(tripId)}
                        >
                          كن أول من يعلق
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}
          </div>
          {/* End Center Column */}

          {/* Right Sidebar - Hidden on mobile/tablet, visible on xl+ */}
          <div className="hidden xl:block sticky top-24 h-fit">
            <RightSidebar
              followedTravelers={followedTravelers}
              onToggleFollow={handleToggleFollow}
              isLoading={loadingFollowed}
            />
          </div>
        </div>
        </div>
        {/* End Three-column grid */}
      </main>


      {/* Comments Dialog */}
      <Dialog open={!!activeCommentsTripId} onOpenChange={(open) => !open && setActiveCommentsTripId(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>التعليقات</DialogTitle>
            <DialogDescription className="sr-only">
              عرض وإضافة التعليقات الخاصة بالرحلة المحددة
            </DialogDescription>
          </DialogHeader>
          {activeCommentsTrip && activeCommentsTripId ? (
            <TripComments
              tripId={activeCommentsTripId}
              initialComments={activeCommentsTrip.comments || []}
              onCommentAdded={(comment) =>
                updateTripComments(activeCommentsTripId, (comments) => [comment, ...comments])
              }
              onCommentUpdated={(commentId, changes) =>
                updateTripComments(activeCommentsTripId, (comments) =>
                  comments.map((comment) =>
                    comment.id === commentId ? { ...comment, ...changes } : comment
                  )
                )
              }
              onCommentDeleted={(commentId) =>
                updateTripComments(activeCommentsTripId, (comments) =>
                  comments.filter((comment) => comment.id !== commentId)
                )
              }
              tripOwnerId={activeCommentsTrip.ownerId}
            />
          ) : (
            <div className="py-6 text-center text-muted-foreground">جاري التحميل...</div>
          )}
        </DialogContent>
      </Dialog>

      <StoryViewer
        group={activeStoryGroup}
        isOpen={isStoryViewerOpen && !!activeStoryGroup}
        onClose={() => {
          setIsStoryViewerOpen(false);
          setActiveStoryGroup(null);
        }}
      />

      <Footer />
    </div>
  );
};

export default Timeline;
