import { Company, Trip } from "@/types/corporateTrips";
import TripCardEnhanced from "./TripCardEnhanced";
import { ChevronLeft, ChevronRight, LayoutGrid, Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { useRef } from "react";
import { motion } from "framer-motion";

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
    <section id={`company-${company.id}`} className="py-12 scroll-mt-24 font-cairo">
      {/* Company Branding Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
        <div className="flex items-center gap-6">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${company.color} p-0.5 shadow-2xl shadow-primary/10`}
          >
            <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center overflow-hidden">
               {company.logo.startsWith('http') ? (
                 <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-xl font-black text-foreground uppercase">{company.logo}</span>
               )}
            </div>
          </motion.div>
          
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              رحلات {company.name}
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </h2>
            <div className="flex items-center gap-2 text-muted-foreground">
               <LayoutGrid className="h-3.5 w-3.5" />
               <span className="text-[10px] font-black uppercase tracking-widest">{trips.length} عرض متاح حالياً</span>
            </div>
          </div>
        </div>
        
        {/* Modern Nav Controls */}
        <div className="flex items-center gap-4">
           <div className="h-px w-24 bg-border hidden lg:block" />
           <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl h-12 w-12 border-border bg-card hover:bg-primary hover:text-primary-foreground transition-all shadow-lg"
              onClick={() => scroll('left')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl h-12 w-12 border-border bg-card hover:bg-primary hover:text-primary-foreground transition-all shadow-lg"
              onClick={() => scroll('right')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
           </div>
        </div>
      </div>

      {/* Trips Slider Layer */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-8 overflow-x-auto pb-10 pt-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {trips.map((trip) => (
          <div key={trip.id} className="flex-none w-[22rem] snap-start">
            <TripCardEnhanced trip={trip} companyName={company.name} companyLogo={company.logo} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CompanyTripsSection;
