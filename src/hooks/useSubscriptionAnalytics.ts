import React, { useState, useEffect } from 'react';
import { 
  differenceInMonths,
  differenceInYears,
  parseISO, 
  format, 
  startOfMonth, 
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

export function useSubscriptionAnalytics(subscriptions: Subscription[]) {
  const [lifetimeCostsData, setLifetimeCostsData] = useState<LifetimeCostData[]>([]);
  const [loading, setLoading] = useState(true);
  const { convertAmount, displayCurrency } = useCurrency();
  const { user } = useAuth();

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
        () => calculateLifetimeCosts()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_price_history',
          filter: `user_id=eq.${user.id}`
        },
        () => calculateLifetimeCosts()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Calculate lifetime costs whenever subscriptions or currency changes
  const calculateLifetimeCosts = async () => {
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
          .select('monthly_cost, effective_from')
          .eq('subscription_id', sub.id)
          .order('effective_from', { ascending: true });

        if (error) throw error;

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

          // Get the yearly cost (monthly_cost is already stored as monthly equivalent)
          const yearlyCost = sub.monthlyCost * 12;
          totalSpent = yearlyCost;

          // Handle price history if it exists
          if (priceHistory?.length) {
            totalSpent = 0; // Reset to recalculate with historical prices
            let nextAnniversary = startDate;

            for (let year = 0; year < completedPayments; year++) {
              // Find the price that was active at this anniversary
              const applicablePrice = priceHistory
                .filter(entry => !isAfter(parseISO(entry.effective_from), nextAnniversary))
                .sort((a, b) => 
                  parseISO(b.effective_from).getTime() - parseISO(a.effective_from).getTime()
                )[0];

              const yearlyAmount = applicablePrice 
                ? parseFloat(applicablePrice.monthly_cost) * 12
                : yearlyCost;

              totalSpent += yearlyAmount;
              nextAnniversary = addYears(nextAnniversary, 1);
            }
          }
        } else {
          // For monthly subscriptions, calculate month by month
          const monthTimeline = eachMonthOfInterval({
            start: startDate,
            end: currentDate
          });

          for (const month of monthTimeline) {
            let monthlyPrice = sub.monthlyCost;
            
            if (priceHistory?.length) {
              const applicablePrice = priceHistory
                .filter(entry => !isAfter(parseISO(entry.effective_from), endOfMonth(month)))
                .sort((a, b) => 
                  parseISO(b.effective_from).getTime() - parseISO(a.effective_from).getTime()
                )[0];

              if (applicablePrice) {
                monthlyPrice = parseFloat(applicablePrice.monthly_cost);
              }
            }

            totalSpent += monthlyPrice;
          }
        }

        const convertedTotalSpent = convertAmount(totalSpent, 'EUR', displayCurrency);
        const convertedMonthlyCost = convertAmount(
          sub.monthlyCost,
          'EUR',
          displayCurrency
        );

        return {
          name: sub.name,
          totalSpent: convertedTotalSpent,
          monthlyCost: convertedMonthlyCost,
          months,
          startDate: sub.startDate,
          billingPeriod: sub.billingPeriod,
          usageState: sub.usageState
        };
      }));

      setLifetimeCostsData(costs.sort((a, b) => b.totalSpent - a.totalSpent));
    } catch (error) {
      console.error('Error calculating lifetime costs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Run calculations when dependencies change
  useEffect(() => {
    calculateLifetimeCosts();
  }, [subscriptions, displayCurrency, convertAmount]);

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
      const convertedCost = convertAmount(sub.monthlyCost, 'EUR', displayCurrency);
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
      const monthStart = startOfMonth(month);
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
              return sum + (sub.monthlyCost * 12); // Add full yearly cost
            }
            return sum; // No cost in non-anniversary months
          }
          
          // For monthly subscriptions, add the monthly cost
          return sum + sub.monthlyCost;
        }, 0);

      return {
        month: format(month, 'MMM yyyy'),
        totalCost: convertAmount(totalCost, 'EUR', displayCurrency)
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