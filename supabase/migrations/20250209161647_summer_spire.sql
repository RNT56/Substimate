/*
  # Fix subscription categories policies and triggers

  1. Changes
    - Drop existing policies and recreate them
    - Update triggers to maintain data consistency
    - Add proper error handling
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subscription_categories' 
    AND policyname = 'Users can read own subscription categories'
  ) THEN
    DROP POLICY "Users can read own subscription categories" ON subscription_categories;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subscription_categories' 
    AND policyname = 'Users can create own subscription categories'
  ) THEN
    DROP POLICY "Users can create own subscription categories" ON subscription_categories;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subscription_categories' 
    AND policyname = 'Users can delete own subscription categories'
  ) THEN
    DROP POLICY "Users can delete own subscription categories" ON subscription_categories;
  END IF;
END $$;

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

-- Update sync_subscription_categories function
CREATE OR REPLACE FUNCTION sync_subscription_categories()
RETURNS TRIGGER AS $$
DECLARE
  default_categories text[] := ARRAY[
    'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming',
    'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services',
    'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Other'
  ];
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Delete existing category for this subscription
    DELETE FROM subscription_categories
    WHERE subscription_id = NEW.id;

    -- Add new category
    INSERT INTO subscription_categories (user_id, subscription_id, category_name)
    VALUES (NEW.user_id, NEW.id, NEW.category);

    -- Ensure category exists in user_categories if it's not a default category
    IF NOT NEW.category = ANY(default_categories) THEN
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
      AND NOT OLD.category = ANY(default_categories)
      AND NOT EXISTS (
        SELECT 1 
        FROM subscriptions s 
        WHERE s.user_id = uc.user_id 
          AND s.category = uc.name
          AND s.id != OLD.id
      );

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_subscription_categories_insert ON subscriptions;
DROP TRIGGER IF EXISTS sync_subscription_categories_update ON subscriptions;
DROP TRIGGER IF EXISTS sync_subscription_categories_delete ON subscriptions;

-- Create triggers for subscription category sync
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
DO $$ 
BEGIN
  -- Drop indexes if they exist
  DROP INDEX IF EXISTS subscription_categories_user_id_idx;
  DROP INDEX IF EXISTS subscription_categories_subscription_id_idx;
  DROP INDEX IF EXISTS subscription_categories_category_name_idx;
  
  -- Create new indexes
  CREATE INDEX subscription_categories_user_id_idx ON subscription_categories(user_id);
  CREATE INDEX subscription_categories_subscription_id_idx ON subscription_categories(subscription_id);
  CREATE INDEX subscription_categories_category_name_idx ON subscription_categories(category_name);
END $$;

-- Migrate existing data
INSERT INTO subscription_categories (user_id, subscription_id, category_name)
SELECT user_id, id, category
FROM subscriptions
ON CONFLICT (subscription_id, category_name) DO NOTHING;