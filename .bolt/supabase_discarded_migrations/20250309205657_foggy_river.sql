/*
  # Subscription Management Tables

  1. New Tables
    - subscriptions
      - Main subscription data
    - subscription_categories
      - Custom categories for subscriptions
    - subscription_favorites
      - User's favorite subscriptions
    - subscription_price_history
      - Track price changes over time
    - user_categories
      - User-defined categories
    - currency_preferences
      - User currency display preferences
    - dashboard_layouts
      - User dashboard customization

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add appropriate indexes
*/

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  icon text NOT NULL,
  monthly_cost numeric(10,2) NOT NULL,
  billing_period text NOT NULL DEFAULT 'monthly',
  payment_method text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  usage_state text NOT NULL DEFAULT 'active',
  start_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_billing_period CHECK (billing_period IN ('monthly', 'yearly')),
  CONSTRAINT category_not_empty CHECK (category IS NOT NULL AND category <> '')
);

-- User Categories Table
CREATE TABLE IF NOT EXISTS user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Subscription Categories Table
CREATE TABLE IF NOT EXISTS subscription_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscription_id, category_name)
);

-- Subscription Favorites Table
CREATE TABLE IF NOT EXISTS subscription_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subscription_id)
);

-- Subscription Price History Table
CREATE TABLE IF NOT EXISTS subscription_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_cost numeric(10,2) NOT NULL,
  effective_from timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_correction boolean DEFAULT false,
  CONSTRAINT valid_monthly_cost CHECK (monthly_cost >= 0)
);

-- Currency Preferences Table
CREATE TABLE IF NOT EXISTS currency_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  display_currency text NOT NULL DEFAULT 'EUR',
  exchange_rates jsonb NOT NULL DEFAULT '{"BTC": 0.000023, "EUR": 1, "USD": 1.08}'::jsonb,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  CONSTRAINT valid_display_currency CHECK (display_currency IN ('EUR', 'USD', 'BTC'))
);

-- Dashboard Layouts Table
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  layout text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Subscription Categories Policies
CREATE POLICY "Users can create own subscription categories"
  ON subscription_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own subscription categories"
  ON subscription_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscription categories"
  ON subscription_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Categories Policies
CREATE POLICY "Users can create own categories"
  ON user_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own categories"
  ON user_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON user_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Subscription Favorites Policies
CREATE POLICY "Users can create own favorites"
  ON subscription_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own favorites"
  ON subscription_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON subscription_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Price History Policies
CREATE POLICY "Users can insert own price history"
  ON subscription_price_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own price history"
  ON subscription_price_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Currency Preferences Policies
CREATE POLICY "Users can create own currency preferences"
  ON currency_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own currency preferences"
  ON currency_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own currency preferences"
  ON currency_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Dashboard Layout Policies
CREATE POLICY "Users can create own dashboard layout"
  ON dashboard_layouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own dashboard layout"
  ON dashboard_layouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard layout"
  ON dashboard_layouts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboard layout"
  ON dashboard_layouts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_category ON subscriptions(user_id, category);

CREATE INDEX IF NOT EXISTS idx_subscription_categories_user_id ON subscription_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_categories_subscription_id ON subscription_categories(subscription_id);
CREATE INDEX IF NOT EXISTS subscription_categories_category_name_idx ON subscription_categories(category_name);

CREATE INDEX IF NOT EXISTS idx_user_categories_user_id ON user_categories(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_favorites_user_id ON subscription_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_favorites_subscription_id ON subscription_favorites(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_price_history_user_id ON subscription_price_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_price_history_subscription_id ON subscription_price_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_price_history_effective_from ON subscription_price_history(effective_from);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if category exists in user_categories or is a default category
  IF NEW.name NOT IN (
    SELECT name FROM user_categories WHERE user_id = NEW.user_id
    UNION
    SELECT unnest(ARRAY['All', 'Favorites', 'Other', 'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming', 'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services', 'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Creative', 'Social'])
  ) THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_category_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if category is still in use
  IF EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE category = OLD.name 
    AND user_id = OLD.user_id
  ) THEN
    RAISE EXCEPTION 'Category is still in use by subscriptions';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_subscription_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if category exists in user_categories or is a default category
  IF NEW.category NOT IN (
    SELECT name FROM user_categories WHERE user_id = NEW.user_id
    UNION
    SELECT unnest(ARRAY['All', 'Favorites', 'Other', 'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming', 'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services', 'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Creative', 'Social'])
  ) THEN
    INSERT INTO user_categories (user_id, name) VALUES (NEW.user_id, NEW.category);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_subscription_categories()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add category association if it's not a default category
    IF NEW.category NOT IN ('All', 'Favorites', 'Other', 'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming', 'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services', 'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Creative', 'Social') THEN
      INSERT INTO subscription_categories (user_id, subscription_id, category_name)
      VALUES (NEW.user_id, NEW.id, NEW.category);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove old category association if it was custom
    IF OLD.category NOT IN ('All', 'Favorites', 'Other', 'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming', 'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services', 'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Creative', 'Social') THEN
      DELETE FROM subscription_categories 
      WHERE subscription_id = OLD.id 
      AND category_name = OLD.category;
    END IF;
    -- Add new category association if it's not a default category
    IF NEW.category NOT IN ('All', 'Favorites', 'Other', 'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming', 'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services', 'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Creative', 'Social') THEN
      INSERT INTO subscription_categories (user_id, subscription_id, category_name)
      VALUES (NEW.user_id, NEW.id, NEW.category)
      ON CONFLICT (subscription_id, category_name) DO NOTHING;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove category association if it was custom
    IF OLD.category NOT IN ('All', 'Favorites', 'Other', 'AI Chat', 'Coding', 'Diffusion', 'Streaming', 'Music', 'Gaming', 'Productivity', 'Audio Generation', 'Video Generation', 'Cloud Services', 'Fitness', 'Health', 'Food', 'Transport', 'Financial', 'Creative', 'Social') THEN
      DELETE FROM subscription_categories 
      WHERE subscription_id = OLD.id 
      AND category_name = OLD.category;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_subscription_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.monthly_cost != OLD.monthly_cost) THEN
    INSERT INTO subscription_price_history (
      subscription_id,
      user_id,
      monthly_cost,
      effective_from
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.monthly_cost,
      NEW.start_date
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_user_id_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_unused_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete category if no other subscriptions use it
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE category = OLD.category 
    AND user_id = OLD.user_id 
    AND id != OLD.id
  ) THEN
    DELETE FROM user_categories 
    WHERE name = OLD.category 
    AND user_id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_currency_preferences_updated_at
  BEFORE UPDATE ON currency_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_layouts_updated_at
  BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER validate_category
  BEFORE INSERT ON user_categories
  FOR EACH ROW
  EXECUTE FUNCTION validate_category();

CREATE TRIGGER validate_category_changes_trigger
  BEFORE DELETE ON user_categories
  FOR EACH ROW
  EXECUTE FUNCTION validate_category_changes();

CREATE TRIGGER validate_subscription_category
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_subscription_category();

CREATE TRIGGER sync_subscription_categories_insert
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_categories();

CREATE TRIGGER sync_subscription_categories_update
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_categories();

CREATE TRIGGER sync_subscription_categories_delete
  AFTER DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_categories();

CREATE TRIGGER subscription_price_change_trigger
  AFTER INSERT OR UPDATE OF monthly_cost ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_price_change();

CREATE TRIGGER ensure_user_id_not_modified
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_user_id_update();

CREATE TRIGGER cleanup_unused_categories
  AFTER DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_unused_categories();