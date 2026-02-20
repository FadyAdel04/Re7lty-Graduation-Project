import { Button } from "@/components/ui/button";
import { Sparkles, Compass, Users } from "lucide-react";

const DiscoverHero = () => {
  return (
    <section className="relative w-full min-h-[280px] sm:min-h-[320px] md:h-[380px] lg:h-[400px] overflow-hidden rounded-xl sm:rounded-2xl md:rounded-[2.5rem] mb-6 sm:mb-8 md:mb-12 group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="/assets/hero-3.png" 
          alt="Discover World" 
          className="w-full h-full object-cover object-center transition-transform duration-[3s] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20 sm:from-black/80 sm:via-black/40 sm:to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-6 md:px-12 lg:px-20 py-6 sm:py-8 max-w-4xl text-white space-y-3 sm:space-y-4 md:space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full w-fit">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">اكتشف وجهات جديدة</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
          شارك رحلاتك، <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-orange-400 to-amber-200">
            وألهم الآخرين
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-gray-200 max-w-xl leading-relaxed line-clamp-3 sm:line-clamp-none">
          انضم إلى مجتمع المسافرين. تصفح آلاف القصص المصورة، اكتشف أماكن خفية، وخطط لمغامرتك التالية مع أشخاص يشاركونك الشغف.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 pt-2 sm:pt-4">
           <Button size="lg" className="rounded-full bg-orange-600 hover:bg-orange-700 text-white px-6 sm:px-8 h-10 sm:h-12 shadow-lg shadow-orange-500/30 text-sm sm:text-base">
             <Compass className="w-4 h-4 sm:w-5 sm:h-5 ml-2 shrink-0" />
             تصفح الرحلات
           </Button>
           <Button size="lg" variant="outline" className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base">
             <Users className="w-4 h-4 sm:w-5 sm:h-5 ml-2 shrink-0" />
             ابحث عن مسافرين
           </Button>
        </div>
      </div>
    </section>
  );
};

export default DiscoverHero;
