/*
  # Add Financial Tables and Policies

  1. New Tables
    - financial_assets
    - asset_transactions
    - fixed_expenses
    - variable_expenses
    - income_sources

  2. Security
    - RLS policies for all tables
    - Proper indexes for performance
    - Foreign key constraints

  3. Changes
    - Safe table creation with IF NOT EXISTS
    - Safe policy creation with DO blocks
*/

-- Financial Assets Table
CREATE TABLE IF NOT EXISTS financial_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('stock', 'crypto', 'savings', 'real_estate', 'other')),
  value numeric(20,2) NOT NULL,
  quantity numeric(20,8),
  purchase_price numeric(20,2),
  purchase_date timestamptz,
  current_price numeric(20,2),
  last_updated timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Asset Transactions Table
CREATE TABLE IF NOT EXISTS asset_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES financial_assets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity numeric(20,8) NOT NULL,
  price numeric(20,2) NOT NULL,
  date timestamptz NOT NULL,
  fees numeric(20,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Fixed Expenses Table
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric(20,2) NOT NULL,
  category text NOT NULL,
  due_date date,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  autopay boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Variable Expenses Table
CREATE TABLE IF NOT EXISTS variable_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric(20,2) NOT NULL,
  category text NOT NULL,
  date timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Income Sources Table
CREATE TABLE IF NOT EXISTS income_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source text NOT NULL,
  amount numeric(20,2) NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'yearly', 'one_time')),
  next_payment date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS and create policies safely
DO $$
BEGIN
  -- Financial Assets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financial_assets' 
    AND policyname = 'Users can manage their own assets'
  ) THEN
    ALTER TABLE financial_assets ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage their own assets"
    ON financial_assets
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Asset Transactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'asset_transactions' 
    AND policyname = 'Users can manage their own transactions'
  ) THEN
    ALTER TABLE asset_transactions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage their own transactions"
    ON asset_transactions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Fixed Expenses
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fixed_expenses' 
    AND policyname = 'Users can manage their own fixed expenses'
  ) THEN
    ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage their own fixed expenses"
    ON fixed_expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Variable Expenses
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'variable_expenses' 
    AND policyname = 'Users can manage their own variable expenses'
  ) THEN
    ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage their own variable expenses"
    ON variable_expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Income Sources
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'income_sources' 
    AND policyname = 'Users can manage their own income sources'
  ) THEN
    ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage their own income sources"
    ON income_sources
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_assets_user_id ON financial_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_assets_type ON financial_assets(type);
CREATE INDEX IF NOT EXISTS idx_financial_assets_last_updated ON financial_assets(last_updated);

CREATE INDEX IF NOT EXISTS idx_asset_transactions_user_id ON asset_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_transactions_asset_id ON asset_transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_transactions_date ON asset_transactions(date);

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category ON fixed_expenses(category);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_due_date ON fixed_expenses(due_date);

CREATE INDEX IF NOT EXISTS idx_variable_expenses_user_id ON variable_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_category ON variable_expenses(category);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_date ON variable_expenses(date);

CREATE INDEX IF NOT EXISTS idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_frequency ON income_sources(frequency);
CREATE INDEX IF NOT EXISTS idx_income_sources_next_payment ON income_sources(next_payment);