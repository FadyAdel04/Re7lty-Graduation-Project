import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Users, Heart, Settings } from "lucide-react";
import { egyptTrips } from "@/lib/trips-data";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const { username } = useParams();
  const { user: clerkUser } = useUser();
  const { isSignedIn } = useAuth();
  
  // Mock user data
  const displayName = username || "محمد أحمد";
  const isCurrentUser = clerkUser?.username === username || clerkUser?.primaryEmailAddress?.emailAddress?.includes(username || "");
  
  const user = {
    username: displayName,
    bio: "مسافر شغوف باكتشاف جمال مصر 🇪🇬 | مصور هاوي | محب للمغامرات",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    coverImage: "https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1200&h=400&fit=crop",
    stats: {
      trips: 12,
      followers: 342,
      following: 128,
      likes: 1580
    },
    location: "القاهرة، مصر",
    joinDate: "يناير 2023",
    verified: true
  };

  // Filter user's trips:
  // If trips have .author "محمد أحمد", show them in his profile, and so on.
  // Assume username param is the display name (spaces, unicode) as in trip.author
  const authorToMatch = decodeURIComponent(displayName);
  const userTrips = egyptTrips.filter(
    (trip) => trip.author.trim() === authorToMatch.trim()
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Cover Image */}
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          <img
            src={user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="container mx-auto px-4 -mt-20 sm:-mt-24 relative z-10 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
            <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-4xl">{user.username[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-bold">{user.username}</h1>
                      {user.verified && (
                        <Badge className="bg-secondary text-secondary-foreground">
                          موثق ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{user.bio}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {isCurrentUser ? (
                      <>
                        <Link to="/user">
                          <Button variant="default" className="rounded-full">
                            <Settings className="h-4 w-4 ml-2" />
                            إعدادات
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                    <Button variant="default" className="rounded-full">
                      <Users className="h-4 w-4 ml-2" />
                      متابعة
                    </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{user.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-secondary" />
                    <span>انضم {user.joinDate}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-background rounded-2xl p-4 border border-border/50 text-center">
                  <div className="text-2xl font-bold text-primary">{user.stats.trips}</div>
                  <div className="text-xs text-muted-foreground">رحلة</div>
                </div>
                <div className="bg-background rounded-2xl p-4 border border-border/50 text-center">
                  <div className="text-2xl font-bold text-secondary">{user.stats.followers}</div>
                  <div className="text-xs text-muted-foreground">متابع</div>
                </div>
                <div className="bg-background rounded-2xl p-4 border border-border/50 text-center">
                  <div className="text-2xl font-bold text-primary">{user.stats.following}</div>
                  <div className="text-xs text-muted-foreground">يتابع</div>
                </div>
                <div className="bg-background rounded-2xl p-4 border border-border/50 text-center">
                  <div className="text-2xl font-bold text-secondary">{user.stats.likes}</div>
                  <div className="text-xs text-muted-foreground">إعجاب</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="trips" className="w-full">
            <TabsList className="w-full sm:w-auto rounded-full bg-muted/50">
              <TabsTrigger value="trips" className="rounded-full">رحلاتي</TabsTrigger>
              <TabsTrigger value="saved" className="rounded-full">المحفوظات</TabsTrigger>
              <TabsTrigger value="liked" className="rounded-full">الإعجابات</TabsTrigger>
            </TabsList>

            <TabsContent value="trips" className="mt-8">
              {userTrips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userTrips.map((trip) => (
                    <TripCard key={trip.id} {...trip} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">لا توجد رحلات لهذا المستخدم</h3>
                  <p className="text-muted-foreground">لم يقم هذا العضو بمشاركة أي رحلات حتى الآن.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-8">
              <div className="text-center py-16">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد رحلات محفوظة</h3>
                <p className="text-muted-foreground">ابدأ بحفظ رحلاتك المفضلة</p>
              </div>
            </TabsContent>

            <TabsContent value="liked" className="mt-8">
              <div className="text-center py-16">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد رحلات مُعجب بها</h3>
                <p className="text-muted-foreground">اكتشف رحلات جديدة وابدأ بالإعجاب بها</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
