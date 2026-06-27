import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Props {
  data: {
    name: string;
    totalSpent: number;
    monthlyCost: number;
    months: number;
    startDate: string;
    billingPeriod: string;
    usageState: string;
  }[];
  loading: boolean;
  isMobile: boolean;
}

export function LifetimeCosts({ data, loading, isMobile }: Props) {
  const { theme, visualStyle } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isBTC = displayCurrency === 'BTC';
  const [chartColors, setChartColors] = useState({ btc: '#f7931a', default: '#8884d8' });

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      const btcColor = computedStyle.getPropertyValue('--chart-color-btc').trim() || '#f7931a';
      const defaultColor = computedStyle.getPropertyValue('--chart-bar-fill').trim() || '#8884d8';
      setChartColors({ btc: btcColor, default: defaultColor });
    }
  }, [theme, visualStyle]);

  // Calculate max value for dynamic scaling
  const maxValue = data.length > 0 ? Math.max(...data.map(item => item.totalSpent)) : 0;
  // Add some padding (e.g., 20% of max value) to the domain max
  const domainMax = maxValue * 1.2;

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
            <span className="text-theme-secondary">Total Spent:</span>
            <span className={isBTC ? 'text-chart-btc' : 'text-chart-highlight'}>
              {formatAmount(Number(payload[0].value ?? 0), displayCurrency)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <p className="text-theme-secondary">Loading lifetime costs...</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 text-theme-secondary">Service</th>
              <th className="text-right py-2 text-theme-secondary">Total Spent</th>
              <th className="text-right py-2 text-theme-secondary">Monthly</th>
            </tr>
          </thead>
          <tbody>
            {data.map((cost) => (
              <tr key={cost.name} className="border-b border-gray-700/50">
                <td className="py-2 text-theme-primary">{cost.name}</td>
                <td className="text-right py-2 text-emerald-400">
                  {formatAmount(cost.totalSpent, displayCurrency)}
                </td>
                <td className="text-right py-2 text-emerald-400">
                  {formatAmount(cost.monthlyCost, displayCurrency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="themed-card p-6 rounded-lg shadow-md overflow-hidden">
      <h2 className="text-xl font-semibold mb-4 text-theme-primary">Lifetime Costs</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-color)" />
          <XAxis
            type="number"
            stroke="var(--chart-axis-color)"
            tick={{ fill: "var(--chart-text-color)" }}
            tickFormatter={(value) => formatAmount(value, displayCurrency)}
            domain={[0, domainMax]}
            allowDataOverflow={true}
            scale="linear"
          />
          <YAxis
            dataKey="name"
            type="category"
            stroke="var(--chart-axis-color)"
            tick={{ fill: "var(--chart-text-color)" }}
            width={150}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="totalSpent"
            name="Total Spent"
            fill={isBTC ? chartColors.btc : chartColors.default}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
