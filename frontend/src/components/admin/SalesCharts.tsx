import React from 'react';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import PieChart from './charts/PieChart';

interface SalesChartsProps {
  dailySalesData: { day: string; sales: number; }[];
  weeklySalesData: { week: string; sales: number; }[];
  orderStatusData: { name: string; value: number; }[];
  loading?: boolean;
}

const SalesCharts: React.FC<SalesChartsProps> = ({
  dailySalesData,
  weeklySalesData,
  orderStatusData,
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
      {/* Daily Sales Chart */}
      <LineChart
        data={dailySalesData}
        xKey="day"
        yKey="sales"
        title="مبيعات الرحلات اليومية (آخر 7 أيام)"
        color="#3b82f6"
        formatValue={(value) => `${value.toLocaleString('ar-EG')} جنيه`}
      />

      {/* Weekly Sales Chart */}
      <BarChart
        data={weeklySalesData}
        xKey="week"
        yKey="sales"
        title="مبيعات الرحلات الأسبوعية (آخر 4 أسابيع)"
        color="#10b981"
        formatValue={(value) => `${value.toLocaleString('ar-EG')} جنيه`}
      />

      {/* Order Status Chart */}
      <div className="lg:col-span-2">
        <PieChart
          data={orderStatusData}
          title="حالة الطلبات"
          colors={['#10b981', '#f59e0b', '#ef4444']}
        />
      </div>
    </div>
  );
};

export default SalesCharts;
