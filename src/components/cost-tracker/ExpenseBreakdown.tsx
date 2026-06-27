import React, { useEffect, useState, useRef } from 'react';
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
  const { theme, visualStyle } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isBTC = displayCurrency === 'BTC';
  const chartRef = useRef<HTMLDivElement>(null);
  const [computedStyles, setComputedStyles] = useState({
    gridStroke: '#e2e8f0',
    gridDasharray: '3 3',
    axisStroke: '#475569',
    tickFill: '#475569',
    tickFontSize: '12px',
    tooltipCursorFill: 'rgba(156, 163, 175, 0.1)',
    barFill: 'var(--chart-bar-fill)',
    btcBarFill: 'var(--chart-color-btc)',
    // barRadius: [4, 4, 0, 0], // Still needs JS parsing
  });

  useEffect(() => {
    if (chartRef.current) {
      const styles = getComputedStyle(chartRef.current);
      setComputedStyles({
        gridStroke: styles.getPropertyValue('--chart-grid-color').trim() || (theme === 'dark' ? '#374151' : '#e2e8f0'),
        gridDasharray: styles.getPropertyValue('--chart-grid-stroke-dasharray').trim().replace(/"/g, '') || '3 3',
        axisStroke: styles.getPropertyValue('--chart-axis-color').trim() || (theme === 'dark' ? '#9CA3AF' : '#475569'),
        tickFill: styles.getPropertyValue('--chart-text-color').trim() || (theme === 'dark' ? '#9CA3AF' : '#475569'),
        tickFontSize: styles.getPropertyValue('--chart-tick-font-size').trim() || '12px',
        tooltipCursorFill: styles.getPropertyValue('--chart-tooltip-cursor-fill').trim() || 'rgba(156, 163, 175, 0.1)',
        barFill: styles.getPropertyValue('--chart-bar-fill').trim() || 'var(--chart-color-1)', // Fallback needed?
        btcBarFill: styles.getPropertyValue('--chart-color-btc').trim() || '#f7931a',
        // barRadius: parseRadius(styles.getPropertyValue('--chart-bar-radius')), // Use parser
      });
    }
  }, [theme, visualStyle]);

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    // Get theme/style from parent scope
    const currentTheme = theme;
    const currentStyle = visualStyle;
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div 
          className="themed-tooltip" 
          data-theme={currentTheme} // Apply theme
          data-visual-style={currentStyle} // Apply style
        >
          <div className="font-semibold mb-1">{label}</div>
          <p>Amount: <span className="font-medium">{formatAmount(Number(entry.value ?? 0), displayCurrency)}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div ref={chartRef} className="themed-card rounded-xl p-6" data-theme={theme} data-visual-style={visualStyle}>
      <h2 className="text-xl font-bold mb-6 text-theme-primary">Expense Breakdown</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray={computedStyles.gridDasharray}
              stroke={computedStyles.gridStroke}
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              stroke={computedStyles.axisStroke}
              tick={{
                fill: computedStyles.tickFill,
                fontSize: computedStyles.tickFontSize // Use computed style
              }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={computedStyles.axisStroke}
              tick={{
                fill: computedStyles.tickFill,
                fontSize: computedStyles.tickFontSize // Use computed style
              }}
              tickFormatter={(value) => formatAmount(value, displayCurrency)}
              domain={[0, yAxisMax]}
              tickCount={tickCount}
              axisLine={false}
              tickLine={false}
              width={isBTC ? 120 : 80}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: computedStyles.tooltipCursorFill }} // Use computed style
            />
            <Bar 
              dataKey="value" 
              fill={isBTC ? computedStyles.btcBarFill : computedStyles.barFill} // Use computed style
              // radius={computedStyles.barRadius} // Use computed (parsed) radius
               radius={[4, 4, 0, 0]} // Keep hardcoded for now - parsing CSS units is complex
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
