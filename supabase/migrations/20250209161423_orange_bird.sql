/*
  # Fix category validation for new subscriptions

  1. Changes
    - Remove the restriction that prevents creating categories without subscriptions
    - Update category sync logic to handle new subscriptions correctly
    - Add better error handling and validation

  2. Security
    - Maintain existing RLS policies
    - Ensure data consistency
*/

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS ensure_category_exists ON user_categories;
DROP FUNCTION IF EXISTS ensure_category_exists();

-- Create updated function to validate category existence
CREATE OR REPLACE FUNCTION validate_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip for default categories
  IF NEW.name IN (
    'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming',
    'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services',
    'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Other'
  ) THEN
    RAISE EXCEPTION 'Cannot create default categories';
  END IF;

  -- Ensure category name is not empty
  IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
    RAISE EXCEPTION 'Category name cannot be empty';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger for category validation
CREATE TRIGGER validate_category
  BEFORE INSERT ON user_categories
  FOR EACH ROW
  EXECUTE FUNCTION validate_category();

-- Update sync_categories function to handle new subscriptions better
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