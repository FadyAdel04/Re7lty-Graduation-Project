import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Star, X } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

const RamadanDecorations: React.FC = () => {
  const [showPopup, setShowPopup] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 5,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);

    // Auto-hide popup after 10 seconds if not closed
    const timer = setTimeout(() => setShowPopup(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="ramadan-decorations-root">
      {/* Global Helal (Crescent Moon) */}
      <motion.div 
        className="fixed top-24 right-[10%] opacity-20 pointer-events-none z-0 hidden lg:block"
        animate={{ 
          opacity: [0.1, 0.3, 0.1],
          y: [0, -10, 0]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Moon size={200} fill="#D4AF37" color="#D4AF37" />
      </motion.div>

      {/* Hanging Lights (Lamps/Fanous) at top */}
      <div className="ramadan-lights-string">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
             <div className="w-[1px] h-4 bg-gold/50" />
             <div 
               className="ramadan-light-bulb" 
               style={{ 
                 animationDelay: `${i * 0.3}s`,
                 clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", // Hexagon/Lantern shape
                 width: '14px',
                 height: '22px'
               }} 
             />
          </div>
        ))}
      </div>

      {/* Floating Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="ramadan-particle"
          initial={{ opacity: 0, x: `${p.x}vw`, y: '110vh' }}
          animate={{ 
            opacity: [0, 0.4, 0],
            y: '-10vh',
            x: [`${p.x}vw`, `${p.x + (Math.random() * 10 - 5)}vw`]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {Math.random() > 0.5 ? (
            <Star size={p.size} fill="#D4AF37" color="#D4AF37" />
          ) : (
            <Moon size={p.size} fill="#D4AF37" color="#D4AF37" />
          )}
        </motion.div>
      ))}

      {/* Corner Lanterns */}
      <motion.div 
        className="fixed bottom-10 left-10 z-50 pointer-events-none hidden md:block"
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="60" height="90" viewBox="0 0 40 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0V10" stroke="#D4AF37" strokeWidth="2"/>
          <path d="M10 10H30L35 25L20 50L5 25L10 10Z" fill="#D4AF37" fillOpacity="0.3" stroke="#D4AF37" strokeWidth="2"/>
          <circle cx="20" cy="27" r="5" fill="#D4AF37">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </motion.div>

      <motion.div 
        className="fixed bottom-10 right-10 z-50 pointer-events-none hidden md:block"
        animate={{ rotate: [8, -8, 8] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="50" height="80" viewBox="0 0 35 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5 0V8" stroke="#D4AF37" strokeWidth="2"/>
          <rect x="7" y="8" width="21" height="30" rx="2" fill="#D4AF37" fillOpacity="0.2" stroke="#D4AF37" strokeWidth="2"/>
          <circle cx="17.5" cy="23" r="4" fill="#D4AF37">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </motion.div>

      {/* Greeting Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="ramadan-greeting-popup"
          >
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-gold hover:opacity-70 transition-opacity"
            >
              <X size={24} />
            </button>
            <h2 className="ramadan-greeting-text">رمضان كريم</h2>
            <p className="text-xl text-white/80 font-serif">كل عام وأنتم بخير ✨🌙</p>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="mt-6 inline-block"
            >
              <Star size={32} fill="#D4AF37" color="#D4AF37" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* corner lanterns on some pages could be handled here or in specific components */}
    </div>
  );
};

export default RamadanDecorations;
