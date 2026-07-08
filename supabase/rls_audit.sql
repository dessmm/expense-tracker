-- RLS Audit query to verify policies on all tables
-- Run this in the Supabase SQL Editor to check current active policies

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename, 
    cmd;
