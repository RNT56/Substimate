/*
  # Fix subscription management

  1. Changes
    - Add trigger to handle subscription price history
    - Add function to validate price changes
    - Add proper indexes for performance
    - Update constraints

  2. Security
    - Maintain RLS policies
    - Ensure data integrity
*/

-- Create function to validate price changes
CREATE OR REPLACE FUNCTION validate_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure monthly_cost is not negative
  IF NEW.monthly_cost < 0 THEN
    RAISE EXCEPTION 'Monthly cost cannot be negative';
  END IF;

  -- Set updated_at timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for price validation
DROP TRIGGER IF EXISTS validate_price_change_trigger ON subscriptions;

CREATE TRIGGER validate_price_change_trigger
  BEFORE UPDATE OF monthly_cost ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_price_change();

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS subscription_price_change_trigger ON subscriptions;

CREATE TRIGGER subscription_price_change_trigger
  AFTER INSERT OR UPDATE OF monthly_cost
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_price_change();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_price_history_subscription_id 
ON subscription_price_history(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_price_history_effective_from 
ON subscription_price_history(effective_from);

-- Add constraint to ensure valid price history
ALTER TABLE subscription_price_history
ADD CONSTRAINT valid_price_history_monthly_cost
CHECK (monthly_cost >= 0);