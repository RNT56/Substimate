// Add these new types to the existing types.ts file

export interface LifetimeCostData {
  name: string;
  totalSpent: number;
  monthlyCost: number;
  months: number;
  startDate: string;
  billingPeriod: string;
  usageState: string;
}

export interface CategoryAnalytics {
  name: string;
  totalCost: number;
  subscriptionCount: number;
  averageCostPerService: number;
}

export interface PriceChangeOptions {
  applyToHistory: boolean;
  effectiveDate: string;
}

export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'apple_pay' | 'google_pay' | 'crypto';
export type BillingPeriod = 'monthly' | 'yearly';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'BTC' | 'ETH';

export interface Subscription {
  id: string;
  name: string;
  description?: string;
  // Support both naming conventions for backwards compatibility
  amount?: number;
  monthlyCost?: number;
  currency: Currency;
  billingPeriod: BillingPeriod;
  paymentMethod: PaymentMethod;
  category: string;
  startDate: string;
  endDate?: string;
  color?: string;
  reminderDate?: string;
  autoRenew?: boolean;
  userId?: string;
  usageState?: 'active' | 'inactive' | 'abandoned';
  order?: number;
  // Add additional fields used in the codebase
  url?: string;
  icon?: string;
  isFavorite?: boolean;
  favorite?: boolean;
}

// Financial type definitions
export interface FinancialAsset {
  id: string;
  userId: string;
  name: string;
  type: string;
  value: number;
  quantity?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  currentPrice?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetTransaction {
  id: string;
  userId: string;
  assetId: string;
  type: 'buy' | 'sell' | 'dividend' | 'other';
  quantity: number;
  price: number;
  date: string;
  fees?: number;
  notes?: string;
  createdAt?: string;
}

export interface FixedExpense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  dueDate: string | null;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  autopay: boolean;
  notes?: string | null;
}

export interface VariableExpense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  notes?: string | null;
}

export interface Income {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly' | 'one_time';
  nextPayment?: string;
  source: string;
  notes?: string | null;
}