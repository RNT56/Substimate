/*
  # Financial Management Tables

  1. New Tables
    - financial_assets
      - Asset tracking with type, value, and purchase info
    - asset_transactions
      - Buy/sell transactions for assets
    - fixed_expenses
      - Regular recurring expenses
    - variable_expenses
      - One-time or irregular expenses
    - income_sources
      - Income tracking with frequency

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add appropriate indexes
*/

-- Financial Assets
CREATE TABLE IF NOT EXISTS financial_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('stock', 'crypto', 'savings', 'real_estate', 'other')),
  value numeric(20,2) NOT NULL CHECK (value >= 0),
  quantity numeric(20,8),
  "purchasePrice" numeric(20,2),
  "purchaseDate" timestamptz,
  "currentPrice" numeric(20,2),
  "lastUpdated" timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Asset Transactions
CREATE TABLE IF NOT EXISTS asset_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "assetId" uuid NOT NULL REFERENCES financial_assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity numeric(20,8) NOT NULL,
  price numeric(20,2) NOT NULL CHECK (price >= 0),
  date timestamptz NOT NULL,
  fees numeric(20,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Fixed Expenses
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(20,2) NOT NULL CHECK (amount >= 0),
  category text NOT NULL,
  "dueDate" date,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  autopay boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Variable Expenses
CREATE TABLE IF NOT EXISTS variable_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(20,2) NOT NULL CHECK (amount >= 0),
  category text NOT NULL,
  date timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Income Sources
CREATE TABLE IF NOT EXISTS income_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  amount numeric(20,2) NOT NULL CHECK (amount >= 0),
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'yearly', 'one_time')),
  "nextPayment" date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE financial_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage their own assets" ON financial_assets;
  DROP POLICY IF EXISTS "Users can manage their own transactions" ON asset_transactions;
  DROP POLICY IF EXISTS "Users can manage their own fixed expenses" ON fixed_expenses;
  DROP POLICY IF EXISTS "Users can manage their own variable expenses" ON variable_expenses;
  DROP POLICY IF EXISTS "Users can manage their own income sources" ON income_sources;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies
CREATE POLICY "Users can manage their own assets"
  ON financial_assets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transactions"
  ON asset_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own fixed expenses"
  ON fixed_expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own variable expenses"
  ON variable_expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own income sources"
  ON income_sources
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_financial_assets_user_id ON financial_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_assets_type ON financial_assets(type);

CREATE INDEX IF NOT EXISTS idx_asset_transactions_user_id ON asset_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_transactions_asset_id ON asset_transactions("assetId");
CREATE INDEX IF NOT EXISTS idx_asset_transactions_date ON asset_transactions(date);

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category ON fixed_expenses(category);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_due_date ON fixed_expenses("dueDate");

CREATE INDEX IF NOT EXISTS idx_variable_expenses_user_id ON variable_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_category ON variable_expenses(category);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_date ON variable_expenses(date);

CREATE INDEX IF NOT EXISTS idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_frequency ON income_sources(frequency);
CREATE INDEX IF NOT EXISTS idx_income_sources_next_payment ON income_sources("nextPayment");

-- Create function to update lastUpdated timestamp
CREATE OR REPLACE FUNCTION update_asset_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW."lastUpdated" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update lastUpdated
DROP TRIGGER IF EXISTS update_asset_last_updated ON financial_assets;
CREATE TRIGGER update_asset_last_updated
  BEFORE UPDATE ON financial_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_last_updated();