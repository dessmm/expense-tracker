-- ========================================================
-- MIGRATION: Add category budgets table
-- Run this in the Supabase SQL Editor
-- ========================================================

CREATE TABLE IF NOT EXISTS category_budgets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category     TEXT NOT NULL,
  monthly_cap  NUMERIC(12, 2) NOT NULL CHECK (monthly_cap > 0),
  month        TEXT NOT NULL, -- format: 'YYYY-MM'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One budget cap per category per month per user
  UNIQUE(user_id, category, month)
);

-- Enable Row Level Security
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own category budgets"
  ON category_budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own category budgets"
  ON category_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own category budgets"
  ON category_budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own category budgets"
  ON category_budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_category_budgets_user_month ON category_budgets(user_id, month);
