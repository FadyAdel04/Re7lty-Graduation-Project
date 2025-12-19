import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getFollowingStories, StoryUserGroup, createStory } from "@/lib/api";
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
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
        const data = await getFollowingStories(token);
        if (isMounted && data?.users) {
          setGroups(data.users);
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
  }, [isSignedIn, getToken]);

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

      // In a real app, you would upload the file to a storage service first
      // For now, we'll use a placeholder URL
      const mediaUrl = URL.createObjectURL(selectedFile);
      const mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video';

      await createStory(
        {
          mediaUrl,
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
      const data = await getFollowingStories(token);
      if (data?.users) {
        setGroups(data.users);
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
          onClick={() => setShowCreateDialog(true)}
        >
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-primary via-secondary to-primary">
            <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
          </div>
          <span className="text-[11px] max-w-[80px] truncate">قصتك</span>
        </button>

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

