import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Subscription, PriceChangeOptions } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_CATEGORIES } from '../lib/constants';

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const optimisticUpdatesRef = useRef<Set<string>>(new Set());

  // Keep track of pending updates to avoid duplicate fetches
  const pendingUpdateRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    fetchSubscriptions();
    
    // Create a single channel for all subscription-related changes
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user?.id}`
        },
        handleSubscriptionChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_price_history',
          filter: `user_id=eq.${user?.id}`
        },
        handlePriceHistoryChange
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const handlePriceHistoryChange = (payload: any) => {
    try {
      // Skip if this is our own optimistic update
      if (optimisticUpdatesRef.current.has(payload.new?.subscription_id)) {
        return;
      }

      // Refresh the subscription data to get latest price
      fetchSubscriptions();
    } catch (error) {
      console.error('Error handling price history change:', error);
    }
  };

  const handleSubscriptionChange = (payload: any) => {
    try {
      // Skip if this is our own optimistic update
      if (optimisticUpdatesRef.current.has(payload.new?.id || payload.old?.id)) {
        return;
      }

      // Handle different event types
      switch (payload.eventType) {
        case 'INSERT':
          const newSub = transformSubscription(payload.new);
          setSubscriptions(prev => [newSub, ...prev]);
          break;

        case 'UPDATE':
          setSubscriptions(prev => prev.map(sub => {
            if (sub.id === payload.new.id) {
              const updatedSub = transformSubscription(payload.new);
              return {
                ...updatedSub,
                isFavorite: updatedSub.favorite || false
              };
            }
            return sub;
          }));
          break;

        case 'DELETE':
          setSubscriptions(prev => prev.filter(sub => sub.id !== payload.old.id));
          break;
      }
    } catch (error) {
      console.error('Error handling subscription change:', error);
      // Only refresh data if not an optimistic update
      if (!optimisticUpdatesRef.current.has(payload.new?.id || payload.old?.id)) {
        fetchSubscriptions();
      }
    }
  };

  // Helper function to transform database row to Subscription type
  const transformSubscription = (data: any): Subscription => ({
    id: data.id,
    name: data.name,
    url: data.url,
    icon: data.icon,
    monthlyCost: parseFloat(data.monthly_cost),
    billingPeriod: data.billing_period,
    paymentMethod: data.payment_method,
    category: data.category,
    usageState: data.usage_state,
    startDate: data.start_date,
    isFavorite: data.favorite || false
  });

  const fetchSubscriptions = async () => {
    try {
      const { data: subsData = [], error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      setSubscriptions(subsData.map(item => ({
        id: item.id,
        name: item.name,
        url: item.url,
        icon: item.icon,
        monthlyCost: parseFloat(item.monthly_cost),
        billingPeriod: item.billing_period,
        paymentMethod: item.payment_method,
        category: item.category,
        usageState: item.usage_state,
        startDate: item.start_date,
        isFavorite: item.favorite || false
      })));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (subscription: Subscription) => {
    // Store previous state for rollback
    const previousSubscriptions = [...subscriptions];

    // Add to optimistic updates set
    optimisticUpdatesRef.current.add(subscription.id);

    // Apply optimistic update immediately
    setSubscriptions(prev =>
      prev.map(sub => sub.id === subscription.id ? subscription : sub)
    );

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          name: subscription.name,
          url: subscription.url,
          icon: subscription.icon,
          monthly_cost: subscription.monthlyCost,
          billing_period: subscription.billingPeriod,
          payment_method: subscription.paymentMethod,
          category: subscription.category,
          usage_state: subscription.usageState,
          start_date: subscription.startDate,
          favorite: subscription.isFavorite
        })
        .eq('id', subscription.id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Remove from optimistic updates only after successful update
      optimisticUpdatesRef.current.delete(subscription.id);
    } catch (error) {
      // Remove from optimistic updates set
      optimisticUpdatesRef.current.delete(subscription.id);
      // Revert to previous state on error
      setSubscriptions(previousSubscriptions);
      console.error('Error updating subscription:', error);
      throw error;
    }
  };

  const addSubscription = async (subscription: Omit<Subscription, 'id'>) => {
    try {
      // Ensure new subscriptions start with favorite = false
      const subscriptionData = {
        user_id: user?.id,
        name: subscription.name,
        url: subscription.url,
        icon: subscription.icon,
        monthly_cost: subscription.monthlyCost,
        billing_period: subscription.billingPeriod,
        payment_method: subscription.paymentMethod,
        category: subscription.category,
        usage_state: subscription.usageState,
        start_date: subscription.startDate,
        favorite: false // Always start as non-favorite
      };

      const { data, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([subscriptionData])
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Add initial price history record
      const { error: priceHistoryError } = await supabase
        .from('subscription_price_history')
        .insert([{
          subscription_id: data.id,
          user_id: user?.id,
          monthly_cost: subscription.monthlyCost,
          effective_from: subscription.startDate,
          is_correction: false
        }]);

      if (priceHistoryError) throw priceHistoryError;

      // Update local state immediately
      const newSubscription: Subscription = {
        id: data.id,
        name: data.name,
        url: data.url,
        icon: data.icon,
        monthlyCost: parseFloat(data.monthly_cost),
        billingPeriod: data.billing_period,
        paymentMethod: data.payment_method,
        category: data.category,
        usageState: data.usage_state,
        startDate: data.start_date,
        isFavorite: false // Ensure local state matches database
      };

      setSubscriptions(prev => [newSubscription, ...prev]);

      // Emit a custom event to notify about category changes
      window.dispatchEvent(new CustomEvent('categoryChange'));
    } catch (error) {
      console.error('Error adding subscription:', error);
      throw error;
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      const previousSubscriptions = [...subscriptions];
      
      // Add to optimistic updates set
      optimisticUpdatesRef.current.add(id);

      // Apply optimistic update
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));

      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        // If the API call fails, revert the local state
        setSubscriptions(previousSubscriptions);
        optimisticUpdatesRef.current.delete(id);
        throw error;
      }
      
      // Remove from optimistic updates after successful deletion
      optimisticUpdatesRef.current.delete(id);

    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  };

  const updateSubscriptionWithPriceHistory = async (
    subscription: Subscription, 
    priceChangeOptions?: PriceChangeOptions
  ) => {
    // Store previous state for rollback
    const previousSubscriptions = [...subscriptions];
    const previousSubscription = previousSubscriptions.find(s => s.id === subscription.id);

    if (!previousSubscription) {
      throw new Error('Subscription not found');
    }

    // Add to optimistic updates set
    optimisticUpdatesRef.current.add(subscription.id);

    // Apply optimistic update immediately
    setSubscriptions(prev =>
      prev.map(sub => sub.id === subscription.id ? subscription : sub)
    );

    try {
      // Only add price history if price changed
      if (previousSubscription.monthlyCost !== subscription.monthlyCost) {
        const effectiveDate = priceChangeOptions?.applyToHistory 
          ? subscription.startDate 
          : priceChangeOptions?.effectiveDate || new Date().toISOString();

        // Insert price history record
        const { error: priceHistoryError } = await supabase
          .from('subscription_price_history')
          .insert({
            subscription_id: subscription.id,
            user_id: user?.id,
            monthly_cost: subscription.monthlyCost,
            effective_from: effectiveDate,
            is_correction: priceChangeOptions?.applyToHistory || false
          });

        if (priceHistoryError) throw priceHistoryError;
      }

      // Update subscription
      const { error } = await supabase
        .from('subscriptions')
        .update({
          name: subscription.name,
          url: subscription.url,
          icon: subscription.icon,
          monthly_cost: subscription.monthlyCost,
          billing_period: subscription.billingPeriod,
          payment_method: subscription.paymentMethod,
          category: subscription.category,
          usage_state: subscription.usageState,
          start_date: subscription.startDate,
          favorite: subscription.isFavorite
        })
        .eq('id', subscription.id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Remove from optimistic updates only after successful update
      optimisticUpdatesRef.current.delete(subscription.id);
    } catch (error) {
      // Remove from optimistic updates set
      optimisticUpdatesRef.current.delete(subscription.id);
      // Revert to previous state on error
      setSubscriptions(previousSubscriptions);
      console.error('Error updating subscription:', error);
      throw error;
    }
  };

  const reorderSubscriptions = async (reorderedSubscriptions: Subscription[]) => {
    const previousOrder = [...subscriptions];
    
    // Add to optimistic updates set
    reorderedSubscriptions.forEach(sub => {
      optimisticUpdatesRef.current.add(sub.id);
    });

    // Apply optimistic update
    setSubscriptions(reorderedSubscriptions);

    try {
      // Create updates array with proper JSONB structure
      const updates = JSON.stringify(
        reorderedSubscriptions.map((sub, i) => ({
          id: sub.id,
          created_at: new Date(Date.now() - i * 1000).toISOString()
        }))
      );

      // Update all subscriptions in a single request
      const { error } = await supabase.rpc('batch_update_subscription_order', {
        updates: JSON.parse(updates)
      });

      if (error) {
        // Revert optimistic update on error
        setSubscriptions(previousOrder);
        // Clear optimistic updates
        reorderedSubscriptions.forEach(sub => {
          optimisticUpdatesRef.current.delete(sub.id);
        });
        throw error;
      }
    } catch (error) {
      // Revert optimistic update on error
      setSubscriptions(previousOrder);
      // Clear optimistic updates
      reorderedSubscriptions.forEach(sub => {
        optimisticUpdatesRef.current.delete(sub.id);
      });
      console.error('Error reordering subscriptions:', error);
      throw error;
    }
  };

  return {
    subscriptions,
    loading,
    addSubscription,
    updateSubscription: updateSubscriptionWithPriceHistory,
    deleteSubscription,
    reorderSubscriptions
  };
}