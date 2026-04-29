import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Compass } from "lucide-react";
import UserBadge from "@/components/UserBadge";
import { cn } from "@/lib/utils";

export interface FollowedTraveler {
  userId: string;
  fullName: string;
  imageUrl?: string;
  status?: string;
  tripCount: number;
  isFollowing: boolean;
  points?: number;
  badgeTier?: any;
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
      <Card className="shadow-sm border-0 bg-card rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
           <Compass className="h-5 w-5 text-primary" />
           <CardTitle className="text-xl font-black text-foreground">مستخدمين مقترحين</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                   <div className="h-12 w-12 rounded-2xl bg-muted" />
                   <div className="flex-1 space-y-2">
                     <div className="h-4 bg-muted rounded w-3/4 mr-auto" />
                     <div className="h-3 bg-muted rounded w-1/2 mr-auto" />
                   </div>
                </div>
              ))}
            </div>
          ) : followedTravelers.length === 0 ? (
            <div className="text-center py-10 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
              <p className="text-sm text-muted-foreground font-bold">لا توجد اقتراحات حالياً</p>
              <Link to="/discover" className="text-primary hover:underline text-xs mt-2 font-black inline-block">
                استكشف العالم
              </Link>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
              {followedTravelers.map((traveler) => (
                <div key={traveler.userId} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-muted/50 transition-all group">
                   <Link to={`/user/${traveler.userId}`} className="flex-shrink-0">
                     <Avatar className="h-12 w-12 rounded-2xl border-2 border-background shadow-sm ring-1 ring-border">
                       {traveler.imageUrl ? (
                         <AvatarImage src={traveler.imageUrl} alt={traveler.fullName} className="object-cover" />
                       ) : null}
                       <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold rounded-2xl">
                         {traveler.fullName.charAt(0)}
                       </AvatarFallback>
                     </Avatar>
                   </Link>
                   
                   <div className="flex-1 min-w-0">
                     <div className="min-w-0">
                       <Link 
                         to={`/user/${traveler.userId}`} 
                         className="font-bold text-sm text-foreground hover:text-primary block transition-colors leading-tight mb-1"
                       >
                         {traveler.fullName}
                       </Link>
                       <UserBadge 
                         tier={traveler.badgeTier || 'none'} 
                         size="sm"
                         showLabel={true}
                       />
                     </div>
                   </div>

                   <Button
                     variant={traveler.isFollowing ? "outline" : "default"}
                     size="sm"
                     className={cn(
                         "rounded-xl h-8 px-4 text-xs font-bold transition-all",
                         traveler.isFollowing 
                            ? "border-border text-muted-foreground hover:bg-muted" 
                            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/10"
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
          <div className="pt-4 border-t border-border">
            <Link to="/discover">
              <Button variant="ghost" className="w-full gap-2 rounded-2xl h-11 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all font-bold" size="sm">
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
