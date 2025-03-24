import { useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { useCurrency } from '../contexts/CurrencyContext';
import type { FixedExpense, VariableExpense, Income, AssetTransaction, Subscription } from '../types';

export function useFinanceAnalytics(
  fixedExpenses: FixedExpense[],
  variableExpenses: VariableExpense[],
  incomeSources: Income[],
  transactions: AssetTransaction[],
  subscriptions: Subscription[]
) {
  const { convertAmount, displayCurrency } = useCurrency();

  const monthlyTrendsData = useMemo(() => {
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
        .reduce((sum, sub) => sum + sub.monthlyCost, 0);

      // Calculate income for this month
      const monthlyIncome = incomeSources.reduce((sum, income) => {
        switch (income.frequency) {
          case 'monthly':
            return sum + income.amount;
          case 'weekly':
            return sum + (income.amount * 4);
          case 'yearly':
            if (month.getMonth() === 0) return sum + income.amount;
            return sum;
          case 'one_time': {
            if (!income.nextPayment) return sum;
            const paymentDate = parseISO(income.nextPayment);
            if (paymentDate >= monthStart && paymentDate <= monthEnd) {
              return sum + income.amount;
            }
            return sum;
          }
          default:
            return sum;
        }
      }, 0);

      // Calculate investments for this month
      const monthlyInvestments = transactions
        .filter(tx => {
          const txDate = parseISO(tx.date);
          return txDate >= monthStart && txDate <= monthEnd && tx.type === 'buy';
        })
        .reduce((sum, tx) => sum + (tx.price * tx.quantity), 0);

      const totalExpenses = monthlyFixedExpenses + monthlyVariableExpenses + monthlySubscriptionCosts;
      const savings = monthlyIncome - totalExpenses;
      const investmentRatio = monthlyIncome > 0 ? (monthlyInvestments / monthlyIncome) * 100 : 0;
      const savingsRatio = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;

      return {
        month: format(month, 'MMM yyyy'),
        income: convertAmount(monthlyIncome, 'EUR', displayCurrency),
        expenses: convertAmount(totalExpenses, 'EUR', displayCurrency),
        fixedExpenses: convertAmount(monthlyFixedExpenses, 'EUR', displayCurrency),
        variableExpenses: convertAmount(monthlyVariableExpenses, 'EUR', displayCurrency),
        subscriptionCosts: convertAmount(monthlySubscriptionCosts, 'EUR', displayCurrency),
        investments: convertAmount(monthlyInvestments, 'EUR', displayCurrency),
        savings: convertAmount(savings, 'EUR', displayCurrency),
        investmentRatio,
        savingsRatio
      };
    });
  }, [
    fixedExpenses,
    variableExpenses,
    incomeSources,
    transactions,
    subscriptions,
    convertAmount,
    displayCurrency
  ]);

  return {
    monthlyTrendsData
  };
}