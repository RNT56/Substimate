import { useState } from 'react';
import { useFinancialData } from '../hooks/useFinancialData';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useFinanceAnalytics } from '../hooks/useFinanceAnalytics';
import { AssetManagementModal } from '../components/AssetManagementModal';
import { TransactionModal } from '../components/TransactionModal';
import { ExpenseModal } from '../components/ExpenseModal';
import { IncomeModal } from '../components/IncomeModal';
import { KeyMetrics } from '../components/finance/KeyMetrics';
import { QuickActions } from '../components/finance/QuickActions';
import { MonthlyTrendsChart } from '../components/finance/MonthlyTrendsChart';
import { AssetList } from '../components/finance/AssetList';
import { TransactionList } from '../components/finance/TransactionList';
import { ExpenseList } from '../components/finance/ExpenseList';
import { IncomeList } from '../components/finance/IncomeList';
import { CategoryDistributionChart } from '../components/finance/CategoryDistributionChart';
import type { FinancialAsset, AssetTransaction, FixedExpense, VariableExpense, Income } from '../types';

export function FinancePage() {
  // Modal states
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isFixedExpenseModalOpen, setIsFixedExpenseModalOpen] = useState(false);
  const [isVariableExpenseModalOpen, setIsVariableExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);

  // Editing states
  const [editingAsset, setEditingAsset] = useState<FinancialAsset | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<AssetTransaction | null>(null);
  const [editingFixedExpense, setEditingFixedExpense] = useState<FixedExpense | null>(null);
  const [editingVariableExpense, setEditingVariableExpense] = useState<VariableExpense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  // Hooks
  const { subscriptions } = useSubscriptions();
  const { 
    assets,
    transactions,
    fixedExpenses,
    variableExpenses,
    incomeSources,
    loading,
    addAsset,
    addTransaction,
    addFixedExpense,
    addVariableExpense,
    addIncome,
    deleteAsset,
    deleteTransaction,
    deleteFixedExpense,
    deleteVariableExpense,
    deleteIncome,
    updateAsset,
    updateTransaction,
    updateFixedExpense,
    updateVariableExpense,
    updateIncome
  } = useFinancialData();

  const { monthlyTrendsData } = useFinanceAnalytics(
    fixedExpenses,
    variableExpenses,
    incomeSources,
    transactions,
    subscriptions
  );

  // Calculate total subscription costs
  const totalSubscriptionCosts = subscriptions.reduce((sum, sub) => {
    return sum + (sub.monthlyCost || 0);
  }, 0);

  // Calculate financial metrics
  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalVariableExpenses = variableExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyIncome = incomeSources.reduce((sum, income) => {
    switch (income.frequency) {
      case 'weekly': return sum + (income.amount * 4);
      case 'monthly': return sum + income.amount;
      case 'yearly': return sum + (income.amount / 12);
      case 'one_time': return sum;
      default: return sum;
    }
  }, 0);

  const totalMonthlyExpenses = totalFixedExpenses + totalVariableExpenses + totalSubscriptionCosts;
  const monthlySavings = monthlyIncome - totalMonthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  // Handler for editing expenses with proper type narrowing
  const handleEditFixedExpense = (expense: FixedExpense | VariableExpense) => {
    if ('dueDate' in expense) {
      setEditingFixedExpense(expense as FixedExpense);
    }
  };

  const handleEditVariableExpense = (expense: FixedExpense | VariableExpense) => {
    if ('date' in expense) {
      setEditingVariableExpense(expense as VariableExpense);
    }
  };

  // Type-safe wrapper functions for expense updates
  const handleUpdateFixedExpense = (expense: FixedExpense | VariableExpense) => {
    if ('dueDate' in expense) {
      updateFixedExpense(expense);
    } else {
      console.error('Attempted to update fixed expense with variable expense data');
    }
  };

  const handleUpdateVariableExpense = (expense: FixedExpense | VariableExpense) => {
    if ('date' in expense) {
      updateVariableExpense(expense);
    } else {
      console.error('Attempted to update variable expense with fixed expense data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading financial data...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 title-gradient">Financial Overview</h1>
          <p className="text-theme-secondary">Track and analyze your complete financial picture</p>
        </div>

        {/* Quick Actions */}
        <QuickActions
          onAddAsset={() => setIsAssetModalOpen(true)}
          onAddTransaction={() => setIsTransactionModalOpen(true)}
          onAddFixedExpense={() => setIsFixedExpenseModalOpen(true)}
          onAddIncome={() => setIsIncomeModalOpen(true)}
        />

        {/* Key Metrics */}
        <KeyMetrics
          totalAssets={totalAssets}
          monthlyIncome={monthlyIncome}
          totalMonthlyExpenses={totalMonthlyExpenses}
          savingsRate={savingsRate}
        />

        {/* Monthly Trends */}
        <MonthlyTrendsChart data={monthlyTrendsData} />

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryDistributionChart 
            fixedExpenses={fixedExpenses}
            variableExpenses={variableExpenses}
            assets={assets}
            type="expenses"
          />
          <CategoryDistributionChart 
            fixedExpenses={fixedExpenses}
            variableExpenses={variableExpenses}
            assets={assets}
            type="assets"
          />
        </div>

        {/* Asset List */}
        <AssetList
          assets={assets}
          onAdd={() => setIsAssetModalOpen(true)}
          onEdit={setEditingAsset}
          onDelete={deleteAsset}
        />

        {/* Transaction List */}
        <TransactionList
          transactions={transactions}
          assets={assets}
          onAdd={() => setIsTransactionModalOpen(true)}
          onEdit={setEditingTransaction}
          onDelete={deleteTransaction}
        />

        {/* Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseList
            type="fixed"
            expenses={fixedExpenses as (FixedExpense | VariableExpense)[]}
            onAdd={() => setIsFixedExpenseModalOpen(true)}
            onEdit={handleEditFixedExpense}
            onDelete={deleteFixedExpense}
          />
          <ExpenseList
            type="variable"
            expenses={variableExpenses as (FixedExpense | VariableExpense)[]}
            onAdd={() => setIsVariableExpenseModalOpen(true)}
            onEdit={handleEditVariableExpense}
            onDelete={deleteVariableExpense}
          />
        </div>

        {/* Income Sources */}
        <IncomeList
          incomeSources={incomeSources}
          onAdd={() => setIsIncomeModalOpen(true)}
          onEdit={setEditingIncome}
          onDelete={deleteIncome}
        />
      </div>

      {/* Modals */}
      <AssetManagementModal
        isOpen={isAssetModalOpen || !!editingAsset}
        onClose={() => {
          setIsAssetModalOpen(false);
          setEditingAsset(null);
        }}
        onAdd={addAsset}
        onUpdate={updateAsset}
        asset={editingAsset}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen || !!editingTransaction}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onAdd={addTransaction}
        onUpdate={updateTransaction}
        assets={assets}
        transaction={editingTransaction}
      />

      <ExpenseModal
        isOpen={isFixedExpenseModalOpen || !!editingFixedExpense}
        onClose={() => {
          setIsFixedExpenseModalOpen(false);
          setEditingFixedExpense(null);
        }}
        onAddFixed={addFixedExpense}
        onAddVariable={addVariableExpense}
        onUpdate={handleUpdateFixedExpense}
        type="fixed"
        expense={editingFixedExpense}
      />

      <ExpenseModal
        isOpen={isVariableExpenseModalOpen || !!editingVariableExpense}
        onClose={() => {
          setIsVariableExpenseModalOpen(false);
          setEditingVariableExpense(null);
        }}
        onAddFixed={addFixedExpense}
        onAddVariable={addVariableExpense}
        onUpdate={handleUpdateVariableExpense}
        type="variable"
        expense={editingVariableExpense}
      />

      <IncomeModal
        isOpen={isIncomeModalOpen || !!editingIncome}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        onAdd={addIncome}
        onUpdate={updateIncome}
        income={editingIncome}
      />
    </>
  );
}