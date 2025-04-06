import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { Income } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (income: Omit<Income, 'id' | 'userId'>) => void;
  onUpdate?: (income: Income) => void;
  income?: Income | null;
}

const FREQUENCIES = ['monthly', 'weekly', 'yearly', 'one_time'] as const;

export function IncomeModal({ isOpen, onClose, onAdd, onUpdate, income }: Props) {
  const [source, setSource] = useState(income?.source || '');
  const [amount, setAmount] = useState(income?.amount?.toString() || '');
  const [frequency, setFrequency] = useState<typeof FREQUENCIES[number]>(
    income?.frequency || 'monthly'
  );
  const [nextPayment, setNextPayment] = useState(
    income?.nextPayment?.split('T')[0] || ''
  );
  const [notes, setNotes] = useState<string | undefined>(income?.notes ?? undefined);
  const [isRecurring, setIsRecurring] = useState(true);

  // Reset form when income prop changes
  useEffect(() => {
    if (income) {
      setSource(income.source);
      setAmount(income.amount.toString());
      setFrequency(income.frequency);
      setNextPayment(income.nextPayment?.split('T')[0] || '');
      setNotes(income.notes ?? undefined);
      setIsRecurring(income.frequency !== 'one_time');
    } else {
      resetForm();
    }
  }, [income]);

  const resetForm = () => {
    setSource('');
    setAmount('');
    setFrequency('monthly');
    setNextPayment('');
    setNotes(undefined);
    setIsRecurring(true);
  };

  const { displayCurrency } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const incomeData = {
      name: source,
      source,
      amount: parseFloat(amount),
      frequency: isRecurring ? frequency : 'one_time',
      nextPayment: nextPayment ? new Date(nextPayment).toISOString() : undefined,
      notes: notes || undefined
    };

    if (income && onUpdate) {
      onUpdate({ ...income, ...incomeData });
    } else {
      onAdd(incomeData);
      resetForm();
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <div className="themed-card rounded-xl p-8 w-full max-w-md mt-8 mb-20">
          <h2 className="text-2xl font-bold mb-6 text-theme-primary">
            {income ? 'Edit' : 'Add'} Income Source
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  placeholder="e.g., Salary, Freelance, Investments"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-gray-400 w-5 h-5"
                />
                <label htmlFor="recurring" className="text-theme-primary">
                  Recurring Income
                </label>
              </div>

              {isRecurring && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as typeof FREQUENCIES[number])}
                    className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {FREQUENCIES.filter(freq => freq !== 'one_time').map(freq => (
                      <option key={freq} value={freq}>
                        {freq.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Next Payment Date</label>
                <input
                  type="date"
                  value={nextPayment}
                  onChange={(e) => setNextPayment(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Notes</label>
                <textarea
                  value={notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Add any additional details about this income source"
                />
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
                className={`themed-button px-6 py-3 rounded-xl flex items-center gap-2 ${
                  isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                } hover:opacity-80`}
              >
                <Plus size={20} />
                {income ? 'Update' : 'Add'} Income
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}