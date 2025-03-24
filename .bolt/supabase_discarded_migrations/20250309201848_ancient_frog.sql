/*
  # Fix Income Sources Policy

  1. Changes
    - Drop existing policy if it exists
    - Create new policy with correct syntax and permissions
    - Add missing indexes for better performance

  2. Security
    - Enable RLS on income_sources table
    - Add policy for authenticated users to manage their own income sources
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own income sources" ON income_sources;

-- Create new policy with correct syntax
CREATE POLICY "Users can manage their own income sources"
ON income_sources
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_frequency ON income_sources(frequency);
CREATE INDEX IF NOT EXISTS idx_income_sources_next_payment ON income_sources(next_payment);