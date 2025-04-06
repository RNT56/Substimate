import React from 'react';
import { format } from 'date-fns';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { X } from 'lucide-react';

// Reuse types or define locally if needed
interface PaymentEvent {
  name: string;
  amount: number;
  date: Date;
  type: 'upcoming' | 'past';
  billingPeriod: string;
}
interface SelectedPaydayData {
  date: Date;
  events: PaymentEvent[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: SelectedPaydayData;
}

export function PaydayDetailModal({ isOpen, onClose, data }: Props) {
  const { displayCurrency, formatAmount } = useCurrency();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  if (!isOpen) return null;

  const { date, events } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="themed-card rounded-xl p-6 w-full max-w-md relative max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-theme-border">
          <h3 className="text-xl font-semibold text-theme-primary">
            Payments for {format(date, 'MMM d, yyyy')}
          </h3>
          <button
            onClick={onClose}
            className="themed-button p-2 rounded-lg text-theme-secondary hover:text-theme-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Event List */}
        <div className="overflow-y-auto flex-grow custom-scrollbar pr-2 -mr-2">
          <div className="space-y-3">
            {events.map((event, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg border ${ // Added border for structure
                  event.billingPeriod === 'yearly' 
                    ? isDark
                      ? 'bg-[#2d2d2d] border-purple-500/30'
                      : 'bg-purple-100 border-purple-200'
                    : isDark
                      ? 'bg-[#252525] border-[#2d2d2d]'
                      : 'bg-gray-100 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-theme-primary text-sm truncate" title={event.name}>{event.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ // Adjusted tag styling
                    event.billingPeriod === 'yearly'
                      ? isDark
                        ? 'bg-[#1e1b4b] text-purple-300'
                        : 'bg-purple-200 text-purple-800'
                      : isDark
                        ? 'bg-[#1a1a1a] text-gray-400'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {event.billingPeriod}
                  </span>
                </div>
                <div className={`mt-1 text-sm ${ // Adjusted amount styling
                  event.type === 'upcoming' 
                    ? isBTC 
                      ? 'text-[#f7931a]' 
                      : isDark
                        ? 'text-emerald-400'
                        : 'text-emerald-600'
                    : 'text-theme-secondary'
                }`}>
                  {formatAmount(event.amount, displayCurrency)}
                  {event.type === 'past' && <span className="text-xs"> (Paid)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer (Optional Close Button) */}
        {/* <div className="mt-6 pt-4 border-t border-theme-border flex justify-end">
          <button
            onClick={onClose}
            className="themed-button px-4 py-2 rounded-xl text-theme-secondary hover:text-theme-primary"
          >
            Close
          </button>
        </div> */}
      </div>
    </div>
  );
} 