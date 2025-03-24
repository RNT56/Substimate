import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar } from 'lucide-react';
import type { Subscription, PaymentMethod, BillingPeriod, PriceChangeOptions } from '../types';
import { predictSubscription, getSubscriptionCategory } from '../utils/subscriptionPredictions';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useDevice } from '../hooks/useDevice';
import { DEFAULT_CATEGORIES } from '../lib/constants';
import type { Currency } from '../types';

const PAYMENT_METHODS: PaymentMethod[] = [
  // Traditional Payment Methods
  'Credit Card',
  'Debit Card',
  'PayPal',
  'Bank Transfer',
  'SEPA Direct Debit',
  // Digital Wallets
  'Apple Pay',
  'Google Pay',
  'Samsung Pay',
  // Crypto
  'Bitcoin',
  'Lightning Network',
  // Digital Banks
  'Revolut',
  'N26',
  'Wise',
  'Monzo',
  'Starling'
];

const CURRENCIES: Currency[] = ['EUR', 'USD', 'BTC'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (subscription: Subscription, priceChangeOptions?: PriceChangeOptions) => void;
  subscription: Subscription;
}

export function EditSubscriptionModal({ isOpen, onClose, onUpdate, subscription }: Props) {
  const [name, setName] = useState(subscription.name || '');
  const [url, setUrl] = useState(subscription.url || '');
  const [monthlyCost, setMonthlyCost] = useState(subscription.monthlyCost?.toString() || '0');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(subscription.billingPeriod || 'monthly');
  const [paymentMethod, setPaymentMethod] = useState(subscription.paymentMethod || '');
  const [category, setCategory] = useState(subscription.category || 'Other');
  const [startDate, setStartDate] = useState(subscription.startDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [filteredPaymentMethods, setFilteredPaymentMethods] = useState<string[]>(PAYMENT_METHODS);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [showPriceOptions, setShowPriceOptions] = useState(false);
  const [priceChangeOptions, setPriceChangeOptions] = useState<PriceChangeOptions>({
    applyToHistory: false,
    effectiveDate: new Date().toISOString().split('T')[0]
  });
  const { convertAmount, displayCurrency } = useCurrency();
  const { user } = useAuth();
  const { isMobile } = useDevice();
  const isBTC = displayCurrency === 'BTC';
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setUrl(subscription.url);
      // For yearly billing, show the yearly amount in the cost field
      const displayAmount = subscription.billingPeriod === 'yearly' 
        ? subscription.monthlyCost * 12 
        : subscription.monthlyCost;
      setMonthlyCost(displayAmount.toString());
      setBillingPeriod(subscription.billingPeriod);
      setPaymentMethod(subscription.paymentMethod);
      setCategory(subscription.category);
      setStartDate(subscription.startDate.split('T')[0]);
      
      setPriceChangeOptions({
        applyToHistory: false,
        effectiveDate: new Date().toISOString().split('T')[0]
      });
      setShowPriceOptions(false);
    }
  }, [subscription]);

  // Fetch user categories on mount
  React.useEffect(() => {
    if (user) {
      fetchUserCategories();
    }
  }, [user]);

  // Scroll handling for mobile dropdowns
  React.useEffect(() => {
    if (!isMobile) return;

    const adjustScroll = (ref: React.RefObject<HTMLDivElement>, show: boolean) => {
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

  const fetchUserCategories = async () => {
    try {
      setLoadingCategories(true);
      setCategoryError(null);

      const { data: categories = [], error } = await supabase
        .rpc('get_user_categories', { user_id: user?.id });

      if (error) throw error;

      // Start with default categories
      const allCategories = new Set(DEFAULT_CATEGORIES);

      // Add categories from subscriptions
      categories.forEach(({ category }) => {
        if (category) allCategories.add(category);
      });

      const sortedCategories = Array.from(allCategories).sort();
      setFilteredCategories(sortedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategoryError(error instanceof Error ? error.message : 'Failed to load categories');
      // Fallback to default categories
      setFilteredCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPaymentMethod(value);
    
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
      setFilteredCategories(DEFAULT_CATEGORIES);
      setShowCategories(true);
    } else {
      const filtered = filteredCategories.filter(cat => {
        // Handle null/undefined categories
        if (!cat) return false;
        return cat.toLowerCase().includes(value.toLowerCase());
      });
      setFilteredCategories(filtered);
      setShowCategories(filtered.length > 0);
    }
  };

  const handlePaymentMethodClick = (method: string) => {
    setPaymentMethod(method);
    setShowPaymentMethods(false);
  };

  const handleCategoryClick = (cat: string) => {
    setCategory(cat);
    setShowCategories(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store current values for rollback
    const previousValues = {
      name: subscription.name,
      url: subscription.url,
      monthlyCost: subscription.monthlyCost,
      billingPeriod: subscription.billingPeriod,
      paymentMethod: subscription.paymentMethod,
      category: subscription.category,
      startDate: subscription.startDate
    };

    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }
    
    // Calculate monthly cost based on billing period
    const inputAmount = parseFloat(monthlyCost);
    const calculatedMonthlyCost = billingPeriod === 'yearly' 
      ? inputAmount / 12  // Store monthly equivalent for yearly subscriptions
      : inputAmount;      // Store as-is for monthly subscriptions
    
    const costInEUR = convertAmount(calculatedMonthlyCost, currency, 'EUR');
    
    let priceChangeOpts = undefined;
    if (costInEUR !== subscription.monthlyCost) {
      priceChangeOpts = {
        applyToHistory: priceChangeOptions.applyToHistory,
        effectiveDate: priceChangeOptions.applyToHistory ? 
          subscription.startDate : 
          new Date(priceChangeOptions.effectiveDate).toISOString()
      };
    }

    try {
      const updatedSubscription = {
        ...subscription,
        name,
        url: formattedUrl,
        monthlyCost: costInEUR,
        billingPeriod,
        paymentMethod: paymentMethod as PaymentMethod,
        category: category || 'Other',
        startDate: new Date(startDate).toISOString()
      };

      await onUpdate(updatedSubscription, priceChangeOpts);
      onClose();
    } catch (error) {
      console.error('Error updating subscription:', error);
      // Restore previous values on error
      setName(previousValues.name);
      setUrl(previousValues.url);
      setMonthlyCost(previousValues.monthlyCost.toString());
      setBillingPeriod(previousValues.billingPeriod);
      setPaymentMethod(previousValues.paymentMethod);
      setCategory(previousValues.category);
      setStartDate(previousValues.startDate.split('T')[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <div className="neumorphic-card rounded-xl p-8 w-full max-w-md mt-8 mb-20">
          <h2 className="text-2xl font-bold mb-6 text-theme-primary">Edit Subscription</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        if (parseFloat(e.target.value) !== subscription.monthlyCost) {
                          setShowPriceOptions(true);
                        } else {
                          setShowPriceOptions(false);
                        }
                      }}
                      className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-secondary">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {CURRENCIES.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {showPriceOptions && (
                  <div className="neumorphic-card rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="applyToHistory"
                        checked={priceChangeOptions.applyToHistory}
                        onChange={(e) => setPriceChangeOptions(prev => ({
                          ...prev,
                          applyToHistory: e.target.checked
                        }))}
                        className="rounded border-gray-400 w-5 h-5"
                      />
                      <label htmlFor="applyToHistory" className="text-theme-primary">
                        Apply price change to all previous months
                      </label>
                    </div>
                    
                    <div className={`space-y-2 overflow-hidden transition-all duration-300 ${
                      priceChangeOptions.applyToHistory ? 'h-0 opacity-0' : 'h-20 opacity-100'
                    }`}>
                      <label className="block text-theme-secondary">
                        Price change effective from:
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={priceChangeOptions.effectiveDate}
                          onChange={(e) => setPriceChangeOptions(prev => ({
                            ...prev,
                            effectiveDate: e.target.value
                          }))}
                          min={subscription.startDate.split('T')[0]}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full neumorphic-input rounded-lg pl-10 pr-4 py-2 text-theme-primary"
                          disabled={priceChangeOptions.applyToHistory}
                        />
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary" size={16} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Billing Period</label>
                  <select
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value as BillingPeriod)}
                    className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
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
                    className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Select or type a payment method"
                    required
                  />
                  {showPaymentMethods && (
                    <div className={`absolute z-10 w-full mt-1 neumorphic-card rounded-lg py-2 overflow-auto ${
                      isMobile ? 'max-h-48' : 'max-h-60'
                    }`}>
                      {filteredPaymentMethods.map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => handlePaymentMethodClick(method)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-700/50 text-theme-primary transition-colors"
                        >
                          {method}
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
                    className={`w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 ${
                      categoryError ? 'ring-red-500' : 'focus:ring-emerald-500'
                    }`}
                    placeholder="Select or type a category"
                    required
                    disabled={loadingCategories}
                  />
                  {showCategories && (
                    <div className={`absolute z-10 w-full mt-1 neumorphic-card rounded-lg py-2 overflow-auto ${
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

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="neumorphic-button px-6 py-3 rounded-xl text-theme-secondary hover:text-theme-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`neumorphic-button px-6 py-3 rounded-xl ${
                  isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                } hover:opacity-80`}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}