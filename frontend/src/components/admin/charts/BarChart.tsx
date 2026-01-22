import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  title: string;
  color?: string;
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  title,
  color = '#10b981',
  yAxisLabel,
  formatValue = (value) => value.toLocaleString('ar-EG')
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xKey} 
              stroke="#6b7280"
              style={{ fontSize: '12px', fontFamily: 'inherit' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px', fontFamily: 'inherit' }}
              tickFormatter={formatValue}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                direction: 'rtl'
              }}
              formatter={(value: any) => [formatValue(Number(value)), yKey]}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Legend 
              wrapperStyle={{ direction: 'rtl', paddingTop: '10px' }}
            />
            <Bar 
              dataKey={yKey} 
              fill={color}
              radius={[8, 8, 0, 0]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BarChart;
