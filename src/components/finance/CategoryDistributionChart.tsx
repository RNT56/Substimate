import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from 'date-fns';
import type { FixedExpense, VariableExpense, FinancialAsset } from '../../types';

type TimeFrame = 'week' | 'month' | 'year';
type ChartType = 'expenses' | 'assets';

interface Props {
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  assets: FinancialAsset[];
  type: ChartType;
}

export function CategoryDistributionChart({ fixedExpenses, variableExpenses, assets, type }: Props) {
  const { theme, visualStyle } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const [timeframe, setTimeframe] = useState<TimeFrame>('month');
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  // Calculate the date range based on the selected timeframe
  const dateRange = useMemo(() => {
    const now = new Date();
    
    switch (timeframe) {
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [timeframe]);

  // Prepare data for the pie chart based on the type (expenses or assets)
  const chartData = useMemo(() => {
    if (type === 'expenses') {
      // Filter variable expenses within the date range
      const filteredVariableExpenses = variableExpenses.filter(expense => {
        if (!expense.date) return false;
        const expenseDate = parseISO(expense.date);
        return isWithinInterval(expenseDate, dateRange);
      });
      
      // Combine fixed and variable expenses by category
      const expensesByCategory: Record<string, { value: number, count: number }> = {};
      
      // Process fixed expenses
      fixedExpenses.forEach(expense => {
        const category = expense.category || 'Other';
        if (!expensesByCategory[category]) {
          expensesByCategory[category] = { value: 0, count: 0 };
        }
        
        // Scale fixed expenses based on timeframe
        let amount = expense.amount;
        if (timeframe === 'week') {
          amount = expense.amount / 4; // Approximating weekly
        } else if (timeframe === 'year') {
          amount = expense.amount * 12; // Annual amount
        }
        
        expensesByCategory[category].value += amount;
        expensesByCategory[category].count += 1;
      });
      
      // Process variable expenses
      filteredVariableExpenses.forEach(expense => {
        const category = expense.category || 'Other';
        if (!expensesByCategory[category]) {
          expensesByCategory[category] = { value: 0, count: 0 };
        }
        expensesByCategory[category].value += expense.amount;
        expensesByCategory[category].count += 1;
      });
      
      // Convert to array format for chart
      return Object.entries(expensesByCategory).map(([name, data]) => ({
        name,
        value: data.value,
        count: data.count
      })).sort((a, b) => b.value - a.value);
    } else {
      // Group assets by type
      const assetsByType: Record<string, { value: number, count: number }> = {};
      
      assets.forEach(asset => {
        const type = asset.type || 'Other';
        if (!assetsByType[type]) {
          assetsByType[type] = { value: 0, count: 0 };
        }
        assetsByType[type].value += asset.value;
        assetsByType[type].count += 1;
      });
      
      // Convert to array format for chart
      return Object.entries(assetsByType).map(([name, data]) => ({
        name,
        value: data.value,
        count: data.count
      })).sort((a, b) => b.value - a.value);
    }
  }, [type, fixedExpenses, variableExpenses, assets, timeframe, dateRange]);

  const CustomTooltip = ({ active, payload }: any) => {
    // Get theme/style from parent scope
    const currentTheme = theme;
    const currentStyle = visualStyle;
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div 
          className="themed-tooltip" 
          data-theme={currentTheme} // Apply theme
          data-visual-style={currentStyle} // Apply style
        >
          <div className="font-semibold mb-1">{entry.name}</div>
          <div>Amount: <span className={isBTC ? 'text-chart-btc' : 'text-chart-highlight'}>
            {formatAmount(Number(entry.value ?? 0), displayCurrency)}
          </span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="themed-card rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-theme-primary">
          {type === 'expenses' ? 'Expense Categories' : 'Asset Distribution'}
        </h2>
        
        {/* Timeframe selector buttons */}
        <div className="flex rounded-lg overflow-hidden">
          {(['week', 'month', 'year'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`
                px-4 py-2 text-sm transition-colors
                ${timeframe === t
                  ? isBTC 
                    ? 'bg-[#f7931a] text-white'
                    : 'bg-emerald-500 text-white'
                  : 'text-theme-secondary hover:text-theme-primary'
                }
              `}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {chartData.length > 0 ? (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={isBTC ? 'var(--chart-color-btc)' : `var(--chart-pie-slice-${(index % 5) + 1})`}
                    stroke={isDark ? '#1F2937' : '#FFFFFF'}
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-theme-secondary text-lg">
            No {type === 'expenses' ? 'expenses' : 'assets'} available for this timeframe.
          </p>
        </div>
      )}
    </div>
  );
} 