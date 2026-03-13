import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { seasonalConfig, Season } from '@/config/seasonalConfig';

interface SeasonalThemeContextType {
  isSeasonalActive: boolean; // User preference (true = show current season theme)
  toggleSeasonalTheme: () => void;
  currentSeason: Season;
  themeConfig: any; // The config for the active season
}

const SeasonalThemeContext = createContext<SeasonalThemeContextType | undefined>(undefined);

export const SeasonalThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const currentSeason = seasonalConfig.currentSeason;
  const themeConfig = seasonalConfig.seasons[currentSeason];
  
  // Persist the user preference for seasonal theme
  const [isSeasonalActive, setIsSeasonalActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('re7lty_seasonal_theme_active');
    // Default to true as requested (seasonal theme is default)
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('re7lty_seasonal_theme_active', JSON.stringify(isSeasonalActive));
    
    // Manage body classes for global theme overrides (important for CSS)
    const body = document.body;
    // Clean up previous classes
    ['winter', 'spring', 'summer', 'autumn', 'ramadan'].forEach(s => body.classList.remove(`${s}-theme`));
    
    if (isSeasonalActive) {
      body.classList.add(`${currentSeason}-theme`);
    } else {
      body.classList.add('normal-theme');
    }
  }, [isSeasonalActive, currentSeason]);

  const toggleSeasonalTheme = () => {
    setIsSeasonalActive(prev => !prev);
  };

  return (
    <SeasonalThemeContext.Provider value={{ 
      isSeasonalActive, 
      toggleSeasonalTheme, 
      currentSeason,
      themeConfig 
    }}>
      {children}
    </SeasonalThemeContext.Provider>
  );
};

export const useSeasonalTheme = () => {
  const context = useContext(SeasonalThemeContext);
  if (context === undefined) {
    throw new Error('useSeasonalTheme must be used within a SeasonalThemeProvider');
  }
  return context;
};
