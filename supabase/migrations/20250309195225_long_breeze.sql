/*
  # Create Financial Management Tables

  1. New Tables
    - `financial_assets`
      - Tracks stocks, crypto, and other investments
      - Includes current value, purchase info, and performance metrics
    
    - `asset_transactions`
      - Records buy/sell transactions for assets
      - Tracks quantity, price, and fees
    
    - `fixed_expenses`
      - Stores recurring fixed expenses like rent, utilities
      - Includes due dates and autopay settings
    
    - `variable_expenses`
      - Tracks one-time or variable expenses
      - Categories for better organization
    
    - `income_sources`
      - Manages different income streams
      - Supports various payment frequencies

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Ensure users can only access their own data

  3. Indexes
    - Add indexes for common query patterns
    - Optimize for financial reporting queries
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

CREATE INDEX idx_financial_assets_user_id ON financial_assets(user_id);
CREATE INDEX idx_financial_assets_type ON financial_assets(type);

ALTER TABLE financial_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own assets"
  ON financial_assets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

CREATE INDEX idx_asset_transactions_user_id ON asset_transactions(user_id);
CREATE INDEX idx_asset_transactions_asset_id ON asset_transactions(asset_id);
CREATE INDEX idx_asset_transactions_date ON asset_transactions(date);

ALTER TABLE asset_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions"
  ON asset_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

CREATE INDEX idx_fixed_expenses_user_id ON fixed_expenses(user_id);
CREATE INDEX idx_fixed_expenses_category ON fixed_expenses(category);
CREATE INDEX idx_fixed_expenses_due_date ON fixed_expenses(due_date);

ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own fixed expenses"
  ON fixed_expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

CREATE INDEX idx_variable_expenses_user_id ON variable_expenses(user_id);
CREATE INDEX idx_variable_expenses_category ON variable_expenses(category);
CREATE INDEX idx_variable_expenses_date ON variable_expenses(date);

ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own variable expenses"
  ON variable_expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

CREATE INDEX idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX idx_income_sources_frequency ON income_sources(frequency);

ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own income sources"
  ON income_sources
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_asset_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_updated
CREATE TRIGGER update_asset_last_updated
  BEFORE UPDATE ON financial_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_last_updated();