import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { listTrips } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Star } from "lucide-react";
import TripComments from "@/components/TripComments";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function timeAgo(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diff = Math.max(0, now.getTime() - then.getTime());
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} يوم${d === 1 ? '' : ''} مضت`;
  if (h > 0) return `${h} ساعة مضت`;
  if (m > 0) return `${m} دقيقة مضت`;
  return `الآن`;
}

const Timeline = () => {
  const { toast } = useToast();
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [showHeartByTrip, setShowHeartByTrip] = useState<Record<string, boolean>>({});
  const [activeImageByTrip, setActiveImageByTrip] = useState<Record<string, string>>({});
  const [openCommentsForTrip, setOpenCommentsForTrip] = useState<string | null>(null);
  const lastTapRef = useRef<Record<string, number>>({});

  const handleLike = (id: string) => {
    setLikedIds((prev) => ({ ...prev, [id]: !prev[id] }));
    setShowHeartByTrip((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setShowHeartByTrip((prev) => ({ ...prev, [id]: false })), 700);
  };

  const handleSave = (id: string) => {
    setSavedIds((prev) => ({ ...prev, [id]: !prev[id] }));
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

  const handleDouble = (id: string) => {
    const now = Date.now();
    const last = lastTapRef.current[id] || 0;
    if (now - last < 350) {
      if (!likedIds[id]) {
        setLikedIds((prev) => ({ ...prev, [id]: true }));
      }
      setShowHeartByTrip((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setShowHeartByTrip((prev) => ({ ...prev, [id]: false })), 700);
    }
    lastTapRef.current[id] = now;
  };

  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await listTrips({ sort: 'recent', limit: 20, page: 1 });
        if (isMounted) setTrips(data.items || []);
      } catch (e) {
        // ignore
      }
    };
    load();
    const id = setInterval(load, 10000);
    return () => { isMounted = false; clearInterval(id); };
  }, []);

  const toProfilePath = (author: string) => `/profile/${author.replace(/\s+/g, '-')}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">الرحلات التى تمت مشاركتها مؤخرا</h1>
        <div className="space-y-4 sm:space-y-6">
          {trips.map((trip) => {
            const isLiked = !!likedIds[trip.id];
            const isSaved = !!savedIds[trip.id];
            const likeCount = trip.likes + (isLiked ? 1 : 0);
            const thumbnails = [
              ...((trip.activities || []).flatMap((a: any) => a.images || [])),
              ...((trip.foodAndRestaurants || []).map((f: any) => f.image)),
            ].filter(Boolean).slice(0, 12);
            const activeSrc = activeImageByTrip[trip._id || trip.id] || trip.image;

            return (
              <Card key={trip._id || trip.id} className="shadow-float">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 p-3 sm:p-4">
                    <Link to={toProfilePath(trip.author)} className="h-10 w-10 rounded-full bg-gradient-hero text-white font-bold flex items-center justify-center hover:opacity-90 flex-shrink-0">
                      {trip.author.charAt(0)}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link to={toProfilePath(trip.author)} className="truncate font-bold hover:underline">
                            {trip.author}
                          </Link>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">• {timeAgo(trip.postedAt)}</span>
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
                  <div className="relative select-none" onDoubleClick={() => handleDouble(trip._id || trip.id)} onClick={() => handleDouble(trip._id || trip.id)}>
                    <img src={activeSrc} alt={trip.title} className="w-full aspect-video object-cover" />
                      {showHeartByTrip[trip._id || trip.id] && (
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
                          onClick={() => setActiveImageByTrip((prev) => ({ ...prev, [trip._id || trip.id]: src }))}
                          aria-label={`عرض الصورة ${idx + 1}`}
                        >
                          <img src={src} alt={`${trip.title}-${idx + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Body */}
                  <div className="px-3 sm:px-4 pb-2 sm:pb-3 space-y-1.5 sm:space-y-2">
                    <Link to={`/trips/${trip._id || trip.id}`} className="block">
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
                      <Button variant="ghost" size="sm" className={`rounded-full px-2 sm:px-3 ${isLiked ? 'text-primary' : ''}`} onClick={() => handleLike(trip._id || trip.id)}>
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
                      
                      <Button variant="ghost" size="sm" className="rounded-full px-2 sm:px-3" onClick={() => setOpenCommentsForTrip(trip._id || trip.id)}>
                        <MessageCircle className="h-4 w-4" />
                        <span className="ml-1 sm:ml-2">{trip.comments.length}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full px-2 sm:px-3" onClick={() => navigator.share ? navigator.share({ title: trip.title, text: trip.description, url: window.location.origin + '/trips/' + trip.id }) : window.open(window.location.origin + '/trips/' + trip.id, '_blank')}>
                        <Share2 className="h-4 w-4" />
                        <span className="ml-1 sm:ml-2">{trip.shares}</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <SignedIn>
                      <Button variant={isSaved ? "secondary" : "outline"} size="sm" className="rounded-full px-3" onClick={() => handleSave(trip.id)}>
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
                      
                      <Link to={`/trips/${trip._id || trip.id}`}>
                        <Button size="sm" className="rounded-full px-3">التفاصيل</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Comments Dialog */}
      <Dialog open={!!openCommentsForTrip} onOpenChange={(o) => !o && setOpenCommentsForTrip(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>التعليقات</DialogTitle>
          </DialogHeader>
          {/* In dynamic mode, comments are not yet fetched; show empty for now */}
          <TripComments comments={[]} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Timeline;
