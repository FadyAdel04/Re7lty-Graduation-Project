import { Bus, MapPin, Calendar, Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface TripSkeletonLoaderProps {
  count?: number;
  variant?: "card" | "detail" | "list";
}

const TripSkeletonLoader = ({ count = 1, variant = "card" }: TripSkeletonLoaderProps) => {
  if (variant === "detail") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8 space-y-4">
            <div className="h-10 w-3/4 bg-muted animate-pulse rounded-lg" />
            <div className="h-6 w-1/2 bg-muted animate-pulse rounded-lg" />
          </div>

          {/* Image Skeleton */}
          <div className="relative mb-8 h-96 bg-muted rounded-xl overflow-hidden animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <Bus className="h-16 w-16 text-muted-foreground/30 animate-bounce" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-full animate-ping" />
                </div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 w-20 bg-muted rounded mb-4" />
                  <div className="h-6 w-32 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Activities Skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted animate-pulse rounded-lg mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-6 w-6 bg-muted rounded-full mb-3" />
                    <div className="h-4 w-24 bg-muted rounded mb-2" />
                    <div className="h-20 w-full bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-6">
        {Array.from({ length: count }).map((_, idx) => (
          <Card key={idx} className="overflow-hidden animate-pulse">
            <div className="relative">
              {/* Image Skeleton */}
              <div className="w-full h-64 bg-muted relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <Bus className="h-12 w-12 text-muted-foreground/30 animate-bounce" style={{ animationDelay: `${idx * 0.1}s` }} />
                    <div className="absolute -top-2 -right-2">
                      <div className="h-3 w-3 bg-primary/20 rounded-full animate-ping" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Skeleton */}
              <CardContent className="p-4 space-y-3">
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="flex gap-4">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Default card variant
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} className="overflow-hidden group animate-pulse">
          <div className="relative">
            {/* Image Skeleton with Travel Animation */}
            <div className="w-full h-48 bg-gradient-to-br from-muted via-muted/80 to-muted relative overflow-hidden">
              {/* Animated Bus */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full">
                  {/* Travel Path */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/10 -translate-y-1/2">
                    <div className="h-full w-1/3 bg-primary/20" style={{ animation: 'move 2s linear infinite' }} />
                  </div>
                  {/* Bus */}
                  <Bus 
                    className="h-10 w-10 text-primary/30 absolute top-1/2 -translate-y-1/2" 
                    style={{ 
                      animation: `busTravel 3s ease-in-out infinite`,
                      animationDelay: `${idx * 0.2}s`,
                      left: '10%'
                    }} 
                  />
                </div>
              </div>

              {/* Floating Icons */}
              <MapPin className="absolute top-4 right-4 h-5 w-5 text-muted-foreground/20 animate-bounce" style={{ animationDelay: `${idx * 0.3}s` }} />
              <Star className="absolute bottom-4 left-4 h-4 w-4 text-muted-foreground/20 animate-pulse" style={{ animationDelay: `${idx * 0.4}s` }} />
            </div>

            {/* Content Skeleton */}
            <CardContent className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="flex items-center gap-3">
                <div className="h-4 w-16 bg-muted rounded flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground/30" />
                </div>
                <div className="h-4 w-16 bg-muted rounded flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground/30" />
                </div>
                <div className="h-4 w-16 bg-muted rounded flex items-center gap-1">
                  <Star className="h-3 w-3 text-muted-foreground/30" />
                </div>
              </div>
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-2/3 bg-muted rounded" />
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TripSkeletonLoader;

