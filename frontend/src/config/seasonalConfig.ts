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
            primaryColor: '#0ea5e9', // sky-500
            accentColor: '#38bdf8', // sky-400
            secondaryColor: '#0c4a6e', // sky-900
            bgColor: '#f0f9ff', // sky-50
            textColor: '#0c4a6e', // sky-900
            gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
            fontFamily: "'Outfit', sans-serif",
            backgroundImage: '/src/assets/seasons/winter.png',
            icon: 'Snowflake',
        },
        spring: {
            name: 'الربيع',
            nameEn: 'Spring',
            primaryColor: '#10b981', // emerald-500
            accentColor: '#34d399', // emerald-400
            secondaryColor: '#064e3b', // emerald-900
            bgColor: '#ecfdf5', // emerald-50
            textColor: '#064e3b', // emerald-900
            gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            fontFamily: "'Poppins', sans-serif",
            backgroundImage: '/src/assets/seasons/spring.png',
            icon: 'Flower',
        },
        summer: {
            name: 'الصيف',
            nameEn: 'Summer',
            primaryColor: '#f59e0b', // amber-500
            accentColor: '#fbbf24', // amber-400
            secondaryColor: '#78350f', // amber-900
            bgColor: '#fffbeb', // amber-50
            textColor: '#78350f', // amber-900
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            fontFamily: "'Montserrat', sans-serif",
            backgroundImage: '/src/assets/seasons/summer.png',
            icon: 'Sun',
        },
        autumn: {
            name: 'الخريف',
            nameEn: 'Autumn',
            primaryColor: '#ea580c', // orange-600
            accentColor: '#fb923c', // orange-400
            secondaryColor: '#7c2d12', // orange-900
            bgColor: '#fff7ed', // orange-50
            textColor: '#7c2d12', // orange-900
            gradient: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
            fontFamily: "'Merriweather', serif",
            backgroundImage: '/src/assets/seasons/autumn.png',
            icon: 'Leaf',
        },
        ramadan: {
            name: 'رمضان',
            nameEn: 'Ramadan',
            primaryColor: '#D4AF37', // gold
            accentColor: '#0B1C2D', // navy
            secondaryColor: '#050E17', // deep navy
            bgColor: '#0B1C2D',
            textColor: '#F5F5F5',
            gradient: 'linear-gradient(135deg, #D4AF37 0%, #0B1C2D 100%)',
            fontFamily: "'Tajawal', sans-serif",
            backgroundImage: '/src/assets/seasons/ramadan.png', // This might not exist yet, but for consistency
            icon: 'Moon',
        }
    }
};
