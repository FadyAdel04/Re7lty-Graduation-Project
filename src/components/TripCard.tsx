import { MapPin, Calendar, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TripCardProps {
  id: string;
  title: string;
  destination: string;
  duration: string;
  rating: number;
  image: string;
  author: string;
  likes: number;
}

const TripCard = ({ 
  title, 
  destination, 
  duration, 
  rating, 
  image, 
  author, 
  likes 
}: TripCardProps) => {
  return (
    <Card className="group overflow-hidden shadow-float hover:shadow-float-lg transition-all duration-300 animate-slide-up border-0">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-card z-10" />
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 left-3 z-20 bg-background/80 backdrop-blur hover:bg-background"
        >
          <Heart className="h-5 w-5" />
        </Button>
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-background/90 backdrop-blur px-3 py-1 rounded-full">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="text-sm font-bold">{rating}</span>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 text-secondary" />
          <span className="text-sm">{destination}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm">{duration}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {likes} إعجاب
            </span>
            <span className="text-xs font-medium text-secondary">
              {author}
            </span>
          </div>
        </div>

        <Button 
          variant="secondary" 
          className="w-full mt-4"
        >
          عرض التفاصيل
        </Button>
      </CardContent>
    </Card>
  );
};

export default TripCard;
