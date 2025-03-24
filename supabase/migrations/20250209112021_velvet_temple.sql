/*
  # Add subscription favorites table

  1. New Tables
    - `subscription_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `subscription_id` (uuid, references subscriptions)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `subscription_favorites` table
    - Add policies for authenticated users to manage their favorites

  3. Constraints
    - Unique constraint on user_id and subscription_id combination
    - Foreign key constraints with cascading deletes
*/

-- Create subscription_favorites table
CREATE TABLE IF NOT EXISTS subscription_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  subscription_id uuid REFERENCES subscriptions ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subscription_id)
);

-- Enable RLS
ALTER TABLE subscription_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own favorites"
  ON subscription_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites"
  ON subscription_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON subscription_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX subscription_favorites_user_id_idx ON subscription_favorites(user_id);
CREATE INDEX subscription_favorites_subscription_id_idx ON subscription_favorites(subscription_id);