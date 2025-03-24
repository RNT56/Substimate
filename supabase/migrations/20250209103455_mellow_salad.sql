/*
  # Add billing period to subscriptions

  1. Changes
    - Add billing_period column to subscriptions table with default value 'monthly'
    - Update existing rows to set billing_period to 'monthly'
    - Add check constraint to ensure valid billing period values
*/

-- Add billing_period column with default value
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS billing_period text NOT NULL DEFAULT 'monthly';

-- Add check constraint to ensure valid values
ALTER TABLE subscriptions
ADD CONSTRAINT valid_billing_period 
CHECK (billing_period IN ('monthly', 'yearly'));

-- Update existing rows to set billing_period to 'monthly'
UPDATE subscriptions 
SET billing_period = 'monthly' 
WHERE billing_period IS NULL;