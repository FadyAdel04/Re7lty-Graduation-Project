import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Heart, Crown, Medal, Award } from "lucide-react";

interface PodiumTrip {
  id: string;
  title: string;
  image: string;
  author: string;
  loves: number;
  comments?: number;
  saves?: number;
}

interface PodiumProps {
  trips: PodiumTrip[];
}

const PodiumItem = ({ rank, trip }: { rank: number; trip: PodiumTrip }) => {
  const heights = {
    1: 'h-48 sm:h-56 md:h-64',
    2: 'h-40 sm:h-48 md:h-52',
    3: 'h-32 sm:h-40 md:h-44'
  };

  const gradients = {
    1: 'from-yellow-400 via-yellow-500 to-yellow-600',
    2: 'from-gray-300 via-gray-400 to-gray-500',
    3: 'from-amber-600 via-amber-700 to-amber-800'
  };

  const icons = {
    1: <Crown className="h-8 w-8 text-white" />,
    2: <Medal className="h-7 w-7 text-white" />,
    3: <Award className="h-6 w-6 text-white" />
  };

  const order = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';
  const animationDelay = rank === 1 ? 'delay-0' : rank === 2 ? 'delay-100' : 'delay-200';

  return (
    <div className={`flex-1 flex flex-col items-center ${order} animate-slide-up ${animationDelay} min-w-0`}>
      {/* Content above podium */}
      <div className="mb-2 sm:mb-4 text-center px-1">
        <Link to={`/trips/${trip.id}`} className="block group">
          <div className="relative mb-2 sm:mb-3">
            <img 
              src={trip.image || '/placeholder-trip.jpg'} 
              alt={trip.title} 
              className="w-20 h-20 sm:w-28 sm:h-28 md:w-38 md:h-38 lg:w-44 lg:h-44 xl:w-48 xl:h-48 rounded-full object-cover border-2 sm:border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-300"
            />
            <div className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${gradients[rank as keyof typeof gradients]} flex items-center justify-center shadow-lg`}>
              <div className="scale-75 sm:scale-100">{icons[rank as keyof typeof icons]}</div>
            </div>
          </div>
          <h3 className="font-bold text-xs sm:text-sm md:text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors px-1">{trip.title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{trip.author || 'مسافر'}</p>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
            <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
              <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {trip.loves || 0}
            </Badge>
          </div>
        </Link>
      </div>

      {/* Podium base */}
      <div className={`w-full ${heights[rank as keyof typeof heights]} bg-gradient-to-br ${gradients[rank as keyof typeof gradients]} rounded-t-xl sm:rounded-t-2xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-3xl transition-shadow duration-300`}>
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        <div className="text-3xl sm:text-5xl md:text-6xl font-bold text-white opacity-20 mb-1 sm:mb-2">{rank}</div>
        <div className="text-white font-bold text-sm sm:text-base md:text-lg px-2 text-center">المركز {rank === 1 ? 'الأول' : rank === 2 ? 'الثاني' : 'الثالث'}</div>
      </div>
    </div>
  );
};

const Podium = ({ trips }: PodiumProps) => {
  if (trips.length < 3) return null;

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3 md:gap-4 max-w-5xl mx-auto mb-6 sm:mb-8">
      {trips.slice(0, 3).map((trip, index) => (
        <PodiumItem key={trip.id} rank={index + 1} trip={trip} />
      ))}
    </div>
  );
};

export default Podium;
