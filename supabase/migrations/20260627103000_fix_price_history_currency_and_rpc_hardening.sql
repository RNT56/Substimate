/*
  # Fix subscription currency semantics and price history ownership

  The previous client converted non-EUR subscription amounts to EUR before
  storing them while keeping the selected currency label. Existing non-EUR rows
  are normalized back to EUR because their stored amounts are EUR-denominated.
  New client code stores monthly_cost in the selected subscription currency.
*/

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';

UPDATE subscriptions
SET currency = 'EUR'
WHERE currency IS NULL
   OR currency <> 'EUR';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'valid_subscription_currency'
      AND conrelid = 'subscriptions'::regclass
  ) THEN
    ALTER TABLE subscriptions
    ADD CONSTRAINT valid_subscription_currency
    CHECK (currency IN ('EUR', 'USD', 'BTC'));
  END IF;
END $$;

ALTER TABLE subscription_price_history
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';

UPDATE subscription_price_history AS history
SET currency = subscriptions.currency
FROM subscriptions
WHERE history.subscription_id = subscriptions.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'valid_price_history_currency'
      AND conrelid = 'subscription_price_history'::regclass
  ) THEN
    ALTER TABLE subscription_price_history
    ADD CONSTRAINT valid_price_history_currency
    CHECK (currency IN ('EUR', 'USD', 'BTC'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION handle_subscription_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT')
     OR (OLD.monthly_cost IS DISTINCT FROM NEW.monthly_cost)
     OR (OLD.currency IS DISTINCT FROM NEW.currency) THEN
    INSERT INTO subscription_price_history (
      subscription_id,
      user_id,
      monthly_cost,
      currency,
      effective_from,
      is_correction
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.monthly_cost,
      NEW.currency,
      CASE
        WHEN TG_OP = 'INSERT' THEN COALESCE(NEW.start_date, now())
        ELSE now()
      END,
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION handle_subscription_price_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS subscription_price_change_trigger ON subscriptions;

CREATE TRIGGER subscription_price_change_trigger
  AFTER INSERT OR UPDATE OF monthly_cost, currency
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_price_change();

CREATE OR REPLACE FUNCTION batch_update_subscription_order(updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_record record;
BEGIN
  IF jsonb_typeof(updates) != 'array' THEN
    RAISE EXCEPTION 'Input must be a JSONB array';
  END IF;

  IF jsonb_array_length(updates) = 0 THEN
    RAISE EXCEPTION 'Updates array cannot be empty';
  END IF;

  FOR subscription_record IN
    SELECT
      (value->>'id')::uuid AS id,
      (value->>'created_at')::timestamptz AS new_created_at
    FROM jsonb_array_elements(updates)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM subscriptions
      WHERE subscriptions.id = subscription_record.id
        AND subscriptions.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Access denied for subscription %', subscription_record.id;
    END IF;

    UPDATE subscriptions
    SET created_at = subscription_record.new_created_at
    WHERE subscriptions.id = subscription_record.id
      AND subscriptions.user_id = auth.uid();
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION batch_update_subscription_order(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION batch_update_subscription_order(jsonb) TO authenticated;
