import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useDevice } from '../hooks/useDevice';
import { DEFAULT_CATEGORIES } from '../lib/constants';
import { DatePicker } from './DatePicker';
import type { Subscription, PaymentMethod, BillingPeriod } from '../types';
import type { Currency } from '../types';
import { SUPPORTED_CURRENCIES } from '../lib/subscriptionCosts';

const PAYMENT_METHODS: PaymentMethod[] = [
  'credit_card',
  'debit_card',
  'paypal',
  'bank_transfer',
  'apple_pay',
  'google_pay',
  'crypto'
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  'credit_card': 'Credit Card',
  'debit_card': 'Debit Card',
  'paypal': 'PayPal',
  'bank_transfer': 'Bank Transfer',
  'apple_pay': 'Apple Pay',
  'google_pay': 'Google Pay',
  'crypto': 'Cryptocurrency'
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (subscription: Subscription) => Promise<void> | void;
  subscription: Subscription;
}

export function EditSubscriptionModal({ isOpen, onClose, onUpdate, subscription }: Props) {
  const [name, setName] = useState(subscription.name || '');
  const [url, setUrl] = useState(subscription.url || '');
  const [monthlyCost, setMonthlyCost] = useState(
    (subscription.monthlyCost?.toString() || subscription.amount?.toString() || '0')
  );
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(subscription.billingPeriod || 'monthly');
  const [paymentMethod, setPaymentMethod] = useState(subscription.paymentMethod || 'credit_card');
  const [category, setCategory] = useState(subscription.category || 'Other');
  const [startDate, setStartDate] = useState(
    (subscription.startDate?.split('T')[0]) || new Date().toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [filteredPaymentMethods, setFilteredPaymentMethods] = useState<string[]>(PAYMENT_METHODS);
  const [availableCategories, setAvailableCategories] = useState<string[]>([...DEFAULT_CATEGORIES]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const { displayCurrency } = useCurrency();
  const { user } = useAuth();
  const { isMobile } = useDevice();
  const isBTC = displayCurrency === 'BTC';
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setUrl(subscription.url || '');
      // For yearly billing, show the yearly amount in the cost field
      const costValue = subscription.monthlyCost || subscription.amount || 0;
      const displayAmount = subscription.billingPeriod === 'yearly'
        ? costValue * 12
        : costValue;
      setMonthlyCost(displayAmount.toString());
      setBillingPeriod(subscription.billingPeriod);
      setCurrency(subscription.currency || 'EUR');
      setPaymentMethod(subscription.paymentMethod);
      setCategory(subscription.category);
      setStartDate(subscription.startDate.split('T')[0]);
    }
  }, [subscription]);

  const fetchUserCategories = React.useCallback(async () => {
    if (!user) {
      setAvailableCategories([...DEFAULT_CATEGORIES]);
      setFilteredCategories([...DEFAULT_CATEGORIES]);
      return;
    }

    try {
      setLoadingCategories(true);
      setCategoryError(null);

      // Instead of using the RPC function, query the subscriptions table directly
      const { data: subscriptionsData = [], error } = await supabase
        .from('subscriptions')
        .select('category')
        .eq('user_id', user.id)
        .not('category', 'is', null)
        .order('category');

      if (error) throw error;

      // Start with default categories
      const allCategories = new Set([...DEFAULT_CATEGORIES]);

      // Add categories from subscriptions
      subscriptionsData?.forEach(item => {
        if (item.category) allCategories.add(item.category);
      });

      const sortedCategories = Array.from(allCategories).sort();
      setAvailableCategories(sortedCategories);
      setFilteredCategories(sortedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategoryError(error instanceof Error ? error.message : 'Failed to load categories');
      // Fallback to default categories
      setAvailableCategories([...DEFAULT_CATEGORIES]);
      setFilteredCategories([...DEFAULT_CATEGORIES]);
    } finally {
      setLoadingCategories(false);
    }
  }, [user]);

  // Fetch user categories on mount
  React.useEffect(() => {
    void fetchUserCategories();
  }, [fetchUserCategories]);

  // Scroll handling for mobile dropdowns
  React.useEffect(() => {
    if (!isMobile) return;

    const adjustScroll = (ref: React.RefObject<HTMLDivElement | null>, show: boolean) => {
      if (show && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const bottomSpace = viewportHeight - rect.bottom;

        if (bottomSpace < 200) {
          const scrollNeeded = 200 - bottomSpace;
          window.scrollBy({ top: scrollNeeded, behavior: 'smooth' });
        }
      }
    };

    adjustScroll(paymentMethodRef, showPaymentMethods);
    adjustScroll(categoryRef, showCategories);
  }, [showPaymentMethods, showCategories, isMobile]);

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPaymentMethod(value as PaymentMethod);

    if (value.length === 0) {
      setFilteredPaymentMethods(PAYMENT_METHODS);
      setShowPaymentMethods(true);
    } else {
      const filtered = PAYMENT_METHODS.filter(method =>
        method.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredPaymentMethods(filtered);
      setShowPaymentMethods(filtered.length > 0);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCategory(value);

    if (value.length === 0) {
      setFilteredCategories(availableCategories);
      setShowCategories(true);
    } else {
      const filtered = availableCategories.filter(cat => {
        // Handle null/undefined categories
        if (!cat) return false;
        return cat.toLowerCase().includes(value.toLowerCase());
      });
      setFilteredCategories(filtered);
      setShowCategories(filtered.length > 0);
    }
  };

  const handlePaymentMethodClick = (method: string) => {
    setPaymentMethod(method as PaymentMethod);
    setShowPaymentMethods(false);
  };

  const handleCategoryClick = (cat: string) => {
    setCategory(cat);
    setShowCategories(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // prevent submitting if already in progress
    if (submitting) return;

    setSubmitting(true);

    // Store previous values for potential rollback
    const previousValues = {
      name: subscription.name,
      url: subscription.url || '',
      monthlyCost: subscription.monthlyCost || subscription.amount || 0,
      billingPeriod: subscription.billingPeriod,
      paymentMethod: subscription.paymentMethod,
      category: subscription.category,
      startDate: subscription.startDate,
      currency: subscription.currency || 'EUR'
    };

    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }

    // Calculate monthly cost based on billing period
    const inputAmount = parseFloat(monthlyCost);
    if (!Number.isFinite(inputAmount) || inputAmount < 0) {
      setSubmitting(false);
      return;
    }

    const calculatedMonthlyCost = billingPeriod === 'yearly'
      ? inputAmount / 12
      : inputAmount;

    try {
      const updatedSubscription = {
        ...subscription,
        name,
        url: formattedUrl,
        monthlyCost: calculatedMonthlyCost,
        amount: calculatedMonthlyCost,
        currency,
        billingPeriod,
        paymentMethod: paymentMethod as PaymentMethod,
        category: category || 'Other',
        startDate: new Date(startDate).toISOString()
      };

      // Close modal immediately for better UX
      onClose();

      // Perform update in background
      await onUpdate(updatedSubscription);
      setSubmitting(false);
    } catch (error) {
      console.error('Error updating subscription:', error);
      // Restore previous values on error
      setName(previousValues.name);
      setUrl(previousValues.url);
      setMonthlyCost(previousValues.monthlyCost.toString());
      setBillingPeriod(previousValues.billingPeriod);
      setCurrency(previousValues.currency);
      setPaymentMethod(previousValues.paymentMethod);
      setCategory(previousValues.category);
      setStartDate(previousValues.startDate.split('T')[0]);
      // Reset submitting state
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />
      <div className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <div className={`themed-card rounded-xl p-8 w-full max-w-md mt-8 mb-20 ${submitting ? 'opacity-70 pointer-events-none' : ''}`}>
          {submitting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10 rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <p className="text-theme-secondary">Updating subscription...</p>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-6 text-theme-primary">Edit Subscription</h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-secondary">Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={monthlyCost}
                      onChange={(e) => {
                        setMonthlyCost(e.target.value);
                      }}
                      className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-secondary">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {SUPPORTED_CURRENCIES.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Start Date</label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Billing Period</label>
                  <select
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value as BillingPeriod)}
                    className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div ref={paymentMethodRef}>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Payment Method</label>
                <div className="relative">
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={handlePaymentMethodChange}
                    onFocus={() => setShowPaymentMethods(true)}
                    onBlur={() => {
                      setTimeout(() => setShowPaymentMethods(false), 200);
                    }}
                    className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Select or type a payment method"
                    required
                  />
                  {showPaymentMethods && (
                    <div className={`absolute z-10 w-full mt-1 themed-card rounded-lg py-2 overflow-auto ${
                      isMobile ? 'max-h-48' : 'max-h-60'
                    }`}>
                      {filteredPaymentMethods.map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => handlePaymentMethodClick(method)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-700/50 text-theme-primary transition-colors"
                        >
                          {PAYMENT_METHOD_LABELS[method as PaymentMethod]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div ref={categoryRef}>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Category</label>
                <div className="relative">
                  {categoryError && (
                    <div className="absolute -top-6 left-0 right-0 text-sm text-red-400">
                      {categoryError}
                    </div>
                  )}
                  <input
                    type="text"
                    value={category}
                    onChange={handleCategoryChange}
                    onFocus={() => setShowCategories(true)}
                    onBlur={() => {
                      setTimeout(() => setShowCategories(false), 200);
                    }}
                    className={`w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 ${
                      categoryError ? 'ring-red-500' : 'focus:ring-emerald-500'
                    }`}
                    placeholder="Select or type a category"
                    required
                    disabled={loadingCategories}
                  />
                  {showCategories && (
                    <div className={`absolute z-10 w-full mt-1 themed-card rounded-lg py-2 overflow-auto ${
                      isMobile ? 'max-h-48' : 'max-h-60'
                    }`}>
                      {loadingCategories ? (
                        <div className="px-4 py-2 text-theme-secondary">
                          Loading categories...
                        </div>
                      ) : filteredCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategoryClick(cat)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-700/50 text-theme-primary transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="themed-button px-6 py-3 rounded-lg text-theme-secondary hover:text-theme-primary transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`themed-button px-6 py-3 rounded-lg ${isBTC ? 'text-[#f7931a]' : 'text-emerald-500'} hover:opacity-80 transition-opacity flex items-center gap-2`}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Updating...
                  </>
                ) : 'Update Subscription'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
