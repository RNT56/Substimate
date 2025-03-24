/*
  # Fix Income Sources Next Payment Column

  1. Changes
    - Rename `nextPayment` column to `next_payment` in `income_sources` table to follow SQL naming conventions
    - Ensure column is nullable and of type `date`

  2. Notes
    - This fixes the column name mismatch causing errors when adding income sources
*/

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income_sources' AND column_name = 'nextPayment'
  ) THEN
    ALTER TABLE income_sources RENAME COLUMN "nextPayment" TO next_payment;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income_sources' AND column_name = 'next_payment'
  ) THEN
    ALTER TABLE income_sources ADD COLUMN next_payment date;
  END IF;
END $$;