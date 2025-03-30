-- Drop any triggers or functions that might reference user_categories
DROP FUNCTION IF EXISTS get_user_categories;
DROP TRIGGER IF EXISTS update_user_categories ON subscriptions;

-- Create function that works with the subscriptions table
CREATE OR REPLACE FUNCTION get_user_categories(user_id UUID)
RETURNS TABLE (category TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT s.category
  FROM subscriptions s
  WHERE s.user_id = get_user_categories.user_id
  AND s.category IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace a function to handle deleting subscriptions safely
CREATE OR REPLACE FUNCTION safe_delete_subscription(subscription_id UUID, current_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete price history records first (if they exist)
  DELETE FROM subscription_price_history
  WHERE subscription_id = safe_delete_subscription.subscription_id
  AND user_id = safe_delete_subscription.current_user_id;
  
  -- Then delete the subscription itself
  DELETE FROM subscriptions
  WHERE id = safe_delete_subscription.subscription_id
  AND user_id = safe_delete_subscription.current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 