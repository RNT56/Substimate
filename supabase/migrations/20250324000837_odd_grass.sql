/*
  # Add favorite column default value

  1. Changes
    - Add default value for favorite column
    - Add index for favorite column lookups
    - Update existing rows to have favorite = false

  2. Security
    - Maintain RLS policies
    - Ensure data consistency
*/

-- Set default value for favorite column
ALTER TABLE subscriptions 
ALTER COLUMN favorite SET DEFAULT false;

-- Create index for favorite lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_favorite 
ON subscriptions(favorite);

-- Update any existing NULL values to false
UPDATE subscriptions 
SET favorite = false 
WHERE favorite IS NULL;