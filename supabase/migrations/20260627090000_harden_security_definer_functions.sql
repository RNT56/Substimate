/*
  # Harden SECURITY DEFINER functions for public release

  Removes older RPC/function signatures that accepted caller-supplied user ids,
  then recreates the active helpers so they derive ownership from auth.uid().
*/

DROP FUNCTION IF EXISTS delete_subscription_directly(uuid, uuid);
DROP FUNCTION IF EXISTS safe_delete_subscription(uuid, uuid);
DROP FUNCTION IF EXISTS get_user_categories(uuid);
DROP FUNCTION IF EXISTS handle_category_operation(uuid, text, text);

CREATE OR REPLACE FUNCTION delete_subscription_directly(sub_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM subscriptions
  WHERE id = sub_id
    AND user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION delete_subscription_directly(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_subscription_directly(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION get_user_categories()
RETURNS TABLE (
  category text,
  subscription_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    subscriptions.category,
    COUNT(*) AS subscription_count
  FROM subscriptions
  WHERE subscriptions.user_id = auth.uid()
    AND subscriptions.category IS NOT NULL
  GROUP BY subscriptions.category
  ORDER BY subscriptions.category;
$$;

REVOKE ALL ON FUNCTION get_user_categories() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_categories() TO authenticated;
