import { useEffect, useState } from "react";
import { Heart, Send, Lock, Trash2, Loader2, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Comment } from "@/lib/trips-data";
import { SignedIn, SignedOut, SignInButton, useUser, useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { addTripComment, toggleTripCommentLove, deleteTripComment } from "@/lib/api";
import { cn } from "@/lib/utils";

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
    
    if (!window.confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;

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
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Scrollable Comments Area */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 min-h-[300px]">
        {commentsList.length > 0 ? (
          commentsList.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "flex gap-3 group transition-all animate-in fade-in slide-in-from-bottom-2",
                canDeleteComment(comment) ? "flex-row" : "flex-row"
              )}
            >
              <Avatar className="h-9 w-9 shrink-0 border-2 border-white shadow-sm">
                {comment.authorAvatar && (
                  <AvatarImage src={comment.authorAvatar} alt={comment.author} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                  {comment.author.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900">{comment.author}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{comment.date}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <SignedIn>
                      {canDeleteComment(comment) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentId === comment.id}
                        >
                          {deletingCommentId === comment.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </SignedIn>
                  </div>
                </div>

                <div className="relative">
                  <div className="inline-block px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-100/50 text-sm text-gray-700 leading-relaxed max-w-[90%]">
                    {comment.content}
                  </div>
                  
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    disabled={pendingCommentId === comment.id}
                    className={cn(
                      "mt-1 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all",
                      comment.viewerHasLiked 
                        ? "bg-red-50 text-red-500 shadow-sm" 
                        : "text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    <Heart className={cn("h-3 w-3", comment.viewerHasLiked && "fill-current")} />
                    <span>{comment.likes > 0 ? comment.likes : "إعجاب"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-indigo-200" />
            </div>
            <div>
              <p className="text-gray-900 font-black">لا توجد تعليقات بعد</p>
              <p className="text-sm text-gray-400">كن أول من يشارك رأيه في هذه الرحلة</p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Input Area */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <SignedIn>
          <div className="relative">
            <Textarea
              placeholder="اكتب تعليقك هنا..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] w-full rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all resize-none p-4 pr-4 pb-12 text-sm font-medium"
            />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <Button 
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
                className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <span>نشر التعليق</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
            <div className="absolute bottom-3 right-4 text-[10px] text-gray-400 font-medium">
              {newComment.length} / 500
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="bg-orange-50/50 border border-orange-100 border-dashed rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-orange-600 font-black mb-2">
              <Lock className="h-4 w-4" />
              <span>تسجيل الدخول مطلوب</span>
            </div>
            <p className="text-xs text-orange-600/70 mb-4 font-bold">يرجى تسجيل الدخول لتتمكن من إضافة تعليقك</p>
            <SignInButton mode="modal">
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black px-8">
                تسجيل الدخول
              </Button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>
    </div>
  );
};

export default TripComments;
