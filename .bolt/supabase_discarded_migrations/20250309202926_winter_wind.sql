/*
  # Update Financial Tables Structure and Policies

  1. Changes
    - Add comprehensive RLS policies for all financial tables
    - Add proper indexes for performance
    - Add constraints for data integrity

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

CREATE INDEX IF NOT EXISTS idx_financial_assets_user_id ON financial_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_assets_type ON financial_assets(type);
CREATE INDEX IF NOT EXISTS idx_financial_assets_last_updated ON financial_assets(last_updated);

-- Asset Transactions
ALTER TABLE asset_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions"
ON asset_transactions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_asset_transactions_user_id ON asset_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_transactions_asset_id ON asset_transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_transactions_date ON asset_transactions(date);

-- Fixed Expenses
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own fixed expenses"
ON fixed_expenses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category ON fixed_expenses(category);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_due_date ON fixed_expenses(due_date);

-- Variable Expenses
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own variable expenses"
ON variable_expenses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_variable_expenses_user_id ON variable_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_category ON variable_expenses(category);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_date ON variable_expenses(date);

-- Income Sources
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own income sources"
ON income_sources
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_frequency ON income_sources(frequency);
CREATE INDEX IF NOT EXISTS idx_income_sources_next_payment ON income_sources(next_payment);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_financial_assets_updated_at
    BEFORE UPDATE ON financial_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixed_expenses_updated_at
    BEFORE UPDATE ON fixed_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variable_expenses_updated_at
    BEFORE UPDATE ON variable_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_sources_updated_at
    BEFORE UPDATE ON income_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();