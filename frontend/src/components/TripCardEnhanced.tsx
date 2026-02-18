import { Clock, Star, MapPin, ArrowRight, Calendar, User, Info, Building2, Timer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trip } from "@/types/corporateTrips";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface TripCardEnhancedProps {
  trip: Trip;
  companyName?: string;
  companyLogo?: string;
  showCompanyBadge?: boolean;
  onEdit?: (trip: Trip) => void;
  onExport?: (trip: Trip) => void;
}

const TripCardEnhanced = ({ trip, companyName, companyLogo, showCompanyBadge = false, onEdit, onExport }: TripCardEnhancedProps) => {
  const getTimeRemaining = (startDate: string) => {
    const total = Date.parse(startDate) - Date.parse(new Date().toString());
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    
    if (total <= 0) return "قد بدأت بالفعل";
    if (days > 0) return `متبقي ${days} يوم و ${hours} ساعة`;
    return `متبقي ${hours} ساعة`;
  };

  const isAcceptingBookings = (startDate: string) => {
    const total = Date.parse(startDate) - Date.parse(new Date().toString());
    return total > 0;
  };

  return (
    <Card className="group relative bg-white border border-zinc-200/60 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-zinc-200/60 transition-all duration-500 flex flex-col h-full">
        {/* Visual Media Layer */}
        <div className="relative h-64 w-full overflow-hidden">
          <Link to={`/corporate-trips/${trip.id}`} className="block h-full">
            <img
              src={trip.images[0]}
              alt={trip.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/20 to-transparent opacity-80" />
          </Link>

          {/* Floating Branding & Metadata */}
          <div className="absolute top-4 inset-x-4 flex justify-between items-start z-10">
            <Badge className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest pointer-events-none">
              <MapPin className="h-2.5 w-2.5 ml-1 text-orange-400" />
              {trip.destination}
            </Badge>
            
            {showCompanyBadge && companyName && (
              <Link to={`/companies/${trip.companyId}`}>
                <div className="bg-orange-600 p-2 rounded-2xl shadow-xl transition-all duration-300">
                  {companyLogo.startsWith('http') ? (
                          <img src={companyLogo} alt={companyName} className="w-8 h-8" />
                        ) : (
                          <div className="w-8 h-8">{companyLogo}</div>
                        )}
                </div>
              </Link>
            )}
          </div>

          {/* Countdown Flag Badge */}
          {trip.startDate && (
            <div className="absolute top-16 right-0 z-20">
               <div className={`flex items-center gap-2 px-4 py-2 rounded-l-full shadow-lg backdrop-blur-md border-y border-l transition-all ${
                 isAcceptingBookings(trip.startDate) 
                 ? "bg-emerald-500/90 border-emerald-400 text-white" 
                 : "bg-rose-500/90 border-rose-400 text-white"
               }`}>
                  <Timer className="w-3.5 h-3.5 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase leading-none">{getTimeRemaining(trip.startDate)}</span>
                    <span className="text-[8px] font-bold opacity-80 leading-none mt-0.5">
                      {isAcceptingBookings(trip.startDate) ? "الحجز متاح الآن" : "انتهى وقت الحجز"}
                    </span>
                  </div>
               </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between">
            <div className="space-y-1">
               <h3 className="text-white text-xl font-black tracking-tight leading-tight line-clamp-1">
                 {trip.title}
               </h3>
               <div className="flex items-center gap-3 text-white/70 text-[10px] font-black uppercase tracking-[0.15em]">
                  <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {trip.duration}</span>
                  <span className="flex items-center gap-1"><Star className="h-2.5 w-2.5 fill-orange-400 text-orange-400" /> {trip.rating}</span>
               </div>
            </div>
            <div className="bg-white rounded-2xl px-4 py-2 shadow-xl shadow-black/20 text-center">
               <span className="block text-[8px] font-black text-zinc-400 uppercase leading-none mb-0.5">تبدأ من</span>
               <span className="text-lg font-black text-zinc-900 leading-none">{trip.price} <span className="text-[10px]">ج.م</span></span>
            </div>
          </div>
        </div>
        
        {/* Content Layer */}
        <CardContent className="p-8 flex flex-col flex-1">
          <p className="text-zinc-500 text-sm font-medium leading-[1.6] line-clamp-2 mb-8 flex-1">
            {trip.shortDescription}
          </p>

          <div className="flex flex-col gap-3">
             <div className="flex gap-2">
               <Button 
                  asChild
                  className="flex-1 h-14 rounded-2xl bg-zinc-900 hover:bg-orange-600 text-white font-black text-base shadow-lg shadow-zinc-200 transition-all border-0"
                >
                  <Link to={`/corporate-trips/${trip.id}`} className="flex items-center justify-center gap-3">
                    اكتشف المـزيد
                    <motion.div animate={{ x: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                      <ArrowRight className="h-5 w-5 rotate-180" />
                    </motion.div>
                  </Link>
                </Button>

                {onEdit && (
                  <Button 
                    variant="outline" 
                    className="h-14 w-1 flex-1 max-w-[80px] rounded-2xl border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-black"
                    onClick={(e) => { e.preventDefault(); onEdit(trip); }}
                  >
                    تعديل
                  </Button>
                )}

                {onExport && (
                  <Button 
                    variant="outline" 
                    className="h-14 w-1 flex-1 max-w-[100px] rounded-2xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 font-bold gap-2 transition-all"
                    onClick={(e) => { e.preventDefault(); onExport(trip); }}
                  >
                    <span className="hidden sm:inline">PDF</span>
                    <FileText className="h-5 w-5" />
                  </Button>
                )}
             </div>

             {companyName && (
               <div className="flex items-center justify-center gap-3 text-[10px] font-black text-zinc-300 uppercase tracking-widest pt-2">
                 <span className="h-px flex-1 bg-zinc-100" />
                 <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-600 transition-colors">
                    {companyLogo && (
                      <div className="h-5 w-5 rounded-md overflow-hidden bg-zinc-50 border border-zinc-100">
                        {companyLogo.startsWith('http') ? (
                          <img src={companyLogo} alt={companyName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-[8px] font-black">{companyLogo}</div>
                        )}
                      </div>
                    )}
                    <span>بواسطة {companyName}</span>
                 </div>
                 <span className="h-px flex-1 bg-zinc-100" />
               </div>
             )}
          </div>
        </CardContent>
    </Card>
  );
};

export default TripCardEnhanced;
