import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Props {
  data: {
    name: string;
    value: number;
    count: number;
  }[];
}

export function CategoryDistribution({ data }: Props) {
  const { theme, visualStyle } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const CustomTooltip = ({ active, payload }: any) => {
    const currentTheme = theme;
    const currentStyle = visualStyle;
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div 
          className="themed-tooltip" 
          data-theme={currentTheme}
          data-visual-style={currentStyle}
        >
          <div className="font-semibold mb-1">{entry.name}</div>
          <div className="space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-theme-secondary">Monthly Cost:</span>
              <span className={isBTC ? 'text-chart-btc' : 'text-chart-highlight'} style={{ color: isBTC ? 'var(--chart-color-btc)' : `var(--chart-pie-slice-${(payload[0].payload.index % 5) + 1})` }}>
                {formatAmount(Number(entry.value ?? 0), displayCurrency)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-theme-secondary">Subscriptions:</span>
              <span className={isBTC ? 'text-chart-btc' : 'text-chart-highlight'} style={{ color: isBTC ? 'var(--chart-color-btc)' : `var(--chart-pie-slice-${(payload[0].payload.index % 5) + 1})` }}>
                {entry.count}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="themed-card rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 text-theme-primary">Category Distribution</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={120}
              dataKey="value"
              nameKey="name"
              labelLine={false}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={entry.name} 
                  fill={isBTC ? 'var(--chart-color-btc)' : `var(--chart-pie-slice-${(index % 5) + 1})`}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  stroke={isDark ? '#1F2937' : '#FFFFFF'}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}