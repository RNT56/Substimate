import React from 'react';
import { useFinancialData } from '../hooks/useFinancialData';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useCurrency } from '../contexts/CurrencyContext';
import { MonthlyTrendsChart } from '../components/cost-tracker/MonthlyTrendsChart';
import { CategoryDistribution } from '../components/cost-tracker/CategoryDistribution';
import { ExpenseBreakdown } from '../components/cost-tracker/ExpenseBreakdown';
import { SpendingFlowChart } from '../components/cost-tracker/SpendingFlowChart';
import { format, parseISO, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { convertSubscriptionMonthlyAmount } from '../lib/subscriptionCosts';

export function CostTrackerPage() {
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
  const isBTC = displayCurrency === 'BTC';
  const { subscriptions } = useSubscriptions();
  const { 
    fixedExpenses, 
    variableExpenses, 
    incomeSources,
    loading 
  } = useFinancialData();

  // Calculate monthly data for the past 6 months
  const monthlyData = React.useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      // Calculate fixed expenses for this month
      const monthlyFixedExpenses = fixedExpenses.reduce((sum, expense) => {
        if (expense.frequency === 'monthly') return sum + expense.amount;
        if (expense.frequency === 'quarterly' && month.getMonth() % 3 === 0) return sum + expense.amount;
        if (expense.frequency === 'yearly' && month.getMonth() === 0) return sum + expense.amount;
        return sum;
      }, 0);

      // Calculate variable expenses for this month
      const monthlyVariableExpenses = variableExpenses
        .filter(expense => {
          const expenseDate = parseISO(expense.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      // Calculate subscription costs for this month
      const monthlySubscriptionCosts = subscriptions
        .filter(sub => {
          const startDate = parseISO(sub.startDate);
          return startDate <= monthEnd;
        })
        .reduce((sum, sub) => {
          return sum + convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);
        }, 0);

      const convertedFixedExpenses = convertAmount(monthlyFixedExpenses, 'EUR', displayCurrency);
      const convertedVariableExpenses = convertAmount(monthlyVariableExpenses, 'EUR', displayCurrency);
      const totalExpenses = convertedFixedExpenses + convertedVariableExpenses + monthlySubscriptionCosts;

      return {
        month: format(month, 'MMM yyyy'),
        fixedExpenses: convertedFixedExpenses,
        variableExpenses: convertedVariableExpenses,
        subscriptionCosts: monthlySubscriptionCosts,
        totalExpenses
      };
    });
  }, [fixedExpenses, variableExpenses, subscriptions, convertAmount, displayCurrency]);

  // Calculate category distribution
  const categoryData = React.useMemo(() => {
    const data = subscriptions.reduce((acc, sub) => {
      if (!acc[sub.category]) {
        acc[sub.category] = {
          name: sub.category,
          value: 0,
          count: 0
        };
      }
      acc[sub.category].value += convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);
      acc[sub.category].count += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number }>);

    return Object.values(data);
  }, [subscriptions, convertAmount, displayCurrency]);

  // Calculate expense breakdown
  const expenseBreakdown = React.useMemo(() => [
    {
      name: 'Fixed Expenses',
      value: convertAmount(
        fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        'EUR',
        displayCurrency
      )
    },
    {
      name: 'Variable Expenses',
      value: convertAmount(
        variableExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        'EUR',
        displayCurrency
      )
    },
    {
      name: 'Subscriptions',
      value: subscriptions.reduce((sum, sub) => {
        return sum + convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);
      }, 0)
    }
  ], [fixedExpenses, variableExpenses, subscriptions, convertAmount, displayCurrency]);

  const reviewQueue = React.useMemo(() => {
    return subscriptions
      .filter(sub => sub.usageState === 'unused' || sub.usageState === 'not much')
      .map(sub => ({
        id: sub.id,
        name: sub.name,
        usageState: sub.usageState || 'unused',
        monthlyCost: convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount)
      }))
      .sort((a, b) => b.monthlyCost - a.monthlyCost)
      .slice(0, 5);
  }, [subscriptions, displayCurrency, convertAmount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading cost data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 title-gradient">Cost Tracker</h1>
        <p className="text-theme-secondary">Monitor and analyze your spending patterns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendsChart data={monthlyData} />
        <CategoryDistribution data={categoryData} />
        <ExpenseBreakdown data={expenseBreakdown} />
        
        <div className="themed-card rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 text-theme-primary">Review Queue</h2>
          <div className="min-h-[400px]">
            {reviewQueue.length > 0 ? (
              <div className="space-y-3">
                {reviewQueue.map(item => (
                  <div key={item.id} className="dashboard-card p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-theme-primary">{item.name}</p>
                      <p className="text-sm text-theme-secondary capitalize">{item.usageState}</p>
                    </div>
                    <p className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}>
                      {formatAmount(item.monthlyCost, displayCurrency)}/mo
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-theme-secondary text-center">
                No unused or low-usage subscriptions are currently marked for review.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spending Flow Chart */}
      <SpendingFlowChart
        incomeSources={incomeSources}
        fixedExpenses={fixedExpenses}
        variableExpenses={variableExpenses}
        subscriptions={subscriptions.map(sub => ({ 
          ...sub, 
          monthlyCost: sub.monthlyCost || 0, 
          usageState: sub.usageState || '' 
        }))}
      />
    </div>
  );
}
