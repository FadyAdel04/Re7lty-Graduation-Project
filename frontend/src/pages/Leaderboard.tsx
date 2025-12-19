import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Heart, Medal, Award, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Fireworks from "@/components/Fireworks";
import { listTrips } from "@/lib/api";
import { Link } from "react-router-dom";

const Leaderboard = () => {
  const [showFireworks, setShowFireworks] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hide fireworks after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFireworks(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch trips from API
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const response = await listTrips({ sort: 'likes', limit: 50 });
        console.log('API Response:', response);
        console.log('Response items:', response?.items);
        
        // Calculate engagement score for each trip
        const tripsArray = Array.isArray(response?.items) ? response.items : [];
        console.log('Trips array length:', tripsArray.length);
        
        // Calculate comprehensive engagement score
        // Loves = 1 point, Comments = 2 points (more engagement), Saves = 1.5 points
        const tripsWithScore = tripsArray.map((trip: any) => {
          // Handle different API response formats for loves/likes
          const lovesCount = trip.lovedBy?.length || trip.loves || trip.likes || 0;
          const savesCount = trip.savedBy?.length || trip.saves || 0;
          
          return {
            ...trip,
            // Normalize the field names
            loves: lovesCount,
            saves: savesCount,
            engagementScore: 
              lovesCount * 1 + 
              (trip.comments?.length || 0) * 2 + 
              savesCount * 1.5
          };
        });
        
        // Sort by engagement score (highest first)
        const sortedTrips = tripsWithScore.sort((a: any, b: any) => b.engagementScore - a.engagementScore);
        console.log('Top 3 trips with scores:', sortedTrips.slice(0, 3).map((t: any) => ({
          title: t.title,
          loves: t.loves,
          lovedBy: t.lovedBy?.length,
          comments: t.comments?.length || 0,
          saves: t.saves,
          savedBy: t.savedBy?.length,
          score: t.engagementScore
        })));
        
        setTrips(sortedTrips.slice(0, 10));
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch trips:', err);
        setError(err.message || 'Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Podium component for top 3
  const PodiumItem = ({ 
    rank, 
    trip
  }: { 
    rank: number; 
    trip: any;
  }) => {
    const heights = {
      1: 'h-48 sm:h-56 md:h-64',
      2: 'h-40 sm:h-48 md:h-52',
      3: 'h-32 sm:h-40 md:h-44'
    };

    const gradients = {
      1: 'from-yellow-400 via-yellow-500 to-yellow-600',
      2: 'from-gray-300 via-gray-400 to-gray-500',
      3: 'from-amber-600 via-amber-700 to-amber-800'
    };

    const icons = {
      1: <Crown className="h-8 w-8 text-white" />,
      2: <Medal className="h-7 w-7 text-white" />,
      3: <Award className="h-6 w-6 text-white" />
    };

    const order = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';
    const animationDelay = rank === 1 ? 'delay-0' : rank === 2 ? 'delay-100' : 'delay-200';

    return (
      <div className={`flex-1 flex flex-col items-center ${order} animate-slide-up ${animationDelay} min-w-0`}>
        {/* Content above podium */}
        <div className="mb-2 sm:mb-4 text-center px-1">
          <Link to={`/trips/${trip._id}`} className="block group">
            <div className="relative mb-2 sm:mb-3">
              <img 
                src={trip.image || '/placeholder-trip.jpg'} 
                alt={trip.title} 
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-38 md:h-38 lg:w-44 lg:h-44 xl:w-48 xl:h-48 rounded-full object-cover border-2 sm:border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-300"
              />
              <div className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${gradients[rank as keyof typeof gradients]} flex items-center justify-center shadow-lg`}>
                <div className="scale-75 sm:scale-100">{icons[rank as keyof typeof icons]}</div>
              </div>
            </div>
            <h3 className="font-bold text-xs sm:text-sm md:text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors px-1">{trip.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{trip.author || 'مسافر'}</p>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
              <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
                <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {trip.loves || 0}
              </Badge>
              {(trip.comments?.length || 0) > 0 && (
                <Badge variant="outline" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
                  💬 {trip.comments?.length || 0}
                </Badge>
              )}
              {(trip.saves || 0) > 0 && (
                <Badge variant="outline" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
                  🔖 {trip.saves || 0}
                </Badge>
              )}
            </div>
          </Link>
        </div>

        {/* Podium base */}
        <div className={`w-full ${heights[rank as keyof typeof heights]} bg-gradient-to-br ${gradients[rank as keyof typeof gradients]} rounded-t-xl sm:rounded-t-2xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-3xl transition-shadow duration-300`}>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div className="text-3xl sm:text-5xl md:text-6xl font-bold text-white opacity-20 mb-1 sm:mb-2">{rank}</div>
          <div className="text-white font-bold text-sm sm:text-base md:text-lg px-2 text-center">المركز {rank === 1 ? 'الأول' : rank === 2 ? 'الثاني' : 'الثالث'}</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-hero mb-4">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">لوحة المتصدرين</span>
            </h1>
            <div className="mt-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">جاري تحميل البيانات...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-hero mb-4">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">لوحة المتصدرين</span>
            </h1>
            <div className="mt-8 p-6 bg-destructive/10 rounded-lg max-w-md mx-auto">
              <p className="text-destructive">{error}</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const topTrips = trips.slice(0, 3);
  const remainingTrips = trips.slice(3, 10);

  return (
    <div className="min-h-screen bg-background">
      {showFireworks && <Fireworks />}
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12 animate-slide-up px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-hero mb-3 sm:mb-4">
            <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            <span className="text-gradient">لوحة المتصدرين</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            اكتشف أفضل الرحلات الأكثر إعجاباً هذا الأسبوع
          </p>
        </div>

        {/* Top 3 Trips Podium */}
        {topTrips.length >= 3 && (
          <div className="mb-12 sm:mb-16 px-2 sm:px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 flex items-center justify-center gap-2 sm:gap-3">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-gradient">أفضل الرحلات</span>
            </h2>
            <div className="flex items-end justify-center gap-2 sm:gap-3 md:gap-4 max-w-5xl mx-auto mb-6 sm:mb-8">
              {topTrips.map((trip, index) => (
                <PodiumItem key={trip._id} rank={index + 1} trip={trip} />
              ))}
            </div>
          </div>
        )}

        {/* Remaining Rankings (4-10) */}
        {remainingTrips.length > 0 && (
          <div className="max-w-3xl mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  باقي الرحلات المتصدرة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {remainingTrips.map((trip, index) => (
                  <Link key={trip._id} to={`/trips/${trip._id}`} className="block">
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl hover:bg-secondary-light transition-all duration-300 hover:scale-[1.02]">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base bg-muted text-foreground">
                        {index + 4}
                      </div>

                      {/* Trip Image */}
                      <img src={trip.image || '/placeholder-trip.jpg'} alt={trip.title} className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-lg object-cover flex-shrink-0" />

                      {/* Trip Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-base mb-0.5 sm:mb-1 truncate">{trip.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 truncate">{trip.author?.fullName || 'مسافر'}</p>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
                            <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {trip.loves || 0}
                          </Badge>
                          {(trip.comments?.length || 0) > 0 && (
                            <Badge variant="outline" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
                              💬 {trip.comments?.length || 0}
                            </Badge>
                          )}
                          {(trip.saves || 0) > 0 && (
                            <Badge variant="outline" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
                              🔖 {trip.saves || 0}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {trips.length === 0 && !loading && (
          <div className="text-center py-8 sm:py-12 px-4">
            <p className="text-sm sm:text-base text-muted-foreground">لا توجد رحلات متاحة حالياً</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
