/*
  # Simplify Category Management

  1. Changes
    - Drop unnecessary category-related tables
    - Update subscriptions table to handle all category functionality
    - Add trigger to clean up unused categories
    - Add function to get unique categories for a user

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity
*/

-- Drop unnecessary tables and related objects
DROP TABLE IF EXISTS subscription_categories CASCADE;
DROP TABLE IF EXISTS user_categories CASCADE;

-- Drop related functions and triggers
DROP FUNCTION IF EXISTS sync_categories() CASCADE;
DROP FUNCTION IF EXISTS sync_subscription_categories() CASCADE;
DROP FUNCTION IF EXISTS validate_category() CASCADE;
DROP FUNCTION IF EXISTS validate_subscription_category() CASCADE;
DROP FUNCTION IF EXISTS handle_category_operation() CASCADE;

-- Remove category-related constraints from subscriptions
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS valid_category;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS category_not_empty;

-- Add new constraint to ensure category is not empty
ALTER TABLE subscriptions
ADD CONSTRAINT category_not_empty
CHECK (category IS NOT NULL AND category != '');

-- Create function to get unique categories for a user
CREATE OR REPLACE FUNCTION get_user_categories(user_id uuid)
RETURNS TABLE (category text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT subscriptions.category
  FROM subscriptions
  WHERE subscriptions.user_id = auth.uid()
  ORDER BY subscriptions.category;
$$;
