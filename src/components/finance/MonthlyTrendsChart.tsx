import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
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
  const { displayCurrency, formatAmount } = useCurrency();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

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

  return (
    <div className="neumorphic-card rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 text-theme-primary">Monthly Trends</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFixed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorVariable" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSubscriptions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F87171" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#F87171" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorInvestments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e2e8f0'} />
            <XAxis 
              dataKey="month" 
              stroke={isDark ? '#9CA3AF' : '#475569'}
              tick={{ fill: isDark ? '#9CA3AF' : '#475569' }}
            />
            <YAxis 
              yAxisId="left"
              stroke={isDark ? '#9CA3AF' : '#475569'}
              tick={{ fill: isDark ? '#9CA3AF' : '#475569' }}
              tickFormatter={(value) => formatAmount(value, displayCurrency)}
              domain={[0, yAxisMax]}
              width={80}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke={isDark ? '#9CA3AF' : '#475569'}
              tick={{ fill: isDark ? '#9CA3AF' : '#475569' }}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              domain={[0, 100]}
              width={50}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload) return null;
                
                const data = {
                  income: payload[0]?.value || 0,
                  fixedExpenses: payload[1]?.value || 0,
                  variableExpenses: payload[2]?.value || 0,
                  subscriptionCosts: payload[3]?.value || 0,
                  investments: payload[4]?.value || 0,
                  savings: payload[5]?.value || 0,
                  investmentRatio: payload[6]?.value || 0,
                  savingsRatio: payload[7]?.value || 0
                };

                const totalExpenses = data.fixedExpenses + data.variableExpenses + data.subscriptionCosts;
                const expenseBreakdown = totalExpenses > 0 ? {
                  fixed: (data.fixedExpenses / totalExpenses) * 100,
                  variable: (data.variableExpenses / totalExpenses) * 100,
                  subscriptions: (data.subscriptionCosts / totalExpenses) * 100
                } : { fixed: 0, variable: 0, subscriptions: 0 };

                return (
                  <div className="neumorphic-card rounded-lg p-4">
                    <p className="font-medium mb-2">{label}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between gap-4">
                        <span className="text-theme-secondary">Income:</span>
                        <span className="text-emerald-500">
                          {formatAmount(data.income, displayCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-theme-secondary">Fixed Expenses:</span>
                        <span className="text-red-500">
                          {formatAmount(data.fixedExpenses, displayCurrency)}
                          <span className="text-theme-secondary ml-2">
                            ({expenseBreakdown.fixed.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-theme-secondary">Variable Expenses:</span>
                        <span className="text-orange-500">
                          {formatAmount(data.variableExpenses, displayCurrency)}
                          <span className="text-theme-secondary ml-2">
                            ({expenseBreakdown.variable.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-theme-secondary">Subscription Costs:</span>
                        <span className="text-red-400">
                          {formatAmount(data.subscriptionCosts, displayCurrency)}
                          <span className="text-theme-secondary ml-2">
                            ({expenseBreakdown.subscriptions.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-px bg-gray-700 my-2" />
                      <div className="flex justify-between gap-4">
                        <span className="text-theme-secondary">Total Expenses:</span>
                        <span className="text-red-500">
                          {formatAmount(totalExpenses, displayCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-theme-secondary">Investments:</span>
                        <span className="text-purple-500">
                          {formatAmount(data.investments, displayCurrency)}
                          <span className="text-theme-secondary ml-2">
                            ({data.investmentRatio.toFixed(1)}% of income)
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-theme-secondary">Savings:</span>
                        <span className="text-amber-500">
                          {formatAmount(data.savings, displayCurrency)}
                          <span className="text-theme-secondary ml-2">
                            ({data.savingsRatio.toFixed(1)}% of income)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="income" 
              name="Income"
              stroke="#10B981" 
              fillOpacity={1}
              fill="url(#colorIncome)"
              yAxisId="left"
              stackId="1"
            />
            <Area 
              type="monotone" 
              dataKey="fixedExpenses" 
              name="Fixed Expenses"
              stroke="#EF4444" 
              fillOpacity={1}
              fill="url(#colorFixed)"
              yAxisId="left"
              stackId="2"
            />
            <Area 
              type="monotone" 
              dataKey="variableExpenses" 
              name="Variable Expenses"
              stroke="#F97316" 
              fillOpacity={1}
              fill="url(#colorVariable)"
              yAxisId="left"
              stackId="2"
            />
            <Area 
              type="monotone" 
              dataKey="subscriptionCosts" 
              name="Subscription Costs"
              stroke="#F87171" 
              fillOpacity={1}
              fill="url(#colorSubscriptions)"
              yAxisId="left"
              stackId="2"
            />
            <Area 
              type="monotone" 
              dataKey="investments" 
              name="Investments"
              stroke="#8B5CF6" 
              fillOpacity={1}
              fill="url(#colorInvestments)"
              yAxisId="left"
            />
            <Area 
              type="monotone" 
              dataKey="savings" 
              name="Savings"
              stroke="#F59E0B" 
              fillOpacity={1}
              fill="url(#colorSavings)"
              yAxisId="left"
            />
            <Area 
              type="monotone" 
              dataKey="investmentRatio" 
              name="Investment Ratio"
              stroke="#8B5CF6" 
              strokeDasharray="5 5"
              fill="none"
              yAxisId="right"
            />
            <Area 
              type="monotone" 
              dataKey="savingsRatio" 
              name="Savings Ratio"
              stroke="#F59E0B" 
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