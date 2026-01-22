import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LineChartProps {
  data: any[];
  xKey: string;
  yKey?: string; // Optional for backward compatibility
  lines?: Array<{ key: string; name: string; color: string }>; // For multiple lines
  title: string;
  color?: string;
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  yKey,
  lines,
  title,
  color = '#3b82f6',
  yAxisLabel,
  formatValue = (value) => value.toLocaleString('ar-EG')
}) => {
  // Use lines if provided, otherwise fall back to single yKey
  const lineConfigs = lines || (yKey ? [{ key: yKey, name: yKey, color }] : []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            {lineConfigs.map((lineConfig) => (
              <Line 
                key={lineConfig.key}
                type="monotone" 
                dataKey={lineConfig.key}
                name={lineConfig.name}
                stroke={lineConfig.color} 
                strokeWidth={2}
                dot={{ fill: lineConfig.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default LineChart;
