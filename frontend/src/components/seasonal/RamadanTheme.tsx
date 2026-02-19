import React, { ReactNode } from 'react';
import { seasonalConfig } from '@/config/seasonalConfig';
import RamadanDecorations from './RamadanDecorations';
import '@/styles/ramadan-theme.css';

interface RamadanThemeProps {
  children: ReactNode;
}

const RamadanTheme: React.FC<RamadanThemeProps> = ({ children }) => {
  if (!seasonalConfig.isRamadanTheme) {
    return <>{children}</>;
  }

  return (
    <div className="ramadan-theme-layer">
      <RamadanDecorations />
      {children}
    </div>
  );
};

export default RamadanTheme;
