import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTheme } from '../../contexts/ThemeContext';

interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  subscriptionCosts: number;
  investments: number;
  savings: number;
  investmentRatio: number;
  savingsRatio: number;
}

interface Props {
  data: MonthlyTrendData[];
}

export function MonthlyTrendsChart({ data }: Props) {
  const { theme, visualStyle } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();

  // Calculate the maximum value for the y-axis
  const maxValue = Math.max(
    ...data.map(d => Math.max(
      d.income,
      d.fixedExpenses + d.variableExpenses + d.subscriptionCosts,
      d.investments,
      d.savings
    ))
  );

  // Round up to a nice number for the y-axis
  const yAxisMax = Math.ceil(maxValue / 1000) * 1000;

  const CustomTooltip = ({ active, payload }: any) => {
    // Get theme/style from parent scope
    const currentTheme = theme;
    const currentStyle = visualStyle;

    // Define colors based on dataKey or use chart variables
    const colors: Record<string, string> = {
      income: 'var(--chart-color-1)',
      fixedExpenses: 'var(--chart-color-6)',
      variableExpenses: 'var(--chart-color-7)',
      subscriptionCosts: 'var(--chart-color-5)', // Match gradient
      investments: 'var(--chart-color-4)',
      savings: 'var(--chart-color-2)',
      investmentRatio: 'var(--chart-color-4)', // Dashed line color
      savingsRatio: 'var(--chart-color-2)' // Dashed line color
    };

    if (active && payload && payload.length) {
      const { month } = payload[0].payload; // Get month from payload
      return (
        <div 
          className="themed-tooltip" 
          data-theme={currentTheme} // Apply theme
          data-visual-style={currentStyle} // Apply style
        >
          <div className="font-semibold mb-1">{month}</div>
          <div className="space-y-1">
            {payload.map((pld: any, index: any) => { // Add explicit types
              const color = colors[pld.dataKey as string] ?? 'var(--chart-highlight-color)';
              const value = pld.value ?? 0;
              const isRatio = ['investmentRatio', 'savingsRatio'].includes(pld.dataKey as string);
              return (
                <div key={index} className="flex justify-between gap-4">
                  <span className="text-theme-secondary">{pld.name}:</span>
                  <span style={{ color }} className="font-medium">
                    {isRatio ? `${Number(value).toFixed(1)}%` : formatAmount(Number(value), displayCurrency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="themed-card rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 text-theme-primary">Monthly Trends</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-color-1)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--chart-color-1)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFixed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-color-6)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--chart-color-6)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorVariable" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-color-7)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--chart-color-7)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSubscriptions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-color-5)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--chart-color-5)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorInvestments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-color-4)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--chart-color-4)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-color-2)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--chart-color-2)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-color)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--chart-axis-color)"
              tick={{ fontSize: 12, fill: "var(--chart-text-color)" }}
            />
            <YAxis 
              yAxisId="left"
              stroke="var(--chart-axis-color)"
              tick={{ fontSize: 12, fill: "var(--chart-text-color)" }}
              tickFormatter={(value) => formatAmount(value, displayCurrency)}
              domain={[0, yAxisMax]}
              width={80}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="var(--chart-axis-color)"
              tick={{ fontSize: 12, fill: "var(--chart-text-color)" }}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              domain={[0, 100]}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Area 
              type="monotone" 
              dataKey="income" 
              name="Income"
              stroke="var(--chart-color-1)"
              fillOpacity={1}
              fill="url(#colorIncome)"
              yAxisId="left"
              stackId="1"
            />
            <Area 
              type="monotone" 
              dataKey="fixedExpenses" 
              name="Fixed Expenses"
              stroke="var(--chart-color-6)"
              fillOpacity={1}
              fill="url(#colorFixed)"
              yAxisId="left"
              stackId="2"
            />
            <Area 
              type="monotone" 
              dataKey="variableExpenses" 
              name="Variable Expenses"
              stroke="var(--chart-color-7)"
              fillOpacity={1}
              fill="url(#colorVariable)"
              yAxisId="left"
              stackId="2"
            />
            <Area 
              type="monotone" 
              dataKey="subscriptionCosts" 
              name="Subscription Costs"
              stroke="var(--chart-color-5)"
              fillOpacity={1}
              fill="url(#colorSubscriptions)"
              yAxisId="left"
              stackId="2"
            />
            <Area 
              type="monotone" 
              dataKey="investments" 
              name="Investments"
              stroke="var(--chart-color-4)"
              fillOpacity={1}
              fill="url(#colorInvestments)"
              yAxisId="left"
            />
            <Area 
              type="monotone" 
              dataKey="savings" 
              name="Savings"
              stroke="var(--chart-color-2)"
              fillOpacity={1}
              fill="url(#colorSavings)"
              yAxisId="left"
            />
            <Area 
              type="monotone" 
              dataKey="investmentRatio" 
              name="Investment Ratio"
              stroke="var(--chart-color-4)"
              strokeDasharray="5 5"
              fill="none"
              yAxisId="right"
            />
            <Area 
              type="monotone" 
              dataKey="savingsRatio" 
              name="Savings Ratio"
              stroke="var(--chart-color-2)"
              strokeDasharray="5 5"
              fill="none"
              yAxisId="right"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
