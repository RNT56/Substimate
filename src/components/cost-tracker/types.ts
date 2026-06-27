export interface Node {
  name: string;
  category: 'income' | 'fixed' | 'variable' | 'subscription' | 'savings' | 'category';
  originalCategory?: string;
  services?: Array<{
    name: string;
    amount: number;
    details: Record<string, any>;
  }>;
  value?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

export interface Link {
  source: number | Node;
  target: number | Node;
  value: number;
  category: 'fixed' | 'variable' | 'subscription' | 'savings';
  sourceNode?: Node;
  targetNode?: Node;
  width?: number;
  id?: string;
}

export interface PriceHistory {
  subscription_id: string;
  monthly_cost: number;
  currency?: string | null;
  effective_from: string;
}

export interface Props {
  incomeSources: {
    source: string;
    amount: number;
    frequency: string;
    nextPayment?: string;
  }[];
  fixedExpenses: {
    category: string;
    amount: number;
    name: string;
    frequency: string;
  }[];
  variableExpenses: {
    category: string;
    amount: number;
    name: string;
    date: string;
  }[];
  subscriptions: {
    id: string;
    category: string;
    monthlyCost: number;
    currency: string;
    name: string;
    billingPeriod: string;
    usageState: string;
    startDate: string;
  }[];
}
