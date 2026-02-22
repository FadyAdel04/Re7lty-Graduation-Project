import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import UserBadge, { BadgeTier } from "@/components/UserBadge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import UserCard from "@/components/UserCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import LivePulseMap from "@/components/LivePulseMap";
import DigitalPassport, { Stamp, PassportBadge } from "@/components/profile/DigitalPassport";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { MapPin, Calendar, Users, Heart, Settings, Camera, Edit2, Save, X, LogOut, Bookmark, MessageCircle, Award, Crown, Gem, LayoutGrid, Sparkles, Image as ImageIcon, Trash2, Building2, Globe, Info, Loader2, Smile } from "lucide-react";
import { useUser, useAuth, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingService, Booking } from "@/services/bookingService";
import { Badge as UI_Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  updateTrip,
  deleteTrip,
  updateUserProfile,
  getCloudinarySignature,
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
  startDirectChat,
} from "@/lib/api";
import TripSkeletonLoader from "@/components/TripSkeletonLoader";
import BusSeatLayout from "@/components/company/BusSeatLayout";

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
  const [isUpdatingField, setIsUpdatingField] = useState<Record<string, boolean>>({});
  const [editingField, setEditingField] = useState<string | null>(null);

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [cancelConfirmBookingId, setCancelConfirmBookingId] = useState<string | null>(null);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [stamps, setStamps] = useState<Stamp[]>([]);

  // URL Tab handling
  const routeLocation = useLocation();
  const searchParams = new URLSearchParams(routeLocation.search);
  const initialTab = searchParams.get('tab') || 'trips';
  const [activeTab, setActiveTab] = useState(initialTab);
  // Lazy tab data: only fetch when tab is first opened (speeds up initial load)
  const [tabsFetched, setTabsFetched] = useState<Record<string, boolean>>({ trips: false, saved: false, liked: false, bookings: false, passport: false, stories: false, ai: false });

  // Synchronize activeTab with URL changes
  useEffect(() => {
    const tabParam = new URLSearchParams(routeLocation.search).get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [routeLocation.search]);

  // Stats
  const [stats, setStats] = useState({
    trips: 0,
    followers: 0,
    following: 0,
    likes: 0,
    stories: 0
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

  // Booking management
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isEditBookingOpen, setIsEditBookingOpen] = useState(false);
  const [isUpdatingBooking, setIsUpdatingBooking] = useState(false);
  const [editBookingData, setEditBookingData] = useState({
    userPhone: "",
    numberOfPeople: 1,
    specialRequests: "",
    selectedSeats: [] as string[],
    firstName: "",
    lastName: ""
  });

  // Post management (Ask posts / General trips)
  const [editingPost, setEditingPost] = useState<any>(null);
  const [isEditPostOpen, setIsEditPostOpen] = useState(false);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [editPostData, setEditPostData] = useState({
    title: "",
    description: "",
  });

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

  // Load user's data - ALWAYS from database for consistency
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      
      setIsLoadingUser(true);
      try {
        const token = isSignedIn ? await getToken() : undefined;
        const userData = await getUserById(id, token || undefined);
        
        // Set all data from database (single source of truth)
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
          stories: userData.storiesCount || 0,
        });
        setIsFollowingUser(Boolean(userData.viewerFollows));
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        
        // Only for own profile: fallback to Clerk if database fails
        if (isOwnProfile && clerkUser) {
          console.warn("Falling back to Clerk data for own profile");
          setFullName(clerkUser.fullName || clerkUser.firstName || clerkUser.username || "");
          setBio("");
          setLocation("");
          setProfileImage(clerkUser.imageUrl || null);
          setCoverImage(null);
        } else {
          toast({
            title: "خطأ",
            description: "فشل تحميل بيانات المستخدم",
            variant: "destructive",
          });
          navigate("/");
        }
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, [id, isOwnProfile, clerkUser, navigate, toast, isSignedIn, getToken]);

  // Fetch user trips when trips or passport tab is active (lazy)
  useEffect(() => {
    const needTrips = activeTab === 'trips' || activeTab === 'passport';
    if (!id || (!needTrips && tabsFetched.trips)) return;
    const fetchUserTrips = async () => {
      setIsLoadingTrips(true);
      try {
        let trips: any[] = [];
        if (isOwnProfile && isSignedIn) {
          const token = await getToken();
          trips = await getUserTrips(token || undefined);
        } else {
          trips = await getUserTripsById(id);
        }
        setUserTrips(Array.isArray(trips) ? trips : []);
        setStats(prev => ({ ...prev, trips: Array.isArray(trips) ? trips.length : 0 }));
        setTabsFetched(prev => ({ ...prev, trips: true }));
      } catch (error: any) {
        console.error("Error fetching user trips:", error);
        if (error.message !== 'Unauthorized') toast({ title: "خطأ", description: "فشل تحميل الرحلات", variant: "destructive" });
        setUserTrips([]);
      } finally {
        setIsLoadingTrips(false);
      }
    };
    fetchUserTrips();
  }, [id, activeTab, isOwnProfile, isSignedIn, getToken, toast, tabsFetched.trips]);


  useEffect(() => {
    if (!id || (activeTab !== 'saved' && activeTab !== 'liked')) return;
    if (activeTab === 'saved' && tabsFetched.saved) return;
    if (activeTab === 'liked' && tabsFetched.liked) return;
    const fetchSavedAndLoved = async () => {
      if (activeTab === 'saved') setIsLoadingSaved(true);
      if (activeTab === 'liked') setIsLoadingLoved(true);
      try {
        let saved: any[] = [];
        let loved: any[] = [];
        if (isOwnProfile && isSignedIn) {
          const token = await getToken();
          if (activeTab === 'saved' || !tabsFetched.saved) saved = await getUserSavedTrips(token || undefined);
          if (activeTab === 'liked' || !tabsFetched.liked) loved = await getUserLovedTrips(token || undefined);
        } else {
          if (activeTab === 'saved' || !tabsFetched.saved) saved = await getUserSavedTripsById(id);
          if (activeTab === 'liked' || !tabsFetched.liked) loved = await getUserLovedTripsById(id);
        }
        setSavedTrips(Array.isArray(saved) ? saved : []);
        setLovedTrips(Array.isArray(loved) ? loved : []);
        setTabsFetched(prev => ({ ...prev, saved: true, liked: true }));
      } catch (error: any) {
        console.error("Error fetching saved/loved trips:", error);
        toast({ title: "خطأ", description: error.message || "فشل تحميل الرحلات المحفوظة أو المعجب بها", variant: "destructive" });
        setSavedTrips([]);
        setLovedTrips([]);
      } finally {
        setIsLoadingSaved(false);
        setIsLoadingLoved(false);
      }
    };
    fetchSavedAndLoved();
  }, [id, activeTab, isOwnProfile, isSignedIn, getToken, toast, tabsFetched.saved, tabsFetched.liked]);

  // Fetch AI trips only when ai tab is active (lazy)
  useEffect(() => {
    if (!id || !isOwnProfile || !isSignedIn || activeTab !== 'ai' || tabsFetched.ai) return;
    const fetchAITrips = async () => {
      setIsLoadingAITrips(true);
      try {
        const token = await getToken();
        const trips = await getUserAITrips(token || undefined);
        setAiTrips(Array.isArray(trips) ? trips : []);
        setTabsFetched(prev => ({ ...prev, ai: true }));
      } catch (error: any) {
        console.error("Error fetching AI trips:", error);
        setAiTrips([]);
      } finally {
        setIsLoadingAITrips(false);
      }
    };
    fetchAITrips();
  }, [id, activeTab, isOwnProfile, isSignedIn, getToken, tabsFetched.ai]);

  // Fetch bookings only when bookings tab is active (lazy)
  useEffect(() => {
    if (!id || !isOwnProfile || !isSignedIn || activeTab !== 'bookings' || tabsFetched.bookings) return;
    const fetchBookings = async () => {
      setIsLoadingBookings(true);
      try {
        const token = await getToken();
        const data = await bookingService.getMyBookings(token || undefined);
        setBookings(Array.isArray(data) ? data : []);
        setTabsFetched(prev => ({ ...prev, bookings: true }));
      } catch (error: any) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      } finally {
        setIsLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [id, activeTab, isOwnProfile, isSignedIn, getToken, tabsFetched.bookings]);

  // Fetch my stories only when stories tab is active (lazy)
  useEffect(() => {
    if (!id || !isOwnProfile || !isSignedIn || activeTab !== 'stories' || tabsFetched.stories) return;
    setTabsFetched(prev => ({ ...prev, stories: true }));
    loadMyStories();
  }, [id, activeTab, isOwnProfile, isSignedIn, getToken, tabsFetched.stories]);

  const handleUpdateField = async (fieldName: string, value: string) => {
    if (!clerkUser || !isOwnProfile) return;

    try {
      setIsUpdatingField(prev => ({ ...prev, [fieldName]: true }));
      
      const updateData: any = {};
      
      // 1. Update Clerk First (Only for supported fields like name)
      // Note: bio/location are stored in publicMetadata check is read-only on frontend
      // We rely on the backend to update those in Clerk
      if (fieldName === 'fullName') {
        const parts = value.split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ');
        await clerkUser.update({
          firstName,
          lastName,
        });
        updateData.fullName = value;
      } else {
        updateData[fieldName] = value;
      }

      // 2. Sync with Backend (MongoDB)
      const token = await getToken();
      await updateUserProfile(updateData, token || undefined);

      toast({
        title: "تم التحديث",
        description: `تم حفظ ${fieldName === 'fullName' ? 'الاسم' : fieldName === 'bio' ? 'النبذة' : 'الموقع'} بنجاح`,
      });

      // Notify other components with the updated data directly
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updateData }));

      setEditingField(null);
    } catch (error: any) {
      console.error(`Error updating ${fieldName}:`, error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء التحديث",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingField(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleSaveProfile = async () => {
    // Legacy support or for bulk edits if needed
    handleUpdateField('fullName', fullName);
    handleUpdateField('bio', bio);
    handleUpdateField('location', location);
    setIsEditing(false);
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file || !clerkUser || !isOwnProfile) return;

    // Ensure valid image mime type for Clerk
    // Sometimes browsers set empty type or octet-stream for images
    if (!file.type || !file.type.startsWith('image/')) {
       console.log('Original file type:', file.type);
       const ext = file.name.split('.').pop()?.toLowerCase();
       let mimeType = 'image/jpeg';
       if (ext === 'png') mimeType = 'image/png';
       if (ext === 'webp') mimeType = 'image/webp';
       if (ext === 'gif') mimeType = 'image/gif';
       
       // Create new file with correct type
       file = new File([file], file.name, { type: mimeType });
    }

    try {
      // Show loading state
      toast({
        title: "جاري رفع الصورة...",
        description: "يرجى الانتظار",
      });

      // 1. Update Clerk Profile Image
      await clerkUser.setProfileImage({ file });
      await clerkUser.reload(); // Get fresh data
      const newImageUrl = clerkUser.imageUrl;

      // Update local state immediately
      setProfileImage(newImageUrl);

      // 2. Sync with Backend (MongoDB)
      const token = await getToken();
      const updatedUser = await updateUserProfile(
        {
          imageUrl: newImageUrl,
        },
        token || undefined
      );

      if (updatedUser) {
        // Notify other components with the updated user data
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedUser }));
      }

      toast({
        title: "تم الحفظ",
        description: "تم حفظ صورة الملف الشخصي بنجاح",
      });
    } catch (error: any) {
      console.error("Error uploading profile image:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل رفع صورة الملف الشخصي",
        variant: "destructive",
      });
      // Revert to previous profile image on error
      if (isOwnProfile && id) {
        try {
          const userData = await getUserById(id).catch(() => null);
          if (userData?.imageUrl) {
            setProfileImage(userData.imageUrl);
          }
        } catch (err) {
          console.error("Error reverting profile image:", err);
        }
      }
    }
  };

  const uploadCoverToCloudinary = async (file: File, token: string): Promise<string> => {
    const sigData = await getCloudinarySignature(token);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sigData.apiKey);
    formData.append("timestamp", sigData.timestamp.toString());
    formData.append("signature", sigData.signature);
    formData.append("folder", sigData.folder);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "فشل الرفع");
    }
    const data = await res.json();
    return data.secure_url;
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clerkUser || !isOwnProfile) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "خطأ", description: "يرجى اختيار صورة صالحة", variant: "destructive" });
      return;
    }

    try {
      toast({ title: "جاري رفع الصورة...", description: "يرجى الانتظار" });
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const url = await uploadCoverToCloudinary(file, token);
      setCoverImage(url);
      const updatedUser = await updateUserProfile({ coverImage: url }, token);
      if (updatedUser?.coverImage) setCoverImage(updatedUser.coverImage);
      window.dispatchEvent(new CustomEvent("userProfileUpdated", { detail: updatedUser }));
      setIsEditingCover(false);
      toast({ title: "تم الحفظ", description: "تم حفظ صورة الغلاف بنجاح" });
    } catch (error: any) {
      console.error("Error uploading cover image:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل رفع صورة الغلاف",
        variant: "destructive",
      });
      if (isOwnProfile && id) {
        try {
          const userData = await getUserById(id, await getToken()).catch(() => null);
          if (userData?.coverImage) setCoverImage(userData.coverImage);
        } catch (err) {
          console.error("Error reverting cover image:", err);
        }
      }
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelConfirmBookingId) return;
    setIsCancellingBooking(true);
    try {
      const token = await getToken();
      await bookingService.cancelBookingByUser(cancelConfirmBookingId, token || undefined);
      setBookings((prev) =>
        prev.map((b) =>
          b._id === cancelConfirmBookingId
            ? { ...b, status: "cancelled" as const, cancellationReason: "تم الإلغاء من قبل المستخدم" }
            : b
        )
      );
      if (selectedBookingDetails?._id === cancelConfirmBookingId) {
        setSelectedBookingDetails((prev) =>
          prev ? { ...prev, status: "cancelled", cancellationReason: "تم الإلغاء من قبل المستخدم" } : null
        );
      }
      setCancelConfirmBookingId(null);
      toast({ title: "تم الإلغاء", description: "تم إلغاء الحجز وسيتم إبلاغ الشركة." });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل إلغاء الحجز",
        variant: "destructive",
      });
    } finally {
      setIsCancellingBooking(false);
    }
  };

  const handleCancelEdit = async () => {
    // Reload from database to discard changes
    if (isOwnProfile && id) {
      try {
        const token = await getToken();
        const userData = await getUserById(id, token || undefined);
        setFullName(userData.fullName || "");
        setBio(userData.bio || "");
        setLocation(userData.location || "");
        setProfileImage(userData.imageUrl || null);
      } catch (error) {
        console.error("Error reloading user data:", error);
      }
    }
    setIsEditing(false);
    setEditingField(null);
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

  const handleEditBooking = (booking: Booking) => {
    if (booking.status === 'accepted') {
      toast({
        title: "تنبيه",
        description: "لا يمكن تعديل الحجز بعد قبوله. يرجى التواصل مع الشركة.",
        variant: "destructive"
      });
      return;
    }

    setEditingBooking(booking);
    const names = booking.userName.split(" ");
    setEditBookingData({
      userPhone: booking.userPhone,
      numberOfPeople: booking.numberOfPeople,
      specialRequests: booking.specialRequests,
      selectedSeats: booking.selectedSeats || [],
      firstName: names[0] || "",
      lastName: names.slice(1).join(" ") || ""
    });
    setIsEditBookingOpen(true);
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;

    try {
      setIsUpdatingBooking(true);
      const token = await getToken();
      const response = await bookingService.updateBookingByUser(editingBooking._id, editBookingData, token || undefined);

      if (response.success) {
        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات الحجز بنجاح",
        });
        setBookings(prev => prev.map(b => b._id === editingBooking._id ? response.booking : b));
        setIsEditBookingOpen(false);
        setEditingBooking(null);
      }
    } catch (error: any) {
      console.error("Error updating booking:", error);
      toast({
        title: "خطأ",
        description: error.response?.data?.error || "فشل تحديث الحجز",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingBooking(false);
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setEditPostData({
      title: post.title,
      description: post.description || "",
    });
    setIsEditPostOpen(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    try {
      setIsUpdatingPost(true);
      const token = await getToken();
      await updateTrip(editingPost._id || editingPost.id, {
        ...editingPost,
        title: editPostData.title,
        description: editPostData.description,
      }, token || undefined);

      toast({ title: "تم التحديث", description: "تم تحديث المنشور بنجاح" });
      
      // Update local state
      const targetId = editingPost._id || editingPost.id;
      const updateList = (list: any[]) => list.map(p => (p._id === targetId || p.id === targetId) ? { ...p, title: editPostData.title, description: editPostData.description } : p);
      setUserTrips(updateList(userTrips));
      setSavedTrips(updateList(savedTrips));
      setLovedTrips(updateList(lovedTrips));
      setAiTrips(updateList(aiTrips)); // Also update AI trips if relevant
      
      // Notify other components (like Timeline) that a trip was updated
      window.dispatchEvent(new CustomEvent('tripUpdated', { detail: { id: targetId, ...editPostData } }));
      
      setIsEditPostOpen(false);
      setEditingPost(null);
    } catch (error: any) {
      console.error("Error updating post:", error);
      toast({ title: "خطأ", description: error.message || "فشل تحديث المنشور", variant: "destructive" });
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنشور؟")) return;
    try {
      setIsDeletingPost(true);
      const token = await getToken();
      await deleteTrip(postId, token || undefined);
      
      toast({ title: "تم الحذف", description: "تم حذف المنشور بنجاح" });
      
      // Update local state
      const filterList = (list: any[]) => list.filter(p => (p._id !== postId && p.id !== postId));
      setUserTrips(filterList(userTrips));
      setSavedTrips(filterList(savedTrips));
      setLovedTrips(filterList(lovedTrips));
      setStats(prev => ({ ...prev, trips: prev.trips - 1 }));
      
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({ title: "خطأ", description: error.message || "فشل حذف المنشور", variant: "destructive" });
    } finally {
      setIsDeletingPost(false);
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

  const handleStartMessage = async () => {
    if (!id || !isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لبدء محادثة",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;
      
      const conversation = await startDirectChat(id, token);
      navigate(`/messages?conv=${conversation._id}`);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل بدء المحادثة",
        variant: "destructive",
      });
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

  const getUserBadgeData = () => {
    // Activity score logic (matching backend)
    const activityScore =
      stats.trips * 20 +    
      stats.stories * 5 +   
      stats.likes * 2 +     
      stats.followers * 5 + 
      stats.following * 1;  

    const tiers: { level: BadgeTier; min: number; nextLabel?: string }[] = [
      { level: "legend", min: 2000 },
      { level: "diamond", min: 800, nextLabel: "الأسطوري" },
      { level: "gold", min: 350, nextLabel: "النخبة" },
      { level: "silver", min: 100, nextLabel: "الخبير" },
      { level: "bronze", min: 30, nextLabel: "المتمرس" },
      { level: "none", min: 0, nextLabel: "الناشئ" },
    ];

    const currentTierIndex = tiers.findIndex(t => activityScore >= t.min);
    const currentTier = tiers[currentTierIndex];
    const nextTier = currentTierIndex > 0 ? tiers[currentTierIndex - 1] : null;

    let progress = 0;
    let progressionInfo = undefined;

    if (nextTier) {
      const range = nextTier.min - currentTier.min;
      const progressInRange = activityScore - currentTier.min;
      progress = Math.min(Math.floor((progressInRange / range) * 100), 100);
      
      const pointsLeft = nextTier.min - activityScore;
      progressionInfo = {
        pointsNeeded: pointsLeft,
        tripsNeeded: Math.ceil(pointsLeft / 20),
        storiesNeeded: Math.ceil(pointsLeft / 5),
        nextTierLabel: nextTier.nextLabel || ""
      };
    } else if (currentTier.level === 'legend') {
      progress = 100;
    }

    return {
      tier: currentTier.level,
      score: activityScore,
      nextTier: nextTier,
      progress: progress,
      progression: progressionInfo
    };
  };

  const userBadgeData = getUserBadgeData();

  const normalizeCity = (name: string) => {
    if (!name) return 'unknown';
    let n = name.toLowerCase().trim();
    if (n.includes('alex')) return 'alexandria';
    if (n.includes('cairo') || n.includes('qahira')) return 'cairo';
    if (n.includes('luxor')) return 'luxor';
    if (n.includes('aswan')) return 'aswan';
    if (n.includes('sharm')) return 'sharm el sheikh';
    if (n.includes('dahab')) return 'dahab';
    if (n.includes('ghurghada') || n.includes('hurghada')) return 'hurghada';
    if (n.includes('matrouh') || n.includes('matro')) return 'mersa matrouh';
    return n;
  };

  const uniqueCitiesCount = new Set(userTrips.map(t => normalizeCity(t.destination || t.city || '')).filter(c => c !== 'unknown')).size;

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
                          {isOwnProfile && (
                            <label htmlFor="profile-upload" className="absolute bottom-2 right-2 p-3 bg-indigo-600 rounded-full text-white shadow-xl cursor-pointer hover:bg-orange-600 transition-all z-20 group">
                               <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                               <input id="profile-upload" type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                            </label>
                          )}
                       </div>

                       {/* User Identity */}
                       <div className="space-y-3 mb-6 text-center w-full">
                          <div className="flex items-center justify-center gap-2 group relative">
                             {isOwnProfile && editingField === 'fullName' ? (
                               <Input 
                                 autoFocus 
                                 value={fullName} 
                                 onChange={e => setFullName(e.target.value)}
                                 onBlur={() => handleUpdateField('fullName', fullName)}
                                 onKeyDown={e => e.key === 'Enter' && handleUpdateField('fullName', fullName)}
                                 className="text-center text-3xl font-black bg-transparent border-b-2 border-indigo-200 rounded-none h-auto py-1 focus:ring-0"
                               />
                             ) : (
                               <>
                                 <h1 className="text-3xl font-black text-gray-900">{fullName || "بدون اسم"}</h1>
                                 {isOwnProfile && (
                                   <button onClick={() => setEditingField('fullName')} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 transition-all">
                                     <Edit2 className="w-4 h-4" />
                                   </button>
                                 )}
                               </>
                             )}
                              <PassportBadge 
                                count={uniqueCitiesCount} 
                                points={userBadgeData.score} 
                              />
                          </div>
                          
                          <div className="flex items-center justify-center gap-1.5 group relative">
                             {isOwnProfile && editingField === 'location' ? (
                               <Input 
                                 autoFocus 
                                 value={location} 
                                 onChange={e => setLocation(e.target.value)}
                                 onBlur={() => handleUpdateField('location', location)}
                                 onKeyDown={e => e.key === 'Enter' && handleUpdateField('location', location)}
                                 className="text-center text-sm font-bold bg-transparent border-b border-orange-200 rounded-none h-auto py-1 focus:ring-0 max-w-[200px]"
                               />
                             ) : (
                               <div className="flex items-center gap-1.5 text-orange-600 font-bold text-sm bg-orange-50 px-3 py-1 rounded-full mx-auto w-fit">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {location || "رحالة جائل"}
                                  {isOwnProfile && (
                                    <button onClick={() => setEditingField('location')} className="opacity-0 group-hover:opacity-100 mr-1 text-orange-400 hover:text-orange-600 transition-all">
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                               </div>
                             )}
                           </div>

                           {/* Passport Summary instead of Badge Progress */}
                           <div className="w-full max-w-[220px] mx-auto space-y-2 py-4 border-t border-gray-50/50 mt-4">
                               <div className="flex flex-col items-center gap-1">
                                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 mb-2">
                                     <Globe className="w-8 h-8 animate-spin-slow" />
                                  </div>
                                  <span className="text-sm font-black text-gray-900">سجل الاستكشاف الرقمي</span>
                                  <p className="text-[10px] text-gray-400 font-bold">تم جمع {uniqueCitiesCount} أختام رسمية</p>
                               </div>
                           </div>
                       </div>

                       {/* Bio Section */}
                       <div className="w-full text-center group relative mb-8">
                          {isOwnProfile && editingField === 'bio' ? (
                            <Textarea 
                              autoFocus 
                              value={bio} 
                              onChange={e => setBio(e.target.value)}
                              onBlur={() => handleUpdateField('bio', bio)}
                              className="text-center text-gray-500 bg-transparent border-2 border-indigo-100 rounded-2xl min-h-[100px] focus:ring-0 resize-none w-full"
                            />
                          ) : (
                            <div className="relative inline-block w-full">
                              <p className="text-gray-500 leading-relaxed font-light italic px-4">
                                 "{bio || "لا يوجد وصف حالياً.. هذا الرحالة مشغول باستكشاف العالم."}"
                              </p>
                              {isOwnProfile && (
                                <button onClick={() => setEditingField('bio')} className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white shadow-md rounded-full p-1.5 text-indigo-600 hover:scale-110 transition-all">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                       </div>

                       {/* Action Buttons */}
                       <div className="w-full space-y-3">
                          {isOwnProfile ? (
                             <div className="grid grid-cols-1 gap-3 w-full">
                                <Button onClick={() => setIsStoryDialogOpen(true)} className="h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold gap-2 shadow-lg shadow-orange-200">
                                   <Sparkles className="w-5 h-5" />
                                   نشر قصة (Story)
                                </Button>
                                <Button onClick={handleSignOut} variant="outline" className="h-12 rounded-2xl border-red-50 text-red-500 hover:bg-red-50 font-bold gap-2">
                                   <LogOut className="w-4 h-4" />
                                   خروج
                                </Button>
                             </div>
                          ) : (
                             <div className="grid grid-cols-2 gap-3 w-full">
                                <Button 
                                  onClick={handleToggleFollow} 
                                  disabled={isFollowLoading}
                                  className={cn(
                                    "h-14 rounded-2xl text-lg font-black gap-3 transition-all",
                                    isFollowingUser ? "bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100"
                                  )}
                                >
                                   <Users className="w-6 h-6" />
                                   {isFollowingUser ? "متابَع" : "متابعة"}
                                </Button>
                                <Button 
                                  onClick={handleStartMessage}
                                  variant="outline"
                                  className="h-14 rounded-2xl text-lg font-black gap-3 border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                                >
                                   <MessageCircle className="w-6 h-6" />
                                   مراسلة
                                </Button>
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
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                       <TabsList className="w-full justify-start gap-4 bg-transparent p-4 h-auto border-b border-gray-50 flex-wrap">
                          {[
                            { id: "trips", label: "الرحلات العامة", icon: <LayoutGrid className="w-4 h-4" /> },
                            { id: "stories", label: "قصصي", icon: <ImageIcon className="w-4 h-4" />, hide: !isOwnProfile },
                            { id: "ai-trips", label: "مساعد الرحلات الذكى ", icon: <Sparkles className="w-4 h-4" />, hide: !isOwnProfile },
                            { id: "bookings", label: "حجوزاتي", icon: <Calendar className="w-4 h-4" />, hide: !isOwnProfile },
                            { id: "saved", label: "المحفوظات", icon: <Bookmark className="w-4 h-4" /> },
                            { id: "liked", label: "الإعجابات", icon: <Heart className="w-4 h-4" /> },
                            { id: "passport", label: "الـبـاسـبـور", icon: <Globe className="w-4 h-4" /> },
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

                       {["trips", "ai-trips", "stories", "saved", "liked", "bookings", "passport"].map(tabId => (
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
        {isEditBookingOpen && editingBooking && (
          <Dialog open={isEditBookingOpen} onOpenChange={setIsEditBookingOpen}>
            <DialogContent className="max-w-2xl font-cairo rounded-[2rem] overflow-hidden p-0 border-0 shadow-2xl" dir="rtl">
                <div className="bg-indigo-600 p-8 text-white relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                   <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                      <Edit2 className="w-8 h-8" />
                      تعديل بيانات الحجز
                   </h2>
                   <p className="text-indigo-100 font-medium">يمكنك تحديث معلوماتك أو اختيار مقاعد مختلفة.</p>
                </div>

                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-sm font-black text-gray-700">الاسم الأول</Label>
                         <Input 
                           value={editBookingData.firstName} 
                           onChange={e => setEditBookingData({...editBookingData, firstName: e.target.value})}
                           className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                         />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-sm font-black text-gray-700">اسم العائلة</Label>
                         <Input 
                           value={editBookingData.lastName} 
                           onChange={e => setEditBookingData({...editBookingData, lastName: e.target.value})}
                           className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-sm font-black text-gray-700">رقم الهاتف</Label>
                         <Input 
                           value={editBookingData.userPhone} 
                           onChange={e => setEditBookingData({...editBookingData, userPhone: e.target.value})}
                           className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                         />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-sm font-black text-gray-700">عدد الأفراد</Label>
                         <Input 
                           type="number"
                           min={1}
                           value={editBookingData.numberOfPeople} 
                           onChange={e => setEditBookingData({...editBookingData, numberOfPeople: parseInt(e.target.value) || 1})}
                           className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                         />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <Label className="text-sm font-black text-gray-700 flex items-center justify-between">
                         <span>تعديل المقاعد</span>
                         <UI_Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100">
                             {editBookingData.selectedSeats.length} / {editBookingData.numberOfPeople} مقاعد مختارة
                         </UI_Badge>
                      </Label>
                      <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center">
                         <BusSeatLayout 
                           type={(editingBooking.transportationType as any) || 'bus-48'}
                           bookedSeats={[]} 
                           onSelectSeats={(seats) => setEditBookingData({...editBookingData, selectedSeats: seats})}
                           initialSelectedSeats={editBookingData.selectedSeats}
                           maxSelection={editBookingData.numberOfPeople}
                           isAdmin={false}
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-sm font-black text-gray-700">طلبات خاصة</Label>
                      <Textarea 
                        value={editBookingData.specialRequests} 
                        onChange={e => setEditBookingData({...editBookingData, specialRequests: e.target.value})}
                        className="rounded-xl border-gray-100 min-h-[100px] bg-gray-50/50"
                      />
                   </div>
                </div>

                <div className="p-8 pt-0 flex gap-4 mt-6">
                   <Button 
                     variant="outline" 
                     className="flex-1 h-14 rounded-2xl font-black border-gray-200"
                     onClick={() => setIsEditBookingOpen(false)}
                   >
                     إلغاء
                   </Button>
                   <Button 
                     disabled={isUpdatingBooking}
                     onClick={handleUpdateBooking}
                     className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100"
                   >
                     {isUpdatingBooking ? "جاري الحافظ..." : "حفظ التعديلات"}
                   </Button>
                </div>
            </DialogContent>
          </Dialog>
        )}
        <Dialog open={!!selectedBookingDetails} onOpenChange={(open) => !open && setSelectedBookingDetails(null)}>
          <DialogContent className="max-w-lg font-cairo rounded-[2rem] overflow-hidden p-0 border-0 shadow-2xl" dir="rtl">
            {selectedBookingDetails && (
              <>
                <div className="bg-indigo-600 p-6 text-white">
                  <h2 className="text-2xl font-black mb-1 flex items-center gap-3">
                    <Info className="w-7 h-7" />
                    تفاصيل الحجز
                  </h2>
                  <p className="text-indigo-100 text-sm">المرجع: {selectedBookingDetails.bookingReference}</p>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">الرحلة</p>
                      <p className="font-black text-gray-900">{selectedBookingDetails.tripTitle}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">الوجهة</p>
                      <p className="font-black text-gray-900">{selectedBookingDetails.tripDestination}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">الشركة</p>
                      <p className="font-black text-gray-900">{selectedBookingDetails.companyName}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">الحالة</p>
                      <p className={cn(
                        "font-black",
                        selectedBookingDetails.status === 'accepted' ? "text-emerald-600" :
                        selectedBookingDetails.status === 'pending' ? "text-amber-600" :
                        selectedBookingDetails.status === 'rejected' ? "text-red-600" : "text-gray-600"
                      )}>
                        {selectedBookingDetails.status === 'pending' ? 'جاري المراجعة' :
                         selectedBookingDetails.status === 'accepted' ? 'تم القبول' :
                         selectedBookingDetails.status === 'rejected' ? 'تم الرفض' : 'ملغي'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">الاسم</p>
                      <p className="font-black text-gray-900">{selectedBookingDetails.userName}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">الهاتف</p>
                      <p className="font-black text-gray-900" dir="ltr">{selectedBookingDetails.userPhone}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">البريد</p>
                      <p className="font-black text-gray-900 text-sm truncate" dir="ltr">{selectedBookingDetails.userEmail}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">عدد الأفراد</p>
                      <p className="font-black text-gray-900">{selectedBookingDetails.numberOfPeople}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedBookingDetails.status !== "cancelled" && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">المبلغ الإجمالي</p>
                        <p className="text-xl font-black text-emerald-700">{selectedBookingDetails.totalPrice} ج.م</p>
                      </div>
                    )}
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">تاريخ الحجز</p>
                      <p className="font-black text-gray-900">{new Date(selectedBookingDetails.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'long' })}</p>
                    </div>
                  </div>
                  {selectedBookingDetails.status !== "cancelled" && (selectedBookingDetails.selectedSeats?.length || selectedBookingDetails.seatNumber) && (
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">المقاعد</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedBookingDetails.selectedSeats?.map(s => (
                          <UI_Badge key={s} className="bg-indigo-600 text-white">{s}</UI_Badge>
                        ))}
                        {selectedBookingDetails.seatNumber && !selectedBookingDetails.selectedSeats?.length && (
                          <UI_Badge className="bg-indigo-600 text-white">{selectedBookingDetails.seatNumber}</UI_Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedBookingDetails.status === "cancelled" && (selectedBookingDetails.cancellationReason || selectedBookingDetails.rejectionReason) && (
                    <div className="p-3 rounded-xl bg-gray-100 border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-600 uppercase mb-0.5">سبب الإلغاء</p>
                      <p className="font-medium text-gray-700">{selectedBookingDetails.cancellationReason || selectedBookingDetails.rejectionReason}</p>
                    </div>
                  )}
                  {selectedBookingDetails.specialRequests && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">طلبات خاصة</p>
                      <p className="font-medium text-gray-700">{selectedBookingDetails.specialRequests}</p>
                    </div>
                  )}
                  {selectedBookingDetails.status === 'rejected' && selectedBookingDetails.rejectionReason && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                      <p className="text-[10px] font-bold text-red-600 uppercase mb-0.5">سبب الرفض</p>
                      <p className="font-medium text-red-700">{selectedBookingDetails.rejectionReason}</p>
                    </div>
                  )}
                  {selectedBookingDetails.status === "accepted" && (
                    <div className="p-4 rounded-xl bg-white border-2 border-indigo-100 flex flex-col items-center gap-3">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase">رمز الرحلة — اعرضه عند الصعود للحافلة</p>
                      <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}/verify-booking/${selectedBookingDetails.bookingReference}`)}`}
                          alt="QR للحجز"
                          className="w-40 h-40 rounded-lg"
                        />
                      </div>
                      <p className="text-xs font-bold text-gray-500">المرجع: {selectedBookingDetails.bookingReference}</p>
                    </div>
                  )}
                </div>
                <div className="p-6 pt-0 flex gap-3">
                  {selectedBookingDetails.status !== "cancelled" && (
                    <Button
                      variant="destructive"
                      className="flex-1 h-12 rounded-xl font-black"
                      onClick={() => setCancelConfirmBookingId(selectedBookingDetails._id)}
                    >
                      إلغاء الحجز
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className={selectedBookingDetails.status !== "cancelled" ? "flex-1" : "w-full"}
                    style={{ height: "3rem" }}
                    onClick={() => setSelectedBookingDetails(null)}
                  >
                    إغلاق
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        <AlertDialog open={!!cancelConfirmBookingId} onOpenChange={(open) => !open && setCancelConfirmBookingId(null)}>
          <AlertDialogContent className="font-cairo" dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد إلغاء الحجز</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم إلغاء الحجز وإبلاغ الشركة. هل أنت متأكد؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel>تراجع</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelBooking}
                disabled={isCancellingBooking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isCancellingBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : "نعم، إلغاء الحجز"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Post Dialog */}
        <Dialog open={isEditPostOpen} onOpenChange={setIsEditPostOpen}>
          <DialogContent className="max-w-xl font-cairo rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-right">تعديل المنشور</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4 text-right">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>العنوان</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl">
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden mb-2" side="top" align="end">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => setEditPostData(prev => ({ ...prev, title: prev.title + emojiData.emoji }))}
                        theme={Theme.LIGHT}
                        autoFocusSearch={false}
                        width={320}
                        height={400}
                        searchPlaceholder="بحث عن رمز..."
                        previewConfig={{ showPreview: false }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Input 
                  value={editPostData.title} 
                  onChange={e => setEditPostData({...editPostData, title: e.target.value})}
                  className="rounded-2xl border-gray-100 h-12 font-bold"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>الوصف / التفاصيل</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl">
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden mb-2" side="top" align="end">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => setEditPostData(prev => ({ ...prev, description: prev.description + emojiData.emoji }))}
                        theme={Theme.LIGHT}
                        autoFocusSearch={false}
                        width={320}
                        height={400}
                        searchPlaceholder="بحث عن رمز..."
                        previewConfig={{ showPreview: false }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Textarea 
                  value={editPostData.description} 
                  onChange={e => setEditPostData({...editPostData, description: e.target.value})}
                  className="rounded-2xl border-gray-100 min-h-[150px] font-medium"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsEditPostOpen(false)} className="flex-1 h-12 rounded-2xl">إلغاء</Button>
                <Button onClick={handleUpdatePost} disabled={isUpdatingPost} className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black">
                  {isUpdatingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التعديلات"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );

  function renderTabContent(tabId: string) {
    const loading = tabId === 'trips' ? isLoadingTrips : tabId === 'saved' ? isLoadingSaved : tabId === 'liked' ? isLoadingLoved : tabId === 'stories' ? isLoadingMyStories : tabId === 'bookings' ? isLoadingBookings : tabId === 'passport' ? false : isLoadingAITrips;
    const data = tabId === 'trips' ? userTrips : tabId === 'saved' ? savedTrips : tabId === 'liked' ? lovedTrips : tabId === 'stories' ? myStories : tabId === 'bookings' ? bookings : tabId === 'passport' ? [1] : aiTrips;

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

    if (tabId === 'bookings') {
      return (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <UI_Badge variant="outline" className="rounded-full bg-indigo-50 text-indigo-600 border-indigo-100 font-bold">
                       {booking.bookingReference} #
                    </UI_Badge>
                    
                    {booking.selectedSeats && booking.selectedSeats.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {booking.selectedSeats.map(s => (
                          <UI_Badge key={s} className="rounded-full bg-indigo-600 text-white border-0 font-black px-2 py-0.5 text-[10px]">
                             مقعد: {s}
                          </UI_Badge>
                        ))}
                      </div>
                    ) : booking.seatNumber && (
                      <UI_Badge className="rounded-full bg-emerald-600 text-white border-0 font-black px-3 py-0.5 text-[10px]">
                         مقعد: {booking.seatNumber}
                      </UI_Badge>
                    )}

                    <div className="h-4 w-[1px] bg-gray-200 mx-1" />
                    <span className="text-gray-400 text-xs font-medium">{new Date(booking.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h4 className="text-xl font-black text-gray-900">{booking.tripTitle}</h4>
                    <p className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      باسم: {booking.userName}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      {booking.tripDestination}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500" />
                      {booking.numberOfPeople} أشخاص
                    </div>
                    <div className="flex items-center gap-1.5">
                       <Building2 className="w-4 h-4 text-purple-500" />
                       {booking.companyName}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-3 min-w-[200px]">
                   <div className="text-2xl font-black text-emerald-600">
                      {booking.totalPrice} <span className="text-sm">ج.م</span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2",
                        booking.status === 'pending' ? "bg-amber-50 text-amber-600" :
                        booking.status === 'accepted' ? "bg-emerald-50 text-emerald-600" :
                        booking.status === 'rejected' ? "bg-red-50 text-red-600" :
                        "bg-gray-50 text-gray-600"
                      )}>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          booking.status === 'pending' ? "bg-amber-400 animate-pulse" :
                          booking.status === 'accepted' ? "bg-emerald-400" :
                          booking.status === 'rejected' ? "bg-red-400" :
                          "bg-gray-400"
                        )} />
                        {booking.status === 'pending' ? 'جاري المراجعة' :
                          booking.status === 'accepted' ? 'تم القبول' :
                          booking.status === 'rejected' ? 'تم الرفض' : 'ملغي'}
                      </div>

                      {/* Accepted: show QR thumbnail */}
                      {booking.status === 'accepted' && (
                        <button
                          type="button"
                          onClick={() => setSelectedBookingDetails(booking)}
                          className="flex flex-col items-center gap-0.5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-1.5 hover:bg-emerald-50"
                          title="عرض رمز الرحلة (QR)"
                        >
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=56x56&data=${encodeURIComponent(booking.bookingReference)}`}
                            alt="QR"
                            className="w-9 h-9 rounded"
                          />
                          <span className="text-[9px] font-bold text-emerald-700">QR</span>
                        </button>
                      )}
                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setSelectedBookingDetails(booking)}
                          className="h-8 w-8 rounded-full text-indigo-600 hover:bg-indigo-50"
                          title="تفاصيل الحجز"
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                        {booking.status === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditBooking(booking)}
                            className="h-8 w-8 rounded-full text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        {['pending', 'accepted'].includes(booking.status) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setCancelConfirmBookingId(booking._id)}
                            className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                   </div>

                   {booking.status === 'rejected' && booking.rejectionReason && (
                      <p className="text-[10px] text-red-400 font-bold max-w-[200px] text-right">
                         السبب: {booking.rejectionReason}
                      </p>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (tabId === 'passport') {
      const normalizeCity = (name: string) => {
        if (!name) return 'unknown';
        let n = name.toLowerCase().trim();
        // Common Egyptian city variations
        if (n.includes('alex')) return 'alexandria';
        if (n.includes('cairo') || n.includes('qahira')) return 'cairo';
        if (n.includes('luxor')) return 'luxor';
        if (n.includes('aswan')) return 'aswan';
        if (n.includes('sharm')) return 'sharm el sheikh';
        if (n.includes('dahab')) return 'dahab';
        if (n.includes('ghurghada') || n.includes('hurghada')) return 'hurghada';
        if (n.includes('matrouh') || n.includes('matro')) return 'mersa matrouh';
        return n;
      };

      // Filter for unique cities only
      const uniqueCities = new Map();
      userTrips.forEach((trip: any) => {
        const cityValue = trip.destination || trip.city || '';
        const norm = normalizeCity(cityValue);
        if (!uniqueCities.has(norm)) {
          uniqueCities.set(norm, trip);
        }
      });

      const realStamps: Stamp[] = Array.from(uniqueCities.values()).map((trip: any, idx: number) => {
        const city = trip.destination || trip.city || 'وجهة غير محددة';
        return {
          id: trip._id || String(idx),
          city: city,
          date: trip.startDate ? new Date(trip.startDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }) : 'تاريخ غير معروف',
          points: 150 + (idx * 50),
          rarity: idx % 4 === 0 ? 'limited' : idx % 3 === 0 ? 'rare' : 'common',
          image: trip.image || 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a',
          season: trip.season || (idx % 2 === 0 ? 'Winter' : 'Summer')
        };
      });

      return <DigitalPassport stamps={realStamps} userName={fullName || "الرحالة"} />;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {data.map((trip: any) => (
          <TripCard 
            key={trip._id || trip.id} 
            {...trip} 
            id={trip._id || trip.id} 
            authorImage={profileImage || trip.authorImage}
            onEdit={isOwnProfile && trip.postType === 'ask' ? (id) => handleEditPost(trip) : undefined}
            onDelete={isOwnProfile && trip.postType === 'ask' ? (id) => handleDeletePost(trip._id || trip.id) : undefined}
          />
        ))}
      </div>
    );
  }
};

export default UserProfile;
