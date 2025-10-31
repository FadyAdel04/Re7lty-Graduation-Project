import TripCard from "./TripCard";
import { egyptTrips, Trip } from "@/lib/trips-data";

interface FeaturedTripsProps {
  searchQuery?: string;
  filters?: {
    city?: string;
    duration?: string;
    rating?: string;
    budget?: number;
    quickFilter?: string;
  };
}

const FeaturedTrips = ({ searchQuery = "", filters = {} }: FeaturedTripsProps) => {
  // Filter trips based on search and filters
  let filteredTrips = egyptTrips;

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredTrips = filteredTrips.filter(
      trip =>
        trip.title.toLowerCase().includes(query) ||
        trip.destination.toLowerCase().includes(query) ||
        trip.city.toLowerCase().includes(query) ||
        trip.description.toLowerCase().includes(query) ||
        trip.author.toLowerCase().includes(query)
    );
  }

  // City filter
  if (filters.city && filters.city !== "all") {
    filteredTrips = filteredTrips.filter(trip => {
      const cityMap: Record<string, string> = {
        alexandria: "الإسكندرية",
        matrouh: "مرسى مطروح",
        luxor: "الأقصر",
        aswan: "أسوان",
        hurghada: "الغردقة",
        sharm: "شرم الشيخ",
        dahab: "دهب",
        bahariya: "الواحات البحرية"
      };
      return trip.city === cityMap[filters.city!];
    });
  }

  // Duration filter
  if (filters.duration && filters.duration !== "all") {
    filteredTrips = filteredTrips.filter(trip => {
      const days = parseInt(trip.duration.match(/\d+/)?.[0] || "0");
      if (filters.duration === "1-3") return days >= 1 && days <= 3;
      if (filters.duration === "4-6") return days >= 4 && days <= 6;
      if (filters.duration === "7+") return days >= 7;
      return true;
    });
  }

  // Rating filter
  if (filters.rating && filters.rating !== "all") {
    const minRating = parseFloat(filters.rating);
    filteredTrips = filteredTrips.filter(trip => trip.rating >= minRating);
  }

  // Budget filter
  if (filters.budget) {
    filteredTrips = filteredTrips.filter(trip => {
      const budget = parseInt(trip.budget.replace(/[^\d]/g, ""));
      return budget <= filters.budget!;
    });
  }

  // Quick filter (by activity type)
  if (filters.quickFilter) {
    const filterMap: Record<string, string[]> = {
      coastal: ["ساحلية", "شاطئ", "بحر", "غوص"],
      historical: ["تاريخ", "معبد", "فرعون", "أثر"],
      adventure: ["مغامر", "سفاري", "تخييم", "صحراء"],
      relaxation: ["استرخاء", "هادئ"],
      diving: ["غوص", "شعاب"]
    };

    const keywords = filterMap[filters.quickFilter] || [];
    filteredTrips = filteredTrips.filter(trip =>
      keywords.some(keyword =>
        trip.title.includes(keyword) ||
        trip.description.includes(keyword) ||
        trip.activities.some(activity => activity.name.includes(keyword))
      )
    );
  }

  return (
    <section className="py-16 sm:py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center space-y-3 mb-10 sm:mb-12 animate-slide-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="text-gradient">رحلات مميزة</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {filteredTrips.length > 0
              ? `وجدنا ${filteredTrips.length} رحلة ${searchQuery ? `لـ "${searchQuery}"` : ""}`
              : "اكتشف أجمل الوجهات المصرية من خلال تجارب حقيقية"}
          </p>
        </div>
        
        {filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-slide-in">
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} {...trip} />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground mb-2">
                لم نجد رحلات تطابق معايير البحث
              </p>
              <p className="text-sm text-muted-foreground">
                لكن جرب هذه الرحلات المميزة:
              </p>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-6 text-center">
                <span className="text-gradient">رحلات قد تعجبك</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-slide-in">
                {[...egyptTrips]
                  .sort((a, b) => b.rating - a.rating || b.likes - a.likes)
                  .slice(0, 6)
                  .map((trip) => (
                    <TripCard key={trip.id} {...trip} />
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedTrips;
