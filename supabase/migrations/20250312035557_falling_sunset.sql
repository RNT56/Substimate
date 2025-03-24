/*
  # Fix batch update subscription order function

  1. Changes
    - Drop existing function
    - Create new function that properly handles JSONB input
    - Add better error handling and validation
    - Fix type casting issues

  2. Security
    - Maintain SECURITY DEFINER
    - Validate user has access to subscriptions
*/

-- Drop existing function
DROP FUNCTION IF EXISTS batch_update_subscription_order(jsonb);

-- Create improved function for batch updating subscription order
CREATE OR REPLACE FUNCTION batch_update_subscription_order(updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record record;
BEGIN
  -- Validate input is an array
  IF jsonb_typeof(updates) != 'array' THEN
    RAISE EXCEPTION 'Input must be a JSONB array';
  END IF;

  -- Validate array is not empty
  IF jsonb_array_length(updates) = 0 THEN
    RAISE EXCEPTION 'Updates array cannot be empty';
  END IF;

  -- Validate user has access to all subscriptions and update timestamps
  FOR subscription_record IN 
    SELECT 
      (value->>'id')::uuid as id,
      (value->>'created_at')::timestamptz as new_created_at
    FROM jsonb_array_elements(updates)
  LOOP
    -- Validate subscription exists and belongs to user
    IF NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_record.id
      AND s.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Access denied for subscription %', subscription_record.id;
    END IF;

    -- Update the subscription's created_at timestamp
    UPDATE subscriptions
    SET created_at = subscription_record.new_created_at
    WHERE id = subscription_record.id
    AND user_id = auth.uid();
  END LOOP;
END;
$$;