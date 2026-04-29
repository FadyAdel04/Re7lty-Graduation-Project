import { motion, AnimatePresence } from "framer-motion";
import { Bus, PlaneTakeoff, Car } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const PremiumLoader = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stage, setStage] = useState(0); // 0: Microbus, 1: Big Bus, 2: Plane

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((prev) => (prev + 1) % 3);
    }, 1200); // 1.2s per stage for a total cycle of 3.6s
    return () => clearInterval(timer);
  }, []);

  const vehicles = [
    { id: "microbus", icon: <Car className="w-16 h-16" />, label: "ميكروباص", subLabel: "Microbus", scale: 0.7, color: "text-orange-500" },
    { id: "bus", icon: <Bus className="w-20 h-20" />, label: "حافلة سياحية", subLabel: "Luxury Bus", scale: 1, color: "text-indigo-600" },
    { id: "plane", icon: <PlaneTakeoff className="w-20 h-20" />, label: "طائرة خاصة", subLabel: "Private Jet", scale: 1.2, color: "text-sky-500" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-[99999] flex flex-col items-center justify-center backdrop-blur-2xl transition-colors duration-700",
        isDark ? 'bg-slate-950/90' : 'bg-white/90'
      )}
      dir="rtl"
    >
      <div className="relative w-80 h-72 flex flex-col items-center justify-center">
        {/* Glowing Background Radial */}
        <div className={cn(
          "absolute inset-x-0 top-1/2 -translate-y-1/2 h-40 rounded-full blur-[100px] animate-pulse transition-all duration-1000",
          isDark ? 'bg-primary/20' : 'bg-primary/10'
        )} />
        
        {/* Moving Ground Line */}
        <div className={cn(
          "absolute bottom-24 left-10 right-10 h-1 rounded-full overflow-hidden transition-colors duration-500", 
          isDark ? 'bg-primary/20' : 'bg-gray-200/50'
        )}>
          <motion.div
            className="h-full w-full"
            style={{ 
              background: 'linear-gradient(to right, transparent, hsl(var(--primary)), transparent)'
            }}
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        {/* Vehicle Container */}
        <div className="relative h-32 flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ x: -150, opacity: 0, scale: 0.3, rotate: stage === 2 ? -15 : 0 }}
              animate={{ 
                x: 0, opacity: 1, scale: vehicles[stage].scale,
                y: [0, stage === 2 ? -12 : -6, 0],
                rotate: stage === 2 ? [-15, -10, -15] : [0, 1.5, -1.5, 0]
              }}
              exit={{ x: 150, opacity: 0, scale: 1.3, rotate: stage === 2 ? -25 : 5 }}
              transition={{
                x: { duration: 0.5, ease: "backOut" },
                opacity: { duration: 0.3 },
                scale: { duration: 0.5 },
                y: { duration: stage === 2 ? 0.4 : 0.3, repeat: Infinity, ease: "easeInOut" }
              }}
              className={vehicles[stage].color}
            >
               <div className="relative flex items-center justify-center">
                 <div className={cn(
                   "filter transition-all duration-500", 
                   "drop-shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                 )}>
                   {vehicles[stage].icon}
                 </div>
                 
                 {/* Speed Trails */}
                 <div className="absolute -right-8 flex flex-col gap-1.5 pointer-events-none">
                    <motion.div className="h-0.5 w-6 bg-current opacity-30 rounded-full" animate={{ scaleX: [0, 1, 0], x: [0, 20, 0] }} transition={{ duration: 0.3, repeat: Infinity }} />
                    <motion.div className="h-0.5 w-10 bg-current opacity-20 rounded-full" animate={{ scaleX: [0, 1, 0], x: [0, 30, 0] }} transition={{ duration: 0.4, repeat: Infinity, delay: 0.1 }} />
                    <motion.div className="h-0.5 w-8 bg-current opacity-30 rounded-full" animate={{ scaleX: [0, 1, 0], x: [0, 25, 0] }} transition={{ duration: 0.3, repeat: Infinity, delay: 0.05 }} />
                 </div>
               </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Cloud effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          {[...Array(stage === 2 ? 6 : 3)].map((_, i) => (
            <motion.div
              key={i}
              className={cn("absolute border rounded-full blur-[2px]", isDark ? 'bg-white/10 border-white/10' : 'bg-white/40 border-white/20')}
              style={{ width: 30 + i * 15, height: 8 + i * 4, top: 20 + i * 25, right: -100 }}
              animate={{ x: [-100, 500], opacity: [0, 0.8, 0] }}
              transition={{ duration: stage === 2 ? 1.2 : 2, repeat: Infinity, delay: i * 0.3, ease: "linear" }}
            />
          ))}
        </div>
      </div>
      
      <div className="text-center -mt-8 space-y-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.3 }}
          >
            <h3 className={cn("font-black text-3xl tracking-tight leading-none transition-colors duration-500", isDark ? 'text-white' : 'text-gray-900')}>
              {stage === 0 ? "نبدأ الرحلة..." : stage === 1 ? "نطور الخطة..." : "ننطلق للوجهة!"}
            </h3>
            <p className={cn("font-bold text-xs mt-2 uppercase tracking-[0.3em] opacity-60 transition-colors duration-500", isDark ? 'text-gray-400' : 'text-gray-400')}>
              {vehicles[stage].subLabel}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modern Progress Bar */}
      <div className="mt-12 w-72 flex flex-col gap-3 items-center">
        <div className={cn("w-full h-1.5 rounded-full overflow-hidden shadow-inner border transition-all duration-500", isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-100')}>
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: ["0%", "100%"], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.span 
          animate={{ opacity: [0.4, 1, 0.4] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className={cn("text-[10px] font-black uppercase tracking-widest transition-colors duration-500", isDark ? 'text-gray-400' : 'text-gray-400')}
        >
          {"جاري التحميل بكل حب"}
        </motion.span>
      </div>
    </motion.div>
  );
};

export default PremiumLoader;

