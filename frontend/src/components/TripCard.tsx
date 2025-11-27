import { Clock, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useState } from "react";

interface TripCardProps {
  id: string;
  title: string;
  destination: string;
  duration: string;
  rating: number;
  image: string;
  author: string;
  likes: number;
  ownerId?: string; // Clerk user ID for profile linking
}

const TripCard = ({ id, title, destination, duration, rating, image, author, likes, ownerId }: TripCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  
  // Use ownerId for profile link if available, otherwise fallback to author name (for backward compatibility)
  const profileLink = ownerId ? `/user/${ownerId}` : `/profile/${author.replace(/\s+/g, "-")}`;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-border/50">
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
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm hover:bg-background h-9 w-9 rounded-full"
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
          </Button>
        </div>
        
        <CardContent className="p-5 space-y-3">
          <div>
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-semibold text-foreground">{rating}</span>
            </div>
          </div>
        </CardContent>
      </Link>
      
      <CardContent className="px-5 pb-5 pt-0">
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <Link 
            to={profileLink} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`} />
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
