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