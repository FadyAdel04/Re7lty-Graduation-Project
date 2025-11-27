import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, MapPin } from "lucide-react";
import { egyptTrips } from "@/lib/trips-data";

const TopTrips = () => {
  const topTrips = [...egyptTrips].sort((a, b) => b.weeklyLikes - a.weeklyLikes).slice(0, 3);

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-xl font-bold mb-4">أعلى 3 رحلات</h3>
        <div className="space-y-4">
          {topTrips.map((trip, idx) => (
            <Link key={trip.id} to={`/trips/${trip.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border">
                <img src={trip.image} alt={trip.title} className="h-full w-full object-cover" />
                <span className="absolute top-1 right-1 bg-background/90 text-xs px-2 py-0.5 rounded-full font-bold">#{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{trip.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-secondary" /> {trip.destination}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {trip.rating}</span>
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-primary" /> {trip.weeklyLikes} هذا الأسبوع</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopTrips;
