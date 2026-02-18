import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TripCountdownProps {
    startDate: string | Date;
    className?: string;
}

export const TripCountdown = ({ startDate, className }: TripCountdownProps) => {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(startDate) - +new Date();
            
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft(null);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [startDate]);

    if (!timeLeft) {
        return (
            <div className={cn("flex items-center gap-1.5 text-xs font-bold text-emerald-600", className)}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>الرحلة بدأت</span>
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-2 text-xs font-black", className)}>
            <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                <span>ينطلق في:</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="text-gray-900">{timeLeft.days}ي</span>
                <span className="text-gray-400">:</span>
                <span className="text-gray-900">{timeLeft.hours}س</span>
                <span className="text-gray-400">:</span>
                <span className="text-gray-900">{timeLeft.minutes}د</span>
                <span className="text-gray-400">:</span>
                <span className="text-gray-900 text-[10px] w-4">{timeLeft.seconds}ث</span>
            </div>
        </div>
    );
};
