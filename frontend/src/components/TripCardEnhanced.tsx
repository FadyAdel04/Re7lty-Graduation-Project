import { Clock, Star, MapPin, ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trip } from "@/types/corporateTrips";
import { Link } from "react-router-dom";

interface TripCardEnhancedProps {
  trip: Trip;
  companyName?: string;
  showCompanyBadge?: boolean;
}

const TripCardEnhanced = ({ trip, companyName, showCompanyBadge = false }: TripCardEnhancedProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-gray-100 hover:border-orange-200 rounded-2xl">
      <Link to={`/corporate-trips/${trip.id}`}>
        <div className="relative h-56 overflow-hidden">
          <img
            src={trip.images[0]}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Destination Badge */}
          <Badge className="absolute top-3 right-3 bg-white/95 text-gray-900 border-0 backdrop-blur-sm hover:bg-white">
            <MapPin className="h-3 w-3 ml-1" />
            {trip.destination}
          </Badge>

          {/* Company Badge */}
          {showCompanyBadge && companyName && (
            <Badge className="absolute top-3 left-3 bg-orange-500 hover:bg-orange-600 border-0 shadow-lg shadow-orange-500/20 text-white">
              {companyName}
            </Badge>
          )}

          {/* Price Tag */}
          <div className="absolute bottom-3 right-3 bg-orange-500 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg">
            {trip.price} ج.م
          </div>
        </div>
        
        <CardContent className="p-5 space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 mb-2">
              {trip.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {trip.shortDescription}
            </p>
          </div>
          
          <div className="flex items-center justify-between text-sm pt-2">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{trip.duration}</span>
            </div>
            {trip.season && (
              <div className="flex items-center gap-1.5 text-orange-600">
                <Calendar className="h-4 w-4" />
                <span>
                  {trip.season === 'winter' ? 'شتاء' :
                   trip.season === 'summer' ? 'صيف' :
                   trip.season === 'fall' ? 'خريف' :
                   trip.season === 'spring' ? 'ربيع' : trip.season}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="font-semibold text-gray-900">{trip.rating}</span>
            </div>
          </div>

          <Button 
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white mt-3 group/btn"
            asChild
          >
            <div className="flex items-center justify-center">
              عرض التفاصيل
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover/btn:-translate-x-1" />
            </div>
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
};

export default TripCardEnhanced;
