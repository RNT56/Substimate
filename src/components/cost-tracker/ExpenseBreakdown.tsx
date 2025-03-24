import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Props {
  data: {
    name: string;
    value: number;
  }[];
}

export function ExpenseBreakdown({ data }: Props) {
  const { theme } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  // Calculate the maximum value for better y-axis scaling
  const maxValue = Math.max(...data.map(d => d.value));
  
  // Calculate nice round numbers for the y-axis scale
  const calculateYAxisMax = (value: number) => {
    if (isBTC) {
      // For BTC (sats), round up to nearest:
      // - 100 if under 1k
      // - 1,000 if under 10k
      // - 10,000 if under 100k
      // - 100,000 if under 1M
      if (value < 1000) return Math.ceil(value / 100) * 0.01;
      if (value < 10000) return Math.ceil(value / 1000) * 0.1;
      if (value < 100000) return Math.ceil(value / 10000) * 1;
      if (value < 1000000) return Math.ceil(value / 100000) * 10;
      return Math.ceil(value / 1000000) * 1000000;
    }
    // For fiat, round up to nearest 100
    return Math.ceil(value / 100) * 100;
  };

  const yAxisMax = calculateYAxisMax(maxValue);

  // Calculate optimal tick count based on the range
  const getTickCount = () => {
    if (isBTC) {
      if (yAxisMax <= 1) return 5;
      if (yAxisMax <= 10) return 5;
      if (yAxisMax <= 100) return 5;
      if (yAxisMax <= 1000) return 5;
      return 5;
    }
    return Math.min(10, Math.ceil(yAxisMax / 100));
  };

  const tickCount = getTickCount();

  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="neumorphic-card rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 text-theme-primary">Expense Breakdown</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? '#374151' : '#e2e8f0'} 
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              stroke={isDark ? '#9CA3AF' : '#475569'}
              tick={{ 
                fill: isDark ? '#9CA3AF' : '#475569',
                fontSize: 12
              }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={isDark ? '#9CA3AF' : '#475569'}
              tick={{ 
                fill: isDark ? '#9CA3AF' : '#475569',
                fontSize: 12
              }}
              tickFormatter={(value) => formatAmount(value, displayCurrency)}
              domain={[0, yAxisMax]}
              tickCount={tickCount}
              axisLine={false}
              tickLine={false}
              width={isBTC ? 120 : 80}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload;
                
                return (
                  <div className="neumorphic-card rounded-lg p-4">
                    <p className="font-medium mb-2">{label}</p>
                    <div className="flex justify-between gap-4">
                      <span className="text-theme-secondary">Amount:</span>
                      <span className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}>
                        {formatAmount(data.value, displayCurrency)}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar 
              dataKey="value" 
              fill={isBTC ? '#f7931a' : '#10B981'}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}