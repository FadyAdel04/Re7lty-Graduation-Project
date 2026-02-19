import React from 'react';
import { seasonalConfig } from '@/config/seasonalConfig';

const RamadanDivider: React.FC = () => {
  if (!seasonalConfig.isRamadanTheme) return null;
  
  return (
    <div className="ramadan-geometric-divider" />
  );
};

export default RamadanDivider;
