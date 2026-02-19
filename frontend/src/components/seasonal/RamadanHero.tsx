import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const RamadanHero: React.FC = () => {
  return (
    <section className="ramadan-hero-container min-h-[90vh] text-right" dir="rtl">
      {/* Stars Background */}
      <div className="ramadan-stars-container">
        {Array.from({ length: 50 }).map((_, i) => (
          <div 
            key={i} 
            className="star" 
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`
            }} 
          />
        ))}
      </div>

      {/* Crescent Moon */}
      <motion.div 
        className="ramadan-crescent-moon"
        animate={{ 
          y: [0, -20, 0],
          rotate: [-20, -15, -20]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />

      {/* Hanging Lanterns */}
      <motion.div 
        className="ramadan-hanging-lantern left-[10%] md:left-[20%]"
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="60" height="100" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 0V20" stroke="#D4AF37" strokeWidth="2"/>
          <path d="M15 20H45L55 40L30 80L5 40L15 20Z" fill="#D4AF37" fillOpacity="0.2" stroke="#D4AF37" strokeWidth="2"/>
          <circle cx="30" cy="45" r="10" fill="#D4AF37" fillOpacity="0.6">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <path d="M30 80V100" stroke="#D4AF37" strokeWidth="2"/>
        </svg>
      </motion.div>

      <motion.div 
        className="ramadan-hanging-lantern left-[30%] hidden md:block"
        animate={{ rotate: [5, -5, 5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="40" height="80" viewBox="0 0 40 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0V15" stroke="#D4AF37" strokeWidth="2"/>
          <rect x="10" y="15" width="20" height="40" rx="2" fill="#D4AF37" fillOpacity="0.2" stroke="#D4AF37" strokeWidth="2"/>
          <circle cx="20" cy="35" r="6" fill="#D4AF37" fillOpacity="0.8">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <path d="M20 55V80" stroke="#D4AF37" strokeWidth="2"/>
        </svg>
      </motion.div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mr-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            عِش أجواء <span className="text-gold">رمضان</span> <br />
            في كل مكان
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl font-serif">
            اكتشف أجمل الرحلات والفعاليات الرمضانية، من السحور في الأماكن التراثية إلى صلاة اليام في المساجد العريقة.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-start">
            <Link to="/discover">
              <Button size="lg" className="h-14 px-8 rounded-full bg-gold hover:bg-gold/80 text-navy font-bold text-lg shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all">
                ابدأ رحلتك الرمضانية
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-gold/50 text-gold hover:bg-gold/10 font-bold text-lg">
                خيم رمضانية
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Mosque Silhouette at bottom */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none opacity-40">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[120px]" fill="#050E17">
          <path d="M0,120 L0,100 C100,100 150,50 200,100 C250,150 300,80 350,100 C400,120 450,100 500,80 C550,60 600,100 650,110 C700,120 750,90 800,80 C850,70 900,100 950,110 C1000,120 1100,100 1200,100 L1200,120 Z"></path>
          <path d="M300,120 L300,40 L320,20 L340,40 L340,120 M700,120 L700,30 L730,10 L760,30 L760,120 M1000,120 L1000,50 L1030,20 L1060,50 L1060,120" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.3"></path>
        </svg>
      </div>
    </section>
  );
};

export default RamadanHero;
