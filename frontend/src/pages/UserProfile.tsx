import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Users, Heart, Settings, Camera, Edit2, Save, X, LogOut, Bookmark, MessageCircle } from "lucide-react";
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
import {
  getUserTrips,
  getUserById,
  getUserTripsById,
  updateUserProfile,
  toggleFollowUser,
  getUserSavedTrips,
  getUserLovedTrips,
  getUserSavedTripsById,
  getUserLovedTripsById,
  getUserAITrips,
} from "@/lib/api";
import TripSkeletonLoader from "@/components/TripSkeletonLoader";

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user: clerkUser, isLoaded } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ID is required - redirect if missing
  useEffect(() => {
    if (isLoaded && !id) {
      if (isSignedIn && clerkUser?.id) {
        // Redirect to own profile with Clerk ID
        navigate(`/user/${clerkUser.id}`, { replace: true });
      } else {
        // Not signed in and no ID - redirect to auth
        navigate("/auth", { replace: true });
      }
    }
  }, [id, isLoaded, isSignedIn, clerkUser?.id, navigate]);

  // Determine if viewing own profile
  const isOwnProfile = clerkUser && id === clerkUser.id;

  // Local state for editable profile data
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // User data state (for viewing other users)
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // User trips state
  const [userTrips, setUserTrips] = useState<any[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [lovedTrips, setLovedTrips] = useState<any[]>([]);
  const [aiTrips, setAiTrips] = useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isLoadingLoved, setIsLoadingLoved] = useState(false);
  const [isLoadingAITrips, setIsLoadingAITrips] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    trips: 0,
    followers: 0,
    following: 0,
    likes: 0
  });
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Redirect to auth if viewing own profile but not signed in
  useEffect(() => {
    if (isLoaded && isOwnProfile && !isSignedIn) {
      toast({
        title: "غير مصرح",
        description: "يجب تسجيل الدخول لعرض ملفك الشخصي",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [isOwnProfile, isSignedIn, isLoaded, navigate, toast]);

  // Early return if no ID (will be handled by redirect effect)
  if (!id) {
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

  // Load user's data - either own profile (from Clerk) or other user's profile (from API)
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      
      // If viewing own profile, load from database (which has latest data)
      if (isOwnProfile && clerkUser) {
        setIsLoadingUser(true);
        try {
          const userData = await getUserById(clerkUser.id);
          setFullName(userData.fullName || clerkUser.fullName || clerkUser.firstName || clerkUser.username || "");
          setBio(userData.bio || (clerkUser.publicMetadata?.bio as string) || "");
          setLocation(userData.location || (clerkUser.publicMetadata?.location as string) || "");
          setProfileImage(userData.imageUrl || clerkUser.imageUrl || null);
          setCoverImage(userData.coverImage || (clerkUser.publicMetadata?.coverImage as string) || null);
          setStats((prev) => ({
            ...prev,
            followers: userData.followers || 0,
            following: userData.following || 0,
            likes: userData.totalLikes || 0,
            trips: userData.tripsCount ?? prev.trips,
          }));
          setIsFollowingUser(false);
        } catch (error) {
          console.error("Error loading own profile from database:", error);
          // Fallback to Clerk data
          setFullName(clerkUser.fullName || clerkUser.firstName || clerkUser.username || "");
          setBio(clerkUser.publicMetadata?.bio as string || "");
          setLocation(clerkUser.publicMetadata?.location as string || "");
          setProfileImage(clerkUser.imageUrl || null);
          setCoverImage((clerkUser.publicMetadata?.coverImage as string) || null);
        } finally {
          setIsLoadingUser(false);
        }
        return;
      }
      
      // Otherwise, fetch from API
      
      setIsLoadingUser(true);
      try {
        const token = isSignedIn ? await getToken() : undefined;
        const userData = await getUserById(id, token || undefined);
        setViewingUser(userData);
        setFullName(userData.fullName || userData.username || "");
        setBio(userData.bio || "");
        setLocation(userData.location || "");
        setProfileImage(userData.imageUrl || null);
        setCoverImage(userData.coverImage || null);
        setStats({
          trips: userData.tripsCount || 0,
          followers: userData.followers || 0,
          following: userData.following || 0,
          likes: userData.totalLikes || 0,
        });
        setIsFollowingUser(Boolean(userData.viewerFollows));
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        toast({
          title: "خطأ",
          description: "فشل تحميل بيانات المستخدم",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, [id, isOwnProfile, clerkUser, navigate, toast, isSignedIn, getToken]);

  // Fetch user trips
  useEffect(() => {
    const fetchUserTrips = async () => {
      if (!id) return;
      
      setIsLoadingTrips(true);
      try {
        let trips: any[] = [];
        
        if (isOwnProfile && isSignedIn) {
          // Fetch own trips (requires auth)
          const token = await getToken();
          trips = await getUserTrips(token || undefined);
        } else {
          // Fetch other user's trips (public) or own trips if not signed in yet
          trips = await getUserTripsById(id);
        }
        
        setUserTrips(Array.isArray(trips) ? trips : []);
        setStats(prev => ({ ...prev, trips: Array.isArray(trips) ? trips.length : 0 }));
      } catch (error: any) {
        console.error("Error fetching user trips:", error);
        if (error.message !== 'Unauthorized') {
          toast({
            title: "خطأ",
            description: "فشل تحميل الرحلات",
            variant: "destructive",
          });
        }
        setUserTrips([]);
      } finally {
        setIsLoadingTrips(false);
      }
    };

    fetchUserTrips();
  }, [id, isOwnProfile, isSignedIn, getToken, toast]);

  useEffect(() => {
    const fetchSavedAndLoved = async () => {
      if (!id) return;
      setIsLoadingSaved(true);
      setIsLoadingLoved(true);
      try {
        let saved: any[] = [];
        let loved: any[] = [];
        if (isOwnProfile && isSignedIn) {
          const token = await getToken();
          saved = await getUserSavedTrips(token || undefined);
          loved = await getUserLovedTrips(token || undefined);
        } else {
          saved = await getUserSavedTripsById(id);
          loved = await getUserLovedTripsById(id);
        }
        setSavedTrips(Array.isArray(saved) ? saved : []);
        setLovedTrips(Array.isArray(loved) ? loved : []);
      } catch (error: any) {
        console.error("Error fetching saved/loved trips:", error);
        toast({
          title: "خطأ",
          description: error.message || "فشل تحميل الرحلات المحفوظة أو المعجب بها",
          variant: "destructive",
        });
        setSavedTrips([]);
        setLovedTrips([]);
      } finally {
        setIsLoadingSaved(false);
        setIsLoadingLoved(false);
      }
    };

    fetchSavedAndLoved();
  }, [id, isOwnProfile, isSignedIn, getToken, toast]);

  // Fetch AI trips
  useEffect(() => {
    const fetchAITrips = async () => {
      if (!isOwnProfile || !isSignedIn) return;
      
      setIsLoadingAITrips(true);
      try {
        const token = await getToken();
        const trips = await getUserAITrips(token || undefined);
        setAiTrips(Array.isArray(trips) ? trips : []);
      } catch (error: any) {
        console.error("Error fetching AI trips:", error);
        setAiTrips([]);
      } finally {
        setIsLoadingAITrips(false);
      }
    };

    fetchAITrips();
  }, [id, isOwnProfile, isSignedIn, getToken]);

  const handleSaveProfile = async () => {
    if (!clerkUser || !isOwnProfile) return;

    try {
      const token = await getToken();
      
      // Update profile in database (which also updates Clerk)
      await updateUserProfile(
        {
          bio,
          location,
          coverImage: coverImage || undefined,
          fullName: fullName || undefined,
          imageUrl: profileImage || undefined,
        },
        token || undefined
      );

      toast({
        title: "نجح التحديث",
        description: "تم تحديث الملف الشخصي بنجاح",
      });

      setIsEditing(false);
      
      // Refresh user data from database (which has the latest saved data)
      if (isOwnProfile && clerkUser) {
        // Update local state with saved values immediately
        setFullName(fullName);
        setBio(bio);
        setLocation(location);
        if (profileImage) setProfileImage(profileImage);
        if (coverImage) setCoverImage(coverImage);
        
        // Reload user data from API to get the latest from database
        setTimeout(async () => {
          try {
            const updatedUser = await getUserById(clerkUser.id);
            if (updatedUser) {
              setFullName(updatedUser.fullName || fullName);
              setBio(updatedUser.bio || bio);
              setLocation(updatedUser.location || location);
              setProfileImage(updatedUser.imageUrl || profileImage);
              setCoverImage(updatedUser.coverImage || null);
            }
          } catch (error) {
            console.error("Error refreshing user data:", error);
          }
        }, 500);
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الملف الشخصي",
        variant: "destructive",
      });
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clerkUser || !isOwnProfile) return;

    try {
      // Show loading state
      toast({
        title: "جاري رفع الصورة...",
        description: "يرجى الانتظار",
      });

      // Convert file to base64
      const reader = new FileReader();
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Update local state immediately for preview
      setProfileImage(base64Image);

      // Save to database
      const token = await getToken();
      await updateUserProfile(
        {
          imageUrl: base64Image,
        },
        token || undefined
      );

      toast({
        title: "تم الحفظ",
        description: "تم حفظ صورة الملف الشخصي بنجاح",
      });

      // Refresh user data from database
      setTimeout(async () => {
        try {
          const updatedUser = await getUserById(clerkUser.id);
          if (updatedUser && updatedUser.imageUrl) {
            setProfileImage(updatedUser.imageUrl);
          }
        } catch (error) {
          console.error("Error refreshing profile image:", error);
        }
      }, 500);
    } catch (error: any) {
      console.error("Error uploading profile image:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل رفع صورة الملف الشخصي",
        variant: "destructive",
      });
      // Revert to previous profile image on error
      if (isOwnProfile && clerkUser) {
        const userData = await getUserById(clerkUser.id).catch(() => null);
        if (userData?.imageUrl) {
          setProfileImage(userData.imageUrl);
        } else {
          setProfileImage(clerkUser.imageUrl || null);
        }
      }
    }
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clerkUser || !isOwnProfile) return;

    try {
      // Show loading state
      toast({
        title: "جاري رفع الصورة...",
        description: "يرجى الانتظار",
      });

      // Convert file to base64
      const reader = new FileReader();
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Update local state immediately for preview
      setCoverImage(base64Image);

      // Save to database
      const token = await getToken();
      await updateUserProfile(
        {
          coverImage: base64Image,
        },
        token || undefined
      );

      // Close dialog
      setIsEditingCover(false);

      toast({
        title: "تم الحفظ",
        description: "تم حفظ صورة الغلاف بنجاح",
      });

      // Refresh user data from database
      setTimeout(async () => {
        try {
          const updatedUser = await getUserById(clerkUser.id);
          if (updatedUser) {
            // Always update coverImage from database, even if it's null
            setCoverImage(updatedUser.coverImage || null);
          }
        } catch (error) {
          console.error("Error refreshing cover image:", error);
        }
      }, 500);
    } catch (error: any) {
      console.error("Error uploading cover image:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل رفع صورة الغلاف",
        variant: "destructive",
      });
      // Revert to previous cover image on error
      if (isOwnProfile && clerkUser) {
        const userData = await getUserById(clerkUser.id).catch(() => null);
        if (userData?.coverImage) {
          setCoverImage(userData.coverImage);
        } else {
          setCoverImage((clerkUser.publicMetadata?.coverImage as string) || null);
        }
      }
    }
  };

  const handleCancelEdit = () => {
    if (clerkUser && isOwnProfile) {
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

  const handleToggleFollow = async () => {
    if (!id) return;
    if (!isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لمتابعة المستخدمين",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsFollowLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }
      const response = await toggleFollowUser(id, token);
      setIsFollowingUser(response.following);
      setStats((prev) => ({
        ...prev,
        followers: response.followers ?? prev.followers,
      }));
      toast({
        title: response.following ? "تمت المتابعة" : "تم إلغاء المتابعة",
        description: response.following
          ? "ستظهر تحديثات هذا المستخدم في موجزك"
          : undefined,
      });
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر تحديث حالة المتابعة",
        variant: "destructive",
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const getJoinDate = () => {
    if (isOwnProfile && clerkUser?.createdAt) {
      return new Date(clerkUser.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long" });
    }
    if (viewingUser?.createdAt) {
      return new Date(viewingUser.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long" });
    }
    return "غير محدد";
  };

  if (isLoadingUser || (isOwnProfile && !isLoaded)) {
    return (
      <>
        <Header />
        <TripSkeletonLoader variant="detail" />
        <Footer />
      </>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Cover Image */}
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden group bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900">
          {coverImage ? (
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
              onError={(e) => {
                // If the image fails to load, hide it
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {isOwnProfile && !isEditingCover && (
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
          {isOwnProfile && (
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
          )}
        </div>

        {/* Profile Info */}
        <div className="container mx-auto px-4 -mt-20 sm:-mt-24 relative z-10 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
            <div className="relative group">
              <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background shadow-lg">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback className="text-4xl">
                  {fullName.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              
              {isOwnProfile && isEditing && (
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
                        {isOwnProfile ? (
                          <>
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
                          </>
                        ) : (
                          <Button
                            variant={isFollowingUser ? "secondary" : "default"}
                            className="rounded-full"
                            onClick={handleToggleFollow}
                            disabled={isFollowLoading}
                          >
                            <Users className="h-4 w-4 ml-2" />
                            {isFollowLoading
                              ? "جاري المتابعة..."
                              : isFollowingUser
                                ? "إلغاء المتابعة"
                                : "متابعة"}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{location || "لا يوجد موقع"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-secondary" />
                        <span>انضم {getJoinDate()}</span>
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
              {isOwnProfile && (
                <TabsTrigger value="ai-trips" className="rounded-full">رحلات الذكاء الاصطناعي</TabsTrigger>
              )}
              <TabsTrigger value="saved" className="rounded-full">المحفوظات</TabsTrigger>
              <TabsTrigger value="liked" className="rounded-full">الإعجابات</TabsTrigger>
            </TabsList>

            <TabsContent value="trips" className="mt-8">
              {isLoadingTrips ? (
                <TripSkeletonLoader count={3} variant="card" />
              ) : userTrips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userTrips.map((trip) => {
                    const tripId = String(trip._id || trip.id);
                    return (
                      <TripCard 
                        key={tripId} 
                        id={tripId}
                        title={trip.title}
                        destination={trip.destination}
                        duration={trip.duration}
                        rating={trip.rating}
                        image={trip.image}
                        author={trip.author}
                        likes={trip.likes || 0}
                        ownerId={trip.ownerId}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {isOwnProfile ? "لا توجد رحلات بعد" : "لا توجد رحلات لهذا المستخدم"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isOwnProfile 
                      ? "ابدأ بمشاركة أول رحلة لك!" 
                      : "لم يقم هذا العضو بمشاركة أي رحلات حتى الآن."}
                  </p>
                  {isOwnProfile && (
                    <Button onClick={() => navigate("/trips/new")}>
                      أنشئ رحلة جديدة
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="ai-trips" className="mt-8">
                {isLoadingAITrips ? (
                  <TripSkeletonLoader count={3} variant="card" />
                ) : aiTrips.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aiTrips.map((trip) => {
                      const tripId = String(trip._id || trip.id);
                      return (
                        <TripCard 
                          key={tripId} 
                          id={tripId}
                          title={trip.title}
                          destination={trip.destination}
                          duration={trip.duration}
                          rating={trip.rating}
                          image={trip.image}
                          author={trip.author}
                          likes={trip.likes || 0}
                          ownerId={trip.ownerId}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد رحلات ذكاء اصطناعي بعد</h3>
                    <p className="text-muted-foreground mb-4">
                      استخدم مساعد الرحلات الذكي لإنشاء رحلات مخصصة
                    </p>
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="saved" className="mt-8">
              {isLoadingSaved ? (
                <TripSkeletonLoader count={3} variant="card" />
              ) : savedTrips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedTrips.map((trip) => {
                    const tripId = String(trip._id || trip.id);
                    return (
                      <TripCard
                        key={tripId}
                        id={tripId}
                        title={trip.title}
                        destination={trip.destination}
                        duration={trip.duration}
                        rating={trip.rating}
                        image={trip.image}
                        author={trip.author}
                        likes={trip.likes || 0}
                        ownerId={trip.ownerId}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Bookmark className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {isOwnProfile ? "لا توجد رحلات محفوظة" : "لا توجد رحلات محفوظة لهذا المستخدم"}
                  </h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "ابدأ بحفظ رحلاتك المفضلة لتظهر هنا"
                      : "لم يقم هذا العضو بحفظ أي رحلات حتى الآن"}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="liked" className="mt-8">
              {isLoadingLoved ? (
                <TripSkeletonLoader count={3} variant="card" />
              ) : lovedTrips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lovedTrips.map((trip) => {
                    const tripId = String(trip._id || trip.id);
                    return (
                      <TripCard
                        key={tripId}
                        id={tripId}
                        title={trip.title}
                        destination={trip.destination}
                        duration={trip.duration}
                        rating={trip.rating}
                        image={trip.image}
                        author={trip.author}
                        likes={trip.likes || 0}
                        ownerId={trip.ownerId}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {isOwnProfile ? "لا توجد رحلات مُعجب بها" : "لا توجد إعجابات لهذا المستخدم"}
                  </h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "اكتشف رحلات جديدة وابدأ بالإعجاب بها"
                      : "لم يقم هذا العضو بالإعجاب بأي رحلات بعد"}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;
