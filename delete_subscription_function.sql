-- Function to directly delete a subscription without using triggers
-- This avoids the user_categories errors
CREATE OR REPLACE FUNCTION delete_subscription_directly(sub_id UUID, user_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Delete the subscription directly using SQL to bypass RLS and triggers
  DELETE FROM subscriptions 
  WHERE id = sub_id AND user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION delete_subscription_directly TO authenticated;
