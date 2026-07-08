-- Phase 3: Add priority ordering to savings_goals
-- Run this in your Supabase SQL editor.

-- 1. Add the priority column (nullable, will be back-filled below)
ALTER TABLE savings_goals
  ADD COLUMN IF NOT EXISTS priority INTEGER;

-- 2. Back-fill existing rows: assign priority based on created_at DESC
--    (most recently created goal gets priority 1 = highest)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM savings_goals
)
UPDATE savings_goals
SET priority = ranked.rn
FROM ranked
WHERE savings_goals.id = ranked.id
  AND savings_goals.priority IS NULL;

-- 3. Make the column NOT NULL with a sensible default for future inserts
ALTER TABLE savings_goals
  ALTER COLUMN priority SET DEFAULT 1;

-- No RLS changes needed — priority is just another column on the same table
-- and all existing SELECT/INSERT/UPDATE/DELETE policies already cover it.
