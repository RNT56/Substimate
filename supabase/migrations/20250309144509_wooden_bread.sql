/*
  # Fix RLS Policies and Constraints

  1. Changes
    - Drop existing policies to avoid conflicts
    - Re-create RLS policies for all tables
    - Add missing constraints and indexes
    - Ensure proper cascading behavior

  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations
    - Ensure users can only access their own data

  3. Tables Affected
    - user_categories
    - subscription_categories
    - subscription_favorites
*/

-- Enable RLS on all tables
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own categories" ON user_categories;
DROP POLICY IF EXISTS "Users can create own categories" ON user_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON user_categories;

DROP POLICY IF EXISTS "Users can read own subscription categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can create own subscription categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can update own subscription categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can delete own subscription categories" ON subscription_categories;

DROP POLICY IF EXISTS "Users can read own favorites" ON subscription_favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON subscription_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON subscription_favorites;

-- Create policies for user_categories
CREATE POLICY "Users can read own categories"
  ON user_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
  ON user_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON user_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for subscription_categories
CREATE POLICY "Users can read own subscription categories"
  ON subscription_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscription categories"
  ON subscription_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription categories"
  ON subscription_categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscription categories"
  ON subscription_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for subscription_favorites
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

-- Add or update constraints and indexes
ALTER TABLE subscription_categories
DROP CONSTRAINT IF EXISTS subscription_categories_subscription_id_fkey;

ALTER TABLE subscription_categories
ADD CONSTRAINT subscription_categories_subscription_id_fkey
FOREIGN KEY (subscription_id)
REFERENCES subscriptions(id)
ON DELETE CASCADE;

ALTER TABLE subscription_categories
DROP CONSTRAINT IF EXISTS subscription_categories_user_id_fkey;

ALTER TABLE subscription_categories
ADD CONSTRAINT subscription_categories_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add unique constraints
ALTER TABLE subscription_categories
DROP CONSTRAINT IF EXISTS subscription_categories_unique_subscription_category;

ALTER TABLE subscription_categories
ADD CONSTRAINT subscription_categories_unique_subscription_category
UNIQUE (subscription_id, category_name);

ALTER TABLE subscription_favorites
DROP CONSTRAINT IF EXISTS subscription_favorites_unique_user_subscription;

ALTER TABLE subscription_favorites
ADD CONSTRAINT subscription_favorites_unique_user_subscription
UNIQUE (user_id, subscription_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_categories_user_id
  ON subscription_categories(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_categories_subscription_id
  ON subscription_categories(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_favorites_user_id
  ON subscription_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_favorites_subscription_id
  ON subscription_favorites(subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_categories_user_id
  ON user_categories(user_id);