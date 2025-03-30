import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from 'date-fns';
import type { FixedExpense, VariableExpense, FinancialAsset } from '../../types';

// Colors for the pie chart slices
const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#0EA5E9', '#14B8A6', '#F97316', '#8B5CF6'];

type TimeFrame = 'week' | 'month' | 'year';
type ChartType = 'expenses' | 'assets';

interface Props {
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  assets: FinancialAsset[];
  type: ChartType;
}

export function CategoryDistributionChart({ fixedExpenses, variableExpenses, assets, type }: Props) {
  const { theme } = useTheme();
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

  return (
    <div className="neumorphic-card rounded-xl p-6">
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
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={150}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {chartData.map((entry, index) => (
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
                          <span className="text-theme-secondary">
                            {type === 'expenses' ? 'Amount:' : 'Value:'}
                          </span>
                          <span className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}>
                            {formatAmount(data.value, displayCurrency)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-theme-secondary">Count:</span>
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