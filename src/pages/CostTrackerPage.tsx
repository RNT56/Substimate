import React from 'react';
import { useFinancialData } from '../hooks/useFinancialData';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useCurrency } from '../contexts/CurrencyContext';
import { MonthlyTrendsChart } from '../components/cost-tracker/MonthlyTrendsChart';
import { CategoryDistribution } from '../components/cost-tracker/CategoryDistribution';
import { ExpenseBreakdown } from '../components/cost-tracker/ExpenseBreakdown';
import { SpendingFlowChart } from '../components/cost-tracker/SpendingFlowChart';
import { format, parseISO, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';

export function CostTrackerPage() {
  const { displayCurrency, convertAmount } = useCurrency();
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
          const monthlyCost = sub.billingPeriod === 'yearly' 
            ? sub.monthlyCost / 12 
            : sub.monthlyCost;
          return sum + monthlyCost;
        }, 0);

      const totalExpenses = monthlyFixedExpenses + monthlyVariableExpenses + monthlySubscriptionCosts;

      return {
        month: format(month, 'MMM yyyy'),
        fixedExpenses: convertAmount(monthlyFixedExpenses, 'EUR', displayCurrency),
        variableExpenses: convertAmount(monthlyVariableExpenses, 'EUR', displayCurrency),
        subscriptionCosts: convertAmount(monthlySubscriptionCosts, 'EUR', displayCurrency),
        totalExpenses: convertAmount(totalExpenses, 'EUR', displayCurrency)
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
      const monthlyCost = sub.billingPeriod === 'yearly' ? sub.monthlyCost / 12 : sub.monthlyCost;
      acc[sub.category].value += convertAmount(monthlyCost, 'EUR', displayCurrency);
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
      value: convertAmount(
        subscriptions.reduce((sum, sub) => {
          const monthlyCost = sub.billingPeriod === 'yearly' ? sub.monthlyCost / 12 : sub.monthlyCost;
          return sum + monthlyCost;
        }, 0),
        'EUR',
        displayCurrency
      )
    }
  ], [fixedExpenses, variableExpenses, subscriptions, convertAmount, displayCurrency]);

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
        
        {/* Cost Predictions Placeholder */}
        <div className="neumorphic-card rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 text-theme-primary">Cost Predictions</h2>
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-theme-secondary">
              Coming soon: AI-powered cost predictions and optimization suggestions
            </p>
          </div>
        </div>
      </div>

      {/* Spending Flow Chart */}
      <SpendingFlowChart
        incomeSources={incomeSources}
        fixedExpenses={fixedExpenses}
        variableExpenses={variableExpenses}
        subscriptions={subscriptions}
      />
    </div>
  );
}