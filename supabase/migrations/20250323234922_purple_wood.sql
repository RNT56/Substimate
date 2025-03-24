/*
  # Clean up category management

  1. Changes
    - Drop unused category-related tables and functions
    - Add function to get user categories directly from subscriptions
    - Update triggers and constraints
    - Ensure proper cleanup of category data

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

-- Create improved function to get user categories
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

-- Create index for better category lookup performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_category 
ON subscriptions(category);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_category 
ON subscriptions(user_id, category);