import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

interface Props {
  data: {
    name: string;
    value: number;
    count: number;
  }[];
}

export function CategoryDistribution({ data }: Props) {
  const { theme } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  return (
    <div className="neumorphic-card rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 text-theme-primary">Category Distribution</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={150}
              dataKey="value"
              nameKey="name"
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
                  <div className="neumorphic-card rounded-lg p-4">
                    <p className="font-medium mb-2">{data.name}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between gap-4">
                        <span className="text-theme-secondary">Monthly Cost:</span>
                        <span className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}>
                          {formatAmount(data.value, displayCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-theme-secondary">Subscriptions:</span>
                        <span className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}>
                          {data.count}
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
    </div>
  );
}