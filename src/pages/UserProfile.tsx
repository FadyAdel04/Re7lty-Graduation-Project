import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Users, Heart, Settings, Camera, Edit2, Save, X, Image as ImageIcon, LogOut } from "lucide-react";
import { egyptTrips } from "@/lib/trips-data";
import { useUser, useAuth, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const UserProfile = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Local state for editable profile data
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Stats (in real app, these would come from backend)
  const [stats] = useState({
    trips: 12,
    followers: 342,
    following: 128,
    likes: 1580
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast({
        title: "غير مصرح",
        description: "يجب تسجيل الدخول لعرض ملفك الشخصي",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [isSignedIn, isLoaded, navigate, toast]);

  useEffect(() => {
    if (clerkUser) {
      setFullName(clerkUser.fullName || clerkUser.firstName || clerkUser.username || "");
      setBio(clerkUser.publicMetadata?.bio as string || "");
      setLocation(clerkUser.publicMetadata?.location as string || "");
      setProfileImage(clerkUser.imageUrl || null);
      setCoverImage(clerkUser.publicMetadata?.coverImage as string || "https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1200&h=400&fit=crop");
    }
  }, [clerkUser]);

  const handleSaveProfile = async () => {
    if (!clerkUser) return;

    try {
      // Update metadata in Clerk
      await clerkUser.update({
        unsafeMetadata: {
          bio,
          location,
          coverImage,
        },
      });

      // Update image if changed
      if (profileImage && profileImage !== clerkUser.imageUrl) {
        // In a real app, you'd upload the image to your backend
        // For now, we'll just update the display
        toast({
          title: "نجح التحديث",
          description: "تم تحديث الملف الشخصي بنجاح",
        });
      } else {
        toast({
          title: "نجح التحديث",
          description: "تم تحديث الملف الشخصي بنجاح",
        });
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الملف الشخصي",
        variant: "destructive",
      });
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
        setIsEditingCover(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelEdit = () => {
    if (clerkUser) {
      setBio(clerkUser.publicMetadata?.bio as string || "");
      setLocation(clerkUser.publicMetadata?.location as string || "");
      setFullName(clerkUser.fullName || clerkUser.firstName || clerkUser.username || "");
      setProfileImage(clerkUser.imageUrl || null);
    }
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح",
      });
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  // Filter user's trips based on their name
  const userTrips = egyptTrips.filter((trip) => 
    clerkUser && (trip.author === clerkUser.fullName || trip.author === clerkUser.firstName || trip.author === clerkUser.username)
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!clerkUser) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Cover Image */}
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden group">
          <img
            src={coverImage || "https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1200&h=400&fit=crop"}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {!isEditingCover && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full"
                onClick={() => setIsEditingCover(true)}
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Cover Image Dialog */}
          <Dialog open={isEditingCover} onOpenChange={setIsEditingCover}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تغيير صورة الغلاف</DialogTitle>
                <DialogDescription>
                  اختر صورة جديدة لصورة الغلاف
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Label htmlFor="cover-upload">صورة الغلاف</Label>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="w-full"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profile Info */}
        <div className="container mx-auto px-4 -mt-20 sm:-mt-24 relative z-10 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
            <div className="relative group">
              <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background shadow-lg">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback className="text-4xl">
                  {fullName.charAt(0) || clerkUser.firstName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <label htmlFor="profile-upload" className="cursor-pointer">
                    <Camera className="h-8 w-8 text-white" />
                  </label>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              {!isEditing ? (
                <Card className="bg-background/95 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h1 className="text-3xl font-bold">{fullName}</h1>
                          <Badge className="bg-secondary text-secondary-foreground">
                            موثق ✓
                          </Badge>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{bio || "لا يوجد وصف..."}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          className="rounded-full"
                        >
                          <Edit2 className="h-4 w-4 ml-2" />
                          تعديل الملف الشخصي
                        </Button>
                        <Button 
                          onClick={handleSignOut}
                          variant="destructive"
                          className="rounded-full"
                        >
                          <LogOut className="h-4 w-4 ml-2" />
                          تسجيل الخروج
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{location || "لا يوجد موقع"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-secondary" />
                        <span>انضم {new Date(clerkUser.createdAt!).toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}</span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ) : (
                <Card className="bg-background/95 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle>تعديل الملف الشخصي</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="الاسم الكامل"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">نبذة عني</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="اكتب نبذة عنك..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">الموقع</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="المدينة، الدولة"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveProfile}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 ml-2" />
                        حفظ
                      </Button>
                      <Button 
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-background rounded-2xl p-4 border border-border/50 text-center">
                  <div className="text-2xl font-bold text-primary">{stats.trips}</div>
                  <div className="text-xs text-muted-foreground">رحلة</div>
                </div>
                <div className="bg-background rounded-2xl p-4 border border-border/50 text-center">
                  <div className="text-2xl font-bold text-secondary">{stats.followers}</div>
                  <div className="text-xs text-muted-foreground">متابع</div>
                </div>
                <div className="bg-background rounded-2xl p-4 border border-border/50 text-center">
                  <div className="text-2xl font-bold text-primary">{stats.following}</div>
                  <div className="text-xs text-muted-foreground">يتابع</div>
                </div>
                <div className="bg-background rounded-2xl p-4 border border-border/50 text-center">
                  <div className="text-2xl font-bold text-secondary">{stats.likes}</div>
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
                  <h3 className="text-xl font-semibold mb-2">لا توجد رحلات بعد</h3>
                  <p className="text-muted-foreground mb-4">ابدأ بمشاركة أول رحلة لك!</p>
                  <Button onClick={() => navigate("/trips/new")}>
                    أنشئ رحلة جديدة
                  </Button>
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

export default UserProfile;


