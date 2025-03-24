/*
  # Update RLS policies for subscription reordering

  1. Changes
    - Update the RLS policy for updating subscriptions to allow modifying all fields
    - This enables proper reordering functionality while maintaining security
*/

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;

-- Create a new update policy that allows updating all fields
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add a trigger to prevent user_id modification
CREATE OR REPLACE FUNCTION prevent_user_id_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'user_id cannot be modified';
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS ensure_user_id_not_modified ON subscriptions;

CREATE TRIGGER ensure_user_id_not_modified
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_user_id_update();