/*
  # Update Financial Tables Policies

  1. Changes
    - Add comprehensive RLS policies for financial tables
    - Ensure proper user access control
    - Enable RLS on all tables

  2. Security
    - Users can only access their own data
    - Full CRUD operations for authenticated users on their data
*/

-- Financial Assets
ALTER TABLE financial_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own assets"
ON financial_assets
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Asset Transactions
ALTER TABLE asset_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions"
ON asset_transactions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fixed Expenses
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own fixed expenses"
ON fixed_expenses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Variable Expenses
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own variable expenses"
ON variable_expenses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Income Sources
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own income sources"
ON income_sources
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);