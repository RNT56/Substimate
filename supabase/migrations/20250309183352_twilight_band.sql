/*
  # Add subscription price history tracking
  
  1. New Tables
    - `subscription_price_history`
      - `id` (uuid, primary key)
      - `subscription_id` (uuid, references subscriptions)
      - `user_id` (uuid, references users)
      - `monthly_cost` (numeric(10,2))
      - `effective_from` (timestamptz)
      - `created_at` (timestamptz)
      - `is_correction` (boolean) - indicates if this is a retroactive price correction
      
  2. Security
    - Enable RLS on `subscription_price_history` table
    - Add policies for authenticated users to manage their own price history
    
  3. Triggers
    - Add trigger to automatically create price history entry when subscription is created
    - Add trigger to automatically create price history entry when subscription price changes
*/

-- Create subscription price history table
CREATE TABLE IF NOT EXISTS subscription_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_cost numeric(10,2) NOT NULL,
  effective_from timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_correction boolean DEFAULT false,
  
  CONSTRAINT valid_monthly_cost CHECK (monthly_cost >= 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_price_history_subscription_id 
  ON subscription_price_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_price_history_user_id 
  ON subscription_price_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_price_history_effective_from 
  ON subscription_price_history(effective_from);

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
  -- Only create history entry if price actually changed
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
      NEW.updated_at,
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER subscription_price_change_trigger
  AFTER INSERT OR UPDATE OF monthly_cost
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_price_change();