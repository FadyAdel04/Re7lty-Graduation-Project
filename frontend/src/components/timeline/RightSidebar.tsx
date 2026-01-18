import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, UserMinus, Compass } from "lucide-react";

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
    <aside className="space-y-4">
      {/* Suggested Travelers */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">أشخاص قد تعرفهم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : followedTravelers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">لا توجد اقتراحات حالياً</p>
              <Link to="/discover" className="text-primary hover:underline text-sm mt-2 inline-block">
                اكتشف المزيد
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {followedTravelers.map((traveler) => (
                <div key={traveler.userId} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Link to={`/user/${traveler.userId}`} className="flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      {traveler.imageUrl ? (
                        <AvatarImage src={traveler.imageUrl} alt={traveler.fullName} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-hero text-white">
                        {traveler.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/user/${traveler.userId}`} 
                      className="font-semibold text-sm hover:underline truncate block"
                    >
                      {traveler.fullName}
                    </Link>
                    
                    {traveler.status && (
                      <p className="text-xs text-muted-foreground truncate">
                        {traveler.status}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {traveler.tripCount} {traveler.tripCount === 1 ? 'رحلة' : 'رحلات'}
                    </p>
                  </div>

                  <Button
                    variant={traveler.isFollowing ? "outline" : "default"}
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => onToggleFollow(traveler.userId)}
                  >
                    {traveler.isFollowing ? (
                      <>
                        <UserMinus className="h-3 w-3 ml-1" />
                        <span className="hidden sm:inline">إلغاء</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3 ml-1" />
                        <span className="hidden sm:inline">متابعة</span>
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Discover More Link */}
          <div className="pt-3 border-t">
            <Link to="/discover">
              <Button variant="ghost" className="w-full gap-2" size="sm">
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
