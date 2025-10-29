import TripCard from "./TripCard";
import { egyptTrips } from "@/lib/trips-data";

const FeaturedTrips = () => {
  return (
    <section className="py-16 sm:py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center space-y-3 mb-10 sm:mb-12 animate-slide-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="text-gradient">رحلات مميزة</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            اكتشف أجمل الوجهات المصرية من خلال تجارب حقيقية
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-slide-in">
          {egyptTrips.slice(0, 6).map((trip) => (
            <TripCard key={trip.id} {...trip} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedTrips;
