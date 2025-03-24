/*
  # Add Subscription Price History Support

  1. New Tables
    - `subscription_price_history`
      - `id` (uuid, primary key)
      - `subscription_id` (uuid, foreign key to subscriptions)
      - `user_id` (uuid, foreign key to users)
      - `monthly_cost` (numeric(10,2))
      - `effective_from` (timestamptz)
      - `is_correction` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `subscription_price_history` table
    - Add policies for authenticated users to:
      - Insert own price history
      - View own price history

  3. Changes
    - Add trigger to handle subscription price changes
    - Add function to handle subscription price history
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own price history" ON subscription_price_history;
DROP POLICY IF EXISTS "Users can view own price history" ON subscription_price_history;

-- Create subscription price history table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monthly_cost numeric(10,2) NOT NULL,
  effective_from timestamptz NOT NULL,
  is_correction boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_monthly_cost CHECK (monthly_cost >= 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_price_history_subscription_id ON subscription_price_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_price_history_user_id ON subscription_price_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_price_history_effective_from ON subscription_price_history(effective_from);

-- Enable RLS
ALTER TABLE subscription_price_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert own price history"
  ON subscription_price_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own price history"
  ON subscription_price_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle subscription price changes
CREATE OR REPLACE FUNCTION handle_subscription_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the price has changed
  IF OLD.monthly_cost != NEW.monthly_cost THEN
    -- Insert a new price history record
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
      COALESCE(TG_ARGV[0]::timestamptz, now()),
      COALESCE(TG_ARGV[1]::boolean, false)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS subscription_price_change_trigger ON subscriptions;

-- Create trigger for subscription price changes
CREATE TRIGGER subscription_price_change_trigger
  AFTER INSERT OR UPDATE OF monthly_cost ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_price_change();

-- Function to get subscription price at a specific date
CREATE OR REPLACE FUNCTION get_subscription_price_at_date(
  p_subscription_id uuid,
  p_date timestamptz
)
RETURNS numeric AS $$
DECLARE
  v_price numeric;
BEGIN
  -- Get the price effective at the given date
  SELECT monthly_cost INTO v_price
  FROM subscription_price_history
  WHERE subscription_id = p_subscription_id
    AND effective_from <= p_date
  ORDER BY effective_from DESC
  LIMIT 1;

  -- If no historical price found, return current price
  IF v_price IS NULL THEN
    SELECT monthly_cost INTO v_price
    FROM subscriptions
    WHERE id = p_subscription_id;
  END IF;

  RETURN v_price;
END;
$$ LANGUAGE plpgsql;