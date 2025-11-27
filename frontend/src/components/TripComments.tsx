import { useEffect, useState } from "react";
import { Heart, Send, Lock, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Comment } from "@/lib/trips-data";
import { SignedIn, SignedOut, SignInButton, useUser, useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { addTripComment, toggleTripCommentLove, deleteTripComment } from "@/lib/api";

interface TripCommentsProps {
  tripId: string;
  initialComments: Comment[];
  onCommentAdded?: (comment: Comment) => void;
  onCommentUpdated?: (commentId: string, changes: Partial<Comment>) => void;
  onCommentDeleted?: (commentId: string) => void;
  tripOwnerId?: string;
}

const TripComments = ({
  tripId,
  initialComments,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  tripOwnerId,
}: TripCommentsProps) => {
  const { user } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const { toast } = useToast();
  const [commentsList, setCommentsList] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    setCommentsList(initialComments || []);
  }, [initialComments, tripId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لإضافة تعليق",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }

      const added = await addTripComment(tripId, newComment.trim(), token);
      setCommentsList((prev) => [added, ...(prev || [])]);
      onCommentAdded?.(added);
      setNewComment("");
      
      toast({
        title: "تم إضافة التعليق",
        description: "تم نشر تعليقك بنجاح",
      });
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر إضافة التعليق",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول للإعجاب بالتعليقات",
        variant: "destructive",
      });
      return;
    }

    try {
      setPendingCommentId(commentId);
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }

      const result = await toggleTripCommentLove(tripId, commentId, token);
      setCommentsList((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, likes: result.likes, viewerHasLiked: result.liked }
            : comment
        )
      );
      onCommentUpdated?.(commentId, { likes: result.likes, viewerHasLiked: result.liked });
    } catch (error: any) {
      console.error("Error liking comment:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر تحديث الإعجاب",
        variant: "destructive",
      });
    } finally {
      setPendingCommentId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لحذف التعليقات",
        variant: "destructive",
      });
      return;
    }
    try {
      setDeletingCommentId(commentId);
      const token = await getToken();
      if (!token) {
        throw new Error("يرجى إعادة تسجيل الدخول");
      }
      await deleteTripComment(tripId, commentId, token);
      setCommentsList((prev) => prev.filter((comment) => comment.id !== commentId));
      onCommentDeleted?.(commentId);
      toast({
        title: "تم حذف التعليق",
      });
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر حذف التعليق",
        variant: "destructive",
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const canDeleteComment = (comment: Comment) => {
    if (!user) return false;
    if (comment.authorId && user.id === comment.authorId) return true;
    if (tripOwnerId && user.id === tripOwnerId) return true;
    return false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>التعليقات ({commentsList.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment */}
        <SignedIn>
          <div className="space-y-3">
            <Textarea
              placeholder="شارك رأيك أو تجربتك..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                "جاري الإرسال..."
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  إضافة تعليق
                </>
              )}
            </Button>
          </div>
        </SignedIn>
        
        <SignedOut>
          <div className="border border-dashed border-border rounded-xl p-6 text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold mb-2">تسجيل الدخول مطلوب</p>
              <p className="text-sm text-muted-foreground mb-4">
                سجل دخولك للمشاركة بتعليقاتك وآرائك
              </p>
              <SignInButton mode="modal">
                <Button>
                  تسجيل الدخول
                </Button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>

        {/* Comments List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {commentsList.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-4 p-4 rounded-xl bg-secondary-light hover:bg-secondary-light/80 transition-colors"
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                {comment.authorAvatar && (
                  <AvatarImage src={comment.authorAvatar} alt={comment.author} />
                )}
                <AvatarFallback className="bg-gradient-hero text-white font-bold">
                  {comment.author.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">{comment.author}</span>
                  <span className="text-sm text-muted-foreground">• {comment.date}</span>
                </div>
                <p className="text-foreground mb-3">{comment.content}</p>
                
                <div className="flex items-center gap-2">
                  <SignedIn>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeComment(comment.id)}
                      className={`gap-2 ${comment.viewerHasLiked ? 'text-primary' : ''}`}
                      disabled={pendingCommentId === comment.id}
                    >
                      <Heart
                        className={`h-4 w-4 ${comment.viewerHasLiked ? 'fill-primary' : ''}`}
                      />
                      {comment.likes > 0 && <span>{comment.likes}</span>}
                    </Button>
                    {canDeleteComment(comment) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                      >
                        {deletingCommentId === comment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </SignedIn>

                  <SignedOut>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        toast({
                          title: "تسجيل الدخول مطلوب",
                          description: "يجب تسجيل الدخول للإعجاب بالتعليقات",
                          variant: "destructive",
                        })
                      }
                    >
                      <Heart className="h-4 w-4" />
                      {comment.likes > 0 && <span>{comment.likes}</span>}
                    </Button>
                  </SignedOut>
                </div>
              </div>
            </div>
          ))}

          {commentsList.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>لا توجد تعليقات بعد. كن أول من يعلق!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TripComments;
