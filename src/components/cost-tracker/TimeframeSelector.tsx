import React from 'react';
import { Calendar } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { format } from 'date-fns';

export type Timeframe = 'monthly' | 'quarterly' | 'yearly';

interface Props {
  timeframe: Timeframe;
  selectedDate: Date;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onDateChange: (date: Date) => void;
}

export function TimeframeSelector({ timeframe, selectedDate, onTimeframeChange, onDateChange }: Props) {
  const { displayCurrency } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  return (
    <div className="flex items-center gap-6">
      {/* Date Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-theme-secondary">From:</span>
        <div className="relative">
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => onDateChange(new Date(e.target.value))}
            className="neumorphic-input rounded-lg pl-10 pr-4 py-2 text-theme-primary"
          />
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary" size={16} />
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-theme-secondary">Show:</span>
        <div className="flex rounded-lg overflow-hidden">
          {(['monthly', 'quarterly', 'yearly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTimeframeChange(t)}
              className={`
                px-4 py-2 text-sm transition-colors
                ${timeframe === t
                  ? isBTC 
                    ? 'bg-[#f7931a] text-white'
                    : 'bg-emerald-500 text-white'
                  : 'text-theme-secondary hover:text-theme-primary'
                }
              `}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}