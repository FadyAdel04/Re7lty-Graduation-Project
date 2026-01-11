import { Company, Trip } from "@/types/corporateTrips";
import TripCardEnhanced from "./TripCardEnhanced";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { useRef } from "react";

interface CompanyTripsSectionProps {
  company: Company;
  trips: Trip[];
}

const CompanyTripsSection = ({ company, trips }: CompanyTripsSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  if (trips.length === 0) return null;

  return (
    <section id={`company-${company.id}`} className="py-12 scroll-mt-20">
      {/* Company Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold text-lg shadow-lg overflow-hidden`}>
            {company.logo.startsWith('http') ? (
              <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
            ) : (
              company.logo
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
            <p className="text-sm text-gray-500">{trips.length} رحلة متاحة</p>
          </div>
        </div>
        
        {/* Scroll Buttons */}
        <div className="hidden md:flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10"
            onClick={() => scroll('left')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10"
            onClick={() => scroll('right')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Trips Slider */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {trips.map((trip) => (
          <div key={trip.id} className="flex-none w-80 snap-start">
            <TripCardEnhanced trip={trip} companyName={company.name} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CompanyTripsSection;
