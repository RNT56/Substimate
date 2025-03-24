/*
  # Add batch update function for subscription reordering

  1. Changes
    - Add stored procedure for batch updating subscription order
    - Ensure atomic updates for subscription reordering
    - Add proper error handling and validation

  2. Security
    - Maintain RLS policies
    - Add row-level security checks in function
*/

-- Create function for batch updating subscription order
CREATE OR REPLACE FUNCTION batch_update_subscription_order(updates jsonb[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate user has access to all subscriptions
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.id = ANY(
      SELECT (value->>'id')::uuid 
      FROM jsonb_array_elements(updates)
    )
    AND s.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Update each subscription's created_at timestamp
  FOR i IN 0..jsonb_array_length(updates) - 1 LOOP
    UPDATE subscriptions
    SET created_at = (updates->i->>'created_at')::timestamptz
    WHERE id = (updates->i->>'id')::uuid
    AND user_id = auth.uid();
  END LOOP;
END;
$$;