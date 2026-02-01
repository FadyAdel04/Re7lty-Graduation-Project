import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getFollowingStories, getMyStories, StoryUserGroup, createStory, getUserById } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StoriesBarProps {
  onUserClick?: (user: StoryUserGroup) => void;
}

export function StoriesBar({ onUserClick }: StoriesBarProps) {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [groups, setGroups] = useState<StoryUserGroup[]>([]);
  const [myStories, setMyStories] = useState<StoryUserGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [dbUser, setDbUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!isSignedIn) return;
      setIsLoading(true);
      setHasError(false);
      try {
        const token = await getToken();
        if (!token) return;
        const [followingData, myData] = await Promise.all([
          getFollowingStories(token),
          getMyStories(token).catch(() => ({ items: [] }))
        ]);
        
        if (isMounted) {
          if (followingData?.users) {
            setGroups(followingData.users);
          }
          if (myData?.items && myData.items.length > 0 && user) {
            setMyStories({
              userId: user.id,
              fullName: user.fullName || "أنت",
              imageUrl: user.imageUrl,
              hasUnseen: false, // You always see your own stories? Or logic could be refined
              stories: myData.items
            });
          } else {
            setMyStories(null);
          }
        }
      } catch (err) {
        console.error("Error loading stories:", err);
        if (isMounted) setHasError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isSignedIn, getToken, user?.id]);

  const fetchDbUser = async () => {
    if (user?.id) {
      try {
        const userData = await getUserById(user.id);
        setDbUser(userData);
      } catch (error) {
        console.error("Error fetching user data for stories bar:", error);
      }
    }
  };

  useEffect(() => {
    fetchDbUser();
    window.addEventListener('userProfileUpdated', fetchDbUser);
    return () => window.removeEventListener('userProfileUpdated', fetchDbUser);
  }, [user?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is image or video
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "نوع ملف غير صالح",
          description: "يرجى اختيار صورة أو فيديو",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateStory = async () => {
    if (!selectedFile) {
      toast({
        title: "لم يتم اختيار ملف",
        description: "يرجى اختيار صورة أو فيديو",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("يرجى إعادة تسجيل الدخول");

      // Convert file to base64 for persistence
      const base64Media = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video';

      await createStory(
        {
          mediaUrl: base64Media,
          mediaType,
          caption: caption || undefined,
        },
        token
      );

      toast({
        title: "تم إنشاء القصة",
        description: "تم نشر قصتك بنجاح",
      });

      // Reset form
      setShowCreateDialog(false);
      setSelectedFile(null);
      setCaption("");
      
      // Reload stories
      const [followingData, myData] = await Promise.all([
        getFollowingStories(token),
        getMyStories(token)
      ]);
      
      if (followingData?.users) {
        setGroups(followingData.users);
      }
      if (myData?.items && user) {
        setMyStories({
          userId: user.id,
          fullName: user.fullName || "أنت",
          imageUrl: user.imageUrl,
          hasUnseen: false,
          stories: myData.items
        });
      }
    } catch (error: any) {
      console.error("Error creating story:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر إنشاء القصة",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!isSignedIn) return null;

  return (
    <div className="mb-4 sm:mb-6">
      <h2 className="text-sm font-semibold mb-2">قصص من الأشخاص الذين تتابعهم</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {/* Create Story Button */}
        <button
          type="button"
          className="flex flex-col items-center gap-1 focus:outline-none flex-shrink-0"
          onClick={() => {
            if (myStories) {
              onUserClick?.(myStories);
            } else {
              setShowCreateDialog(true);
            }
          }}
        >
          <div className={`p-[2px] rounded-full ${myStories ? 'bg-gradient-to-tr from-primary via-secondary to-primary' : 'bg-transparent'}`}>
            <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center relative overflow-hidden">
              {myStories ? (
                <Avatar className="h-full w-full">
                  <AvatarImage src={dbUser?.imageUrl || user?.imageUrl} alt="قصتك" />
                  <AvatarFallback>أنا</AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>
          </div>
          <span className="text-[11px] max-w-[80px] truncate">قصتك</span>
        </button>
        
        {/* If user has stories, show separate add button or rely on viewer to add more? 
            For simplicity: The "Your Story" circle opens viewer if stories exist. 
            If user wants to add MORE, they can do so from viewer or we provide a tiny plus badge.
            Let's add a tiny plus badge to the avatar if they already have stories to indicate "Add more" is possible 
            inside, or just keep it simple. 
            Actually, commonly "Your Story" opens the viewer, and inside viewer there's an "Add" button, 
            OR long press to add. 
            Let's stick to: Click -> View. If you want to add, maybe we add a small separate button 
            OR we add a "+" action in the viewer. 
            For now, let's allow adding via a separate small button if they already have stories, 
            OR just simple check: if used clicks the button we define behavior.
            
            Let's refine: 
            If myStories exists -> Click opens viewer.
            If myStories doesn't exist -> Click opens Create Dialog.
            
            But how to add MORE stories? 
            Let's add a small "+" button next to it if they have stories.
        */}
        
        {myStories && (
             <button
              type="button"
              className="flex flex-col items-center gap-1 focus:outline-none flex-shrink-0"
              onClick={() => setShowCreateDialog(true)}
            >
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                 <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-[11px]">جديد</span>
            </button>
        )}

        {isLoading && (
          <>
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-16 w-16 rounded-full" />
          </>
        )}
        {!isLoading && !groups.length && !hasError && (
          <p className="text-xs text-muted-foreground">لا توجد قصص متاحة الآن.</p>
        )}
        {!isLoading &&
          groups.map((user) => (
            <button
              key={user.userId}
              type="button"
              className="flex flex-col items-center gap-1 focus:outline-none flex-shrink-0"
              onClick={() => onUserClick?.(user)}
            >
              <div
                className={`p-[2px] rounded-full ${
                  user.hasUnseen
                    ? "bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500"
                    : "bg-muted"
                }`}
              >
                <Avatar className="h-14 w-14 border-2 border-background">
                  {user.imageUrl ? <AvatarImage src={user.imageUrl} alt={user.fullName} /> : null}
                  <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[11px] max-w-[80px] truncate">{user.fullName}</span>
            </button>
          ))}
        {hasError && (
          <p className="text-xs text-destructive">تعذر تحميل القصص حالياً.</p>
        )}
      </div>

      {/* Create Story Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>إنشاء قصة جديدة</DialogTitle>
            <DialogDescription>
              شارك لحظة من رحلتك مع متابعيك
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="story-file">اختر صورة أو فيديو</Label>
              <Input
                id="story-file"
                type="file"
                accept="image/*,video/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  تم اختيار: {selectedFile.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">تعليق (اختياري)</Label>
              <Input
                id="caption"
                placeholder="أضف تعليقاً على قصتك..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setSelectedFile(null);
                setCaption("");
              }}
              disabled={isCreating}
            >
              إلغاء
            </Button>
            <Button onClick={handleCreateStory} disabled={!selectedFile || isCreating}>
              {isCreating ? "جاري النشر..." : "نشر القصة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

