import { useState } from "react";
import { Heart, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Comment } from "@/lib/trips-data";

interface TripCommentsProps {
  comments: Comment[];
}

const TripComments = ({ comments }: TripCommentsProps) => {
  const [commentsList, setCommentsList] = useState(comments);
  const [newComment, setNewComment] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `c${Date.now()}`,
      author: "أنت",
      content: newComment,
      date: "الآن",
      likes: 0
    };

    setCommentsList([comment, ...commentsList]);
    setNewComment("");
  };

  const handleLikeComment = (commentId: string) => {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    setCommentsList(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? { ...comment, likes: likedComments.has(commentId) ? comment.likes - 1 : comment.likes + 1 }
          : comment
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>التعليقات ({commentsList.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment */}
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
            disabled={!newComment.trim()}
            className="w-full sm:w-auto"
          >
            <Send className="h-4 w-4 ml-2" />
            إضافة تعليق
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {commentsList.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-4 p-4 rounded-xl bg-secondary-light hover:bg-secondary-light/80 transition-colors"
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
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
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLikeComment(comment.id)}
                  className={`gap-2 ${likedComments.has(comment.id) ? 'text-primary' : ''}`}
                >
                  <Heart
                    className={`h-4 w-4 ${likedComments.has(comment.id) ? 'fill-primary' : ''}`}
                  />
                  {comment.likes > 0 && <span>{comment.likes}</span>}
                </Button>
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
