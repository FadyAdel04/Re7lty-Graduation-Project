import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PieChartProps {
  data: { name: string; value: number; }[];
  title: string;
  colors?: string[];
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  colors = COLORS
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = (entry: any) => {
    const percent = ((entry.value / total) * 100).toFixed(0);
    return `${percent}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                direction: 'rtl'
              }}
              formatter={(value: any) => [value.toLocaleString('ar-EG'), 'العدد']}
            />
            <Legend 
              wrapperStyle={{ direction: 'rtl', paddingTop: '10px' }}
              formatter={(value) => value}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
        
        {/* Stats Summary */}
        <div className="mt-4 grid grid-cols-1 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <span className="text-sm font-bold">{item.value.toLocaleString('ar-EG')}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PieChart;
