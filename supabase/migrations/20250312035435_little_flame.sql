/*
  # Fix batch update subscription order function

  1. Changes
    - Update function to accept a single JSONB parameter instead of JSONB array
    - Add proper validation and error handling
    - Ensure secure updates with RLS checks

  2. Security
    - Maintain RLS policies
    - Add validation for user ownership
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS batch_update_subscription_order(jsonb[]);

-- Create function for batch updating subscription order
CREATE OR REPLACE FUNCTION batch_update_subscription_order(updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_id uuid;
  created_at_value timestamptz;
BEGIN
  -- Validate input is an array
  IF jsonb_typeof(updates) != 'array' THEN
    RAISE EXCEPTION 'Input must be a JSONB array';
  END IF;

  -- Validate user has access to all subscriptions
  FOR subscription_id IN 
    SELECT (value->>'id')::uuid 
    FROM jsonb_array_elements(updates)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_id
      AND s.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Access denied for subscription %', subscription_id;
    END IF;
  END LOOP;

  -- Update each subscription's created_at timestamp
  FOR subscription_id, created_at_value IN 
    SELECT 
      (value->>'id')::uuid,
      (value->>'created_at')::timestamptz
    FROM jsonb_array_elements(updates)
  LOOP
    UPDATE subscriptions
    SET created_at = created_at_value
    WHERE id = subscription_id
    AND user_id = auth.uid();
  END LOOP;
END;
$$;