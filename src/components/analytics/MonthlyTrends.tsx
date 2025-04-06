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
  const { theme, visualStyle } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  // Calculate the maximum value for better y-axis scaling
  const maxValue = Math.max(...data.map(d => d.totalCost));
  const yAxisMax = Math.ceil(maxValue / 100) * 0.01;
  const tickCount = Math.min(10, Math.ceil(yAxisMax / 100));

  const CustomTooltip = ({ active, payload, label }: any) => {
    const currentTheme = theme;
    const currentStyle = visualStyle;
    if (active && payload && payload.length) {
      return (
        <div 
          className="themed-tooltip" 
          data-theme={currentTheme}
          data-visual-style={currentStyle}
        >
          <div className="font-semibold mb-1">{label}</div>
          <div className="flex justify-between">
            <span className="text-theme-secondary">Total Cost:</span>
            <span className={isBTC ? 'text-chart-btc' : 'text-chart-positive'}>
              {formatAmount(Number(payload[0].value ?? 0), displayCurrency)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="themed-card p-6 rounded-lg shadow-md overflow-hidden">
      <h2 className="text-xl font-semibold mb-4 text-theme-primary">Monthly Trends</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-color)" />
          <XAxis
            dataKey="month"
            stroke="var(--chart-axis-color)"
            tick={{ fill: "var(--chart-text-color)" }}
          />
          <YAxis
            stroke="var(--chart-axis-color)"
            tick={{ fill: "var(--chart-text-color)" }}
            tickFormatter={(value) => formatAmount(value, displayCurrency)}
            domain={[0, yAxisMax]}
            tickCount={tickCount}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="totalCost"
            name="Total Cost"
            stroke={isBTC ? 'var(--chart-color-btc)' : 'var(--chart-line-stroke)'} 
            strokeWidth={2}
            dot={{
              stroke: isBTC ? 'var(--chart-color-btc)' : 'var(--chart-line-dot-stroke)',
              strokeWidth: 2,
              r: 4,
              fill: 'var(--chart-line-dot-fill)'
            }}
            activeDot={{
              stroke: isBTC ? 'var(--chart-color-btc)' : 'var(--chart-line-dot-stroke)',
              strokeWidth: 2,
              r: 6,
              fill: 'var(--chart-line-dot-fill)'
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}