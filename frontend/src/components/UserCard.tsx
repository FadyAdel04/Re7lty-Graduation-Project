import { MapPin, UserPlus, UserCheck } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toggleFollowUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface UserCardProps {
  user: {
    clerkId: string;
    fullName: string;
    username: string;
    imageUrl: string;
    bio?: string;
    location?: string;
    followers?: number;
    tripsCount?: number;
  };
  isFollowing?: boolean;
  onFollowToggle?: (newStatus: boolean) => void;
}

const UserCard = ({ user, isFollowing: initialIsFollowing = false }: UserCardProps) => {
  const { getToken, userId } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if wrapped in link
    e.stopPropagation();
    
    if (!userId) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب عليك تسجيل الدخول لمتابعة المستخدمين",
        variant: "destructive",
      });
      return;
    }

    if (userId === user.clerkId) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token");
      
      const res = await toggleFollowUser(user.clerkId, token);
      setIsFollowing(res.following);
      if (onFollowToggle) onFollowToggle(res.following);
      toast({
        title: res.following ? "تمت المتابعة" : "تم إلغاء المتابعة",
        description: res.following 
          ? `أنت الآن تتابع ${user.fullName || user.username}`
          : `لغيت متابعة ${user.fullName || user.username}`,
      });
    } catch (err) {
      console.error("Follow error:", err);
      toast({
        title: "خطأ",
        description: "فشل تحديث حالة المتابعة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 text-right group flex flex-col h-full relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-l from-orange-50 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-orange-100 flex-shrink-0 overflow-hidden ring-4 ring-white shadow-sm group-hover:scale-105 transition-transform duration-300">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-orange-600 font-bold text-xl bg-orange-50">
                {(user.fullName || user.username)?.[0] || "U"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-orange-600 transition-colors">
              {user.fullName || user.username}
            </h3>
            {user.username && (
              <p className="text-sm text-gray-500 truncate" dir="ltr">@{user.username}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 relative z-10">
        {user.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {user.bio}
          </p>
        )}
        
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
          {user.location && (
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
              <MapPin className="h-3 w-3 text-orange-400" />
              <span className="truncate max-w-[100px]">{user.location}</span>
            </div>
          )}
          {typeof user.tripsCount === 'number' && (
            <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
              {user.tripsCount} رحلات
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 relative z-10">
        <Button
          onClick={handleFollow}
          variant={isFollowing ? "secondary" : "default"}
          size="sm"
          className={`w-full ${
            isFollowing 
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
              : "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg"
          } transition-all duration-300`}
          disabled={isLoading || userId === user.clerkId}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          ) : isFollowing ? (
            <>
              <UserCheck className="h-4 w-4 ml-2" />
              تتابع
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 ml-2" />
              متابعة
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UserCard;
