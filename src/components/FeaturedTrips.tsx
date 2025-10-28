import TripCard from "./TripCard";
import { egyptTrips } from "@/lib/trips-data";

const FeaturedTrips = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            رحلات <span className="text-gradient">مميزة</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            اكتشف أفضل الرحلات التي شاركها مسافرون من حول مصر
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {egyptTrips.map((trip, index) => (
            <div 
              key={trip.id} 
              style={{ 
                animationDelay: `${index * 0.1}s` 
              }}
            >
              <TripCard {...trip} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedTrips;
