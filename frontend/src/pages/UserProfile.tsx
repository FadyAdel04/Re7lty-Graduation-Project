import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import UserCard from "@/components/UserCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Users, Heart, Settings, Camera, Edit2, Save, X, LogOut, Bookmark, MessageCircle, Award, Crown, Gem, LayoutGrid, Sparkles, Image as ImageIcon, Trash2 } from "lucide-react";
import { useUser, useAuth, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TripAIChatWidget from "@/components/TripAIChatWidget";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  createStory,
  getMyStories,
  getStoryViewers,
  deleteStory,
  StoryItem,
  StoryViewerInfo,
  getUserFollowers,
  getUserFollowing,
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

  // Stories (user can add story from profile)
  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);
  const [storyMedia, setStoryMedia] = useState<string | null>(null);
  const [storyMediaType, setStoryMediaType] = useState<"image" | "video" | null>(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [isPublishingStory, setIsPublishingStory] = useState(false);
  const [myStories, setMyStories] = useState<StoryItem[]>([]);
  const [isLoadingMyStories, setIsLoadingMyStories] = useState(false);
  const [storyViewersById, setStoryViewersById] = useState<Record<string, StoryViewerInfo[]>>({});

  const handleOpenFollowers = () => {
    const targetId = id || clerkUser?.id;
    if (targetId) navigate(`/user/${targetId}/network?type=followers`);
  };

  const handleOpenFollowing = () => {
    const targetId = id || clerkUser?.id;
    if (targetId) navigate(`/user/${targetId}/network?type=following`);
  };

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

  // Fetch my stories for management
  useEffect(() => {
    if (isOwnProfile && isSignedIn) {
      loadMyStories();
    }
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

  const handleStoryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setStoryMedia(result);
      if (file.type.startsWith("video")) {
        setStoryMediaType("video");
      } else {
        setStoryMediaType("image");
      }
    };
    reader.readAsDataURL(file);
  };

  const resetStoryForm = () => {
    setStoryMedia(null);
    setStoryMediaType(null);
    setStoryCaption("");
    setIsPublishingStory(false);
  };

  const loadMyStories = async () => {
    if (!clerkUser) return;
    try {
      setIsLoadingMyStories(true);
      const token = await getToken();
      if (!token) return;
      const data = await getMyStories(token);
      setMyStories(data?.items || []);
    } catch (error) {
      console.error("Error loading my stories:", error);
    } finally {
      setIsLoadingMyStories(false);
    }
  };

  const handlePublishStory = async () => {
    if (!clerkUser || !isOwnProfile) return;
    if (!storyMedia || !storyMediaType) {
      toast({
        title: "بيانات غير مكتملة",
        description: "الرجاء اختيار صورة أو فيديو للستوري",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPublishingStory(true);
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }

      await createStory(
        {
          mediaUrl: storyMedia,
          mediaType: storyMediaType,
          caption: storyCaption || undefined,
        },
        token
      );

      toast({
        title: "تم نشر القصة",
        description: "تم نشر الستوري بنجاح ليتظهر لمتابعيك خلال ٢٤ ساعة",
      });
      setIsStoryDialogOpen(false);
      resetStoryForm();
      // refresh my stories list if dialog is open
      void loadMyStories();
    } catch (error: any) {
      console.error("Error publishing story:", error);
      toast({
        title: "خطأ",
        description: error?.message || "تعذر نشر الستوري، حاول مرة أخرى",
        variant: "destructive",
      });
      setIsPublishingStory(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!isSignedIn) return;
    
    if (!window.confirm("هل أنت متأكد من حذف هذه القصة؟")) return;

    try {
      const token = await getToken();
      if (!token) return;

      await deleteStory(storyId, token);
      
      toast({
        title: "تم الحذف",
        description: "تم حذف القصة بنجاح",
      });

      // Update local state
      setMyStories(prev => prev.filter(s => s._id !== storyId));
    } catch (error: any) {
      console.error("Error deleting story:", error);
      toast({
        title: "خطأ",
        description: "فشل حذف القصة",
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

  const getUserBadge = () => {
    // Activity score based on trips and engagement
    const activityScore =
      stats.trips * 5 + // publishing trips
      stats.likes * 0.5 +
      stats.followers * 0.5;

    if (activityScore >= 300) {
      return {
        type: "diamond" as const,
        label: "مستخدم ماسي",
        icon: <Gem className="h-4 w-4 ml-1" />,
        className: "bg-gradient-to-l from-cyan-400 to-indigo-500 text-white",
      };
    }

    if (activityScore >= 120) {
      return {
        type: "gold" as const,
        label: "مستخدم ذهبي",
        icon: <Crown className="h-4 w-4 ml-1" />,
        className: "bg-gradient-to-l from-amber-400 to-orange-500 text-white",
      };
    }

    if (activityScore >= 40) {
      return {
        type: "silver" as const,
        label: "مستخدم فضي",
        icon: <Award className="h-4 w-4 ml-1" />,
        className: "bg-gradient-to-l from-slate-200 to-slate-400 text-slate-900",
      };
    }

    return null;
  };

  const userBadge = getUserBadge();

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
    <div className="min-h-screen bg-[#F8FAFC] font-cairo text-right" dir="rtl">
      <Header />
      
      <main className="pb-20">
        {/* 1. Cinematic Header Section */}
        <section className="relative h-[400px] w-full overflow-hidden">
           {/* Background Image */}
           <div className="absolute inset-0 z-0">
              {coverImage ? (
                <img src={coverImage} alt="" className="w-full h-full object-cover transform scale-105 transition-transform duration-[10s]" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#F8FAFC]" />
           </div>

           {/* Change Cover Trigger (Own Profile) */}
           {isOwnProfile && (
             <button 
               onClick={() => setIsEditingCover(true)}
               className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-bold hover:bg-white/20 transition-all shadow-xl"
             >
                <Camera className="w-4 h-4" />
                تغيير الغلاف
             </button>
           )}
        </section>

        {/* 2. Profile Overlapping Content */}
        <div className="container mx-auto px-4 -mt-24 relative z-10">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT SIDE: Identity Card (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                 <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                       {/* Avatar with Ring */}
                       <div className="relative mb-6">
                          <div className="p-1 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-500 shadow-xl">
                             <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-white">
                                <AvatarImage src={profileImage || undefined} />
                                <AvatarFallback className="text-4xl bg-orange-50 text-orange-600 font-black">
                                  {fullName?.charAt(0) || "?"}
                                </AvatarFallback>
                             </Avatar>
                          </div>
                          {isOwnProfile && isEditing && (
                            <label htmlFor="profile-upload" className="absolute bottom-2 right-2 p-3 bg-indigo-600 rounded-full text-white shadow-lg cursor-pointer hover:bg-indigo-700 transition-all">
                               <Camera className="w-5 h-5" />
                               <input id="profile-upload" type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                            </label>
                          )}
                       </div>

                       {/* User Identity */}
                       <div className="space-y-2 mb-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <h1 className="text-3xl font-black text-gray-900">{fullName}</h1>
                             {userBadge && (
                               <TooltipProvider>
                                  <Tooltip>
                                     <TooltipTrigger>
                                        <div className={cn("p-1.5 rounded-lg shadow-sm", userBadge.className)}>
                                           {userBadge.icon}
                                        </div>
                                     </TooltipTrigger>
                                     <TooltipContent className="font-cairo font-bold">
                                        {userBadge.label}
                                     </TooltipContent>
                                  </Tooltip>
                               </TooltipProvider>
                             )}
                          </div>
                          <div className="flex items-center justify-center gap-1.5 text-orange-600 font-bold text-sm bg-orange-50 px-3 py-1 rounded-full mx-auto w-fit">
                             <MapPin className="h-3.5 w-3.5" />
                             {location || "رحالة جائل"}
                          </div>
                       </div>

                       {/* Bio Section */}
                       <p className="text-gray-500 leading-relaxed font-light mb-8 italic">
                          "{bio || "لا يوجد وصف حالياً.. هذا الرحالة مشغول باستكشاف العالم."}"
                       </p>

                       {/* Action Buttons */}
                       <div className="w-full space-y-3">
                          {!isEditing ? (
                             <>
                                {isOwnProfile ? (
                                   <div className="grid grid-cols-1 gap-3">
                                      <Button onClick={() => setIsStoryDialogOpen(true)} className="h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold gap-2 shadow-lg shadow-orange-200">
                                         <Sparkles className="w-5 h-5" />
                                         نشر قصة (Story)
                                      </Button>
                                      <div className="grid grid-cols-2 gap-3">
                                         <Button onClick={() => setIsEditing(true)} variant="outline" className="h-12 rounded-2xl border-gray-100 hover:bg-gray-50 font-bold gap-2">
                                            <Edit2 className="w-4 h-4" />
                                            تعديل
                                         </Button>
                                         <Button onClick={handleSignOut} variant="outline" className="h-12 rounded-2xl border-red-50 text-red-500 hover:bg-red-50 font-bold gap-2">
                                            <LogOut className="w-4 h-4" />
                                            خروج
                                         </Button>
                                      </div>
                                   </div>
                                ) : (
                                   <Button 
                                     onClick={handleToggleFollow} 
                                     disabled={isFollowLoading}
                                     className={cn(
                                       "w-full h-14 rounded-2xl text-lg font-black gap-3 transition-all",
                                       isFollowingUser ? "bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100"
                                     )}
                                   >
                                      <Users className="w-6 h-6" />
                                      {isFollowingUser ? "متابَع" : "متابعة"}
                                   </Button>
                                )}
                             </>
                          ) : (
                             <div className="space-y-4 text-right">
                                <div className="space-y-2">
                                   <Label className="font-bold">الاسم الكامل</Label>
                                   <Input value={fullName} onChange={e => setFullName(e.target.value)} className="rounded-xl border-gray-100 h-12" />
                                </div>
                                <div className="space-y-2">
                                   <Label className="font-bold">الموقع</Label>
                                   <Input value={location} onChange={e => setLocation(e.target.value)} className="rounded-xl border-gray-100 h-12" />
                                </div>
                                <div className="space-y-2">
                                   <Label className="font-bold">النبذة الشخصية</Label>
                                   <Textarea value={bio} onChange={e => setBio(e.target.value)} className="rounded-xl border-gray-100 min-h-[100px]" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                   <Button onClick={handleSaveProfile} className="flex-1 h-12 rounded-xl bg-orange-600 text-white">حفظ</Button>
                                   <Button onClick={handleCancelEdit} variant="outline" className="flex-1 h-12 rounded-xl">إلغاء</Button>
                                </div>
                             </div>
                          )}
                       </div>
                    </CardContent>
                 </Card>

                 {/* Premium Stats Grid */}
                 <div className="grid grid-cols-2 gap-4">
                    {[
                       { label: "رحـلـة", val: stats.trips, icon: <MapPin />, color: "text-orange-600", bg: "bg-orange-50", click: null },
                       { label: "مـتـابـع", val: stats.followers, icon: <Users />, color: "text-indigo-600", bg: "bg-indigo-50", click: handleOpenFollowers },
                       { label: "يـتـابـع", val: stats.following, icon: <Users />, color: "text-emerald-600", bg: "bg-emerald-50", click: handleOpenFollowing },
                       { label: "إعـجـاب", val: stats.likes, icon: <Heart />, color: "text-red-600", bg: "bg-red-50", click: null },
                    ].map((stat, i) => (
                       <button 
                         key={stat.label}
                         onClick={stat.click || undefined}
                         disabled={!stat.click}
                         className={cn(
                           "p-5 rounded-[1.8rem] bg-white border border-gray-50 shadow-sm flex flex-col items-center gap-2 transition-all group",
                           stat.click ? "hover:shadow-lg hover:border-indigo-100 cursor-pointer" : "cursor-default"
                         )}
                       >
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-1", stat.bg, stat.color)}>
                             {stat.icon}
                          </div>
                          <span className="text-2xl font-black text-gray-900">{stat.val}</span>
                          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{stat.label}</span>
                       </button>
                    ))}
                 </div>
              </div>

              {/* RIGHT SIDE: Content Sections (8 cols) */}
              <div className="lg:col-span-8 space-y-8">
                 <Card className="border-0 shadow-lg rounded-[2.5rem] bg-white p-2">
                    <Tabs defaultValue="trips" className="w-full">
                       <TabsList className="w-full justify-start gap-4 bg-transparent p-4 h-auto border-b border-gray-50 flex-wrap">
                          {[
                            { id: "trips", label: "الرحلات العامة", icon: <LayoutGrid className="w-4 h-4" /> },
                            { id: "stories", label: "قصصي", icon: <ImageIcon className="w-4 h-4" />, hide: !isOwnProfile },
                            { id: "ai-trips", label: "مساعد الرحلات الذكى ", icon: <Sparkles className="w-4 h-4" />, hide: !isOwnProfile },
                            { id: "saved", label: "المحفوظات", icon: <Bookmark className="w-4 h-4" /> },
                            { id: "liked", label: "الإعجابات", icon: <Heart className="w-4 h-4" /> },
                          ].filter(t => !t.hide).map(tab => (
                             <TabsTrigger 
                               key={tab.id} 
                               value={tab.id}
                               className="data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl px-6 py-3 font-bold transition-all gap-2"
                             >
                                {tab.icon}
                                {tab.label}
                             </TabsTrigger>
                          ))}
                       </TabsList>

                       {["trips", "ai-trips", "stories", "saved", "liked"].map(tabId => (
                          <TabsContent key={tabId} value={tabId} className="p-6 transition-all animate-in fade-in slide-in-from-bottom-4">
                             {/* Shared Trip Grid Logic */}
                             {renderTabContent(tabId)}
                          </TabsContent>
                       ))}
                    </Tabs>
                 </Card>
              </div>

           </div>
        </div>

        {/* Global Floating Elements */}
        {isOwnProfile && <TripAIChatWidget />}

        {/* Dialogs */}
        <Dialog open={isEditingCover} onOpenChange={setIsEditingCover}>
          <DialogContent className="font-cairo rounded-[2rem]">
             <DialogHeader>
                <DialogTitle className="text-right">تغيير صورة الغلاف</DialogTitle>
                <DialogDescription className="text-right">سيظهر هذا الغلاف في الجزء العلوي من ملفك الشخصي.</DialogDescription>
             </DialogHeader>
             <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-indigo-100 rounded-3xl group transition-colors hover:bg-indigo-50">
                 <ImageIcon className="w-12 h-12 text-indigo-300 mb-4 group-hover:scale-110 transition-transform" />
                 <input id="cover-upload" type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
                 <label htmlFor="cover-upload" className="cursor-pointer bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700">اختيار صورة</label>
             </div>
          </DialogContent>
        </Dialog>

        {isStoryDialogOpen && (
          <Dialog open={isStoryDialogOpen} onOpenChange={setIsStoryDialogOpen}>
            <DialogContent className="max-w-2xl font-cairo rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-right">إضافة قضة رحلة جديدة (Story)</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4 text-right">
                   <div className="aspect-[9/16] max-h-[400px] w-full bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                      {storyMedia ? (
                         <>
                            {storyMediaType === 'video' ? <video src={storyMedia} className="h-full w-full object-cover" /> : <img src={storyMedia} className="h-full w-full object-cover" />}
                            <button onClick={resetStoryForm} className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full z-10"><X className="w-4 h-4" /></button>
                         </>
                      ) : (
                         <div className="flex flex-col items-center">
                            <Camera className="w-12 h-12 text-gray-300 mb-3" />
                            <input type="file" id="story-up" className="hidden" accept="image/*,video/*" onChange={handleStoryFileChange} />
                            <label htmlFor="story-up" className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold cursor-pointer transition-transform hover:scale-105">اختر ميديا</label>
                         </div>
                      )}
                   </div>
                   <Textarea placeholder="أضف وصفاً جذاباً لقصتك..." value={storyCaption} onChange={e => setStoryCaption(e.target.value)} className="rounded-2xl border-gray-100 min-h-[100px]" />
                   <Button onClick={handlePublishStory} disabled={isPublishingStory || !storyMedia} className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-lg font-black shadow-xl shadow-orange-100">
                      {isPublishingStory ? "جاري النشر..." : "نشر الستوري الآن"}
                   </Button>
                </div>
            </DialogContent>
          </Dialog>
        )}
      </main>

      <Footer />
    </div>
  );

  function renderTabContent(tabId: string) {
    const loading = tabId === 'trips' ? isLoadingTrips : tabId === 'saved' ? isLoadingSaved : tabId === 'liked' ? isLoadingLoved : tabId === 'stories' ? isLoadingMyStories : isLoadingAITrips;
    const data = tabId === 'trips' ? userTrips : tabId === 'saved' ? savedTrips : tabId === 'liked' ? lovedTrips : tabId === 'stories' ? myStories : aiTrips;

    if (loading) return <TripSkeletonLoader count={3} variant="card" />;

    if (!data.length) {
      return (
        <div className="text-center py-20 flex flex-col items-center">
           <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6">
              {tabId === 'trips' ? <LayoutGrid className="text-gray-200 w-12 h-12" /> : <Bookmark className="text-gray-200 w-12 h-12" />}
           </div>
           <h3 className="text-xl font-bold text-gray-900 mb-2">لا يوجد محتوى هنا بعد</h3>
           <p className="text-gray-500 font-light">استكشف الموقع واملأ صفحتك بأفضل التجارب والذكريات.</p>
        </div>
      );
    }

    if (tabId === 'stories') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {myStories.map((story) => (
            <div key={story._id} className="relative aspect-[9/16] rounded-2xl overflow-hidden group">
              {story.mediaType === 'video' ? (
                <video src={story.mediaUrl} className="w-full h-full object-cover" />
              ) : (
                <img src={story.mediaUrl} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                 <button 
                  onClick={() => handleDeleteStory(story._id)}
                  className="p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-2 right-2 left-2 truncate">
                <span className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded-full">
                  {new Date(story.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {data.map((trip: any) => (
          <TripCard 
            key={trip._id || trip.id} 
            {...trip} 
            id={trip._id || trip.id} 
            authorImage={profileImage || trip.authorImage}
          />
        ))}
      </div>
    );
  }
};

export default UserProfile;
