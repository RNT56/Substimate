/*
  # Expense and Income Tables Schema

  1. New Tables
    - fixed_expenses
      - Regular recurring expenses
      - Supports multiple frequencies and autopay
    - variable_expenses
      - One-time or irregular expenses
      - Date-based tracking
    - income_sources
      - Income tracking with frequency
      - Support for multiple payment schedules

  2. Indexes
    - Optimized queries for user_id lookups
    - Date-based indexing for expenses
    
  3. Security
    - Row Level Security enabled on all tables
    - Policies ensure users can only access their own data
*/

-- Create fixed_expenses table
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric(20,2) NOT NULL CHECK (amount >= 0),
  category text NOT NULL,
  due_date date,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  autopay boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create variable_expenses table
CREATE TABLE IF NOT EXISTS variable_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric(20,2) NOT NULL CHECK (amount >= 0),
  category text NOT NULL,
  date timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create income_sources table
CREATE TABLE IF NOT EXISTS income_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source text NOT NULL,
  amount numeric(20,2) NOT NULL CHECK (amount >= 0),
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'yearly', 'one_time')),
  next_payment date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category ON fixed_expenses(category);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_due_date ON fixed_expenses(due_date);

CREATE INDEX IF NOT EXISTS idx_variable_expenses_user_id ON variable_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_category ON variable_expenses(category);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_date ON variable_expenses(date);

CREATE INDEX IF NOT EXISTS idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_frequency ON income_sources(frequency);
CREATE INDEX IF NOT EXISTS idx_income_sources_next_payment ON income_sources(next_payment);

-- Enable Row Level Security
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can manage their own fixed expenses" ON fixed_expenses;
  DROP POLICY IF EXISTS "Users can manage their own variable expenses" ON variable_expenses;
  DROP POLICY IF EXISTS "Users can manage their own income sources" ON income_sources;
  
  -- Create new policies
  CREATE POLICY "Users can manage their own fixed expenses"
    ON fixed_expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can manage their own variable expenses"
    ON variable_expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can manage their own income sources"
    ON income_sources
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;