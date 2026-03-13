import React, { ReactNode } from 'react';
import { useSeasonalTheme } from '@/contexts/SeasonalThemeContext';
import RamadanDecorations from './RamadanDecorations';
import '@/styles/ramadan-theme.css';
import '@/styles/seasonal-themes.css';

interface RamadanThemeProps {
  children: ReactNode;
}

const RamadanTheme: React.FC<RamadanThemeProps> = ({ children }) => {
  const { isSeasonalActive, currentSeason } = useSeasonalTheme();

  if (!isSeasonalActive) {
    return <>{children}</>;
  }

  // If seasonal theme is active, we render the specific decorations
  // For now, only Ramadan has specific complex decorations.
  // Other seasons could have their own components here.
  return (
    <div className={`seasonal-theme-layer ${currentSeason}-theme-layer`}>
      {currentSeason === 'ramadan' && <RamadanDecorations />}
      {/* If it's a regular season, we can optionally add generic decorations here */}
      {['winter', 'spring', 'summer', 'autumn'].includes(currentSeason) && (
        <SeasonalGenericDecorations season={currentSeason} />
      )}
      {children}
    </div>
  );
};

// Simple shared generic decorations for non-Ramadan seasons
const SeasonalGenericDecorations = ({ season }: { season: string }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
       {/* Simple generic seasonal particles could go here */}
       {/* For brevity, I'll add a few floating symbols */}
       <div className={`absolute top-10 right-10 opacity-30 text-[4rem]`}>
          {season === 'winter' && '❄️'}
          {season === 'spring' && '🌸'}
          {season === 'summer' && '☀️'}
          {season === 'autumn' && '🍂'}
       </div>
    </div>
  );
}

export default RamadanTheme;
