-- Fix RLS policies for pots tables
-- This app uses wallet-based auth via Dynamic.xyz, not Supabase auth
-- Security is handled at the application level

-- Disable RLS for user_pots table since we use application-level security
ALTER TABLE user_pots DISABLE ROW LEVEL SECURITY;

-- Disable RLS for pot_activities table since we use application-level security  
ALTER TABLE pot_activities DISABLE ROW LEVEL SECURITY;