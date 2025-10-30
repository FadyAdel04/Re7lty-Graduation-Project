import { Trophy, TrendingUp, Users, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { egyptTrips } from "@/lib/trips-data";
import { Link } from "react-router-dom";

const Leaderboard = () => {
  // Get top trips by weekly likes
  const topWeeklyTrips = [...egyptTrips]
    .sort((a, b) => b.weeklyLikes - a.weeklyLikes)
    .slice(0, 10);

  // Get top travelers by followers
  const travelersMap = new Map<string, { name: string; followers: number; trips: number }>();
  
  egyptTrips.forEach(trip => {
    if (travelersMap.has(trip.author)) {
      const traveler = travelersMap.get(trip.author)!;
      traveler.trips += 1;
    } else {
      travelersMap.set(trip.author, {
        name: trip.author,
        followers: trip.authorFollowers,
        trips: 1
      });
    }
  });

  const topTravelers = Array.from(travelersMap.values())
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-hero mb-4">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">لوحة المتصدرين</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            اكتشف أفضل الرحلات والمسافرين الأكثر تأثيراً هذا الأسبوع
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="trips" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              أفضل الرحلات
            </TabsTrigger>
            <TabsTrigger value="travelers" className="gap-2">
              <Users className="h-4 w-4" />
              أفضل المسافرين
            </TabsTrigger>
          </TabsList>

          {/* Top Trips Tab */}
          <TabsContent value="trips" className="space-y-4 animate-slide-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  الرحلات الأكثر إعجاباً هذا الأسبوع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topWeeklyTrips.map((trip, index) => (
                  <Link
                    key={trip.id}
                    to={`/trips/${trip.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary-light transition-colors">
                      {/* Rank Badge */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                        'bg-muted text-foreground'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Trip Image */}
                      <img
                        src={trip.image}
                        alt={trip.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />

                      {/* Trip Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1 truncate">{trip.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{trip.author}</p>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="gap-1">
                            <Heart className="h-3 w-3" />
                            {trip.weeklyLikes} هذا الأسبوع
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {trip.likes} إجمالي
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Travelers Tab */}
          <TabsContent value="travelers" className="space-y-4 animate-slide-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-secondary" />
                  المسافرون الأكثر متابعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topTravelers.map((traveler, index) => (
                  <div
                    key={traveler.name}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary-light transition-colors"
                  >
                    {/* Rank Badge */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                      'bg-muted text-foreground'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-16 w-16 border-2 border-secondary">
                      <AvatarFallback className="bg-gradient-hero text-white font-bold text-xl">
                        {traveler.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Traveler Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{traveler.name}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="default" className="gap-1">
                          <Users className="h-3 w-3" />
                          {traveler.followers.toLocaleString('ar-EG')} متابع
                        </Badge>
                        <span className="text-muted-foreground">
                          {traveler.trips} رحلة
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Leaderboard;
