/*
  # Fix subscription categories synchronization

  1. Changes
    - Drop duplicate constraints
    - Add proper unique constraints
    - Update triggers to handle category synchronization correctly
    - Add better error handling
*/

-- Drop duplicate constraints
ALTER TABLE subscription_categories 
DROP CONSTRAINT IF EXISTS subscription_categories_subscription_id_category_name_key,
DROP CONSTRAINT IF EXISTS subscription_categories_unique_subscription_category;

-- Add single unique constraint
ALTER TABLE subscription_categories
ADD CONSTRAINT subscription_categories_unique_category 
UNIQUE (subscription_id, category_name);

-- Update sync_categories function to handle duplicates
CREATE OR REPLACE FUNCTION sync_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- For inserts and updates
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- If category is not a default category, ensure it exists in user_categories
    IF NEW.category NOT IN (
      'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming',
      'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services',
      'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Creative',
      'Social', 'Other'
    ) THEN
      -- Insert the category if it doesn't exist
      INSERT INTO user_categories (user_id, name)
      VALUES (NEW.user_id, NEW.category)
      ON CONFLICT (user_id, name) DO NOTHING;
    END IF;

    -- Delete existing category associations for this subscription
    DELETE FROM subscription_categories
    WHERE subscription_id = NEW.id;

    -- Insert new category association
    INSERT INTO subscription_categories (user_id, subscription_id, category_name)
    VALUES (NEW.user_id, NEW.id, NEW.category)
    ON CONFLICT (subscription_id, category_name) DO NOTHING;

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
      'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Creative',
      'Social', 'Other'
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