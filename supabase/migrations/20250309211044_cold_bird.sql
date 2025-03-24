/*
  # Financial Assets and Transactions Schema

  1. New Tables
    - `financial_assets`
      - Core asset tracking table
      - Stores asset details, values, and metadata
      - Supports multiple asset types (stocks, crypto, etc.)
    
    - `asset_transactions`
      - Records buy/sell transactions for assets
      - Links to financial_assets table
      - Tracks quantities, prices, and dates

  2. Security
    - RLS enabled on all tables
    - Policies for user-specific data access
    - Protected foreign key relationships

  3. Indexes
    - Optimized queries for common access patterns
    - User-specific lookups
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own assets" ON financial_assets;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON asset_transactions;

-- Create tables in correct order (dependencies first)
CREATE TABLE IF NOT EXISTS financial_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('stock', 'crypto', 'savings', 'real_estate', 'other')),
  value numeric(20,2) NOT NULL CHECK (value >= 0),
  quantity numeric(20,8),
  purchase_price numeric(20,2),
  purchase_date timestamptz,
  current_price numeric(20,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for financial_assets
CREATE INDEX IF NOT EXISTS idx_financial_assets_user_id ON financial_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_assets_type ON financial_assets(type);

-- Create asset_transactions table after financial_assets exists
CREATE TABLE IF NOT EXISTS asset_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  "assetId" uuid REFERENCES financial_assets(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity numeric(20,8) NOT NULL,
  price numeric(20,2) NOT NULL CHECK (price >= 0),
  date timestamptz NOT NULL,
  fees numeric(20,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for asset_transactions
CREATE INDEX IF NOT EXISTS idx_asset_transactions_asset_id ON asset_transactions("assetId");
CREATE INDEX IF NOT EXISTS idx_asset_transactions_user_id ON asset_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_transactions_date ON asset_transactions(date);

-- Enable Row Level Security
ALTER TABLE financial_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
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

-- Create Update Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add Update Trigger to Financial Assets
DROP TRIGGER IF EXISTS update_financial_assets_updated_at ON financial_assets;
CREATE TRIGGER update_financial_assets_updated_at
  BEFORE UPDATE ON financial_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();