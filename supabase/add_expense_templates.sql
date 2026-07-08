-- ========================================================
-- MIGRATION: Add expense templates table
-- Run this in the Supabase SQL Editor
-- ========================================================

CREATE TABLE IF NOT EXISTS expense_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  amount     NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE expense_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own expense templates"
  ON expense_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expense templates"
  ON expense_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expense templates"
  ON expense_templates FOR DELETE
  USING (auth.uid() = user_id);
