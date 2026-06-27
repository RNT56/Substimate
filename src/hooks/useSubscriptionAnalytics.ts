import React, { useState, useEffect, useCallback } from 'react';
import { 
  differenceInMonths,
  differenceInYears,
  parseISO, 
  format, 
  endOfMonth, 
  eachMonthOfInterval, 
  subMonths, 
  isAfter,
  addYears,
  isSameMonth
} from 'date-fns';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../contexts/CurrencyContext';
import type { Subscription, LifetimeCostData, CategoryAnalytics } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  convertSubscriptionMonthlyAmount,
  convertSubscriptionPaymentAmount,
  normalizeCurrency
} from '../lib/subscriptionCosts';

interface PriceHistoryRow {
  monthly_cost: number;
  effective_from: string;
  currency?: string | null;
}

export function useSubscriptionAnalytics(subscriptions: Subscription[]) {
  const [lifetimeCostsData, setLifetimeCostsData] = useState<LifetimeCostData[]>([]);
  const [loading, setLoading] = useState(true);
  const { convertAmount, displayCurrency } = useCurrency();
  const { user } = useAuth();

  // Calculate lifetime costs whenever subscriptions or currency changes
  const calculateLifetimeCosts = useCallback(async () => {
    if (!subscriptions.length) {
      setLifetimeCostsData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const costs = await Promise.all(subscriptions.map(async sub => {
        const startDate = parseISO(sub.startDate);
        const currentDate = new Date();
        const months = differenceInMonths(currentDate, startDate) + 1;
        
        let totalSpent = 0;
        
        // Get all price history for this subscription
        const { data: priceHistory, error } = await supabase
          .from('subscription_price_history')
          .select('monthly_cost, effective_from, currency')
          .eq('subscription_id', sub.id)
          .order('effective_from', { ascending: true });

        if (error) throw error;

        const history = (priceHistory ?? []) as PriceHistoryRow[];

        if (sub.billingPeriod === 'yearly') {
          // For yearly subscriptions, we only charge once per year
          const yearsActive = differenceInYears(currentDate, startDate);
          
          // Always count the first year as a complete payment
          let completedPayments = 1;
          
          // For subsequent years, only count if we've passed the anniversary date
          if (yearsActive > 0) {
            const lastAnniversaryDate = addYears(startDate, yearsActive);
            const hasPassedLastAnniversary = isAfter(currentDate, lastAnniversaryDate);
            completedPayments = hasPassedLastAnniversary ? yearsActive + 1 : yearsActive;
          }

          // Handle price history if it exists
          if (history.length) {
            totalSpent = 0; // Reset to recalculate with historical prices
            let nextAnniversary = startDate;

            for (let year = 0; year < completedPayments; year++) {
              // Find the price that was active at this anniversary
              const applicablePrice = history
                .filter(entry => !isAfter(parseISO(entry.effective_from), nextAnniversary))
                .sort((a, b) => 
                  parseISO(b.effective_from).getTime() - parseISO(a.effective_from).getTime()
                )[0];

              const yearlyAmount = applicablePrice 
                ? convertAmount(
                    Number(applicablePrice.monthly_cost) * 12,
                    normalizeCurrency(applicablePrice.currency || sub.currency),
                    displayCurrency
                  )
                : convertSubscriptionPaymentAmount(sub, displayCurrency, convertAmount);

              totalSpent += yearlyAmount;
              nextAnniversary = addYears(nextAnniversary, 1);
            }
          } else {
            totalSpent = convertSubscriptionPaymentAmount(sub, displayCurrency, convertAmount);
          }
        } else {
          // For monthly subscriptions, calculate month by month
          const monthTimeline = eachMonthOfInterval({
            start: startDate,
            end: currentDate
          });

          for (const month of monthTimeline) {
            let monthlyPrice = convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);
            
            if (history.length) {
              const applicablePrice = history
                .filter(entry => !isAfter(parseISO(entry.effective_from), endOfMonth(month)))
                .sort((a, b) => 
                  parseISO(b.effective_from).getTime() - parseISO(a.effective_from).getTime()
                )[0];

              if (applicablePrice) {
                monthlyPrice = convertAmount(
                  Number(applicablePrice.monthly_cost),
                  normalizeCurrency(applicablePrice.currency || sub.currency),
                  displayCurrency
                );
              }
            }

            totalSpent += monthlyPrice;
          }
        }

        const convertedMonthlyCost = convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);

        return {
          name: sub.name,
          totalSpent,
          monthlyCost: convertedMonthlyCost,
          months,
          startDate: sub.startDate,
          billingPeriod: sub.billingPeriod,
          usageState: sub.usageState || 'active'
        };
      }));

      setLifetimeCostsData(costs.sort((a, b) => b.totalSpent - a.totalSpent));
    } catch (error) {
      console.error('Error calculating lifetime costs:', error);
    } finally {
      setLoading(false);
    }
  }, [subscriptions, displayCurrency, convertAmount]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('subscription-analytics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          void calculateLifetimeCosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_price_history',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          void calculateLifetimeCosts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, calculateLifetimeCosts]);

  // Run calculations when dependencies change
  useEffect(() => {
    void calculateLifetimeCosts();
  }, [calculateLifetimeCosts]);

  // Calculate category analytics using actual subscription categories
  const categoryData = React.useMemo(() => {
    const data = subscriptions.reduce<Record<string, CategoryAnalytics>>((acc, sub) => {
      const category = sub.category;
      if (!acc[category]) {
        acc[category] = {
          name: category,
          totalCost: 0,
          subscriptionCount: 0,
          averageCostPerService: 0
        };
      }
      const convertedCost = convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);
      acc[category].totalCost += convertedCost;
      acc[category].subscriptionCount += 1;
      acc[category].averageCostPerService = acc[category].totalCost / acc[category].subscriptionCount;
      return acc;
    }, {});

    return Object.values(data);
  }, [subscriptions, convertAmount, displayCurrency]);

  // Calculate monthly trends data
  const monthlyTrendsData = React.useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

    return months.map(month => {
      const monthEnd = endOfMonth(month);

      // Calculate total cost for this month from active subscriptions
      const totalCost = subscriptions
        .filter(sub => {
          const startDate = parseISO(sub.startDate);
          return startDate <= monthEnd;
        })
        .reduce((sum, sub) => {
          const subscriptionStart = parseISO(sub.startDate);
          
          if (sub.billingPeriod === 'yearly') {
            // For yearly subscriptions, only add cost on anniversary months
            if (isSameMonth(month, subscriptionStart) || 
                isSameMonth(month, addYears(subscriptionStart, Math.floor(differenceInMonths(month, subscriptionStart) / 12)))) {
              return sum + convertSubscriptionPaymentAmount(sub, displayCurrency, convertAmount);
            }
            return sum; // No cost in non-anniversary months
          }
          
          // For monthly subscriptions, add the monthly cost
          return sum + convertSubscriptionMonthlyAmount(sub, displayCurrency, convertAmount);
        }, 0);

      return {
        month: format(month, 'MMM yyyy'),
        totalCost
      };
    });
  }, [subscriptions, displayCurrency, convertAmount]);

  return {
    lifetimeCostsData,
    categoryData,
    monthlyTrendsData,
    loading
  };
}
