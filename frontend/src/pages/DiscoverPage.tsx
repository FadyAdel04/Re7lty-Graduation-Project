import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Compass, Sparkles, MapPin, ExternalLink, TrendingUp, Filter } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { search, getUserFollowing, toggleFollowUser } from "@/lib/api";
import UserCard from "@/components/UserCard";
import DiscoverHero from "@/components/DiscoverHero";
import LivePulseMap from "@/components/LivePulseMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import UserBadge from "@/components/UserBadge";

interface SearchResult {
  trips: any[];
  users: any[];
}

const DiscoverPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  
  const [searchResults, setSearchResults] = useState<SearchResult>({ trips: [], users: [] });
  const [suggestedTrips, setSuggestedTrips] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const { isSignedIn, getToken, userId } = useAuth();

  const isSearchMode = query.trim().length > 0;

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setSearchResults({ trips: [], users: [] });
        return;
      }
      setIsLoading(true);
      try {
        const sort = activeFilter === 'trending' ? 'likes' : 'recent';
        const data = await search(query, 50, sort);
        setSearchResults(data);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSearchResults();
  }, [query, activeFilter]);

  useEffect(() => {
    if (isSearchMode) return;

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const sort = activeFilter === 'trending' ? 'likes' : 'recent';
        const { listTrips } = await import('@/lib/api');
        const data = await listTrips({ sort, limit: 20 });
        const trips = data.items || [];
        setSuggestedTrips(trips);

        const uniqueOwnerIds = Array.from(new Set(trips.map((t: any) => t.ownerId))).slice(0, 5);
        const { getUserById } = await import('@/lib/api');
        const users = await Promise.all(
          uniqueOwnerIds.map(async (id) => {
            try {
              return await getUserById(String(id));
            } catch { return null; }
          })
        );
        setSuggestedUsers(users.filter(u => u !== null));
        
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggestions();
  }, [isSearchMode, activeFilter]);

  useEffect(() => {
    const fetchFollowing = async () => {
        if (!isSignedIn || !userId) return;
        try {
            const token = await getToken();
            const data = await getUserFollowing(userId);
            const ids = new Set<string>();
            if (data?.users) data.users.forEach((u: any) => ids.add(u.userId));
            setFollowingIds(ids);
        } catch (e) { console.error(e); }
    };
    fetchFollowing();
  }, [isSignedIn, userId, getToken]);

  const handleToggleFollow = (targetId: string, newStatus: boolean) => {
      setFollowingIds(prev => {
          const next = new Set(prev);
          newStatus ? next.add(targetId) : next.delete(targetId);
          return next;
      });
  };

  const displayTrips = isSearchMode ? searchResults.trips : suggestedTrips;
  const displayUsers = isSearchMode ? searchResults.users : suggestedUsers;

  return (
    <div className="min-h-screen bg-background font-cairo transition-colors duration-500">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20">
        
        {/* 1. Hero Section */}
        {!isSearchMode && (
          <div className="space-y-12 mb-16">
            <DiscoverHero />
            <div id="live-pulse-map" className="rounded-[3rem] overflow-hidden border border-border shadow-2xl bg-card">
              <LivePulseMap height="450px" />
            </div>
          </div>
        )}

        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Trip Feed (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
             
             {/* Feed Header & Filters */}
             <div className="bg-card/50 backdrop-blur-xl rounded-3xl p-4 shadow-xl border border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-24 z-30 transition-all duration-300">
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
                  {[
                    { id: 'all', label: 'الكل', icon: Compass },
                    { id: 'trending', label: 'الأكثر رواجاً', icon: TrendingUp },
                    { id: 'new', label: 'الأحدث', icon: Sparkles },
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all whitespace-nowrap",
                        activeFilter === filter.id 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                          : "text-muted-foreground hover:bg-muted border border-transparent"
                      )}
                    >
                      <filter.icon className="w-4 h-4" />
                      {filter.label}
                    </button>
                  ))}
                </div>
                
                {/* Search Bar Inline */}
                <div className="relative w-full sm:w-72">
                   <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                   <Input 
                     className="pr-12 h-12 bg-muted/50 border-border focus:bg-background transition-all rounded-2xl font-black text-foreground shadow-inner"
                     placeholder="ابحث عن رحلة أو شخص..."
                     defaultValue={query}
                     onChange={(e) => {
                       if (e.target.value === "") {
                         setSearchParams({});
                       }
                     }}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         setSearchParams({ q: e.currentTarget.value });
                       }
                     }}
                   />
                </div>
             </div>

             {/* Trips Grid */}
             {isLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="h-96 bg-muted/50 rounded-[2.5rem] animate-pulse border border-border" />
                 ))}
               </div>
             ) : displayTrips.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {displayTrips.map((trip) => {
                    const isAsk = trip.postType === 'ask';
                    const hasImage = trip.image && trip.image !== "";

                   const author = displayUsers.find(u => u.clerkId === trip.ownerId || u.id === trip.ownerId);
                   
                   return (
                      <div 
                        key={trip._id || trip.id}
                        className={cn(
                          "group bg-card rounded-[2.5rem] overflow-hidden border border-border shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 transition-all duration-500 flex flex-col relative",
                          isAsk ? "h-fit self-start" : "h-full cursor-pointer"
                        )}
                        onClick={() => !isAsk && navigate(`/trips/${trip._id || trip.id}`)}
                      >
                         {/* Image Area - Hide for Ask posts without image */}
                         {(!isAsk || (isAsk && hasImage)) ? (
                           <div className="relative h-64 overflow-hidden">
                              <img 
                                src={trip.image || "/placeholder.svg"} 
                                alt={trip.title}
                                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                              
                              {!isAsk ? (
                                <>
                                  <div className="absolute top-5 right-5 bg-background/90 backdrop-blur-xl px-4 py-2 rounded-2xl text-[10px] font-black text-foreground flex items-center gap-2 shadow-xl border border-border/50">
                                     <MapPin className="w-3.5 h-3.5 text-primary" />
                                     {trip.destination || trip.city}
                                  </div>

                                  <div className="absolute top-5 left-5 bg-primary text-primary-foreground px-4 py-2 rounded-2xl text-[10px] font-black shadow-xl shadow-primary/20">
                                    {trip.days?.length || 1} أيام
                                  </div>
                                </>
                              ) : (
                                <div className="absolute top-5 right-5 bg-emerald-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black shadow-xl shadow-emerald-500/20">
                                  سؤال واستفسار ❓
                                </div>
                              )}
                           </div>
                         ) : (
                           <div className="pt-8 px-6">
                              <div className="inline-flex bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black border border-emerald-500/20">
                                سؤال واستفسار ❓
                              </div>
                           </div>
                         )}

                         {/* Content Area */}
                         <div className="p-8 flex flex-col flex-1 relative">
                            <h3 className={cn(
                              "text-2xl font-black text-foreground mb-3 line-clamp-1 transition-colors tracking-tight",
                              !isAsk && "group-hover:text-primary"
                            )}>
                              {trip.title}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-8 flex-1 leading-relaxed font-bold">
                              {trip.description}
                            </p>

                            {/* Footer: Author & Action */}
                            <div className="flex items-center justify-between pt-6 border-t border-border/50">
                               <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-2xl bg-muted overflow-hidden ring-2 ring-background shadow-lg border border-border group-hover:scale-110 transition-transform">
                                    <img 
                                      src={author?.imageUrl || `https://ui-avatars.com/api/?name=${trip.author}&background=random`} 
                                      alt="Author" 
                                      className="w-full h-full object-cover"
                                    />
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="text-sm font-black text-foreground truncate max-w-[120px]">
                                     {trip.author}
                                   </span>
                                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">مستكشف</span>
                                 </div>
                               </div>
                               
                               {!isAsk && (
                                 <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 rounded-2xl px-5 h-10 font-black text-xs">
                                   التفاصيل
                                   <ExternalLink className="w-4 h-4 mr-2" />
                                 </Button>
                               )}
                            </div>
                         </div>
                      </div>
                    );
                 })}
               </div>
             ) : (
               <div className="text-center py-32 bg-card rounded-[3rem] border-2 border-dashed border-border shadow-inner">
                  <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <Search className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-2">لم نجد أي نتائج</h3>
                  <p className="text-muted-foreground font-bold max-w-xs mx-auto">جرب البحث بكلمات أخرى أو تغيير الفلاتر المحددة.</p>
               </div>
             )}
          </div>

          {/* RIGHT COLUMN: Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24 h-fit">
             
             {/* 1. Recommended Travelers Widget */}
             <div className="bg-card rounded-[2.5rem] p-8 shadow-xl border border-border overflow-hidden relative">
                {/* Decorative Background Orb */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <h3 className="font-black text-xl flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Sparkles className="w-6 h-6" />
                     </div>
                     مسافرون مميزون
                   </h3>
                </div>

                <div className="space-y-6 relative z-10">
                   {isLoading ? (
                     [1,2,3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-2xl animate-pulse" />)
                   ) : displayUsers.length > 0 ? (
                     displayUsers.slice(0, 5).map(user => {
                       const userId = user.clerkId || user.id;
                       const isFollowing = followingIds.has(userId);

                       const onFollowClick = async () => {
                          if (!isSignedIn) return;
                          try {
                              handleToggleFollow(userId, !isFollowing);
                              const token = await getToken();
                              if (token) await toggleFollowUser(userId, token);
                          } catch (e) {
                              console.error("Failed to follow user", e);
                              handleToggleFollow(userId, isFollowing);
                          }
                       };

                       return (
                       <div key={userId} className="flex items-center justify-between group">
                          <div 
                            className="flex items-center gap-4 cursor-pointer"
                            onClick={() => navigate(`/user/${userId}`)}
                          >
                             <div className="relative">
                               <div className="w-14 h-14 rounded-2xl bg-muted overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 group-hover:scale-105 transition-all duration-300 shadow-md border border-border">
                                 <img src={user.imageUrl} alt={user.fullName} className="w-full h-full object-cover" />
                               </div>
                               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-card rounded-full shadow-lg"></div>
                             </div>
                             <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-sm text-foreground group-hover:text-primary transition-colors">
                                    {user.fullName || user.username}
                                  </h4>
                                  <UserBadge tier={user.badgeTier || 'none'} size="sm" />
                                </div>
                               <p className="text-[11px] text-muted-foreground font-bold line-clamp-1 mt-0.5">
                                 {user.bio || "مسافر شغوف 🌍"}
                               </p>
                             </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant={isFollowing ? "outline" : "default"}
                            className={cn(
                              "rounded-xl px-4 h-9 text-[10px] font-black transition-all duration-300",
                              isFollowing 
                                ? "border-primary/20 text-primary bg-primary/5 hover:bg-primary/10" 
                                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                            )}
                            onClick={onFollowClick}
                          >
                             {isFollowing ? 'تمت المتابعة' : 'متابعة'}
                          </Button>
                       </div>
                       );
                     })
                   ) : (
                     <p className="text-muted-foreground text-sm p-4 text-center font-bold">لا يوجد اقتراحات حالياً</p>
                   )}
                </div>
             </div>

             {/* 2. Popular Destinations Widget */}
             <div className="bg-gradient-to-br from-primary to-primary/80 rounded-[2.5rem] p-8 text-primary-foreground overflow-hidden relative shadow-2xl shadow-primary/20 group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                
                <h3 className="font-black text-2xl mb-6 relative z-10 tracking-tight">وجهات رائجة 🔥</h3>
                <div className="flex flex-wrap gap-2.5 relative z-10">
                   {['دهب', 'سيوة', 'أسوان', 'سانت كاترين', 'الفيوم'].map(tag => (
                     <Badge 
                       key={tag} 
                       variant="secondary" 
                       className="bg-white/10 hover:bg-white/20 text-white border-0 cursor-pointer backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95"
                       onClick={() => setSearchParams({ q: tag })}
                     >
                       #{tag}
                     </Badge>
                   ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">اكتشف أكثر من 1000 وجهة</p>
                </div>
             </div>

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DiscoverPage;
