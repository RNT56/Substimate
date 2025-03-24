/*
  # Add new categories to subscriptions table

  1. Changes
    - Update valid_category constraint to include new categories
    - Add data migration for new categories

  2. Notes
    - Adds Fitness, Health, Food, Transport, and Financial categories
    - Updates existing constraint without data loss
*/

-- First drop the existing constraint
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS valid_category;

-- Add the updated constraint with new categories
ALTER TABLE subscriptions
ADD CONSTRAINT valid_category 
CHECK (category IN (
  'AI Chat',
  'Coding',
  'Diffusion',
  'Streaming',
  'Music',
  'Gaming',
  'Productivity',
  'Audio Generation',
  'Video Generation',
  'Cloud Services',
  'Fitness',
  'Health',
  'Food',
  'Transport',
  'Financial',
  'Other'
));

-- Update existing rows with new categories where applicable
DO $$ 
BEGIN
  -- Fitness
  UPDATE subscriptions 
  SET category = 'Fitness'
  WHERE LOWER(name) SIMILAR TO '%(fitbit|strava|peloton|zwift|gympass|classpass)%';

  -- Health
  UPDATE subscriptions 
  SET category = 'Health'
  WHERE LOWER(name) SIMILAR TO '%(calm|headspace|noom|myfitnesspal|nike|withings)%';

  -- Food
  UPDATE subscriptions 
  SET category = 'Food'
  WHERE LOWER(name) SIMILAR TO '%(hellofresh|bluechef|doordash|ubereats|grubhub|instacart)%';

  -- Transport
  UPDATE subscriptions 
  SET category = 'Transport'
  WHERE LOWER(name) SIMILAR TO '%(uber|lyft|bird|lime|citibike|trainline)%';

  -- Financial
  UPDATE subscriptions 
  SET category = 'Financial'
  WHERE LOWER(name) SIMILAR TO '%(robinhood|coinbase|binance|etoro|fidelity|schwab)%';
END $$;