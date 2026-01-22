import React from 'react';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import PieChart from './charts/PieChart';

interface SalesChartsProps {
  dailyActivityData: any[];
  userGrowthData: any[];
  compositionData: any[];
  loading?: boolean;
}

const SalesCharts: React.FC<SalesChartsProps> = ({
  dailyActivityData,
  userGrowthData,
  compositionData,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Activity Chart (Trips) */}
      <LineChart
        data={dailyActivityData}
        xKey="day"
        yKey="trips"
        title="الرحلات المضافة يومياً (آخر 7 أيام)"
        color="#3b82f6"
        yAxisLabel="عدد الرحلات"
        formatValue={(value) => `${value}`}
      />

      {/* User Growth Chart */}
      <BarChart
        data={userGrowthData}
        xKey="week"
        yKey="users"
        title="المستخدمين الجدد (آخر 7 أيام)"
        color="#10b981"
        formatValue={(value) => `${value}`}
      />

      {/* Composition Chart */}
      <div className="lg:col-span-2">
        <PieChart
          data={compositionData}
          title="توزيع الرحلات (شخصية vs شركات)"
          colors={['#8b5cf6', '#f59e0b']}
        />
      </div>
    </div>
  );
};

export default SalesCharts;
