-- ========================================================
-- MIGRATION: Add recurring bills and bill savings tables
-- Run this in the Supabase SQL Editor
-- ========================================================

CREATE TABLE IF NOT EXISTS recurring_bills (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_day     INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bill_savings_progress (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id       UUID NOT NULL REFERENCES recurring_bills(id) ON DELETE CASCADE,
  month         TEXT NOT NULL, -- format: 'YYYY-MM'
  amount_saved  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_saved >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One progress row per bill per month per user
  UNIQUE(user_id, bill_id, month)
);

-- ── Row Level Security ──────────────────────────────────
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_savings_progress ENABLE ROW LEVEL SECURITY;

-- recurring_bills policies
CREATE POLICY "Users can view own bills"
  ON recurring_bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills"
  ON recurring_bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills"
  ON recurring_bills FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills"
  ON recurring_bills FOR DELETE
  USING (auth.uid() = user_id);

-- bill_savings_progress policies
CREATE POLICY "Users can view own savings progress"
  ON bill_savings_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings progress"
  ON bill_savings_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings progress"
  ON bill_savings_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings progress"
  ON bill_savings_progress FOR DELETE
  USING (auth.uid() = user_id);

-- ── Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bills_user ON recurring_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_user_month ON bill_savings_progress(user_id, month);
