import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Sparkles, Users2, ShieldCheck, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { seasonalConfig } from "@/config/seasonalConfig";
import { motion } from "framer-motion";
import { Moon, Star } from "lucide-react";

// Platform Features Data
const FEATURES = [
  {
    id: 1,
    title: "خطط بذكاء",
    subtitle: "  بالذكاء الاصطناعي",
    description: "احصل على جدول سياحي متكامل ومخصص لك في ثوانٍ باستخدام أحدث تقنيات الذكاء الاصطناعي.",
    image: "/assets/hero-1.png", // Tech/Planning vibe
    icon: Sparkles,
    stat: "مجاني 100%",
    statLabel: "بدء الاستخدام",
    color: "from-purple-400 to-pink-500",
    link: "/trip-assistant"
  },
  {
    id: 2,
    title: "سافر بأمان",
    subtitle: "شركات سياحة معتمدة",
    description: "نجمع لك أفضل عروض الشركات السياحية الموثقة لضمان خدمات راقية وحجوزات آمنة تماماً.",
    image: "/assets/hero-2.png", // Bus/Professional vibe
    icon: ShieldCheck,
    stat: "+50",
    statLabel: "شركة معتمدة",
    color: "from-blue-400 to-cyan-400",
    link: "/templates"
  },
  {
    id: 3,
    title: "مجتمع رحلتي",
    subtitle: "تواصل مع مسافرين مثلك",
    description: "انضم إلى مجتمع نابض بالحياة، شارك تجاربك، وتعرف على رفقاء سفر جدد يشاركونك نفس الشغف.",
    image: "/assets/hero-3.png", // Friends/Camping vibe
    icon: Users2,
    stat: "+2,500",
    statLabel: "عضو نشط",
    color: "from-orange-400 to-amber-500",
    link: "/timeline"
  },
  {
    id: 4,
    title: "وثّق ذكرياتك",
    subtitle: "شارك لحظاتك التي لا تُنسى",
    description: "أنشئ جدولك الزمني الخاص، ارفع صور رحلاتك، وألهم الآخرين بمغامراتك الرائعة.",
    image: "/assets/hero-4.png", // Nature/Photography
    icon: ImageIcon,
    stat: "لا نهائي",
    statLabel: "مساحة تخزين",
    color: "from-green-400 to-emerald-500",
    link: "/trips/new"
  }
];

const Hero = () => {
  const [activeId, setActiveId] = useState(1);
  const activeFeature = FEATURES.find(f => f.id === activeId) || FEATURES[0];

  const nextSlide = () => {
    setActiveId(prev => prev === FEATURES.length ? 1 : prev + 1);
  };

  const prevSlide = () => {
    setActiveId(prev => prev === 1 ? FEATURES.length : prev - 1);
  };

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
       nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [activeId]); // Reset timer whenever activeId changes (manual interaction)

  return (
    <section className="relative  min-h-[600px] w-full overflow-hidden font-cairo bg-black">
      
      {/* Dynamic Background Layer - Optimized for LCP */}
      {FEATURES.map((feature) => {
        const isCurrent = activeId === feature.id;
        const isNext = feature.id === (activeId === FEATURES.length ? 1 : activeId + 1);
        
        if (!isCurrent && !isNext) return null;

        return (
          <div 
            key={feature.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              isCurrent ? "opacity-100 z-0" : "opacity-0 -z-10"
            )}
          >
            {/* Using img instead of background-image for faster discovery & fetchPriority */}
            <img 
              src={feature.image} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover transform scale-105 transition-transform duration-[10s] ease-linear"
              fetchPriority={isCurrent ? "high" : "low"}
              loading={isCurrent ? "eager" : "lazy"}
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/80 to-black/40" />
          </div>
        );
      })}

      {/* Ramadan Season Layer - Conditional Icons */}
      {seasonalConfig.isRamadanTheme && (
        <div className="absolute inset-0 pointer-events-none z-[5]">
           <motion.div 
             className="absolute top-10 right-[5%] text-gold opacity-40"
             animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
             transition={{ duration: 6, repeat: Infinity }}
           >
             <Moon size={120} fill="#D4AF37" />
           </motion.div>
           
           <motion.div 
             className="absolute top-20 left-[10%] text-gold opacity-30"
             animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
             transition={{ duration: 4, repeat: Infinity }}
           >
             <Star size={40} fill="#D4AF37" />
           </motion.div>

           <motion.div 
             className="absolute bottom-20 right-[20%] text-gold opacity-20"
             animate={{ y: [0, -10, 0] }}
             transition={{ duration: 5, repeat: Infinity }}
           >
             <svg width="40" height="60" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0V10" stroke="#D4AF37" strokeWidth="2"/>
                <path d="M10 10H30L35 25L20 50L5 25L10 10Z" fill="#D4AF37" fillOpacity="0.4" stroke="#D4AF37" strokeWidth="2"/>
             </svg>
           </motion.div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="relative z-10 w-full h-full flex flex-col pt-24 pb-4 container mx-auto px-4">
        
        <div className="flex flex-col lg:flex-row h-full gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Text & Controls */}
            <div className="w-full lg:w-4/12 flex flex-col justify-center items-start text-right space-y-8 animate-fade-up z-20">
               
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-orange-200 text-sm font-medium shadow-[0_0_20px_rgba(251,146,60,0.2)]">
                  <TrendingUp className="w-4 h-4" />
                  <span>منصتك الأولى للسفر الذكي</span>
               </div>

               <div className="space-y-4">
                  <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight drop-shadow-2xl">
                    <span className={cn(
                      "text-transparent bg-clip-text bg-gradient-to-r transition-all duration-700",
                      activeFeature.color
                    )}>
                      {activeFeature.subtitle}
                    </span>
                  </h1>

                  <p className="text-xl text-gray-200 font-light leading-relaxed drop-shadow-md lg:ml-8 border-r-4 border-orange-500 pr-6 mr-1 min-h-[80px]">
                    {activeFeature.description}
                  </p>
               </div>
               
               <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                 <Link to={activeFeature.link} className="w-full sm:w-auto">
                   <Button size="lg" className="w-full sm:w-auto rounded-full h-14 px-8 text-lg bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-lg hover:shadow-orange-500/40 hover:scale-105 border-0">
                     ابدا الان
                     <ArrowRight className="mr-2 w-5 h-5" />
                   </Button>
                 </Link>
                 
                 {/* Slider Controls */}
                 <div className="flex items-center gap-3 dir-ltr">
                    <Button 
                      onClick={prevSlide}
                      variant="outline" 
                      size="icon" 
                      className="h-12 w-12 rounded-full border-white/20 bg-white/5 hover:bg-white/20 text-white backdrop-blur-sm"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                    <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-500" 
                          style={{ width: `${(activeId / FEATURES.length) * 100}%` }}
                        />
                    </div>
                    <Button 
                      onClick={nextSlide}
                      variant="outline" 
                      size="icon" 
                      className="h-12 w-12 rounded-full border-white/20 bg-white/5 hover:bg-white/20 text-white backdrop-blur-sm"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                 </div>
               </div>
            </div>

            {/* Right Column: Expanding Cards Slider */}
            <div className="hidden lg:flex w-full lg:w-8/12 h-[50vh] lg:h-[70vh] items-center">
              <div className="flex flex-row gap-4 h-full w-full">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  const isActive = activeId === feature.id;
                  
                  return (
                    <div 
                      key={feature.id}
                      onClick={() => setActiveId(feature.id)}
                      className={cn(
                        "relative overflow-hidden rounded-[2rem] cursor-pointer transition-[flex] duration-700 ease-in-out border border-white/10 group",
                        isActive 
                          ? "flex-[3] bg-white/10 backdrop-blur-xl border-white/30 shadow-2xl" 
                          : "flex-1 bg-black/40 hover:bg-black/60 grayscale opacity-60 hover:opacity-100"
                      )}
                    >
                      {/* Inner Image for Card (visible only when expanded or purely decorative?) 
                          Let's keep the transparent gradient feel, maybe show a hint of the image 
                      */}
                      {/* Card Background: Image only for active card to save bandwidth, sleek gradient for others */}
                      <div className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40">
                         {isActive ? (
                           <img 
                            src={feature.image} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            loading="eager"
                            width="400"
                            height="600"
                            decoding="async"
                          />
                         ) : (
                           <div className={cn("w-full h-full bg-gradient-to-br", feature.color, "opacity-20")} />
                         )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end h-full">
                        
                        {/* Icon & Label */}
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg transition-all duration-500",
                            isActive ? "scale-100" : "scale-75 opacity-70",
                            feature.color
                          )}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          
                          {/* Rotated Text for inactive vertical state? No, standard text simpler. */}
                        </div>

                        <h3 className={cn(
                          "font-bold text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis",
                          isActive ? "text-3xl mb-3" : "text-lg opacity-80 rotate-0"
                        )}>
                          {feature.title}
                        </h3>
                        
                        {/* Content visible only when active */}
                        <div className={cn(
                          "overflow-hidden transition-all duration-700 ease-in-out",
                          isActive ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                        )}>
                           <p className="text-gray-300 text-lg leading-relaxed mb-6 line-clamp-3 pl-2">
                             {feature.description}
                           </p>
                           
                           <div className="flex items-center justify-between border-t border-white/10 pt-4">
                             <div>
                                <span className={cn("text-2xl font-bold font-numeric text-transparent bg-clip-text bg-gradient-to-tr", feature.color)}>
                                  {feature.stat}
                                </span>
                                <span className="block text-xs text-gray-400 mt-1">{feature.statLabel}</span>
                             </div>
                             <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                                <ArrowRight className="w-5 h-5 text-white animate-move-x" />
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;





