import React, { useEffect, useState, useRef } from 'react';
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
  const { theme, visualStyle } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isBTC = displayCurrency === 'BTC';
  const chartRef = useRef<HTMLDivElement>(null);
  const [computedStyles, setComputedStyles] = useState({
    gridStroke: '#e2e8f0',
    gridDasharray: '3 3',
    axisStroke: '#475569',
    tickFill: '#475569',
    legendColor: '#475569',
    areaColor: '#EF4444',
    areaOpacity1: 0.1,
    areaOpacity2: 0.5,
    btcDasharray: '5 5',
    // barRadius: [4, 4, 0, 0], // Note: Radius prop needs numbers, CSS var is string
  });

  useEffect(() => {
    if (chartRef.current) {
      const styles = getComputedStyle(chartRef.current);
      setComputedStyles({
        gridStroke: styles.getPropertyValue('--chart-grid-color').trim() || (theme === 'dark' ? '#374151' : '#e2e8f0'),
        gridDasharray: styles.getPropertyValue('--chart-grid-stroke-dasharray').trim().replace(/"/g, '') || '3 3',
        axisStroke: styles.getPropertyValue('--chart-axis-color').trim() || (theme === 'dark' ? '#9CA3AF' : '#475569'),
        tickFill: styles.getPropertyValue('--chart-text-color').trim() || (theme === 'dark' ? '#9CA3AF' : '#475569'),
        legendColor: styles.getPropertyValue('--chart-legend-text-color').trim() || (theme === 'dark' ? '#9CA3AF' : '#475569'),
        areaColor: styles.getPropertyValue('--chart-color-6').trim() || '#EF4444',
        areaOpacity1: parseFloat(styles.getPropertyValue('--chart-area-fill-opacity-1').trim()) || 0.1,
        areaOpacity2: parseFloat(styles.getPropertyValue('--chart-area-fill-opacity-2').trim()) || 0.5,
        btcDasharray: styles.getPropertyValue('--chart-btc-stroke-dasharray').trim().replace(/"/g, '') || '5 5',
      });
    }
  }, [theme, visualStyle]); // Rerun when theme or style changes

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

  // Define the gradient renderer function inside the component scope
  const renderGradient = () => (
    <defs>
      <linearGradient id={`totalExpenses-${theme}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={computedStyles.areaColor} stopOpacity={computedStyles.areaOpacity2}/>
        <stop offset="95%" stopColor={computedStyles.areaColor} stopOpacity={computedStyles.areaOpacity1}/>
      </linearGradient>
    </defs>
  );

  return (
    <div ref={chartRef} className="themed-card rounded-xl p-6" data-theme={theme} data-visual-style={visualStyle}>
      <h2 className="text-xl font-bold mb-6 text-theme-primary">Monthly Trends</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={data} 
            margin={{ top: 40, right: 30, left: 0, bottom: 0 }}
          >
            {renderGradient()}
            <CartesianGrid 
              strokeDasharray={computedStyles.gridDasharray}
              stroke={computedStyles.gridStroke}
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              stroke={computedStyles.axisStroke}
              tick={{ fill: computedStyles.tickFill }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="left"
              stroke="var(--chart-axis-color)"
              tick={{ 
                fill: "var(--chart-text-color)"
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
                // Get theme/style from component props or context
                const currentTheme = theme;
                const currentStyle = visualStyle;

                if (!active || !payload || payload.length === 0) return null;
                
                // Define colors based on dataKey or use chart variables
                const colors: Record<string, string> = {
                  fixedExpenses: 'var(--chart-color-1)',
                  variableExpenses: 'var(--chart-color-2)',
                  subscriptionCosts: 'var(--chart-color-4)',
                  totalExpenses: 'var(--chart-color-6)',
                };

                return (
                  <div 
                    className="themed-tooltip"
                    data-theme={currentTheme} // Apply theme attribute
                    data-visual-style={currentStyle} // Apply style attribute
                  >
                    <div className="font-semibold mb-1">{label}</div>
                    <div className="space-y-1">
                      {payload.map((entry) => {
                        // Default to text-chart-highlight if color not found
                        const colorClass = colors[entry.dataKey as string] ?? 'var(--chart-highlight-color)'; 
                        const value = entry.value ?? 0; // Provide default value
                        return (
                          <div key={entry.name} className="flex justify-between gap-4">
                            <span className="text-theme-secondary">{entry.name}:</span>
                            <span style={{ color: colorClass }} className="font-medium">
                              {formatAmount(Number(value), displayCurrency)} {/* Ensure value is number */}
                            </span>
                          </div>
                        );
                      })}
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
                marginTop: '-36px',
                color: computedStyles.legendColor // Apply legend text color
              }}
            />
            <Area
              type="monotone"
              dataKey="totalExpenses"
              name="Total Expenses"
              stroke="var(--chart-color-6)"
              fill={`url(#totalExpenses-${theme})`}
              strokeWidth={2}
              dot={false}
              yAxisId="left"
            />
            <Bar 
              dataKey="fixedExpenses" 
              name="Fixed Expenses" 
              fill="var(--chart-color-1)"
              radius={[4, 4, 0, 0]}
              stackId="expenses"
              yAxisId="left"
            />
            <Bar 
              dataKey="variableExpenses" 
              name="Variable Expenses" 
              fill="var(--chart-color-2)"
              radius={[4, 4, 0, 0]}
              stackId="expenses"
              yAxisId="left"
            />
            <Bar 
              dataKey="subscriptionCosts" 
              name="Subscription Costs" 
              fill="var(--chart-color-4)"
              radius={[4, 4, 0, 0]}
              stackId="expenses"
              yAxisId="left"
            />
            {/* BTC value line (placeholder) */}
            {isBTC && (
              <Area
                type="monotone"
                dataKey="totalExpenses" // Use totalExpenses for position, but style differently
                name="BTC Value (approx)" // Indicate this is an approximation
                stroke="var(--chart-color-btc)"
                fill="none"
                strokeWidth={2}
                strokeDasharray={computedStyles.btcDasharray}
                dot={false}
                yAxisId="left" // Assuming left axis is the primary value axis
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}