import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  MessageCircle,
  Plane,
  Users,
  CheckCircle2,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KPICardsProps {
  stats: {
    totalUsers: number;
    weeklyActiveUsers: number;
    totalTrips: number;
    weeklyTrips: number;
    totalReactions: number;
    weeklyReactions: number;
    totalComments: number;
    weeklyComments: number;
    totalCompanies: number;
    totalCorporateTrips: number;
  };
  loading?: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ stats, loading = false }) => {
  const cards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats.totalUsers,
      icon: Users,
      color: 'indigo',
      change: `+${stats.weeklyActiveUsers}`,
      label: 'نشط أسبوعياً',
    },
    {
      title: 'الرحلات والمنشورات',
      value: stats.totalTrips,
      icon: Plane,
      color: 'emerald',
      change: `+${stats.weeklyTrips}`,
      label: 'هذا الأسبوع',
    },
    {
      title: 'إجمالي التفاعلات',
      value: stats.totalReactions,
      icon: TrendingUp,
      color: 'rose',
      change: `+${stats.weeklyReactions}`,
      label: 'تفاعل جديد',
    },
    {
      title: 'التعليقات والمشاركات',
      value: stats.totalComments,
      icon: MessageCircle,
      color: 'orange',
      change: `+${stats.weeklyComments}`,
      label: 'تعليق جديد',
    },
    {
      title: 'الشركات والشركاء',
      value: stats.totalCompanies,
      icon: CheckCircle2,
      color: 'blue',
      change: `${stats.totalCorporateTrips}`,
      label: 'رحلة شركة',
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-white rounded-3xl animate-pulse shadow-sm min-w-0" />
        ))}
      </div>
    );
  }

  const getColors = (color: string) => {
    const maps: Record<string, string> = {
      indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100/50",
      emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
      rose: "bg-rose-50 text-rose-600 shadow-rose-100/50",
      orange: "bg-orange-50 text-orange-600 shadow-orange-100/50",
      blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
    };
    return maps[color];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
           <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-500">
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12", getColors(card.color))}>
                     <card.icon className="w-6 h-6" />
                  </div>
                  <div className="h-8 px-2.5 rounded-full bg-gray-50 flex items-center gap-1 text-[10px] font-black text-gray-400">
                     <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                     {card.label}
                  </div>
               </div>
               
               <h4 className="text-gray-400 font-black text-[10px] uppercase tracking-wider mb-1">{card.title}</h4>
               <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900 leading-none">
                    {card.value.toLocaleString('ar-EG')}
                  </span>
                  <span className={cn("text-xs font-black", card.color === 'rose' ? 'text-rose-500' : 'text-emerald-500')}>
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

export default KPICards;
