import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { FixedExpense, VariableExpense } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddFixed: (expense: Omit<FixedExpense, 'id' | 'userId'>) => void;
  onAddVariable: (expense: Omit<VariableExpense, 'id' | 'userId'>) => void;
  onUpdate?: (expense: FixedExpense | VariableExpense) => void;
  type: 'fixed' | 'variable';
  expense?: FixedExpense | VariableExpense | null;
}

const EXPENSE_CATEGORIES = [
  'Housing',
  'Transportation',
  'Food',
  'Utilities',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Savings',
  'Custom',
  'Other'
];

const FREQUENCIES = ['monthly', 'quarterly', 'yearly'] as const;

export function ExpenseModal({ 
  isOpen, 
  onClose, 
  onAddFixed, 
  onAddVariable, 
  onUpdate, 
  type,
  expense 
}: Props) {
  const [name, setName] = useState(expense?.name || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [category, setCategory] = useState(expense?.category || 'Other');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState(
    expense && 'date' in expense 
      ? expense.date.split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    expense && 'dueDate' in expense && expense.dueDate
      ? expense.dueDate.split('T')[0]
      : ''
  );
  const [frequency, setFrequency] = useState<typeof FREQUENCIES[number]>(
    expense && 'frequency' in expense ? expense.frequency : 'monthly'
  );
  const [autopay, setAutopay] = useState(
    expense && 'autopay' in expense ? expense.autopay : false
  );
  const [notes, setNotes] = useState(expense?.notes || '');

  // Reset form when expense prop changes
  useEffect(() => {
    if (expense) {
      setName(expense.name);
      setAmount(expense.amount.toString());
      
      // Check if the category is one of our predefined categories
      if (EXPENSE_CATEGORIES.includes(expense.category)) {
        setCategory(expense.category);
        setCustomCategory('');
      } else {
        // If not, it's a custom category
        setCategory('Custom');
        setCustomCategory(expense.category);
      }
      
      setNotes(expense.notes || '');

      if ('date' in expense) {
        setDate(expense.date.split('T')[0]);
      }
      if ('dueDate' in expense) {
        setDueDate(expense.dueDate?.split('T')[0] || '');
        setFrequency(expense.frequency);
        setAutopay(expense.autopay);
      }
    } else {
      resetForm();
    }
  }, [expense, type]);

  const resetForm = () => {
    setName('');
    setAmount('');
    setCategory('Other');
    setCustomCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setFrequency('monthly');
    setAutopay(false);
    setNotes('');
  };

  const { displayCurrency } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use custom category value if "Custom" is selected
    const finalCategory = category === 'Custom' ? customCategory : category;

    const baseExpense = {
      name,
      amount: parseFloat(amount),
      category: finalCategory,
      notes: notes || null
    };

    if (type === 'fixed') {
      const fixedExpense = {
        ...baseExpense,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        frequency,
        autopay
      };

      if (expense && onUpdate) {
        onUpdate({ ...expense, ...fixedExpense } as FixedExpense);
      } else {
        onAddFixed(fixedExpense);
        resetForm();
      }
    } else {
      const variableExpense = {
        ...baseExpense,
        date: new Date(date).toISOString()
      };

      if (expense && onUpdate) {
        onUpdate({ ...expense, ...variableExpense } as VariableExpense);
      } else {
        onAddVariable(variableExpense);
        resetForm();
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <div className="themed-card rounded-xl p-8 w-full max-w-md mt-8 mb-20">
          <h2 className="text-2xl font-bold mb-6 text-theme-primary">
            {expense ? 'Edit' : 'Add'} {type === 'fixed' ? 'Fixed' : 'Variable'} Expense
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
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

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                {category === 'Custom' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                      className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                )}
              </div>

              {type === 'fixed' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-secondary">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-secondary">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as typeof FREQUENCIES[number])}
                      className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {FREQUENCIES.map(freq => (
                        <option key={freq} value={freq}>
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="autopay"
                      checked={autopay}
                      onChange={(e) => setAutopay(e.target.checked)}
                      className="rounded border-gray-400 w-5 h-5"
                    />
                    <label htmlFor="autopay" className="text-theme-primary">
                      Automatic Payment
                    </label>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
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
                {expense ? 'Update' : 'Add'} Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}