import React, { useState, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import type { CategoryAnalytics } from '../../types';

interface Props {
  data: CategoryAnalytics[];
}

export function CategoryDistribution({ data }: Props) {
  const { theme, visualStyle } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isDark = theme === 'dark';
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isBTC = displayCurrency === 'BTC';
  const chartRef = useRef<HTMLDivElement>(null);
  const [computedStyles, setComputedStyles] = useState({
    pieCellStroke: '#FFFFFF',
    pieCellStrokeWidth: 2,
    pieOuterRadius: 120,
    legendIconSize: 10,
    btcColor: '#f7931a',
    pieSlice1: '#8884d8',
    pieSlice2: '#82ca9d',
    pieSlice3: '#ffc658',
    pieSlice4: '#ff8042',
    pieSlice5: '#0088FE',
    // Add any other necessary styles here
  });

  useEffect(() => {
    if (chartRef.current) {
      const styles = getComputedStyle(chartRef.current);
      const parsePixelValue = (val: string | null, defaultValue: number) => {
        return val ? parseInt(val.replace('px', ''), 10) || defaultValue : defaultValue;
      };
      setComputedStyles({
        pieCellStroke: styles.getPropertyValue('--chart-pie-cell-stroke').trim() || (isDark ? '#1F2937' : '#FFFFFF'),
        pieCellStrokeWidth: parseInt(styles.getPropertyValue('--chart-pie-cell-stroke-width').trim()) || 2,
        pieOuterRadius: parsePixelValue(styles.getPropertyValue('--chart-pie-outer-radius').trim(), 120),
        legendIconSize: parsePixelValue(styles.getPropertyValue('--chart-legend-icon-size').trim(), 10),
        btcColor: styles.getPropertyValue('--chart-color-btc').trim() || '#f7931a',
        pieSlice1: styles.getPropertyValue('--chart-pie-slice-1').trim() || '#8884d8',
        pieSlice2: styles.getPropertyValue('--chart-pie-slice-2').trim() || '#82ca9d',
        pieSlice3: styles.getPropertyValue('--chart-pie-slice-3').trim() || '#ffc658',
        pieSlice4: styles.getPropertyValue('--chart-pie-slice-4').trim() || '#ff8042',
        pieSlice5: styles.getPropertyValue('--chart-pie-slice-5').trim() || '#0088FE',
      });
    }
  }, [theme, visualStyle, isDark]);

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
          <p className="font-semibold mb-1 text-chart-tooltip-text">{entry.name}</p>
          <p className="text-theme-secondary">
            Count: <span className="text-chart-highlight">{entry.count}</span>
          </p>
          <p className="text-theme-secondary">
            Total Cost: <span className={isBTC ? 'text-chart-btc' : 'text-chart-highlight'}>
              {formatAmount(Number(entry.totalCost ?? 0), displayCurrency)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div ref={chartRef} className="themed-card p-6 rounded-lg shadow-md overflow-hidden">
      <h2 className="text-xl font-semibold mb-4 text-theme-primary">Category Distribution</h2>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={computedStyles.pieOuterRadius}
            fill="#8884d8"
            dataKey="totalCost"
            nameKey="name"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => {
              const colorIndex = (index % 5) + 1;
              const fillColor = isBTC ? computedStyles.btcColor :
                                (computedStyles as any)[`pieSlice${colorIndex}`] || '#8884d8';
              return (
                <Cell
                  key={entry.name}
                  fill={fillColor}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  stroke={computedStyles.pieCellStroke}
                  strokeWidth={computedStyles.pieCellStrokeWidth}
                />
              );
            })}
          </Pie>
          <Legend 
            iconSize={computedStyles.legendIconSize}
            layout="vertical" 
            verticalAlign="middle" 
            align="right" 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}