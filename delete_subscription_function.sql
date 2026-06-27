-- Function to directly delete a subscription without using triggers
-- This avoids the user_categories errors
DROP FUNCTION IF EXISTS delete_subscription_directly(UUID, UUID);

CREATE OR REPLACE FUNCTION delete_subscription_directly(sub_id UUID)
RETURNS void AS $$
BEGIN
  -- Use auth.uid() inside the SECURITY DEFINER function. Never trust caller-supplied user ids.
  DELETE FROM subscriptions 
  WHERE id = sub_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions to authenticated users
REVOKE ALL ON FUNCTION delete_subscription_directly(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_subscription_directly(UUID) TO authenticated;
