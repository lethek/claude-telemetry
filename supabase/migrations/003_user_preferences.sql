-- 003_user_preferences.sql
-- User preferences stored in Supabase instead of localStorage

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    plan_cost NUMERIC,
    plan_name TEXT DEFAULT 'none',
    project_budgets JSONB DEFAULT '{}',
    alert_thresholds JSONB DEFAULT '{"daily": 20, "weekly": 100}',
    week_start_day TEXT DEFAULT 'monday',
    theme TEXT DEFAULT 'dark',
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own preferences" ON user_preferences
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own preferences" ON user_preferences
    FOR UPDATE USING (user_id = auth.uid());
