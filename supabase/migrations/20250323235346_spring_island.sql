/*
  # Fix category management

  1. Changes
    - Drop all category-related tables and functions
    - Add function to get categories from subscriptions
    - Add proper indexes and constraints
    - Update price history trigger

  2. Security
    - Maintain RLS policies
    - Ensure data integrity
*/

-- Drop unused tables and functions
DROP TABLE IF EXISTS subscription_categories CASCADE;
DROP TABLE IF EXISTS user_categories CASCADE;

-- Drop related functions
DROP FUNCTION IF EXISTS sync_categories() CASCADE;
DROP FUNCTION IF EXISTS sync_subscription_categories() CASCADE;
DROP FUNCTION IF EXISTS validate_category() CASCADE;
DROP FUNCTION IF EXISTS validate_subscription_category() CASCADE;
DROP FUNCTION IF EXISTS handle_category_operation() CASCADE;
DROP FUNCTION IF EXISTS get_user_categories(uuid) CASCADE;

-- Create function to get user categories
CREATE OR REPLACE FUNCTION get_user_categories(user_id uuid)
RETURNS TABLE (
  category text,
  subscription_count bigint
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    category,
    COUNT(*) as subscription_count
  FROM subscriptions 
  WHERE user_id = $1 
  GROUP BY category
  ORDER BY category;
$$;

-- Add constraint to ensure category is not empty
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS category_not_empty;

ALTER TABLE subscriptions
ADD CONSTRAINT category_not_empty 
CHECK (category IS NOT NULL AND category != '');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_category 
ON subscriptions(category);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_category 
ON subscriptions(user_id, category);

-- Update price history trigger
CREATE OR REPLACE FUNCTION handle_subscription_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history entry if price actually changed or it's a new subscription
  IF (TG_OP = 'INSERT') OR (OLD.monthly_cost != NEW.monthly_cost) THEN
    INSERT INTO subscription_price_history (
      subscription_id,
      user_id,
      monthly_cost,
      effective_from,
      is_correction
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.monthly_cost,
      COALESCE(NEW.updated_at, now()),
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS subscription_price_change_trigger ON subscriptions;

CREATE TRIGGER subscription_price_change_trigger
  AFTER INSERT OR UPDATE OF monthly_cost
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_price_change();