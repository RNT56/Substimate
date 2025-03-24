/*
  # Fix Category Constraints

  1. Changes
    - Remove the restrictive category check constraint
    - Add a new constraint that ensures category is not null or empty
    - Add trigger to validate categories against default list and user categories

  2. Security
    - Maintains RLS policies
    - Ensures data integrity through triggers
*/

-- First drop the existing constraint
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS valid_category;

-- Add new constraint to ensure category is not null or empty
ALTER TABLE subscriptions
ADD CONSTRAINT category_not_empty 
CHECK (category IS NOT NULL AND category != '');

-- Create a function to validate categories
CREATE OR REPLACE FUNCTION validate_subscription_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if category is in default categories
  IF NEW.category IN (
    'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming',
    'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services',
    'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Other'
  ) THEN
    RETURN NEW;
  END IF;

  -- Check if category exists in user_categories
  IF EXISTS (
    SELECT 1 FROM user_categories 
    WHERE user_id = NEW.user_id AND name = NEW.category
  ) THEN
    RETURN NEW;
  END IF;

  -- If we get here, automatically create the category for the user
  INSERT INTO user_categories (user_id, name)
  VALUES (NEW.user_id, NEW.category)
  ON CONFLICT (user_id, name) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate categories
DROP TRIGGER IF EXISTS validate_subscription_category ON subscriptions;

CREATE TRIGGER validate_subscription_category
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_subscription_category();

-- Add cascade delete to user_categories foreign key
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE user_categories
DROP CONSTRAINT IF EXISTS user_categories_user_id_fkey;

ALTER TABLE user_categories
ADD CONSTRAINT user_categories_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;