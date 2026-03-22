import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Snowflake, Flower, Sun, Leaf, Sprout, Wind, Waves, CloudSnow, Bird } from 'lucide-react';
import { useSeasonalTheme } from '@/contexts/SeasonalThemeContext';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  icon: any;
}

const SeasonalDecorations: React.FC = () => {
  const { isSeasonalActive, currentSeason } = useSeasonalTheme();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isSeasonalActive || currentSeason === 'ramadan') {
      setParticles([]);
      return;
    }

    const iconsMap = {
      winter: [Snowflake, CloudSnow, Snowflake],
      spring: [Flower, Sprout, Bird],
      summer: [Sun, Sun, Waves],
      autumn: [Leaf, Wind, Leaf],
    };

    const seasonIcons = iconsMap[currentSeason as keyof typeof iconsMap] || [Snowflake];

    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 15 + 10,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      icon: seasonIcons[Math.floor(Math.random() * seasonIcons.length)],
    }));
    setParticles(newParticles);
  }, [isSeasonalActive, currentSeason]);

  if (!isSeasonalActive) return null;
  if (currentSeason === 'ramadan') return null; // Ramadan has its own decorations

  return (
    <div className="seasonal-decorations-root fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* Background Overlay */}
      <div className="seasonal-bg-overlay" />

      {/* Floating Particles */}
      {particles.map((p) => {
        const Icon = p.icon;
        return (
          <motion.div
            key={p.id}
            className={`seasonal-particle particle-${currentSeason}`}
            initial={{ opacity: 0, x: `${p.x}vw`, y: '-10vh' }}
            animate={{ 
              opacity: [0, 0.6, 0.6, 0],
              y: '110vh',
              x: [`${p.x}vw`, `${p.x + (Math.random() * 15 - 7.5)}vw`]
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ position: 'absolute' }}
          >
            <Icon size={p.size} strokeWidth={1} />
          </motion.div>
        );
      })}

      {/* Large Decorative Icon in corner */}
      <motion.div 
        className="fixed bottom-[-50px] left-[-50px] opacity-10 blur-sm pointer-events-none z-0 hidden lg:block"
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {currentSeason === 'winter' && <Snowflake size={400} />}
        {currentSeason === 'spring' && <Flower size={400} />}
        {currentSeason === 'summer' && <Sun size={400} />}
        {currentSeason === 'autumn' && <Leaf size={400} />}
      </motion.div>
    </div>
  );
};

export default SeasonalDecorations;
