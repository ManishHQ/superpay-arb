-- Fix RLS policies for Dynamic.xyz authentication
-- Since we're not using Supabase Auth, we need different policies

-- First, drop the existing policies that rely on auth.uid()
DROP POLICY IF EXISTS "Users can view public profile information" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create new policies that work with Dynamic.xyz authentication
-- Allow anyone to read public profile information (needed for user search)
CREATE POLICY "Allow public read access" ON user_profiles
    FOR SELECT USING (is_active = TRUE);

-- Allow anyone to insert profiles (for onboarding new users)
CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update profiles (you might want to make this more restrictive later)
CREATE POLICY "Allow profile updates" ON user_profiles
    FOR UPDATE USING (true) WITH CHECK (true);

-- Similarly, update transaction policies if needed
-- (These might work as-is since they reference user_profile IDs, not auth.uid())

-- Optional: If you want to be more restrictive later, you can create policies based on 
-- wallet_address or other Dynamic.xyz identifiers once you have a way to validate them