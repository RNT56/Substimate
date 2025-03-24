/*
  # Fix Column Names

  1. Changes
    - Rename columns to match TypeScript property names
    - Add missing columns
    - Ensure consistent naming across tables

  2. Security
    - Preserve existing RLS policies
    - Maintain data integrity during migration
*/

-- Fixed Expenses Table
ALTER TABLE fixed_expenses 
  RENAME COLUMN due_date TO "dueDate";

-- Financial Assets Table
ALTER TABLE financial_assets 
  RENAME COLUMN purchase_price TO "purchasePrice";

ALTER TABLE financial_assets 
  RENAME COLUMN purchase_date TO "purchaseDate";

ALTER TABLE financial_assets 
  RENAME COLUMN current_price TO "currentPrice";

ALTER TABLE financial_assets 
  RENAME COLUMN last_updated TO "lastUpdated";

-- Asset Transactions Table
ALTER TABLE asset_transactions 
  RENAME COLUMN asset_id TO "assetId";

-- Income Sources Table
ALTER TABLE income_sources 
  RENAME COLUMN next_payment TO "nextPayment";

-- Update trigger functions to use new column names
CREATE OR REPLACE FUNCTION update_asset_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW."lastUpdated" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with new column names
DROP TRIGGER IF EXISTS update_asset_last_updated ON financial_assets;
CREATE TRIGGER update_asset_last_updated
  BEFORE UPDATE ON financial_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_last_updated();