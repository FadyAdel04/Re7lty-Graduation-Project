// Dates for Ramadan (estimated for 2026-2027)
// 2026: Feb 18 - Mar 19
// 2027: Feb 8 - Mar 9
const RAMADAN_2026_START = new Date('2026-02-18');
const RAMADAN_2026_END = new Date('2026-03-19');

export type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'ramadan';

export const getCurrentSeason = (): Season => {
    const now = new Date();

    // High priority: Ramadan check (if within 2026 dates - can extend this later)
    if (now >= RAMADAN_2026_START && now <= RAMADAN_2026_END) {
        return 'ramadan';
    }

    const month = now.getMonth(); // 0 is January, 1 is February, etc.

    // Northern Hemisphere seasons
    // Winter: Dec, Jan, Feb
    if (month === 11 || month === 0 || month === 1) {
        return 'winter';
    }
    // Spring: Mar, Apr, May
    if (month >= 2 && month <= 4) {
        return 'spring';
    }
    // Summer: Jun, Jul, Aug
    if (month >= 5 && month <= 7) {
        return 'summer';
    }
    // Autumn: Sep, Oct, Nov
    return 'autumn';
};

export const seasonalConfig = {
    currentSeason: getCurrentSeason(),
    // Backward compatibility if needed:
    isRamadanTheme: getCurrentSeason() === 'ramadan',
    seasons: {
        winter: {
            name: 'الشتاء',
            nameEn: 'Winter',
            primaryColor: '#3b82f6', // blue
            accentColor: '#93c5fd', // lighter blue
            icon: 'Snowflake',
        },
        spring: {
            name: 'الربيع',
            nameEn: 'Spring',
            primaryColor: '#10b981', // green
            accentColor: '#6ee7b7', // lighter green
            icon: 'Flower',
        },
        summer: {
            name: 'الصيف',
            nameEn: 'Summer',
            primaryColor: '#f59e0b', // amber
            accentColor: '#fcd34d', // lighter amber
            icon: 'Sun',
        },
        autumn: {
            name: 'الخريف',
            nameEn: 'Autumn',
            primaryColor: '#ea580c', // orange-700
            accentColor: '#fb923c', // orange-400
            icon: 'Leaf',
        },
        ramadan: {
            name: 'رمضان',
            nameEn: 'Ramadan',
            primaryColor: '#D4AF37', // gold
            accentColor: '#0B1C2D', // navy
            icon: 'Moon',
        }
    }
};
