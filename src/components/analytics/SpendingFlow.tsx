import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Props {
  subscriptions: any[];
  fixedExpenses: any[];
  variableExpenses: any[];
  incomeSources: any[];
}

export function SpendingFlow({ 
  subscriptions,
  fixedExpenses,
  variableExpenses,
  incomeSources 
}: Props) {
  const { theme } = useTheme();
  const { displayCurrency } = useCurrency();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  return (
    <div className="h-full">
      <h2 className="text-xl font-semibold mb-4 text-theme-primary">Spending Flow</h2>
      {/* TODO: Implement spending flow visualization */}
      <div className="h-[400px] flex items-center justify-center text-theme-secondary">
        Coming soon: Interactive spending flow visualization
      </div>
    </div>
  );
}