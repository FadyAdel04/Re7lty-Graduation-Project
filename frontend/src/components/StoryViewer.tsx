import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StoryUserGroup, StoryItem, markStoryViewed, deleteStory } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

interface StoryViewerProps {
  group: StoryUserGroup | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryViewer({ group, isOpen, onClose }: StoryViewerProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const stories = group?.stories ?? [];
  const current: StoryItem | undefined = stories[index];

  useEffect(() => {
    // reset index when opening another user
    if (isOpen) {
      setIndex(0);
    }
  }, [group?.userId, isOpen]);

  useEffect(() => {
    // Mark current story as viewed when opened
    const markViewed = async () => {
      if (!current?._id) return;
      try {
        const token = await getToken();
        if (!token) return;
        await markStoryViewed(current._id, token);
      } catch (err) {
        console.error("Error marking story viewed:", err);
      }
    };
    if (isOpen && current) {
      void markViewed();
    }
  }, [current?._id, isOpen, getToken]);

  const hasPrev = index > 0;
  const hasNext = index < stories.length - 1;

  const goPrev = () => {
    if (hasPrev) setIndex((i) => i - 1);
  };

  const goNext = () => {
    if (hasNext) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!current?._id) return;
    if (!confirm("هل أنت متأكد من حذف هذه القصة؟")) return;

    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await deleteStory(current._id, token);
      
      // If there are other stories, navigate or close
      // Remove current from local list (visually) would be better but props are immutable
      // So we rely on parent refresh or just close for now
      // Actually, standard behavior: close immediately or show next.
      // Since we can't mutate props.group.stories, let's just close the viewer 
      // and maybe trigger a refresh if we could (but we can't easily here without callbacks).
      // Ideally onClose should trigger a refresh in parent.
      // For now, let's close.
      onClose();
      // To improve UX, we could try to go to next/prev locally if we copied stories to state.
    } catch (error) {
      console.error("Failed to delete story:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isMyStory = user && group?.userId === user.id;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-3 sm:p-4">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-base sm:text-lg">
            {group?.fullName || "قصة"}
          </DialogTitle>
          {isMyStory && (
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </DialogHeader>
        {current ? (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-black">
              {current.mediaType === "video" ? (
                <video
                  src={current.mediaUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[420px] object-contain"
                />
              ) : (
                <img
                  src={current.mediaUrl}
                  alt={current.caption || ""}
                  className="w-full max-h-[420px] object-cover"
                />
              )}
            </div>
            {current.caption && (
              <p className="text-sm text-muted-foreground">{current.caption}</p>
            )}
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={!hasPrev}>
                <ChevronRight className="h-4 w-4 ml-1" />
                السابق
              </Button>
              <Button variant="outline" size="sm" onClick={goNext}>
                {hasNext ? (
                  <>
                    التالي
                    <ChevronLeft className="h-4 w-4 mr-1" />
                  </>
                ) : (
                  "إغلاق"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد قصص لعرضها.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

