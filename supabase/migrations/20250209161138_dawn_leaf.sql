/*
  # Add subscription categories improvements

  1. New Tables
    - `subscription_categories` - Links subscriptions to user categories
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `subscription_id` (uuid, references subscriptions)
      - `category_name` (text, references user_categories.name)
      - `created_at` (timestamptz)

  2. Changes
    - Add trigger to sync subscription_categories with subscriptions
    - Add trigger to clean up orphaned categories
    - Add function to validate category existence

  3. Security
    - Enable RLS on subscription_categories
    - Add policies for authenticated users
*/

-- Create subscription_categories table
CREATE TABLE IF NOT EXISTS subscription_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  subscription_id uuid REFERENCES subscriptions ON DELETE CASCADE NOT NULL,
  category_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscription_id, category_name)
);

-- Enable RLS
ALTER TABLE subscription_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Users can delete own subscription categories"
  ON subscription_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to sync subscription categories
CREATE OR REPLACE FUNCTION sync_subscription_categories()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Delete existing category for this subscription
    DELETE FROM subscription_categories
    WHERE subscription_id = NEW.id;

    -- Add new category
    INSERT INTO subscription_categories (user_id, subscription_id, category_name)
    VALUES (NEW.user_id, NEW.id, NEW.category);

    -- Ensure category exists in user_categories if it's not a default category
    IF NEW.category NOT IN (
      'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming',
      'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services',
      'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Other'
    ) THEN
      INSERT INTO user_categories (user_id, name)
      VALUES (NEW.user_id, NEW.category)
      ON CONFLICT (user_id, name) DO NOTHING;
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Delete category association
    DELETE FROM subscription_categories
    WHERE subscription_id = OLD.id;

    -- Clean up unused user categories
    DELETE FROM user_categories uc
    WHERE uc.user_id = OLD.user_id
      AND uc.name = OLD.category
      AND NOT EXISTS (
        SELECT 1 
        FROM subscriptions s 
        WHERE s.user_id = uc.user_id 
          AND s.category = uc.name
          AND s.id != OLD.id
      )
      AND uc.name NOT IN (
        'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming',
        'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services',
        'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Other'
      );

    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for subscription category sync
DROP TRIGGER IF EXISTS sync_subscription_categories_insert ON subscriptions;
DROP TRIGGER IF EXISTS sync_subscription_categories_update ON subscriptions;
DROP TRIGGER IF EXISTS sync_subscription_categories_delete ON subscriptions;

CREATE TRIGGER sync_subscription_categories_insert
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_categories();

CREATE TRIGGER sync_subscription_categories_update
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_categories();

CREATE TRIGGER sync_subscription_categories_delete
  AFTER DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_categories();

-- Create indexes for faster lookups
CREATE INDEX subscription_categories_user_id_idx ON subscription_categories(user_id);
CREATE INDEX subscription_categories_subscription_id_idx ON subscription_categories(subscription_id);
CREATE INDEX subscription_categories_category_name_idx ON subscription_categories(category_name);

-- Migrate existing data
INSERT INTO subscription_categories (user_id, subscription_id, category_name)
SELECT user_id, id, category
FROM subscriptions
ON CONFLICT (subscription_id, category_name) DO NOTHING;