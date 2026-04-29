import React, { useEffect, useState } from 'react';
import { listTrips } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Snowflake, Sun, Leaf, TreePine, MapPin, Star, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const SeasonTripsSection = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSeason, setCurrentSeason] = useState<'winter' | 'summer' | 'fall' | 'spring'>('winter');

  useEffect(() => {
    const month = new Date().getMonth() + 1; // 1-12
    let season: 'winter' | 'summer' | 'fall' | 'spring' = 'winter';

    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'fall';
    else season = 'winter';

    setCurrentSeason(season);

    const fetchSeasonTrips = async () => {
      try {
        const data = await listTrips({ limit: 4 });
        const items = data.items || [];
        const seasonMatched = items.filter((t: any) => t.season === season);
        
        if (seasonMatched.length === 0) {
          setTrips(items.slice(0, 4));
        } else {
          setTrips(seasonMatched.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching season trips:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonTrips();
  }, []);

  const seasonConfig = {
    winter: {
      label: 'شتاء',
      icon: <Snowflake className="w-5 h-5 text-blue-500" />,
      color: 'from-blue-500 to-indigo-600',
      tagline: 'اكتشف دفء الأقصر وأسوان في ليالي الشتاء الساحرة',
    },
    summer: {
      label: 'صيف',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      color: 'from-amber-500 to-orange-600',
      tagline: 'استمتع بمياه الساحل وغردقة الصيف المنعشة',
    },
    spring: {
      label: 'ربيع',
      icon: <TreePine className="w-5 h-5 text-emerald-500" />,
      color: 'from-emerald-500 to-green-600',
      tagline: 'جمال الطبيعة وانتعاش الربيع في كل مكان',
    },
    fall: {
      label: 'خريف',
      icon: <Leaf className="w-5 h-5 text-orange-500" />,
      color: 'from-orange-500 to-amber-700',
      tagline: 'أجواء الخريف الهادئة هي الأفضل للرحلات الاستكشافية',
    }
  };

  const config = seasonConfig[currentSeason];

  if (loading && trips.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden bg-background border-t border-border/40">
      {/* Subtle Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 opacity-60 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 font-cairo text-right">
        
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
           <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/80 rounded-full border border-border shadow-sm">
                 {config.icon}
                 <span className="text-sm font-bold text-muted-foreground">أكثر الرحلات رواجاً في فصل {config.label}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
                اكتشف العالم في <span className={`bg-clip-text text-transparent bg-gradient-to-l ${config.color}`}>{config.label}</span>
              </h2>
              <p className="text-muted-foreground text-lg font-medium">{config.tagline}</p>
           </div>
           
           <Link to="/discover">
             <Button variant="ghost" className="text-primary font-black gap-2 group hover:bg-primary/10 px-6 h-12 rounded-full transition-all">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                استعرض كل رحلات الموسم
             </Button>
           </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           {trips.map((trip, idx) => (
             <motion.div
               key={trip._id || trip.id}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.1 }}
               viewport={{ once: true }}
               className="group bg-card rounded-[2.5rem] overflow-hidden border border-border shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full hover:-translate-y-2"
             >
                <div className="relative h-64 overflow-hidden">
                   <img 
                     src={trip.image || "/placeholder.svg"} 
                     alt={trip.title}
                     loading="lazy"
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                   
                   <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-foreground flex items-center gap-1.5 shadow-sm border border-border/50">
                      <MapPin className="w-3 h-3 text-primary" />
                      {trip.destination || trip.city}
                   </div>

                   <div className="absolute bottom-4 left-4 flex gap-2">
                      <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-white text-[10px] font-black border border-white/20">
                         {trip.duration}
                      </div>
                   </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                   <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                         <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                         <span className="text-sm font-black text-foreground">{trip.rating || 4.5}</span>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[10px] px-2.5 py-0.5 rounded-lg">
                        {trip.budget || 'اقتصادي'}
                      </Badge>
                   </div>
                   
                   <h3 className="text-xl font-black text-foreground mb-3 line-clamp-1 group-hover:text-primary transition-colors">
                     {trip.title}
                   </h3>
                   
                   <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1 font-medium">
                     {trip.description}
                   </p>

                   <Link to={`/trips/${trip._id || trip.id}`} className="mt-auto">
                     <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 font-black shadow-lg shadow-primary/20 transition-all active:scale-95">
                        استكشف الآن
                     </Button>
                   </Link>
                </div>
             </motion.div>
           ))}
        </div>
      </div>
    </section>
  );
};

export default SeasonTripsSection;

