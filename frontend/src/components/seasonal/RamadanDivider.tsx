import React from 'react';
import { useSeasonalTheme } from '@/contexts/SeasonalThemeContext';

const RamadanDivider: React.FC = () => {
  const { isSeasonalActive, currentSeason } = useSeasonalTheme();
  
  if (!isSeasonalActive || currentSeason !== 'ramadan') return null;
  
  return (
    <div className="ramadan-geometric-divider" />
  );
};

export default RamadanDivider;
