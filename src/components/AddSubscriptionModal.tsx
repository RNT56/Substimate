import React, { useState, useRef, useEffect } from 'react';
import { Bot, MessageSquare, Image, Search, Tv, Music, Video, Code, ShoppingBag, Plus, Calendar, Loader2 } from 'lucide-react';
import type { Subscription, PaymentMethod, BillingPeriod } from '../types';
import { predictSubscription, getSubscriptionCategory } from '../utils/subscriptionPredictions';
import { useCurrency } from '../contexts/CurrencyContext';
import { useDevice } from '../hooks/useDevice';
import type { Currency } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { DEFAULT_CATEGORIES } from '../lib/constants';
import { DatePicker } from './DatePicker';

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

const CATEGORIES = [
  'AI Chat',
  'Coding',
  'Diffusion',
  'Streaming',
  'Music',
  'Gaming',
  'Productivity',
  'Audio Generation',
  'Video Generation',
  'Cloud Services',
  'Fitness',
  'Health',
  'Food',
  'Transport',
  'Financial',
  'Other'
];

const SUGGESTIONS = [
  'Netflix',
  'Spotify',
  'ChatGPT',
  'Disney+',
  'Apple Music',
  'YouTube Premium',
  'Amazon Prime',
  'HBO Max',
  'Apple TV+',
  'GitHub',
  'Midjourney',
  'Bolt.new',
  'v0.dev'
];

const CURRENCIES: Currency[] = ['EUR', 'USD', 'BTC'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (subscription: Subscription) => void;
}

export function AddSubscriptionModal({ isOpen, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [monthlyCost, setMonthlyCost] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('Tv');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>(SUGGESTIONS);
  const [filteredPaymentMethods, setFilteredPaymentMethods] = useState<string[]>(PAYMENT_METHODS);
  const [filteredCategories, setFilteredCategories] = useState<string[]>(CATEGORIES);
  const { isMobile } = useDevice();
  const inputRef = useRef<HTMLInputElement>(null);
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const { convertAmount } = useCurrency();
  const { submitting } = useToast();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    
    if (value.length === 0) {
      setFilteredSuggestions(SUGGESTIONS);
      setShowSuggestions(true);
    } else {
      const filtered = SUGGESTIONS.filter(suggestion => 
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      
      const prediction = predictSubscription(value);
      if (prediction) {
        setUrl(prediction.url);
        setMonthlyCost(prediction.monthlyCost.toString());
        setIcon(prediction.icon);
        const predictedCategory = getSubscriptionCategory(value);
        setCategory(predictedCategory);
      }
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
      setFilteredCategories(CATEGORIES);
      setShowCategories(true);
    } else {
      const filtered = CATEGORIES.filter(cat => 
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
      setShowCategories(filtered.length > 0);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setName(suggestion);
    setShowSuggestions(false);
    const prediction = predictSubscription(suggestion);
    if (prediction) {
      setUrl(prediction.url);
      setMonthlyCost(prediction.monthlyCost.toString());
      setIcon(prediction.icon);
      const predictedCategory = getSubscriptionCategory(suggestion);
      setCategory(predictedCategory);
    }
    inputRef.current?.blur();
  };

  const handlePaymentMethodClick = (method: string) => {
    setPaymentMethod(method);
    setShowPaymentMethods(false);
  };

  const handleCategoryClick = (cat: string) => {
    setCategory(cat);
    setShowCategories(false);
  };

  // Scroll handling for mobile dropdowns
  useEffect(() => {
    if (!isMobile) return;

    const adjustScroll = (ref: React.RefObject<HTMLDivElement>, show: boolean) => {
      if (show && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const bottomSpace = viewportHeight - rect.bottom;
        
        if (bottomSpace < 200) { // If less than 200px from bottom
          const scrollNeeded = 200 - bottomSpace;
          window.scrollBy({ top: scrollNeeded, behavior: 'smooth' });
        }
      }
    };

    adjustScroll(paymentMethodRef, showPaymentMethods);
    adjustScroll(categoryRef, showCategories);
  }, [showPaymentMethods, showCategories, isMobile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }
    
    // Calculate monthly cost based on billing period
    const inputAmount = parseFloat(monthlyCost);
    const calculatedMonthlyCost = billingPeriod === 'yearly' 
      ? inputAmount / 12  // Store monthly equivalent for yearly subscriptions
      : inputAmount;      // Store as-is for monthly subscriptions
    
    // Convert to EUR for storage
    const costInEUR = convertAmount(calculatedMonthlyCost, currency, 'EUR');
    
    onAdd({
      id: crypto.randomUUID(),
      name,
      url: formattedUrl,
      icon,
      monthlyCost: costInEUR,
      currency,
      billingPeriod,
      paymentMethod: paymentMethod as PaymentMethod,
      category: category || 'Other',
      usageState: 'active',
      startDate: new Date(startDate).toISOString()
    });

    // Reset form
    setName('');
    setUrl('');
    setMonthlyCost('');
    setCurrency('EUR');
    setBillingPeriod('monthly');
    setPaymentMethod('');
    setCategory('');
    setIcon('Tv');
    setStartDate(new Date().toISOString().split('T')[0]);
    setShowSuggestions(false);
    setShowPaymentMethods(false);
    setShowCategories(false);
    setFilteredSuggestions(SUGGESTIONS);
    setFilteredPaymentMethods(PAYMENT_METHODS);
    setFilteredCategories(CATEGORIES);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />
      <div className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <div className={`themed-card rounded-xl p-8 w-full max-w-md mt-8 mb-20 ${submitting ? 'opacity-70 pointer-events-none' : ''}`}>
          {submitting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10 rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <p className="text-theme-secondary">Adding subscription...</p>
              </div>
            </div>
          )}
          
          <h2 className="text-2xl font-bold mb-6 text-theme-primary">Add Subscription</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="relative">
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Name</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  onFocus={() => {
                    if (name.length === 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  placeholder="Select or type a service name"
                />
                {showSuggestions && (
                  <div className="absolute z-10 w-full mt-1 themed-card rounded-lg py-2 max-h-60 overflow-auto">
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-700/50 text-theme-primary transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyCost}
                    onChange={(e) => setMonthlyCost(e.target.value)}
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
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
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
                  <input
                    type="text"
                    value={category}
                    onChange={handleCategoryChange}
                    onFocus={() => setShowCategories(true)}
                    onBlur={() => {
                      setTimeout(() => setShowCategories(false), 200);
                    }}
                    className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Select or type a category"
                    required
                  />
                  {showCategories && (
                    <div className={`absolute z-10 w-full mt-1 themed-card rounded-lg py-2 overflow-auto ${
                      isMobile ? 'max-h-48' : 'max-h-60'
                    }`}>
                      {filteredCategories.map((cat) => (
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
                className="themed-button px-6 py-3 rounded-xl text-theme-secondary hover:text-theme-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="themed-button px-6 py-3 rounded-xl highlight-color hover:opacity-80"
              >
                Add Subscription
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}