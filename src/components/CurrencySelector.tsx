import React from 'react';
import { DollarSign, Bitcoin, Euro, type LucideIcon } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import type { Currency } from '../types';

const CURRENCIES: { value: Currency; label: string; icon: LucideIcon }[] = [
  { value: 'EUR', label: 'EUR', icon: Euro },
  { value: 'USD', label: 'USD', icon: DollarSign },
  { value: 'BTC', label: 'BTC', icon: Bitcoin }
];

export function CurrencySelector() {
  const { displayCurrency, setDisplayCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-3">
      {CURRENCIES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setDisplayCurrency(value)}
          className={`themed-button px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            displayCurrency === value
              ? value === 'BTC' ? 'text-[#f7931a]' : 'text-emerald-400'
              : 'text-theme-secondary hover:text-theme-primary'
          }`}
        >
          <Icon size={16} />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
