import React, { ReactNode } from 'react';
import { useSeasonalTheme } from '@/contexts/SeasonalThemeContext';
import RamadanDecorations from './RamadanDecorations';
import SeasonalDecorations from './SeasonalDecorations';
import '@/styles/ramadan-theme.css';
import '@/styles/seasonal-themes.css';

interface RamadanThemeProps {
  children: ReactNode;
}

const RamadanTheme: React.FC<RamadanThemeProps> = ({ children }) => {
  const { isSeasonalActive, currentSeason } = useSeasonalTheme();

  return (
    <div className={`seasonal-theme-wrapper ${isSeasonalActive ? `${currentSeason}-theme` : 'normal-theme'}`}>
      {isSeasonalActive && currentSeason === 'ramadan' && <RamadanDecorations />}
      {isSeasonalActive && ['winter', 'spring', 'summer', 'autumn'].includes(currentSeason) && (
        <SeasonalDecorations />
      )}
      {children}
    </div>
  );
};

export default RamadanTheme;
