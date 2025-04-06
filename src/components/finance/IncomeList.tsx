import React from 'react';
import { ActionButtons } from '../ActionButtons';
import { useCurrency } from '../../contexts/CurrencyContext';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import type { Income } from '../../types';

interface Props {
  incomeSources: Income[];
  onAdd: () => void;
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
}

export function IncomeList({ incomeSources, onAdd, onEdit, onDelete }: Props) {
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  return (
    <div className="themed-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-theme-primary">Income Sources</h2>
        <button
          onClick={onAdd}
          className={`themed-button px-4 py-2 rounded-lg ${
            isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
          } hover:opacity-80 flex items-center gap-2`}
        >
          <Plus size={20} />
          Add Income
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 text-theme-secondary">Source</th>
              <th className="text-left py-3 text-theme-secondary">Frequency</th>
              <th className="text-right py-3 text-theme-secondary">Amount</th>
              <th className="text-right py-3 text-theme-secondary">Next Payment</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {incomeSources.map(income => (
              <tr 
                key={income.id} 
                className="border-b border-gray-700/50 group hover:bg-gray-800/10 transition-colors"
              >
                <td className="py-3 text-theme-primary">{income.source}</td>
                <td className="py-3 text-theme-secondary capitalize">
                  {income.frequency.replace('_', ' ')}
                </td>
                <td className="py-3 text-right text-theme-primary">
                  {formatAmount(convertAmount(income.amount, 'EUR', displayCurrency), displayCurrency)}
                </td>
                <td className="py-3 text-right text-theme-secondary">
                  {income.nextPayment
                    ? format(parseISO(income.nextPayment), 'MMM d, yyyy')
                    : '-'}
                </td>
                <td className="py-3">
                  <ActionButtons
                    onEdit={() => onEdit(income)}
                    onDelete={() => onDelete(income.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}