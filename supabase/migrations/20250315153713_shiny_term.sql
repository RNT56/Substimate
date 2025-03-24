/*
  # Update favorites schema

  1. Changes
    - Add favorite column to subscriptions table
    - Migrate existing favorites data
    - Drop subscription_favorites table
    - Update indexes and constraints

  2. Security
    - Maintain RLS policies
    - Ensure data consistency during migration
*/

-- First add the favorite column with a default value
ALTER TABLE subscriptions
ADD COLUMN favorite boolean NOT NULL DEFAULT false;

-- Migrate existing favorites data
DO $$
BEGIN
  -- Update subscriptions based on existing favorites
  UPDATE subscriptions s
  SET favorite = true
  FROM subscription_favorites f
  WHERE s.id = f.subscription_id;

  -- Drop subscription_favorites table and related objects
  DROP TABLE IF EXISTS subscription_favorites CASCADE;
END $$;