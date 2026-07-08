-- ========================================================
-- MIGRATION: Add tags column to expenses
-- Run this in the Supabase SQL Editor
-- ========================================================

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tags TEXT;
