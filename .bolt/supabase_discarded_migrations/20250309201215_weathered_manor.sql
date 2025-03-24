/*
  # Create Financial Management Tables

  1. New Tables
    - financial_assets
      - id (uuid, primary key)
      - user_id (uuid, references users)
      - name (text)
      - type (text)
      - value (numeric)
      - quantity (numeric, optional)
      - purchase_price (numeric, optional)
      - purchase_date (timestamptz, optional)
      - current_price (numeric, optional)
      - last_updated (timestamptz)
      - notes (text, optional)
      - created_at (timestamptz)

    - asset_transactions
      - id (uuid, primary key)
      - asset_id (uuid, references financial_assets)
      - user_id (uuid, references users)
      - type (text)
      - quantity (numeric)
      - price (numeric)
      - date (timestamptz)
      - fees (numeric, optional)
      - notes (text, optional)
      - created_at (timestamptz)

    - fixed_expenses
      - id (uuid, primary key)
      - user_id (uuid, references users)
      - name (text)
      - amount (numeric)
      - category (text)
      - due_date (date, optional)
      - frequency (text)
      - autopay (boolean)
      - notes (text, optional)
      - created_at (timestamptz)

    - variable_expenses
      - id (uuid, primary key)
      - user_id (uuid, references users)
      - name (text)
      - amount (numeric)
      - category (text)
      - date (timestamptz)
      - notes (text, optional)
      - created_at (timestamptz)

    - income_sources
      - id (uuid, primary key)
      - user_id (uuid, references users)
      - source (text)
      - amount (numeric)
      - frequency (text)
      - next_payment (date, optional)
      - notes (text, optional)
      - created_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create financial_assets table
CREATE TABLE IF NOT EXISTS financial_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create asset_transactions table
CREATE TABLE IF NOT EXISTS asset_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES financial_assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity numeric(20,8) NOT NULL,
  price numeric(20,2) NOT NULL,
  date timestamptz NOT NULL,
  fees numeric(20,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create fixed_expenses table
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(20,2) NOT NULL,
  category text NOT NULL,
  due_date date,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  autopay boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create variable_expenses table
CREATE TABLE IF NOT EXISTS variable_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(20,2) NOT NULL,
  category text NOT NULL,
  date timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create income_sources table
CREATE TABLE IF NOT EXISTS income_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  amount numeric(20,2) NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'yearly', 'one_time')),
  next_payment date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE financial_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_assets
CREATE POLICY "Users can manage their own assets"
  ON financial_assets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for asset_transactions
CREATE POLICY "Users can manage their own transactions"
  ON asset_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for fixed_expenses
CREATE POLICY "Users can manage their own fixed expenses"
  ON fixed_expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for variable_expenses
CREATE POLICY "Users can manage their own variable expenses"
  ON variable_expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for income_sources
CREATE POLICY "Users can manage their own income sources"
  ON income_sources
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_financial_assets_user_id ON financial_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_assets_type ON financial_assets(type);

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