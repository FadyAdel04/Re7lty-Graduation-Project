import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, UserMinus, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FollowedTraveler {
  userId: string;
  fullName: string;
  imageUrl?: string;
  status?: string;
  tripCount: number;
  isFollowing: boolean;
}

interface RightSidebarProps {
  followedTravelers: FollowedTraveler[];
  onToggleFollow: (userId: string) => void;
  isLoading?: boolean;
}

const RightSidebar = ({ followedTravelers, onToggleFollow, isLoading }: RightSidebarProps) => {
  return (
    <aside className="space-y-6 text-right" dir="rtl">
      {/* Suggested Travelers */}
      <Card className="shadow-sm border-0 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
           <Compass className="h-5 w-5 text-indigo-500" />
           <CardTitle className="text-xl font-black">رحالة قد تهمك</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-12 w-12 rounded-2xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mr-auto" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mr-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : followedTravelers.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
              <p className="text-sm text-gray-400 font-bold">لا توجد اقتراحات حالياً</p>
              <Link to="/discover" className="text-orange-600 hover:underline text-xs mt-2 font-black inline-block">
                استكشف العالم
              </Link>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
              {followedTravelers.map((traveler) => (
                <div key={traveler.userId} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-indigo-50/50 transition-all group">
                  <Link to={`/user/${traveler.userId}`} className="flex-shrink-0">
                    <Avatar className="h-12 w-12 rounded-2xl border-2 border-white shadow-sm ring-1 ring-gray-100">
                      {traveler.imageUrl ? (
                        <AvatarImage src={traveler.imageUrl} alt={traveler.fullName} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold rounded-2xl">
                        {traveler.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/user/${traveler.userId}`} 
                      className="font-bold text-sm text-gray-900 hover:text-indigo-600 truncate block transition-colors"
                    >
                      {traveler.fullName}
                    </Link>
                    
                    <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                       {traveler.tripCount} رحلة استكشافية
                    </p>
                  </div>

                  <Button
                    variant={traveler.isFollowing ? "outline" : "default"}
                    size="sm"
                    className={cn(
                        "rounded-xl h-8 px-4 text-xs font-bold transition-all",
                        traveler.isFollowing ? "border-indigo-100 text-indigo-600 hover:bg-indigo-50" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                    )}
                    onClick={() => onToggleFollow(traveler.userId)}
                  >
                    {traveler.isFollowing ? 'إلغاء' : 'متابعة'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Discover More Link */}
          <div className="pt-4 border-t border-gray-50">
            <Link to="/discover">
              <Button variant="ghost" className="w-full gap-2 rounded-2xl h-11 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-bold" size="sm">
                <Compass className="h-4 w-4" />
                اكتشف المزيد من المسافرين
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
};

export default RightSidebar;
