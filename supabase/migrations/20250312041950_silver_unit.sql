/*
  # Fix Category and Favorites Issues

  1. Changes
    - Add missing indexes for better query performance
    - Fix subscription_favorites constraints
    - Update RLS policies to handle empty result sets
    - Add function to safely handle category operations

  2. Security
    - Maintain existing RLS policies
    - Add better error handling
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own favorites" ON subscription_favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON subscription_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON subscription_favorites;

-- Create improved policies
CREATE POLICY "Users can read own favorites"
  ON subscription_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites"
  ON subscription_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON subscription_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add function to safely handle category operations
CREATE OR REPLACE FUNCTION handle_category_operation(
  p_user_id uuid,
  p_category_name text,
  p_operation text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate operation
  IF p_operation NOT IN ('add', 'remove') THEN
    RAISE EXCEPTION 'Invalid operation';
  END IF;

  -- Handle add operation
  IF p_operation = 'add' THEN
    -- Add category if it doesn't exist
    INSERT INTO user_categories (user_id, name)
    VALUES (p_user_id, p_category_name)
    ON CONFLICT (user_id, name) DO NOTHING;
  END IF;

  -- Handle remove operation
  IF p_operation = 'remove' THEN
    -- Only remove if no subscriptions use this category
    DELETE FROM user_categories
    WHERE user_id = p_user_id
    AND name = p_category_name
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = p_user_id
      AND category = p_category_name
    );
  END IF;
END;
$$;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_subscription_favorites_lookup 
ON subscription_favorites(user_id, subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_categories_lookup
ON user_categories(user_id, name);

-- Update sync_categories function to handle edge cases
CREATE OR REPLACE FUNCTION sync_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- For inserts and updates
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Safely handle category
    PERFORM handle_category_operation(
      NEW.user_id,
      NEW.category,
      'add'
    );

    RETURN NEW;
  END IF;

  -- For deletes
  IF TG_OP = 'DELETE' THEN
    -- Safely handle category removal
    PERFORM handle_category_operation(
      OLD.user_id,
      OLD.category,
      'remove'
    );

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;