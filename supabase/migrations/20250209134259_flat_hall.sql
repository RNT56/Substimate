/*
  # Add Currency Preferences Support

  1. New Tables
    - `currency_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `display_currency` (text)
      - `exchange_rates` (jsonb)
      - `last_updated` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `currency_preferences` table
    - Add policies for authenticated users to manage their preferences
*/

-- Create currency_preferences table
CREATE TABLE IF NOT EXISTS currency_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  display_currency text NOT NULL DEFAULT 'EUR',
  exchange_rates jsonb NOT NULL DEFAULT '{"EUR": 1, "USD": 1.08, "BTC": 0.000023}'::jsonb,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_display_currency CHECK (display_currency IN ('EUR', 'USD', 'BTC')),
  CONSTRAINT unique_user_preference UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE currency_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own currency preferences"
  ON currency_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own currency preferences"
  ON currency_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own currency preferences"
  ON currency_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_currency_preferences_updated_at
  BEFORE UPDATE ON currency_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();