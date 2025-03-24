import React from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Props {
  data: {
    month: string;
    fixedExpenses: number;
    variableExpenses: number;
    subscriptionCosts: number;
    totalExpenses: number;
  }[];
}

export function MonthlyTrendsChart({ data }: Props) {
  const { theme } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  // Calculate the maximum value for better y-axis scaling
  const maxValue = Math.max(
    ...data.map(d => Math.max(
      d.totalExpenses,
      d.fixedExpenses + d.variableExpenses + d.subscriptionCosts
    ))
  );

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

  return (
    <div className="neumorphic-card rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 text-theme-primary">Monthly Trends</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={data} 
            margin={{ top: 40, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="totalExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? '#374151' : '#e2e8f0'} 
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              stroke={isDark ? '#9CA3AF' : '#475569'}
              tick={{ fill: isDark ? '#9CA3AF' : '#475569' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={isDark ? '#9CA3AF' : '#475569'}
              tick={{ fill: isDark ? '#9CA3AF' : '#475569' }}
              tickFormatter={(value) => formatAmount(value, displayCurrency)}
              domain={[0, yAxisMax]}
              tickCount={tickCount}
              axisLine={false}
              tickLine={false}
              width={isBTC ? 120 : 80}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload) return null;
                
                return (
                  <div className="neumorphic-card rounded-lg p-4">
                    <p className="font-medium mb-2">{label}</p>
                    <div className="space-y-2">
                      {payload.map((entry) => (
                        <div key={entry.name} className="flex justify-between gap-4">
                          <span className="text-theme-secondary">{entry.name}:</span>
                          <span className={entry.color}>
                            {formatAmount(entry.value, displayCurrency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            <Legend 
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{
                paddingBottom: '24px',
                marginTop: '-36px'
              }}
            />
            <Area
              type="monotone"
              dataKey="totalExpenses"
              name="Total Expenses"
              stroke="#EF4444"
              fill="url(#totalExpenses)"
              strokeWidth={2}
              dot={false}
            />
            <Bar 
              dataKey="fixedExpenses" 
              name="Fixed Expenses" 
              fill="#10B981" 
              radius={[4, 4, 0, 0]}
              stackId="expenses"
            />
            <Bar 
              dataKey="variableExpenses" 
              name="Variable Expenses" 
              fill="#F59E0B" 
              radius={[4, 4, 0, 0]}
              stackId="expenses"
            />
            <Bar 
              dataKey="subscriptionCosts" 
              name="Subscription Costs" 
              fill="#8B5CF6" 
              radius={[4, 4, 0, 0]}
              stackId="expenses"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}