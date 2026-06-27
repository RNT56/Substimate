import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Subscription } from '../types';
import { useAuth } from './AuthContext';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface SubscriptionContextType {
  subscriptions: Subscription[];
  loading: boolean;
  addSubscription: (subscription: Omit<Subscription, 'id'>) => Promise<void>;
  updateSubscription: (subscription: Subscription) => Promise<void>;
  triggerDeleteConfirmation: (id: string) => void;
  confirmDeleteSubscription: (keepHistory: boolean) => Promise<void>;
  toggleFavorite: (subscriptionId: string) => Promise<void>;
  reorderSubscriptions: (reorderedSubscriptions: Subscription[]) => Promise<void>;
  isConfirmDeleteOpen: boolean;
  subscriptionToDelete: Subscription | null;
  closeConfirmDeleteModal: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const optimisticUpdatesRef = useRef<Set<string>>(new Set());
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);

  // Helper function to transform database row to Subscription type
  const transformSubscription = useCallback((data: any): Subscription => ({
    id: data.id,
    name: data.name,
    url: data.url,
    icon: data.icon,
    monthlyCost: parseFloat(data.monthly_cost) || 0,
    amount: parseFloat(data.monthly_cost) || 0,
    currency: data.currency || 'EUR',
    billingPeriod: data.billing_period || 'monthly',
    paymentMethod: data.payment_method || 'credit_card',
    category: data.category || 'Other',
    usageState: data.usage_state || 'active',
    startDate: data.start_date || new Date().toISOString().split('T')[0],
    isFavorite: data.favorite || false,
    favorite: data.favorite || false,
    autoRenew: data.auto_renew || false,
    userId: data.user_id || user?.id || ''
  }), [user?.id]);

  const fetchSubscriptions = useCallback(async () => {
    if (!user) return;

    try {
      const { data: subsData = [], error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      setSubscriptions(subsData?.map(item => transformSubscription(item)) || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, transformSubscription]);

  const handlePriceHistoryChange = useCallback((payload: any) => {
    try {
      // Skip if this is our own optimistic update
      if (optimisticUpdatesRef.current.has(payload.new?.subscription_id)) {
        return;
      }

      // Refresh the subscription data to get latest price
      void fetchSubscriptions();
    } catch (error) {
      console.error('Error handling price history change:', error);
    }
  }, [fetchSubscriptions]);

  const handleSubscriptionChange = useCallback((payload: any) => {
    try {
      // Skip if this is our own optimistic update
      if (optimisticUpdatesRef.current.has(payload.new?.id || payload.old?.id)) {
        return;
      }

      // Handle different event types
      switch (payload.eventType) {
        case 'INSERT':
          const newSub = transformSubscription(payload.new);
          setSubscriptions(prev => (
            prev.some(sub => sub.id === newSub.id) ? prev : [newSub, ...prev]
          ));
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
        void fetchSubscriptions();
      }
    }
  }, [fetchSubscriptions, transformSubscription]);

  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    void fetchSubscriptions();

    // Create a single channel for all subscription-related changes
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        handleSubscriptionChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_price_history',
          filter: `user_id=eq.${user.id}`
        },
        handlePriceHistoryChange
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, fetchSubscriptions, handleSubscriptionChange, handlePriceHistoryChange]);

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
          favorite: subscription.isFavorite,
          currency: subscription.currency || 'EUR'
        })
        .eq('id', subscription.id)
        .eq('user_id', user!.id);

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
        user_id: user!.id,
        name: subscription.name,
        url: subscription.url || '',
        icon: subscription.icon || '',
        monthly_cost: subscription.monthlyCost || subscription.amount || 0,
        billing_period: subscription.billingPeriod || 'monthly',
        payment_method: subscription.paymentMethod || 'credit_card',
        category: subscription.category || 'Other',
        usage_state: subscription.usageState || 'active',
        start_date: subscription.startDate || new Date().toISOString().split('T')[0],
        favorite: false, // Always start as non-favorite
        auto_renew: subscription.autoRenew || false,
        currency: subscription.currency || 'EUR'
      };

      const { data, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([subscriptionData])
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Update local state immediately
      const newSubscription: Subscription = transformSubscription(data);

      setSubscriptions(prev => [newSubscription, ...prev]);

      // Emit a custom event to notify about category changes
      window.dispatchEvent(new CustomEvent('categoryChange'));
    } catch (error) {
      console.error('Error adding subscription:', error);
      throw error;
    }
  };

  const triggerDeleteConfirmation = (id: string) => {
    const subscription = subscriptions.find(s => s.id === id);
    if (subscription) {
      setSubscriptionToDelete(subscription);
      setIsConfirmDeleteOpen(true);
    } else {
      console.error('Subscription not found for deletion:', id);
      // Handle error appropriately, maybe show a notification
    }
  };

  const closeConfirmDeleteModal = () => {
    setIsConfirmDeleteOpen(false);
    setSubscriptionToDelete(null);
  };

  const confirmDeleteSubscription = async (keepHistory: boolean) => {
    if (!subscriptionToDelete || !user) {
      console.error('No subscription selected for deletion or user not logged in.');
      closeConfirmDeleteModal(); // Close modal even if error occurs
      return; // Exit if no subscription is targeted
    }

    const id = subscriptionToDelete.id;
    const previousSubscriptions = [...subscriptions];

    // Add to optimistic updates set
    optimisticUpdatesRef.current.add(id);

    // Apply optimistic update
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));

    // Close the modal immediately
    closeConfirmDeleteModal();

    try {
      // Delete price history if user doesn't want to keep it
      if (!keepHistory) {
        try {
          await supabase
            .from('subscription_price_history')
            .delete()
            .eq('subscription_id', id)
            .eq('user_id', user.id); // Use user.id directly
        } catch (historyError) {
          console.warn('Error deleting price history:', historyError);
          // Continue with subscription deletion even if price history deletion fails
        }
      }

      // Now delete the subscription itself - this uses a direct SQL query to avoid trigger issues
      const { error } = await supabase.rpc('delete_subscription_directly', {
        sub_id: id
      });

      if (error) {
        console.error('Deletion error:', error);
        // If the API call fails, revert the local state
        setSubscriptions(previousSubscriptions);
        optimisticUpdatesRef.current.delete(id);
        throw error; // Re-throw error to be caught by caller if needed
      }

      // Remove from optimistic updates after successful deletion
      optimisticUpdatesRef.current.delete(id);

    } catch (error) {
       // Ensure optimistic update is reverted on any error during the process
       if (optimisticUpdatesRef.current.has(id)) {
         setSubscriptions(previousSubscriptions);
         optimisticUpdatesRef.current.delete(id);
       }
       console.error('Error deleting subscription:', error);
       closeConfirmDeleteModal(); // Ensure modal is closed on error
       throw error; // Re-throw error
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

  const toggleFavorite = async (subscriptionId: string) => {
    // Find subscription
    const subscription = subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) return;

    // Store previous state
    const previousSubscriptions = [...subscriptions];

    // Determine current favorite status (check both properties)
    const isFavorite = subscription.isFavorite || subscription.favorite || false;

    // Track optimistic update
    optimisticUpdatesRef.current.add(subscriptionId);

    // Apply optimistic update immediately
    setSubscriptions(prev =>
      prev.map(sub => sub.id === subscriptionId
        ? {...sub, isFavorite: !isFavorite, favorite: !isFavorite}
        : sub
      )
    );

    try {
      // Send to server
      const { error } = await supabase
        .from('subscriptions')
        .update({ favorite: !isFavorite })
        .eq('id', subscriptionId)
        .eq('user_id', user!.id);

      if (error) throw error;

      // Remove from tracked updates on success
      optimisticUpdatesRef.current.delete(subscriptionId);
    } catch (error) {
      // Revert on failure
      setSubscriptions(previousSubscriptions);
      optimisticUpdatesRef.current.delete(subscriptionId);
      console.error('Error updating favorite status:', error);
      throw error;
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      subscriptions,
      loading,
      addSubscription,
      updateSubscription,
      triggerDeleteConfirmation,
      confirmDeleteSubscription,
      toggleFavorite,
      reorderSubscriptions,
      isConfirmDeleteOpen,
      subscriptionToDelete,
      closeConfirmDeleteModal,
    }}>
      {children}
      <ConfirmDeleteModal />
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
}
