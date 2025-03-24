import React from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import type { Subscription, PaymentMethodStats } from '../types';
import { getSubscriptionCategory } from '../utils/subscriptionPredictions';
import { DashboardGrid } from './DashboardGrid';
import { format, parseISO, differenceInMonths, startOfMonth, isSameMonth } from 'date-fns';
import { useCurrency } from '../contexts/CurrencyContext';
import { useDevice } from '../hooks/useDevice';

interface Props {
  subscriptions: Subscription[];
}

type SortKey = 'name' | 'cost' | 'usage';
type SortDirection = 'asc' | 'desc';

export function UsageStatistics({ subscriptions }: Props) {
  const [sortKey, setSortKey] = React.useState<SortKey>('usage');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
  const { isMobile } = useDevice();
  const isBTC = displayCurrency === 'BTC';

  // Calculate subscription trends
  const trends = React.useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const recentSubs = subscriptions.filter(sub => {
      const startDate = parseISO(sub.startDate);
      return startDate >= threeMonthsAgo;
    });

    const olderSubs = subscriptions.filter(sub => {
      const startDate = parseISO(sub.startDate);
      return startDate >= sixMonthsAgo && startDate < threeMonthsAgo;
    });

    const recentMonthlyCost = recentSubs.reduce((sum, sub) => {
      const monthlyCost = sub.billingPeriod === 'yearly' ? sub.monthlyCost / 12 : sub.monthlyCost;
      const convertedCost = convertAmount(monthlyCost, 'EUR', displayCurrency);
      return sum + convertedCost;
    }, 0);

    const olderMonthlyCost = olderSubs.reduce((sum, sub) => {
      const monthlyCost = sub.billingPeriod === 'yearly' ? sub.monthlyCost / 12 : sub.monthlyCost;
      const convertedCost = convertAmount(monthlyCost, 'EUR', displayCurrency);
      return sum + convertedCost;
    }, 0);

    const activeCount = subscriptions.filter(sub => sub.usageState === 'active').length;
    const notMuchCount = subscriptions.filter(sub => sub.usageState === 'not much').length;
    const unusedCount = subscriptions.filter(sub => sub.usageState === 'unused').length;

    const yearlySubsCount = subscriptions.filter(sub => sub.billingPeriod === 'yearly').length;
    const monthlySubsCount = subscriptions.filter(sub => sub.billingPeriod === 'monthly').length;

    return {
      subscriptionGrowth: {
        recent: recentSubs.length,
        older: olderSubs.length,
        trend: ((recentSubs.length - olderSubs.length) / (olderSubs.length || 1)) * 100
      },
      costGrowth: {
        recent: recentMonthlyCost,
        older: olderMonthlyCost,
        trend: ((recentMonthlyCost - olderMonthlyCost) / (olderMonthlyCost || 1)) * 100
      },
      usageDistribution: {
        active: (activeCount / subscriptions.length) * 100,
        notMuch: (notMuchCount / subscriptions.length) * 100,
        unused: (unusedCount / subscriptions.length) * 100
      },
      billingDistribution: {
        yearly: (yearlySubsCount / subscriptions.length) * 100,
        monthly: (monthlySubsCount / subscriptions.length) * 100
      }
    };
  }, [subscriptions, displayCurrency, convertAmount]);

  // Calculate payment method statistics with currency conversion
  const paymentMethodStats = subscriptions.reduce<Record<string, PaymentMethodStats>>((acc, sub) => {
    if (!acc[sub.paymentMethod]) {
      acc[sub.paymentMethod] = {
        paymentMethod: sub.paymentMethod,
        totalCost: 0,
        subscriptionCount: 0,
        averageCostPerService: 0
      };
    }
    
    const monthlyCost = sub.billingPeriod === 'yearly' ? sub.monthlyCost / 12 : sub.monthlyCost;
    const convertedCost = convertAmount(monthlyCost, 'EUR', displayCurrency);
    
    acc[sub.paymentMethod].totalCost += convertedCost;
    acc[sub.paymentMethod].subscriptionCount += 1;
    acc[sub.paymentMethod].averageCostPerService = 
      acc[sub.paymentMethod].totalCost / acc[sub.paymentMethod].subscriptionCount;
    
    return acc;
  }, {});

  // Calculate category usage statistics
  const categoryUsage = subscriptions.reduce<Record<string, { active: number; notMuch: number; unused: number; total: number; totalCost: number }>>((acc, sub) => {
    const category = getSubscriptionCategory(sub.name);
    if (!acc[category]) {
      acc[category] = { active: 0, notMuch: 0, unused: 0, total: 0, totalCost: 0 };
    }
    acc[category][sub.usageState === 'not much' ? 'notMuch' : sub.usageState] += 1;
    acc[category].total += 1;

    const monthlyCost = sub.billingPeriod === 'yearly' ? sub.monthlyCost / 12 : sub.monthlyCost;
    const convertedCost = convertAmount(monthlyCost, 'EUR', displayCurrency);
    acc[category].totalCost += convertedCost;

    return acc;
  }, {});

  // Sort subscriptions based on current sort key and direction
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortKey) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'cost':
        const aMonthlyCost = a.billingPeriod === 'yearly' ? a.monthlyCost / 12 : a.monthlyCost;
        const bMonthlyCost = b.billingPeriod === 'yearly' ? b.monthlyCost / 12 : b.monthlyCost;
        const aConverted = convertAmount(aMonthlyCost, 'EUR', displayCurrency);
        const bConverted = convertAmount(bMonthlyCost, 'EUR', displayCurrency);
        comparison = aConverted - bConverted;
        break;
      case 'usage':
        const usageOrder = { active: 0, 'not much': 1, unused: 2 };
        comparison = usageOrder[a.usageState] - usageOrder[b.usageState];
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const dashboardCards = [
    // Subscription Trends
    <div key="subscription-trends" className="dashboard-card p-6">
      <h2 className="text-xl font-semibold mb-6 text-theme-primary">Subscription Trends</h2>
      <div className="grid grid-cols-2 gap-x-12 gap-y-6">
        {/* Growth Stats */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-theme-secondary mb-2">3-Month Growth</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-theme-secondary">New Subscriptions</span>
                  <div className="flex items-center gap-2">
                    <span className={trends.subscriptionGrowth.trend >= 0 ? 'highlight-color' : 'text-red-500'}>
                      {trends.subscriptionGrowth.trend.toFixed(1)}%
                    </span>
                    {trends.subscriptionGrowth.trend >= 0 ? 
                      <TrendingUp size={16} className="highlight-color" /> : 
                      <TrendingDown size={16} className="text-red-500" />}
                  </div>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className={`${isBTC ? 'bg-[#f7931a]' : 'bg-emerald-500'} h-2 rounded-full transition-all`}
                    style={{ width: `${Math.min(Math.abs(trends.subscriptionGrowth.trend), 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-theme-secondary">Monthly Cost</span>
                  <div className="flex items-center gap-2">
                    <span className={trends.costGrowth.trend >= 0 ? 'highlight-color' : 'text-red-500'}>
                      {trends.costGrowth.trend.toFixed(1)}%
                    </span>
                    {trends.costGrowth.trend >= 0 ? 
                      <TrendingUp size={16} className="highlight-color" /> : 
                      <TrendingDown size={16} className="text-red-500" />}
                  </div>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className={`${isBTC ? 'bg-[#f7931a]' : 'bg-emerald-500'} h-2 rounded-full transition-all`}
                    style={{ width: `${Math.min(Math.abs(trends.costGrowth.trend), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Distribution */}
        <div>
          <h3 className="text-sm font-medium text-theme-secondary mb-2">Usage Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-theme-secondary">Active</span>
                <span className="highlight-color">{trends.usageDistribution.active.toFixed(1)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className={`${isBTC ? 'bg-[#f7931a]' : 'bg-emerald-500'} h-2 rounded-full transition-all`}
                  style={{ width: `${trends.usageDistribution.active}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-theme-secondary">Not Much</span>
                <span className="text-amber-500">{trends.usageDistribution.notMuch.toFixed(1)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${trends.usageDistribution.notMuch}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-theme-secondary">Unused</span>
                <span className="text-red-500">{trends.usageDistribution.unused.toFixed(1)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${trends.usageDistribution.unused}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Billing Distribution */}
        <div>
          <h3 className="text-sm font-medium text-theme-secondary mb-2">Billing Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-theme-secondary">Monthly Plans</span>
                <span className="highlight-color">{trends.billingDistribution.monthly.toFixed(1)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className={`${isBTC ? 'bg-[#f7931a]' : 'bg-emerald-500'} h-2 rounded-full transition-all`}
                  style={{ width: `${trends.billingDistribution.monthly}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-theme-secondary">Yearly Plans</span>
                <span className="highlight-color">{trends.billingDistribution.yearly.toFixed(1)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className={`${isBTC ? 'bg-[#f7931a]' : 'bg-emerald-500'} h-2 rounded-full transition-all`}
                  style={{ width: `${trends.billingDistribution.yearly}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-sm font-medium text-theme-secondary mb-2">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-theme-secondary">New Subscriptions (3mo)</span>
              <span className="highlight-color">{trends.subscriptionGrowth.recent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-theme-secondary">Added Monthly Cost</span>
              <span className="highlight-color">
                {formatAmount(trends.costGrowth.recent, displayCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,

    // Payment Method Statistics
    <div key="payment-stats" className="dashboard-card p-6">
      <h2 className="text-xl font-semibold mb-6 text-theme-primary">Payment Method Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.values(paymentMethodStats).map((stats) => (
          <div key={stats.paymentMethod} className="dashboard-card p-4">
            <h3 className="font-medium text-theme-primary mb-3">{stats.paymentMethod}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary">Monthly Cost:</span>
                <span className={`${isBTC ? 'text-[#f7931a]' : 'text-emerald-500'} text-right`}>
                  {formatAmount(stats.totalCost, displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary">Services:</span>
                <span className={`${isBTC ? 'text-[#f7931a]' : 'text-emerald-500'} text-right`}>
                  {stats.subscriptionCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary">Avg. Cost:</span>
                <span className={`${isBTC ? 'text-[#f7931a]' : 'text-emerald-500'} text-right`}>
                  {formatAmount(stats.averageCostPerService, displayCurrency)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // Category Usage Statistics
    <div key="category-stats" className="dashboard-card p-6">
      <h2 className="text-xl font-semibold mb-6 text-theme-primary">Category Usage Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(categoryUsage).map(([category, stats]) => (
          <div key={category} className="dashboard-card p-4">
            <h3 className="font-medium text-theme-primary mb-3">{category}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary">Monthly Cost:</span>
                <span className={`${isBTC ? 'text-[#f7931a]' : 'text-emerald-500'} text-right`}>
                  {formatAmount(stats.totalCost, displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary">Active:</span>
                <span className={`${isBTC ? 'text-[#f7931a]' : 'text-emerald-500'} text-right`}>
                  {stats.active} ({((stats.active / stats.total) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary">Not Much:</span>
                <span className="text-amber-500 text-right">
                  {stats.notMuch} ({((stats.notMuch / stats.total) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary">Unused:</span>
                <span className="text-red-500 text-right">
                  {stats.unused} ({((stats.unused / stats.total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // Service Usage Overview
    <div key="service-overview" className="dashboard-card p-6">
      <h2 className="text-xl font-semibold mb-6 text-theme-primary">Service Usage Overview</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-left text-theme-primary">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 hover:text-emerald-500 transition-colors"
                >
                  Service <ArrowUpDown size={16} />
                </button>
              </th>
              <th className="pb-3 text-left text-theme-primary">
                <button
                  onClick={() => handleSort('cost')}
                  className="flex items-center gap-2 hover:text-emerald-500 transition-colors"
                >
                  Monthly Cost <ArrowUpDown size={16} />
                </button>
              </th>
              <th className="pb-3 text-left text-theme-primary">Billing Period</th>
              <th className="pb-3 text-left text-theme-primary">Payment Method</th>
              <th className="pb-3 text-left text-theme-primary">
                <button
                  onClick={() => handleSort('usage')}
                  className="flex items-center gap-2 hover:text-emerald-500 transition-colors"
                >
                  Usage Status <ArrowUpDown size={16} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSubscriptions.map(sub => {
              const monthlyCost = sub.billingPeriod === 'yearly' ? sub.monthlyCost / 12 : sub.monthlyCost;
              const convertedCost = convertAmount(monthlyCost, 'EUR', displayCurrency);
              const formattedCost = formatAmount(convertedCost, displayCurrency);

              return (
                <tr key={sub.id} className="border-b border-gray-200/50">
                  <td className="py-3 text-theme-primary">{sub.name}</td>
                  <td className="py-3 text-theme-primary">{formattedCost}/mo</td>
                  <td className="py-3 capitalize text-theme-secondary">{sub.billingPeriod}</td>
                  <td className="py-3 text-theme-secondary">{sub.paymentMethod}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      sub.usageState === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                      sub.usageState === 'not much' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {sub.usageState === 'not much' ? 'Not Much' : 
                        sub.usageState.charAt(0).toUpperCase() + sub.usageState.slice(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  ];

  return (
    <div className="space-y-8 mt-12">
      <DashboardGrid subscriptions={subscriptions}>
        {dashboardCards}
      </DashboardGrid>
    </div>
  );
}