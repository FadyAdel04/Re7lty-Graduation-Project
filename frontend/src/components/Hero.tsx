import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Globe, Search, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax-like fixed effect */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ 
          backgroundImage: `url('/assets/background.jpg')` 
        }}
      />
      
      {/* Soft Dark Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      <div className="container relative z-20 mx-auto px-4 text-center pt-20 pb-12">
        
        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
          
          {/* Typography */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight text-white drop-shadow-lg">
              اكتشف جمال
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 animate-pulse-slow">
                مصر الساحر
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md">
              شارك رحلتك، استلهم من تجارب الآخرين، وخطط لمغامرتك القادمة بسهولة
            </p>
          </div>



          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Link to="/trips/new" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:min-w-[200px] h-14 text-lg rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:scale-105 transition-all duration-300 border-0">
                <MapPin className="ml-2 h-5 w-5" />
                شارك رحلتك
              </Button>
            </Link>
            <Link to="/timeline" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:min-w-[200px] h-14 text-lg rounded-full bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all duration-300">
                <Globe className="ml-2 h-5 w-5" />
                استعرض الوجهات
              </Button>
            </Link>
          </div>

        </div>

        {/* Floating Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto mt-20">
          {[
            { number: "98%", label: "رضا العملاء" },
            { number: "+5,000", label: "رحلة موثقة" },
            { number: "8", label: "وجهات سياحية" },
            { number: "+2,500", label: "مسافر نشط" },
          ].map((stat, index) => (
            <div 
              key={index} 
              className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300 font-numeric">
                {stat.number}
              </div>
              <div className="text-sm sm:text-base text-gray-300 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden md:block">
        <ArrowDown className="h-6 w-6 text-white/50" />
      </div>

    </section>
  );
};

export default Hero;
