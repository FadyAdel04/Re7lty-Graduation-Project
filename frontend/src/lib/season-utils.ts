/**
 * Get the current season based on the current month
 * @returns 'winter' | 'summer' | 'fall' | 'spring'
 */
export const getCurrentSeason = (): 'winter' | 'summer' | 'fall' | 'spring' => {
    const month = new Date().getMonth() + 1; // 1-12

    // Northern Hemisphere seasons (Egypt)
    if (month >= 12 || month <= 2) {
        return 'winter'; // December, January, February
    } else if (month >= 3 && month <= 5) {
        return 'spring'; // March, April, May
    } else if (month >= 6 && month <= 8) {
        return 'summer'; // June, July, August
    } else {
        return 'fall'; // September, October, November
    }
};

/**
 * Get season display info with emoji and Arabic label
 */
export const getSeasonInfo = (season: string) => {
    switch (season) {
        case 'winter':
            return { label: 'شتاء', emoji: '❄️', color: 'blue' };
        case 'summer':
            return { label: 'صيف', emoji: '☀️', color: 'orange' };
        case 'fall':
            return { label: 'خريف', emoji: '🍂', color: 'amber' };
        case 'spring':
            return { label: 'ربيع', emoji: '🌸', color: 'green' };
        default:
            return { label: season, emoji: '🌍', color: 'gray' };
    }
};
