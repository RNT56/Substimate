/*
  # Clean up category management and fix subscription triggers

  1. Changes
    - Drop unused category-related tables and functions
    - Update subscription triggers to handle price history correctly
    - Add function to handle subscription changes

  2. Security
    - Maintain existing RLS policies
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

-- Update subscription price history trigger
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

-- Drop and recreate the trigger to ensure it's up to date
DROP TRIGGER IF EXISTS subscription_price_change_trigger ON subscriptions;

CREATE TRIGGER subscription_price_change_trigger
  AFTER INSERT OR UPDATE OF monthly_cost
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_price_change();