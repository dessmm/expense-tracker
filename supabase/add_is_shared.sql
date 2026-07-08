-- Phase 5: Add is_shared (reimbursable) flag to expenses
-- Run this in your Supabase SQL editor.

-- 1. Add the column with a default of false so existing rows aren't affected
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false;

-- 2. No RLS changes needed — is_shared is just another column on the same
--    table, and all existing policies (scoped to auth.uid() = user_id) already cover it.
