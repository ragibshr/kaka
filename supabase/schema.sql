-- ============================================================================
-- KAKA - Supabase Database Schema
-- File: supabase/schema.sql
-- Description: Complete idempotent schema for KAKA Life Organizer AI Companion
-- ============================================================================
--
-- HOW TO RUN IN SUPABASE SQL EDITOR:
-- ----------------------------------------------------------------------------
-- 1. Log in to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your KAKA project.
-- 3. In the left-hand navigation menu, click on "SQL Editor".
-- 4. Click the "+ New Query" button in the upper toolbar.
-- 5. Copy and paste the entire contents of this file into the SQL Editor.
-- 6. Click the green "Run" button (or press Ctrl + Enter / Cmd + Enter).
-- 7. Confirm the query executes successfully ("Success. No rows returned").
-- 8. Navigate to the "Table Editor" tab to verify all 14 tables, RLS policies,
--    indexes, and triggers are created and active.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. MESSAGES TABLE
-- Conversation history between the user and KAKA assistant
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    conversation_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    input_mode TEXT NOT NULL DEFAULT 'text' CHECK (input_mode IN ('text', 'voice')),
    provider TEXT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_policy" ON messages;
CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
CREATE POLICY "messages_insert_policy" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_update_policy" ON messages;
CREATE POLICY "messages_update_policy" ON messages
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_delete_policy" ON messages;
CREATE POLICY "messages_delete_policy" ON messages
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_messages_updated_at ON messages;
CREATE TRIGGER trg_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. ENTRIES TABLE
-- Central hub for all parsed life logs & captured records
-- ============================================================================
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    category TEXT NOT NULL CHECK (category IN ('work', 'food', 'finance', 'debt', 'health', 'social', 'career', 'note')),
    raw_text TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_message_id UUID NULL REFERENCES messages(id) ON DELETE SET NULL,
    confidence NUMERIC DEFAULT 1.0,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'discarded')),
    detail_table TEXT NULL,
    detail_id UUID NULL
);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entries_select_policy" ON entries;
CREATE POLICY "entries_select_policy" ON entries
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_insert_policy" ON entries;
CREATE POLICY "entries_insert_policy" ON entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_update_policy" ON entries;
CREATE POLICY "entries_update_policy" ON entries
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_delete_policy" ON entries;
CREATE POLICY "entries_delete_policy" ON entries
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_entries_updated_at ON entries;
CREATE TRIGGER trg_entries_updated_at
    BEFORE UPDATE ON entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. WORK_LOGS TABLE
-- Work hours, punch in/out, and shift logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    entry_id UUID NULL REFERENCES entries(id) ON DELETE CASCADE,
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    punch_in TIME NULL,
    punch_out TIME NULL,
    hours NUMERIC NULL,
    notes TEXT NULL
);

ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_logs_select_policy" ON work_logs;
CREATE POLICY "work_logs_select_policy" ON work_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "work_logs_insert_policy" ON work_logs;
CREATE POLICY "work_logs_insert_policy" ON work_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "work_logs_update_policy" ON work_logs;
CREATE POLICY "work_logs_update_policy" ON work_logs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "work_logs_delete_policy" ON work_logs;
CREATE POLICY "work_logs_delete_policy" ON work_logs
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_work_logs_updated_at ON work_logs;
CREATE TRIGGER trg_work_logs_updated_at
    BEFORE UPDATE ON work_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. FOOD_LOGS TABLE
-- Meals, food consumption, and dining expenses
-- ============================================================================
CREATE TABLE IF NOT EXISTS food_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    entry_id UUID NULL REFERENCES entries(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
    description TEXT NOT NULL,
    cost NUMERIC NULL,
    currency TEXT NOT NULL DEFAULT 'AED'
);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_logs_select_policy" ON food_logs;
CREATE POLICY "food_logs_select_policy" ON food_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "food_logs_insert_policy" ON food_logs;
CREATE POLICY "food_logs_insert_policy" ON food_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "food_logs_update_policy" ON food_logs;
CREATE POLICY "food_logs_update_policy" ON food_logs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "food_logs_delete_policy" ON food_logs;
CREATE POLICY "food_logs_delete_policy" ON food_logs
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_food_logs_updated_at ON food_logs;
CREATE TRIGGER trg_food_logs_updated_at
    BEFORE UPDATE ON food_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. FINANCE_LOGS TABLE
-- Expenses, incomes, transfers, and general financial tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS finance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    entry_id UUID NULL REFERENCES entries(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AED',
    counterparty TEXT NULL,
    note TEXT NULL,
    tag TEXT NULL
);

ALTER TABLE finance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_logs_select_policy" ON finance_logs;
CREATE POLICY "finance_logs_select_policy" ON finance_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "finance_logs_insert_policy" ON finance_logs;
CREATE POLICY "finance_logs_insert_policy" ON finance_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "finance_logs_update_policy" ON finance_logs;
CREATE POLICY "finance_logs_update_policy" ON finance_logs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "finance_logs_delete_policy" ON finance_logs;
CREATE POLICY "finance_logs_delete_policy" ON finance_logs
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_finance_logs_updated_at ON finance_logs;
CREATE TRIGGER trg_finance_logs_updated_at
    BEFORE UPDATE ON finance_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. DEBTS TABLE
-- Money lent or borrowed with counterparty and settlement tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    entry_id UUID NULL REFERENCES entries(id) ON DELETE CASCADE,
    counterparty TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('lent', 'borrowed')),
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AED',
    due_date DATE NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled')),
    note TEXT NULL
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "debts_select_policy" ON debts;
CREATE POLICY "debts_select_policy" ON debts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "debts_insert_policy" ON debts;
CREATE POLICY "debts_insert_policy" ON debts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "debts_update_policy" ON debts;
CREATE POLICY "debts_update_policy" ON debts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "debts_delete_policy" ON debts;
CREATE POLICY "debts_delete_policy" ON debts
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_debts_updated_at ON debts;
CREATE TRIGGER trg_debts_updated_at
    BEFORE UPDATE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. DEBT_SETTLEMENTS TABLE
-- Partial or full payments against registered debts
-- ============================================================================
CREATE TABLE IF NOT EXISTS debt_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    settled_on DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT NULL
);

ALTER TABLE debt_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "debt_settlements_select_policy" ON debt_settlements;
CREATE POLICY "debt_settlements_select_policy" ON debt_settlements
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "debt_settlements_insert_policy" ON debt_settlements;
CREATE POLICY "debt_settlements_insert_policy" ON debt_settlements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "debt_settlements_update_policy" ON debt_settlements;
CREATE POLICY "debt_settlements_update_policy" ON debt_settlements
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "debt_settlements_delete_policy" ON debt_settlements;
CREATE POLICY "debt_settlements_delete_policy" ON debt_settlements
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_debt_settlements_updated_at ON debt_settlements;
CREATE TRIGGER trg_debt_settlements_updated_at
    BEFORE UPDATE ON debt_settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. HEALTH_LOGS TABLE
-- Sleep, water intake, workouts, mood, and symptoms
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    entry_id UUID NULL REFERENCES entries(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('sleep', 'drink', 'exercise', 'mood', 'symptom', 'other')),
    value TEXT NOT NULL,
    numeric_value NUMERIC NULL,
    notes TEXT NULL
);

ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "health_logs_select_policy" ON health_logs;
CREATE POLICY "health_logs_select_policy" ON health_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "health_logs_insert_policy" ON health_logs;
CREATE POLICY "health_logs_insert_policy" ON health_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "health_logs_update_policy" ON health_logs;
CREATE POLICY "health_logs_update_policy" ON health_logs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "health_logs_delete_policy" ON health_logs;
CREATE POLICY "health_logs_delete_policy" ON health_logs
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_health_logs_updated_at ON health_logs;
CREATE TRIGGER trg_health_logs_updated_at
    BEFORE UPDATE ON health_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. SOCIAL_LOGS TABLE
-- Social interactions, calls, visits, and connection log
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    entry_id UUID NULL REFERENCES entries(id) ON DELETE CASCADE,
    person TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('call', 'visit', 'message', 'other')),
    duration_min INT NULL,
    notes TEXT NULL
);

ALTER TABLE social_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_logs_select_policy" ON social_logs;
CREATE POLICY "social_logs_select_policy" ON social_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "social_logs_insert_policy" ON social_logs;
CREATE POLICY "social_logs_insert_policy" ON social_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "social_logs_update_policy" ON social_logs;
CREATE POLICY "social_logs_update_policy" ON social_logs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "social_logs_delete_policy" ON social_logs;
CREATE POLICY "social_logs_delete_policy" ON social_logs
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_social_logs_updated_at ON social_logs;
CREATE TRIGGER trg_social_logs_updated_at
    BEFORE UPDATE ON social_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. CAREER_LOGS TABLE
-- Job applications, leads, interviews, professional skills
-- ============================================================================
CREATE TABLE IF NOT EXISTS career_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    entry_id UUID NULL REFERENCES entries(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('application', 'lead', 'interview', 'skill', 'other')),
    title TEXT NOT NULL,
    org TEXT NULL,
    status TEXT NULL,
    notes TEXT NULL
);

ALTER TABLE career_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_logs_select_policy" ON career_logs;
CREATE POLICY "career_logs_select_policy" ON career_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "career_logs_insert_policy" ON career_logs;
CREATE POLICY "career_logs_insert_policy" ON career_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "career_logs_update_policy" ON career_logs;
CREATE POLICY "career_logs_update_policy" ON career_logs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "career_logs_delete_policy" ON career_logs;
CREATE POLICY "career_logs_delete_policy" ON career_logs
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_career_logs_updated_at ON career_logs;
CREATE TRIGGER trg_career_logs_updated_at
    BEFORE UPDATE ON career_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. MEMORIES TABLE
-- Long-term AI memory layer (core, episodic, behavioral patterns)
-- ============================================================================
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    layer TEXT NOT NULL CHECK (layer IN ('core', 'episodic', 'pattern')),
    content TEXT NOT NULL,
    importance INT NOT NULL DEFAULT 3 CHECK (importance >= 1 AND importance <= 5),
    pinned BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected')),
    source_entry_ids UUID[] NOT NULL DEFAULT '{}'::uuid[]
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memories_select_policy" ON memories;
CREATE POLICY "memories_select_policy" ON memories
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "memories_insert_policy" ON memories;
CREATE POLICY "memories_insert_policy" ON memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "memories_update_policy" ON memories;
CREATE POLICY "memories_update_policy" ON memories
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "memories_delete_policy" ON memories;
CREATE POLICY "memories_delete_policy" ON memories
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_memories_updated_at ON memories;
CREATE TRIGGER trg_memories_updated_at
    BEFORE UPDATE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. INSIGHTS TABLE
-- Weekly and monthly periodic summaries & analytics data
-- ============================================================================
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    period TEXT NOT NULL CHECK (period IN ('week', 'month')),
    period_start DATE NOT NULL,
    content TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insights_select_policy" ON insights;
CREATE POLICY "insights_select_policy" ON insights
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insights_insert_policy" ON insights;
CREATE POLICY "insights_insert_policy" ON insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insights_update_policy" ON insights;
CREATE POLICY "insights_update_policy" ON insights
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insights_delete_policy" ON insights;
CREATE POLICY "insights_delete_policy" ON insights
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_insights_updated_at ON insights;
CREATE TRIGGER trg_insights_updated_at
    BEFORE UPDATE ON insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. ENTRY_HISTORY TABLE
-- Audit log and history of modifications, deletions, and restorations
-- ============================================================================
CREATE TABLE IF NOT EXISTS entry_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    entry_id UUID NULL REFERENCES entries(id) ON DELETE SET NULL,
    table_name TEXT NOT NULL,
    row_id UUID NOT NULL,
    old_value JSONB NULL,
    new_value JSONB NULL,
    action TEXT NOT NULL CHECK (action IN ('edit', 'delete', 'restore')),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE entry_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entry_history_select_policy" ON entry_history;
CREATE POLICY "entry_history_select_policy" ON entry_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entry_history_insert_policy" ON entry_history;
CREATE POLICY "entry_history_insert_policy" ON entry_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entry_history_update_policy" ON entry_history;
CREATE POLICY "entry_history_update_policy" ON entry_history
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entry_history_delete_policy" ON entry_history;
CREATE POLICY "entry_history_delete_policy" ON entry_history
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_entry_history_updated_at ON entry_history;
CREATE TRIGGER trg_entry_history_updated_at
    BEFORE UPDATE ON entry_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. API_LOG TABLE
-- Observability and latency metrics for external AI / API calls
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    provider TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    status INT NULL,
    latency_ms INT NULL,
    error TEXT NULL
);

ALTER TABLE api_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_log_select_policy" ON api_log;
CREATE POLICY "api_log_select_policy" ON api_log
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "api_log_insert_policy" ON api_log;
CREATE POLICY "api_log_insert_policy" ON api_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "api_log_update_policy" ON api_log;
CREATE POLICY "api_log_update_policy" ON api_log
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "api_log_delete_policy" ON api_log;
CREATE POLICY "api_log_delete_policy" ON api_log
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_api_log_updated_at ON api_log;
CREATE TRIGGER trg_api_log_updated_at
    BEFORE UPDATE ON api_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES
-- Optimized for user isolation queries, category filters, and full-text search
-- ============================================================================

-- Required composite indexes
CREATE INDEX IF NOT EXISTS idx_entries_user_occurred_at
    ON entries(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_entries_user_category
    ON entries(user_id, category);

CREATE INDEX IF NOT EXISTS idx_memories_user_layer
    ON memories(user_id, layer);

-- Full-text search index on entries.raw_text
CREATE INDEX IF NOT EXISTS idx_entries_raw_text_fts
    ON entries USING gin (to_tsvector('simple', raw_text));

-- Performance indexes on foreign keys & common filter columns
CREATE INDEX IF NOT EXISTS idx_messages_user_conversation
    ON messages(user_id, conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_entries_source_message
    ON entries(source_message_id);

CREATE INDEX IF NOT EXISTS idx_work_logs_user_date
    ON work_logs(user_id, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_work_logs_entry_id
    ON work_logs(entry_id);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_created
    ON food_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_logs_entry_id
    ON food_logs(entry_id);

CREATE INDEX IF NOT EXISTS idx_finance_logs_user_created
    ON finance_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_logs_entry_id
    ON finance_logs(entry_id);

CREATE INDEX IF NOT EXISTS idx_debts_user_status
    ON debts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_debts_entry_id
    ON debts(entry_id);

CREATE INDEX IF NOT EXISTS idx_debt_settlements_debt_id
    ON debt_settlements(debt_id);

CREATE INDEX IF NOT EXISTS idx_health_logs_user_kind
    ON health_logs(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_health_logs_entry_id
    ON health_logs(entry_id);

CREATE INDEX IF NOT EXISTS idx_social_logs_user_person
    ON social_logs(user_id, person);
CREATE INDEX IF NOT EXISTS idx_social_logs_entry_id
    ON social_logs(entry_id);

CREATE INDEX IF NOT EXISTS idx_career_logs_user_kind
    ON career_logs(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_career_logs_entry_id
    ON career_logs(entry_id);

CREATE INDEX IF NOT EXISTS idx_insights_user_period
    ON insights(user_id, period, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_entry_history_entry_id
    ON entry_history(entry_id);

CREATE INDEX IF NOT EXISTS idx_api_log_user_created
    ON api_log(user_id, created_at DESC);

-- ============================================================================
-- RLS VERIFICATION QUERIES (COMMENTED OUT)
-- ============================================================================
/*
-- 1. Check whether RLS is enabled for all 14 tables in the public schema:
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Inspect all RLS policies created across the tables:
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Simulate multi-tenant isolation in Supabase SQL Editor:
-- User A context
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111"}';

INSERT INTO public.messages (conversation_id, role, content, input_mode)
VALUES (gen_random_uuid(), 'user', 'Test query from User A', 'text');

-- Should return 1 row for User A
SELECT id, role, content, user_id FROM public.messages;

-- Switch to User B context
SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222"}';

-- Should return 0 rows for User B (isolated)
SELECT id, role, content, user_id FROM public.messages;

-- Clean up session
RESET ROLE;
RESET "request.jwt.claims";
*/
