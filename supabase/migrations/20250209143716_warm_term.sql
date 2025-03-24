/*
  # Add category column to subscriptions table

  1. Changes
    - Add `category` column to `subscriptions` table with default value 'Other'
    - Add check constraint to ensure valid category values
    - Update existing rows to set category based on subscription name

  2. Notes
    - Categories are predefined to match frontend options
    - Default value ensures backward compatibility
*/

-- Add category column with default value
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Other';

-- Add check constraint for valid categories
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
  'Other'
));

-- Update existing rows with appropriate categories based on name
DO $$ 
BEGIN
  -- AI Chat
  UPDATE subscriptions 
  SET category = 'AI Chat'
  WHERE LOWER(name) SIMILAR TO '%(chatgpt|claude|gemini|perplexity|anthropic|bard)%';

  -- Coding
  UPDATE subscriptions 
  SET category = 'Coding'
  WHERE LOWER(name) SIMILAR TO '%(github|copilot|cursor|codeium|replit|vercel|railway|bolt.new|v0)%';

  -- Diffusion
  UPDATE subscriptions 
  SET category = 'Diffusion'
  WHERE LOWER(name) SIMILAR TO '%(midjourney|runway|magnific|dall-e|stable diffusion|leonardo)%';

  -- Streaming
  UPDATE subscriptions 
  SET category = 'Streaming'
  WHERE LOWER(name) SIMILAR TO '%(netflix|disney|hbo|prime video|apple tv|hulu|paramount|peacock|crunchyroll)%';

  -- Music
  UPDATE subscriptions 
  SET category = 'Music'
  WHERE LOWER(name) SIMILAR TO '%(spotify|apple music|tidal|deezer|amazon music|soundcloud|youtube music)%';

  -- Gaming
  UPDATE subscriptions 
  SET category = 'Gaming'
  WHERE LOWER(name) SIMILAR TO '%(xbox|playstation|nintendo|steam|ea play|ubisoft|game pass|discord)%';

  -- Productivity
  UPDATE subscriptions 
  SET category = 'Productivity'
  WHERE LOWER(name) SIMILAR TO '%(notion|figma|linear|miro|airtable|asana|clickup|monday)%';

  -- Audio Generation
  UPDATE subscriptions 
  SET category = 'Audio Generation'
  WHERE LOWER(name) SIMILAR TO '%(elevenlabs|suno|udio|mubert|voicemod|resemble)%';

  -- Video Generation
  UPDATE subscriptions 
  SET category = 'Video Generation'
  WHERE LOWER(name) SIMILAR TO '%(opus|heygen|synthesia|descript|runway|kapwing)%';

  -- Cloud Services
  UPDATE subscriptions 
  SET category = 'Cloud Services'
  WHERE LOWER(name) SIMILAR TO '%(aws|azure|gcp|digitalocean|vercel|netlify|railway|heroku)%';
END $$;