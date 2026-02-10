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

  // --- Fetch Logic (Same as before) ---
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
        // Use listTrips from api.ts which handles relative URLs/Vite proxy
        const { listTrips } = await import('@/lib/api');
        const data = await listTrips({ sort, limit: 20 });
        const trips = data.items || [];
        setSuggestedTrips(trips);

        // Extract Owners for Suggestions
        const uniqueOwnerIds = Array.from(new Set(trips.map((t: any) => t.ownerId))).slice(0, 5);
        
        // Fetch Users (limited batch)
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

  // --- Handlers ---
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
    <div className="min-h-screen bg-[#F8FAFC] font-cairo">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20">
        
        {/* 1. Hero Section */}
        {!isSearchMode && (
          <div className="space-y-12 mb-16">
            <DiscoverHero />
            <LivePulseMap height="450px" />
          </div>
        )}

        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Trip Feed (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
             
             {/* Feed Header & Filters */}
             <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-20 z-30">
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
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                        activeFilter === filter.id 
                          ? "bg-orange-50 text-orange-600 border border-orange-100 shadow-sm" 
                          : "text-gray-500 hover:bg-gray-50 border border-transparent"
                      )}
                    >
                      <filter.icon className="w-4 h-4" />
                      {filter.label}
                    </button>
                  ))}
                </div>
                
                {/* Search Bar Inline */}
                <div className="relative w-full sm:w-64">
                   <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                   <Input 
                     className="pr-10 h-10 bg-gray-50 border-transparent focus:bg-white transition-all rounded-xl"
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="h-80 bg-gray-200 rounded-3xl animate-pulse" />
                 ))}
               </div>
             ) : displayTrips.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {displayTrips.map((trip) => {
                   const author = displayUsers.find(u => u.clerkId === trip.ownerId || u.id === trip.ownerId);
                   
                   return (
                     <div 
                       key={trip._id || trip.id}
                       className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer"
                       onClick={() => navigate(`/trips/${trip._id || trip.id}`)}
                     >
                        {/* Image Area */}
                        <div className="relative h-60 overflow-hidden">
                           <img 
                             src={trip.image || "/placeholder.svg"} 
                             alt={trip.title}
                             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                           
                           <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-gray-800 flex items-center gap-1.5 shadow-sm">
                              <MapPin className="w-3.5 h-3.5 text-orange-500" />
                              {trip.destination || trip.city}
                           </div>

                             {/* Days Badge */}
                           <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white border border-white/20">
                             {trip.days?.length || 1} أيام
                           </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-5 flex flex-col flex-1">
                           <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                             {trip.title}
                           </h3>
                           <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">
                             {trip.description}
                           </p>

                           {/* Footer: Author & Action */}
                           <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden ring-2 ring-white shadow-sm">
                                   <img 
                                     src={author?.imageUrl || `https://ui-avatars.com/api/?name=${trip.author}&background=random`} 
                                     alt="Author" 
                                     className="w-full h-full object-cover"
                                   />
                                </div>
                                <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
                                  {trip.author}
                                </span>
                              </div>
                              
                              <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-full px-4">
                                التفاصيل
                                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                              </Button>
                           </div>
                        </div>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">لا توجد نتائج</h3>
                  <p className="text-gray-500">لم نجد ما تبحث عنه، حاول بكلمات أخرى.</p>
               </div>
             )}
          </div>

          {/* RIGHT COLUMN: Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24 h-fit">
             
             {/* 1. Recommended Travelers Widget */}
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                     مسافرون مقترحون
                   </h3>
                   <Button variant="link" className="text-orange-600 px-0 h-auto">عرض الكل</Button>
                </div>

                <div className="space-y-4">
                   {isLoading ? (
                     [1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)
                   ) : displayUsers.length > 0 ? (
                     displayUsers.slice(0, 5).map(user => {
                       const userId = user.clerkId || user.id;
                       const isFollowing = followingIds.has(userId);

                       // Handle follow toggle with API call
                       const onFollowClick = async () => {
                          if (!isSignedIn) {
                            // You might want to show a toast here
                            return;
                          }
                          try {
                             // Optimistic update
                             handleToggleFollow(userId, !isFollowing);
                             
                             const token = await getToken();
                             if (token) {
                               await toggleFollowUser(userId, token);
                             }
                          } catch (e) {
                             console.error("Failed to follow user", e);
                             // Rollback on error
                             handleToggleFollow(userId, isFollowing);
                          }
                       };

                       return (
                       <div key={userId} className="flex items-center justify-between group">
                          <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => navigate(`/user/${userId}`)}
                          >
                             <div className="relative">
                               <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden ring-2 ring-transparent group-hover:ring-orange-200 transition-all">
                                 <img src={user.imageUrl} alt={user.fullName} className="w-full h-full object-cover" />
                               </div>
                               {/* Online indicator mock */}
                               <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                             </div>
                             <div>
                               <h4 className="font-bold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">
                                 {user.fullName || user.username}
                               </h4>
                               <p className="text-xs text-gray-500 line-clamp-1">
                                 {user.bio || "مسافر شغوف 🌍"}
                               </p>
                             </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant={isFollowing ? "outline" : "default"}
                            className={cn(
                              "rounded-full px-4 h-8 text-xs font-bold transition-all",
                              isFollowing 
                                ? "border-indigo-100 text-indigo-600 bg-indigo-50 hover:bg-indigo-100" 
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
                            )}
                            onClick={onFollowClick}
                          >
                             {isFollowing ? 'متابع' : 'متابعة'}
                          </Button>
                       </div>
                       );
                     })
                   ) : (
                     <p className="text-gray-500 text-sm p-4 text-center">لا يوجد اقتراحات حالياً</p>
                   )}
                </div>
             </div>

             {/* 2. Popular Destinations Widget (Static for now) */}
             <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                
                <h3 className="font-bold text-lg mb-4 relative z-10">وجهات رائجة 🔥</h3>
                <div className="flex flex-wrap gap-2 relative z-10">
                   {['دهب', 'سيوة', 'أسوان', 'سانت كاترين', 'الفيوم'].map(tag => (
                     <Badge 
                       key={tag} 
                       variant="secondary" 
                       className="bg-white/10 hover:bg-white/20 text-white border-0 cursor-pointer backdrop-blur-md"
                       onClick={() => setSearchParams({ q: tag })}
                     >
                       #{tag}
                     </Badge>
                   ))}
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
