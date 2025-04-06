import React from 'react';
import { Wallet, ArrowUpDown, Calendar, CreditCard } from 'lucide-react';

interface Props {
  onAddAsset: () => void;
  onAddTransaction: () => void;
  onAddFixedExpense: () => void;
  onAddIncome: () => void;
}

export function QuickActions({ 
  onAddAsset, 
  onAddTransaction, 
  onAddFixedExpense, 
  onAddIncome 
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button
        onClick={onAddAsset}
        className="themed-button p-4 rounded-xl text-theme-secondary hover:text-theme-primary"
      >
        <Wallet className="w-6 h-6 mb-2" />
        <span className="text-sm">Add Asset</span>
      </button>
      <button
        onClick={onAddTransaction}
        className="themed-button p-4 rounded-xl text-theme-secondary hover:text-theme-primary"
      >
        <ArrowUpDown className="w-6 h-6 mb-2" />
        <span className="text-sm">Add Transaction</span>
      </button>
      <button
        onClick={onAddFixedExpense}
        className="themed-button p-4 rounded-xl text-theme-secondary hover:text-theme-primary"
      >
        <Calendar className="w-6 h-6 mb-2" />
        <span className="text-sm">Add Fixed Expense</span>
      </button>
      <button
        onClick={onAddIncome}
        className="themed-button p-4 rounded-xl text-theme-secondary hover:text-theme-primary"
      >
        <CreditCard className="w-6 h-6 mb-2" />
        <span className="text-sm">Add Income</span>
      </button>
    </div>
  );
}