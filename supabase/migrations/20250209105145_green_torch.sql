/*
  # Add dashboard layouts table

  1. New Tables
    - `dashboard_layouts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `layout` (text[], stores ordered dashboard card IDs)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `dashboard_layouts` table
    - Add policies for authenticated users to:
      - Read their own layout
      - Create their own layout
      - Update their own layout
      - Delete their own layout
*/

-- Create dashboard_layouts table
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  layout text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own dashboard layout"
  ON dashboard_layouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own dashboard layout"
  ON dashboard_layouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard layout"
  ON dashboard_layouts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboard layout"
  ON dashboard_layouts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_dashboard_layouts_updated_at
  BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint to ensure one layout per user
ALTER TABLE dashboard_layouts
  ADD CONSTRAINT unique_user_layout UNIQUE (user_id);