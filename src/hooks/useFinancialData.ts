import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { 
  FinancialAsset, 
  AssetTransaction, 
  FixedExpense, 
  VariableExpense, 
  Income 
} from '../types';

export function useFinancialData() {
  const [assets, setAssets] = useState<FinancialAsset[]>([]);
  const [transactions, setTransactions] = useState<AssetTransaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>([]);
  const [incomeSources, setIncomeSources] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const transformFixedExpense = useCallback((expense: any): FixedExpense => ({
    id: expense.id,
    userId: expense.user_id,
    name: expense.name,
    amount: Number(expense.amount) || 0,
    category: expense.category,
    dueDate: expense.due_date ?? expense.dueDate ?? null,
    frequency: expense.frequency,
    autopay: Boolean(expense.autopay),
    notes: expense.notes
  }), []);

  const transformVariableExpense = useCallback((expense: any): VariableExpense => ({
    id: expense.id,
    userId: expense.user_id,
    name: expense.name,
    amount: Number(expense.amount) || 0,
    category: expense.category,
    date: expense.date,
    notes: expense.notes
  }), []);

  const transformIncome = useCallback((income: any): Income => ({
    id: income.id,
    userId: income.user_id,
    name: income.name || income.source,
    amount: Number(income.amount) || 0,
    frequency: income.frequency,
    nextPayment: income.next_payment ?? income.nextPayment,
    source: income.source,
    notes: income.notes
  }), []);

  const fetchAssets = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_assets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our frontend types
      const transformedAssets: FinancialAsset[] = data.map(asset => ({
        id: asset.id,
        userId: asset.user_id,
        name: asset.name,
        type: asset.type,
        value: asset.value,
        quantity: asset.quantity ?? undefined,
        purchasePrice: asset.purchase_price ?? undefined,
        purchaseDate: asset.purchase_date ?? undefined,
        currentPrice: asset.current_price ?? undefined,
        notes: asset.notes ?? undefined,
        createdAt: asset.created_at,
        updatedAt: asset.updated_at ?? undefined
      }));

      setAssets(transformedAssets);
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('asset_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Transform the data to match our frontend types
      const transformedTransactions: AssetTransaction[] = data.map(tx => ({
        id: tx.id,
        userId: tx.user_id,
        assetId: tx.asset_id,
        type: tx.type,
        quantity: tx.quantity,
        price: tx.price,
        date: tx.date,
        fees: tx.fees ?? undefined,
        notes: tx.notes ?? undefined,
        createdAt: tx.created_at
      }));

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }, [user]);

  const fetchFixedExpenses = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setFixedExpenses((data || []).map(transformFixedExpense));
  }, [user, transformFixedExpense]);

  const fetchVariableExpenses = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('variable_expenses')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false });

    if (error) throw error;
    setVariableExpenses((data || []).map(transformVariableExpense));
  }, [user, transformVariableExpense]);

  const fetchIncome = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setIncomeSources((data || []).map(transformIncome));
  }, [user, transformIncome]);

  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAssets(),
        fetchTransactions(),
        fetchFixedExpenses(),
        fetchVariableExpenses(),
        fetchIncome()
      ]);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAssets, fetchTransactions, fetchFixedExpenses, fetchVariableExpenses, fetchIncome]);

  useEffect(() => {
    if (!user) {
      setAssets([]);
      setTransactions([]);
      setFixedExpenses([]);
      setVariableExpenses([]);
      setIncomeSources([]);
      setLoading(false);
      return;
    }

    void fetchFinancialData();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('financial-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_assets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          void fetchAssets();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asset_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          void fetchTransactions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fixed_expenses',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          void fetchFixedExpenses();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'variable_expenses',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          void fetchVariableExpenses();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'income_sources',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          void fetchIncome();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [
    user,
    fetchFinancialData,
    fetchAssets,
    fetchTransactions,
    fetchFixedExpenses,
    fetchVariableExpenses,
    fetchIncome
  ]);

  // Asset Management
  const addAsset = async (asset: Omit<FinancialAsset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('financial_assets')
        .insert({
          user_id: user!.id,
          name: asset.name,
          type: asset.type,
          value: asset.value,
          quantity: asset.quantity,
          purchase_price: asset.purchasePrice,
          purchase_date: asset.purchaseDate,
          current_price: asset.currentPrice,
          notes: asset.notes
        })
        .select()
        .single();

      if (error) throw error;

      // Transform the response to match our frontend types
      const newAsset: FinancialAsset = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        type: data.type,
        value: data.value,
        quantity: data.quantity ?? undefined,
        purchasePrice: data.purchase_price ?? undefined,
        purchaseDate: data.purchase_date ?? undefined,
        currentPrice: data.current_price ?? undefined,
        notes: data.notes ?? undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at ?? undefined
      };

      setAssets(prev => [newAsset, ...prev]);
      return newAsset;
    } catch (error) {
      console.error('Error adding asset:', error);
      throw error;
    }
  };

  const updateAsset = async (asset: FinancialAsset) => {
    try {
      const { data, error } = await supabase
        .from('financial_assets')
        .update({
          name: asset.name,
          type: asset.type,
          value: asset.value,
          quantity: asset.quantity,
          purchase_price: asset.purchasePrice,
          purchase_date: asset.purchaseDate,
          current_price: asset.currentPrice,
          notes: asset.notes
        })
        .eq('id', asset.id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;

      // Transform the response to match our frontend types
      const updatedAsset: FinancialAsset = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        type: data.type,
        value: data.value,
        quantity: data.quantity ?? undefined,
        purchasePrice: data.purchase_price ?? undefined,
        purchaseDate: data.purchase_date ?? undefined,
        currentPrice: data.current_price ?? undefined,
        notes: data.notes ?? undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at ?? undefined
      };

      setAssets(prev => prev.map(a => a.id === asset.id ? updatedAsset : a));
      return updatedAsset;
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_assets')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  };

  // Transaction Management
  const addTransaction = async (transaction: Omit<AssetTransaction, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('asset_transactions')
        .insert({
          user_id: user!.id,
          asset_id: transaction.assetId,
          type: transaction.type,
          quantity: transaction.quantity,
          price: transaction.price,
          date: transaction.date,
          fees: transaction.fees,
          notes: transaction.notes
        })
        .select()
        .single();

      if (error) throw error;

      // Transform the response to match our frontend types
      const newTransaction: AssetTransaction = {
        id: data.id,
        userId: data.user_id,
        assetId: data.asset_id,
        type: data.type,
        quantity: data.quantity,
        price: data.price,
        date: data.date,
        fees: data.fees ?? undefined,
        notes: data.notes ?? undefined,
        createdAt: data.created_at
      };

      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (transaction: AssetTransaction) => {
    try {
      const { data, error } = await supabase
        .from('asset_transactions')
        .update({
          asset_id: transaction.assetId,
          type: transaction.type,
          quantity: transaction.quantity,
          price: transaction.price,
          date: transaction.date,
          fees: transaction.fees,
          notes: transaction.notes
        })
        .eq('id', transaction.id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;

      // Transform the response to match our frontend types
      const updatedTransaction: AssetTransaction = {
        id: data.id,
        userId: data.user_id,
        assetId: data.asset_id,
        type: data.type,
        quantity: data.quantity,
        price: data.price,
        date: data.date,
        fees: data.fees ?? undefined,
        notes: data.notes ?? undefined,
        createdAt: data.created_at
      };

      setTransactions(prev => prev.map(t => t.id === transaction.id ? updatedTransaction : t));
      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('asset_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  // Fixed Expense Management
  const addFixedExpense = async (expense: Omit<FixedExpense, 'id' | 'userId'>) => {
    try {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .insert([{
          user_id: user!.id,
          name: expense.name,
          amount: expense.amount,
          category: expense.category,
          due_date: expense.dueDate,
          frequency: expense.frequency,
          autopay: expense.autopay,
          notes: expense.notes
        }])
        .select()
        .single();

      if (error) throw error;
      setFixedExpenses(prev => [transformFixedExpense(data), ...prev]);
    } catch (error) {
      console.error('Error adding fixed expense:', error);
      throw error;
    }
  };

  const updateFixedExpense = async (expense: FixedExpense) => {
    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .update({
          name: expense.name,
          amount: expense.amount,
          category: expense.category,
          due_date: expense.dueDate,
          frequency: expense.frequency,
          autopay: expense.autopay,
          notes: expense.notes
        })
        .eq('id', expense.id)
        .eq('user_id', user!.id);

      if (error) throw error;
      setFixedExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    } catch (error) {
      console.error('Error updating fixed expense:', error);
      throw error;
    }
  };

  const deleteFixedExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      setFixedExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting fixed expense:', error);
      throw error;
    }
  };

  // Variable Expense Management
  const addVariableExpense = async (expense: Omit<VariableExpense, 'id' | 'userId'>) => {
    try {
      const { data, error } = await supabase
        .from('variable_expenses')
        .insert([{
          user_id: user!.id,
          name: expense.name,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          notes: expense.notes
        }])
        .select()
        .single();

      if (error) throw error;
      setVariableExpenses(prev => [transformVariableExpense(data), ...prev]);
    } catch (error) {
      console.error('Error adding variable expense:', error);
      throw error;
    }
  };

  const updateVariableExpense = async (expense: VariableExpense) => {
    try {
      const { error } = await supabase
        .from('variable_expenses')
        .update({
          name: expense.name,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          notes: expense.notes
        })
        .eq('id', expense.id)
        .eq('user_id', user!.id);

      if (error) throw error;
      setVariableExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    } catch (error) {
      console.error('Error updating variable expense:', error);
      throw error;
    }
  };

  const deleteVariableExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('variable_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      setVariableExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting variable expense:', error);
      throw error;
    }
  };

  // Income Management
  const addIncome = async (income: Omit<Income, 'id' | 'userId'>) => {
    try {
      const { data, error } = await supabase
        .from('income_sources')
        .insert([{
          user_id: user!.id,
          source: income.source || income.name,
          amount: income.amount,
          frequency: income.frequency,
          next_payment: income.nextPayment,
          notes: income.notes
        }])
        .select()
        .single();

      if (error) throw error;
      setIncomeSources(prev => [transformIncome(data), ...prev]);
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  };

  const updateIncome = async (income: Income) => {
    try {
      const { error } = await supabase
        .from('income_sources')
        .update({
          source: income.source || income.name,
          amount: income.amount,
          frequency: income.frequency,
          next_payment: income.nextPayment,
          notes: income.notes
        })
        .eq('id', income.id)
        .eq('user_id', user!.id);

      if (error) throw error;
      setIncomeSources(prev => prev.map(i => i.id === income.id ? income : i));
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      const { error } = await supabase
        .from('income_sources')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      setIncomeSources(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  };

  return {
    assets,
    transactions,
    fixedExpenses,
    variableExpenses,
    incomeSources,
    loading,
    addAsset,
    updateAsset,
    deleteAsset,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    addVariableExpense,
    updateVariableExpense,
    deleteVariableExpense,
    addIncome,
    updateIncome,
    deleteIncome
  };
}
