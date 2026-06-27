import React from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import type { Subscription, PaymentMethodStats } from '../types';
import { DashboardGrid } from './DashboardGrid';
import { parseISO } from 'date-fns';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertSubscriptionMonthlyAmount } from '../lib/subscriptionCosts';

interface Props {
  subscriptions: Subscription[];
}

type SortKey = 'name' | 'cost' | 'usage';
type SortDirection = 'asc' | 'desc';

export function UsageStatistics({ subscriptions }: Props) {
  const [sortKey, setSortKey] = React.useState<SortKey>('usage');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
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
      return sum + convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);
    }, 0);

    const olderMonthlyCost = olderSubs.reduce((sum, sub) => {
      return sum + convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);
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
        active: subscriptions.length > 0 ? (activeCount / subscriptions.length) * 100 : 0,
        notMuch: subscriptions.length > 0 ? (notMuchCount / subscriptions.length) * 100 : 0,
        unused: subscriptions.length > 0 ? (unusedCount / subscriptions.length) * 100 : 0
      },
      billingDistribution: {
        yearly: subscriptions.length > 0 ? (yearlySubsCount / subscriptions.length) * 100 : 0,
        monthly: subscriptions.length > 0 ? (monthlySubsCount / subscriptions.length) * 100 : 0
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
    
    const convertedCost = convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);
    
    acc[sub.paymentMethod].totalCost += convertedCost;
    acc[sub.paymentMethod].subscriptionCount += 1;
    acc[sub.paymentMethod].averageCostPerService = 
      acc[sub.paymentMethod].totalCost / acc[sub.paymentMethod].subscriptionCount;
    
    return acc;
  }, {});

  // Calculate category usage statistics
  const categoryUsage = subscriptions.reduce<Record<string, { active: number; notMuch: number; unused: number; total: number; totalCost: number }>>((acc, sub) => {
    const category = sub.category || 'Other';
    if (!acc[category]) {
      acc[category] = { active: 0, notMuch: 0, unused: 0, total: 0, totalCost: 0 };
    }
    const usageState = sub.usageState ?? 'unused';
    acc[category][usageState === 'not much' ? 'notMuch' : usageState] += 1;
    acc[category].total += 1;

    acc[category].totalCost += convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);

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
        const aConverted = convertSubscriptionMonthlyAmount(a, displayCurrency, convertAmount);
        const bConverted = convertSubscriptionMonthlyAmount(b, displayCurrency, convertAmount);
        comparison = aConverted - bConverted;
        break;
      case 'usage':
        const usageOrder = { active: 0, 'not much': 1, unused: 2 };
        comparison = usageOrder[a.usageState ?? 'unused'] - usageOrder[b.usageState ?? 'unused'];
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
                    <span className={trends.subscriptionGrowth.trend >= 0 ? 'text-chart-positive' : 'text-chart-negative'}>
                      {trends.subscriptionGrowth.trend.toFixed(1)}%
                    </span>
                    {trends.subscriptionGrowth.trend >= 0 ? 
                      <TrendingUp size={16} className="text-chart-positive" /> : 
                      <TrendingDown size={16} className="text-chart-negative" />}
                  </div>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className={`${isBTC ? 'bg-chart-btc' : 'bg-chart-positive'} h-2 rounded-full transition-all`}
                    style={{ width: `${Math.min(Math.abs(trends.subscriptionGrowth.trend), 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-theme-secondary">Monthly Cost</span>
                  <div className="flex items-center gap-2">
                    <span className={trends.costGrowth.trend >= 0 ? 'text-chart-positive' : 'text-chart-negative'}>
                      {trends.costGrowth.trend.toFixed(1)}%
                    </span>
                    {trends.costGrowth.trend >= 0 ? 
                      <TrendingUp size={16} className="text-chart-positive" /> : 
                      <TrendingDown size={16} className="text-chart-negative" />}
                  </div>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className={`${isBTC ? 'bg-chart-btc' : 'bg-chart-positive'} h-2 rounded-full transition-all`}
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
                <span className="text-chart-positive">{trends.usageDistribution.active.toFixed(1)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className={`${isBTC ? 'bg-chart-btc' : 'bg-chart-positive'} h-2 rounded-full transition-all`}
                  style={{ width: `${trends.usageDistribution.active}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-theme-secondary">Not Much</span>
                <span className="text-chart-warning">{trends.usageDistribution.notMuch.toFixed(1)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="bg-chart-warning h-2 rounded-full transition-all"
                  style={{ width: `${trends.usageDistribution.notMuch}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-theme-secondary">Unused</span>
                <span className="text-chart-negative">{trends.usageDistribution.unused.toFixed(1)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="bg-chart-negative h-2 rounded-full transition-all"
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
                <span className="text-chart-highlight">{trends.billingDistribution.monthly.toFixed(1)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className={`${isBTC ? 'bg-chart-btc' : 'bg-chart-highlight'} h-2 rounded-full transition-all`}
                  style={{ width: `${trends.billingDistribution.monthly}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-theme-secondary">Yearly Plans</span>
                <span className="text-chart-highlight">{trends.billingDistribution.yearly.toFixed(1)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className={`${isBTC ? 'bg-chart-btc' : 'bg-chart-highlight'} h-2 rounded-full transition-all`}
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
              <span className="text-chart-highlight">{trends.subscriptionGrowth.recent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-theme-secondary">Added Monthly Cost</span>
              <span className="text-chart-highlight">
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
                <span className="text-theme-secondary mr-2">Monthly Cost:</span>
                <span className={`${isBTC ? 'text-chart-btc' : 'text-analytics-text-highlight'} text-right`}>
                  {formatAmount(stats.totalCost, displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary mr-2">Services:</span>
                <span className={`${isBTC ? 'text-chart-btc' : 'text-analytics-text-highlight'} text-right`}>
                  {stats.subscriptionCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary mr-2">Avg. Cost:</span>
                <span className={`${isBTC ? 'text-chart-btc' : 'text-analytics-text-highlight'} text-right`}>
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
                <span className={`${isBTC ? 'text-chart-btc' : 'text-analytics-text-highlight'} text-right`}>
                  {formatAmount(stats.totalCost, displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary">Active:</span>
                <span className={`${isBTC ? 'text-chart-btc' : 'text-chart-positive'} text-right`}>
                  {stats.active} ({stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary">Not Much:</span>
                <span className="text-chart-warning text-right">
                  {stats.notMuch} ({stats.total > 0 ? ((stats.notMuch / stats.total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-theme-secondary">Unused:</span>
                <span className="text-chart-negative text-right">
                  {stats.unused} ({stats.total > 0 ? ((stats.unused / stats.total) * 100).toFixed(0) : 0}%)
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
              const convertedCost = convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);
              const formattedCost = formatAmount(convertedCost, displayCurrency);

              return (
                <tr key={sub.id} className="border-b border-gray-200/50">
                  <td className="py-3 text-theme-primary">{sub.name}</td>
                  <td className="py-3 text-theme-primary">{formattedCost}/mo</td>
                  <td className="py-3 capitalize text-theme-secondary">{sub.billingPeriod}</td>
                  <td className="py-3 text-theme-secondary">{sub.paymentMethod}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-sm 
                      ${(sub.usageState ?? 'unused') === 'active' ? 'bg-chart-positive/20 text-chart-positive' : 
                        (sub.usageState ?? 'unused') === 'not much' ? 'bg-chart-warning/20 text-chart-warning' : 
                        'bg-chart-negative/20 text-chart-negative'}
                    `}>
                      {(sub.usageState ?? 'unused') === 'not much' ? 'Not Much' : 
                        (sub.usageState ?? 'unused').charAt(0).toUpperCase() + (sub.usageState ?? 'unused').slice(1)}
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
      <DashboardGrid>
        {dashboardCards}
      </DashboardGrid>
    </div>
  );
}
