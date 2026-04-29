import { useEffect, useState, useRef } from "react";
import { Heart, Send, Lock, Trash2, Loader2, MessageSquare, Smile, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Comment as TripComment } from "@/lib/trips-data";
import { SignedIn, SignedOut, SignInButton, useUser, useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { 
  addTripComment, 
  toggleTripCommentLove, 
  deleteTripComment, 
  searchUsers, 
  addTripCommentReply,
  addCorporateTripComment,
  addCorporateTripCommentReply,
  toggleCorporateTripCommentLove,
  deleteCorporateTripComment
} from "@/lib/api";
import { cn } from "@/lib/utils";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatFacebookDate } from "@/lib/dateUtils";

interface TripCommentsProps {
  tripId: string;
  initialComments: TripComment[];
  onCommentAdded?: (comment: TripComment) => void;
  onCommentUpdated?: (commentId: string, changes: Partial<TripComment>) => void;
  onCommentDeleted?: (commentId: string) => void;
  tripOwnerId?: string;
  isCorporate?: boolean;
}

const TripComments = ({
  tripId,
  initialComments,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  tripOwnerId,
  isCorporate = false,
}: TripCommentsProps) => {
  const { user } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const { toast } = useToast();
  const [commentsList, setCommentsList] = useState<TripComment[]>(initialComments || []);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Reply state
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCommentsList(initialComments || []);
  }, [initialComments, tripId]);

  // Handle mention search
  useEffect(() => {
    const search = async () => {
      if (mentionQuery && mentionQuery.length > 1) {
        try {
          const results = await searchUsers(mentionQuery);
          setMentionResults(results.slice(0, 5)); // Limit to 5 results
        } catch (err) {
          console.error("Failed to search users for mention", err);
        }
      } else {
        setMentionResults([]);
      }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [mentionQuery]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewComment(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const words = textBeforeCursor.split(/\s/); // Split by whitespace
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionQuery(lastWord.slice(1));
    } else {
      setShowMentions(false);
      setMentionQuery("");
    }
  };

  const insertMention = (username: string) => {
    if (!textareaRef.current) return;
    
    const cursor = textareaRef.current.selectionStart;
    const textBeforeCursor = newComment.slice(0, cursor);
    const textAfterCursor = newComment.slice(cursor);
    
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    const newTextBefore = textBeforeCursor.slice(0, lastAtPos);
    
    const newValue = `${newTextBefore}@${username} ${textAfterCursor}`;
    setNewComment(newValue);
    setShowMentions(false);
    setMentionQuery("");
    
    // Reset focus
    textareaRef.current.focus();
  };

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
      if (!token) throw new Error("يرجى إعادة تسجيل الدخول");

      const addedComment = isCorporate 
        ? await addCorporateTripComment(tripId, newComment.trim(), token)
        : await addTripComment(tripId, newComment.trim(), token);
      
      setCommentsList((prev) => [addedComment, ...prev]);
      if (onCommentAdded) onCommentAdded(addedComment);
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

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyContent.trim()) return;
    if (!isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول للرد على التعليقات",
        variant: "destructive",
      });
      return;
    }

    setIsReplying(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("يرجى إعادة تسجيل الدخول");

      const addedReply = isCorporate
        ? await addCorporateTripCommentReply(tripId, parentCommentId, replyContent.trim(), token)
        : await addTripCommentReply(tripId, parentCommentId, replyContent.trim(), token);
      
      setCommentsList((prev) =>
        prev.map((c) => {
          if (c.id === parentCommentId) {
            return {
              ...c,
              replies: [...(c.replies || []), addedReply],
            };
          }
          return c;
        })
      );

      setReplyContent("");
      setReplyToId(null);
      
      toast({
        title: "تم إضافة الرد",
        description: "تم نشر ردك بنجاح",
      });
    } catch (error: any) {
      console.error("Error adding reply:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر إضافة الرد",
        variant: "destructive",
      });
    } finally {
      setIsReplying(false);
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
      if (!token) throw new Error("يرجى إعادة تسجيل الدخول");

      const result = isCorporate
        ? await toggleCorporateTripCommentLove(tripId, commentId, token)
        : await toggleTripCommentLove(tripId, commentId, token);
      
      setCommentsList((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              likes: result.likes,
              viewerHasLiked: result.liked,
            };
          }
          return c;
        })
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

  const canDeleteComment = (comment: TripComment) => {
    if (!user) return false;
    if (comment.authorId && user.id === comment.authorId) return true;
    if (tripOwnerId && user.id === tripOwnerId) return true;
    return false;
  };

  // Helper to highlight mentions in comments
  const formatCommentContent = (content: string) => {
    // Regex for mentions: @username
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-indigo-600 font-bold">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Scrollable Comments Area */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 min-h-[300px]">
        {commentsList.length > 0 ? (
          commentsList.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <div
                className={cn(
                  "flex gap-3 group transition-all animate-in fade-in slide-in-from-bottom-2",
                  canDeleteComment(comment) ? "flex-row" : "flex-row"
                )}
              >
                <Avatar className="h-9 w-9 shrink-0 border-2 border-background shadow-sm">
                  {comment.authorAvatar && (
                    <AvatarImage src={comment.authorAvatar} alt={comment.author} />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold">
                    {comment.author.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-foreground">{comment.author}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{formatFacebookDate(comment.date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <SignedIn>
                        {canDeleteComment(comment) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-full"
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
                    <div className="inline-block px-4 py-2.5 rounded-2xl bg-muted/30 border border-border text-sm text-foreground/90 leading-relaxed max-w-[90%] whitespace-pre-wrap">
                      {formatCommentContent(comment.content)}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        disabled={pendingCommentId === comment.id}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all",
                          comment.viewerHasLiked 
                            ? "bg-rose-500/10 text-rose-500 shadow-sm" 
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Heart className={cn("h-3 w-3", comment.viewerHasLiked && "fill-current")} />
                        <span>{comment.likes > 0 ? comment.likes : "إعجاب"}</span>
                      </button>

                      <button
                        onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                        className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors"
                      >
                        رد
                      </button>
                    </div>
                  </div>

                  {/* Reply Input */}
                  {replyToId === comment.id && (
                    <div className="mt-3 space-y-2 animate-in slide-in-from-top-1">
                      <Textarea
                        placeholder={`الرد على ${comment.author}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[60px] text-xs rounded-xl bg-muted/30 border-border focus:bg-background transition-all resize-none p-3 text-foreground"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyToId(null);
                            setReplyContent("");
                          }}
                          className="h-7 text-[10px] font-bold text-muted-foreground"
                        >
                          إلغاء
                        </Button>
                        <Button
                          size="sm"
                          disabled={!replyContent.trim() || isReplying}
                          onClick={() => handleAddReply(comment.id)}
                          className="h-7 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] px-4 rounded-lg"
                        >
                          {isReplying ? <Loader2 className="h-3 w-3 animate-spin" /> : "نشر الرد"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Render Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4 mr-6 border-r-2 border-border pr-4">
                      {comment.replies.map((reply: any) => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar className="h-7 w-7 shrink-0 border-2 border-background shadow-sm">
                            {reply.authorAvatar && (
                              <AvatarImage src={reply.authorAvatar} alt={reply.author} />
                            )}
                            <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
                              {reply.author.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-foreground">{reply.author}</span>
                              <span className="text-[9px] text-muted-foreground font-medium">{formatFacebookDate(reply.date)}</span>
                            </div>
                            <div className="inline-block px-3 py-2 rounded-2xl bg-muted/20 text-xs text-foreground/80 max-w-[90%] whitespace-pre-wrap">
                              {formatCommentContent(reply.content)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary/30" />
            </div>
            <div>
              <p className="text-foreground font-black">لا توجد تعليقات بعد</p>
              <p className="text-sm text-muted-foreground">كن أول من يشارك رأيه في هذه الرحلة</p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Input Area */}
      <div className="mt-4 pt-4 border-t border-border relative">
        <SignedIn>
          <div className="relative">
            {showMentions && mentionResults.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 w-64 bg-card rounded-xl shadow-xl border border-border max-h-48 overflow-y-auto z-50">
                 <div className="p-2 space-y-1">
                   {mentionResults.map(u => (
                     <button
                       key={u._id}
                       onClick={() => insertMention(u.username)}
                       className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-right"
                     >
                       <Avatar className="h-6 w-6">
                         <AvatarImage src={u.imageUrl} />
                         <AvatarFallback>{u.username?.charAt(0)}</AvatarFallback>
                       </Avatar>
                       <div className="flex flex-col items-start">
                         <span className="text-sm font-bold text-foreground">{u.username}</span>
                         <span className="text-xs text-muted-foreground">{u.fullName}</span>
                       </div>
                     </button>
                   ))}
                 </div>
              </div>
            )}
            
            <Textarea
              ref={textareaRef}
              placeholder="اكتب تعليقك هنا... (استخدم @ لذكر شخص)"
              value={newComment}
              onChange={handleTextChange}
              className="min-h-[100px] w-full rounded-2xl bg-muted/30 border-border focus:bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all resize-none p-4 pr-4 pb-12 text-sm font-medium text-foreground"
            />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden mb-2" side="top" align="start">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => setNewComment(prev => prev + emojiData.emoji)}
                    theme={Theme.AUTO}
                    autoFocusSearch={false}
                    width={320}
                    height={400}
                    searchPlaceholder="بحث عن رمز..."
                    previewConfig={{ showPreview: false }}
                  />
                </PopoverContent>
              </Popover>

              <Button 
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
                className="h-9 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 shadow-lg shadow-primary/10 transition-all active:scale-95"
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
            <div className="absolute bottom-3 right-4 text-[10px] text-muted-foreground font-medium">
              {newComment.length} / 500
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="bg-primary/5 border border-primary/10 border-dashed rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-primary font-black mb-2">
              <Lock className="h-4 w-4" />
              <span>تسجيل الدخول مطلوب</span>
            </div>
            <p className="text-xs text-primary/70 mb-4 font-bold">يرجى تسجيل الدخول لتتمكن من إضافة تعليقك</p>
            <SignInButton mode="modal">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black px-8">
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
