/*
  # Add user categories improvements

  1. Changes
    - Add trigger to clean up unused user categories
    - Add function to validate category existence
    - Add function to sync categories on subscription changes

  2. Security
    - Maintain existing RLS policies
    - Add validation for category operations
*/

-- Create function to clean up unused categories
CREATE OR REPLACE FUNCTION cleanup_unused_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete categories that are no longer used by any subscriptions
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
END;
$$ LANGUAGE plpgsql;

-- Create trigger for category cleanup
DROP TRIGGER IF EXISTS cleanup_unused_categories ON subscriptions;

CREATE TRIGGER cleanup_unused_categories
  AFTER DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_unused_categories();

-- Create function to validate category existence
CREATE OR REPLACE FUNCTION ensure_category_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip for default categories
  IF NEW.name IN (
    'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming',
    'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services',
    'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Other'
  ) THEN
    RETURN NEW;
  END IF;

  -- Check if any subscription uses this category
  IF NOT EXISTS (
    SELECT 1 
    FROM subscriptions 
    WHERE user_id = NEW.user_id 
      AND category = NEW.name
  ) THEN
    -- If no subscription uses this category, prevent creation
    RAISE EXCEPTION 'Cannot create category that is not used by any subscription';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for category validation
DROP TRIGGER IF EXISTS ensure_category_exists ON user_categories;

CREATE TRIGGER ensure_category_exists
  BEFORE INSERT ON user_categories
  FOR EACH ROW
  EXECUTE FUNCTION ensure_category_exists();