import React from 'react';
import { DashboardGrid } from './DashboardGrid';
import { LifetimeCosts } from './analytics/LifetimeCosts';
import { CategoryDistribution } from './analytics/CategoryDistribution';
import { MonthlyTrends } from './analytics/MonthlyTrends';
import { useDevice } from '../hooks/useDevice';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSubscriptionAnalytics } from '../hooks/useSubscriptionAnalytics';
import type { Subscription } from '../types';

interface Props {
  subscriptions: Subscription[];
}

export function SubscriptionAnalytics({ subscriptions }: Props) {
  const { isMobile } = useDevice();
  const { displayCurrency, formatAmount } = useCurrency();
  const {
    lifetimeCostsData,
    categoryData,
    monthlyTrendsData,
    loading
  } = useSubscriptionAnalytics(subscriptions);

  return (
    <div className="space-y-8 mt-12">
      <DashboardGrid>
        {/* Monthly Trends */}
        <div key="monthly-trends" className="h-full">
          <MonthlyTrends data={monthlyTrendsData} />
        </div>

        {/* Category Distribution */}
        <div key="distribution" className="h-full">
          <CategoryDistribution data={categoryData} />
        </div>

        {/* Lifetime Costs */}
        <div key="lifetime" className="h-full">
          <h2 className="text-xl font-semibold mb-4 text-theme-primary">Lifetime Costs</h2>
          <LifetimeCosts 
            data={lifetimeCostsData}
            loading={loading}
            isMobile={isMobile}
          />
        </div>

        {/* Analytics Overview */}
        <div key="analytics" className="h-full">
          <h2 className="text-xl font-semibold mb-4 text-theme-primary">Analytics Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoryData.map(category => (
              <div 
                key={category.name}
                className="dashboard-card p-4"
              >
                <h3 className="font-medium text-theme-primary mb-4">{category.name}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-secondary">Monthly Cost:</span>
                    <span className={displayCurrency === 'BTC' ? 'text-[#f7931a]' : 'text-analytics-text-highlight'}>
                      {formatAmount(category.totalCost, displayCurrency)}/mo
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-secondary">Services:</span>
                    <span className={displayCurrency === 'BTC' ? 'text-[#f7931a]' : 'text-analytics-text-highlight'}>
                      {category.subscriptionCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-secondary">Avg. Cost:</span>
                    <span className={displayCurrency === 'BTC' ? 'text-[#f7931a]' : 'text-analytics-text-highlight'}>
                      {formatAmount(category.averageCostPerService, displayCurrency)}/mo
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardGrid>
    </div>
  );
}
