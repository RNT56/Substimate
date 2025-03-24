import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface MonthlyTrendData {
  month: string;
  totalCost: number;
}

interface Props {
  data: MonthlyTrendData[];
}

export function MonthlyTrends({ data }: Props) {
  const { theme } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  // Calculate the maximum value for better y-axis scaling
  const maxValue = Math.max(...data.map(d => d.totalCost));
  const yAxisMax = Math.ceil(maxValue / 100) * 0.01;
  const tickCount = Math.min(10, Math.ceil(yAxisMax / 100));

  return (
    <div className="h-full">
      <h2 className="text-xl font-semibold mb-4 text-theme-primary">Monthly Trends</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e2e8f0'} />
          <XAxis 
            dataKey="month" 
            stroke={isDark ? '#9CA3AF' : '#475569'}
            tick={{ fill: isDark ? '#9CA3AF' : '#475569' }}
          />
          <YAxis 
            stroke={isDark ? '#9CA3AF' : '#475569'}
            tick={{ fill: isDark ? '#9CA3AF' : '#475569' }}
            tickFormatter={(value) => formatAmount(value, displayCurrency)}
            domain={[0, yAxisMax]}
            tickCount={tickCount}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              
              return (
                <div className="p-4 rounded-lg shadow-lg backdrop-blur-md bg-gray-900/95 border border-gray-700">
                  <p className="font-medium text-base mb-2">{label}</p>
                  <div className="flex justify-between gap-4">
                    <span className="text-theme-secondary">Total Cost:</span>
                    <span className={isBTC ? 'text-[#f7931a]' : 'text-emerald-500'}>
                      {formatAmount(payload[0].value, displayCurrency)}
                    </span>
                  </div>
                </div>
              );
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="totalCost"
            name="Total Cost"
            stroke={isBTC ? '#f7931a' : '#10B981'} 
            strokeWidth={2}
            dot={{
              stroke: isBTC ? '#f7931a' : '#10B981',
              strokeWidth: 2,
              r: 4,
              fill: isDark ? '#1f2937' : '#ffffff'
            }}
            activeDot={{
              stroke: isBTC ? '#f7931a' : '#10B981',
              strokeWidth: 2,
              r: 6,
              fill: isDark ? '#1f2937' : '#ffffff'
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}