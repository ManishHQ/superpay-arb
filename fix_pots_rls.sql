-- Fix RLS policies for pots tables to allow wallet-based auth
-- Run this SQL directly in your Supabase SQL editor

-- Option 1: Disable RLS entirely (simplest solution)
ALTER TABLE user_pots DISABLE ROW LEVEL SECURITY;
ALTER TABLE pot_activities DISABLE ROW LEVEL SECURITY;

-- Option 2: If you prefer to keep RLS enabled but allow all operations
-- (uncomment the lines below and comment out the lines above)

-- DROP POLICY IF EXISTS "Users can view their own pots" ON user_pots;
-- DROP POLICY IF EXISTS "Users can insert their own pots" ON user_pots;
-- DROP POLICY IF EXISTS "Users can update their own pots" ON user_pots;
-- DROP POLICY IF EXISTS "Users can delete their own pots" ON user_pots;

-- CREATE POLICY "Allow all operations on user_pots" ON user_pots
--     FOR ALL USING (true) WITH CHECK (true);

-- DROP POLICY IF EXISTS "Users can view activities for their own pots" ON pot_activities;
-- DROP POLICY IF EXISTS "Users can insert activities for their own pots" ON pot_activities;
-- DROP POLICY IF EXISTS "Users can update activities for their own pots" ON pot_activities;

-- CREATE POLICY "Allow all operations on pot_activities" ON pot_activities
--     FOR ALL USING (true) WITH CHECK (true);