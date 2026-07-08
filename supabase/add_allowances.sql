-- ========================================================
-- MIGRATION: Add allowances table for weekly allowance feature
-- Run this in the Supabase SQL Editor
-- ========================================================

CREATE TABLE IF NOT EXISTS allowances (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  week_start  DATE NOT NULL,  -- always the Monday of the week (PHT)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One allowance per user per week
  UNIQUE(user_id, week_start)
);

-- ── Row Level Security ──────────────────────────────────
ALTER TABLE allowances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allowances"
  ON allowances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allowances"
  ON allowances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allowances"
  ON allowances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own allowances"
  ON allowances FOR DELETE
  USING (auth.uid() = user_id);

-- ── Index ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_allowances_user_week
  ON allowances(user_id, week_start);
