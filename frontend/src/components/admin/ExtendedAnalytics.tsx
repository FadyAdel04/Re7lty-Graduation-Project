import React from 'react';
import PieChart from './charts/PieChart';
import BarChart from './charts/BarChart';

interface ExtendedAnalyticsProps {
  submissionStats: any[];
  companyStats: any[];
  engagementStats: any[];
  topCompanies: any[];
  loading?: boolean;
}



const ExtendedAnalytics: React.FC<ExtendedAnalyticsProps> = ({
  submissionStats,
  companyStats,
  engagementStats,
  topCompanies,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* 1. Submission Status Pie Chart */}
      <PieChart
        data={submissionStats}
        title="حالة طلبات الانضمام (شركات)"
        colors={['#10b981', '#f59e0b', '#ef4444']}
      />

      {/* 2. Company Activity Bar Chart */}
      <BarChart
        data={companyStats}
        xKey="name"
        yKey="value"
        title="نشاط الشركات (نشط vs غير نشط)"
        color="#8b5cf6"
        formatValue={(value) => `${value}`}
      />

      {/* 3. Engagement Overview Bar Chart */}
      <BarChart
        data={engagementStats}
        xKey="name"
        yKey="value"
        title="نظرة عامة على التفاعل"
        color="#ec4899"
        formatValue={(value) => `${value}`}
      />

      {/* 4. Top Performing Companies Table */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">أفضل الشركات أداءً</h3>
        <div className="space-y-4">
          {topCompanies.map((company: any) => (
            <div key={company._id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <img 
                  src={company.logo || "https://placehold.co/100x100?text=Logo"} 
                  alt={company.name}
                  className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                />
                <div>
                  <p className="font-semibold text-gray-900">{company.name}</p>
                  <p className="text-sm text-gray-500">{company.email}</p>
                </div>
              </div>
              <div className="text-center bg-blue-50 px-3 py-1 rounded-full">
                <span className="text-xs text-gray-600 block">رحلات</span>
                <span className="font-bold text-blue-600">{company.tripsCount || 0}</span>
              </div>
            </div>
          ))}
          {topCompanies.length === 0 && <p className="text-center text-gray-500 py-4">لا توجد شركات حتى الآن</p>}
        </div>
      </div>
    </div>
  );
};

export default ExtendedAnalytics;
