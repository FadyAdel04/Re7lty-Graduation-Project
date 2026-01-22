import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  ShoppingCart,
  Plane,
  Users,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

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
      value: stats.totalUsers.toLocaleString('ar-EG'),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: `+${stats.weeklyActiveUsers}`,
      changeLabel: 'نشط أسبوعياً',
      changeColor: 'text-blue-600'
    },
    {
      title: 'الرحلات والمنشورات',
      value: stats.totalTrips.toLocaleString('ar-EG'),
      icon: Plane,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: `+${stats.weeklyTrips}`,
      changeLabel: 'هذا الأسبوع',
      changeColor: 'text-purple-600'
    },
    {
      title: 'التفاعلات',
      value: stats.totalReactions.toLocaleString('ar-EG'),
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: `+${stats.weeklyReactions}`,
      changeLabel: 'تفاعل جديد',
      changeColor: 'text-red-600'
    },
    {
      title: 'التعليقات',
      value: stats.totalComments.toLocaleString('ar-EG'),
      icon: ShoppingCart, // Using generic icon as MessageCircle is not imported
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: `+${stats.weeklyComments}`,
      changeLabel: 'تعليق جديد',
      changeColor: 'text-orange-600'
    },
    {
      title: 'الشركات المتعاقدة',
      value: stats.totalCompanies.toLocaleString('ar-EG'),
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: `${stats.totalCorporateTrips}`,
      changeLabel: 'رحلة شركة',
      changeColor: 'text-green-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`h-10 w-10 rounded-full ${card.bgColor} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-md font-bold ${card.changeColor}`}>
                  {card.change}
                </span>
                <span className="text-xs text-gray-500">{card.changeLabel}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default KPICards;
