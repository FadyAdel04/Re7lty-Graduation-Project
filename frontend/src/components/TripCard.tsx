import { Clock, Heart, Star, Snowflake, Sun, Leaf, Cloud, Flag, Zap, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useState } from "react";
import ReportTripDialog from "@/components/ReportTripDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TripCardProps {
  id: string;
  title: string;
  destination: string;
  duration: string;
  rating: number;
  image: string;
  author: string;
  authorImage?: string; // Optional override for author avatar
  likes: number;
  ownerId?: string; // Clerk user ID for profile linking
  season?: 'winter' | 'summer' | 'fall' | 'spring';
  postType?: 'quick' | 'detailed' | 'ask';
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const TripCard = ({ id, title, destination, duration, rating, image, author, authorImage, likes, ownerId, season, postType, onEdit, onDelete }: TripCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  
  // Use ownerId for profile link if available, otherwise fallback to author name (for backward compatibility)
  const profileLink = ownerId ? `/user/${ownerId}` : `/profile/${author.replace(/\s+/g, "-")}`;
  
  // Season badge configuration
  const getSeasonConfig = (season?: string) => {
    switch (season) {
      case 'winter':
        return { label: 'شتاء', icon: Snowflake, color: 'bg-blue-500/90 text-white', emoji: '❄️' };
      case 'summer':
        return { label: 'صيف', icon: Sun, color: 'bg-orange-500/90 text-white', emoji: '☀️' };
      case 'fall':
        return { label: 'خريف', icon: Leaf, color: 'bg-amber-600/90 text-white', emoji: '🍂' };
      case 'spring':
        return { label: 'ربيع', icon: Cloud, color: 'bg-green-500/90 text-white', emoji: '🌸' };
      default:
        return null;
    }
  };
  
  const seasonConfig = getSeasonConfig(season);

  const isAsk = postType === 'ask';

  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-lg transition-all duration-300 group border-border/50 relative",
      isAsk ? "h-fit self-start" : "h-full"
    )}>
      <div>
        {/* Global Edit/Delete Dropdown - moved here to be visible for all post types */}
        {(onEdit || onDelete) && (
          <div className="absolute top-4 left-4 z-30" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-background/90 backdrop-blur-sm hover:bg-background h-8 w-8 rounded-full shadow-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-cairo">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id)} className="flex items-center gap-2 cursor-pointer">
                    <Edit2 className="h-4 w-4 text-indigo-600" />
                    <span>تعديل</span>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(id)} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                    <Trash2 className="h-4 w-4" />
                    <span>حذف</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Image Section */}
        {(!isAsk || (isAsk && image && image !== "")) ? (
          <div className="relative">
            {!isAsk ? (
              <Link to={`/trips/${id}`}>
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <Badge className="absolute top-3 right-3 bg-background/90 text-foreground border-0 backdrop-blur-sm">
                    {destination}
                  </Badge>
                  {seasonConfig && (
                    <Badge className={`absolute top-3 left-3 ${seasonConfig.color} border-0 backdrop-blur-sm flex items-center gap-1.5 px-3 py-1.5`}>
                      <span className="text-base">{seasonConfig.emoji}</span>
                      <span className="font-semibold">{seasonConfig.label}</span>
                    </Badge>
                  )}
                  {postType === 'quick' && (
                    <Badge className="absolute bottom-3 right-3 bg-amber-500 text-white border-0 backdrop-blur-sm flex items-center gap-1.5 px-3 py-1.5 z-10 shadow-lg">
                      <Zap className="h-3.5 w-3.5 fill-white" />
                      <span className="font-semibold">بوست سريع</span>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm hover:bg-background h-9 w-9 rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsLiked(!isLiked);
                    }}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
                  </Button>

                  {/* Report Button - visible on hover or if card is active */}
                  <div className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={(e) => e.preventDefault()}>
                    <ReportTripDialog 
                      tripId={id} 
                      tripTitle={title}
                      trigger={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="bg-background/90 backdrop-blur-sm hover:bg-destructive hover:text-white h-8 w-8 rounded-full"
                        >
                          <Flag className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="relative h-56 overflow-hidden">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm hover:bg-background h-9 w-9 rounded-full"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLiked(!isLiked);
                  }}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        ) : null}
        
        <CardContent className={cn("p-5 space-y-3", isAsk && "pt-8")}>
          {isAsk && (
            <Badge className="mb-2 bg-emerald-500/10 text-emerald-600 border-emerald-200/50 gap-1 px-3 py-1 font-black">
              سؤال واستفسار ❓
            </Badge>
          )}
          <div>
            {!isAsk ? (
              <Link to={`/trips/${id}`}>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {title}
                </h3>
              </Link>
            ) : (
              <h3 className="text-xl font-bold text-foreground line-clamp-2">
                {title}
              </h3>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
            {!isAsk && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-semibold text-foreground">{rating}</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>
      
      <CardContent className="px-5 pb-5 pt-0">
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <Link 
            to={profileLink} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={authorImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`} />
              <AvatarFallback>{author[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {author}
            </span>
          </Link>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">{likes}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TripCard;
