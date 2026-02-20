import { Button } from "@/components/ui/button";
import { Compass, Users, Sparkles, Map } from "lucide-react";
import { Link } from "react-router-dom";

const TimelineHero = () => {
  return (
    <section className="relative w-full min-h-[320px] sm:min-h-[360px] md:min-h-[400px] h-[50vh] max-h-[500px] overflow-hidden rounded-xl sm:rounded-2xl md:rounded-[2.5rem] mb-6 sm:mb-8 group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="/assets/hero-1.png" 
          alt="Timeline" 
          className="w-full h-full object-cover object-center transition-transform duration-[5s] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-6 md:px-10 lg:px-16 max-w-3xl text-white space-y-4 sm:space-y-6 text-right" dir="rtl">
        <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-orange-500/20 backdrop-blur-md border border-orange-500/30 rounded-full w-fit">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
          <span className="text-[10px] sm:text-xs font-bold text-orange-100 italic">مجتمع رحلتي الرقمي</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight tracking-tight">
          اجعل رحلتك <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-orange-400 to-yellow-300">
            قصة تُلهم العالم
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-gray-200 max-w-xl leading-relaxed font-light line-clamp-2 sm:line-clamp-none">
          تصفح آخر مغامرات أصدقائك، اكتشف وجهات جديدة، وشارك لحظاتك الخاصة مع مجتمع شغوف بالسفر والاستكشاف.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
           <Link to="/trips/new" className="w-full sm:w-auto">
             <Button size="lg" className="rounded-full bg-orange-600 hover:bg-orange-700 text-white px-6 sm:px-8 h-11 sm:h-12 shadow-xl shadow-orange-950/40 border-0 flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base">
               <Map className="w-4 h-4 sm:w-5 sm:h-5" />
               شارك مغامرتك
             </Button>
           </Link>
           <Link to="/discover" className="w-full sm:w-auto">
             <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md px-6 sm:px-8 h-11 sm:h-12 flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base">
               <Users className="w-4 h-4 sm:w-5 sm:h-5" />
               ابحث عن أصدقاء
             </Button>
           </Link>
        </div>
      </div>
    </section>
  );
};

export default TimelineHero;
