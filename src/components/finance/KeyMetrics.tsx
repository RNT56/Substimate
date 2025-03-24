import React from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Props {
  totalAssets: number;
  monthlyIncome: number;
  totalMonthlyExpenses: number;
  savingsRate: number;
}

export function KeyMetrics({ totalAssets, monthlyIncome, totalMonthlyExpenses, savingsRate }: Props) {
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  const metrics = [
    {
      title: 'Total Assets',
      value: formatAmount(convertAmount(totalAssets, 'EUR', displayCurrency), displayCurrency),
      icon: Wallet,
      trend: '+12.5%',
      isPositive: true
    },
    {
      title: 'Monthly Income',
      value: formatAmount(convertAmount(monthlyIncome, 'EUR', displayCurrency), displayCurrency),
      icon: TrendingUp,
      trend: '+5.2%',
      isPositive: true
    },
    {
      title: 'Monthly Expenses',
      value: formatAmount(convertAmount(totalMonthlyExpenses, 'EUR', displayCurrency), displayCurrency),
      icon: TrendingDown,
      trend: '+2.8%',
      isPositive: false
    },
    {
      title: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      trend: '+1.2%',
      isPositive: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <div key={metric.title} className="neumorphic-card rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-theme-secondary mb-2">{metric.title}</p>
              <p className={`text-2xl font-bold ${isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}`}>
                {metric.value}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isBTC ? 'bg-[#f7931a]/10' : 'bg-emerald-500/10'}`}>
              <metric.icon size={24} className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className={metric.isPositive ? 'text-emerald-400' : 'text-red-400'}>
              {metric.trend}
            </span>
            <span className="text-theme-secondary">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
}