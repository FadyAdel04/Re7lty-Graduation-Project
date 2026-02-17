import { formatDistanceToNow, format, isYesterday } from 'date-fns';
import { arEG } from 'date-fns/locale';

export const formatFacebookDate = (date: string | Date | undefined) => {
    if (!date) return '';

    // Check if it's already a relative string (contains Arabic characters like "منذ")
    if (typeof date === 'string' && (date.includes('منذ') || /[\u0600-\u06FF]/.test(date))) {
        return date;
    }

    const d = new Date(date);
    // If invalid date (e.g. "Just now" in English but unrecognized), return original string
    if (isNaN(d.getTime())) return typeof date === 'string' ? date : '';

    const now = new Date();

    // Calculate difference in milliseconds
    const diff = now.getTime() - d.getTime();
    const diffInMinutes = diff / (1000 * 60);
    const diffInHours = diff / (1000 * 60 * 60);

    // Less than 1 minute
    if (diffInMinutes < 1) {
        return 'الآن';
    }

    // Less than 24 hours: Relative time (e.g. "since 2 hours")
    if (diffInHours < 24) {
        return formatDistanceToNow(d, { addSuffix: true, locale: arEG })
            .replace('حوالي ', '') // Remove "about" for cleaner look
            .replace('أقل من دقيقة', 'الآن');
    }

    // Yesterday
    if (isYesterday(d)) {
        return `أمس في ${format(d, 'p', { locale: arEG })}`;
    }

    // Same year: "24 October at 5:00 PM"
    if (d.getFullYear() === now.getFullYear()) {
        return format(d, "d MMMM 'في' p", { locale: arEG });
    }

    // Different year: "24 October 2023 at 5:00 PM"
    return format(d, "d MMMM yyyy 'في' p", { locale: arEG });
};
