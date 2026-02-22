import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  MapPin,
  TrendingUp,
  Eye,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BookingAnalytics } from '@/services/bookingService';

interface SummaryTabProps {
  stats: BookingAnalytics | null;
  tripsCount: number;
  tripsViews?: number;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ stats, tripsCount, tripsViews = 0 }) => {
  const overview = stats?.overview;
  const revenue = stats?.revenue;

  const getColors = (color: string) => {
    const maps: Record<string, string> = {
      indigo: 'bg-indigo-50 text-indigo-600 shadow-indigo-100/50',
      emerald: 'bg-emerald-50 text-emerald-600 shadow-emerald-100/50',
      rose: 'bg-rose-50 text-rose-600 shadow-rose-100/50',
      orange: 'bg-orange-50 text-orange-600 shadow-orange-100/50',
      blue: 'bg-blue-50 text-blue-600 shadow-blue-100/50',
      amber: 'bg-amber-50 text-amber-600 shadow-amber-100/50',
    };
    return maps[color];
  };

  const cards = [
    {
      title: 'إجمالي الحجوزات',
      value: overview?.totalBookings ?? 0,
      icon: Users,
      color: 'indigo',
      change: `+${overview?.todayBookings ?? 0}`,
      label: 'حجوزات اليوم',
    },
    {
      title: 'صافي الأرباح',
      value: revenue?.net ?? 0,
      icon: TrendingUp,
      color: 'rose',
      change: `${revenue?.week ?? 0}`,
      label: 'أرباح الأسبوع',
      isCurrency: true,
    },
    {
      title: 'الرحلات النشطة',
      value: tripsCount,
      icon: MapPin,
      color: 'emerald',
      change: `${tripsCount}`,
      label: 'رحلة شركة',
    },
    {
      title: 'طلبات معلقة',
      value: overview?.pendingBookings ?? 0,
      icon: AlertCircle,
      color: 'amber',
      change: `${overview?.pendingBookings ?? 0}`,
      label: 'تحتاج مراجعة',
    },
    {
      title: 'مشاهدات الرحلات',
      value: tripsViews,
      icon: Eye,
      color: 'blue',
      change: `${tripsCount}`,
      label: 'رحلة نشطة',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="border-0 shadow-md rounded-xl overflow-hidden group hover:scale-[1.01] transition-all">
            <CardContent className="p-3 relative">
              <div className="flex items-center justify-between mb-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-transform',
                    getColors(card.color)
                  )}
                >
                  <card.icon className="w-4 h-4" />
                </div>
                <div className="h-6 px-1.5 rounded-full bg-gray-50 flex items-center gap-0.5 text-[9px] font-black text-gray-400">
                  <ArrowUpRight className="w-2.5 h-2.5 text-emerald-500" />
                  {card.label}
                </div>
              </div>

              <h4 className="text-gray-400 font-bold text-[9px] uppercase tracking-wider mb-0.5">
                {card.title}
              </h4>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-gray-900 leading-none">
                  {card.value.toLocaleString('ar-EG')}
                  {'isCurrency' in card && (
                    <span className="text-[10px] mr-0.5 text-gray-400">ج.م</span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold',
                    card.color === 'rose' && !('isCurrency' in card)
                      ? 'text-rose-500'
                      : 'text-emerald-500'
                  )}
                >
                  {card.change}
                </span>
              </div>

              {/* Decorative Sparkle */}
              <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-current opacity-[0.03] rounded-full blur-2xl pointer-events-none transition-all group-hover:scale-150" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default SummaryTab;
