import { Button } from "@/components/ui/button";
import { Sparkles, Compass, Users } from "lucide-react";

const DiscoverHero = () => {
  return (
    <section className="relative w-full h-[400px] overflow-hidden rounded-[2.5rem] mb-12 group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="/assets/hero-3.png" 
          alt="Discover World" 
          className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-12 md:px-20 max-w-4xl text-white space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full w-fit">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium">اكتشف وجهات جديدة</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          شارك رحلاتك، <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-orange-400 to-amber-200">
            وألهم الآخرين
          </span>
        </h1>

        <p className="text-lg text-gray-200 max-w-xl leading-relaxed">
          انضم إلى مجتمع المسافرين. تصفح آلاف القصص المصورة، اكتشف أماكن خفية، وخطط لمغامرتك التالية مع أشخاص يشاركونك الشغف.
        </p>

        <div className="flex items-center gap-4 pt-4">
           <Button size="lg" className="rounded-full bg-orange-600 hover:bg-orange-700 text-white px-8 h-12 shadow-lg shadow-orange-500/30">
             <Compass className="w-5 h-5 ml-2" />
             تصفح الرحلات
           </Button>
           <Button size="lg" variant="outline" className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md px-8 h-12">
             <Users className="w-5 h-5 ml-2" />
             ابحث عن مسافرين
           </Button>
        </div>
      </div>
    </section>
  );
};

export default DiscoverHero;
