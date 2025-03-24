/*
  # Improve category synchronization

  1. Changes
    - Add trigger to ensure category sync on subscription changes
    - Add function to validate and sync categories
    - Add function to clean up orphaned categories
    - Add indexes for better performance

  2. Security
    - Maintain existing RLS policies
    - Ensure data consistency
*/

-- Create function to sync categories
CREATE OR REPLACE FUNCTION sync_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- For inserts and updates
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- If category is not a default category, ensure it exists in user_categories
    IF NEW.category NOT IN (
      'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming',
      'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services',
      'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Other'
    ) THEN
      -- Insert the category if it doesn't exist
      INSERT INTO user_categories (user_id, name)
      VALUES (NEW.user_id, NEW.category)
      ON CONFLICT (user_id, name) DO NOTHING;

      -- Update subscription_categories
      INSERT INTO subscription_categories (user_id, subscription_id, category_name)
      VALUES (NEW.user_id, NEW.id, NEW.category)
      ON CONFLICT (subscription_id, category_name) 
      DO UPDATE SET category_name = NEW.category;
    END IF;

    RETURN NEW;
  END IF;

  -- For deletes
  IF TG_OP = 'DELETE' THEN
    -- Remove from subscription_categories
    DELETE FROM subscription_categories
    WHERE subscription_id = OLD.id;

    -- Clean up unused categories
    DELETE FROM user_categories
    WHERE user_id = OLD.user_id
    AND name = OLD.category
    AND name NOT IN (
      'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming',
      'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services',
      'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Other'
    )
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = OLD.user_id
      AND category = OLD.category
      AND id != OLD.id
    );

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_categories_on_change ON subscriptions;

-- Create new trigger for category synchronization
CREATE TRIGGER sync_categories_on_change
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_categories();

-- Create function to validate category changes
CREATE OR REPLACE FUNCTION validate_category_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent deletion of default categories
  IF TG_OP = 'DELETE' AND OLD.name IN (
    'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming',
    'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services',
    'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Other'
  ) THEN
    RAISE EXCEPTION 'Cannot delete default categories';
  END IF;

  -- For deletes
  IF TG_OP = 'DELETE' THEN
    -- Update any subscriptions using this category to 'Other'
    UPDATE subscriptions
    SET category = 'Other'
    WHERE user_id = OLD.user_id
    AND category = OLD.name;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for category validation
DROP TRIGGER IF EXISTS validate_category_changes_trigger ON user_categories;

CREATE TRIGGER validate_category_changes_trigger
  BEFORE DELETE ON user_categories
  FOR EACH ROW
  EXECUTE FUNCTION validate_category_changes();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_category ON subscriptions(user_id, category);