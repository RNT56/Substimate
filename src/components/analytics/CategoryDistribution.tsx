import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import type { CategoryAnalytics } from '../../types';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface Props {
  data: CategoryAnalytics[];
}

export function CategoryDistribution({ data }: Props) {
  const { theme } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  return (
    <div className="h-full">
      <h2 className="text-xl font-semibold mb-4 text-theme-primary">Category Distribution</h2>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            dataKey="totalCost"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={150}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((entry, index) => (
              <Cell 
                key={entry.name} 
                fill={isBTC ? '#f7931a' : COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const data = payload[0].payload;
              
              return (
                <div className="p-4 rounded-lg shadow-lg backdrop-blur-md bg-gray-900/95 border border-gray-700">
                  <p className="font-medium text-base mb-2">{data.name}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-theme-secondary">Monthly Cost:</span>
                      <span className="text-emerald-500">
                        {formatAmount(data.totalCost, displayCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-theme-secondary">Services:</span>
                      <span className="text-emerald-500">
                        {data.subscriptionCount}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-theme-secondary">Avg. Cost:</span>
                      <span className="text-emerald-500">
                        {formatAmount(data.averageCostPerService, displayCurrency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}