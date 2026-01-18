import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Compass, Sparkles, Users, Plane, LayoutGrid } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { search, listTrips, getUserById, getUserFollowing, toggleFollowUser } from "@/lib/api";
import UserCard from "@/components/UserCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trip } from "@/lib/trips-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, User as UserIcon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("trips");
  const { isSignedIn, getToken, userId } = useAuth();

  const isSearchMode = query.trim().length > 0;

  // Fetch search results when query exists
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setSearchResults({ trips: [], users: [] });
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const data = await search(query, 50);
        setSearchResults(data);
      } catch (err: any) {
        console.error("Search error:", err);
        setError(err.message || "Failed to search");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  // Fetch suggestions when no query
  useEffect(() => {
    const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          // If 503 (Service Unavailable) or 504 (Gateway Timeout), verify strict retry
          if ((res.status === 503 || res.status === 504) && retries > 0) {
            throw new Error(`Retrying... ${res.status}`);
          }
          return res;
        }
        return res;
      } catch (err) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, retries - 1, delay * 2);
        }
        throw err;
      }
    };

    const fetchSuggestions = async () => {
      // If we are searching, don't fetch suggestions
      if (query.trim()) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const PROD_API = "https://re7lty-graduation-backend.vercel.app";
        
        // 1. Fetch Trips with Retry
        const res = await fetchWithRetry(`${PROD_API}/api/trips`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch trips: ${res.status}`);
        }
        
        const tripsData = await res.json();
        
        // The API returns { items: [...] } for /api/trips endpoint
        const trips = tripsData.items || tripsData.trips || [];
        setSuggestedTrips(trips);
        
        // 2. Extract Owners
        const uniqueOwnerIds = new Set<string>();
        trips.forEach((trip: any) => {
          if (trip.ownerId) uniqueOwnerIds.add(trip.ownerId);
        });
        
        // Take first 12 unique owners
        const ownerIds = Array.from(uniqueOwnerIds).slice(0, 12);

        // 3. Fetch Users (With robust retry)
        // We limit concurrency to 3 parallel requests to avoid hitting rate limits or overwhelming the cold server
        const fetchUserWithRetry = async (id: string) => {
          try {
            const userRes = await fetchWithRetry(`${PROD_API}/api/users/${id}`, 3, 1000);
            if (!userRes.ok) return null;
            return await userRes.json();
          } catch (e) {
            console.error(`Failed to fetch user ${id} after retries`);
            return null;
          }
        };

        const batchSize = 3;
        const users: any[] = [];
        
        for (let i = 0; i < ownerIds.length; i += batchSize) {
          const batch = ownerIds.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch.map(id => fetchUserWithRetry(id)));
          users.push(...batchResults.filter(u => u !== null));
          // Small delay between batches
          if (i + batchSize < ownerIds.length) await new Promise(r => setTimeout(r, 500));
        }
        
        setSuggestedUsers(users);
        
      } catch (err: any) {
        console.error("Error fetching suggestions:", err);
        setError("تعذر تحميل الاقتراحات. يرجى التحقق من الاتصال أو المحاولة مرة أخرى.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
    fetchSuggestions();
  }, [query]);

  // Fetch following list
  useEffect(() => {
    const fetchFollowing = async () => {
        if (!isSignedIn || !userId) return;
        try {
            const token = await getToken();
            const data = await getUserFollowing(userId, token || undefined);
            const ids = new Set<string>();
            if (data?.users) {
                data.users.forEach((u: any) => ids.add(u.userId));
            }
            setFollowingIds(ids);
        } catch (e) {
            console.error("Failed to fetch following list", e);
        }
    };
    fetchFollowing();
  }, [isSignedIn, userId, getToken]);

  const handleUserClick = (clerkId: string) => {
    navigate(`/user/${clerkId}`);
  };

  const handleToggleFollow = (targetId: string, newStatus: boolean) => {
      setFollowingIds(prev => {
          const next = new Set(prev);
          if (newStatus) {
              next.add(targetId);
          } else {
              next.delete(targetId);
          }
          return next;
      });
  };

  const handleTripClick = (tripId: string) => {
    navigate(`/trips/${tripId}`);
  };

  // Determine which data to display
  const displayUsers = isSearchMode ? searchResults.users : suggestedUsers;
  const displayTrips = isSearchMode ? searchResults.trips : suggestedTrips;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8 text-center sm:text-right space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                <Sparkles className="h-6 w-6 text-orange-500" />
                <h1 className="text-3xl font-bold text-gray-900">
                  {isSearchMode ? "نتائج البحث" : "اكتشف العالم"}
                </h1>
              </div>
              <p className="text-gray-600 max-w-md">
                {isSearchMode 
                  ? `نتائج البحث عن "${query}"` 
                  : "استكشف وجهات جديدة وتواصل مع مسافرين ملهمين من جميع أنحاء العالم"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4" />
            <p className="text-gray-500">{isSearchMode ? "جاري البحث..." : "جاري التحميل..."}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <Tabs defaultValue="trips" className="w-full" onValueChange={setActiveTab}>
            <div className="flex items-center justify-center sm:justify-start mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2 h-12 bg-white border border-gray-200 shadow-sm rounded-xl p-1">
                <TabsTrigger 
                  value="trips" 
                  className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm rounded-lg text-base font-medium transition-all"
                >
                  <Plane className="h-4 w-4 ml-2" />
                  الرحلات ({displayTrips.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm rounded-lg text-base font-medium transition-all"
                >
                  <Users className="h-4 w-4 ml-2" />
                  المسافرون ({displayUsers.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* No Results (Search Mode Only) */}
            {isSearchMode && displayUsers.length === 0 && displayTrips.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  لا توجد نتائج
                </h2>
                <p className="text-gray-500">
                  جرب البحث بكلمات مختلفة
                </p>
              </div>
            )}

            {/* Trips Tab */}
            <TabsContent value="trips" className="space-y-8 animate-in fade-in-50 duration-500">
              {displayTrips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayTrips.map((trip) => (
                    <button
                      key={trip._id || trip.id}
                      onClick={() => handleTripClick(String(trip._id || trip.id))}
                      className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 text-right group flex flex-col h-full"
                    >
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {trip.image ? (
                          <img
                            src={trip.image}
                            alt={trip.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-50">
                            <Compass className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-gray-800 shadow-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-orange-500" />
                          <span className="truncate max-w-[120px]">{trip.destination || trip.city}</span>
                        </div>
                      </div>
                      
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {trip.title}
                        </h3>
                        
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                          {trip.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                          {trip.author && (
                             <div className="flex items-center gap-2 text-sm text-gray-600">
                               <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold overflow-hidden ring-1 ring-white">
                                 {(() => {
                                   const authorUser = displayUsers.find(u => u.clerkId === trip.ownerId || u.id === trip.ownerId);
                                   if (authorUser?.imageUrl) {
                                     return <img src={authorUser.imageUrl} alt={trip.author} className="h-full w-full object-cover" />;
                                   }
                                   return trip.author[0];
                                 })()}
                               </div>
                               <span className="truncate max-w-[100px]">{trip.author}</span>
                             </div>
                          )}
                          <div className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-md font-medium">
                            {trip.days?.length || 1} أيام
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                !isLoading && (
                  <div className="text-center py-12">
                    <LayoutGrid className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">لا توجد رحلات متاحة</h3>
                    <p className="text-gray-500">جرب البحث عن وجهة مختلفة أو كن أول من يضيف رحلة!</p>
                  </div>
                )
              )}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-8 animate-in fade-in-50 duration-500">
              {displayUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayUsers.map((user) => (
                    <div 
                      key={user.clerkId} 
                      onClick={() => handleUserClick(user.clerkId)}
                      className="cursor-pointer h-full"
                    >
                      <UserCard 
                        user={{
                          clerkId: user.clerkId || user.id,
                          fullName: user.fullName,
                          username: user.username,
                          imageUrl: user.imageUrl,
                          bio: user.bio,
                          location: user.location,
                          followers: user.followers || 0,
                          tripsCount: user.tripsCount || 0
                        }} 
                        isFollowing={followingIds.has(user.clerkId || user.id)}
                        onFollowToggle={(newStatus) => handleToggleFollow(user.clerkId || user.id, newStatus)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                !isLoading && (
                  <div className="text-center py-12">
                    <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">لا يوجد مسافرين</h3>
                    <p className="text-gray-500">لم يتم العثور على مسافرين يطابقون بحثك.</p>
                  </div>
                )
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DiscoverPage;
