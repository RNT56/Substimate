import React from 'react';
import { ActionButtons } from '../ActionButtons';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import type { FixedExpense, VariableExpense } from '../../types';

interface Props {
  type: 'fixed' | 'variable';
  expenses: (FixedExpense | VariableExpense)[];
  onAdd: () => void;
  onEdit: (expense: FixedExpense | VariableExpense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({ type, expenses, onAdd, onEdit, onDelete }: Props) {
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
  const { theme } = useTheme();
  const isBTC = displayCurrency === 'BTC';
  const isDark = theme === 'dark';

  return (
    <div className="themed-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-theme-primary">
          {type === 'fixed' ? 'Fixed' : 'Variable'} Expenses
        </h2>
        <button
          onClick={onAdd}
          className={`neumorphic-button px-4 py-2 rounded-lg ${
            isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
          } hover:opacity-80 flex items-center gap-2`}
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      <div className="space-y-4">
        {expenses.map(expense => (
          <div 
            key={expense.id}
            className={`flex items-center justify-between p-4 rounded-lg group transition-colors ${
              isDark 
                ? 'bg-gray-800/30 hover:bg-gray-800/40' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <div>
              <p className="text-theme-primary font-medium">{expense.name}</p>
              <p className="text-sm text-theme-secondary">
                {expense.category} • {
                  'frequency' in expense 
                    ? expense.frequency
                    : format(parseISO(expense.date), 'MMM d, yyyy')
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}>
                {formatAmount(convertAmount(expense.amount, 'EUR', displayCurrency), displayCurrency)}
              </p>
              <ActionButtons
                onEdit={() => onEdit(expense)}
                onDelete={() => onDelete(expense.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}